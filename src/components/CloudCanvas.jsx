import React, { useEffect, useRef } from 'react';

/**
 * CloudCanvas Component
 * Renders multi-layered animated procedural clouds with golden sunlight diffusion,
 * ethereal volumetric mist, floating stardust particles, and mouse-parallax depth.
 * Uses direct mouse tracking in rAF (no React state re-renders).
 */
export default function CloudCanvas({ containerRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates tracked purely in memory (no React re-renders)
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Create cloud clusters across 4 parallax layers
    const layers = [
      { speed: 0.12, opacity: 0.25, blur: 50, count: 7, scale: 1.4, color: [15, 23, 42] },      // Dark midnight
      { speed: 0.25, opacity: 0.45, blur: 35, count: 9, scale: 1.1, color: [30, 41, 59] },      // Deep slate twilight
      { speed: 0.45, opacity: 0.65, blur: 25, count: 12, scale: 0.9, color: [229, 169, 60] },   // Olympian gold rimmed
      { speed: 0.70, opacity: 0.35, blur: 20, count: 8, scale: 0.7, color: [248, 250, 252] }    // Pure ethereal mist
    ];

    const clouds = [];

    layers.forEach((layer, layerIdx) => {
      for (let i = 0; i < layer.count; i++) {
        clouds.push({
          x: Math.random() * (width + 600) - 300,
          y: Math.random() * (height + 200) - 100,
          radius: (140 + Math.random() * 220) * layer.scale,
          speed: layer.speed * (0.8 + Math.random() * 0.4),
          opacity: layer.opacity * (0.8 + Math.random() * 0.4),
          layerIdx,
          color: layer.color,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.008 + Math.random() * 0.012
        });
      }
    });

    // Golden celestial embers / stardust particles
    const particles = [];
    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1 + Math.random() * 2.5,
        speedY: 0.2 + Math.random() * 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        alpha: 0.2 + Math.random() * 0.8,
        pulse: Math.random() * Math.PI * 2
      });
    }

    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // 1. Deep Celestial Gradient Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#030712');
      skyGrad.addColorStop(0.4, '#0B132B');
      skyGrad.addColorStop(0.75, '#1C2541');
      skyGrad.addColorStop(1, '#2D1B4E'); // Mythological sunset/twilight purple tone
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Divine Golden Sunburst/Godrays from Upper Center
      const sunX = width * 0.5 + mouse.x * 25;
      const sunY = height * 0.28 + mouse.y * 15;
      const sunRadius = Math.max(width, height) * 0.75;
      
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRadius);
      sunGrad.addColorStop(0, 'rgba(253, 224, 71, 0.45)');
      sunGrad.addColorStop(0.2, 'rgba(245, 158, 11, 0.25)');
      sunGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.08)');
      sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Render Clouds with Layered Depth & Parallax
      clouds.forEach((cloud) => {
        // Move cloud smoothly to the right
        cloud.x += cloud.speed;
        if (cloud.x - cloud.radius > width + 200) {
          cloud.x = -cloud.radius - 150;
          cloud.y = Math.random() * (height + 200) - 100;
        }

        cloud.pulse += cloud.pulseSpeed;
        const currentRadius = cloud.radius + Math.sin(cloud.pulse) * 15;

        // Apply mouse parallax based on layer depth
        const parallaxFactor = (cloud.layerIdx + 1) * 12;
        const drawX = cloud.x + mouse.x * parallaxFactor;
        const drawY = cloud.y + mouse.y * parallaxFactor * 0.5;

        // Create volumetric soft radial gradient for each cloud puff
        const [r, g, b] = cloud.color;
        const cloudGrad = ctx.createRadialGradient(
          drawX, drawY, currentRadius * 0.1,
          drawX, drawY, currentRadius
        );

        if (cloud.layerIdx === 2) {
          // Golden rimmed mid-cloud
          cloudGrad.addColorStop(0, `rgba(254, 240, 138, ${cloud.opacity * 0.7})`);
          cloudGrad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${cloud.opacity * 0.5})`);
          cloudGrad.addColorStop(0.8, `rgba(180, 83, 9, ${cloud.opacity * 0.15})`);
          cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else if (cloud.layerIdx === 3) {
          // Top ethereal mist
          cloudGrad.addColorStop(0, `rgba(255, 255, 255, ${cloud.opacity * 0.6})`);
          cloudGrad.addColorStop(0.5, `rgba(224, 231, 255, ${cloud.opacity * 0.25})`);
          cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          // Deep atmospheric shadow clouds
          cloudGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${cloud.opacity})`);
          cloudGrad.addColorStop(0.6, `rgba(${r * 0.8}, ${g * 0.8}, ${b * 0.8}, ${cloud.opacity * 0.4})`);
          cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        ctx.arc(drawX, drawY, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Stardust / Celestial Embers Floating Upwards
      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;
        p.pulse += 0.03;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        const alpha = Math.max(0.1, p.alpha * (0.6 + 0.4 * Math.sin(p.pulse)));

        ctx.fillStyle = `rgba(253, 224, 71, ${alpha})`;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
