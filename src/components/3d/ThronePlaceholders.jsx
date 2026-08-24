import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';
import { soundFX } from '../../utils/audio';

function ThroneItem({ throne, isFlythroughComplete }) {
  const meshRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += delta * 1.5;
    }
  });

  return (
    <group position={throne.position} rotation={throne.rotation}>
      {/* Throne Base Pedestal */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.0, 2.4, 0.8, 24]} />
        <meshStandardMaterial
          color="#0F172A"
          roughness={0.35}
          metalness={0.75}
        />
      </mesh>

      {/* Stylized Throne Backrest & Seat */}
      <mesh
        ref={meshRef}
        position={[0, 2.2, 0]}
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          if (isFlythroughComplete) {
            setHovered(true);
            soundFX.playChime(2, 0.12);
          }
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (isFlythroughComplete) {
            soundFX.playEnterChord();
            console.log(`Clicked throne: ${throne.god} (${throne.section})`);
          }
        }}
      >
        <boxGeometry args={[1.8, 3.2, 1.2]} />
        <meshStandardMaterial
          color={hovered ? throne.color : "#D97706"}
          emissive={hovered ? throne.glowColor : "#B45309"}
          emissiveIntensity={hovered ? 0.95 : 0.25}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Floating Crown/Rune above Throne */}
      <mesh position={[0, 4.4, 0]}>
        <octahedronGeometry args={[0.45]} />
        <meshStandardMaterial
          color={throne.color}
          emissive={throne.glowColor}
          emissiveIntensity={hovered ? 1.6 : 0.7}
        />
      </mesh>

      {/* Beacon Light for active throne */}
      <pointLight
        position={[0, 2.5, 0]}
        color={throne.color}
        intensity={hovered ? 45 : 18}
        distance={14}
      />

      {/* 3D HTML Tooltip Label on Hover */}
      {hovered && isFlythroughComplete && (
        <Html position={[0, 5.4, 0]} center distanceFactor={26} className="pointer-events-none">
          <div className="flex flex-col items-center bg-[#080E21]/95 border border-amber-400 px-4 py-2 rounded-xl backdrop-blur-md shadow-[0_0_25px_rgba(245,158,11,0.7)] whitespace-nowrap animate-fadeIn">
            <span className="font-cinzel text-xs text-amber-300 font-bold tracking-widest uppercase">
              {throne.god} • {throne.title}
            </span>
            <span className="font-outfit text-[11px] text-slate-200">
              {throne.section}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function ThronePlaceholders({ isFlythroughComplete }) {
  // Parametric arc loop connecting all N pedestals (i -> i+1 for all N)
  const connectingArcs = useMemo(() => {
    const arcs = [];
    const thrones = OLYMPUS_CONFIG.thrones;
    const count = thrones.length;

    for (let i = 0; i < count - 1; i++) {
      const p1 = thrones[i].position;
      const p2 = thrones[i + 1].position;

      const v1 = new THREE.Vector3(p1[0], p1[1] + 0.6, p1[2]);
      const v2 = new THREE.Vector3(p2[0], p2[1] + 0.6, p2[2]);

      // Midpoint elevated upward and curved slightly toward sanctuary center
      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
      mid.y += 1.6;
      mid.z -= 0.6;

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.08, 8, false);

      arcs.push({
        id: `arc-${thrones[i].id}-${thrones[i + 1].id}`,
        geometry: tubeGeo,
        color: thrones[i].color
      });
    }

    return arcs;
  }, []);

  return (
    <group>
      {/* 1. Parametric Connecting Golden Celestial Arcs (All N-1 segments) */}
      {connectingArcs.map((arc) => (
        <mesh key={arc.id} geometry={arc.geometry}>
          <meshStandardMaterial
            color={CELESTIAL_THEME.sun.color}
            emissive={CELESTIAL_THEME.sun.haloColor}
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
      ))}

      {/* 2. All N Throne Pedestals */}
      {OLYMPUS_CONFIG.thrones.map((throne) => (
        <ThroneItem
          key={throne.id}
          throne={throne}
          isFlythroughComplete={isFlythroughComplete}
        />
      ))}
    </group>
  );
}
