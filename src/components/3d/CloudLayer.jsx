import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';
import { createRealisticCloudTexture } from '../../utils/proceduralTextures';

export default function CloudLayer() {
  const midCloudsRef = useRef(null);
  const lowMistRef = useRef(null);
  const highCloudsRef = useRef(null);

  const cloudTexture = useMemo(() => createRealisticCloudTexture(256), []);

  const [mx, , mz] = OLYMPUS_CONFIG.world.mountainPosition;

  // 1. Sea Mist Layer (Drifting low above the Aegean waters)
  const lowMist = useMemo(() => {
    const list = [];
    const count = 32;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const radius = 55 + Math.random() * 75;
      const alt = 2.5 + Math.random() * 8.0;
      list.push({
        pos: [mx + Math.cos(angle) * radius, alt, mz + Math.sin(angle) * radius],
        scale: [45 + Math.random() * 35, 12 + Math.random() * 10, 1],
        opacity: 0.14 + Math.random() * 0.12
      });
    }
    return list;
  }, [mx, mz]);

  // 2. Mid-Mountain Cloud Sea (The sacred mists of Mount Olympus)
  const midClouds = useMemo(() => {
    const list = [];
    const count = 55;
    const baseAlt = OLYMPUS_CONFIG.world.cloudLayerAltitude;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const radius = 38 + Math.random() * 52;
      const altOffset = (Math.random() - 0.5) * 22;

      // Color variation: Sunlit warm dawn ivory vs cool mountain slate
      const isSunlit = Math.cos(angle - 0.8) > 0.1;

      list.push({
        pos: [
          mx + Math.cos(angle) * radius,
          baseAlt + altOffset,
          mz + Math.sin(angle) * radius
        ],
        scale: [38 + Math.random() * 32, 22 + Math.random() * 18, 1],
        opacity: 0.22 + Math.random() * 0.18,
        color: isSunlit ? '#FFFBEB' : '#F1F5F9'
      });
    }
    return list;
  }, [mx, mz]);

  // 3. High-Altitude Celestial Cirrus
  const highClouds = useMemo(() => {
    const list = [];
    const count = 22;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 80 + Math.random() * 90;
      list.push({
        pos: [mx + Math.cos(angle) * radius, 115 + Math.random() * 25, mz + Math.sin(angle) * radius],
        scale: [70 + Math.random() * 50, 24 + Math.random() * 16, 1],
        opacity: 0.15 + Math.random() * 0.1
      });
    }
    return list;
  }, [mx, mz]);

  useFrame((_, delta) => {
    // Layered drift speeds create authentic atmospheric parallax depth
    if (midCloudsRef.current) midCloudsRef.current.rotation.y += delta * 0.014;
    if (lowMistRef.current) lowMistRef.current.rotation.y += delta * 0.007;
    if (highCloudsRef.current) highCloudsRef.current.rotation.y -= delta * 0.01;
  });

  return (
    <group>
      {/* 1. Low Sea Mist */}
      <group ref={lowMistRef}>
        {lowMist.map((c, i) => (
          <sprite key={`low-${i}`} position={c.pos} scale={c.scale}>
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
        {midClouds.map((c, i) => (
          <sprite key={`mid-${i}`} position={c.pos} scale={c.scale}>
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

      {/* 3. High Celestial Cirrus Clouds (Delicate warm ivory) */}
      <group ref={highCloudsRef}>
        {highClouds.map((c, i) => (
          <sprite key={`high-${i}`} position={c.pos} scale={c.scale}>
            <spriteMaterial
              map={cloudTexture}
              transparent
              opacity={c.opacity}
              depthWrite={false}
              blending={THREE.NormalBlending}
              color="#FFF7ED"
            />
          </sprite>
        ))}
      </group>
    </group>
  );
}
