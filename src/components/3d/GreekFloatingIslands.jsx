import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createRockTexture,
  createMarbleTexture,
  createGoldLeafTexture,
  createWaterfallTexture
} from '../../utils/proceduralTextures';
import PrometheanFlame from './PrometheanFlame';

/**
 * GREEK MYTHOLOGICAL FLOATING ISLANDS
 * Massive physical landmasses floating in the celestial atmosphere of Mount Olympus.
 * Each island possesses an unmistakable environmental storytelling identity:
 * 1. The Storm Domain of Zephyrus (West) - Fractured dark basalt, storm-beaten Tholos with open oculus
 * 2. Cascade of the Naiads (Southwest) - Water grotto & cascading waterfalls plunging into the abyss
 * 3. High Altar of Apollo (Northwest) - Sacred Pentelic marble sanctuary & Promethean eternal flame
 * 4. Terrace of the Muses (Northeast) - Ancient ruined Doric sanctuary, cracked tablets & ancient olive grove
 * 5. Celestial Outpost of Hermes (East) - Sharp needle pinnacle with floating stepping-stone debris
 */

// Procedural High-Fidelity Mediterranean Cypress Tree (Cupressus sempervirens)
function GreekCypress({ position, scale = 1 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Textured Cedar Bark Trunk */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.32, 2.8, 8]} />
        <meshStandardMaterial color="#2B1E16" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Organic, Multi-Tiered Foliage with Asymmetric Ruffling */}
      <mesh position={[0, 2.6, 0]} rotation={[0.04, 0.2, -0.03]} castShadow>
        <cylinderGeometry args={[0.78, 1.05, 2.2, 10]} />
        <meshStandardMaterial color="#163825" roughness={0.82} flatShading />
      </mesh>
      <mesh position={[0, 4.4, 0]} rotation={[-0.03, 1.1, 0.04]} castShadow>
        <cylinderGeometry args={[0.55, 0.85, 2.2, 9]} />
        <meshStandardMaterial color="#1D4A32" roughness={0.78} flatShading />
      </mesh>
      <mesh position={[0, 6.0, 0]} rotation={[0.02, 2.2, -0.02]} castShadow>
        <coneGeometry args={[0.58, 2.2, 8]} />
        <meshStandardMaterial color="#255A3D" roughness={0.72} flatShading />
      </mesh>
      <mesh position={[0, 7.3, 0]} castShadow>
        <coneGeometry args={[0.26, 1.4, 7]} />
        <meshStandardMaterial color="#2E6B4A" roughness={0.68} flatShading />
      </mesh>
    </group>
  );
}

// Procedural Ancient Gnarled Greek Olive Tree (Olea europaea)
function GreekOliveTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Ancient Split & Twisting Trunk */}
      <mesh position={[0, 1.2, 0]} rotation={[0.08, 0.4, -0.06]} castShadow>
        <cylinderGeometry args={[0.32, 0.58, 2.4, 7]} />
        <meshStandardMaterial color="#3A2E24" roughness={0.96} metalness={0.04} />
      </mesh>
      {/* Main Forking Heavy Branches */}
      <mesh position={[-0.45, 2.3, 0.2]} rotation={[0.4, 0.2, -0.5]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 1.8, 6]} />
        <meshStandardMaterial color="#3A2E24" roughness={0.96} />
      </mesh>
      <mesh position={[0.45, 2.4, -0.15]} rotation={[-0.3, 0.5, 0.55]} castShadow>
        <cylinderGeometry args={[0.16, 0.26, 1.9, 6]} />
        <meshStandardMaterial color="#3A2E24" roughness={0.96} />
      </mesh>
      {/* Silvery-Sage Olive Leaf Clustered Canopies */}
      <mesh position={[-1.1, 3.2, 0.45]} scale={[1.45, 0.95, 1.35]} castShadow>
        <dodecahedronGeometry args={[1.15, 1]} />
        <meshStandardMaterial color="#4A6E55" roughness={0.78} flatShading />
      </mesh>
      <mesh position={[1.1, 3.4, -0.35]} scale={[1.5, 1.0, 1.4]} castShadow>
        <dodecahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color="#557B62" roughness={0.75} flatShading />
      </mesh>
      <mesh position={[0.1, 4.2, 0.1]} scale={[1.6, 1.05, 1.5]} castShadow>
        <dodecahedronGeometry args={[1.25, 1]} />
        <meshStandardMaterial color="#648D72" roughness={0.72} flatShading />
      </mesh>
    </group>
  );
}

// Hanging ivy/vines dangling over the cliff edge
function HangingVines({ position, length = 6, count = 5 }) {
  const vineLines = useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const ox = (i - (count - 1) / 2) * 0.8;
      const oz = (Math.random() - 0.5) * 0.5;
      const h = length * (0.6 + Math.random() * 0.5);
      list.push({ ox, oz, h });
    }
    return list;
  }, [count, length]);

  return (
    <group position={position}>
      {vineLines.map((v, i) => (
        <mesh key={i} position={[v.ox, -v.h / 2, v.oz]}>
          <cylinderGeometry args={[0.04, 0.08, v.h, 4]} />
          <meshStandardMaterial color="#1E382B" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * PhysicalIslandLandmass:
 * Replaces the geometric inverted cone with a massive, irregular fractured landmass.
 * - Multi-lobed asymmetric contour
 * - Deep craggy underside with hanging basalt teeth and fissures
 * - Stepped natural terrain cap
 * - Satellite floating boulders drifting in the magnetic updraft
 */
function PhysicalIslandLandmass({
  radius = 14,
  depth = 20,
  seed = 1.0,
  rockTexture,
  accentColor = "#223344",
  mossColor = "#243E30",
  children
}) {
  const { cragGeo, capGeo, satelliteRocks } = useMemo(() => {
    // 1. Asymmetric Multi-Lobed Inverted Crag
    const segmentsTheta = 36;
    const segmentsY = 24;
    const geo = new THREE.CylinderGeometry(radius * 0.95, 0.8, depth, segmentsTheta, segmentsY);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i); // ranges from -depth/2 to +depth/2
      const z = pos.getZ(i);

      const angle = Math.atan2(z, x);
      const r = Math.sqrt(x * x + z * z);
      const hRatio = (y + depth / 2) / depth; // 0 at bottom tip, 1 at top plateau

      // Multi-frequency asymmetric lobes (fractured continental perimeter)
      const lobe1 = Math.cos(angle * 2.0 + seed) * 0.35;
      const lobe2 = Math.sin(angle * 3.0 - seed * 1.5) * 0.22;
      const lobe3 = Math.cos(angle * 5.0 + y * 0.3) * 0.15;
      const crags = Math.sin(x * 0.8 + seed) * Math.cos(z * 0.8) * 0.9;

      const horizontalMod = (1.0 + lobe1 + lobe2 + lobe3) * (0.35 + hRatio * 0.65);
      const newR = Math.max(0.4, r * horizontalMod + crags * (1.0 - hRatio * 0.3));

      // Asymmetric vertical stalactites & rock shelf overhangs at underside
      let yMod = y;
      if (hRatio < 0.35) {
        yMod -= Math.sin(angle * 4.0 + seed) * 1.8 * (0.35 - hRatio);
      }

      pos.setX(i, Math.cos(angle) * newR);
      pos.setZ(i, Math.sin(angle) * newR);
      pos.setY(i, yMod);
    }
    geo.computeVertexNormals();

    // 2. Natural Soil / Moss Plateau Cap (slightly irregular top)
    const cap = new THREE.CylinderGeometry(radius * 1.02, radius * 0.98, 1.2, 32);
    const capPos = cap.attributes.position;
    for (let i = 0; i < capPos.count; i++) {
      const x = capPos.getX(i);
      const z = capPos.getZ(i);
      const angle = Math.atan2(z, x);
      const r = Math.sqrt(x * x + z * z);
      const lobe = Math.cos(angle * 2.0 + seed) * 0.3 + Math.sin(angle * 3.0) * 0.18;
      capPos.setX(i, Math.cos(angle) * r * (1.0 + lobe));
      capPos.setZ(i, Math.sin(angle) * r * (1.0 + lobe));
    }
    cap.computeVertexNormals();

    // 3. Floating Satellite Debris Boulders hovering in the updraft
    const satellites = [];
    const sCount = 4;
    for (let s = 0; s < sCount; s++) {
      const sAngle = (s / sCount) * Math.PI * 2 + seed + Math.random() * 0.5;
      const sDist = radius * 1.35 + Math.random() * 6.0;
      const sAlt = (Math.random() - 0.5) * 8.0 - 2.0;
      const sScale = 0.8 + Math.random() * 1.4;
      satellites.push({
        pos: [Math.cos(sAngle) * sDist, sAlt, Math.sin(sAngle) * sDist],
        scale: [sScale, sScale * 1.2, sScale * 0.9],
        rot: [Math.random() * 3, Math.random() * 3, Math.random() * 3],
        speed: 0.8 + Math.random() * 0.6
      });
    }

    return { cragGeo: geo, capGeo: cap, satelliteRocks: satellites };
  }, [radius, depth, seed]);

  return (
    <group>
      {/* 1. Deep Fractured Undercarriage Rock */}
      <mesh geometry={cragGeo} position={[0, -depth * 0.45, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          map={rockTexture}
          color={accentColor}
          roughness={0.92}
          metalness={0.08}
          flatShading
        />
      </mesh>

      {/* 2. Natural Terraced Surface Plateau */}
      <mesh geometry={capGeo} position={[0, 0.4, 0]} receiveShadow>
        <meshStandardMaterial
          color={mossColor}
          roughness={0.85}
          metalness={0.04}
        />
      </mesh>

      {/* 3. Floating Satellite Rock Debris hovering in celestial updraft */}
      {satelliteRocks.map((rock, idx) => (
        <mesh
          key={idx}
          position={rock.pos}
          scale={rock.scale}
          rotation={rock.rot}
          castShadow
        >
          <dodecahedronGeometry args={[1.0, 1]} />
          <meshStandardMaterial
            map={rockTexture}
            color={accentColor}
            roughness={0.95}
            metalness={0.06}
            flatShading
          />
        </mesh>
      ))}

      {/* Island Architectural & Nature Content */}
      <group position={[0, 0.8, 0]}>{children}</group>
    </group>
  );
}

export default function GreekFloatingIslands() {
  const island1Ref = useRef(null);
  const island2Ref = useRef(null);
  const island3Ref = useRef(null);
  const island4Ref = useRef(null);
  const island5Ref = useRef(null);
  const waterfallMeshRef = useRef(null);

  const [hoveredIsland, setHoveredIsland] = useState(null);

  const rockTex = useMemo(() => createRockTexture(512), []);
  const marbleTex = useMemo(() => createMarbleTexture(512), []);
  const goldTex = useMemo(() => createGoldLeafTexture(256), []);
  const waterfallTex = useMemo(() => createWaterfallTexture(256, 512), []);

  // Weathered, noble architectural materials
  const marbleMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: marbleTex,
      color: '#F1F5F9', // Pentelic aged white marble
      roughness: 0.35,
      metalness: 0.12
    });
  }, [marbleTex]);

  const darkBronzeMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#3B332A',
      roughness: 0.8,
      metalness: 0.6
    });
  }, []);

  const sacredGoldMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: goldTex,
      color: '#D4AF37',
      roughness: 0.35,
      metalness: 0.75
    });
  }, [goldTex]);

  // Frame animation: subtle physical levitation & gentle natural breathing
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    // Island 1: Sanctuary of Zephyrus (West)
    if (island1Ref.current) {
      island1Ref.current.position.y = 54 + Math.sin(t * 0.35) * 1.2;
      island1Ref.current.rotation.z = Math.sin(t * 0.25) * 0.015;
    }

    // Island 2: Cascade of the Naiads (Southwest)
    if (island2Ref.current) {
      island2Ref.current.position.y = 48 + Math.sin(t * 0.38 + 1.2) * 1.4;
      island2Ref.current.rotation.x = Math.cos(t * 0.28 + 0.5) * 0.015;
    }

    // Island 3: High Altar of Apollo (Northwest)
    if (island3Ref.current) {
      island3Ref.current.position.y = 78 + Math.sin(t * 0.32 + 2.4) * 1.5;
      island3Ref.current.rotation.z = Math.cos(t * 0.22) * 0.018;
    }

    // Island 4: Terrace of the Muses (Northeast)
    if (island4Ref.current) {
      island4Ref.current.position.y = 73 + Math.sin(t * 0.34 + 3.8) * 1.3;
      island4Ref.current.rotation.y = Math.sin(t * 0.12) * 0.02;
    }

    // Island 5: Outpost of Hermes (East)
    if (island5Ref.current) {
      island5Ref.current.position.y = 44 + Math.sin(t * 0.42 + 4.5) * 1.2;
      island5Ref.current.rotation.x = Math.sin(t * 0.25) * 0.015;
    }

    // Scroll waterfall texture downwards
    if (waterfallTex) {
      waterfallTex.offset.y -= delta * 0.9;
    }
  });

  return (
    <group>
      {/* ============================================================== */}
      {/* DOMAIN 1: THE STORM DOMAIN OF ZEPHYRUS (West - [ -62, 54, -28 ]) */}
      {/* Features: Weathered dark basalt, storm Tholos with open oculus, wind-bent cypresses */}
      {/* ============================================================== */}
      <group
        ref={island1Ref}
        position={[-62, 54, -28]}
        onPointerOver={() => setHoveredIsland(1)}
        onPointerOut={() => setHoveredIsland(null)}
      >
        <PhysicalIslandLandmass
          radius={15}
          depth={22}
          seed={1.8}
          rockTexture={rockTex}
          accentColor="#1A2533"
          mossColor="#1C3528"
        >
          {/* Weathered Stone Tholos Temple with Open Classical Oculus */}
          <group position={[0, 0, 0]}>
            {/* Stepped Pentelic Marble Crepidoma */}
            <mesh position={[0, 0.4, 0]} material={marbleMat} receiveShadow>
              <cylinderGeometry args={[6.6, 7.4, 0.8, 28]} />
            </mesh>
            <mesh position={[0, 1.0, 0]} material={marbleMat} receiveShadow>
              <cylinderGeometry args={[5.6, 6.4, 0.6, 28]} />
            </mesh>

            {/* 6 Circular Doric Fluted Marble Columns */}
            {[...Array(6)].map((_, i) => {
              const angle = (i * 60 * Math.PI) / 180;
              const cx = Math.cos(angle) * 4.5;
              const cz = Math.sin(angle) * 4.5;
              return (
                <group key={i} position={[cx, 1.3, cz]}>
                  <mesh position={[0, 3.2, 0]} material={marbleMat} castShadow>
                    <cylinderGeometry args={[0.32, 0.38, 6.4, 16]} />
                  </mesh>
                  {/* Weathered capital block */}
                  <mesh position={[0, 6.6, 0]} material={marbleMat}>
                    <cylinderGeometry args={[0.52, 0.38, 0.4, 16]} />
                  </mesh>
                </group>
              );
            })}

            {/* Circular Marble Entablature Ring */}
            <mesh position={[0, 8.2, 0]} material={marbleMat} castShadow>
              <cylinderGeometry args={[5.2, 4.9, 0.8, 28]} />
            </mesh>

            {/* Weathered Bronze/Stone Cupola with open skylight oculus */}
            <mesh position={[0, 9.8, 0]} material={darkBronzeMat} castShadow>
              <cylinderGeometry args={[2.0, 4.9, 2.4, 28, 1, true]} />
            </mesh>
            {/* Sacred oculus rim */}
            <mesh position={[0, 11.1, 0]} material={sacredGoldMat}>
              <torusGeometry args={[2.0, 0.18, 12, 28]} />
            </mesh>

            {/* Fallen fractured column drum on grass (Controlled Imperfection) */}
            <mesh position={[5.2, 0.6, 2.5]} rotation={[0.2, 0.6, 1.4]} material={marbleMat} castShadow>
              <cylinderGeometry args={[0.34, 0.36, 2.2, 12]} />
            </mesh>
          </group>

          {/* Wind-beaten cypresses */}
          <GreekCypress position={[-7.5, 0, -4.5]} scale={1.15} />
          <GreekCypress position={[-8.8, 0, 1.5]} scale={0.9} />
          <HangingVines position={[-6, 0, 6]} length={9} count={5} />
        </PhysicalIslandLandmass>

        {/* Subtle hover ambient light response */}
        {hoveredIsland === 1 && (
          <pointLight position={[0, 8, 0]} color="#7DD3FC" intensity={25} distance={28} />
        )}
      </group>

      {/* ============================================================== */}
      {/* DOMAIN 2: THE CASCADE OF THE NAIADS (Southwest - [ -44, 46, -18 ]) */}
      {/* Features: Sea-cave grotto & plunging waterfalls dissolving into mist */}
      {/* ============================================================== */}
      <group
        ref={island2Ref}
        position={[-44, 46, -18]}
        onPointerOver={() => setHoveredIsland(2)}
        onPointerOut={() => setHoveredIsland(null)}
      >
        <PhysicalIslandLandmass
          radius={12}
          depth={24}
          seed={3.2}
          rockTexture={rockTex}
          accentColor="#1C2E38"
          mossColor="#1E4535"
        >
          {/* Mountain Spring Pool */}
          <mesh position={[0, 0.25, 0]} receiveShadow>
            <cylinderGeometry args={[4.2, 4.8, 0.6, 20]} />
            <meshStandardMaterial color="#0E3844" roughness={0.15} />
          </mesh>

          {/* Primary Majestic Cascading Waterfall plunging off cliff into the abyss */}
          <mesh ref={waterfallMeshRef} position={[0, -14, 5.8]} rotation={[0.08, 0, 0]}>
            <planeGeometry args={[4.5, 30]} />
            <meshBasicMaterial
              map={waterfallTex}
              transparent
              opacity={0.82}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Secondary Shorter Weeping Cascade */}
          <mesh position={[-4.2, -8, 2.5]} rotation={[0.1, -0.6, 0]}>
            <planeGeometry args={[2.2, 18]} />
            <meshBasicMaterial
              map={waterfallTex}
              transparent
              opacity={0.65}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Cloud Mist Cloud at base of waterfall */}
          <mesh position={[0, -28, 6.5]}>
            <sphereGeometry args={[4.5, 12, 12]} />
            <meshBasicMaterial color="#E2E8F0" transparent opacity={0.22} depthWrite={false} />
          </mesh>

          {/* Weeping rock grotto arch */}
          <mesh position={[0, 2.8, -1.5]} material={marbleMat} castShadow>
            <torusGeometry args={[3.2, 0.8, 12, 16, Math.PI]} rotation={[0, 0, 0]} />
          </mesh>

          <HangingVines position={[3.5, 0, 5]} length={10} count={6} />
          <GreekCypress position={[5.2, 0, -2.5]} scale={1.0} />
        </PhysicalIslandLandmass>

        {hoveredIsland === 2 && (
          <pointLight position={[0, 6, 4]} color="#38BDF8" intensity={28} distance={26} />
        )}
      </group>

      {/* ============================================================== */}
      {/* DOMAIN 3: HIGH ALTAR OF APOLLO (Northwest - [ -52, 78, -88 ]) */}
      {/* Features: Noble Colonnade, Promethean Sacred Flame, Laurel Cypress */}
      {/* ============================================================== */}
      <group
        ref={island3Ref}
        position={[-52, 78, -88]}
        onPointerOver={() => setHoveredIsland(3)}
        onPointerOut={() => setHoveredIsland(null)}
      >
        <PhysicalIslandLandmass
          radius={16}
          depth={26}
          seed={5.1}
          rockTexture={rockTex}
          accentColor="#2B2824"
          mossColor="#2D3B2E"
        >
          {/* Stepped Pentelic Marble Terrace Dais */}
          <group position={[0, 0, 0]}>
            <mesh position={[0, 0.5, 0]} material={marbleMat} receiveShadow>
              <boxGeometry args={[16, 0.8, 11]} />
            </mesh>

            {/* Classical Fluted Columns */}
            {[-5.5, 0, 5.5].map((x, i) => (
              <group key={`front-col-${i}`}>
                <mesh position={[x, 4.0, 3.6]} material={marbleMat} castShadow>
                  <cylinderGeometry args={[0.36, 0.42, 6.8, 16]} />
                </mesh>
                <mesh position={[x, 4.0, -3.6]} material={marbleMat} castShadow>
                  <cylinderGeometry args={[0.36, 0.42, 6.8, 16]} />
                </mesh>
              </group>
            ))}

            {/* Classical Entablature & Pediment */}
            <mesh position={[0, 7.8, 0]} material={marbleMat} castShadow>
              <boxGeometry args={[16.5, 0.9, 11.5]} />
            </mesh>
            <mesh position={[0, 9.2, 4.8]} material={marbleMat} castShadow>
              <coneGeometry args={[4.2, 1.8, 3]} />
            </mesh>

            {/* Central Sacred Bronze Tripod Brazier with Promethean Flame */}
            <group position={[0, 0.8, 0]}>
              <mesh position={[0, 0.9, 0]} material={darkBronzeMat} castShadow>
                <cylinderGeometry args={[1.4, 0.8, 1.6, 16]} />
              </mesh>
              {/* Sacred Golden Rim Accent */}
              <mesh position={[0, 1.7, 0]} material={sacredGoldMat}>
                <torusGeometry args={[1.4, 0.08, 8, 20]} />
              </mesh>
              <PrometheanFlame
                position={[0, 1.6, 0]}
                scale={0.95}
                flameHeight={2.3}
                flameRadius={0.78}
                lightIntensity={40}
                lightDistance={28}
              />
            </group>
          </group>

          {/* Flanking Cypresses */}
          <GreekCypress position={[-7.5, 0, -3.5]} scale={1.15} />
          <GreekCypress position={[7.5, 0, -3.5]} scale={1.15} />
        </PhysicalIslandLandmass>

        {hoveredIsland === 3 && (
          <pointLight position={[0, 8, 0]} color="#F59E0B" intensity={32} distance={30} />
        )}
      </group>

      {/* ============================================================== */}
      {/* DOMAIN 4: TERRACE OF THE MUSES (Northeast - [ 56, 73, -82 ]) */}
      {/* Features: Ancient Ruined Doric Sanctuary, Cracked Stelae, Olive Grove */}
      {/* ============================================================== */}
      <group
        ref={island4Ref}
        position={[56, 73, -82]}
        onPointerOver={() => setHoveredIsland(4)}
        onPointerOut={() => setHoveredIsland(null)}
      >
        <PhysicalIslandLandmass
          radius={15}
          depth={22}
          seed={6.7}
          rockTexture={rockTex}
          accentColor="#252A30"
          mossColor="#2F3E32"
        >
          {/* Ancient Ruined Marble Portico with Tilted & Broken Columns */}
          <group position={[0, 0, 0]}>
            {/* Cracked Marble Base */}
            <mesh position={[0, 0.35, 0]} material={marbleMat} receiveShadow>
              <boxGeometry args={[14, 0.7, 10]} />
            </mesh>

            {/* Standing Column */}
            <mesh position={[-4.5, 3.4, 2.5]} material={marbleMat} castShadow>
              <cylinderGeometry args={[0.34, 0.4, 6.0, 16]} />
            </mesh>

            {/* Tilted Column (Earthquake/Aeons weathered) */}
            <mesh position={[-1.2, 3.2, 2.8]} rotation={[0.08, 0, 0.18]} material={marbleMat} castShadow>
              <cylinderGeometry args={[0.34, 0.4, 5.8, 16]} />
            </mesh>

            {/* Broken Column Stump */}
            <mesh position={[2.5, 1.5, 2.5]} material={marbleMat} castShadow>
              <cylinderGeometry args={[0.38, 0.42, 2.4, 16]} />
            </mesh>

            {/* Fallen Classical Architrave Slab */}
            <mesh position={[0.5, 0.8, -1.5]} rotation={[0.1, 0.4, -0.05]} material={marbleMat} castShadow>
              <boxGeometry args={[8.5, 0.7, 1.2]} />
            </mesh>

            {/* Inscribed Sacred Marble Stelae / Tablet */}
            <mesh position={[3.8, 1.8, -2.5]} rotation={[0, -0.3, 0]} material={marbleMat} castShadow>
              <boxGeometry args={[1.2, 2.2, 0.35]} />
            </mesh>
          </group>

          {/* Ancient Gnarled Greek Olive Trees rooted in the ruins */}
          <GreekOliveTree position={[-5.8, 0, -2.8]} scale={1.25} />
          <GreekOliveTree position={[5.2, 0, 1.5]} scale={1.05} />
          <HangingVines position={[-5, 0, 6]} length={7} count={5} />
        </PhysicalIslandLandmass>

        {hoveredIsland === 4 && (
          <pointLight position={[0, 7, 0]} color="#38BDF8" intensity={25} distance={26} />
        )}
      </group>

      {/* ============================================================== */}
      {/* DOMAIN 5: OUTPOST OF HERMES (East - [ 48, 48, 12 ]) */}
      {/* Features: Needle Pinnacle Crag with Floating Stepping-Stones */}
      {/* ============================================================== */}
      <group
        ref={island5Ref}
        position={[48, 48, 12]}
        onPointerOver={() => setHoveredIsland(5)}
        onPointerOut={() => setHoveredIsland(null)}
      >
        <PhysicalIslandLandmass
          radius={11}
          depth={28}
          seed={8.4}
          rockTexture={rockTex}
          accentColor="#202A35"
          mossColor="#223C2D"
        >
          {/* Classical Needle Beacon Watchtower */}
          <group position={[0, 0, 0]}>
            <mesh position={[0, 2.5, 0]} material={marbleMat} castShadow>
              <cylinderGeometry args={[1.8, 2.4, 5.0, 16]} />
            </mesh>
            <mesh position={[0, 5.4, 0]} material={marbleMat} castShadow>
              <cylinderGeometry args={[2.2, 1.6, 0.8, 16]} />
            </mesh>
            {/* Beacon Spire with Restrained Holy Gold Finial */}
            <mesh position={[0, 7.2, 0]} material={darkBronzeMat} castShadow>
              <coneGeometry args={[1.2, 3.2, 8]} />
            </mesh>
            <mesh position={[0, 8.8, 0]} material={sacredGoldMat}>
              <sphereGeometry args={[0.35, 12, 12]} />
            </mesh>
          </group>

          {/* Stepping-Stone Slabs hovering in the sky toward Mount Olympus */}
          {[
            { pos: [-12, 1.5, -6], scale: [3.2, 0.6, 2.5] },
            { pos: [-18, 3.2, -12], scale: [2.8, 0.5, 2.2] },
            { pos: [-24, 5.0, -18], scale: [2.6, 0.5, 2.0] }
          ].map((slab, i) => (
            <mesh key={i} position={slab.pos} scale={slab.scale} castShadow receiveShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial map={rockTex} color="#202A35" roughness={0.92} flatShading />
            </mesh>
          ))}

          <GreekCypress position={[3.8, 0, -2.5]} scale={1.1} />
        </PhysicalIslandLandmass>

        {hoveredIsland === 5 && (
          <pointLight position={[0, 9, 0]} color="#34D399" intensity={28} distance={28} />
        )}
      </group>
    </group>
  );
}
