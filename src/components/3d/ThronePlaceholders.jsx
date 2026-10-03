import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';
import { soundFX } from '../../utils/audio';
import { createMarbleTexture } from '../../utils/proceduralTextures';

// 3D Divine Sigils for the 5 Deities
function DeitySigil({ god, color, glowColor, hovered }) {
  const meshRef = useRef(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (hovered ? 2.2 : 0.8);
      meshRef.current.position.y = (hovered ? 5.2 : 4.8) + Math.sin(Date.now() * 0.003) * 0.15;
    }
  });

  return (
    <group ref={meshRef} position={[0, 4.8, 0]}>
      {god === 'Zeus' && (
        // Crackling Golden Lightning Bolt
        <group scale={[0.55, 0.55, 0.55]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.35, 1.8, 5]} />
            <meshStandardMaterial
              color={color}
              emissive={glowColor}
              emissiveIntensity={hovered ? 2.5 : 1.2}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
          <mesh position={[0.4, 0.6, 0]} rotation={[0, 0, -0.6]} castShadow>
            <cylinderGeometry args={[0.06, 0.28, 1.4, 5]} />
            <meshStandardMaterial
              color={color}
              emissive={glowColor}
              emissiveIntensity={hovered ? 2.5 : 1.2}
            />
          </mesh>
          <mesh position={[-0.4, -0.6, 0]} rotation={[0, 0, -0.6]} castShadow>
            <cylinderGeometry args={[0.06, 0.28, 1.4, 5]} />
            <meshStandardMaterial
              color={color}
              emissive={glowColor}
              emissiveIntensity={hovered ? 2.5 : 1.2}
            />
          </mesh>
        </group>
      )}

      {god === 'Apollo' && (
        // Radiant Solar Sunburst & Golden Lyre
        <group scale={[0.52, 0.52, 0.52]}>
          <mesh>
            <torusGeometry args={[0.9, 0.12, 12, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={glowColor}
              emissiveIntensity={hovered ? 2.2 : 1.0}
            />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.55]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={color}
              emissiveIntensity={hovered ? 3.0 : 1.5}
            />
          </mesh>
        </group>
      )}

      {god === 'Athena' && (
        // Crested Helm & Aegis Shield
        <group scale={[0.52, 0.52, 0.52]}>
          <mesh>
            <cylinderGeometry args={[0.8, 0.8, 0.12, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={glowColor}
              emissiveIntensity={hovered ? 2.2 : 1.0}
              roughness={0.15}
              metalness={0.85}
            />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <coneGeometry args={[0.3, 0.9, 6]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={glowColor}
              emissiveIntensity={hovered ? 2.5 : 1.2}
            />
          </mesh>
        </group>
      )}

      {god === 'Hermes' && (
        // Winged Caduceus
        <group scale={[0.55, 0.55, 0.55]}>
          {/* Central Staff */}
          <mesh>
            <cylinderGeometry args={[0.08, 0.08, 2.2, 12]} />
            <meshStandardMaterial
              color={color}
              emissive={glowColor}
              emissiveIntensity={hovered ? 2.2 : 1.0}
            />
          </mesh>
          {/* Wings */}
          <mesh position={[-0.6, 0.6, 0]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.9, 0.1, 0.4]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={color}
              emissiveIntensity={hovered ? 2.0 : 0.8}
            />
          </mesh>
          <mesh position={[0.6, 0.6, 0]} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.9, 0.1, 0.4]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={color}
              emissiveIntensity={hovered ? 2.0 : 0.8}
            />
          </mesh>
        </group>
      )}

      {god === 'Poseidon' && (
        // Three-Pronged Oceanic Trident
        <group scale={[0.52, 0.52, 0.52]}>
          {/* Shaft */}
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 2.4, 12]} />
            <meshStandardMaterial
              color={color}
              emissive={glowColor}
              emissiveIntensity={hovered ? 2.2 : 1.0}
            />
          </mesh>
          {/* Center prong */}
          <mesh position={[0, 1.2, 0]}>
            <coneGeometry args={[0.15, 0.8, 6]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={color}
              emissiveIntensity={hovered ? 2.5 : 1.2}
            />
          </mesh>
          {/* Left prong */}
          <mesh position={[-0.45, 0.9, 0]} rotation={[0, 0, -0.2]}>
            <coneGeometry args={[0.12, 0.7, 6]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={color}
              emissiveIntensity={hovered ? 2.5 : 1.2}
            />
          </mesh>
          {/* Right prong */}
          <mesh position={[0.45, 0.9, 0]} rotation={[0, 0, 0.2]}>
            <coneGeometry args={[0.12, 0.7, 6]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={color}
              emissiveIntensity={hovered ? 2.5 : 1.2}
            />
          </mesh>
          {/* Crossbar */}
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[1.0, 0.1, 0.15]} />
            <meshStandardMaterial color={color} emissive={glowColor} emissiveIntensity={1.0} />
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
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.8, 2.0, 0.3, 24]} />
        <meshStandardMaterial
          color="#D97706"
          roughness={0.25}
          metalness={0.8}
          emissive="#B45309"
          emissiveIntensity={0.3}
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
            roughness={0.25}
            metalness={0.15}
          />
        </mesh>

        {/* Regal Cushion */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[1.6, 0.25, 1.3]} />
          <meshStandardMaterial
            color={hovered ? throne.color : "#9A3412"}
            roughness={0.65}
            metalness={0.1}
            emissive={hovered ? throne.glowColor : "#78350F"}
            emissiveIntensity={hovered ? 0.6 : 0.2}
          />
        </mesh>

        {/* Sculpted Backrest with Classical Arch & Gilded Inlay */}
        <mesh position={[0, 2.3, -0.6]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 2.4, 0.35]} />
          <meshStandardMaterial
            map={marbleTexture}
            color="#FFFFFF"
            roughness={0.25}
            metalness={0.2}
          />
        </mesh>

        {/* Backrest Gold Crest Cornice */}
        <mesh position={[0, 3.6, -0.6]} castShadow>
          <cylinderGeometry args={[0.9, 0.9, 0.35, 16, 1, false, 0, Math.PI]} rotation={[0, 0, -Math.PI / 2]} />
          <meshStandardMaterial
            color={throne.color}
            emissive={throne.glowColor}
            emissiveIntensity={hovered ? 0.9 : 0.4}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>

        {/* Left Armrest */}
        <mesh position={[-0.85, 1.4, 0]} castShadow>
          <boxGeometry args={[0.25, 0.6, 1.4]} />
          <meshStandardMaterial
            color="#D97706"
            roughness={0.25}
            metalness={0.85}
          />
        </mesh>

        {/* Right Armrest */}
        <mesh position={[0.85, 1.4, 0]} castShadow>
          <boxGeometry args={[0.25, 0.6, 1.4]} />
          <meshStandardMaterial
            color="#D97706"
            roughness={0.25}
            metalness={0.85}
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

      {/* 4. Active Throne Illumination */}
      <pointLight
        position={[0, 2.8, 0]}
        color={throne.color}
        intensity={hovered ? 45 : 15}
        distance={12}
      />

      {/* 5. 3D HTML Tooltip Info Card on Hover */}
      {hovered && isFlythroughComplete && (
        <Html position={[0, 6.2, 0]} center distanceFactor={24} className="pointer-events-none">
          <div className="flex flex-col items-center bg-[#080E21]/95 border border-amber-400/80 px-5 py-3 rounded-2xl backdrop-blur-xl shadow-[0_0_35px_rgba(245,158,11,0.7)] whitespace-nowrap animate-fadeIn min-w-[220px]">
            <div className="flex items-center space-x-2 text-amber-300 font-cinzel text-xs font-bold tracking-widest uppercase mb-1">
              <span>{throne.god}</span>
              <span className="text-amber-500">✦</span>
              <span className="text-slate-200">{throne.title}</span>
            </div>
            <span className="font-outfit text-xs text-amber-200/90 font-medium tracking-wide">
              {throne.section}
            </span>
            <p className="font-outfit text-[11px] text-slate-300 mt-1 max-w-[200px] text-center whitespace-normal">
              {throne.description}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function ThronePlaceholders({ isFlythroughComplete }) {
  // Parametric connecting golden celestial arcs between thrones
  const connectingArcs = useMemo(() => {
    const arcs = [];
    const thrones = OLYMPUS_CONFIG.thrones;
    const count = thrones.length;

    for (let i = 0; i < count - 1; i++) {
      const p1 = thrones[i].position;
      const p2 = thrones[i + 1].position;

      const v1 = new THREE.Vector3(p1[0], p1[1] + 0.6, p1[2]);
      const v2 = new THREE.Vector3(p2[0], p2[1] + 0.6, p2[2]);

      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
      mid.y += 1.8;
      mid.z -= 0.8;

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.09, 8, false);

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
      {/* 1. Parametric Connecting Golden Celestial Arcs */}
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

      {/* 2. All 5 Sculpted Classical Thrones */}
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
