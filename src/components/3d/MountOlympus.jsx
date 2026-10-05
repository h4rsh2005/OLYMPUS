import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';
import { createRockTexture, createMarbleTexture } from '../../utils/proceduralTextures';
import PrometheanFlame from './PrometheanFlame';

// Classical Pentelic Marble Column
function GreekColumn({ position, height = 7.5, radius = 0.45, marbleTexture }) {
  const columnGeo = useMemo(() => {
    return new THREE.CylinderGeometry(radius * 0.9, radius, height, 16);
  }, [height, radius]);

  return (
    <group position={position}>
      {/* Stepped Base Plinth */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[radius * 2.8, 0.5, radius * 2.8]} />
        <meshStandardMaterial
          map={marbleTexture}
          color="#E2E8F0"
          roughness={0.42}
          metalness={0.08}
        />
      </mesh>
      {/* Fluted Column Shaft */}
      <mesh geometry={columnGeo} position={[0, height / 2 + 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          map={marbleTexture}
          color="#F8FAFC"
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>
      {/* Doric/Ionic Capital */}
      <mesh position={[0, height + 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[radius * 2.9, 0.35, radius * 2.9]} />
        <meshStandardMaterial
          map={marbleTexture}
          color="#E2E8F0"
          roughness={0.42}
          metalness={0.08}
        />
      </mesh>
    </group>
  );
}

export default function MountOlympus() {
  const sunbeamRef = useRef(null);

  const rockTexture = useMemo(() => createRockTexture(512), []);
  const marbleTexture = useMemo(() => createMarbleTexture(512), []);

  // Rough bedrock limestone material for substructures
  const bedrockMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: rockTexture,
      color: '#263238',
      roughness: 0.92,
      bumpMap: rockTexture,
      bumpScale: 1.4,
      flatShading: true
    });
  }, [rockTexture]);

  // Sculpted High-Fidelity Mount Olympus Massif Geometry
  // Formed with authentic geological arêtes, sheer couloirs, and stepped coastal spurs
  const mountainGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(72, OLYMPUS_CONFIG.world.mountainHeight, 72, 60);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // Height ratio: 0.0 at base (sea level), 1.0 at peak
      const hRatio = (y + OLYMPUS_CONFIG.world.mountainHeight / 2) / OLYMPUS_CONFIG.world.mountainHeight;

      if (hRatio < 0.96) {
        const angle = Math.atan2(z, x);
        const radius = Math.sqrt(x * x + z * z);

        // 1. Primary geological knife-edge arêtes (Mytikas, Stefani, and Skolio ridges)
        const areteMytikas = Math.cos(angle * 3.0 + y * 0.05) * 7.5;
        const areteStefani = Math.sin(angle * 5.0 - y * 0.07) * 4.2;
        const flankCrags = Math.cos(angle * 9.0 + y * 0.12) * 2.4;

        // 2. Vertical rock face cliffs & couloirs (gorges)
        const cliffCouloir = Math.sin(x * 0.28) * Math.cos(z * 0.28) * 3.8;
        const microCrags = (Math.sin(x * 0.75) + Math.cos(z * 0.75)) * 1.5;

        // 3. Natural foot buttresses reaching into the Aegean sea (expanding base)
        let coastalButtress = 0;
        if (hRatio < 0.35) {
          const baseSpread = Math.pow(1.0 - hRatio / 0.35, 2.0);
          coastalButtress = (Math.cos(angle * 4.0) * 12.0 + Math.sin(angle * 6.0) * 6.0) * baseSpread;
        }

        // 4. Summit crown formation (creates the dramatic twin-peak shoulder)
        let peakMorph = 0;
        if (hRatio > 0.6) {
          const peakFactor = (hRatio - 0.6) / 0.4;
          peakMorph = Math.sin(angle * 2.0) * 5.2 * peakFactor;
        }

        const totalDisplacement = (areteMytikas + areteStefani + flankCrags + cliffCouloir + microCrags + coastalButtress + peakMorph) * (1.0 - hRatio * 0.4);
        const newRadius = Math.max(1.5, radius + totalDisplacement);

        pos.setX(i, Math.cos(angle) * newRadius);
        pos.setZ(i, Math.sin(angle) * newRadius);

        // Natural geological rock shelf terracing
        if (hRatio < 0.88) {
          const terrace = Math.sin(y * 0.32) * 1.1;
          pos.setY(i, y + terrace);
        }
      }
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  // Geological strata & slope-aware snow & ambient fill shader material
  const mountainMaterial = useMemo(() => {
    const rockMat = new THREE.MeshStandardMaterial({
      map: rockTexture,
      roughness: 0.88,
      metalness: 0.12,
      bumpMap: rockTexture,
      bumpScale: 1.4,
      flatShading: false
    });

    rockMat.onBeforeCompile = (shader) => {
      shader.uniforms.uSnowColor = { value: new THREE.Color('#F1F5F9') };
      shader.uniforms.uSunDir = { value: new THREE.Vector3().fromArray(CELESTIAL_THEME.sun.position).normalize() };
      shader.uniforms.uSunWarmth = { value: new THREE.Color(CELESTIAL_THEME.sun.color) };
      shader.uniforms.uShadowFill = { value: new THREE.Color('#1E293B') }; // Aegean slate-blue shadow bounce

      shader.vertexShader = `
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        ${shader.vertexShader}
      `;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `
        #include <worldpos_vertex>
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        `
      );

      shader.fragmentShader = `
        uniform vec3 uSnowColor;
        uniform vec3 uSunDir;
        uniform vec3 uSunWarmth;
        uniform vec3 uShadowFill;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        ${shader.fragmentShader}
      `;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>

        // 1. Natural alpine snow cover on high shoulders and flat surfaces
        float upNormal = max(0.0, vWorldNormal.y);
        float altitudeFactor = smoothstep(46.0, 80.0, vWorldPos.y);
        float snowMask = smoothstep(0.42, 0.72, upNormal * altitudeFactor);

        vec3 finalSnow = mix(uSnowColor, uSunWarmth, 0.14);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, finalSnow, snowMask * 0.90);

        // 2. Reflected environmental fill inside shadows (Aegean blue bounce)
        float sunDot = dot(vWorldNormal, uSunDir);
        float shadowFactor = clamp(-sunDot * 0.5 + 0.5, 0.0, 1.0);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb + uShadowFill * 0.22, shadowFactor * 0.45);

        // 3. Warm celestial rim highlight on sun-facing ridges
        float rimFactor = pow(max(0.0, sunDot), 3.0) * 0.15;
        gl_FragColor.rgb += uSunWarmth * rimFactor;
        `
      );
    };

    return rockMat;
  }, [rockTexture]);

  // Classical Summit Colonnade (10 Columns in open horseshoe perimeter)
  const columns = useMemo(() => {
    const list = [];
    const count = 10;
    const radius = 17.5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      // Leave front open for viewer/camera approach and ceremonial staircase
      if (Math.sin(angle) > 0.6) continue;
      list.push({
        id: i,
        pos: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
      });
    }
    return list;
  }, []);

  useFrame((state, delta) => {
    if (sunbeamRef.current) {
      sunbeamRef.current.rotation.y += delta * 0.04;
    }
  });

  const [mx, my, mz] = OLYMPUS_CONFIG.world.mountainPosition;
  const [px, py, pz] = OLYMPUS_CONFIG.world.sanctuaryPlatform;
  const [bx, by, bz] = OLYMPUS_CONFIG.world.beaconLightPosition;

  return (
    <group>
      {/* 1. Main Sculpted Rocky Mountain Massif */}
      <group position={[mx, my + OLYMPUS_CONFIG.world.mountainHeight / 2 - 4, mz]}>
        <mesh geometry={mountainGeo} material={mountainMaterial} receiveShadow castShadow />
      </group>

      {/* 2. Classical Greek Pantheon Summit Sanctuary (Built Into the Mountain Bedrock) */}
      <group position={[px, py, pz]}>
        {/* ============================================================== */}
        {/* CYCLOPEAN BEDROCK RETAINING FOUNDATION & BUTTRESSES             */}
        {/* ============================================================== */}
        {/* Massive Ashlar Limestone Substructure embedded in bedrock */}
        <mesh position={[0, -5.5, 0]} material={bedrockMat} receiveShadow>
          <cylinderGeometry args={[22.5, 27.0, 5.0, 32]} />
        </mesh>

        {/* 4 Radiating Rock Buttresses anchoring the platform to the mountain couloirs */}
        {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((ang, i) => (
          <mesh
            key={`buttress-${i}`}
            position={[Math.cos(ang) * 22, -6.5, Math.sin(ang) * 22]}
            rotation={[0, ang, 0.4]}
            material={bedrockMat}
            receiveShadow
          >
            <boxGeometry args={[4.5, 7.5, 9.0]} />
          </mesh>
        ))}

        {/* Tier 1: Lower Circular Dressed Marble Foundation */}
        <mesh position={[0, -2.4, 0]} receiveShadow>
          <cylinderGeometry args={[20.5, 23, 2.2, 48]} />
          <meshStandardMaterial
            map={marbleTexture}
            color="#E2E8F0"
            roughness={0.42}
            metalness={0.08}
          />
        </mesh>

        {/* Tier 2: Upper Pentelic White Marble Sanctuary Dais */}
        <mesh position={[0, -0.6, 0]} receiveShadow>
          <cylinderGeometry args={[18.5, 19.5, 1.4, 48]} />
          <meshStandardMaterial
            map={marbleTexture}
            color="#FFFFFF"
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>

        {/* ============================================================== */}
        {/* MONUMENTAL CEREMONIAL STAIRS DESCENDING TO LOWER TERRACE       */}
        {/* ============================================================== */}
        {/* Stepped ceremonial marble staircase leading south toward the approach */}
        {[0, 1, 2, 3, 4].map((step) => (
          <mesh
            key={`stair-${step}`}
            position={[0, -0.4 - step * 0.7, 18.5 + step * 2.2]}
            receiveShadow
            castShadow
          >
            <boxGeometry args={[12.5 - step * 0.6, 0.7, 2.6]} />
            <meshStandardMaterial
              map={marbleTexture}
              color="#E2E8F0"
              roughness={0.45}
              metalness={0.08}
            />
          </mesh>
        ))}

        {/* Mid-Mountain Processional Terrace (Paved Lower Temenos at y=-4.5, z=30) */}
        <mesh position={[0, -4.5, 31.0]} receiveShadow>
          <boxGeometry args={[16.0, 1.2, 8.5]} />
          <meshStandardMaterial
            map={marbleTexture}
            color="#CBD5E1"
            roughness={0.5}
            metalness={0.08}
          />
        </mesh>
        {/* Flanking Stone Parapet Balustrades */}
        <mesh position={[-8.2, -3.5, 31.0]} receiveShadow castShadow>
          <boxGeometry args={[0.8, 1.2, 8.5]} />
          <meshStandardMaterial map={marbleTexture} color="#94A3B8" roughness={0.45} />
        </mesh>
        <mesh position={[8.2, -3.5, 31.0]} receiveShadow castShadow>
          <boxGeometry args={[0.8, 1.2, 8.5]} />
          <meshStandardMaterial map={marbleTexture} color="#94A3B8" roughness={0.45} />
        </mesh>

        {/* Inlaid Weathered Bronze Frieze Band (Flush with marble floor, not glowing neon) */}
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[11.5, 12.0, 48]} />
          <meshStandardMaterial
            color="#785328"
            roughness={0.55}
            metalness={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Outer Inlaid Bronze Perimeter Band */}
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[16.8, 17.2, 48]} />
          <meshStandardMaterial
            color="#785328"
            roughness={0.55}
            metalness={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Classical Fluted Greek Marble Columns */}
        {columns.map((col) => (
          <GreekColumn
            key={col.id}
            position={col.pos}
            height={8.2}
            radius={0.52}
            marbleTexture={marbleTexture}
          />
        ))}

        {/* Central Altar with Sacred Olympian Eternal Fire */}
        <group position={[0, 0.1, 0]}>
          {/* Stepped Marble Pedestal */}
          <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.8, 2.4, 1.6, 24]} />
            <meshStandardMaterial
              map={marbleTexture}
              color="#CBD5E1"
              roughness={0.38}
              metalness={0.12}
            />
          </mesh>

          {/* Antique Gilded Bronze Brazier Bowl */}
          <mesh position={[0, 1.6, 0]} castShadow>
            <cylinderGeometry args={[2.2, 1.2, 0.8, 24]} />
            <meshStandardMaterial
              color="#92400E"
              roughness={0.4}
              metalness={0.8}
            />
          </mesh>

          {/* Sacred Olympian Living Eternal Flame */}
          <PrometheanFlame
            position={[0, 1.9, 0]}
            scale={1.35}
            flameHeight={3.0}
            flameRadius={1.05}
            lightIntensity={55}
            lightDistance={38}
          />
        </group>
      </group>

      {/* 3. Soft Crepuscular Celestial Sunbeam (Atmospheric god-ray breaking through mists) */}
      <group ref={sunbeamRef} position={[bx, by + 18, bz]}>
        <mesh>
          <cylinderGeometry args={[2.2, 14.0, 52, 24, 1, true]} />
          <meshBasicMaterial
            color={CELESTIAL_THEME.sun.color}
            transparent
            opacity={0.12}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 4. Summit Warm Celestial Ambient Fill Light */}
      <pointLight
        position={[bx, by + 8, bz]}
        color={CELESTIAL_THEME.sun.color}
        intensity={35}
        distance={55}
        decay={2}
      />
    </group>
  );
}
