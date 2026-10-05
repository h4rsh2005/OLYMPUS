import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG, CELESTIAL_THEME } from '../../config/olympusConfig';
import { createRockTexture } from '../../utils/proceduralTextures';

/**
 * JÖRMUNGANDR — THE ANCIENT OLYMPIAN WORLD-SERPENT
 * 
 * Replaces the western winged dragon with an enormous mythological world-serpent
 * that coils around the entirety of Mount Olympus:
 * - Coils disappear behind the mountain, emerge from couloirs, and plunge into clouds.
 * - Non-uniform muscular cross-section (flattened shield with keeled dorsal ridge).
 * - Macro, medium, and micro scale layers aligned with the 3D curvature.
 * - Titanic prehistoric head with heavy brow ridges, deep-set eyes, and visible fangs.
 * - Ultra-slow living breathing and muscular peristalsis.
 */

// Procedural World-Serpent Scale Texture (Diamond keeled dorsal scales + banded ventral plates)
function createSerpentScalesTexture(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Deep basalt / obsidian scale base
  ctx.fillStyle = '#10161B';
  ctx.fillRect(0, 0, size, size);

  // Dorsal keeled scales (lateral regions: u < 0.36 or u > 0.64)
  const rows = 48;
  const cols = 48;
  const cellW = size / cols;
  const cellH = size / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = c / cols;
      const isBelly = u >= 0.34 && u <= 0.66;

      if (!isBelly) {
        const cx = (c + (r % 2) * 0.5) * cellW;
        const cy = r * cellH;

        const val = 18 + Math.floor(Math.sin(r * 2.3 + c * 1.8) * 6) + Math.floor(Math.random() * 6);
        ctx.fillStyle = `rgb(${val}, ${val + 5}, ${val + 8})`;

        // Diamond keeled scale
        ctx.beginPath();
        ctx.moveTo(cx, cy - cellH * 0.5);
        ctx.lineTo(cx + cellW * 0.5, cy);
        ctx.lineTo(cx, cy + cellH * 0.5);
        ctx.lineTo(cx - cellW * 0.5, cy);
        ctx.closePath();
        ctx.fill();

        // Central raised keel ridge
        ctx.strokeStyle = 'rgba(95, 125, 145, 0.28)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - cellH * 0.5);
        ctx.lineTo(cx, cy + cellH * 0.5);
        ctx.stroke();
      }
    }
  }

  // Ventral banded scutes (center belly region: u=0.34 to u=0.66)
  const bellyX = size * 0.34;
  const bellyW = size * 0.32;
  const plateCount = 64;
  const plateH = size / plateCount;

  for (let p = 0; p < plateCount; p++) {
    const py = p * plateH;
    const plateGrad = ctx.createLinearGradient(bellyX, py, bellyX + bellyW, py + plateH);
    plateGrad.addColorStop(0, '#1E2931');
    plateGrad.addColorStop(0.2, '#2C3A44');
    plateGrad.addColorStop(0.5, '#3B4D5B');
    plateGrad.addColorStop(0.8, '#2C3A44');
    plateGrad.addColorStop(1, '#1E2931');

    ctx.fillStyle = plateGrad;
    ctx.fillRect(bellyX, py, bellyW, plateH - 1.5);

    // Deep groove between plates
    ctx.fillStyle = '#080C0F';
    ctx.fillRect(bellyX, py + plateH - 2.0, bellyW, 2.0);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 28);
  tex.needsUpdate = true;
  return tex;
}

export default function Jormungandr() {
  const headGroupRef = useRef(null);
  const jawRef = useRef(null);
  const eyeLeftRef = useRef(null);
  const eyeRightRef = useRef(null);
  const coilsGroupRef = useRef(null);

  const scalesTex = useMemo(() => createSerpentScalesTexture(1024), []);
  const rockTex = useMemo(() => createRockTexture(256), []);

  const [mx, my, mz] = OLYMPUS_CONFIG.world.mountainPosition;

  // Custom Shader Material for Serpent Scales with sun rim lighting and ambient shadow detail
  const serpentMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: scalesTex,
      color: '#1A232A',
      roughness: 0.76,
      metalness: 0.22,
      bumpMap: scalesTex,
      bumpScale: 1.5,
      flatShading: false
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSunDir = { value: new THREE.Vector3().fromArray(CELESTIAL_THEME.sun.direction).normalize() };
      shader.uniforms.uSunColor = { value: new THREE.Color(CELESTIAL_THEME.sun.color) };
      shader.uniforms.uSkyBounce = { value: new THREE.Color(CELESTIAL_THEME.sun.skylightColor) };

      shader.vertexShader = `
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        ${shader.vertexShader}
      `;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `
        #include <worldpos_vertex>
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        `
      );

      shader.fragmentShader = `
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        uniform vec3 uSkyBounce;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        ${shader.fragmentShader}
      `;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>

        // Sharp sunward rim lighting catching armored scale edges
        float sunDot = dot(vWorldNormal, uSunDir);
        float rim = pow(max(0.0, sunDot), 3.5) * 0.35;
        gl_FragColor.rgb += uSunColor * rim;

        // Ambient sky bounce in shadowed couloirs to prevent black crushing
        float shadowFactor = clamp(-sunDot * 0.5 + 0.5, 0.0, 1.0);
        gl_FragColor.rgb += uSkyBounce * shadowFactor * 0.12;
        `
      );
    };

    return mat;
  }, [scalesTex]);

  const fangsMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#E8E2D0',
      roughness: 0.25,
      metalness: 0.1
    });
  }, []);

  const hornPlatesMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#0F151A',
      roughness: 0.45,
      metalness: 0.4
    });
  }, []);

  // 1. Build the Multi-Coil 3D Curve wrapping around Mount Olympus
  const { serpentCurve, spinePlates, headPos, headLookAt } = useMemo(() => {
    // 3D Path coordinates wrapping Olympus from the sea up to the high summit crags
    const rawPoints = [
      // Tail deep in the ocean scree behind the southwest base
      new THREE.Vector3(mx - 88, 6, mz + 35),
      new THREE.Vector3(mx - 74, 14, mz - 18),
      new THREE.Vector3(mx - 52, 22, mz - 65), // Disappears behind mountain
      new THREE.Vector3(mx - 15, 30, mz - 85),
      new THREE.Vector3(mx + 45, 38, mz - 78), // Re-emerges on eastern flank
      new THREE.Vector3(mx + 76, 46, mz - 35),
      new THREE.Vector3(mx + 68, 56, mz + 25), // Enormous coil sweeping south
      new THREE.Vector3(mx + 25, 65, mz + 58), // Passing in front through low clouds
      new THREE.Vector3(mx - 32, 73, mz + 45), // Dipping into western couloir
      new THREE.Vector3(mx - 62, 80, mz - 12),
      new THREE.Vector3(mx - 48, 88, mz - 58), // Climbing up behind the temple buttresses
      new THREE.Vector3(mx - 12, 94, mz - 78),
      new THREE.Vector3(mx + 26, 99, mz - 62), // High shoulder emerging
      new THREE.Vector3(mx + 35, 103, mz - 38) // Head rising above the mists
    ];

    const curve = new THREE.CatmullRomCurve3(rawPoints, false, 'centripetal', 0.5);

    // Build Macro Spine Armor Plates along the upper dorsal curve
    const plates = [];
    const sampleCount = 45;
    for (let i = 8; i < sampleCount; i++) {
      const u = i / sampleCount;
      const pt = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const binormal = new THREE.Vector3().crossVectors(normal, tangent).normalize();

      // Position plate along the dorsal top edge
      const platePos = pt.clone().add(binormal.clone().multiplyScalar(5.2));
      plates.push({
        id: i,
        pos: [platePos.x, platePos.y, platePos.z],
        rot: [tangent.z * 0.4, -Math.atan2(tangent.x, tangent.z), 0],
        scale: 0.8 + (u > 0.7 ? (1.0 - u) * 2.0 : u * 1.5)
      });
    }

    const endPoint = curve.getPointAt(1.0);
    const preEndPoint = curve.getPointAt(0.96);
    const lookDir = new THREE.Vector3().subVectors(endPoint, preEndPoint).normalize();
    const headTarget = endPoint.clone().add(lookDir.multiplyScalar(30));
    headTarget.y -= 8.0; // Looking intently down towards the approach and summit

    return {
      serpentCurve: curve,
      spinePlates: plates,
      headPos: [endPoint.x, endPoint.y, endPoint.z],
      headLookAt: headTarget
    };
  }, [mx, mz]);

  // Procedural Tube Geometry with custom tapering radius
  const tubeGeometry = useMemo(() => {
    // 160 segments along length, 24 segments around circumference, radius 5.6 units
    const geo = new THREE.TubeGeometry(serpentCurve, 160, 5.6, 24, false);
    const pos = geo.attributes.position;
    const vertex = new THREE.Vector3();

    // Taper the geometry: thicker at mid-torso (u ~ 0.6), tapering at tail (u ~ 0.0)
    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      const u = Math.floor(i / 25) / 160; // Approximate curve parameter

      // Cross-sectional flattening (shield shape)
      const taper = 0.45 + Math.sin(u * Math.PI * 0.85) * 0.75;
      vertex.y *= 0.88; // Slight flattening
      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geo.computeVertexNormals();
    return geo;
  }, [serpentCurve]);

  // Subtle living motion: ultra-slow muscular breathing & living head sway
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // Ultra-slow muscular peristaltic breathing in the coils
    if (coilsGroupRef.current) {
      const breath = Math.sin(t * 0.35) * 0.02;
      coilsGroupRef.current.scale.set(1.0 + breath, 1.0 + breath * 0.8, 1.0 + breath);
    }

    // Ancient living head sway (slow, deliberate, watchful)
    if (headGroupRef.current) {
      headGroupRef.current.rotation.y = Math.sin(t * 0.22) * 0.05;
      headGroupRef.current.rotation.x = Math.sin(t * 0.3) * 0.03;
      headGroupRef.current.position.y = headPos[1] + Math.sin(t * 0.45) * 0.6;
    }

    // Slight predatory jaw separation
    if (jawRef.current) {
      jawRef.current.rotation.x = 0.06 + Math.sin(t * 0.6) * 0.035;
    }

    // Glowing ancient golden eyes pulsating with primordial energy
    if (eyeLeftRef.current && eyeRightRef.current) {
      const eyeIntensity = 2.2 + Math.sin(t * 1.8) * 0.6;
      eyeLeftRef.current.material.emissiveIntensity = eyeIntensity;
      eyeRightRef.current.material.emissiveIntensity = eyeIntensity;
    }
  });

  return (
    <group>
      {/* ============================================================== */}
      {/* 1. ENORMOUS COILING BODY WRAPPING MOUNT OLYMPUS                */}
      {/* ============================================================== */}
      <group ref={coilsGroupRef}>
        <mesh geometry={tubeGeometry} material={serpentMaterial} receiveShadow castShadow />

        {/* Macro Armored Dorsal Plates along the Upper Coils */}
        {spinePlates.map((plate) => (
          <mesh
            key={`scute-${plate.id}`}
            position={plate.pos}
            rotation={plate.rot}
            scale={[plate.scale * 1.6, plate.scale * 2.8, plate.scale * 1.8]}
            material={hornPlatesMaterial}
            castShadow
          >
            <coneGeometry args={[1.2, 3.2, 4]} />
          </mesh>
        ))}
      </group>

      {/* ============================================================== */}
      {/* 2. TITANIC PREHISTORIC SERPENT HEAD & CRANIUM                  */}
      {/* Positioned high above the shoulder mists at headPos            */}
      {/* ============================================================== */}
      <group
        ref={headGroupRef}
        position={headPos}
        rotation={[0.15, -1.85, -0.05]}
        scale={[1.65, 1.65, 1.65]}
      >
        {/* Main Angular Cranium (Not a sphere, sculpted wedge) */}
        <mesh position={[0, 0.8, 1.5]} castShadow receiveShadow>
          <boxGeometry args={[6.8, 4.4, 9.2]} />
          <primitive object={serpentMaterial} attach="material" />
        </mesh>

        {/* Heavy Bony Brow Ridges */}
        <mesh position={[-2.4, 2.4, 2.2]} rotation={[0.15, 0.25, 0.1]} castShadow>
          <boxGeometry args={[2.2, 1.4, 4.8]} />
          <primitive object={hornPlatesMaterial} attach="material" />
        </mesh>
        <mesh position={[2.4, 2.4, 2.2]} rotation={[0.15, -0.25, -0.1]} castShadow>
          <boxGeometry args={[2.2, 1.4, 4.8]} />
          <primitive object={hornPlatesMaterial} attach="material" />
        </mesh>

        {/* Deep-Set Glowing Primordial Amber Eyes */}
        <mesh ref={eyeLeftRef} position={[-2.9, 1.8, 2.8]}>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshStandardMaterial
            color="#F59E0B"
            emissive="#D97706"
            emissiveIntensity={2.5}
            roughness={0.1}
          />
        </mesh>
        <mesh ref={eyeRightRef} position={[2.9, 1.8, 2.8]}>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshStandardMaterial
            color="#F59E0B"
            emissive="#D97706"
            emissiveIntensity={2.5}
            roughness={0.1}
          />
        </mesh>

        {/* Elongated Muscular Upper Snout / Maxilla */}
        <mesh position={[0, 0.2, 7.8]} rotation={[0.08, 0, 0]} castShadow>
          <boxGeometry args={[5.4, 3.2, 7.5]} />
          <primitive object={serpentMaterial} attach="material" />
        </mesh>

        {/* Snout Tip & Twin Pit Organs / Nostrils */}
        <mesh position={[-1.4, 1.2, 11.2]} rotation={[0.3, -0.2, 0]}>
          <boxGeometry args={[0.8, 0.6, 0.8]} />
          <primitive object={hornPlatesMaterial} attach="material" />
        </mesh>
        <mesh position={[1.4, 1.2, 11.2]} rotation={[0.3, 0.2, 0]}>
          <boxGeometry args={[0.8, 0.6, 0.8]} />
          <primitive object={hornPlatesMaterial} attach="material" />
        </mesh>

        {/* Prehistoric Massive Curved Fangs on Upper Jaw */}
        {[-1.8, -0.7, 0.7, 1.8].map((x, i) => (
          <mesh
            key={`fang-${i}`}
            position={[x, -1.4, 8.2 + Math.abs(x) * 0.6]}
            rotation={[-0.3, 0, 0]}
            material={fangsMaterial}
            castShadow
          >
            <coneGeometry args={[0.38, 2.2, 6]} />
          </mesh>
        ))}

        {/* Swept-Back Horned Crest Plates crowning the Cranium */}
        {[-2.5, 0, 2.5].map((x, i) => (
          <mesh
            key={`crest-${i}`}
            position={[x, 3.2, -1.8 - Math.abs(x) * 0.6]}
            rotation={[-0.55, (x > 0 ? -0.2 : (x < 0 ? 0.2 : 0)), 0]}
            material={hornPlatesMaterial}
            castShadow
          >
            <coneGeometry args={[0.9, 4.5, 5]} />
          </mesh>
        ))}

        {/* Articulated Massive Lower Mandible (Jaw) */}
        <group ref={jawRef} position={[0, -1.8, 2.6]}>
          <mesh position={[0, -0.4, 5.2]} rotation={[-0.04, 0, 0]} castShadow>
            <boxGeometry args={[4.8, 1.8, 8.2]} />
            <primitive object={serpentMaterial} attach="material" />
          </mesh>
          {/* Lower Jaw Teeth */}
          {[-1.4, 0, 1.4].map((x, i) => (
            <mesh
              key={`low-tooth-${i}`}
              position={[x, 0.7, 7.8]}
              rotation={[0.25, 0, 0]}
              material={fangsMaterial}
              castShadow
            >
              <coneGeometry args={[0.26, 1.4, 5]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
