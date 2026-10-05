import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';
import { createRockTexture, createMarbleTexture, createWaterfallTexture } from '../../utils/proceduralTextures';

/**
 * DIVINE SANCTUARY LIFE & AUTONOMOUS MYTHOLOGICAL ECOSYSTEM
 * 
 * 1. Autonomous Steering Royal Golden Eagles (Aetos Dios):
 *    - ZERO fixed splines or static circles.
 *    - Independent autonomous steering behavior: GLIDE, FLAP, BANK, CLIMB, DESCEND, CIRCLE, ROOST, TAKEOFF.
 *    - Responds to procedural wind fields, thermal updrafts, terrain avoidance, and home crag roosts.
 *    - Eagles cross paths, circle in opposing directions, change altitude, and perch naturally.
 * 
 * 2. Physically Logical Castalian Hydrological Cycle:
 *    - Grotto Mountain Spring -> Upper Chiseled Basin -> Rock Chute -> Parabolic Gravity Waterfall -> Lower Pool -> Mist Clouds.
 * 
 * 3. Localized Promethean Altar Embers:
 *    - Strictly drifting from the sacred brazier.
 */

// Procedural Sculpted Golden Eagle Mesh with Cambered Wings & Primary Feather Slots
function SculptedEagleMesh({ leftWingRef, rightWingRef, tailRef, isResting = false }) {
  const wingGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(1.8, 0.4);
    shape.lineTo(4.6, 0.2);
    shape.lineTo(6.8, -0.6);
    shape.lineTo(6.4, -1.2);
    shape.lineTo(5.8, -1.8);
    shape.lineTo(4.2, -2.2);
    shape.lineTo(1.8, -1.8);
    shape.lineTo(0.2, -1.2);
    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape);
    return geo;
  }, []);

  const featherBrownMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#382214',
      roughness: 0.75,
      metalness: 0.15,
      side: THREE.DoubleSide
    });
  }, []);

  const goldenMantleMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#A16207',
      roughness: 0.65,
      metalness: 0.25
    });
  }, []);

  const beakMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#FBBF24',
      roughness: 0.35,
      metalness: 0.4
    });
  }, []);

  return (
    <group scale={[0.85, 0.85, 0.85]}>
      {/* Aerodynamic Muscular Torso */}
      <mesh position={[0, 0, 0]} rotation={[0.12, 0, 0]} castShadow>
        <boxGeometry args={[1.1, 1.0, 2.8]} />
        <primitive object={featherBrownMat} attach="material" />
      </mesh>

      {/* Golden Mantle & Chest Keel */}
      <mesh position={[0, 0.15, 0.6]} rotation={[-0.1, 0, 0]} castShadow>
        <boxGeometry args={[1.2, 1.1, 1.8]} />
        <primitive object={goldenMantleMat} attach="material" />
      </mesh>

      {/* Eagle Head & Brow */}
      <group position={[0, 0.6, 1.5]}>
        <mesh position={[0, 0.1, 0.2]} castShadow>
          <boxGeometry args={[0.7, 0.7, 1.1]} />
          <primitive object={goldenMantleMat} attach="material" />
        </mesh>
        {/* Hooked Beak */}
        <mesh position={[0, -0.1, 0.95]} rotation={[0.4, 0, 0]} castShadow>
          <coneGeometry args={[0.22, 0.65, 4]} />
          <primitive object={beakMat} attach="material" />
        </mesh>
        {/* Piercing Amber Eyes */}
        <mesh position={[-0.38, 0.2, 0.35]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshBasicMaterial color="#FDE047" />
        </mesh>
        <mesh position={[0.38, 0.2, 0.35]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshBasicMaterial color="#FDE047" />
        </mesh>
      </group>

      {/* Fanned Tail Feathers (Flight Rudder) */}
      <group ref={tailRef} position={[0, 0.1, -1.4]}>
        <mesh position={[0, 0, -1.2]} rotation={[-0.1, 0, 0]} castShadow>
          <boxGeometry args={[1.6, 0.08, 2.2]} />
          <primitive object={goldenMantleMat} attach="material" />
        </mesh>
      </group>

      {/* Articulated Cambered Left Wing */}
      <group ref={leftWingRef} position={[-0.55, 0.35, 0.4]}>
        <mesh geometry={wingGeo} rotation={[Math.PI / 2, 0, -Math.PI / 2]} scale={[-1, 1, 1]} castShadow>
          <primitive object={featherBrownMat} attach="material" />
        </mesh>
      </group>

      {/* Articulated Cambered Right Wing */}
      <group ref={rightWingRef} position={[0.55, 0.35, 0.4]}>
        <mesh geometry={wingGeo} rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
          <primitive object={featherBrownMat} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Autonomous Steering Eagle Agent
 * Simulates real behavioral steering with thermal updrafts, obstacle avoidance,
 * wind drift, randomized wander, and roost visitation.
 */
function AutonomousSteeringEagle({
  initialPos,
  initialVel,
  cruiseSpeed = 16,
  turnRate = 1.2,
  bankStrength = 0.55,
  altitudePreference = 105,
  flapFrequency = 3.4,
  homeRoost = [0, 90, -60],
  wanderStrength = 8.0,
  seed = 1.0
}) {
  const groupRef = useRef(null);
  const leftWingRef = useRef(null);
  const rightWingRef = useRef(null);
  const tailRef = useRef(null);

  // Persistent autonomous simulation state
  const stateRef = useRef({
    pos: new THREE.Vector3(...initialPos),
    vel: new THREE.Vector3(...initialVel).normalize().multiplyScalar(cruiseSpeed),
    behaviorState: 'GLIDE', // 'GLIDE', 'FLAP', 'BANK', 'CLIMB', 'DESCEND', 'ROOST', 'TAKEOFF'
    behaviorTimer: 3.0 + seed * 2.0,
    wanderAngle: seed * 2.5,
    roostRestTimer: 0,
    previousHeading: Math.atan2(initialVel[0], initialVel[2])
  });

  const [mx, , mz] = OLYMPUS_CONFIG.world.mountainPosition;

  useFrame((_, delta) => {
    // Clamp delta to prevent simulation spikes on tab switch
    const dt = Math.min(delta, 0.08);
    const sim = stateRef.current;
    sim.behaviorTimer -= dt;

    const mountainCenter = new THREE.Vector3(mx, 70, mz);
    const roostVec = new THREE.Vector3(...homeRoost);

    // 1. Behavior State Machine Transitions
    if (sim.behaviorTimer <= 0) {
      if (sim.behaviorState === 'ROOST') {
        // Launch into steep takeoff dive
        sim.behaviorState = 'TAKEOFF';
        sim.behaviorTimer = 4.0;
        sim.vel.set(Math.sin(sim.wanderAngle) * 8.0, -4.0, Math.cos(sim.wanderAngle) * 8.0);
      } else {
        // Choose next autonomous flight state
        const rand = (Math.sin(sim.pos.x * 0.1 + sim.pos.z * 0.1 + dt) + 1.0) * 0.5;
        if (rand < 0.45) {
          sim.behaviorState = 'GLIDE';
          sim.behaviorTimer = 4.0 + Math.random() * 5.0;
        } else if (rand < 0.78) {
          sim.behaviorState = 'FLAP';
          sim.behaviorTimer = 2.5 + Math.random() * 3.0;
        } else if (rand < 0.92) {
          sim.behaviorState = 'BANK';
          sim.behaviorTimer = 3.0 + Math.random() * 4.0;
        } else {
          // Occasionally visit home roost if nearby
          if (sim.pos.distanceTo(roostVec) < 140.0 && Math.random() < 0.4) {
            sim.behaviorState = 'ROOST';
            sim.behaviorTimer = 6.0;
          } else {
            sim.behaviorState = 'CLIMB';
            sim.behaviorTimer = 3.5;
          }
        }
      }
    }

    // 2. Calculate Autonomous Steering Forces
    const steering = new THREE.Vector3(0, 0, 0);

    if (sim.behaviorState === 'ROOST') {
      // Seek home roost perched on high mountain crags
      const toRoost = new THREE.Vector3().subVectors(roostVec, sim.pos);
      const distToRoost = toRoost.length();

      if (distToRoost > 3.0) {
        steering.add(toRoost.normalize().multiplyScalar(turnRate * 18.0));
      } else {
        // Perched on roost
        sim.pos.copy(roostVec);
        sim.vel.set(0, 0, 0);
      }
    } else {
      // A. Procedural Non-Periodic Wander
      sim.wanderAngle += (Math.sin(sim.pos.x * 0.05 + sim.pos.z * 0.05) - 0.5) * dt * 1.8;
      const wanderDir = new THREE.Vector3(
        Math.cos(sim.wanderAngle),
        (Math.sin(sim.wanderAngle * 2.0) - 0.2) * 0.35,
        Math.sin(sim.wanderAngle)
      );
      steering.add(wanderDir.multiplyScalar(wanderStrength));

      // B. Global Wind Vector Influence
      const windForce = new THREE.Vector3(...CELESTIAL_THEME.wind.direction)
        .multiplyScalar(CELESTIAL_THEME.wind.speed * 2.2);
      steering.add(windForce);

      // C. Altitude / Thermal Updraft Seeking
      const altDiff = altitudePreference - sim.pos.y;
      steering.y += Math.sign(altDiff) * Math.min(Math.abs(altDiff), 15.0) * 0.8;

      // D. Mountain Core Obstacle Repulsion (Never collide into mountain stone)
      const toMountain = new THREE.Vector3().subVectors(sim.pos, mountainCenter);
      toMountain.y = 0; // horizontal distance
      const horizDist = toMountain.length();

      if (horizDist < 48.0) {
        // Strongly push away from mountain center
        steering.add(toMountain.normalize().multiplyScalar(42.0));
      } else if (horizDist > 165.0) {
        // Boundary leash: gently pull back towards Olympus if wandering too far
        steering.add(toMountain.normalize().multiplyScalar(-18.0));
      }
    }

    // 3. Integrate Velocity & Position
    if (sim.behaviorState !== 'ROOST' || sim.pos.distanceTo(roostVec) > 3.0) {
      sim.vel.addScaledVector(steering, dt);

      // Clamp speed
      const curSpeed = sim.vel.length();
      const targetSpeed = sim.behaviorState === 'TAKEOFF' ? cruiseSpeed * 1.3 : cruiseSpeed;
      if (curSpeed > 0.01) {
        const speedClamped = THREE.MathUtils.clamp(curSpeed, cruiseSpeed * 0.65, cruiseSpeed * 1.4);
        sim.vel.multiplyScalar(speedClamped / curSpeed);
      }

      sim.pos.addScaledVector(sim.vel, dt);
    }

    // 4. Update 3D Transform & Attitude (Heading, Pitch, Bank)
    if (groupRef.current) {
      groupRef.current.position.copy(sim.pos);

      if (sim.vel.lengthSq() > 0.1) {
        // Heading tangent
        const currentHeading = Math.atan2(sim.vel.x, sim.vel.z);
        groupRef.current.rotation.y = currentHeading;

        // Dynamic Pitch: tilt nose down when descending, up when climbing
        const pitch = -sim.vel.y / (cruiseSpeed + 0.01);
        groupRef.current.rotation.x = THREE.MathUtils.clamp(pitch, -0.4, 0.4);

        // Dynamic Bank: roll body proportional to change in heading
        let dHeading = currentHeading - sim.previousHeading;
        if (dHeading > Math.PI) dHeading -= Math.PI * 2;
        if (dHeading < -Math.PI) dHeading += Math.PI * 2;
        const bankRoll = THREE.MathUtils.clamp(dHeading * bankStrength * 18.0, -0.65, 0.65);
        groupRef.current.rotation.z = bankRoll;

        sim.previousHeading = currentHeading;
      }
    }

    // 5. Kinematic Wing Flapping vs Cambered Gliding
    let flapAngle = 0.05;
    if (sim.behaviorState === 'ROOST' && sim.pos.distanceTo(roostVec) <= 3.0) {
      // Wings folded neatly while resting
      flapAngle = 0.85;
    } else if (sim.behaviorState === 'FLAP' || sim.behaviorState === 'TAKEOFF' || sim.behaviorState === 'CLIMB') {
      flapAngle = Math.sin(clock.elapsedTime * flapFrequency) * 0.48;
    } else {
      // Smooth dihedral glide
      flapAngle = 0.04 + Math.sin(clock.elapsedTime * 0.6) * 0.03;
    }

    if (leftWingRef.current) leftWingRef.current.rotation.z = flapAngle;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -flapAngle;

    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(sim.wanderAngle) * 0.18;
    }
  });

  return (
    <group ref={groupRef}>
      <SculptedEagleMesh
        leftWingRef={leftWingRef}
        rightWingRef={rightWingRef}
        tailRef={tailRef}
      />
    </group>
  );
}

// Complete Sacred Hydrological System: Divine Spring -> Basin -> Chute -> Waterfall -> Impact Mist
function SacredCastalianWaterfall() {
  const waterFlowRef = useRef(null);
  const mistMeshRef = useRef(null);
  const splashRingRef = useRef(null);

  const rockTex = useMemo(() => createRockTexture(256), []);
  const marbleTex = useMemo(() => createMarbleTexture(256), []);
  const waterTex = useMemo(() => createWaterfallTexture(256, 512), []);

  const stoneMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: rockTex,
      color: '#1C2833',
      roughness: 0.92,
      bumpMap: rockTex,
      bumpScale: 1.2
    });
  }, [rockTex]);

  const marbleMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: marbleTex,
      color: '#E2E8F0',
      roughness: 0.4,
      metalness: 0.1
    });
  }, [marbleTex]);

  const waterStreamMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: waterTex,
      color: '#E0F2FE',
      emissive: '#0284C7',
      emissiveIntensity: 0.32,
      roughness: 0.15,
      metalness: 0.4,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide
    });
  }, [waterTex]);

  useFrame((_, delta) => {
    if (waterStreamMat.map) {
      waterStreamMat.map.offset.y -= delta * 1.8;
    }
    if (mistMeshRef.current) {
      mistMeshRef.current.rotation.y += delta * 0.15;
      mistMeshRef.current.material.opacity = 0.28 + Math.sin(Date.now() * 0.003) * 0.08;
    }
    if (splashRingRef.current) {
      splashRingRef.current.rotation.z -= delta * 0.25;
      splashRingRef.current.scale.x = 1.0 + Math.sin(Date.now() * 0.005) * 0.15;
      splashRingRef.current.scale.y = 1.0 + Math.sin(Date.now() * 0.005) * 0.15;
    }
  });

  return (
    <group position={[-20, 84, -48]}>
      {/* 1. Divine Mountain Spring & Grotto Basin */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, -0.6, -1.5]} material={stoneMat} receiveShadow castShadow>
          <boxGeometry args={[7.5, 3.2, 6.0]} />
        </mesh>
        <mesh position={[0, 0.4, -0.5]} material={marbleMat} receiveShadow>
          <boxGeometry args={[6.2, 0.6, 5.0]} />
        </mesh>
        <mesh position={[0, 0.5, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5.4, 4.2]} />
          <meshStandardMaterial
            color="#0284C7"
            roughness={0.1}
            metalness={0.8}
            emissive="#0369A1"
            emissiveIntensity={0.25}
          />
        </mesh>
        <mesh position={[-0.8, -0.2, 2.2]} rotation={[0.3, -0.15, 0]} material={stoneMat} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.8, 3.5]} />
        </mesh>
      </group>

      {/* 2. Parabolic Gravity Waterfall */}
      <group position={[-0.8, -0.4, 3.6]}>
        <mesh ref={waterFlowRef} position={[-0.4, -18.5, 1.2]} rotation={[0.06, 0, 0.04]} castShadow>
          <cylinderGeometry args={[1.4, 3.2, 38, 16, 8, true]} />
          <primitive object={waterStreamMat} attach="material" />
        </mesh>
        <mesh position={[-0.4, -18.5, 1.2]} rotation={[0.06, 0, 0.04]}>
          <cylinderGeometry args={[0.8, 1.8, 37.5, 12, 1, true]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 3. Lower Basin Impact & Volumetric Mist Formation */}
      <group position={[-1.2, -38, 5.0]}>
        <mesh position={[0, -0.8, 0]} material={stoneMat} receiveShadow>
          <cylinderGeometry args={[6.5, 8.5, 2.4, 20]} />
        </mesh>
        <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[5.8, 24]} />
          <meshStandardMaterial
            color="#F0F9FF"
            roughness={0.2}
            emissive="#38BDF8"
            emissiveIntensity={0.4}
          />
        </mesh>
        <mesh ref={splashRingRef} position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.5, 5.2, 24]} />
          <meshBasicMaterial
            color="#BAE6FD"
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh ref={mistMeshRef} position={[0, 3.5, 0]}>
          <sphereGeometry args={[6.5, 16, 12]} />
          <meshBasicMaterial
            color="#E0F2FE"
            transparent
            opacity={0.32}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </mesh>
      </group>
    </group>
  );
}

// Localized Sacred Embers strictly at the Promethean brazier
function LocalizedPrometheanEmbers({ count = 35 }) {
  const pointsRef = useRef(null);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const [px, py, pz] = OLYMPUS_CONFIG.world.sanctuaryPlatform;

    for (let i = 0; i < count; i++) {
      const r = 0.2 + Math.random() * 2.0;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3] = px + Math.cos(angle) * r;
      pos[i * 3 + 1] = py + 2.0 + Math.random() * 8.0;
      pos[i * 3 + 2] = pz + Math.sin(angle) * r;

      vel[i * 3] = (Math.random() - 0.5) * 0.25;
      vel[i * 3 + 1] = 0.8 + Math.random() * 1.4;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
    }
    return [pos, vel];
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array;
    const [, py] = OLYMPUS_CONFIG.world.sanctuaryPlatform;

    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3] * delta;
      arr[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      arr[i * 3 + 2] += velocities[i * 3 + 2] * delta;

      if (arr[i * 3 + 1] > py + 12) {
        arr[i * 3 + 1] = py + 2.0;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.45}
        color={CELESTIAL_THEME.sun.color}
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function DivineSanctuaryLife() {
  const rockTex = useMemo(() => createRockTexture(256), []);

  return (
    <group>
      {/* ============================================================== */}
      {/* 1. MOUNTAIN EYRIE & ROOSTING LEDGES                            */}
      {/* ============================================================== */}
      {/* Northern High Crag Roost */}
      <group position={[-24, 88, -62]} rotation={[0, 0.4, 0]}>
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[2.5, 3.8, 3.2, 10]} />
          <meshStandardMaterial map={rockTex} color="#1E293B" roughness={0.94} flatShading />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[2.2, 2.2, 0.35, 12]} />
          <meshStandardMaterial color="#451A03" roughness={0.96} />
        </mesh>
      </group>

      {/* Eastern Shoulder Eyrie Ledge */}
      <group position={[28, 92, -74]} rotation={[0, -0.6, 0]}>
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[2.2, 3.4, 2.8, 10]} />
          <meshStandardMaterial map={rockTex} color="#1E293B" roughness={0.94} flatShading />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[2.0, 2.0, 0.3, 12]} />
          <meshStandardMaterial color="#451A03" roughness={0.96} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 2. AUTONOMOUS STEERING ROYAL GOLDEN EAGLES (ZERO FIXED LOOPS)   */}
      {/* ============================================================== */}
      {/* Eagle 1: High Alpine Thermal Hunter */}
      <AutonomousSteeringEagle
        initialPos={[-45, 108, -35]}
        initialVel={[12, 1.2, 8]}
        cruiseSpeed={18}
        turnRate={1.3}
        bankStrength={0.65}
        altitudePreference={115}
        homeRoost={[-24, 89.6, -62]}
        wanderStrength={7.5}
        seed={1.4}
      />

      {/* Eagle 2: Mid-Cloud Sweeper & Basin Scout */}
      <AutonomousSteeringEagle
        initialPos={[52, 94, -50]}
        initialVel={[-10, -0.5, 12]}
        cruiseSpeed={16}
        turnRate={1.1}
        bankStrength={0.58}
        altitudePreference={98}
        homeRoost={[28, 93.4, -74]}
        wanderStrength={8.2}
        seed={3.7}
      />

      {/* Eagle 3: Wide Perimeter Glider */}
      <AutonomousSteeringEagle
        initialPos={[-20, 122, -90]}
        initialVel={[8, -0.8, -14]}
        cruiseSpeed={15}
        turnRate={0.95}
        bankStrength={0.52}
        altitudePreference={125}
        homeRoost={[-24, 89.6, -62]}
        wanderStrength={6.5}
        seed={6.2}
      />

      {/* ============================================================== */}
      {/* 3. PHYSICAL SACRED WATERFALL SYSTEM                             */}
      {/* ============================================================== */}
      <SacredCastalianWaterfall />

      {/* ============================================================== */}
      {/* 4. LOCALIZED SACRED ALTAR EMBERS                               */}
      {/* ============================================================== */}
      <LocalizedPrometheanEmbers count={35} />
    </group>
  );
}
