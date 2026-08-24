import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';

// High-resolution procedural soft Gaussian radial cloud texture
function createProceduralCloudTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2;

  const grad = ctx.createRadialGradient(
    centerX, centerY, 2,
    centerX, centerY, radius
  );
  
  // Smooth Gaussian alpha falloff
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.2, 'rgba(248, 250, 255, 0.65)');
  grad.addColorStop(0.45, 'rgba(235, 242, 255, 0.35)');
  grad.addColorStop(0.72, 'rgba(215, 228, 250, 0.12)');
  grad.addColorStop(0.92, 'rgba(200, 218, 245, 0.02)');
  grad.addColorStop(1.0, 'rgba(195, 212, 240, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export default function CloudLayer() {
  const groupRef = useRef(null);
  const cloudTexture = useMemo(() => createProceduralCloudTexture(), []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const cloudCount = isMobile ? 36 : 68;

  const clouds = useMemo(() => {
    const arr = [];
    const [mx, , mz] = OLYMPUS_CONFIG.world.mountainPosition;
    const baseAlt = OLYMPUS_CONFIG.world.cloudLayerAltitude;

    for (let i = 0; i < cloudCount; i++) {
      const angle = (i / cloudCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const radius = 34 + Math.random() * 44;
      const altOffset = (Math.random() - 0.5) * 28;

      arr.push({
        position: [
          mx + Math.cos(angle) * radius,
          baseAlt + altOffset,
          mz + Math.sin(angle) * radius
        ],
        scale: 26 + Math.random() * 28,
        opacity: 0.32 + Math.random() * 0.28,
        isGolden: i % 3 === 0
      });
    }
    return arr;
  }, [cloudCount]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Gentle orbital cloud drift around Mount Olympus
      groupRef.current.rotation.y += delta * 0.022;
    }
  });

  return (
    <group ref={groupRef}>
      {clouds.map((cloud, i) => (
        <sprite
          key={i}
          position={cloud.position}
          scale={[cloud.scale, cloud.scale * 0.6, 1]}
        >
          <spriteMaterial
            map={cloudTexture}
            transparent
            opacity={cloud.opacity}
            depthWrite={false}
            blending={THREE.NormalBlending}
            color={cloud.isGolden ? "#FDE047" : "#FFFFFF"}
          />
        </sprite>
      ))}
    </group>
  );
}
