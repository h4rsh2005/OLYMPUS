import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';

export default function FlythroughController({ onComplete, isReplaying = false }) {
  const { camera } = useThree();
  const timelineRef = useRef(null);
  
  // Progress tracker object animated by GSAP
  const animProgress = useRef({ t: 0 });
  const hasCompleted = useRef(false);

  // 1. Build CatmullRomCurve3 for camera path and target look-at points
  const { pathCurve, targetCurve } = useMemo(() => {
    const posVectors = OLYMPUS_CONFIG.flythrough.positionWaypoints.map(
      (p) => new THREE.Vector3(p[0], p[1], p[2])
    );
    const targetVectors = OLYMPUS_CONFIG.flythrough.targetWaypoints.map(
      (t) => new THREE.Vector3(t[0], t[1], t[2])
    );

    const path = new THREE.CatmullRomCurve3(posVectors, false, 'centripetal', 0.5);
    const target = new THREE.CatmullRomCurve3(targetVectors, false, 'centripetal', 0.5);

    return { pathCurve: path, targetCurve: target };
  }, []);

  // 2. Launch GSAP flythrough timeline
  useEffect(() => {
    animProgress.current.t = 0;
    hasCompleted.current = false;

    // Set initial camera position & lookAt
    const initialPos = pathCurve.getPointAt(0);
    const initialTarget = targetCurve.getPointAt(0);
    camera.position.copy(initialPos);
    camera.lookAt(initialTarget);
    camera.fov = OLYMPUS_CONFIG.flythrough.baseFOV;
    camera.updateProjectionMatrix();

    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const tl = gsap.timeline({
      delay: 0.2,
      onComplete: () => {
        hasCompleted.current = true;
        console.log("flythrough complete");
        if (onComplete) onComplete();
      }
    });

    tl.to(animProgress.current, {
      t: 1,
      duration: OLYMPUS_CONFIG.flythrough.duration,
      ease: OLYMPUS_CONFIG.flythrough.ease
    });

    timelineRef.current = tl;

    return () => {
      if (timelineRef.current) timelineRef.current.kill();
    };
  }, [camera, pathCurve, targetCurve, onComplete, isReplaying]);

  // 3. R3F useFrame 60-120fps smooth update loop
  useFrame((state) => {
    const t = Math.max(0, Math.min(1, animProgress.current.t));

    // Sample current point and target from curves
    const currentPoint = pathCurve.getPointAt(t);
    const currentTarget = targetCurve.getPointAt(t);

    if (t < 1) {
      // Dynamic FOV: Expands from 50 -> 64 at mid-flight for drone acceleration feel, then returns to 50
      const fovElevation = Math.sin(t * Math.PI) * (OLYMPUS_CONFIG.flythrough.maxFOV - OLYMPUS_CONFIG.flythrough.baseFOV);
      camera.fov = OLYMPUS_CONFIG.flythrough.baseFOV + fovElevation;
      camera.updateProjectionMatrix();

      // Update camera position & orientation
      camera.position.copy(currentPoint);
      camera.lookAt(currentTarget);
    } else {
      // Idle float & subtle breathing motion when hovering at the summit
      const time = state.clock.elapsedTime;
      const hoverY = Math.sin(time * 0.8) * 0.35;
      const hoverX = Math.cos(time * 0.6) * 0.25;

      camera.position.set(
        currentPoint.x + hoverX,
        currentPoint.y + hoverY,
        currentPoint.z
      );
      camera.lookAt(currentTarget);
    }
  });

  return null;
}
