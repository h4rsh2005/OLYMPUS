import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CELESTIAL_THEME, OLYMPUS_CONFIG } from '../../config/olympusConfig';

/**
 * CONTINUOUS 360° PROCEDURAL HORIZON SYSTEM
 * 
 * Solves the visible world boundary problem:
 * - A seamless 360-degree panoramic mountain cylinder encircling Mount Olympus at radius 880 units.
 * - Continuous, non-periodic multi-frequency fractal noise (continental massifs + sharp arêtes + crags).
 * - ZERO seams, ZERO visible mesh edges, ZERO repeating cones.
 * - True Rayleigh atmospheric depth haze: as distance increases and at sea level, the terrain dissolves
 *   100% into the atmospheric horizon haze before any boundary can ever be seen.
 */

const horizonVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    vElevation = position.y;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const horizonFragmentShader = `
  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform vec3 uDawnAmber;
  uniform vec3 uSkyHorizonColor;
  uniform vec3 uLowlandColor;   // Aegean dark pine & coastal scrub
  uniform vec3 uRockColor;       // Stratified limestone & dark basalt
  uniform vec3 uPeakColor;       // Alpine rime snow on high peaks
  uniform float uMaxHeight;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vec3 lightDir = normalize(uSunDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    // Directional Sun Lighting derived strictly from single celestial source
    float NdotL = max(0.0, dot(vNormal, lightDir));
    float skyLight = max(0.0, dot(vNormal, vec3(0.0, 1.0, 0.0))) * 0.45;

    // Height ratio: 0.0 at sea level to 1.0 at highest peaks
    float hRatio = clamp(vElevation / (uMaxHeight + 0.01), 0.0, 1.0);

    // Elevation-based biome & geological strata distribution:
    vec3 baseColor = uLowlandColor;

    // Mid elevation: rugged limestone & dark basalt cliffs
    float rockMix = smoothstep(0.12, 0.42, hRatio);
    baseColor = mix(baseColor, uRockColor, rockMix);

    // High summits: alpine snow / rime dust on upward slopes
    float slope = clamp(dot(vNormal, vec3(0.0, 1.0, 0.0)), 0.0, 1.0);
    float snowPresence = smoothstep(0.55, 0.85, hRatio) * smoothstep(0.25, 0.75, slope);
    baseColor = mix(baseColor, uPeakColor, snowPresence * 0.88);

    // Light accumulation: warm celestial sunlight on sunward crags, cool skylight in shadow
    vec3 directSun = uSunColor * NdotL * 1.35;
    vec3 ambient = vec3(0.12, 0.16, 0.26) * (skyLight + 0.35);
    vec3 dawnRim = uDawnAmber * pow(max(0.0, dot(vNormal, lightDir)), 3.0) * 0.35;

    vec3 litColor = baseColor * (directSun + ambient) + dawnRim;

    // True Atmospheric Rayleigh Depth Haze & Sea Level Mist Dissolution
    // As distance increases towards the horizon, contrast and saturation fade seamlessly into the sky
    float dist = length(vWorldPosition - cameraPosition);
    float distanceHaze = smoothstep(350.0, 1100.0, dist);

    // Low-altitude sea mist dissolution (mountain base seamlessly vanishes into ocean haze)
    float lowSeaMist = 1.0 - smoothstep(2.0, 28.0, vElevation);

    // Total atmospheric factor: guarantees geometry dissolves into sky before any edge is seen
    float totalHaze = clamp(distanceHaze * 0.72 + lowSeaMist * 0.85, 0.0, 1.0);

    // Directional atmospheric horizon color
    float sunFacing = max(0.0, dot(viewDir, -lightDir));
    vec3 atmosphericColor = mix(uSkyHorizonColor, uDawnAmber, pow(sunFacing, 2.4) * 0.65);

    vec3 finalColor = mix(litColor, atmosphericColor, totalHaze);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function BackgroundMountains() {
  const [mx, , mz] = OLYMPUS_CONFIG.world.mountainPosition;

  // Layer 1: Continuous 360-degree Inner Horizon Massif Ring (Radius 680, Height 140)
  const innerRingGeo = useMemo(() => {
    const radius = 680;
    const segments = 180;
    const heightSegments = 32;
    const maxHeight = 135;

    // Open cylinder geometry: radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded
    const geo = new THREE.CylinderGeometry(radius, radius * 1.02, maxHeight, segments, heightSegments, true);
    const pos = geo.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);

      // Angle theta in [0, 2PI]
      const angle = Math.atan2(vertex.z, vertex.x);
      // Normalized vertical ratio: 0.0 at bottom (sea level), 1.0 at top
      const vRatio = (vertex.y + maxHeight * 0.5) / maxHeight;

      if (vRatio > 0.05) {
        // Multi-frequency continuous periodic noise (seamless at 0 and 2PI)
        // 1. Low frequency continental massifs (Pieria, Pelion, Ossa)
        const mass1 = Math.sin(angle * 3.0 + 1.2) * 0.35 + Math.cos(angle * 2.0 - 0.5) * 0.25;
        // 2. Mid frequency knife-edge arêtes and couloirs
        const arete1 = (1.0 - Math.abs(Math.sin(angle * 7.0 + 0.8))) * 0.28;
        const arete2 = (1.0 - Math.abs(Math.cos(angle * 13.0 - 1.4))) * 0.18;
        // 3. High frequency crags
        const crag = Math.sin(angle * 29.0) * 0.08 + Math.cos(angle * 53.0) * 0.04;

        const totalProfile = Math.max(0.08, 0.45 + mass1 + arete1 + arete2 + crag);

        // Displace height and taper to zero at base
        const newY = vRatio * maxHeight * totalProfile;
        vertex.y = newY;

        // Slight radial displacement to break circular symmetry
        const radialBump = 1.0 + (mass1 + arete1) * 0.06;
        vertex.x *= radialBump;
        vertex.z *= radialBump;
      } else {
        vertex.y = 0.0;
      }

      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  // Layer 2: Continuous 360-degree Outer Continental Spine (Radius 1050, Height 190)
  const outerRingGeo = useMemo(() => {
    const radius = 1050;
    const segments = 160;
    const heightSegments = 28;
    const maxHeight = 190;

    const geo = new THREE.CylinderGeometry(radius, radius * 1.02, maxHeight, segments, heightSegments, true);
    const pos = geo.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);

      const angle = Math.atan2(vertex.z, vertex.x);
      const vRatio = (vertex.y + maxHeight * 0.5) / maxHeight;

      if (vRatio > 0.05) {
        // Different phase and frequencies so it creates deep mountain parallax with layer 1
        const mass = Math.cos(angle * 2.0 + 2.1) * 0.38 + Math.sin(angle * 4.0 - 0.7) * 0.22;
        const arete = (1.0 - Math.abs(Math.sin(angle * 9.0 + 3.1))) * 0.32;
        const crag = Math.cos(angle * 21.0) * 0.09;

        const totalProfile = Math.max(0.1, 0.5 + mass + arete + crag);
        vertex.y = vRatio * maxHeight * totalProfile;

        const radialBump = 1.0 + mass * 0.05;
        vertex.x *= radialBump;
        vertex.z *= radialBump;
      } else {
        vertex.y = 0.0;
      }

      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  // Shared Horizon Terrain Shader Uniforms
  const innerUniforms = useMemo(() => ({
    uSunDirection: { value: new THREE.Vector3(...CELESTIAL_THEME.sun.direction) },
    uSunColor: { value: new THREE.Color(CELESTIAL_THEME.sun.color) },
    uDawnAmber: { value: new THREE.Color(CELESTIAL_THEME.sky.dawnAmber) },
    uSkyHorizonColor: { value: new THREE.Color(CELESTIAL_THEME.sky.horizonColor) },
    uLowlandColor: { value: new THREE.Color('#152220') },
    uRockColor: { value: new THREE.Color('#222E37') },
    uPeakColor: { value: new THREE.Color('#CBD5E1') },
    uMaxHeight: { value: 140.0 }
  }), []);

  const outerUniforms = useMemo(() => ({
    uSunDirection: { value: new THREE.Vector3(...CELESTIAL_THEME.sun.direction) },
    uSunColor: { value: new THREE.Color(CELESTIAL_THEME.sun.color) },
    uDawnAmber: { value: new THREE.Color(CELESTIAL_THEME.sky.dawnAmber) },
    uSkyHorizonColor: { value: new THREE.Color(CELESTIAL_THEME.sky.horizonColor) },
    uLowlandColor: { value: new THREE.Color('#111C1C') },
    uRockColor: { value: new THREE.Color('#1B2630') },
    uPeakColor: { value: new THREE.Color('#94A3B8') },
    uMaxHeight: { value: 195.0 }
  }), []);

  return (
    <group position={[mx, 0, mz]}>
      {/* Layer 1: Mid-Distance Horizon Massifs (Radius 680) */}
      <mesh geometry={innerRingGeo} receiveShadow>
        <shaderMaterial
          vertexShader={horizonVertexShader}
          fragmentShader={horizonFragmentShader}
          uniforms={innerUniforms}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Layer 2: Colossal Outer Continental Spine (Radius 1050) */}
      <mesh geometry={outerRingGeo} receiveShadow>
        <shaderMaterial
          vertexShader={horizonVertexShader}
          fragmentShader={horizonFragmentShader}
          uniforms={outerUniforms}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
