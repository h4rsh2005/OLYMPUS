import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';
import { soundFX } from '../../utils/audio';

function ThroneItem({ throne, isFlythroughComplete }) {
  const meshRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Subtle hovering bobbing animation
      if (hovered) {
        meshRef.current.rotation.y += delta * 1.5;
      }
    }
  });

  return (
    <group position={throne.position} rotation={throne.rotation}>
      {/* Throne Base Pedestal */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.0, 2.4, 0.8, 16]} />
        <meshStandardMaterial
          color="#0F172A"
          roughness={0.4}
          metalness={0.7}
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
          emissiveIntensity={hovered ? 0.9 : 0.25}
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
          emissiveIntensity={hovered ? 1.5 : 0.6}
        />
      </mesh>

      {/* Beacon Light for active throne */}
      <pointLight
        position={[0, 2.5, 0]}
        color={throne.color}
        intensity={hovered ? 40 : 15}
        distance={12}
      />

      {/* 3D HTML Tooltip Label on Hover */}
      {hovered && isFlythroughComplete && (
        <Html position={[0, 5.2, 0]} center distanceFactor={25} className="pointer-events-none">
          <div className="flex flex-col items-center bg-[#080E21]/90 border border-amber-400 px-4 py-2 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.6)] whitespace-nowrap animate-fadeIn">
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
  return (
    <group>
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
