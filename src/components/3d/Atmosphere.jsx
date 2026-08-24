import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CELESTIAL_THEME } from '../../config/olympusConfig';

// Rich dawn/twilight sky dome shader with multi-stop celestial horizon gradient
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
  uniform vec3 uDawnAmber;
  uniform vec3 uSunColor;
  uniform vec3 uSunHaloColor;
  uniform vec3 uSunPosition;
  varying vec3 vWorldPosition;

  void main() {
    vec3 point = normalize(vWorldPosition);
    float h = max(0.0, point.y);
    
    // Multi-stop horizon sky gradient
    // Lower horizon: radiant dawn amber -> Mid-sky: mythological violet/rose -> Upper zenith: deep midnight
    vec3 lowerSky = mix(uDawnAmber, uHorizonColor, smoothstep(0.0, 0.28, h));
    vec3 sky = mix(lowerSky, uTopColor, smoothstep(0.18, 0.95, h));

    // Shared Sun Glow Disk & Atmospheric Halo
    vec3 sunDir = normalize(uSunPosition);
    float sunDot = max(0.0, dot(point, sunDir));
    
    // Broad atmospheric golden wash
    float sunWash = pow(sunDot, 6.0) * 0.35;
    // Radiant amber halo
    float sunHalo = pow(sunDot, 24.0) * 0.75;
    // Brilliant solar core
    float sunCore = pow(sunDot, 180.0) * 2.2;

    sky += uSunHaloColor * (sunWash + sunHalo);
    sky += uSunColor * sunCore;

    gl_FragColor = vec4(sky, 1.0);
  }
`;

export default function Atmosphere() {
  const skyUniforms = useMemo(() => ({
    uTopColor: { value: new THREE.Color(CELESTIAL_THEME.sky.topColor) },
    uHorizonColor: { value: new THREE.Color(CELESTIAL_THEME.sky.horizonColor) },
    uDawnAmber: { value: new THREE.Color(CELESTIAL_THEME.sky.dawnAmber) },
    uSunColor: { value: new THREE.Color(CELESTIAL_THEME.sun.color) },
    uSunHaloColor: { value: new THREE.Color(CELESTIAL_THEME.sun.haloColor) },
    uSunPosition: { value: new THREE.Vector3(...CELESTIAL_THEME.sun.position) }
  }), []);

  return (
    <>
      {/* 1. Atmospheric Fog (density balanced to reveal horizon gradient) */}
      <fogExp2
        attach="fog"
        args={[CELESTIAL_THEME.sky.fogColor, CELESTIAL_THEME.sky.fogDensity]}
      />

      {/* 2. Panoramic Sky Dome Sphere */}
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[750, 36, 28]} />
        <shaderMaterial
          vertexShader={skyVertexShader}
          fragmentShader={skyFragmentShader}
          uniforms={skyUniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Shared Celestial Lighting Rig */}
      {/* Ambient sky fill */}
      <ambientLight color="#1E293B" intensity={0.7} />

      {/* Hemisphere sky/ground radiant bounce */}
      <hemisphereLight
        color="#38BDF8"
        groundColor="#0B132B"
        intensity={0.6}
      />

      {/* Directional Golden Sun Light */}
      <directionalLight
        position={CELESTIAL_THEME.sun.position}
        color={CELESTIAL_THEME.sun.color}
        intensity={CELESTIAL_THEME.sun.intensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={10}
        shadow-camera-far={450}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />

      {/* Counter Soft Light */}
      <directionalLight
        position={[-60, 45, 60]}
        color="#38BDF8"
        intensity={0.35}
      />
    </>
  );
}
