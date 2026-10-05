import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';
import { createWaterNormalTexture } from '../../utils/proceduralTextures';

// Multi-Scale Non-Repeating Aegean Sea GLSL Shaders
// 4-Octave Gerstner Waves with non-periodic frequencies, terrain diffraction,
// Subsurface Scattering (SSS), Voronoi Caustics, and Seamless Horizon Dissolution.
const oceanVertexShader = `
  uniform float uTime;
  uniform float uWaveSpeed;
  uniform float uWaveHeight;
  uniform vec2 uMountainPos;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vElevation;
  varying float vCrest;

  // Gerstner Wave Component Structure
  vec3 gerstnerWave(vec2 p, vec2 dir, float a, float f, float s, float q, inout vec3 tangent, inout vec3 binormal, float time) {
    float phase = dot(dir, p) * f + time * s;
    float cosP = cos(phase);
    float sinP = sin(phase);

    float WA = f * a;
    tangent += vec3(
      -dir.x * dir.x * (q * WA) * sinP,
      -dir.x * dir.y * (q * WA) * sinP,
      dir.x * WA * cosP
    );
    binormal += vec3(
      -dir.x * dir.y * (q * WA) * sinP,
      -dir.y * dir.y * (q * WA) * sinP,
      dir.y * WA * cosP
    );

    return vec3(
      -q * a * dir.x * sinP,
      -q * a * dir.y * sinP,
      a * cosP
    );
  }

  void main() {
    vUv = uv * 28.0;
    vec3 pos = position;
    float time = uTime * uWaveSpeed;

    // Distance attenuation so waves seamlessly flatten towards the distant horizon
    float distFromOrigin = length(pos.xy);
    float distTaper = 1.0 - smoothstep(550.0, 3400.0, distFromOrigin);

    // Environmental terrain interaction: wave height dampens smoothly near Mount Olympus base
    float distToMountain = length(pos.xy - uMountainPos);
    float shoreDamping = smoothstep(50.0, 110.0, distToMountain);

    float waveH = uWaveHeight * distTaper * (0.35 + shoreDamping * 0.65);

    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 1.0, 0.0);
    vec3 disp = vec3(0.0);

    // Multi-Scale Gerstner Waves with incommensurate irrational frequencies (avoids repeating cycles)
    // 1. Primary Aegean deep oceanic swell (Direction: NW to SE)
    disp += gerstnerWave(pos.xy, normalize(vec2(0.81, 0.58)), waveH * 0.70, 0.0185, 1.12, 0.65, tangent, binormal, time);

    // 2. Secondary Cross Chop Swell (Direction: NE to SW)
    disp += gerstnerWave(pos.xy, normalize(vec2(-0.52, 0.85)), waveH * 0.44, 0.0391, 1.38, 0.55, tangent, binormal, time);

    // 3. Medium Wind Wave Swell
    disp += gerstnerWave(pos.xy, normalize(vec2(0.38, -0.92)), waveH * 0.25, 0.0827, 1.84, 0.45, tangent, binormal, time);

    // 4. High-frequency capillary ripples
    disp += gerstnerWave(pos.xy, normalize(vec2(-0.75, -0.66)), waveH * 0.12, 0.173, 2.45, 0.35, tangent, binormal, time);

    // Localized turbulence near waterfall impact zone (x ~ -20, y ~ 20 in ocean plane coordinates)
    float distToWaterfall = length(pos.xy - vec2(-20.0, 20.0));
    if (distToWaterfall < 60.0) {
      float frothFactor = (1.0 - distToWaterfall / 60.0) * 0.45;
      disp.z += sin(time * 4.0 + pos.x * 0.5) * frothFactor;
    }

    pos += disp;

    vElevation = disp.z;
    vCrest = clamp((disp.z + waveH * 0.3) / (waveH * 1.3 + 0.01), 0.0, 1.0);

    vec3 localNormal = normalize(cross(tangent, binormal));
    vNormal = normalize(normalMatrix * localNormal);

    vPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
  }
`;

const oceanFragmentShader = `
  uniform vec3 uDeepColor;
  uniform vec3 uMidColor;
  uniform vec3 uShallowColor;
  uniform vec3 uSssColor;
  uniform vec3 uSunColor;
  uniform vec3 uSunDirection;
  uniform vec3 uHorizonSkyColor;
  uniform vec3 uDawnAmber;
  uniform float uTime;
  uniform sampler2D uNormalMap;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vElevation;
  varying float vCrest;

  // Fast procedural animated Voronoi caustics
  vec2 hash22(vec2 p) {
    float n = sin(dot(p, vec2(127.1, 311.7)));
    float m = sin(dot(p, vec2(269.5, 183.3)));
    return fract(vec2(n, m) * 43758.5453);
  }

  float voronoiCaustics(vec2 uv, float time) {
    vec2 g = floor(uv);
    vec2 f = fract(uv);
    float minDist = 1.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 lattice = vec2(float(x), float(y));
        vec2 offset = hash22(g + lattice);
        offset = 0.5 + 0.45 * sin(time * 1.5 + 6.2831 * offset);
        float d = length(lattice + offset - f);
        minDist = min(minDist, d);
      }
    }
    return pow(minDist, 2.5);
  }

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    vec3 lightDir = normalize(uSunDirection);

    // 1. Dual-layer micro turbulent normal map sampling for realistic water texture
    vec2 uvFlow1 = vUv * 0.75 + vec2(uTime * 0.022, uTime * 0.012);
    vec2 uvFlow2 = vUv * 1.35 - vec2(uTime * 0.028, -uTime * 0.018);
    vec3 norm1 = texture2D(uNormalMap, uvFlow1).rgb * 2.0 - 1.0;
    vec3 norm2 = texture2D(uNormalMap, uvFlow2).rgb * 2.0 - 1.0;
    vec3 microNormal = normalize(norm1 + norm2);

    vec3 normal = normalize(vNormal + microNormal * 0.22);

    // 2. Physical Fresnel Reflection
    float NdotV = max(0.0, dot(normal, viewDirection));
    float fresnel = pow(1.0 - NdotV, 4.0);

    // 3. Aegean Sea Translucent Depth Gradient
    float depthT = smoothstep(-1.2, 1.5, vElevation);
    vec3 waterBaseColor = mix(uDeepColor, uMidColor, smoothstep(0.0, 0.55, depthT));
    waterBaseColor = mix(waterBaseColor, uShallowColor, smoothstep(0.5, 1.0, depthT));

    // 4. Subsurface Scattering (SSS)
    vec3 sssVector = normalize(-lightDir + normal * 0.35);
    float sssFactor = pow(max(0.0, dot(viewDirection, -sssVector)), 4.0);
    sssFactor *= smoothstep(0.35, 1.0, vCrest);
    vec3 sssGlow = uSssColor * sssFactor * 1.25;

    // 5. Crystalline Shimmering Caustics
    float caustic1 = voronoiCaustics(vPosition.xz * 0.08, uTime);
    float caustic2 = voronoiCaustics(vPosition.xz * 0.14 + vec2(uTime * 0.1), uTime * 1.2);
    float causticWeb = pow(1.0 - min(caustic1, caustic2), 3.0) * 0.38;
    vec3 causticsColor = uShallowColor * causticWeb * (1.0 - fresnel * 0.6);

    // 6. Blinn-Phong & Anisotropic Solar Glint Path
    vec3 halfVector = normalize(lightDir + viewDirection);
    float NdotH = max(0.0, dot(normal, halfVector));

    float sunGlitter = pow(NdotH, 220.0) * 4.8;
    float sunCorona = pow(NdotH, 36.0) * 0.75;
    float sunBroad = pow(NdotH, 10.0) * 0.22;
    vec3 sunSpecular = uSunColor * (sunGlitter + sunCorona + sunBroad);

    // 7. Dynamic Wave Crest Foam
    float foamNoise = texture2D(uNormalMap, vUv * 0.3 + vec2(uTime * 0.015, -uTime * 0.01)).r;
    float foamMask = smoothstep(0.68, 0.95, vCrest + foamNoise * 0.25);
    vec3 foamColor = vec3(0.96, 0.98, 1.0);

    // 8. Dual-Tone Sky Reflection based on azimuth to the golden dawn sun
    float sunFacing = max(0.0, dot(viewDirection, -lightDir));
    vec3 skyReflectColor = mix(uHorizonSkyColor, uDawnAmber, pow(sunFacing, 2.5) * 0.75);

    // 9. Composition
    vec3 finalColor = waterBaseColor;
    finalColor += causticsColor;
    finalColor += sssGlow;
    finalColor = mix(finalColor, skyReflectColor, fresnel * 0.65 + 0.05);
    finalColor += sunSpecular;
    finalColor = mix(finalColor, foamColor, foamMask * 0.62);

    // 10. True Seamless Distance Atmospheric Horizon Fog Integration
    // Dissolves seamlessly into the horizon sky before any mesh boundary
    float dist = length(vPosition - cameraPosition);
    float horizonBlend = smoothstep(420.0, 3100.0, dist);

    vec3 lookDir = normalize(vPosition - cameraPosition);
    float lookTowardSun = max(0.0, dot(lookDir, lightDir));
    vec3 horizonAtmosphere = mix(uHorizonSkyColor, uDawnAmber, pow(lookTowardSun, 2.2) * 0.85);

    finalColor = mix(finalColor, horizonAtmosphere, horizonBlend);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function createRadialOceanGeometry(maxRadius = 3600, rings = 140, segments = 128) {
  const vertexCount = 1 + rings * segments;
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);

  positions[0] = 0;
  positions[1] = 0;
  positions[2] = 0;
  uvs[0] = 0.5;
  uvs[1] = 0.5;

  let vIdx = 1;
  for (let ring = 1; ring <= rings; ring++) {
    const t = ring / rings;
    const r = Math.pow(t, 2.0) * maxRadius;

    for (let seg = 0; seg < segments; seg++) {
      const angle = (seg / segments) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      positions[vIdx * 3] = x;
      positions[vIdx * 3 + 1] = y;
      positions[vIdx * 3 + 2] = 0;

      uvs[vIdx * 2] = (x / (maxRadius * 2)) + 0.5;
      uvs[vIdx * 2 + 1] = (y / (maxRadius * 2)) + 0.5;

      vIdx++;
    }
  }

  const indices = [];
  for (let seg = 0; seg < segments; seg++) {
    const nextSeg = (seg + 1) % segments;
    indices.push(0, 1 + seg, 1 + nextSeg);
  }

  for (let ring = 1; ring < rings; ring++) {
    const r1 = 1 + (ring - 1) * segments;
    const r2 = 1 + ring * segments;

    for (let seg = 0; seg < segments; seg++) {
      const nextSeg = (seg + 1) % segments;
      const a = r1 + seg;
      const b = r1 + nextSeg;
      const c = r2 + seg;
      const d = r2 + nextSeg;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export default function Ocean() {
  const meshRef = useRef(null);
  const normalMap = useMemo(() => createWaterNormalTexture(512), []);
  const oceanGeo = useMemo(() => createRadialOceanGeometry(3600, 140, 128), []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaveSpeed: { value: 1.05 },
    uWaveHeight: { value: 1.35 },
    uMountainPos: { value: new THREE.Vector2(OLYMPUS_CONFIG.world.mountainPosition[0], OLYMPUS_CONFIG.world.mountainPosition[2]) },
    uDeepColor: { value: new THREE.Color('#03152B') },
    uMidColor: { value: new THREE.Color('#0A4A6E') },
    uShallowColor: { value: new THREE.Color('#14B8A6') },
    uSssColor: { value: new THREE.Color('#2DD4BF') },
    uSunColor: { value: new THREE.Color(CELESTIAL_THEME.sun.color) },
    uSunDirection: { value: new THREE.Vector3(...CELESTIAL_THEME.sun.direction) },
    uHorizonSkyColor: { value: new THREE.Color('#1F1836') },
    uDawnAmber: { value: new THREE.Color('#E58E26') },
    uNormalMap: { value: normalMap }
  }), [normalMap]);

  useFrame((_, delta) => {
    if (meshRef.current && meshRef.current.material) {
      meshRef.current.material.uniforms.uTime.value += delta;
    }
  });

  return (
    <group position={[0, OLYMPUS_CONFIG.world.waterLevel, 0]}>
      <mesh
        ref={meshRef}
        geometry={oceanGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <shaderMaterial
          vertexShader={oceanVertexShader}
          fragmentShader={oceanFragmentShader}
          uniforms={uniforms}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
