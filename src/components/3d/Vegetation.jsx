import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';

/**
 * Pure Three.js buffer geometry merger (Zero external dependencies)
 * Concatenates position, normal, uv, and indices with pre-baked local transforms.
 */
function mergeBufferGeometries(geometries) {
  let totalPos = 0, totalNorm = 0, totalUv = 0, totalIdx = 0;
  geometries.forEach((g) => {
    totalPos += g.attributes.position.count * 3;
    if (g.attributes.normal) totalNorm += g.attributes.normal.count * 3;
    if (g.attributes.uv) totalUv += g.attributes.uv.count * 2;
    totalIdx += g.index ? g.index.count : g.attributes.position.count;
  });

  const mergedPos = new Float32Array(totalPos);
  const mergedNorm = new Float32Array(totalNorm);
  const mergedUv = new Float32Array(totalUv);
  const mergedIdx = totalPos / 3 > 65535 ? new Uint32Array(totalIdx) : new Uint16Array(totalIdx);

  let pOffset = 0, nOffset = 0, uOffset = 0, iOffset = 0, vOffset = 0;

  geometries.forEach((g) => {
    const pos = g.attributes.position;
    const norm = g.attributes.normal;
    const uv = g.attributes.uv;
    const idx = g.index;

    mergedPos.set(pos.array, pOffset);
    pOffset += pos.count * 3;

    if (norm) {
      mergedNorm.set(norm.array, nOffset);
      nOffset += norm.count * 3;
    }

    if (uv) {
      mergedUv.set(uv.array, uOffset);
      uOffset += uv.count * 2;
    }

    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        mergedIdx[iOffset + i] = idx.array[i] + vOffset;
      }
      iOffset += idx.count;
    } else {
      for (let i = 0; i < pos.count; i++) {
        mergedIdx[iOffset + i] = i + vOffset;
      }
      iOffset += pos.count;
    }
    vOffset += pos.count;
  });

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  if (totalNorm > 0) merged.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
  if (totalUv > 0) merged.setAttribute('uv', new THREE.BufferAttribute(mergedUv, 2));
  merged.setIndex(new THREE.BufferAttribute(mergedIdx, 1));
  merged.computeVertexNormals();
  return merged;
}

/**
 * Builds realistic, multi-tiered Mediterranean Cypress Foliage
 * Replaces the single geometric cone with 4 organic overlapping ruffled tiers.
 */
function createCypressCanopyGeometry() {
  // Tier 1: Lower full foliage canopy
  const t1 = new THREE.CylinderGeometry(0.72, 0.98, 1.6, 9);
  t1.translate(0, 1.4, 0);

  // Tier 2: Mid tapered foliage with slight rotation offset
  const t2 = new THREE.CylinderGeometry(0.54, 0.78, 1.6, 9);
  t2.rotateY(0.4);
  t2.translate(0, 2.7, 0);

  // Tier 3: Slender upper foliage crown
  const t3 = new THREE.ConeGeometry(0.58, 1.8, 8);
  t3.rotateY(0.9);
  t3.translate(0, 4.0, 0);

  // Tier 4: Pinnacle spire tip
  const t4 = new THREE.ConeGeometry(0.25, 1.2, 7);
  t4.translate(0, 5.0, 0);

  return mergeBufferGeometries([t1, t2, t3, t4]);
}

/**
 * Builds realistic, multi-cloud ancient Greek Olive Tree Foliage
 * Replaces the single dodecahedron with 3 overlapping cloud canopies.
 */
function createOliveCanopyGeometry() {
  const c1 = new THREE.DodecahedronGeometry(0.95, 1);
  c1.scale(1.35, 0.9, 1.25);
  c1.translate(-0.65, 2.6, 0.25);

  const c2 = new THREE.DodecahedronGeometry(1.05, 1);
  c2.scale(1.4, 0.95, 1.3);
  c2.translate(0.65, 2.8, -0.25);

  const c3 = new THREE.DodecahedronGeometry(1.15, 1);
  c3.scale(1.5, 1.0, 1.4);
  c3.translate(0.05, 3.4, 0.05);

  return mergeBufferGeometries([c1, c2, c3]);
}

/**
 * Calculate the exact mountain surface world position (X, Y, Z)
 * directly matching MountOlympus.jsx sculpted cone geometry.
 */
function getExactMountainSurfacePoint(yLocal, angle) {
  const [mx, , mz] = OLYMPUS_CONFIG.world.mountainPosition;
  const mHeight = OLYMPUS_CONFIG.world.mountainHeight; // 96
  const baseRadius = 68;

  const hRatio = (yLocal + mHeight / 2) / mHeight;
  const radius = baseRadius * (1.0 - hRatio);

  const xLocal = Math.cos(angle) * radius;
  const zLocal = Math.sin(angle) * radius;

  // Primary geological knife-edge ridges (Aretes of Olympus)
  const ridgeMytikas = Math.cos(angle * 3.0 + yLocal * 0.06) * 6.5;
  const ridgeStefani = Math.sin(angle * 5.0 - yLocal * 0.08) * 3.8;
  const subCrags = Math.cos(angle * 11.0 + yLocal * 0.15) * 1.8;

  const cliffCouloir = Math.sin(xLocal * 0.3) * Math.cos(zLocal * 0.3) * 3.2;
  const microCrags = (Math.sin(xLocal * 0.8) + Math.cos(zLocal * 0.8)) * 1.2;

  let peakMorph = 0;
  if (hRatio > 0.65) {
    const peakFactor = (hRatio - 0.65) / 0.35;
    peakMorph = Math.sin(angle * 2.0) * 4.5 * peakFactor;
  }

  const totalDisplacement = (ridgeMytikas + ridgeStefani + subCrags + cliffCouloir + microCrags + peakMorph) * (1.0 - hRatio * 0.45);
  const newRadius = Math.max(1.2, radius + totalDisplacement);

  let terrace = 0;
  if (hRatio < 0.85) {
    terrace = Math.sin(yLocal * 0.35) * 0.8;
  }

  const worldX = mx + Math.cos(angle) * newRadius;
  const worldY = 44 + yLocal + terrace;
  const worldZ = mz + Math.sin(angle) * newRadius;

  return [worldX, worldY, worldZ];
}

export default function Vegetation() {
  const groupRef = useRef(null);
  const cypressTrunkRef = useRef(null);
  const cypressFoliageRef = useRef(null);
  const oliveTrunkRef = useRef(null);
  const oliveFoliageRef = useRef(null);

  // Procedural tree placements grounded directly on the mountain mesh
  const { cypressTransforms, oliveTransforms } = useMemo(() => {
    const cTransforms = [];
    const oTransforms = [];

    // 1. Mediterranean Cypress Clusters on lower-to-mid mountain slopes
    const clusterCount = 15;
    for (let c = 0; c < clusterCount; c++) {
      const baseAngle = (c / clusterCount) * Math.PI * 2 + Math.sin(c * 2.1) * 0.3;
      const baseElevation = -40 + (c % 5) * 6;
      const countInCluster = 7 + (c % 3) * 2;

      for (let t = 0; t < countInCluster; t++) {
        const angle = baseAngle + (Math.random() - 0.5) * 0.22;
        const elevation = baseElevation + (Math.random() - 0.5) * 4.5;

        const [wx, wy, wz] = getExactMountainSurfacePoint(elevation, angle);
        if (wy < 1.5 || wy > 48) continue;

        const scaleY = 3.6 + Math.random() * 2.6;
        const scaleXZ = 0.95 + Math.random() * 0.45;

        cTransforms.push({
          pos: [wx, wy - 0.35, wz],
          scale: [scaleXZ, scaleY, scaleXZ],
          rotY: Math.random() * Math.PI * 2,
          tiltX: (Math.random() - 0.5) * 0.08,
          tiltZ: (Math.random() - 0.5) * 0.08
        });
      }
    }

    // 2. Greek Olive Trees on coastal terraces
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2 + (Math.sin(i * 1.3) * 0.15);
      const elevation = -43 + (i % 6) * 3.0 + (Math.random() - 0.5) * 2.0;

      const [wx, wy, wz] = getExactMountainSurfacePoint(elevation, angle);
      if (wy < 1.0 || wy > 28) continue;

      const scale = 2.1 + Math.random() * 1.5;

      oTransforms.push({
        pos: [wx, wy - 0.45, wz],
        scale: [scale * 1.1, scale * 0.9, scale * 1.1],
        rotY: Math.random() * Math.PI * 2,
        tiltX: (Math.random() - 0.5) * 0.12,
        tiltZ: (Math.random() - 0.5) * 0.12
      });
    }

    return { cypressTransforms: cTransforms, oliveTransforms: oTransforms };
  }, []);

  // High-Fidelity Geometries & Botanical Shaders
  const {
    cTrunkGeo,
    cFoliageGeo,
    cTrunkMat,
    cFoliageMat,
    oTrunkGeo,
    oFoliageGeo,
    oTrunkMat,
    oFoliageMat
  } = useMemo(() => {
    // 1. Cypress Cedar Bark Trunk
    const cTGeo = new THREE.CylinderGeometry(0.16, 0.28, 1.6, 7);
    cTGeo.translate(0, 0.8, 0);
    const cTMat = new THREE.MeshStandardMaterial({
      color: '#281B13',
      roughness: 0.95,
      metalness: 0.05
    });

    // 2. Cypress Multi-Tiered Evergreen Canopy
    const cFGeo = createCypressCanopyGeometry();
    const cFMat = new THREE.MeshStandardMaterial({
      color: '#163826',
      roughness: 0.78,
      metalness: 0.06,
      flatShading: true
    });

    // 3. Ancient Olive Gnarled Trunk
    const oTGeo = new THREE.CylinderGeometry(0.24, 0.46, 2.0, 7);
    oTGeo.translate(0, 1.0, 0);
    const oTMat = new THREE.MeshStandardMaterial({
      color: '#382D22',
      roughness: 0.96,
      metalness: 0.04
    });

    // 4. Olive Silvery-Sage Clustered Canopy
    const oFGeo = createOliveCanopyGeometry();
    const oFMat = new THREE.MeshStandardMaterial({
      color: '#4B6F58',
      roughness: 0.72,
      metalness: 0.08,
      flatShading: true
    });

    return {
      cTrunkGeo: cTGeo,
      cFoliageGeo: cFGeo,
      cTrunkMat: cTMat,
      cFoliageMat: cFMat,
      oTrunkGeo: oTGeo,
      oFoliageGeo: oFGeo,
      oTrunkMat: oTMat,
      oFoliageMat: oFMat
    };
  }, []);

  // Apply matrix transforms reliably in useLayoutEffect
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();

    if (cypressTrunkRef.current && cypressFoliageRef.current) {
      cypressTransforms.forEach((t, i) => {
        dummy.position.set(...t.pos);
        dummy.scale.set(...t.scale);
        dummy.rotation.set(t.tiltX, t.rotY, t.tiltZ);
        dummy.updateMatrix();
        cypressTrunkRef.current.setMatrixAt(i, dummy.matrix);
        cypressFoliageRef.current.setMatrixAt(i, dummy.matrix);
      });
      cypressTrunkRef.current.instanceMatrix.needsUpdate = true;
      cypressFoliageRef.current.instanceMatrix.needsUpdate = true;
    }

    if (oliveTrunkRef.current && oliveFoliageRef.current) {
      oliveTransforms.forEach((t, i) => {
        dummy.position.set(...t.pos);
        dummy.scale.set(...t.scale);
        dummy.rotation.set(t.tiltX, t.rotY, t.tiltZ);
        dummy.updateMatrix();
        oliveTrunkRef.current.setMatrixAt(i, dummy.matrix);
        oliveFoliageRef.current.setMatrixAt(i, dummy.matrix);
      });
      oliveTrunkRef.current.instanceMatrix.needsUpdate = true;
      oliveFoliageRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [cypressTransforms, oliveTransforms]);

  // Subtle natural wind sway
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(t * 1.1) * 0.005;
      groupRef.current.rotation.x = Math.cos(t * 0.8) * 0.004;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Mediterranean Cypresses (Trunks + Multi-Tiered Foliage) */}
      {cypressTransforms.length > 0 && (
        <>
          <instancedMesh
            ref={cypressTrunkRef}
            args={[cTrunkGeo, cTrunkMat, cypressTransforms.length]}
            castShadow
            receiveShadow
          />
          <instancedMesh
            ref={cypressFoliageRef}
            args={[cFoliageGeo, cFoliageMat, cypressTransforms.length]}
            castShadow
            receiveShadow
          />
        </>
      )}

      {/* 2. Ancient Olive Trees (Gnarled Trunks + Cloud Canopies) */}
      {oliveTransforms.length > 0 && (
        <>
          <instancedMesh
            ref={oliveTrunkRef}
            args={[oTrunkGeo, oTrunkMat, oliveTransforms.length]}
            castShadow
            receiveShadow
          />
          <instancedMesh
            ref={oliveFoliageRef}
            args={[oFoliageGeo, oFoliageMat, oliveTransforms.length]}
            castShadow
            receiveShadow
          />
        </>
      )}
    </group>
  );
}
