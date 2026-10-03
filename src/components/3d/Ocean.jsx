import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';
import { createWaterNormalTexture } from '../../utils/proceduralTextures';

// Hyper-Realistic Aegean Sea GLSL Shaders
const oceanVertexShader = `
  uniform float uTime;
  uniform float uWaveSpeed;
  uniform float uWaveHeight;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vElevation;

  // Gerstner-like multi-octave wave displacement with sharp crests
  float calculateWaves(vec2 p, float time) {
    float elev = 0.0;

    // Swell 1 - Large primary Aegean swell (direction: NW to SE)
    float w1 = sin(p.x * 0.035 + p.y * 0.02 + time * 1.1);
    elev += pow(w1 * 0.5 + 0.5, 1.4) * (uWaveHeight * 0.65);

    // Swell 2 - Cross chop (direction: NE)
    float w2 = cos(p.x * 0.065 - p.y * 0.05 + time * 1.6);
    elev += pow(w2 * 0.5 + 0.5, 1.2) * (uWaveHeight * 0.35);

    // Swell 3 - High frequency wind ripple
    float w3 = sin(p.x * 0.16 + p.y * 0.14 - time * 2.2);
    elev += w3 * (uWaveHeight * 0.15);

    return elev;
  }

  void main() {
    vUv = uv * 18.0; // Repeat coordinates for micro-ripples
    vec3 transformed = position;

    float waveTime = uTime * uWaveSpeed;
    float elevation = calculateWaves(transformed.xz, waveTime);
    transformed.y += elevation;
    vElevation = elevation;

    // Compute analytical normals from neighbors
    float delta = 0.3;
    float elevX = calculateWaves(transformed.xz + vec2(delta, 0.0), waveTime);
    float elevZ = calculateWaves(transformed.xz + vec2(0.0, delta), waveTime);

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
  uniform sampler2D uNormalMap;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vPosition);

    // Sample animated dual normal map layers for micro-turbulent ripples
    vec2 uvOffset1 = vUv + vec2(uTime * 0.025, uTime * 0.015);
    vec2 uvOffset2 = vUv * 1.6 - vec2(uTime * 0.03, -uTime * 0.02);
    
    vec3 normal1 = texture2D(uNormalMap, uvOffset1).rgb * 2.0 - 1.0;
    vec3 normal2 = texture2D(uNormalMap, uvOffset2).rgb * 2.0 - 1.0;
    vec3 microNormal = normalize(normal1 + normal2);

    // Blend macro wave normal with micro normal ripples
    vec3 normal = normalize(vNormal + microNormal * 0.28);

    // Fresnel effect: glancing view angles reflect the radiant sky & sun
    float fresnel = 1.0 - max(0.0, dot(viewDirection, normal));
    fresnel = pow(fresnel, 3.2);

    // Deep water color gradient based on wave height
    float depthFactor = smoothstep(-1.0, 1.4, vElevation);
    vec3 waterColor = mix(uDeepColor, uShallowColor, depthFactor);

    // Sun reflection (Blinn-Phong + anisotropic specular glint)
    vec3 lightDir = normalize(uSunPosition - vPosition);
    vec3 halfVector = normalize(lightDir + viewDirection);
    float NdotH = max(0.0, dot(normal, halfVector));
    
    // Sharp sparkling solar path on water
    float sunGlint = pow(NdotH, 160.0) * 3.5;
    float sunCorona = pow(NdotH, 32.0) * 0.6;
    vec3 sunReflection = uSunColor * (sunGlint + sunCorona);

    // Dynamic wave foam on crests
    float foamMask = smoothstep(0.72, 1.25, vElevation);
    vec3 foamColor = vec3(0.95, 0.98, 1.0);

    // Combine lighting
    vec3 skyReflection = mix(vec3(0.12, 0.18, 0.32), uSunColor, fresnel * 0.65);
    vec3 finalColor = mix(waterColor, skyReflection, fresnel * 0.55);
    finalColor += sunReflection;
    finalColor = mix(finalColor, foamColor, foamMask * 0.45);

    // Atmospheric distance fog blending
    float dist = length(vPosition - cameraPosition);
    float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
    fogFactor = clamp(fogFactor, 0.0, 1.0);

    finalColor = mix(finalColor, uFogColor, fogFactor);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function Ocean() {
  const meshRef = useRef(null);
  const normalMap = useMemo(() => createWaterNormalTexture(512), []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaveSpeed: { value: 1.0 },
    uWaveHeight: { value: 1.1 },
    // Aegean Mediterranean Palette: Deep sapphire to turquoise
    uDeepColor: { value: new THREE.Color('#031428') },
    uShallowColor: { value: new THREE.Color('#0C5E78') },
    uSunColor: { value: new THREE.Color(CELESTIAL_THEME.sun.color) },
    uSunPosition: { value: new THREE.Vector3(...CELESTIAL_THEME.sun.position) },
    uFogColor: { value: new THREE.Color(CELESTIAL_THEME.sky.fogColor) },
    uFogDensity: { value: CELESTIAL_THEME.sky.fogDensity * 0.9 },
    uNormalMap: { value: normalMap }
  }), [normalMap]);

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
      <planeGeometry args={[950, 950, 160, 160]} />
      <shaderMaterial
        vertexShader={oceanVertexShader}
        fragmentShader={oceanFragmentShader}
        uniforms={uniforms}
        wireframe={false}
      />
    </mesh>
  );
}
