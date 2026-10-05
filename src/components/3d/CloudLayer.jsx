import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';
import { createRealisticCloudTexture } from '../../utils/proceduralTextures';

/**
 * PROCEDURAL NATURAL CLOUD SYSTEM
 * 
 * Implements multi-scale cloud formations (massive atmospheric banks + medium cloud masses + fine wisps)
 * driven by the global wind field with altitude shear (differing speeds and vectors at each level).
 */

export default function CloudLayer() {
  const lowMistRef = useRef(null);
  const midCloudsRef = useRef(null);
  const highCloudsRef = useRef(null);
  const cloudBankRef = useRef(null);

  const cloudTexture = useMemo(() => createRealisticCloudTexture(512), []);

  const [mx, , mz] = OLYMPUS_CONFIG.world.mountainPosition;

  // 1. Low Sea Mist: Drifting along the Aegean water surface
  const lowMist = useMemo(() => {
    const list = [];
    const count = 36;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.sin(i * 3.7) * 0.4;
      const radius = 60 + Math.sin(i * 2.1) * 35 + Math.random() * 40;
      const alt = 2.0 + Math.random() * 7.0;
      list.push({
        id: `low-${i}`,
        pos: [mx + Math.cos(angle) * radius, alt, mz + Math.sin(angle) * radius],
        scale: [55 + Math.random() * 40, 10 + Math.random() * 8, 1],
        opacity: 0.12 + Math.random() * 0.10
      });
    }
    return list;
  }, [mx, mz]);

  // 2. Mid-Mountain Cloud Sea: Dense mountain mists draping through the couloirs
  const midClouds = useMemo(() => {
    const list = [];
    const count = 52;
    const baseAlt = OLYMPUS_CONFIG.world.cloudLayerAltitude;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.cos(i * 1.7) * 0.35;
      const radius = 42 + Math.sin(i * 2.9) * 28 + Math.random() * 32;
      const altOffset = Math.sin(i * 4.3) * 16 + (Math.random() - 0.5) * 8;

      // Sunlit dawn ivory on sunward flank vs cool mountain slate in shadow
      const sunDot = Math.cos(angle - 0.75);
      const isSunlit = sunDot > 0.1;

      list.push({
        id: `mid-${i}`,
        pos: [
          mx + Math.cos(angle) * radius,
          baseAlt + altOffset,
          mz + Math.sin(angle) * radius
        ],
        scale: [42 + Math.random() * 34, 20 + Math.random() * 16, 1],
        opacity: 0.18 + Math.random() * 0.16,
        color: isSunlit ? '#FFFBEB' : '#E2E8F0'
      });
    }
    return list;
  }, [mx, mz]);

  // 3. Massive Macro Cloud Banks: Gigantic atmospheric masses hanging behind Olympus
  const macroCloudBanks = useMemo(() => {
    const list = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 110 + Math.random() * 80;
      list.push({
        id: `macro-${i}`,
        pos: [mx + Math.cos(angle) * radius, 72 + (Math.random() - 0.5) * 20, mz + Math.sin(angle) * radius],
        scale: [120 + Math.random() * 60, 48 + Math.random() * 24, 1],
        opacity: 0.14 + Math.random() * 0.08,
        color: '#F8FAFC'
      });
    }
    return list;
  }, [mx, mz]);

  // 4. High Celestial Cirrus Wisps: Upper troposphere cirrus clouds
  const highClouds = useMemo(() => {
    const list = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (i % 2 === 0 ? 0.2 : -0.2);
      const radius = 95 + Math.random() * 110;
      list.push({
        id: `high-${i}`,
        pos: [mx + Math.cos(angle) * radius, 122 + Math.random() * 28, mz + Math.sin(angle) * radius],
        scale: [85 + Math.random() * 55, 26 + Math.random() * 14, 1],
        opacity: 0.12 + Math.random() * 0.08,
        color: '#FFF7ED'
      });
    }
    return list;
  }, [mx, mz]);

  useFrame((_, delta) => {
    const windSpeed = CELESTIAL_THEME.wind.speed;

    // Asynchronous multi-scale wind drift with altitude shear
    if (lowMistRef.current) lowMistRef.current.rotation.y += delta * 0.005 * windSpeed;
    if (midCloudsRef.current) midCloudsRef.current.rotation.y += delta * 0.011 * windSpeed;
    if (cloudBankRef.current) cloudBankRef.current.rotation.y += delta * 0.007 * windSpeed;
    // High atmospheric shear winds drift in opposing direction
    if (highCloudsRef.current) highCloudsRef.current.rotation.y -= delta * 0.014 * windSpeed;
  });

  return (
    <group>
      {/* 1. Low Sea Mist */}
      <group ref={lowMistRef}>
        {lowMist.map((c) => (
          <sprite key={c.id} position={c.pos} scale={c.scale}>
            <spriteMaterial
              map={cloudTexture}
              transparent
              opacity={c.opacity}
              depthWrite={false}
              blending={THREE.NormalBlending}
              color="#CBD5E1"
            />
          </sprite>
        ))}
      </group>

      {/* 2. Mid Mountain Cloud Sea */}
      <group ref={midCloudsRef}>
        {midClouds.map((c) => (
          <sprite key={c.id} position={c.pos} scale={c.scale}>
            <spriteMaterial
              map={cloudTexture}
              transparent
              opacity={c.opacity}
              depthWrite={false}
              blending={THREE.NormalBlending}
              color={c.color}
            />
          </sprite>
        ))}
      </group>

      {/* 3. Massive Macro Atmospheric Cloud Formations */}
      <group ref={cloudBankRef}>
        {macroCloudBanks.map((c) => (
          <sprite key={c.id} position={c.pos} scale={c.scale}>
            <spriteMaterial
              map={cloudTexture}
              transparent
              opacity={c.opacity}
              depthWrite={false}
              blending={THREE.NormalBlending}
              color={c.color}
            />
          </sprite>
        ))}
      </group>

      {/* 4. High Celestial Cirrus Clouds */}
      <group ref={highCloudsRef}>
        {highClouds.map((c) => (
          <sprite key={c.id} position={c.pos} scale={c.scale}>
            <spriteMaterial
              map={cloudTexture}
              transparent
              opacity={c.opacity}
              depthWrite={false}
              blending={THREE.NormalBlending}
              color={c.color}
            />
          </sprite>
        ))}
      </group>
    </group>
  );
}
