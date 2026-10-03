import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OLYMPUS_CONFIG } from '../../config/olympusConfig';

/**
 * JÖRMUNGANDR - The Olympian World Serpent
 * Faithfully sculpted and textured based on the user's reference image:
 * - Broad ancient reptilian skull with rounded snout and nostril ridges
 * - Curving ear crests / side fins behind the eyes
 * - Thick blanket of pure white mountain snow / frost on the head crown and dorsal spine
 * - Shaggy, dark fibrous beard hanging beneath the jaw and throat
 * - Glowing piercing golden-amber eyes
 * - Pale greenish-grey segmented ventral (belly) plates with dark transverse grooves
 * - Heavy diamond/rocky slate-teal scales on the dorsal side
 * - Majestic multi-coil wrap around Mount Olympus rising through the clouds
 */

// Procedural texture for the dorsal slate-teal scales with rocky variation
function createSerpentSkinTexture(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base deep teal-slate tone
  ctx.fillStyle = '#1D3B38';
  ctx.fillRect(0, 0, size, size);

  // Dorsal diamond rocky scales (left and right sides of texture)
  const scaleRows = 36;
  const scaleCols = 36;
  const cellW = size / scaleCols;
  const cellH = size / scaleRows;

  for (let r = 0; r < scaleRows; r++) {
    for (let c = 0; c < scaleCols; c++) {
      const u = c / scaleCols;
      // Belly is centered between u=0.38 and u=0.62
      const isBelly = u >= 0.36 && u <= 0.64;

      if (!isBelly) {
        const cx = (c + (r % 2) * 0.5) * cellW;
        const cy = r * cellH;

        // Rocky color variation (slate-teal with occasional brownish/mossy scales)
        const mossChance = Math.sin(r * 3.7 + c * 2.3);
        let fillR = 30 + Math.floor(Math.random() * 22);
        let fillG = 65 + Math.floor(Math.random() * 30);
        let fillB = 62 + Math.floor(Math.random() * 25);

        if (mossChance > 0.65) {
          // Brown/lichen patch
          fillR += 35;
          fillG += 18;
          fillB -= 10;
        }

        ctx.fillStyle = `rgb(${fillR}, ${fillG}, ${fillB})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy - cellH * 0.45);
        ctx.lineTo(cx + cellW * 0.48, cy);
        ctx.lineTo(cx, cy + cellH * 0.45);
        ctx.lineTo(cx - cellW * 0.48, cy);
        ctx.closePath();
        ctx.fill();

        // Scale rim highlight
        ctx.strokeStyle = `rgba(130, 185, 175, ${0.12 + Math.random() * 0.12})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }
    }
  }

  // Ventral (belly) banded horizontal scutes/plates (center strip: u=0.36 to u=0.64)
  const bellyStartX = size * 0.36;
  const bellyWidth = size * 0.28;
  const plateCount = 42;
  const plateHeight = size / plateCount;

  for (let p = 0; p < plateCount; p++) {
    const py = p * plateHeight;

    // Pale sage-green/lichen bone gradient for each plate
    const plateGrad = ctx.createLinearGradient(bellyStartX, py, bellyStartX + bellyWidth, py + plateHeight);
    plateGrad.addColorStop(0, '#668074');
    plateGrad.addColorStop(0.2, '#9AB2A6');
    plateGrad.addColorStop(0.5, '#AEC5BA');
    plateGrad.addColorStop(0.8, '#8FA89C');
    plateGrad.addColorStop(1, '#5C7469');

    ctx.fillStyle = plateGrad;
    ctx.fillRect(bellyStartX, py, bellyWidth, plateHeight - 1.5);

    // Dark groove between plates
    ctx.fillStyle = '#142520';
    ctx.fillRect(bellyStartX, py + plateHeight - 2.0, bellyWidth, 2.0);

    // Weathering scratches/creases across the belly plate
    ctx.strokeStyle = 'rgba(40, 60, 50, 0.4)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(bellyStartX + Math.random() * 20, py + plateHeight * 0.5);
    ctx.lineTo(bellyStartX + bellyWidth - Math.random() * 20, py + plateHeight * 0.5 + (Math.random() - 0.5) * 4);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 12);
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
  const bellyStartX = size * 0.36;
  const bellyWidth = size * 0.28;
  const plateCount = 42;
  const plateHeight = size / plateCount;

  for (let p = 0; p < plateCount; p++) {
    const py = p * plateHeight;
    ctx.fillStyle = '#B0B0B0';
    ctx.fillRect(bellyStartX, py + 1, bellyWidth, plateHeight - 3);

    ctx.fillStyle = '#202020';
    ctx.fillRect(bellyStartX, py + plateHeight - 2, bellyWidth, 2);
  }

  // Scales bump
  const scaleRows = 28;
  const scaleCols = 28;
  const cellW = size / scaleCols;
  const cellH = size / scaleRows;

  for (let r = 0; r < scaleRows; r++) {
    for (let c = 0; c < scaleCols; c++) {
      const u = c / scaleCols;
      if (u < 0.34 || u > 0.66) {
        const cx = (c + (r % 2) * 0.5) * cellW;
        const cy = r * cellH;

        const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, cellW * 0.45);
        grad.addColorStop(0, '#E0E0E0');
        grad.addColorStop(0.6, '#808080');
        grad.addColorStop(1, '#303030');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, cellW * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 12);
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

  const [mx, , mz] = OLYMPUS_CONFIG.world.mountainPosition;
  const mHeight = OLYMPUS_CONFIG.world.mountainHeight; // 96

  // 1. Helical serpent body path coiled around Mount Olympus
  const { bodyGeo, bodyMat, snowMat, headAttachPos } = useMemo(() => {
    const points = [];
    const coils = 2.4; // Coils around the mountain
    const totalPoints = 160;

    // Spiral ascending along mountain slope
    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints;
      // Start near the Aegean water (elevation -2) and spiral up to ~65% of the mountain
      const angle = t * Math.PI * 2 * coils + Math.PI * 0.4;
      const heightT = Math.pow(t, 0.95) * 0.65;
      const elev = -2 + heightT * mHeight;

      // Mountain radius decreases with height; serpent wraps just outside rock surface
      const coneRadiusAtH = 68 * (1.0 - heightT * 0.9);
      const serpentRadius = coneRadiusAtH + 3.8 + Math.sin(t * 14) * 0.8;

      const px = mx + Math.cos(angle) * serpentRadius;
      const pz = mz + Math.sin(angle) * serpentRadius;
      const py = elev;

      points.push(new THREE.Vector3(px, py, pz));
    }

    // Arching neck rising forward towards the viewer and high sanctuary
    const lastP = points[points.length - 1];
    const neckPoints = 25;
    for (let i = 1; i <= neckPoints; i++) {
      const t = i / neckPoints;
      const neckY = lastP.y + Math.sin(t * Math.PI * 0.5) * 26;
      const neckX = lastP.x + Math.sin(t * 1.2) * 14;
      const neckZ = lastP.z + t * 24; // Arch forward towards the Aegean camera angle

      points.push(new THREE.Vector3(neckX, neckY, neckZ));
    }

    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);

    // Tube geometry with 200 tubular segments
    const tubeGeo = new THREE.TubeGeometry(curve, 220, 3.8, 20, false);

    // Modulate thickness: thickest around mid-body, tapered at tail and neck
    const pos = tubeGeo.attributes.position;
    const tubularSegments = 220;
    const radialSegments = 20;

    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      // Thickness profile: starts at tail (thin), swells to huge serpent torso, narrows slightly at neck
      let thickness = 1.0;
      if (t < 0.12) {
        thickness = 0.35 + (t / 0.12) * 0.65;
      } else if (t < 0.75) {
        thickness = 1.0 + Math.sin((t - 0.12) / 0.63 * Math.PI) * 0.45;
      } else {
        thickness = 1.0 - ((t - 0.75) / 0.25) * 0.25;
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
      bumpScale: 1.6,
      roughness: 0.72,
      metalness: 0.12,
      flatShading: false
    });

    // Pure snow/frost material for the head crown and dorsal crest
    const sMat = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      roughness: 0.5,
      metalness: 0.05,
      flatShading: true
    });

    const endPoint = points[points.length - 1];
    return {
      bodyGeo: tubeGeo,
      bodyMat: bMat,
      snowMat: sMat,
      headAttachPos: [endPoint.x, endPoint.y, endPoint.z]
    };
  }, [mx, mz, mHeight]);

  // Beard fibers (hanging tendrils under lower jaw and chin)
  const beardTendrils = useMemo(() => {
    const list = [];
    const rows = 5;
    const cols = 7;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = (c - (cols - 1) / 2) * 0.75;
        const oz = (r - (rows - 1) / 2) * 1.1 + 1.5;
        const length = 4.5 + Math.random() * 4.0 - Math.abs(ox) * 0.6 + (r === 0 ? 2.5 : 0);
        const radius = 0.08 + Math.random() * 0.06;
        list.push({
          pos: [ox + (Math.random() - 0.5) * 0.2, -1.2, oz + (Math.random() - 0.5) * 0.3],
          length,
          radius,
          tiltX: 0.15 + (Math.random() - 0.5) * 0.1,
          tiltZ: (c - (cols - 1) / 2) * 0.06
        });
      }
    }
    return list;
  }, []);

  // Frame animation: undulating body breath, subtle head sway, jaw breathing, eye glow pulse
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // Body breathing
    if (bodyGroupRef.current) {
      bodyGroupRef.current.position.y = Math.sin(t * 0.6) * 0.4;
    }

    // Head breathing and living sway
    if (headGroupRef.current) {
      headGroupRef.current.position.y = headAttachPos[1] + 1.5 + Math.sin(t * 0.7) * 0.5;
      headGroupRef.current.rotation.y = -0.55 + Math.sin(t * 0.4) * 0.05;
      headGroupRef.current.rotation.z = Math.cos(t * 0.5) * 0.03;
      headGroupRef.current.rotation.x = 0.08 + Math.sin(t * 0.6) * 0.02;
    }

    // Lower jaw breathing
    if (jawRef.current) {
      jawRef.current.rotation.x = 0.04 + Math.sin(t * 0.8) * 0.03;
    }

    // Beard swaying in wind
    if (beardGroupRef.current) {
      beardGroupRef.current.rotation.x = 0.1 + Math.sin(t * 1.5) * 0.08;
      beardGroupRef.current.rotation.z = Math.cos(t * 1.2) * 0.06;
    }

    // Glowing amber eyes pulsating with ancient Olympian fire
    if (leftEyeRef.current && rightEyeRef.current) {
      const eyeIntensity = 2.2 + Math.sin(t * 2.8) * 0.8;
      leftEyeRef.current.material.emissiveIntensity = eyeIntensity;
      rightEyeRef.current.material.emissiveIntensity = eyeIntensity;
    }
  });

  return (
    <group>
      {/* 1. Serpentine Body wrapped around Olympus */}
      <group ref={bodyGroupRef}>
        <mesh geometry={bodyGeo} material={bodyMat} castShadow receiveShadow />
      </group>

      {/* 2. Detailed Head Sculpt matching User Reference Image */}
      <group
        ref={headGroupRef}
        position={[headAttachPos[0], headAttachPos[1] + 1.5, headAttachPos[2]]}
        rotation={[0.08, -0.55, 0]}
      >
        {/* Main Cranium / Skull Base */}
        <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
          <sphereGeometry args={[5.2, 20, 16]} />
          <meshStandardMaterial
            map={bodyMat.map}
            bumpMap={bodyMat.bumpMap}
            bumpScale={1.5}
            color="#264A45"
            roughness={0.7}
            metalness={0.15}
          />
        </mesh>

        {/* Broad Rounded Snout (Matching reference image) */}
        <mesh position={[0, -0.2, 5.8]} castShadow>
          <boxGeometry args={[5.6, 3.4, 6.8]} />
          <meshStandardMaterial
            map={bodyMat.map}
            bumpMap={bodyMat.bumpMap}
            bumpScale={1.4}
            color="#224540"
            roughness={0.72}
            metalness={0.12}
          />
        </mesh>

        {/* Rounded Snout Tip */}
        <mesh position={[0, -0.4, 9.0]} castShadow>
          <sphereGeometry args={[2.5, 14, 12]} />
          <meshStandardMaterial color="#1E3E3A" roughness={0.75} metalness={0.1} />
        </mesh>

        {/* Twin Nostrils on Tip of Snout */}
        <mesh position={[-1.1, 0.8, 9.2]} rotation={[0.4, -0.2, 0]}>
          <sphereGeometry args={[0.42, 8, 8]} />
          <meshStandardMaterial color="#0A1412" roughness={0.9} />
        </mesh>
        <mesh position={[1.1, 0.8, 9.2]} rotation={[0.4, 0.2, 0]}>
          <sphereGeometry args={[0.42, 8, 8]} />
          <meshStandardMaterial color="#0A1412" roughness={0.9} />
        </mesh>

        {/* Curved Ear Crests / Side Horn Fins (Distinctive feature in reference image) */}
        <mesh position={[-4.2, 2.6, -1.2]} rotation={[0.2, -0.6, 0.5]} castShadow>
          <coneGeometry args={[1.5, 4.2, 5]} />
          <meshStandardMaterial color="#1B3834" roughness={0.65} metalness={0.2} />
        </mesh>
        <mesh position={[4.2, 2.6, -1.2]} rotation={[0.2, 0.6, -0.5]} castShadow>
          <coneGeometry args={[1.5, 4.2, 5]} />
          <meshStandardMaterial color="#1B3834" roughness={0.65} metalness={0.2} />
        </mesh>

        {/* CROWN OF MOUNTAIN SNOW / FROST (Key feature from reference image) */}
        {/* Layer of pure white snow sculpted over the top of the cranium and upper snout */}
        <group position={[0, 4.2, 1.8]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[3.8, 16, 12]} />
            <meshStandardMaterial
              color="#F8FAFC"
              roughness={0.45}
              metalness={0.08}
              flatShading
            />
          </mesh>
          {/* Snow crags running forward towards snout */}
          <mesh position={[0, -0.8, 3.2]} scale={[2.8, 1.1, 3.8]} castShadow>
            <dodecahedronGeometry args={[1.2, 1]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.4} flatShading />
          </mesh>
          <mesh position={[-0.8, -0.4, 1.5]} scale={[1.8, 1.0, 2.2]} castShadow>
            <dodecahedronGeometry args={[1.0, 1]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.4} flatShading />
          </mesh>
          <mesh position={[0.8, -0.4, 1.5]} scale={[1.8, 1.0, 2.2]} castShadow>
            <dodecahedronGeometry args={[1.0, 1]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.4} flatShading />
          </mesh>
        </group>

        {/* Glowing Golden-Amber Left Eye with Brow Ridge */}
        <group position={[-2.8, 1.4, 3.8]}>
          {/* Heavy Brow Ridge */}
          <mesh position={[0, 0.8, 0]} rotation={[0.2, -0.3, 0.2]} castShadow>
            <boxGeometry args={[1.8, 0.9, 2.4]} />
            <meshStandardMaterial color="#16302C" roughness={0.8} />
          </mesh>
          {/* Deep Dark Socket */}
          <mesh>
            <sphereGeometry args={[1.1, 10, 8]} />
            <meshStandardMaterial color="#08100E" roughness={0.9} />
          </mesh>
          {/* Piercing Amber Eye */}
          <mesh ref={leftEyeRef} position={[0, 0, 0.6]}>
            <sphereGeometry args={[0.75, 14, 12]} />
            <meshStandardMaterial
              color="#FFB300"
              emissive="#FF8F00"
              emissiveIntensity={2.5}
              roughness={0.15}
              metalness={0.5}
            />
          </mesh>
          {/* Slit Pupil */}
          <mesh position={[0, 0, 1.25]}>
            <boxGeometry args={[0.12, 0.85, 0.1]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <pointLight color="#FFB300" intensity={12} distance={18} />
        </group>

        {/* Glowing Golden-Amber Right Eye with Brow Ridge */}
        <group position={[2.8, 1.4, 3.8]}>
          {/* Heavy Brow Ridge */}
          <mesh position={[0, 0.8, 0]} rotation={[0.2, 0.3, -0.2]} castShadow>
            <boxGeometry args={[1.8, 0.9, 2.4]} />
            <meshStandardMaterial color="#16302C" roughness={0.8} />
          </mesh>
          {/* Deep Dark Socket */}
          <mesh>
            <sphereGeometry args={[1.1, 10, 8]} />
            <meshStandardMaterial color="#08100E" roughness={0.9} />
          </mesh>
          {/* Piercing Amber Eye */}
          <mesh ref={rightEyeRef} position={[0, 0, 0.6]}>
            <sphereGeometry args={[0.75, 14, 12]} />
            <meshStandardMaterial
              color="#FFB300"
              emissive="#FF8F00"
              emissiveIntensity={2.5}
              roughness={0.15}
              metalness={0.5}
            />
          </mesh>
          {/* Slit Pupil */}
          <mesh position={[0, 0, 1.25]}>
            <boxGeometry args={[0.12, 0.85, 0.1]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <pointLight color="#FFB300" intensity={12} distance={18} />
        </group>

        {/* Upper Serrated Teeth Row along Mouth Line */}
        {[-2.2, -1.5, -0.8, 0, 0.8, 1.5, 2.2].map((offset, i) => (
          <mesh
            key={`upper-teeth-${i}`}
            position={[offset, -1.7, 7.8 - Math.abs(offset) * 0.4]}
            rotation={[-0.2, 0, 0]}
          >
            <coneGeometry args={[0.22, 0.85, 4]} />
            <meshStandardMaterial color="#F4EED8" roughness={0.35} metalness={0.2} />
          </mesh>
        ))}

        {/* Animated Lower Jaw & Hanging Shaggy Moss Beard */}
        <group ref={jawRef} position={[0, -2.1, 3.8]}>
          {/* Lower Jaw Bone */}
          <mesh castShadow position={[0, -0.4, 2.6]}>
            <boxGeometry args={[4.6, 1.6, 5.8]} />
            <meshStandardMaterial
              map={bodyMat.map}
              color="#1B3B36"
              roughness={0.75}
              metalness={0.1}
            />
          </mesh>

          {/* Lower Teeth Row */}
          {[-1.8, -1.0, 0, 1.0, 1.8].map((offset, i) => (
            <mesh
              key={`lower-teeth-${i}`}
              position={[offset, 0.8, 4.8 - Math.abs(offset) * 0.3]}
              rotation={[0.2, 0, 0]}
            >
              <coneGeometry args={[0.18, 0.75, 4]} />
              <meshStandardMaterial color="#F0E8D0" roughness={0.35} />
            </mesh>
          ))}

          {/* SHAGGY MOSS BEARD / TENDRILS (Exact match to reference image) */}
          <group ref={beardGroupRef} position={[0, -1.0, 1.0]}>
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
                  color="#11221D"
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
