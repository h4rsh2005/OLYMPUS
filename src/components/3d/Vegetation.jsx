import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';

/**
 * Calculate the exact mountain surface world position (X, Y, Z) and normal
 * directly using the parametric formula of MountOlympus.jsx cone geometry.
 *
 * Elevation yLocal ranges from -48 (mountain base) to +48 (peak).
 * Group offset is [mx, 44, mz].
 */
function getExactMountainSurfacePoint(yLocal, angle) {
  const [mx, , mz] = OLYMPUS_CONFIG.world.mountainPosition;
  const mHeight = OLYMPUS_CONFIG.world.mountainHeight; // 96
  const baseRadius = 68;

  // Height ratio: 0.0 at base (yLocal = -48), 1.0 at peak (yLocal = +48)
  const hRatio = (yLocal + mHeight / 2) / mHeight;

  // Base cone radius at this local height
  const radius = baseRadius * (1.0 - hRatio);

  const xLocal = Math.cos(angle) * radius;
  const zLocal = Math.sin(angle) * radius;

  // 1. Primary geological knife-edge ridges (Aretes of Olympus)
  const ridgeMytikas = Math.cos(angle * 3.0 + yLocal * 0.06) * 6.5;
  const ridgeStefani = Math.sin(angle * 5.0 - yLocal * 0.08) * 3.8;
  const subCrags = Math.cos(angle * 11.0 + yLocal * 0.15) * 1.8;

  // 2. Vertical rock face sheer cliffs & couloirs (gorges)
  const cliffCouloir = Math.sin(xLocal * 0.3) * Math.cos(zLocal * 0.3) * 3.2;
  const microCrags = (Math.sin(xLocal * 0.8) + Math.cos(zLocal * 0.8)) * 1.2;

  // 3. Multi-peak morph (only at high elevations)
  let peakMorph = 0;
  if (hRatio > 0.65) {
    const peakFactor = (hRatio - 0.65) / 0.35;
    peakMorph = Math.sin(angle * 2.0) * 4.5 * peakFactor;
  }

  const totalDisplacement = (ridgeMytikas + ridgeStefani + subCrags + cliffCouloir + microCrags + peakMorph) * (1.0 - hRatio * 0.45);
  const newRadius = Math.max(1.2, radius + totalDisplacement);

  // Terrace effect matching MountOlympus.jsx
  let terrace = 0;
  if (hRatio < 0.85) {
    terrace = Math.sin(yLocal * 0.35) * 0.8;
  }

  // Final world coordinates (mountain mesh group is at [mx, 44, mz])
  const worldX = mx + Math.cos(angle) * newRadius;
  const worldY = 44 + yLocal + terrace;
  const worldZ = mz + Math.sin(angle) * newRadius;

  return [worldX, worldY, worldZ];
}

export default function Vegetation() {
  const groupRef = useRef(null);
  const cypressRef = useRef(null);
  const olivesRef = useRef(null);

  // Procedural tree placements grounded directly on the mountain mesh
  const { cypressTransforms, oliveTransforms } = useMemo(() => {
    const cTransforms = [];
    const oTransforms = [];

    // 1. Mediterranean Cypress Clusters on lower-to-mid mountain slopes
    // yLocal ranges from -42 (just above sea level) to -10 (mid mountain)
    const clusterCount = 14;
    for (let c = 0; c < clusterCount; c++) {
      const baseAngle = (c / clusterCount) * Math.PI * 2 + Math.sin(c * 2.1) * 0.3;
      const baseElevation = -40 + (c % 5) * 6; // yLocal between -40 and -16
      const countInCluster = 6 + (c % 3) * 2;

      for (let t = 0; t < countInCluster; t++) {
        const angle = baseAngle + (Math.random() - 0.5) * 0.22;
        const elevation = baseElevation + (Math.random() - 0.5) * 4.5;

        // Calculate exact point on the mountain mesh
        const [wx, wy, wz] = getExactMountainSurfacePoint(elevation, angle);

        // Keep trees strictly between sea level (Y > 1.5) and mid-slopes (Y < 48)
        if (wy < 1.5 || wy > 48) continue;

        const scaleY = 3.8 + Math.random() * 2.8;
        const scaleXZ = 0.9 + Math.random() * 0.5;

        // Sink base of trunk 0.4 units into the rock surface so roots never hover
        cTransforms.push({
          pos: [wx, wy - 0.4, wz],
          scale: [scaleXZ, scaleY, scaleXZ],
          rotY: Math.random() * Math.PI * 2,
          tiltX: (Math.random() - 0.5) * 0.08,
          tiltZ: (Math.random() - 0.5) * 0.08
        });
      }
    }

    // 2. Greek Olive Trees & Wild Shrubs on the lower coastal terraces
    // yLocal from -44 to -26 (worldY approx 2 to 20)
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2 + (Math.sin(i * 1.3) * 0.15);
      const elevation = -43 + (i % 6) * 3.0 + (Math.random() - 0.5) * 2.0;

      const [wx, wy, wz] = getExactMountainSurfacePoint(elevation, angle);

      if (wy < 1.0 || wy > 28) continue;

      const scale = 2.0 + Math.random() * 1.6;

      // Sink slightly into slope
      oTransforms.push({
        pos: [wx, wy - 0.5, wz],
        scale: [scale * 1.15, scale * 0.85, scale * 1.15],
        rotY: Math.random() * Math.PI * 2,
        tiltX: (Math.random() - 0.5) * 0.12,
        tiltZ: (Math.random() - 0.5) * 0.12
      });
    }

    return { cypressTransforms: cTransforms, oliveTransforms: oTransforms };
  }, []);

  // Optimized Geometries & Stylized Materials
  const { cypressGeo, cypressMat, oliveGeo, oliveMat } = useMemo(() => {
    // Tall slender cypress cone (origin at base Y=0)
    const cGeo = new THREE.ConeGeometry(0.8, 3.2, 7);
    cGeo.translate(0, 1.6, 0); // shift origin to bottom of tree
    const cMat = new THREE.MeshStandardMaterial({
      color: '#153A26',
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true
    });

    // Olive shrub canopy (origin at base Y=0)
    const oGeo = new THREE.DodecahedronGeometry(1.1, 1);
    oGeo.translate(0, 0.85, 0);
    const oMat = new THREE.MeshStandardMaterial({
      color: '#284632',
      roughness: 0.86,
      metalness: 0.06,
      flatShading: true
    });

    return { cypressGeo: cGeo, cypressMat: cMat, oliveGeo: oGeo, oliveMat: oMat };
  }, []);

  // Apply matrix transforms reliably in useLayoutEffect
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();

    if (cypressRef.current) {
      cypressTransforms.forEach((t, i) => {
        dummy.position.set(...t.pos);
        dummy.scale.set(...t.scale);
        dummy.rotation.set(t.tiltX, t.rotY, t.tiltZ);
        dummy.updateMatrix();
        cypressRef.current.setMatrixAt(i, dummy.matrix);
      });
      cypressRef.current.instanceMatrix.needsUpdate = true;
    }

    if (olivesRef.current) {
      oliveTransforms.forEach((t, i) => {
        dummy.position.set(...t.pos);
        dummy.scale.set(...t.scale);
        dummy.rotation.set(t.tiltX, t.rotY, t.tiltZ);
        dummy.updateMatrix();
        olivesRef.current.setMatrixAt(i, dummy.matrix);
      });
      olivesRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [cypressTransforms, oliveTransforms]);

  // Subtle wind sway
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(t * 1.1) * 0.005;
      groupRef.current.rotation.x = Math.cos(t * 0.8) * 0.004;
    }
  });

  return (
    <group ref={groupRef}>
      {cypressTransforms.length > 0 && (
        <instancedMesh
          ref={cypressRef}
          args={[cypressGeo, cypressMat, cypressTransforms.length]}
          castShadow
          receiveShadow
        />
      )}
      {oliveTransforms.length > 0 && (
        <instancedMesh
          ref={olivesRef}
          args={[oliveGeo, oliveMat, oliveTransforms.length]}
          castShadow
          receiveShadow
        />
      )}
    </group>
  );
}
