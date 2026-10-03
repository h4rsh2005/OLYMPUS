import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CELESTIAL_THEME } from '../../config/olympusConfig';

export default function BackgroundMountains() {
  // Generate panoramic background mountain ridges
  const mountainChains = useMemo(() => {
    const chains = [];

    // Distinct mountain masses placed around the horizon (radii 180 to 320, heights 50 to 90)
    const configs = [
      // Far Left Greek Ridge
      { angle: -1.8, distance: 220, width: 220, depth: 90, height: 75, seed: 1.1 },
      // Rear Left Pierian Range
      { angle: -2.7, distance: 260, width: 260, depth: 100, height: 85, seed: 2.3 },
      // Rear Distant Horizon Spine
      { angle: 3.14, distance: 290, width: 320, depth: 110, height: 95, seed: 3.7 },
      // Rear Right Aegean Coastal Ridge
      { angle: 2.6, distance: 250, width: 240, depth: 95, height: 80, seed: 4.5 },
      // Far Right Olympus Foothills
      { angle: 1.7, distance: 210, width: 200, depth: 85, height: 70, seed: 5.2 },
      // Distant Ocean Island Peaks (south-east horizon)
      { angle: 0.8, distance: 280, width: 140, depth: 60, height: 45, seed: 6.8 },
      { angle: -0.7, distance: 270, width: 150, depth: 65, height: 50, seed: 7.4 }
    ];

    configs.forEach((cfg, idx) => {
      const segsX = 32;
      const segsY = 16;
      const geo = new THREE.PlaneGeometry(cfg.width, cfg.depth, segsX, segsY);
      const pos = geo.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i) / (cfg.width * 0.5); // -1 to 1
        const v = pos.getY(i) / (cfg.depth * 0.5); // -1 to 1

        // Ridge profile that peaks in center and tapers at edges
        const edgeFalloff = Math.cos(u * Math.PI * 0.5) * Math.cos(v * Math.PI * 0.5);
        if (edgeFalloff > 0) {
          const ridge1 = Math.sin(u * 6.0 + cfg.seed) * 0.35 + 0.65;
          const ridge2 = Math.cos(u * 12.0 - v * 4.0 + cfg.seed * 2.0) * 0.18;
          const crag = Math.sin(u * 22.0) * 0.08;
          
          const elevation = (ridge1 + ridge2 + crag) * cfg.height * edgeFalloff;
          pos.setZ(i, Math.max(0, elevation));
        } else {
          pos.setZ(i, 0);
        }
      }

      geo.computeVertexNormals();

      const posX = Math.sin(cfg.angle) * cfg.distance;
      const posZ = Math.cos(cfg.angle) * cfg.distance - 40; // slight offset toward main mountain
      const rotY = cfg.angle + Math.PI; // Face toward scene center

      chains.push({
        id: idx,
        geometry: geo,
        position: [posX, 0, posZ],
        rotation: [-Math.PI / 2, 0, rotY]
      });
    });

    return chains;
  }, []);

  return (
    <group>
      {mountainChains.map((chain) => (
        <mesh
          key={chain.id}
          geometry={chain.geometry}
          position={chain.position}
          rotation={chain.rotation}
          receiveShadow
        >
          <meshStandardMaterial
            color="#141E2E"
            roughness={0.95}
            metalness={0.08}
            flatShading={true}
          />
        </mesh>
      ))}
    </group>
  );
}
