import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';

// Custom Ocean GLSL Shaders
const oceanVertexShader = `
  uniform float uTime;
  uniform float uWaveSpeed;
  uniform float uWaveHeight;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vElevation;

  // Wave function combining multiple directional sine octaves
  float calculateWave(vec2 pos, float time) {
    float elevation = 0.0;
    
    // Wave 1 - Large primary swell
    elevation += sin(pos.x * 0.04 + time * 1.2) * cos(pos.y * 0.03 + time * 1.0) * (uWaveHeight * 0.55);
    
    // Wave 2 - Diagonal medium chop
    elevation += sin((pos.x + pos.y) * 0.08 + time * 1.8) * (uWaveHeight * 0.3);
    
    // Wave 3 - Fast high frequency ripple
    elevation += sin(pos.x * 0.18 - pos.y * 0.14 + time * 2.4) * (uWaveHeight * 0.15);
    
    return elevation;
  }

  void main() {
    vUv = uv;
    vec3 transformed = position;
    
    // Compute wave height
    float waveTime = uTime * uWaveSpeed;
    float elevation = calculateWave(transformed.xz, waveTime);
    transformed.y += elevation;
    vElevation = elevation;

    // Approximate surface normal from neighboring offsets
    float delta = 0.4;
    float elevX = calculateWave(transformed.xz + vec2(delta, 0.0), waveTime);
    float elevZ = calculateWave(transformed.xz + vec2(0.0, delta), waveTime);
    
    vec3 tangentX = vec3(delta, elevX - elevation, 0.0);
    vec3 tangentZ = vec3(0.0, elevZ - elevation, delta);
    vNormal = normalize(cross(tangentZ, tangentX));

    vPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
  }
`;

const oceanFragmentShader = `
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uSunColor;
  uniform vec3 uSunPosition;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uTime;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    vec3 normal = normalize(vNormal);

    // Fresnel reflectance (glancing angles reflect sky/sun)
    float fresnel = dot(viewDirection, normal);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 2.5);

    // Base color gradient based on elevation / depth
    float depthFactor = smoothstep(-1.2, 1.5, vElevation);
    vec3 waterColor = mix(uDeepColor, uShallowColor, depthFactor);

    // Sunlight specular reflection
    vec3 lightDir = normalize(uSunPosition - vPosition);
    vec3 halfVector = normalize(lightDir + viewDirection);
    float specular = max(0.0, dot(normal, halfVector));
    specular = pow(specular, 128.0) * 1.8;

    // Foam sparkle on wave peaks
    float foam = smoothstep(0.7, 1.3, vElevation) * 0.35;
    vec3 foamColor = vec3(0.9, 0.95, 1.0);

    // Combine lighting components
    vec3 finalColor = mix(waterColor, uSunColor, fresnel * 0.45);
    finalColor += uSunColor * specular;
    finalColor = mix(finalColor, foamColor, foam);

    // Distance fog blending
    float dist = length(vPosition - cameraPosition);
    float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
    fogFactor = clamp(fogFactor, 0.0, 1.0);

    finalColor = mix(finalColor, uFogColor, fogFactor);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function Ocean() {
  const meshRef = useRef(null);

  // Responsive subdivisions: lower for mobile/small viewports
  const segments = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    return isMobile ? 64 : 128;
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaveSpeed: { value: 0.9 },
    uWaveHeight: { value: 0.9 },
    uDeepColor: { value: new THREE.Color(CELESTIAL_THEME.ocean.deepColor) },
    uShallowColor: { value: new THREE.Color(CELESTIAL_THEME.ocean.shallowColor) },
    uSunColor: { value: new THREE.Color(CELESTIAL_THEME.sun.color) },
    uSunPosition: { value: new THREE.Vector3(...CELESTIAL_THEME.sun.position) },
    uFogColor: { value: new THREE.Color(CELESTIAL_THEME.sky.fogColor) },
    uFogDensity: { value: CELESTIAL_THEME.sky.fogDensity }
  }), []);

  useFrame((_, delta) => {
    if (meshRef.current && meshRef.current.material) {
      meshRef.current.material.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, OLYMPUS_CONFIG.world.waterLevel, 0]}
    >
      <planeGeometry args={[700, 700, segments, segments]} />
      <shaderMaterial
        vertexShader={oceanVertexShader}
        fragmentShader={oceanFragmentShader}
        uniforms={uniforms}
        wireframe={false}
      />
    </mesh>
  );
}
