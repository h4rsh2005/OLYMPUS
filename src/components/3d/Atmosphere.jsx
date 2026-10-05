import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CELESTIAL_THEME } from '../../config/olympusConfig';

// Physical Sky Dome Shader with Rayleigh/Mie Scattering & Twinkling Celestial Stars
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
  uniform vec3 uSunDirection;
  uniform float uTime;
  varying vec3 vWorldPosition;

  // Pseudo-random starfield generator
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 point = normalize(vWorldPosition);
    float h = max(0.0, point.y);

    // Multi-stop atmospheric sky gradient
    // Horizon: Radiant dawn gold -> Mid-sky: mythological violet-rose -> Zenith: deep celestial midnight
    vec3 lowerAtmosphere = mix(uDawnAmber, uHorizonColor, smoothstep(0.0, 0.22, h));
    vec3 sky = mix(lowerAtmosphere, uTopColor, smoothstep(0.18, 0.85, h));

    // Twinkling celestial stars in the upper zenith
    if (h > 0.35) {
      vec2 starCoord = point.xz * 180.0 / (h + 0.1);
      float star = hash(floor(starCoord));
      if (star > 0.985) {
        float twinkle = sin(uTime * 3.0 + star * 30.0) * 0.5 + 0.5;
        float starIntensity = smoothstep(0.985, 1.0, star) * (h - 0.35) * 1.5 * twinkle;
        sky += vec3(0.9, 0.95, 1.0) * starIntensity;
      }
    }

    // Physical Solar Disc & Natural Atmospheric Mie Scattering
    // Strictly uses the single source of truth sun direction vector
    vec3 sunDir = normalize(uSunDirection);
    float sunDot = max(0.0, dot(point, sunDir));

    // Wide atmospheric golden wash
    float sunWash = pow(sunDot, 4.0) * 0.40;
    // Radiant amber corona
    float sunCorona = pow(sunDot, 28.0) * 0.85;
    // Natural Mie forward-scattering haze (smooth and physical, NO artificial cross-lines)
    float mieScatter = pow(sunDot, 72.0) * 0.35;
    // Brilliant physical solar core
    float sunCore = pow(sunDot, 480.0) * 5.0;

    sky += uSunHaloColor * (sunWash + sunCorona + mieScatter);
    sky += vec3(1.0, 0.98, 0.92) * sunCore;

    gl_FragColor = vec4(sky, 1.0);
  }
`;

export default function Atmosphere() {
  const skyMeshRef = useRef(null);

  const skyUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uTopColor: { value: new THREE.Color('#030714') },
    uHorizonColor: { value: new THREE.Color('#3A1846') },
    uDawnAmber: { value: new THREE.Color('#E58E26') },
    uSunColor: { value: new THREE.Color(CELESTIAL_THEME.sun.color) },
    uSunHaloColor: { value: new THREE.Color(CELESTIAL_THEME.sun.haloColor) },
    uSunDirection: { value: new THREE.Vector3(...CELESTIAL_THEME.sun.direction) }
  }), []);

  useFrame((state, delta) => {
    if (skyMeshRef.current) {
      if (skyMeshRef.current.material) {
        skyMeshRef.current.material.uniforms.uTime.value += delta;
      }
      // Follow camera X/Z so the sky dome is truly infinite and impossible to reach or breach
      skyMeshRef.current.position.set(state.camera.position.x, 0, state.camera.position.z);
    }
  });

  return (
    <>
      {/* 1. Atmospheric Fog */}
      <fogExp2
        attach="fog"
        args={[CELESTIAL_THEME.sky.fogColor, CELESTIAL_THEME.sky.fogDensity * 0.65]}
      />

      {/* 2. Panoramic Sky Dome Sphere with Rayleigh/Mie & Starfield (Radius 3800) */}
      <mesh ref={skyMeshRef} scale={[-1, 1, 1]}>
        <sphereGeometry args={[3800, 48, 36]} />
        <shaderMaterial
          vertexShader={skyVertexShader}
          fragmentShader={skyFragmentShader}
          uniforms={skyUniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Physical Celestial Solar Body (No synthetic cross lines, purely physical celestial orb) */}
      <group position={CELESTIAL_THEME.sun.visualPosition}>
        {/* Brilliant Solar Photosphere Core */}
        <mesh>
          <sphereGeometry args={[85, 32, 32]} />
          <meshBasicMaterial color="#FFFBF0" />
        </mesh>

        {/* Inner Golden Corona Halo */}
        <mesh>
          <sphereGeometry args={[145, 32, 32]} />
          <meshBasicMaterial
            color={CELESTIAL_THEME.sun.haloColor}
            transparent
            opacity={0.32}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Outer Atmospheric Solar Wash */}
        <mesh>
          <sphereGeometry args={[260, 24, 24]} />
          <meshBasicMaterial
            color={CELESTIAL_THEME.sun.haloColor}
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 4. Unified Celestial Lighting Rig Derived from the Exact Same Direction */}
      <ambientLight color="#121D2F" intensity={0.65} />

      {/* Celestial Sky & Aegean Ground Bounce */}
      <hemisphereLight
        color={CELESTIAL_THEME.sun.skylightColor}
        groundColor="#0A1422"
        intensity={0.65}
      />

      {/* Primary Directional Golden Sunlight (Positioned along exact Sun Direction Vector) */}
      <directionalLight
        position={CELESTIAL_THEME.sun.position}
        color={CELESTIAL_THEME.sun.color}
        intensity={CELESTIAL_THEME.sun.intensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={15}
        shadow-camera-far={650}
        shadow-camera-left={-180}
        shadow-camera-right={180}
        shadow-camera-top={180}
        shadow-camera-bottom={-180}
        shadow-bias={-0.0004}
      />

      {/* Environmental Fill: Soft Celestial Blue Bounce to reveal shadow details */}
      <directionalLight
        position={[-CELESTIAL_THEME.sun.direction[0] * 180, 75, -CELESTIAL_THEME.sun.direction[2] * 180]}
        color="#70A8DB"
        intensity={0.45}
      />
    </>
  );
}
