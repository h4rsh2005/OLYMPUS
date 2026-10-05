import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';
import { createWaterNormalTexture } from '../../utils/proceduralTextures';

// Hyper-Realistic Living Aegean Sea GLSL Shaders with 4-Octave Gerstner Waves,
// Subsurface Scattering (SSS), Voronoi Caustics, Crest Foam, and Seamless Horizon Blending.
const oceanVertexShader = `
  uniform float uTime;
  uniform float uWaveSpeed;
  uniform float uWaveHeight;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vElevation;
  varying float vCrest;

  // Gerstner Wave Component Structure
  // p: horizontal position (x, y), dir: wave direction, a: amplitude, f: frequency, s: speed, q: steepness
  vec3 gerstnerWave(vec2 p, vec2 dir, float a, float f, float s, float q, inout vec3 tangent, inout vec3 binormal, float time) {
    float phase = dot(dir, p) * f + time * s;
    float cosP = cos(phase);
    float sinP = sin(phase);

    // Partial derivatives along X and Y
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

    // Horizontal trochoidal displacement (X, Y) and vertical crest elevation (Z)
    return vec3(
      -q * a * dir.x * sinP,
      -q * a * dir.y * sinP,
      a * cosP
    );
  }

  void main() {
    vUv = uv * 24.0; // High-frequency coordinate tiling for micro ripples
    vec3 pos = position;
    float time = uTime * uWaveSpeed;

    // Distance attenuation so waves seamlessly flatten towards the distant horizon
    float distFromOrigin = length(pos.xy);
    float distTaper = 1.0 - smoothstep(600.0, 3200.0, distFromOrigin);
    float waveH = uWaveHeight * distTaper;

    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 1.0, 0.0);
    vec3 disp = vec3(0.0);

    // 1. Primary Aegean deep swell (Direction: NW to SE)
    disp += gerstnerWave(pos.xy, normalize(vec2(0.85, 0.52)), waveH * 0.72, 0.022, 1.15, 0.65, tangent, binormal, time);

    // 2. Secondary Cross Chop Swell (Direction: NE to SW)
    disp += gerstnerWave(pos.xy, normalize(vec2(-0.55, 0.83)), waveH * 0.42, 0.048, 1.45, 0.55, tangent, binormal, time);

    // 3. Medium Wind Wave Swell
    disp += gerstnerWave(pos.xy, normalize(vec2(0.35, -0.93)), waveH * 0.22, 0.095, 1.95, 0.45, tangent, binormal, time);

    // 4. High-frequency capillary ripples
    disp += gerstnerWave(pos.xy, normalize(vec2(-0.72, -0.69)), waveH * 0.12, 0.18, 2.5, 0.35, tangent, binormal, time);

    // Apply horizontal & vertical displacement (pos in plane geometry is X, Y with Z as height before mesh rotation)
    pos += disp;

    vElevation = disp.z;
    // Crest factor: identifies sharp peaks where foam forms and light transmits
    vCrest = clamp((disp.z + waveH * 0.3) / (waveH * 1.4 + 0.01), 0.0, 1.0);

    // Transform surface normal from perturbed tangent & binormal into world space
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
  uniform vec3 uSunPosition;
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
  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

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
    vec3 lightDir = normalize(uSunPosition - vPosition);

    // 1. Dual-layer micro turbulent normal map sampling for realistic water texture
    vec2 uvFlow1 = vUv * 0.75 + vec2(uTime * 0.022, uTime * 0.012);
    vec2 uvFlow2 = vUv * 1.35 - vec2(uTime * 0.028, -uTime * 0.018);
    vec3 norm1 = texture2D(uNormalMap, uvFlow1).rgb * 2.0 - 1.0;
    vec3 norm2 = texture2D(uNormalMap, uvFlow2).rgb * 2.0 - 1.0;
    vec3 microNormal = normalize(norm1 + norm2);

    // Combine macro Gerstner wave normal with micro surface ripples
    vec3 normal = normalize(vNormal + microNormal * 0.22);

    // 2. Physical Fresnel Reflection
    float NdotV = max(0.0, dot(normal, viewDirection));
    float fresnel = pow(1.0 - NdotV, 4.0);

    // 3. Aegean Sea Translucent Depth Gradient
    // Depth factor smoothly mixes deep sapphire -> vibrant azure -> clear shallow turquoise
    float depthT = smoothstep(-1.2, 1.5, vElevation);
    vec3 waterBaseColor = mix(uDeepColor, uMidColor, smoothstep(0.0, 0.55, depthT));
    waterBaseColor = mix(waterBaseColor, uShallowColor, smoothstep(0.5, 1.0, depthT));

    // 4. Subsurface Scattering (SSS)
    // Sunlight glowing through crystal Aegean wave peaks towards the observer
    vec3 sssVector = normalize(-lightDir + normal * 0.35);
    float sssFactor = pow(max(0.0, dot(viewDirection, -sssVector)), 4.0);
    sssFactor *= smoothstep(0.35, 1.0, vCrest);
    vec3 sssGlow = uSssColor * sssFactor * 1.25;

    // 5. Crystalline Shimmering Caustics (Visible in shallow/mid transparent water)
    float caustic1 = voronoiCaustics(vPosition.xz * 0.08, uTime);
    float caustic2 = voronoiCaustics(vPosition.xz * 0.14 + vec2(uTime * 0.1), uTime * 1.2);
    float causticWeb = pow(1.0 - min(caustic1, caustic2), 3.0) * 0.38;
    vec3 causticsColor = uShallowColor * causticWeb * (1.0 - fresnel * 0.6);

    // 6. Blinn-Phong & Anisotropic Solar Glint Path (Dazzling Sun Highway on Sea)
    vec3 halfVector = normalize(lightDir + viewDirection);
    float NdotH = max(0.0, dot(normal, halfVector));

    // Sharp solar glitter path (sun glints dancing on micro facets)
    float sunGlitter = pow(NdotH, 220.0) * 4.8;
    float sunCorona = pow(NdotH, 36.0) * 0.75;
    float sunBroad = pow(NdotH, 10.0) * 0.22;
    vec3 sunSpecular = uSunColor * (sunGlitter + sunCorona + sunBroad);

    // 7. Dynamic Wave Crest Foam & Foam Streaks
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
    // As distance reaches horizon (>600 units to 3200), water seamlessly melts into the horizon sky
    float dist = length(vPosition - cameraPosition);
    float horizonBlend = smoothstep(450.0, 3100.0, dist);

    // Directional horizon sky color (golden amber toward sun, deep celestial violet-indigo elsewhere)
    vec3 lookDir = normalize(vPosition - cameraPosition);
    float lookTowardSun = max(0.0, dot(lookDir, lightDir));
    vec3 horizonAtmosphere = mix(uHorizonSkyColor, uDawnAmber, pow(lookTowardSun, 2.2) * 0.85);

    finalColor = mix(finalColor, horizonAtmosphere, horizonBlend);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * Generates a seamless radial ocean disk with non-linear density distribution.
 * Dense near the camera/islands for high-frequency Gerstner 3D waves,
 * smoothly stretching to 3600 units to create an infinite, seamless horizon.
 */
function createRadialOceanGeometry(maxRadius = 3600, rings = 140, segments = 128) {
  const vertexCount = 1 + rings * segments;
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);

  // Center vertex
  positions[0] = 0;
  positions[1] = 0;
  positions[2] = 0;
  uvs[0] = 0.5;
  uvs[1] = 0.5;

  let vIdx = 1;
  for (let ring = 1; ring <= rings; ring++) {
    const t = ring / rings;
    // Power of 2 curve: high vertex density near center, expanding to horizon
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
  // Center ring triangles
  for (let seg = 0; seg < segments; seg++) {
    const nextSeg = (seg + 1) % segments;
    indices.push(0, 1 + seg, 1 + nextSeg);
  }

  // Concentric ring quads (2 triangles each)
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

  // Shared ocean shader uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaveSpeed: { value: 1.05 },
    uWaveHeight: { value: 1.35 },
    // Mediterranean Aegean Sea Palette: Luminous, crystal clear & alive
    uDeepColor: { value: new THREE.Color('#03152B') },      // Deep sapphire abyss
    uMidColor: { value: new THREE.Color('#0A4A6E') },       // Radiant Aegean azure
    uShallowColor: { value: new THREE.Color('#14B8A6') },   // Crystalline turquoise crests
    uSssColor: { value: new THREE.Color('#2DD4BF') },       // Subsurface scattering glow
    uSunColor: { value: new THREE.Color(CELESTIAL_THEME.sun.color) },
    uSunPosition: { value: new THREE.Vector3(...CELESTIAL_THEME.sun.position) },
    uHorizonSkyColor: { value: new THREE.Color('#1F1836') }, // Harmonized horizon twilight
    uDawnAmber: { value: new THREE.Color('#E58E26') },       // Radiant dawn horizon gold
    uNormalMap: { value: normalMap }
  }), [normalMap]);

  useFrame((_, delta) => {
    if (meshRef.current && meshRef.current.material) {
      meshRef.current.material.uniforms.uTime.value += delta;
    }
  });

  return (
    <group position={[0, OLYMPUS_CONFIG.world.waterLevel, 0]}>
      {/* Seamless Boundless Radial Aegean Sea (Radius 3600) */}
      <mesh
        ref={meshRef}
        geometry={oceanGeo}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <shaderMaterial
          vertexShader={oceanVertexShader}
          fragmentShader={oceanFragmentShader}
          uniforms={uniforms}
          wireframe={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
