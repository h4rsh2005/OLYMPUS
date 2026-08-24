import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';

export default function MountOlympus() {
  const beaconRef = useRef(null);
  const ringRef = useRef(null);
  const floatingIslandsRef = useRef([]);

  // Generate stylized procedural mountain geometry with rocky ridges
  const { mountainGeo, snowCapGeo } = useMemo(() => {
    // 1. Base Mountain Cone Geometry
    const mGeo = new THREE.ConeGeometry(55, OLYMPUS_CONFIG.world.mountainHeight, 36, 24);
    const pos = mGeo.attributes.position;

    // Displace vertices to create jagged ridges and natural mountain terraces
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // Height ratio: 0 at base, 1 at peak
      const hRatio = (y + OLYMPUS_CONFIG.world.mountainHeight / 2) / OLYMPUS_CONFIG.world.mountainHeight;

      if (hRatio < 0.92) {
        // Multi-frequency noise displacement for rocky crags
        const angle = Math.atan2(z, x);
        const radius = Math.sqrt(x * x + z * z);
        
        const ridge1 = Math.sin(angle * 5.0 + y * 0.1) * 4.5;
        const ridge2 = Math.cos(angle * 9.0 - y * 0.15) * 2.2;
        const crag = (Math.sin(x * 0.4) * Math.cos(z * 0.4)) * 2.0;

        const displacement = (ridge1 + ridge2 + crag) * (1.0 - hRatio * 0.7);
        const newRadius = Math.max(0.5, radius + displacement);

        pos.setX(i, Math.cos(angle) * newRadius);
        pos.setZ(i, Math.sin(angle) * newRadius);
      }
    }
    mGeo.computeVertexNormals();

    // 2. Snowy Golden Cap at Summit
    const sGeo = new THREE.ConeGeometry(18, 26, 24, 8);
    sGeo.computeVertexNormals();

    return { mountainGeo: mGeo, snowCapGeo: sGeo };
  }, []);

  // Floating mystical rock islands around the peak
  const floatingIslands = useMemo(() => {
    return [
      { pos: [-24, 75, -45], scale: [4, 6, 4], rotSpeed: 0.2 },
      { pos: [26, 78, -48], scale: [5, 7, 5], rotSpeed: -0.15 },
      { pos: [-18, 88, -65], scale: [3.5, 5, 3.5], rotSpeed: 0.25 },
      { pos: [20, 86, -62], scale: [4, 5.5, 4], rotSpeed: -0.18 }
    ];
  }, []);

  useFrame((state, delta) => {
    // Subtle breathing pulse for divine peak beacon
    if (beaconRef.current) {
      beaconRef.current.rotation.y += delta * 0.3;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.2;
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const [mx, my, mz] = OLYMPUS_CONFIG.world.mountainPosition;
  const summitY = my + OLYMPUS_CONFIG.world.mountainHeight * 0.48;

  return (
    <group position={[mx, my + OLYMPUS_CONFIG.world.mountainHeight / 2 - 5, mz]}>
      {/* 1. Main Rocky Mountain Body */}
      <mesh geometry={mountainGeo} receiveShadow castShadow>
        <meshStandardMaterial
          color="#1E293B"
          roughness={0.88}
          metalness={0.12}
          flatShading={true}
        />
      </mesh>

      {/* 2. Snow / Golden Summit Cap */}
      <mesh
        geometry={snowCapGeo}
        position={[0, OLYMPUS_CONFIG.world.mountainHeight * 0.38, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#E2E8F0"
          emissive="#FDE047"
          emissiveIntensity={0.15}
          roughness={0.4}
          metalness={0.3}
          flatShading={true}
        />
      </mesh>

      {/* 3. Golden Summit Sanctuary Platform (Throne Plateau) */}
      <mesh position={[0, summitY - 2, 0]} receiveShadow>
        <cylinderGeometry args={[16, 20, 4, 32]} />
        <meshStandardMaterial
          color="#D97706"
          roughness={0.3}
          metalness={0.6}
          emissive="#B45309"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Gilded Temple Ring Rim */}
      <mesh position={[0, summitY + 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[13.5, 15.5, 36]} />
        <meshStandardMaterial
          color="#FDE047"
          roughness={0.2}
          metalness={0.85}
          emissive="#F59E0B"
          emissiveIntensity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4. Divine Peak Beacon & Light Column */}
      <group ref={beaconRef} position={[0, summitY + 12, 0]}>
        {/* Glowing Energy Pillar */}
        <mesh>
          <cylinderGeometry args={[1.2, 3.5, 38, 16, 1, true]} />
          <meshBasicMaterial
            color="#FDE047"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Outer Aura Beam */}
        <mesh>
          <cylinderGeometry args={[4.5, 9.0, 48, 16, 1, true]} />
          <meshBasicMaterial
            color="#F59E0B"
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 5. Celestial Ring hovering above the peak */}
      <mesh
        ref={ringRef}
        position={[0, summitY + 16, 0]}
        rotation={[Math.PI / 2.3, 0, 0]}
      >
        <torusGeometry args={[8.5, 0.25, 16, 64]} />
        <meshStandardMaterial
          color="#FDE047"
          emissive="#F59E0B"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* 6. Floating Rock Islands flanking the peak */}
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

      {/* 7. Peak Point Light illuminating the summit */}
      <pointLight
        position={[0, summitY + 8, 0]}
        color="#FDE047"
        intensity={80}
        distance={60}
        decay={2}
      />
    </group>
  );
}
