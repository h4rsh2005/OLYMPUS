import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Realistic Volumetric Flame Shader with Curl-Noise Turbulence & Heat Gradient
const flameVertexShader = `
  uniform float uTime;
  uniform float uFlameHeight;
  uniform float uTurbulence;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  // Pseudo-random & simplex-like 3D noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vNormal = normal;
    vec3 pos = position;

    // Height ratio from 0.0 (base) to 1.0 (flame tip)
    float h = clamp(pos.y / uFlameHeight, 0.0, 1.0);

    // Multi-octave upward flowing turbulence
    vec3 noiseCoord = vec3(pos.x * 1.8, pos.y * 1.2 - uTime * 3.4, pos.z * 1.8);
    float n1 = snoise(noiseCoord);
    float n2 = snoise(noiseCoord * 2.2 + vec3(0.0, uTime * 1.2, 0.0)) * 0.5;
    float turb = (n1 + n2) * uTurbulence;

    // Flame tapers at top and whips dynamically with wind & heat drafts
    float taper = sin(h * 3.14159 * 0.5);
    float displacement = turb * taper * (0.35 + h * 0.85);

    // Wind drift & dancing lick
    pos.x += displacement * 0.8 + sin(uTime * 4.0 + h * 3.0) * (0.08 * h);
    pos.z += displacement * 0.6 + cos(uTime * 3.5 + h * 3.0) * (0.08 * h);
    pos.y += turb * 0.15 * h;

    vDisplacement = displacement;
    vPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
  }
`;

const flameFragmentShader = `
  uniform float uTime;
  uniform vec3 uColorCore;
  uniform vec3 uColorBody;
  uniform vec3 uColorEdge;
  uniform vec3 uColorTip;
  uniform float uOpacity;
  uniform float uFlameHeight;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  void main() {
    float h = clamp(vUv.y, 0.0, 1.0);

    // Dynamic upward flame erosion/tongue carving
    float tongue = sin(vUv.x * 24.0 + uTime * 7.0 + vDisplacement * 4.0) * 0.5 + 0.5;
    float tongue2 = cos(vUv.x * 14.0 - uTime * 5.0) * 0.5 + 0.5;
    float flamePattern = tongue * 0.6 + tongue2 * 0.4;

    // Radial & vertical heat falloff (hot core to cool licking edges)
    vec3 flameColor;
    float alpha = 1.0;

    if (h < 0.22) {
      // Hot blue-white/yellow incandescent base
      flameColor = mix(uColorCore, uColorBody, h / 0.22);
      alpha = 0.95;
    } else if (h < 0.65) {
      // Roaring golden-orange body
      float t = (h - 0.22) / 0.43;
      flameColor = mix(uColorBody, uColorEdge, t);
      alpha = 0.9 - t * 0.2;
    } else {
      // Licking crimson-orange tips dissipating into smoky wisps
      float t = (h - 0.65) / 0.35;
      flameColor = mix(uColorEdge, uColorTip, t);
      alpha = (1.0 - t) * (0.7 + flamePattern * 0.3);
    }

    // Edge falloff for soft, volumetric flame licking
    float edge = abs(vUv.x - 0.5) * 2.0;
    float rimFalloff = smoothstep(1.0, 0.2, edge);
    alpha *= rimFalloff;

    // Discard completely transparent fragments
    if (alpha < 0.05) discard;

    // Add extra incandescent core bloom
    flameColor += vec3(0.2, 0.15, 0.05) * (1.0 - h);

    gl_FragColor = vec4(flameColor, alpha * uOpacity);
  }
`;

/**
 * Creates an organic flame mesh geometry (teardrop profile that pinches and flares naturally)
 */
function createFlameGeometry(radius = 0.85, height = 2.4, segments = 32) {
  const points = [];
  const count = 28;
  for (let i = 0; i <= count; i++) {
    const t = i / count; // 0 to 1
    const y = t * height;
    // Teardrop profile: bulbous at 25% height, pinched at base and sharp at tip
    let r = 0;
    if (t < 0.25) {
      r = Math.sin((t / 0.25) * Math.PI * 0.5) * radius;
    } else {
      r = Math.cos(((t - 0.25) / 0.75) * Math.PI * 0.5) * radius;
      // Slight waist pinch for realistic flame silhouette
      r *= Math.pow(1.0 - t, 0.45);
    }
    points.push(new THREE.Vector2(Math.max(0.01, r), y));
  }
  const geo = new THREE.LatheGeometry(points, segments);
  geo.computeVertexNormals();
  return geo;
}

/**
 * PrometheanFlame: Realistic, living, volumetric sacred fire
 * Features:
 * - Dynamic dual-layer flame geometry with curl-noise vertex displacement
 * - Physical heat gradient: incandescent white-hot core -> golden body -> crimson tongues
 * - Rising glowing embers & spark particle system
 * - Pulsing hot charcoal bed
 * - Realistic organic chaotic light flicker (flickers color & intensity)
 */
export default function PrometheanFlame({
  position = [0, 0, 0],
  scale = 1.0,
  flameHeight = 2.4,
  flameRadius = 0.85,
  intensity = 1.0,
  lightColor = "#F59E0B",
  lightIntensity = 42,
  lightDistance = 28,
  emberCount = 32,
  showCoals = true
}) {
  const coreRef = useRef(null);
  const mantleRef = useRef(null);
  const lightRef = useRef(null);
  const embersRef = useRef(null);
  const coalsRef = useRef(null);

  // Generate flame geometries
  const { coreGeo, mantleGeo } = useMemo(() => {
    return {
      coreGeo: createFlameGeometry(flameRadius * 0.65, flameHeight * 0.75, 24),
      mantleGeo: createFlameGeometry(flameRadius, flameHeight, 32)
    };
  }, [flameRadius, flameHeight]);

  // Core Flame Uniforms (Hot incandescent white/gold)
  const coreUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uFlameHeight: { value: flameHeight * 0.75 },
    uTurbulence: { value: 0.35 },
    uColorCore: { value: new THREE.Color('#FFFFFF') },
    uColorBody: { value: new THREE.Color('#FEF08A') },
    uColorEdge: { value: new THREE.Color('#F59E0B') },
    uColorTip: { value: new THREE.Color('#EA580C') },
    uOpacity: { value: 0.95 }
  }), [flameHeight]);

  // Mantle Flame Uniforms (Licking orange/amber/crimson tongues)
  const mantleUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uFlameHeight: { value: flameHeight },
    uTurbulence: { value: 0.65 },
    uColorCore: { value: new THREE.Color('#FEF08A') },
    uColorBody: { value: new THREE.Color('#F97316') },
    uColorEdge: { value: new THREE.Color('#DC2626') },
    uColorTip: { value: new THREE.Color('#7F1D1D') },
    uOpacity: { value: 0.85 }
  }), [flameHeight]);

  // Rising embers particles data
  const { emberPositions, emberSpeeds, emberPhases } = useMemo(() => {
    const pos = new Float32Array(emberCount * 3);
    const speeds = new Float32Array(emberCount);
    const phases = new Float32Array(emberCount);

    for (let i = 0; i < emberCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * (flameRadius * 0.6);
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.random() * (flameHeight * 1.4);
      pos[i * 3 + 2] = Math.sin(angle) * r;

      speeds[i] = 1.2 + Math.random() * 2.2;
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { emberPositions: pos, emberSpeeds: speeds, emberPhases: phases };
  }, [emberCount, flameRadius, flameHeight]);

  // Coals geometry
  const coalsGeo = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(flameRadius * 0.85, 1);
    // Flatten into a bowl mound
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, pos.getY(i) * 0.45);
    }
    geo.computeVertexNormals();
    return geo;
  }, [flameRadius]);

  // Animation frame loop
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    // 1. Update shader time
    if (coreRef.current && coreRef.current.material) {
      coreRef.current.material.uniforms.uTime.value = t;
      coreRef.current.rotation.y = t * 0.8;
    }
    if (mantleRef.current && mantleRef.current.material) {
      mantleRef.current.material.uniforms.uTime.value = t;
      mantleRef.current.rotation.y = -t * 1.2;
      // Organic flame scale breathing
      const breath = 1.0 + Math.sin(t * 8.0) * 0.06 + Math.cos(t * 15.0) * 0.04;
      mantleRef.current.scale.set(breath, breath * (1.0 + Math.sin(t * 11.0) * 0.08), breath);
    }

    // 2. Animate rising glowing embers
    if (embersRef.current) {
      const positions = embersRef.current.geometry.attributes.position.array;
      const maxH = flameHeight * 1.8;

      for (let i = 0; i < emberCount; i++) {
        const idx = i * 3;
        // Move upward
        positions[idx + 1] += emberSpeeds[i] * delta;
        // Perlin-like horizontal drift
        positions[idx] += Math.sin(t * 3.0 + emberPhases[i]) * 0.015;
        positions[idx + 2] += Math.cos(t * 2.5 + emberPhases[i]) * 0.015;

        // Reset if reached ceiling
        if (positions[idx + 1] > maxH) {
          positions[idx + 1] = 0.1 + Math.random() * 0.2;
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * (flameRadius * 0.5);
          positions[idx] = Math.cos(angle) * r;
          positions[idx + 2] = Math.sin(angle) * r;
        }
      }
      embersRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Realistic dynamic flame light flicker (multi-harmonic Perlin-like chaos)
    if (lightRef.current) {
      const flicker1 = Math.sin(t * 12.0) * 0.12;
      const flicker2 = Math.cos(t * 23.0) * 0.09;
      const flicker3 = Math.sin(t * 41.0) * 0.06;
      const gust = Math.pow(Math.sin(t * 1.5) * 0.5 + 0.5, 3.0) * 0.18;
      const currentIntensity = lightIntensity * intensity * (1.0 + flicker1 + flicker2 + flicker3 + gust);
      lightRef.current.intensity = Math.max(lightIntensity * 0.4, currentIntensity);

      // Subtle light center dancing
      lightRef.current.position.x = Math.sin(t * 9.0) * 0.06;
      lightRef.current.position.z = Math.cos(t * 7.5) * 0.06;
      lightRef.current.position.y = flameHeight * 0.5 + Math.sin(t * 14.0) * 0.04;
    }

    // 4. Coals breathing heat glow
    if (coalsRef.current && coalsRef.current.material) {
      const heatPulse = 0.65 + Math.sin(t * 4.0) * 0.2 + Math.cos(t * 9.0) * 0.15;
      coalsRef.current.material.emissiveIntensity = heatPulse;
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* 1. Hot Glowing Charcoal Bed */}
      {showCoals && (
        <mesh ref={coalsRef} position={[0, 0.15, 0]} geometry={coalsGeo}>
          <meshStandardMaterial
            color="#1C1917"
            emissive="#EA580C"
            emissiveIntensity={0.8}
            roughness={0.92}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* 2. Inner White-Hot Incandescent Core Flame */}
      <mesh ref={coreRef} geometry={coreGeo} position={[0, 0.1, 0]}>
        <shaderMaterial
          vertexShader={flameVertexShader}
          fragmentShader={flameFragmentShader}
          uniforms={coreUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Outer Licking Orange/Crimson Flame Mantle */}
      <mesh ref={mantleRef} geometry={mantleGeo} position={[0, 0.05, 0]}>
        <shaderMaterial
          vertexShader={flameVertexShader}
          fragmentShader={flameFragmentShader}
          uniforms={mantleUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4. Rising Golden Embers & Sparks */}
      <points ref={embersRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[emberPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.14 * scale}
          color="#FEF08A"
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* 5. Dynamic Warm Light Casting Living Flame Glow */}
      <pointLight
        ref={lightRef}
        position={[0, flameHeight * 0.5, 0]}
        color={lightColor}
        intensity={lightIntensity * intensity}
        distance={lightDistance}
        decay={2}
        castShadow
        shadow-bias={-0.001}
      />
    </group>
  );
}
