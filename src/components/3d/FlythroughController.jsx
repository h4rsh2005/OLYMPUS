import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';

export default function FlythroughController({
  onComplete,
  isReplaying = false,
  freeControlsEnabled = false,
  onFreeControlsToggle
}) {
  const { camera } = useThree();
  const timelineRef = useRef(null);
  const controlsRef = useRef(null);

  const animProgress = useRef({ t: 0 });
  const [isDone, setIsDone] = useState(false);

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
    setIsDone(false);

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
      delay: 0.1,
      onComplete: () => {
        setIsDone(true);
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

  // 3. Frame update: Flythrough vs Free Orbit
  useFrame((state) => {
    const t = animProgress.current.t;

    // While flythrough timeline is actively traveling (< 1)
    if (t < 1) {
      const currentPoint = pathCurve.getPointAt(t);
      const currentTarget = targetCurve.getPointAt(t);

      // Dynamic FOV for acceleration feel
      const fovElevation = Math.sin(t * Math.PI) * (OLYMPUS_CONFIG.flythrough.maxFOV - OLYMPUS_CONFIG.flythrough.baseFOV);
      camera.fov = OLYMPUS_CONFIG.flythrough.baseFOV + fovElevation;
      camera.updateProjectionMatrix();

      camera.position.copy(currentPoint);
      camera.lookAt(currentTarget);
    }
  });

  // Target sanctuary platform coordinates for OrbitControls
  const [, py, pz] = OLYMPUS_CONFIG.world.sanctuaryPlatform;

  // Once flythrough is complete (or if user requested free controls), enable OrbitControls for full 360 drag
  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enabled={isDone || freeControlsEnabled}
        enableDamping={true}
        dampingFactor={0.06}
        rotateSpeed={0.7}
        zoomSpeed={0.85}
        panSpeed={0.6}
        minDistance={6}
        maxDistance={280}
        maxPolarAngle={Math.PI / 2 - 0.02} // Do not clip below water/ground
        minPolarAngle={0.08}
        target={[0, py + 1.5, pz]}
      />
    </>
  );
}
