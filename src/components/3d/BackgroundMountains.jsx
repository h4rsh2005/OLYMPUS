import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CELESTIAL_THEME } from '../../config/olympusConfig';

// Custom Atmospheric Mountain GLSL Shader with Rayleigh Depth Haze,
// Geological Stratification (basalt rock, pine scrub, and alpine snow),
// and Sun-Facing Dawn Rim Lighting.
const mountainVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    vElevation = position.z; // Elevation is along geometry Z before rotation

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const mountainFragmentShader = `
  uniform vec3 uSunPosition;
  uniform vec3 uSunColor;
  uniform vec3 uDawnAmber;
  uniform vec3 uSkyHorizonColor;
  uniform vec3 uLowlandColor;  // Mediterranean dark pine & coastal scrub
  uniform vec3 uRockColor;      // Stratified limestone & dark basalt
  uniform vec3 uPeakColor;      // Alpine limestone & ethereal summit snow
  uniform float uMaxHeight;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vElevation;

  // Simple procedural noise for geological strata
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 lightDir = normalize(uSunPosition - vWorldPosition);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    // Directional Sun Lighting
    float NdotL = max(0.0, dot(vNormal, lightDir));
    float skyLight = max(0.0, dot(vNormal, vec3(0.0, 1.0, 0.0))) * 0.45;

    // Height ratio: 0.0 at base to 1.0 at highest peaks
    float hRatio = clamp(vElevation / (uMaxHeight + 0.01), 0.0, 1.0);

    // Geological horizontal rock strata banding
    float strata = sin(vWorldPosition.y * 0.45 + hash(vUv * 10.0) * 0.6) * 0.5 + 0.5;

    // Elevation-based biome & rock distribution:
    // 1. Lower slopes: dark pine scrub & weathered coastal rock
    vec3 baseColor = uLowlandColor;

    // 2. Mid elevation: rugged limestone & dark basalt cliffs
    float rockMix = smoothstep(0.15, 0.45, hRatio);
    vec3 cliffColor = mix(uRockColor, uRockColor * (0.85 + strata * 0.3), 0.6);
    baseColor = mix(baseColor, cliffColor, rockMix);

    // 3. High summits: sharp rocky arêtes with dusting of alpine snow/rime
    float slope = clamp(dot(vNormal, vec3(0.0, 1.0, 0.0)), 0.0, 1.0);
    float snowPresence = smoothstep(0.62, 0.88, hRatio) * smoothstep(0.3, 0.8, slope);
    baseColor = mix(baseColor, uPeakColor, snowPresence);

    // Light accumulation: warm golden dawn sunlight on sun-facing crags, cool skylight in shadow
    vec3 directSun = uSunColor * NdotL * 1.35;
    vec3 ambient = vec3(0.12, 0.16, 0.28) * (skyLight + 0.3);
    vec3 dawnRim = uDawnAmber * pow(max(0.0, dot(vNormal, lightDir)), 3.0) * 0.4;

    vec3 litColor = baseColor * (directSun + ambient) + dawnRim;

    // True Atmospheric Rayleigh Depth Haze (Mountains kilometers away fade into ethereal violet mist)
    float dist = length(vWorldPosition - cameraPosition);
    float hazeFactor = 1.0 - exp(-pow(dist * 0.0016, 1.8));
    hazeFactor = clamp(hazeFactor, 0.0, 0.88);

    // Match horizon atmosphere
    float sunFacing = max(0.0, dot(viewDir, -lightDir));
    vec3 atmosphericColor = mix(uSkyHorizonColor, uDawnAmber, pow(sunFacing, 2.2) * 0.45);

    vec3 finalColor = mix(litColor, atmosphericColor, hazeFactor);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * Creates high-fidelity mountain geometry using multi-frequency ridged fractal noise
 */
function createMountainGeometry(width, depth, height, seed = 1.0, segsX = 56, segsY = 36) {
  const geo = new THREE.PlaneGeometry(width, depth, segsX, segsY);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / (width * 0.5); // -1 to 1
    const v = pos.getY(i) / (depth * 0.5); // -1 to 1

    // Elliptical falloff so mountain ridge tapers naturally to sea level at edges
    const distSq = u * u + v * v;
    const edgeFalloff = Math.max(0.0, Math.cos(Math.min(1.0, Math.sqrt(distSq)) * Math.PI * 0.5));

    if (edgeFalloff > 0) {
      // 1. Primary macro mountain mass
      const mass1 = Math.sin(u * 3.2 + seed) * 0.4 + 0.6;
      // 2. Sharp knife-edge arêtes (using inverted absolute value for sharp peaks)
      const arete1 = 1.0 - Math.abs(Math.sin(u * 7.5 + v * 2.2 + seed * 2.1));
      const arete2 = 1.0 - Math.abs(Math.cos(u * 14.0 - v * 4.5 + seed * 3.4));
      // 3. Couloirs & vertical crags
      const crag = Math.sin(u * 22.0 + v * 8.0) * 0.12;
      const microCrag = Math.cos(u * 44.0) * 0.05;

      const elevation = (mass1 * 0.4 + arete1 * 0.35 + arete2 * 0.2 + crag + microCrag) * height * Math.pow(edgeFalloff, 1.3);
      pos.setZ(i, Math.max(0, elevation));
    } else {
      pos.setZ(i, 0);
    }
  }

  geo.computeVertexNormals();
  return geo;
}

export default function BackgroundMountains() {
  // Generate a panoramic ring of majestic Greek mountain ranges encircling the Aegean horizon
  const mountainChains = useMemo(() => {
    const chains = [];

    // Distinct realistic mountain ranges encircling the entire 360-degree horizon
    const configs = [
      // 1. Pierian Range - Colossal Alpine Spines (North-West)
      { angle: -2.3, distance: 340, width: 340, depth: 140, height: 110, seed: 1.4 },
      // 2. High Ossa Ridge - Deep Gorges & Sea Cliffs (West)
      { angle: -1.5, distance: 310, width: 310, depth: 130, height: 98, seed: 2.7 },
      // 3. Mount Pelion Coastal Headlands (South-West)
      { angle: -0.7, distance: 380, width: 280, depth: 110, height: 78, seed: 3.5 },
      // 4. Distant Southern Aegean Archipelago Peaks (South)
      { angle: 0.1, distance: 420, width: 260, depth: 100, height: 65, seed: 4.8 },
      // 5. Southeast Cape & Oceanic Sea Crags (South-East)
      { angle: 0.85, distance: 390, width: 290, depth: 120, height: 75, seed: 5.3 },
      // 6. Eastern Aegean Coastal Mountain Wall (East)
      { angle: 1.7, distance: 330, width: 320, depth: 135, height: 95, seed: 6.2 },
      // 7. Pierian Massif Far North-East (North-East)
      { angle: 2.5, distance: 360, width: 350, depth: 150, height: 115, seed: 7.6 },
      // 8. Distant Northern Horizon Backbone (North)
      { angle: 3.14, distance: 410, width: 380, depth: 160, height: 125, seed: 8.9 }
    ];

    configs.forEach((cfg, idx) => {
      const geo = createMountainGeometry(cfg.width, cfg.depth, cfg.height, cfg.seed);

      const posX = Math.sin(cfg.angle) * cfg.distance;
      const posZ = Math.cos(cfg.angle) * cfg.distance - 45;
      const rotY = cfg.angle + Math.PI; // Face inward toward Mount Olympus

      chains.push({
        id: idx,
        geometry: geo,
        maxHeight: cfg.height,
        position: [posX, -1.5, posZ], // Slight sink into water so base has zero gap
        rotation: [-Math.PI / 2, 0, rotY]
      });
    });

    return chains;
  }, []);

  // Shared realistic mountain material with elevation & atmospheric depth
  const mountainMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: mountainVertexShader,
      fragmentShader: mountainFragmentShader,
      uniforms: {
        uSunPosition: { value: new THREE.Vector3(...CELESTIAL_THEME.sun.position) },
        uSunColor: { value: new THREE.Color(CELESTIAL_THEME.sun.color) },
        uDawnAmber: { value: new THREE.Color(CELESTIAL_THEME.sky.dawnAmber) },
        uSkyHorizonColor: { value: new THREE.Color(CELESTIAL_THEME.sky.horizonColor) },
        // Mediterranean alpine palette:
        uLowlandColor: { value: new THREE.Color('#16231C') },  // Dark coastal pine & heather
        uRockColor: { value: new THREE.Color('#2A3545') },     // Weathered limestone & dark basalt
        uPeakColor: { value: new THREE.Color('#E2E8F0') },     // Sunlit limestone & alpine rime frost
        uMaxHeight: { value: 110.0 }
      },
      side: THREE.DoubleSide
    });
  }, []);

  return (
    <group>
      {mountainChains.map((chain) => (
        <mesh
          key={chain.id}
          geometry={chain.geometry}
          material={mountainMaterial}
          position={chain.position}
          rotation={chain.rotation}
          receiveShadow
        />
      ))}
    </group>
  );
}
