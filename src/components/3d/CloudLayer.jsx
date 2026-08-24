import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';

// Procedurally generate a soft radial volumetric cloud texture in memory
function createProceduralCloudTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(
    size / 2, size / 2, 4,
    size / 2, size / 2, size / 2
  );
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.3, 'rgba(240, 244, 255, 0.7)');
  grad.addColorStop(0.65, 'rgba(215, 225, 245, 0.3)');
  grad.addColorStop(1, 'rgba(200, 215, 240, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function CloudLayer() {
  const groupRef = useRef(null);
  const cloudTexture = useMemo(() => createProceduralCloudTexture(), []);

  // Responsive cloud count
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const cloudCount = isMobile ? 32 : 64;

  const clouds = useMemo(() => {
    const arr = [];
    const [mx, , mz] = OLYMPUS_CONFIG.world.mountainPosition;
    const baseAlt = OLYMPUS_CONFIG.world.cloudLayerAltitude;

    for (let i = 0; i < cloudCount; i++) {
      // Distribute in a toroidal ring around the mountain
      const angle = (i / cloudCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const radius = 32 + Math.random() * 42;
      const altOffset = (Math.random() - 0.5) * 26;

      arr.push({
        position: [
          mx + Math.cos(angle) * radius,
          baseAlt + altOffset,
          mz + Math.sin(angle) * radius
        ],
        scale: 22 + Math.random() * 26,
        opacity: 0.35 + Math.random() * 0.3,
        rotSpeed: 0.003 + Math.random() * 0.005,
        driftPhase: Math.random() * Math.PI * 2
      });
    }
    return arr;
  }, [cloudCount]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle orbital cloud drift around Mount Olympus
      groupRef.current.rotation.y += delta * 0.025;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {clouds.map((cloud, i) => (
        <sprite
          key={i}
          position={cloud.position}
          scale={[cloud.scale, cloud.scale * 0.65, 1]}
        >
          <spriteMaterial
            map={cloudTexture}
            transparent
            opacity={cloud.opacity}
            depthWrite={false}
            blending={THREE.NormalBlending}
            color={i % 3 === 0 ? "#FDE047" : "#FFFFFF"} // subtle golden sunrise tint on select clouds
          />
        </sprite>
      ))}
    </group>
  );
}
