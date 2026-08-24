import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';

export default function MountOlympus() {
  const beaconRef = useRef(null);
  const ringRef = useRef(null);

  // Generate stylized procedural mountain geometry with rocky ridges and crags
  const { mountainGeo, snowCapGeo } = useMemo(() => {
    // 1. Base Mountain Cone Geometry
    const mGeo = new THREE.ConeGeometry(58, OLYMPUS_CONFIG.world.mountainHeight, 36, 24);
    const pos = mGeo.attributes.position;

    // Displace vertices to create jagged ridges and natural mountain terraces
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      const hRatio = (y + OLYMPUS_CONFIG.world.mountainHeight / 2) / OLYMPUS_CONFIG.world.mountainHeight;

      if (hRatio < 0.92) {
        const angle = Math.atan2(z, x);
        const radius = Math.sqrt(x * x + z * z);
        
        const ridge1 = Math.sin(angle * 5.0 + y * 0.1) * 4.8;
        const ridge2 = Math.cos(angle * 9.0 - y * 0.15) * 2.4;
        const crag = (Math.sin(x * 0.4) * Math.cos(z * 0.4)) * 2.2;

        const displacement = (ridge1 + ridge2 + crag) * (1.0 - hRatio * 0.7);
        const newRadius = Math.max(0.5, radius + displacement);

        pos.setX(i, Math.cos(angle) * newRadius);
        pos.setZ(i, Math.sin(angle) * newRadius);
      }
    }
    mGeo.computeVertexNormals();

    // 2. Snowy Golden Cap at Summit
    const sGeo = new THREE.ConeGeometry(19, 26, 24, 8);
    sGeo.computeVertexNormals();

    return { mountainGeo: mGeo, snowCapGeo: sGeo };
  }, []);

  // Floating mystical rock islands arranged with distinct depth layering (Z: -50 to -82)
  const floatingIslands = useMemo(() => {
    return [
      { pos: [-28, 72, -50], scale: [4.2, 6.5, 4.2] }, // Fore-left
      { pos: [30, 75, -55], scale: [4.8, 7.2, 4.8] },  // Fore-right
      { pos: [-22, 86, -78], scale: [3.6, 5.2, 3.6] }, // Background-left
      { pos: [24, 84, -82], scale: [4.0, 5.8, 4.0] }   // Background-right
    ];
  }, []);

  useFrame((state, delta) => {
    // Subtle rotation & breathing pulse for divine peak beacon
    if (beaconRef.current) {
      beaconRef.current.rotation.y += delta * 0.3;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.18;
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
    }
  });

  const [mx, my, mz] = OLYMPUS_CONFIG.world.mountainPosition;
  const [px, py, pz] = OLYMPUS_CONFIG.world.sanctuaryPlatform;
  const [rx, ry, rz] = OLYMPUS_CONFIG.world.torusHaloPosition;
  const [bx, by, bz] = OLYMPUS_CONFIG.world.beaconLightPosition;

  return (
    <group>
      {/* 1. Main Rocky Mountain Body */}
      <group position={[mx, my + OLYMPUS_CONFIG.world.mountainHeight / 2 - 4, mz]}>
        <mesh geometry={mountainGeo} receiveShadow castShadow>
          <meshStandardMaterial
            color="#1E293B"
            roughness={0.88}
            metalness={0.12}
            flatShading={true}
          />
        </mesh>

        {/* Snow / Golden Summit Cap */}
        <mesh
          geometry={snowCapGeo}
          position={[0, OLYMPUS_CONFIG.world.mountainHeight * 0.38, 0]}
          receiveShadow
        >
          <meshStandardMaterial
            color="#E2E8F0"
            emissive={CELESTIAL_THEME.sun.color}
            emissiveIntensity={0.18}
            roughness={0.4}
            metalness={0.3}
            flatShading={true}
          />
        </mesh>
      </group>

      {/* 2. Golden Summit Sanctuary Platform (Positioned at Z: -68) */}
      <group position={[px, py, pz]}>
        <mesh position={[0, -1.8, 0]} receiveShadow>
          <cylinderGeometry args={[17, 21, 3.6, 32]} />
          <meshStandardMaterial
            color="#D97706"
            roughness={0.3}
            metalness={0.65}
            emissive="#B45309"
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* Gilded Temple Ring Rim */}
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[14.2, 16.5, 36]} />
          <meshStandardMaterial
            color={CELESTIAL_THEME.sun.color}
            roughness={0.2}
            metalness={0.85}
            emissive={CELESTIAL_THEME.sun.haloColor}
            emissiveIntensity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 3. Divine Peak Light Shaft & Solar Column (Uses shared CELESTIAL_THEME uniforms) */}
      <group ref={beaconRef} position={[bx, by + 16, bz]}>
        {/* Inner brilliant core beam */}
        <mesh>
          <cylinderGeometry args={[1.2, 3.8, 42, 16, 1, true]} />
          <meshBasicMaterial
            color={CELESTIAL_THEME.sun.color}
            transparent
            opacity={CELESTIAL_THEME.sun.shaftOpacity}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Outer warm amber aura shaft matching Atmosphere sun glow */}
        <mesh>
          <cylinderGeometry args={[4.8, 9.5, 52, 16, 1, true]} />
          <meshBasicMaterial
            color={CELESTIAL_THEME.sun.haloColor}
            transparent
            opacity={CELESTIAL_THEME.sun.shaftAuraOpacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 4. Celestial Halo Torus Ring (Offset backward in Z: -78, Y: 110 for distinct depth separation) */}
      <mesh
        ref={ringRef}
        position={[rx, ry, rz]}
        rotation={[Math.PI / 2.3, 0, 0]}
      >
        <torusGeometry args={[9.5, 0.28, 16, 64]} />
        <meshStandardMaterial
          color={CELESTIAL_THEME.sun.color}
          emissive={CELESTIAL_THEME.sun.haloColor}
          emissiveIntensity={0.85}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* 5. Floating Rock Islands (Distinctly layered in depth) */}
      {floatingIslands.map((island, idx) => (
        <mesh
          key={idx}
          position={island.pos}
          scale={island.scale}
          castShadow
        >
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color="#334155"
            roughness={0.9}
            flatShading={true}
          />
        </mesh>
      ))}

      {/* 6. Shared Summit Point Light */}
      <pointLight
        position={[bx, by + 10, bz]}
        color={CELESTIAL_THEME.sun.color}
        intensity={90}
        distance={70}
        decay={2}
      />
    </group>
  );
}
