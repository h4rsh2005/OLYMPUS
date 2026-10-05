import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';
import { soundFX } from '../../utils/audio';
import { createMarbleTexture } from '../../utils/proceduralTextures';

// Authentic Sculpted Divine Sigils for the 5 Deities
function DeitySigil({ god, color, glowColor, hovered }) {
  const meshRef = useRef(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (hovered ? 1.6 : 0.6);
      meshRef.current.position.y = (hovered ? 5.1 : 4.7) + Math.sin(Date.now() * 0.002) * 0.12;
    }
  });

  return (
    <group ref={meshRef} position={[0, 4.7, 0]}>
      {god === 'Zeus' && (
        // Crackling Golden Lightning Bolt
        <group scale={[0.52, 0.52, 0.52]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.07, 0.32, 1.8, 5]} />
            <meshStandardMaterial
              color={color}
              emissive={glowColor}
              emissiveIntensity={hovered ? 1.6 : 0.6}
              roughness={0.2}
              metalness={0.85}
            />
          </mesh>
          <mesh position={[0.38, 0.55, 0]} rotation={[0, 0, -0.6]} castShadow>
            <cylinderGeometry args={[0.05, 0.25, 1.4, 5]} />
            <meshStandardMaterial
              color={color}
              emissive={glowColor}
              emissiveIntensity={hovered ? 1.6 : 0.6}
              roughness={0.2}
              metalness={0.85}
            />
          </mesh>
          <mesh position={[-0.38, -0.55, 0]} rotation={[0, 0, -0.6]} castShadow>
            <cylinderGeometry args={[0.05, 0.25, 1.4, 5]} />
            <meshStandardMaterial
              color={color}
              emissive={glowColor}
              emissiveIntensity={hovered ? 1.6 : 0.6}
              roughness={0.2}
              metalness={0.85}
            />
          </mesh>
        </group>
      )}

      {god === 'Apollo' && (
        // Radiant Solar Sunburst & Lyre
        <group scale={[0.5, 0.5, 0.5]}>
          <mesh>
            <torusGeometry args={[0.85, 0.1, 12, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={glowColor}
              emissiveIntensity={hovered ? 1.5 : 0.5}
              roughness={0.25}
              metalness={0.8}
            />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.48]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={color}
              emissiveIntensity={hovered ? 1.8 : 0.8}
              roughness={0.15}
              metalness={0.6}
            />
          </mesh>
        </group>
      )}

      {god === 'Athena' && (
        // Crested Helm & Aegis
        <group scale={[0.5, 0.5, 0.5]}>
          <mesh>
            <cylinderGeometry args={[0.75, 0.75, 0.12, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={glowColor}
              emissiveIntensity={hovered ? 1.5 : 0.5}
              roughness={0.25}
              metalness={0.8}
            />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <coneGeometry args={[0.28, 0.85, 6]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={glowColor}
              emissiveIntensity={hovered ? 1.8 : 0.7}
              roughness={0.2}
              metalness={0.5}
            />
          </mesh>
        </group>
      )}

      {god === 'Hermes' && (
        // Winged Caduceus
        <group scale={[0.52, 0.52, 0.52]}>
          <mesh>
            <cylinderGeometry args={[0.07, 0.07, 2.0, 12]} />
            <meshStandardMaterial
              color={color}
              emissive={glowColor}
              emissiveIntensity={hovered ? 1.5 : 0.5}
              roughness={0.25}
              metalness={0.8}
            />
          </mesh>
          <mesh position={[-0.55, 0.55, 0]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.85, 0.08, 0.35]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={color}
              emissiveIntensity={hovered ? 1.4 : 0.5}
            />
          </mesh>
          <mesh position={[0.55, 0.55, 0]} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.85, 0.08, 0.35]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={color}
              emissiveIntensity={hovered ? 1.4 : 0.5}
            />
          </mesh>
        </group>
      )}

      {god === 'Poseidon' && (
        // Three-Pronged Oceanic Trident
        <group scale={[0.5, 0.5, 0.5]}>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 2.2, 12]} />
            <meshStandardMaterial
              color={color}
              emissive={glowColor}
              emissiveIntensity={hovered ? 1.5 : 0.5}
              roughness={0.25}
              metalness={0.8}
            />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <coneGeometry args={[0.14, 0.75, 6]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={color}
              emissiveIntensity={hovered ? 1.8 : 0.7}
            />
          </mesh>
          <mesh position={[-0.42, 0.85, 0]} rotation={[0, 0, -0.2]}>
            <coneGeometry args={[0.11, 0.65, 6]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={color}
              emissiveIntensity={hovered ? 1.8 : 0.7}
            />
          </mesh>
          <mesh position={[0.42, 0.85, 0]} rotation={[0, 0, 0.2]}>
            <coneGeometry args={[0.11, 0.65, 6]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={color}
              emissiveIntensity={hovered ? 1.8 : 0.7}
            />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[0.95, 0.09, 0.14]} />
            <meshStandardMaterial color={color} emissive={glowColor} emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Classical Sculpted Olympian Throne
function SculptedThroneItem({ throne, isFlythroughComplete }) {
  const [hovered, setHovered] = useState(false);
  const marbleTexture = useMemo(() => createMarbleTexture(256), []);

  return (
    <group position={throne.position} rotation={throne.rotation}>
      {/* 1. Marble Stepped Base Plinth */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.2, 2.6, 0.6, 24]} />
        <meshStandardMaterial
          map={marbleTexture}
          color="#E2E8F0"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      {/* Weathered Bronze Trim Ring */}
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.8, 2.0, 0.3, 24]} />
        <meshStandardMaterial
          color="#785328"
          roughness={0.5}
          metalness={0.65}
        />
      </mesh>

      {/* 2. Classical Throne Seat & Scrolled Armrests */}
      <group
        position={[0, 0.8, 0]}
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
            console.log(`Visited domain: ${throne.god}`);
          }
        }}
        className="cursor-pointer"
      >
        {/* Main Throne Chair Base */}
        <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.5, 1.5]} />
          <meshStandardMaterial
            map={marbleTexture}
            color="#F8FAFC"
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>

        {/* Regal Ancient Cushion */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[1.6, 0.25, 1.3]} />
          <meshStandardMaterial
            color={hovered ? throne.color : "#451A03"}
            roughness={0.7}
            metalness={0.08}
            emissive={hovered ? throne.glowColor : "#1F1206"}
            emissiveIntensity={hovered ? 0.35 : 0.05}
          />
        </mesh>

        {/* Sculpted Backrest with Classical Arch */}
        <mesh position={[0, 2.3, -0.6]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 2.4, 0.35]} />
          <meshStandardMaterial
            map={marbleTexture}
            color="#FFFFFF"
            roughness={0.3}
            metalness={0.12}
          />
        </mesh>

        {/* Backrest Antique Bronze / Gilded Crest Cornice */}
        <mesh position={[0, 3.6, -0.6]} castShadow>
          <cylinderGeometry args={[0.9, 0.9, 0.35, 16, 1, false, 0, Math.PI]} rotation={[0, 0, -Math.PI / 2]} />
          <meshStandardMaterial
            color={hovered ? throne.color : "#8C7853"}
            emissive={hovered ? throne.glowColor : "#382D1B"}
            emissiveIntensity={hovered ? 0.5 : 0.1}
            roughness={0.4}
            metalness={0.7}
          />
        </mesh>

        {/* Left Armrest */}
        <mesh position={[-0.85, 1.4, 0]} castShadow>
          <boxGeometry args={[0.25, 0.6, 1.4]} />
          <meshStandardMaterial
            color="#8C7853"
            roughness={0.45}
            metalness={0.65}
          />
        </mesh>

        {/* Right Armrest */}
        <mesh position={[0.85, 1.4, 0]} castShadow>
          <boxGeometry args={[0.25, 0.6, 1.4]} />
          <meshStandardMaterial
            color="#8C7853"
            roughness={0.45}
            metalness={0.65}
          />
        </mesh>
      </group>

      {/* 3. Floating 3D Divine Sigil */}
      <DeitySigil
        god={throne.god}
        color={throne.color}
        glowColor={throne.glowColor}
        hovered={hovered}
      />

      {/* 4. Subtle Architectural Illumination */}
      <pointLight
        position={[0, 2.4, 0]}
        color={throne.color}
        intensity={hovered ? 14 : 3}
        distance={9}
      />

      {/* 5. Minimal Ancient Stele / Stone Tablet Tooltip on Hover */}
      {hovered && isFlythroughComplete && (
        <Html position={[0, 5.8, 0]} center distanceFactor={22} className="pointer-events-none">
          <div className="flex flex-col items-center bg-[#070B16]/95 border border-slate-700/60 px-4 py-2.5 rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.85)] min-w-[200px] max-w-[240px] text-center select-none backdrop-blur-md">
            <div className="flex items-center space-x-1.5 text-amber-200/90 font-cinzel text-[11px] font-semibold tracking-[0.2em] uppercase">
              <span>{throne.god}</span>
              <span className="text-amber-500/70 text-[9px]">✦</span>
              <span className="text-slate-300 font-normal">{throne.title}</span>
            </div>
            <div className="w-12 h-px bg-amber-500/30 my-1.5" />
            <span className="font-cinzel text-[9px] text-slate-400 tracking-wider uppercase mb-1">
              {throne.section}
            </span>
            <p className="font-outfit text-[11px] text-slate-300 leading-snug">
              {throne.description}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function ThronePlaceholders({ isFlythroughComplete }) {
  return (
    <group>
      {/* All 5 Sculpted Classical Thrones (No distracting connecting tubes or debug circles) */}
      {OLYMPUS_CONFIG.thrones.map((throne) => (
        <SculptedThroneItem
          key={throne.id}
          throne={throne}
          isFlythroughComplete={isFlythroughComplete}
        />
      ))}
    </group>
  );
}
