import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';

// 1. Soaring Olympian Eagle (Zeus's Sacred Bird - Aetos Dios)
function Eagle({ radius, speed, altitude, initialAngle, flapSpeed }) {
  const groupRef = useRef(null);
  const leftWingRef = useRef(null);
  const rightWingRef = useRef(null);

  const [mx, , mz] = OLYMPUS_CONFIG.world.mountainPosition;

  useFrame(({ clock }) => {
    const time = clock.elapsedTime * speed + initialAngle;
    const x = mx + Math.cos(time) * radius;
    const z = mz + Math.sin(time) * radius;
    // Slight vertical thermal updraft drift
    const y = altitude + Math.sin(time * 2.0) * 3.5;

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      // Tangent heading angle
      const heading = time + Math.PI / 2;
      groupRef.current.rotation.y = -heading;
      // Banking into the turn
      groupRef.current.rotation.z = 0.28;
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 1.5) * 0.05;
    }

    // Wing flapping
    const flap = Math.sin(clock.elapsedTime * flapSpeed) * 0.35;
    if (leftWingRef.current) leftWingRef.current.rotation.z = flap;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -flap;
  });

  return (
    <group ref={groupRef} scale={[0.85, 0.85, 0.85]}>
      {/* Eagle Body */}
      <mesh castShadow>
        <coneGeometry args={[0.35, 2.2, 5]} />
        <meshStandardMaterial
          color="#3E2723"
          roughness={0.6}
          emissive="#78350F"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Golden Head & Beak */}
      <mesh position={[0, 1.1, 0.2]}>
        <sphereGeometry args={[0.26, 8, 8]} />
        <meshStandardMaterial
          color="#FEF08A"
          emissive="#F59E0B"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Left Wing */}
      <group ref={leftWingRef} position={[-0.2, 0.3, 0]}>
        <mesh position={[-1.6, 0, 0]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[3.2, 0.08, 0.9]} />
          <meshStandardMaterial
            color="#2E1C12"
            emissive="#B45309"
            emissiveIntensity={0.15}
          />
        </mesh>
      </group>

      {/* Right Wing */}
      <group ref={rightWingRef} position={[0.2, 0.3, 0]}>
        <mesh position={[1.6, 0, 0]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[3.2, 0.08, 0.9]} />
          <meshStandardMaterial
            color="#2E1C12"
            emissive="#B45309"
            emissiveIntensity={0.15}
          />
        </mesh>
      </group>

      {/* Golden Tail Feathers */}
      <mesh position={[0, -1.2, 0]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.9, 0.06, 0.7]} />
        <meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

// 2. Divine Cascading Waterfalls from Floating Celestial Islands
function CelestialWaterfall({ startPos, dropHeight = 35 }) {
  const meshRef = useRef(null);

  useFrame((_, delta) => {
    if (meshRef.current && meshRef.current.material) {
      // Texture or UV animation simulation via offset
      meshRef.current.material.opacity = 0.65 + Math.sin(Date.now() * 0.005) * 0.12;
    }
  });

  return (
    <group position={startPos}>
      {/* Waterfall stream */}
      <mesh ref={meshRef} position={[0, -dropHeight / 2, 0]}>
        <cylinderGeometry args={[0.28, 0.9, dropHeight, 12, 1, true]} />
        <meshStandardMaterial
          color="#67E8F9"
          emissive="#06B6D4"
          emissiveIntensity={0.7}
          transparent
          opacity={0.75}
          roughness={0.1}
          metalness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Base mist splash */}
      <mesh position={[0, -dropHeight, 0]}>
        <sphereGeometry args={[1.8, 12, 8]} />
        <meshStandardMaterial
          color="#E0F2FE"
          emissive="#38BDF8"
          emissiveIntensity={0.5}
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  );
}

// 3. Floating Divine Embers & Stardust Particles
function GoldenEmbers({ count = 120 }) {
  const pointsRef = useRef(null);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const [px, py, pz] = OLYMPUS_CONFIG.world.sanctuaryPlatform;

    for (let i = 0; i < count; i++) {
      // Cylindrical distribution around summit sanctuary
      const r = 3 + Math.random() * 22;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3] = px + Math.cos(angle) * r;
      pos[i * 3 + 1] = py - 2 + Math.random() * 24;
      pos[i * 3 + 2] = pz + Math.sin(angle) * r;

      vel[i * 3] = (Math.random() - 0.5) * 0.4;
      vel[i * 3 + 1] = 0.6 + Math.random() * 1.2; // Float upwards
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    return [pos, vel];
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array;
    const [, py] = OLYMPUS_CONFIG.world.sanctuaryPlatform;

    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3] * delta;
      arr[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      arr[i * 3 + 2] += velocities[i * 3 + 2] * delta;

      // Loop back if floated too high
      if (arr[i * 3 + 1] > py + 26) {
        arr[i * 3 + 1] = py - 2;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.65}
        color={CELESTIAL_THEME.sun.color}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function DivineSanctuaryLife() {
  return (
    <group>
      {/* 1. Soaring Golden Eagles (Aetos Dios) in majestic thermal circles */}
      <Eagle
        radius={48}
        speed={0.35}
        altitude={98}
        initialAngle={0}
        flapSpeed={2.8}
      />
      <Eagle
        radius={72}
        speed={0.24}
        altitude={115}
        initialAngle={Math.PI * 0.8}
        flapSpeed={2.2}
      />
      <Eagle
        radius={36}
        speed={0.42}
        altitude={86}
        initialAngle={Math.PI * 1.5}
        flapSpeed={3.2}
      />

      {/* 2. Celestial Cascading Waterfalls */}
      <CelestialWaterfall startPos={[-28, 71, -50]} dropHeight={28} />
      <CelestialWaterfall startPos={[30, 74, -55]} dropHeight={30} />

      {/* 3. Golden Divine Embers drifting upward at the summit */}
      <GoldenEmbers count={140} />
    </group>
  );
}
