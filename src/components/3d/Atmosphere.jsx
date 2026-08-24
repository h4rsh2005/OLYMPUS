import React, { useMemo } from 'react';
import * as THREE from 'three';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';

// Custom Sky Dome Shader with dawn/twilight celestial gradient
const skyVertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = `
  uniform vec3 uTopColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uSunColor;
  uniform vec3 uSunPosition;
  varying vec3 vWorldPosition;

  void main() {
    vec3 point = normalize(vWorldPosition);
    float h = max(0.0, point.y);
    
    // Sky gradient from horizon to zenith
    vec3 sky = mix(uHorizonColor, uTopColor, pow(h, 0.45));

    // Sun glow disk & halo
    vec3 sunDir = normalize(uSunPosition);
    float sunDot = max(0.0, dot(point, sunDir));
    float sunHalo = pow(sunDot, 16.0) * 0.4;
    float sunCore = pow(sunDot, 128.0) * 1.5;

    sky += uSunColor * (sunHalo + sunCore);

    gl_FragColor = vec4(sky, 1.0);
  }
`;

export default function Atmosphere() {
  const skyUniforms = useMemo(() => ({
    uTopColor: { value: new THREE.Color('#030712') },       // Deep celestial midnight
    uHorizonColor: { value: new THREE.Color('#2C1844') },   // Mythological dawn purple/amber
    uSunColor: { value: new THREE.Color('#FDE047') },       // Radiant Olympian gold
    uSunPosition: { value: new THREE.Vector3(...OLYMPUS_CONFIG.world.sunPosition) }
  }), []);

  return (
    <>
      {/* 1. Atmospheric Fog */}
      <fogExp2 attach="fog" args={[OLYMPUS_CONFIG.world.fogColor, OLYMPUS_CONFIG.world.fogDensity]} />

      {/* 2. Sky Dome Sphere */}
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[650, 32, 24]} />
        <shaderMaterial
          vertexShader={skyVertexShader}
          fragmentShader={skyFragmentShader}
          uniforms={skyUniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Celestial Lighting */}
      {/* Ambient Fill */}
      <ambientLight color="#1E293B" intensity={0.8} />

      {/* Hemisphere Sky/Ground Light */}
      <hemisphereLight
        color="#38BDF8"
        groundColor="#0B132B"
        intensity={0.65}
      />

      {/* Directional Golden Sun Light */}
      <directionalLight
        position={OLYMPUS_CONFIG.world.sunPosition}
        color="#FFEAA7"
        intensity={2.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={10}
        shadow-camera-far={400}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

      {/* Subtle Counter Fill Light */}
      <directionalLight
        position={[-50, 40, 50]}
        color="#38BDF8"
        intensity={0.4}
      />
    </>
  );
}
