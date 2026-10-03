import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';

/**
 * JÖRMUNGANDR - THE OLYMPIAN WORLD SERPENT
 * Faithfully sculpted and textured based on the God of War reference image:
 * - Colossal head prominently raised above the clouds and summit plateau (visible from approach and summit)
 * - Broad ancient reptilian skull with rounded snout and flared nostril ridges
 * - Curving fan-like ear crests / lateral horn fins behind the eyes
 * - Heavy blanket of pure white mountain snow and frost capping the cranium and bridge of the snout
 * - Shaggy, dark fibrous moss/lichen beard hanging beneath the lower jaw and throat
 * - Glowing piercing golden-amber eyes with deep brow ridges and slit pupils
 * - Prehistoric ivory fangs on upper and lower jaws
 * - Pale greenish-grey segmented ventral (belly) plates with dark transverse grooves
 * - Heavy diamond/rocky slate-teal scales on the dorsal side
 * - Organic spiral wrap around Mount Olympus rising from the Aegean Sea to the summit shoulder
 * - Nostril frost vapor breath particles
 */

// Procedural texture for the dorsal slate-teal scales with rocky variation and pale ventral belly plates
function createSerpentSkinTexture(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base deep teal-slate tone
  ctx.fillStyle = '#183431';
  ctx.fillRect(0, 0, size, size);

  // Dorsal diamond rocky scales (left and right sides of texture: u < 0.35 or u > 0.65)
  const scaleRows = 40;
  const scaleCols = 40;
  const cellW = size / scaleCols;
  const cellH = size / scaleRows;

  for (let r = 0; r < scaleRows; r++) {
    for (let c = 0; c < scaleCols; c++) {
      const u = c / scaleCols;
      const isBelly = u >= 0.34 && u <= 0.66;

      if (!isBelly) {
        const cx = (c + (r % 2) * 0.5) * cellW;
        const cy = r * cellH;

        // Rocky color variation (slate-teal with occasional brownish/mossy scales)
        const mossChance = Math.sin(r * 3.7 + c * 2.3);
        let fillR = 26 + Math.floor(Math.random() * 20);
        let fillG = 58 + Math.floor(Math.random() * 26);
        let fillB = 54 + Math.floor(Math.random() * 22);

        if (mossChance > 0.6) {
          // Ancient moss/lichen patch
          fillR += 32;
          fillG += 22;
          fillB -= 8;
        }

        ctx.fillStyle = `rgb(${fillR}, ${fillG}, ${fillB})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy - cellH * 0.46);
        ctx.lineTo(cx + cellW * 0.48, cy);
        ctx.lineTo(cx, cy + cellH * 0.46);
        ctx.lineTo(cx - cellW * 0.48, cy);
        ctx.closePath();
        ctx.fill();

        // Scale rim highlight
        ctx.strokeStyle = `rgba(145, 195, 185, ${0.14 + Math.random() * 0.14})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }
  }

  // Ventral (belly) banded horizontal scutes/plates (center strip: u=0.34 to u=0.66)
  const bellyStartX = size * 0.34;
  const bellyWidth = size * 0.32;
  const plateCount = 48;
  const plateHeight = size / plateCount;

  for (let p = 0; p < plateCount; p++) {
    const py = p * plateHeight;

    // Pale sage-green/lichen bone gradient for each plate
    const plateGrad = ctx.createLinearGradient(bellyStartX, py, bellyStartX + bellyWidth, py + plateHeight);
    plateGrad.addColorStop(0, '#5C7469');
    plateGrad.addColorStop(0.18, '#94ADA1');
    plateGrad.addColorStop(0.5, '#ADC5B9');
    plateGrad.addColorStop(0.82, '#8DA599');
    plateGrad.addColorStop(1, '#536B60');

    ctx.fillStyle = plateGrad;
    ctx.fillRect(bellyStartX, py, bellyWidth, plateHeight - 1.8);

    // Dark groove between plates
    ctx.fillStyle = '#0F1E1A';
    ctx.fillRect(bellyStartX, py + plateHeight - 2.2, bellyWidth, 2.2);

    // Weathering scratches/creases across the belly plate
    ctx.strokeStyle = 'rgba(30, 48, 42, 0.45)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(bellyStartX + Math.random() * 25, py + plateHeight * 0.5);
    ctx.lineTo(bellyStartX + bellyWidth - Math.random() * 25, py + plateHeight * 0.5 + (Math.random() - 0.5) * 4);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 14);
  texture.needsUpdate = true;
  return texture;
}

// Procedural bump map for scale relief and belly plate grooves
function createSerpentBumpTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Belly plates
  const bellyStartX = size * 0.34;
  const bellyWidth = size * 0.32;
  const plateCount = 48;
  const plateHeight = size / plateCount;

  for (let p = 0; p < plateCount; p++) {
    const py = p * plateHeight;
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(bellyStartX, py + 1, bellyWidth, plateHeight - 3);

    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(bellyStartX, py + plateHeight - 2, bellyWidth, 2);
  }

  // Scales bump
  const scaleRows = 30;
  const scaleCols = 30;
  const cellW = size / scaleCols;
  const cellH = size / scaleRows;

  for (let r = 0; r < scaleRows; r++) {
    for (let c = 0; c < scaleCols; c++) {
      const u = c / scaleCols;
      if (u < 0.32 || u > 0.68) {
        const cx = (c + (r % 2) * 0.5) * cellW;
        const cy = r * cellH;

        const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, cellW * 0.45);
        grad.addColorStop(0, '#E8E8E8');
        grad.addColorStop(0.55, '#808080');
        grad.addColorStop(1, '#252525');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, cellW * 0.44, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 14);
  texture.needsUpdate = true;
  return texture;
}

export default function Jormungandr() {
  const bodyGroupRef = useRef(null);
  const headGroupRef = useRef(null);
  const jawRef = useRef(null);
  const beardGroupRef = useRef(null);
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const breathMistRef = useRef(null);

  const [mx, , mz] = OLYMPUS_CONFIG.world.mountainPosition; // [0, 0, -65]
  const mHeight = OLYMPUS_CONFIG.world.mountainHeight;       // 96

  // 1. Helical serpent body path coiled around Mount Olympus
  // Engineered so the head terminates at [30, 106, -46] - directly towering beside summit
  const { bodyGeo, bodyMat, spineSegments, headPosition, headLookTarget } = useMemo(() => {
    const points = [];
    const coils = 2.75;
    const totalPoints = 175;

    // Spiral ascending along mountain slope from Aegean water (elevation -2)
    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints;
      // Angle: spiral starts at sea level, winds around the cone
      const angle = t * Math.PI * 2 * coils + Math.PI * 0.3;
      const heightT = Math.pow(t, 0.95) * 0.78; // rises up to 78% of mountain height (elevation ~74)
      const elev = -2 + heightT * mHeight;

      // Mountain radius decreases with height
      const coneRadiusAtH = 68 * (1.0 - heightT * 0.9);
      const serpentRadius = coneRadiusAtH + 4.2 + Math.sin(t * 16) * 0.9;

      const px = mx + Math.cos(angle) * serpentRadius;
      const pz = mz + Math.sin(angle) * serpentRadius;
      const py = elev;

      points.push(new THREE.Vector3(px, py, pz));
    }

    // Now construct the towering neck that breaks out from the mountain rock
    // curves gracefully up to [30, 106, -46] on the right flank overlooking the temple
    const lastP = points[points.length - 1];
    const targetHeadPos = new THREE.Vector3(30, 106, -46);
    const neckSteps = 30;

    for (let i = 1; i <= neckSteps; i++) {
      const t = i / neckSteps;
      // S-curve interpolation for majestic serpent arch
      const smoothT = t * t * (3 - 2 * t);
      const nx = THREE.MathUtils.lerp(lastP.x, targetHeadPos.x, smoothT) + Math.sin(t * Math.PI) * 4.5;
      const ny = THREE.MathUtils.lerp(lastP.y, targetHeadPos.y, smoothT);
      const nz = THREE.MathUtils.lerp(lastP.z, targetHeadPos.z, smoothT) + Math.sin(t * Math.PI) * 3.0;

      points.push(new THREE.Vector3(nx, ny, nz));
    }

    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);

    // Tube geometry with 240 segments
    const tubularSegments = 240;
    const radialSegments = 22;
    const tubeGeo = new THREE.TubeGeometry(curve, tubularSegments, 4.4, radialSegments, false);

    // Modulate thickness: thickest at mid-body, tapered at tail, robust muscular neck
    const pos = tubeGeo.attributes.position;
    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      let thickness = 1.0;
      if (t < 0.1) {
        thickness = 0.35 + (t / 0.1) * 0.65;
      } else if (t < 0.72) {
        thickness = 1.0 + Math.sin((t - 0.1) / 0.62 * Math.PI) * 0.52;
      } else {
        // Muscular neck tapering gently towards skull
        thickness = 1.15 - ((t - 0.72) / 0.28) * 0.22;
      }

      for (let j = 0; j <= radialSegments; j++) {
        const idx = i * (radialSegments + 1) + j;
        if (idx < pos.count) {
          const centerPt = curve.getPointAt(Math.min(1.0, t));
          const vx = pos.getX(idx);
          const vy = pos.getY(idx);
          const vz = pos.getZ(idx);

          pos.setX(idx, centerPt.x + (vx - centerPt.x) * thickness);
          pos.setY(idx, centerPt.y + (vy - centerPt.y) * thickness);
          pos.setZ(idx, centerPt.z + (vz - centerPt.z) * thickness);
        }
      }
    }
    tubeGeo.computeVertexNormals();

    const skinTex = createSerpentSkinTexture(1024);
    const bumpTex = createSerpentBumpTexture(512);

    const bMat = new THREE.MeshStandardMaterial({
      map: skinTex,
      bumpMap: bumpTex,
      bumpScale: 1.8,
      roughness: 0.72,
      metalness: 0.15,
      flatShading: false
    });

    // Compute dorsal spine ridges along upper neck
    const spines = [];
    for (let i = tubularSegments - 45; i < tubularSegments - 3; i += 3) {
      const t = i / tubularSegments;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      // Upward dorsal normal vector
      const up = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

      const spinePos = pt.clone().add(normal.clone().multiplyScalar(4.0));
      spines.push({
        pos: [spinePos.x, spinePos.y, spinePos.z],
        rot: [tangent.z, 0, -tangent.x],
        scale: 0.8 + Math.sin(t * Math.PI) * 0.6
      });
    }

    const endPoint = points[points.length - 1];
    // Head looks towards the summit sanctuary [0, 95.5, -68]
    const lookTarget = new THREE.Vector3(0, 95.5, -68);

    return {
      bodyGeo: tubeGeo,
      bodyMat: bMat,
      spineSegments: spines,
      headPosition: [endPoint.x, endPoint.y, endPoint.z],
      headLookTarget: lookTarget
    };
  }, [mx, mz, mHeight]);

  // Beard fibers (hanging shaggy tendrils under lower jaw and chin)
  const beardTendrils = useMemo(() => {
    const list = [];
    const rows = 6;
    const cols = 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = (c - (cols - 1) / 2) * 0.9;
        const oz = (r - (rows - 1) / 2) * 1.3 + 1.8;
        const length = 5.5 + Math.random() * 5.0 - Math.abs(ox) * 0.6 + (r === 0 ? 3.0 : 0);
        const radius = 0.10 + Math.random() * 0.08;
        list.push({
          pos: [ox + (Math.random() - 0.5) * 0.25, -1.4, oz + (Math.random() - 0.5) * 0.35],
          length,
          radius,
          tiltX: 0.18 + (Math.random() - 0.5) * 0.12,
          tiltZ: (c - (cols - 1) / 2) * 0.08
        });
      }
    }
    return list;
  }, []);

  // Frame animation: undulating body breath, majestic living head sway, jaw breathing, eye glow pulse
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // Body breathing undulation
    if (bodyGroupRef.current) {
      bodyGroupRef.current.position.y = Math.sin(t * 0.55) * 0.45;
    }

    // Head breathing and living sway in mountain wind
    if (headGroupRef.current) {
      headGroupRef.current.position.y = headPosition[1] + Math.sin(t * 0.65) * 0.6;
      headGroupRef.current.rotation.y = -2.15 + Math.sin(t * 0.4) * 0.06;
      headGroupRef.current.rotation.x = 0.22 + Math.sin(t * 0.5) * 0.03;
      headGroupRef.current.rotation.z = -0.1 + Math.cos(t * 0.45) * 0.025;
    }

    // Lower jaw breathing
    if (jawRef.current) {
      jawRef.current.rotation.x = 0.06 + Math.sin(t * 0.75) * 0.04;
    }

    // Beard swaying in alpine wind
    if (beardGroupRef.current) {
      beardGroupRef.current.rotation.x = 0.12 + Math.sin(t * 1.4) * 0.1;
      beardGroupRef.current.rotation.z = Math.cos(t * 1.1) * 0.08;
    }

    // Glowing amber eyes pulsating with ancient divine fire
    if (leftEyeRef.current && rightEyeRef.current) {
      const eyeIntensity = 2.8 + Math.sin(t * 2.5) * 0.9;
      leftEyeRef.current.material.emissiveIntensity = eyeIntensity;
      rightEyeRef.current.material.emissiveIntensity = eyeIntensity;
    }

    // Nostril frost breath vapor pulsing
    if (breathMistRef.current) {
      const mistScale = 1.0 + Math.sin(t * 1.5) * 0.35;
      breathMistRef.current.scale.set(mistScale, mistScale, mistScale);
      breathMistRef.current.material.opacity = 0.28 + Math.sin(t * 1.5) * 0.15;
    }
  });

  return (
    <group>
      {/* 1. Serpentine Body wrapped around Mount Olympus */}
      <group ref={bodyGroupRef}>
        <mesh geometry={bodyGeo} material={bodyMat} castShadow receiveShadow />

        {/* Dorsal Spine Ridges along Upper Neck */}
        {spineSegments.map((s, idx) => (
          <mesh
            key={`spine-${idx}`}
            position={s.pos}
            rotation={s.rot}
            scale={[s.scale, s.scale * 1.5, s.scale]}
            castShadow
          >
            <coneGeometry args={[0.8, 2.8, 4]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.4} flatShading />
          </mesh>
        ))}
      </group>

      {/* 2. TITANIC, HYPER-REALISTIC HEAD SCULPT (Towering at [30, 106, -46]) */}
      <group
        ref={headGroupRef}
        position={[headPosition[0], headPosition[1], headPosition[2]]}
        rotation={[0.22, -2.15, -0.1]}
        scale={[1.4, 1.4, 1.4]}
      >
        {/* Main Cranium / Skull Base */}
        <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
          <sphereGeometry args={[5.8, 24, 20]} />
          <meshStandardMaterial
            map={bodyMat.map}
            bumpMap={bodyMat.bumpMap}
            bumpScale={1.6}
            color="#254A44"
            roughness={0.7}
            metalness={0.15}
          />
        </mesh>

        {/* Broad Rounded Snout (God of War Reference Match) */}
        <mesh position={[0, -0.2, 6.4]} castShadow>
          <boxGeometry args={[6.2, 3.8, 7.5]} />
          <meshStandardMaterial
            map={bodyMat.map}
            bumpMap={bodyMat.bumpMap}
            bumpScale={1.5}
            color="#20443F"
            roughness={0.72}
            metalness={0.12}
          />
        </mesh>

        {/* Rounded Snout Tip */}
        <mesh position={[0, -0.4, 10.0]} castShadow>
          <sphereGeometry args={[2.9, 16, 14]} />
          <meshStandardMaterial color="#1B3D38" roughness={0.75} metalness={0.1} />
        </mesh>

        {/* Twin Nostrils on Tip of Snout */}
        <mesh position={[-1.3, 1.0, 10.2]} rotation={[0.4, -0.2, 0]}>
          <sphereGeometry args={[0.5, 10, 10]} />
          <meshStandardMaterial color="#0A1613" roughness={0.9} />
        </mesh>
        <mesh position={[1.3, 1.0, 10.2]} rotation={[0.4, 0.2, 0]}>
          <sphereGeometry args={[0.5, 10, 10]} />
          <meshStandardMaterial color="#0A1613" roughness={0.9} />
        </mesh>

        {/* Nostril Frost Mist Vapor Particles */}
        <mesh ref={breathMistRef} position={[0, 0.6, 12.5]}>
          <sphereGeometry args={[1.8, 12, 12]} />
          <meshBasicMaterial color="#E0F2FE" transparent opacity={0.35} />
        </mesh>

        {/* Flaring Ear Crests / Lateral Horn Fins (Signature feature from reference image) */}
        <group position={[-5.0, 3.0, -1.5]} rotation={[0.2, -0.65, 0.55]}>
          <mesh castShadow>
            <coneGeometry args={[1.8, 5.2, 6]} />
            <meshStandardMaterial color="#193833" roughness={0.65} metalness={0.2} />
          </mesh>
          {/* Ear crest cartilage ribs */}
          <mesh position={[0.6, 0.2, 0.2]} rotation={[0, 0, 0.3]} castShadow>
            <coneGeometry args={[0.7, 4.0, 5]} />
            <meshStandardMaterial color="#2B544D" roughness={0.6} />
          </mesh>
        </group>

        <group position={[5.0, 3.0, -1.5]} rotation={[0.2, 0.65, -0.55]}>
          <mesh castShadow>
            <coneGeometry args={[1.8, 5.2, 6]} />
            <meshStandardMaterial color="#193833" roughness={0.65} metalness={0.2} />
          </mesh>
          {/* Ear crest cartilage ribs */}
          <mesh position={[-0.6, 0.2, 0.2]} rotation={[0, 0, -0.3]} castShadow>
            <coneGeometry args={[0.7, 4.0, 5]} />
            <meshStandardMaterial color="#2B544D" roughness={0.6} />
          </mesh>
        </group>

        {/* CROWN OF MOUNTAIN SNOW / FROST (Exact match to reference image) */}
        {/* Thick layer of pure white mountain snow sculpted over cranium & snout */}
        <group position={[0, 4.8, 2.2]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[4.4, 20, 16]} />
            <meshStandardMaterial
              color="#F8FAFC"
              roughness={0.4}
              metalness={0.08}
              flatShading
            />
          </mesh>
          {/* Snow crags running forward towards snout */}
          <mesh position={[0, -0.9, 3.8]} scale={[3.2, 1.3, 4.4]} castShadow>
            <dodecahedronGeometry args={[1.3, 1]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.35} flatShading />
          </mesh>
          <mesh position={[-1.0, -0.5, 1.8]} scale={[2.0, 1.2, 2.6]} castShadow>
            <dodecahedronGeometry args={[1.1, 1]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.35} flatShading />
          </mesh>
          <mesh position={[1.0, -0.5, 1.8]} scale={[2.0, 1.2, 2.6]} castShadow>
            <dodecahedronGeometry args={[1.1, 1]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.35} flatShading />
          </mesh>
        </group>

        {/* Glowing Golden-Amber Left Eye with Brow Ridge */}
        <group position={[-3.2, 1.6, 4.2]}>
          {/* Heavy Brow Ridge */}
          <mesh position={[0, 0.9, 0]} rotation={[0.2, -0.3, 0.2]} castShadow>
            <boxGeometry args={[2.0, 1.0, 2.6]} />
            <meshStandardMaterial color="#142E29" roughness={0.8} />
          </mesh>
          {/* Deep Dark Socket */}
          <mesh>
            <sphereGeometry args={[1.2, 12, 10]} />
            <meshStandardMaterial color="#06100D" roughness={0.9} />
          </mesh>
          {/* Piercing Amber Eye */}
          <mesh ref={leftEyeRef} position={[0, 0, 0.7]}>
            <sphereGeometry args={[0.85, 16, 14]} />
            <meshStandardMaterial
              color="#FFB300"
              emissive="#FF8F00"
              emissiveIntensity={2.8}
              roughness={0.12}
              metalness={0.5}
            />
          </mesh>
          {/* Slit Pupil */}
          <mesh position={[0, 0, 1.45]}>
            <boxGeometry args={[0.14, 0.95, 0.1]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <pointLight color="#FFB300" intensity={18} distance={24} />
        </group>

        {/* Glowing Golden-Amber Right Eye with Brow Ridge */}
        <group position={[3.2, 1.6, 4.2]}>
          {/* Heavy Brow Ridge */}
          <mesh position={[0, 0.9, 0]} rotation={[0.2, 0.3, -0.2]} castShadow>
            <boxGeometry args={[2.0, 1.0, 2.6]} />
            <meshStandardMaterial color="#142E29" roughness={0.8} />
          </mesh>
          {/* Deep Dark Socket */}
          <mesh>
            <sphereGeometry args={[1.2, 12, 10]} />
            <meshStandardMaterial color="#06100D" roughness={0.9} />
          </mesh>
          {/* Piercing Amber Eye */}
          <mesh ref={rightEyeRef} position={[0, 0, 0.7]}>
            <sphereGeometry args={[0.85, 16, 14]} />
            <meshStandardMaterial
              color="#FFB300"
              emissive="#FF8F00"
              emissiveIntensity={2.8}
              roughness={0.12}
              metalness={0.5}
            />
          </mesh>
          {/* Slit Pupil */}
          <mesh position={[0, 0, 1.45]}>
            <boxGeometry args={[0.14, 0.95, 0.1]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <pointLight color="#FFB300" intensity={18} distance={24} />
        </group>

        {/* Upper Serrated Teeth Row along Mouth Line */}
        {[-2.5, -1.7, -0.9, 0, 0.9, 1.7, 2.5].map((offset, i) => (
          <mesh
            key={`upper-teeth-${i}`}
            position={[offset, -1.9, 8.6 - Math.abs(offset) * 0.45]}
            rotation={[-0.2, 0, 0]}
          >
            <coneGeometry args={[0.26, 1.0, 4]} />
            <meshStandardMaterial color="#F4EED8" roughness={0.35} metalness={0.2} />
          </mesh>
        ))}

        {/* Animated Lower Jaw & Hanging Shaggy Moss Beard */}
        <group ref={jawRef} position={[0, -2.4, 4.2]}>
          {/* Lower Jaw Bone */}
          <mesh castShadow position={[0, -0.5, 2.8]}>
            <boxGeometry args={[5.2, 1.8, 6.5]} />
            <meshStandardMaterial
              map={bodyMat.map}
              color="#193B35"
              roughness={0.75}
              metalness={0.1}
            />
          </mesh>

          {/* Lower Teeth Row */}
          {[-2.0, -1.1, 0, 1.1, 2.0].map((offset, i) => (
            <mesh
              key={`lower-teeth-${i}`}
              position={[offset, 0.9, 5.4 - Math.abs(offset) * 0.35]}
              rotation={[0.2, 0, 0]}
            >
              <coneGeometry args={[0.22, 0.9, 4]} />
              <meshStandardMaterial color="#F0E8D0" roughness={0.35} />
            </mesh>
          ))}

          {/* SHAGGY MOSS BEARD / TENDRILS (Exact match to reference image) */}
          <group ref={beardGroupRef} position={[0, -1.2, 1.2]}>
            {beardTendrils.map((tendril, idx) => (
              <mesh
                key={`tendril-${idx}`}
                position={tendril.pos}
                rotation={[tendril.tiltX, 0, tendril.tiltZ]}
                castShadow
              >
                <cylinderGeometry
                  args={[tendril.radius * 0.6, tendril.radius, tendril.length, 5]}
                />
                <meshStandardMaterial
                  color="#0F201B"
                  roughness={0.92}
                  metalness={0.04}
                  flatShading
                />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}
