import React, { useEffect, useRef } from 'react';

/**
 * CustomCursor Component
 * High-performance, GPU-accelerated custom cursor with:
 * - Direct DOM manipulation via CSS translate3d (no React re-renders)
 * - requestAnimationFrame interpolation loop for smooth trailing ring
 * - pointer-events: none so clicks pass through seamlessly
 * - Complete unmount cleanup
 */
export default function CustomCursor({ containerRef }) {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Mouse positions (target and interpolated)
    const mouse = { x: -100, y: -100, targetX: -100, targetY: -100 };
    let isHoveringInteractive = false;
    let isVisible = false;
    let animFrameId = null;

    // Direct event listener (no React state updates)
    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        // Jump initial position immediately without trail
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }
    };

    const handleMouseLeave = () => {
      isVisible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    const handleMouseEnter = () => {
      isVisible = true;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    };

    // Detect hover over interactive elements (buttons, links, audio toggles)
    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.getAttribute('role') === 'button'
      ) {
        isHoveringInteractive = true;
      } else {
        isHoveringInteractive = false;
      }
    };

    const targetElement = containerRef?.current || window;
    targetElement.addEventListener('mousemove', handleMouseMove, { passive: true });
    targetElement.addEventListener('mouseleave', handleMouseLeave);
    targetElement.addEventListener('mouseenter', handleMouseEnter);
    targetElement.addEventListener('mouseover', handleMouseOver, { passive: true });

    // 60-120fps rAF Animation Loop with GPU translate3d transforms
    const render = () => {
      // Direct update for inner dot (zero lag, instant response)
      dot.style.transform = `translate3d(${mouse.targetX}px, ${mouse.targetY}px, 0) translate(-50%, -50%)`;

      // Smooth lerp for outer celestial halo ring
      const ease = 0.18;
      mouse.x += (mouse.targetX - mouse.x) * ease;
      mouse.y += (mouse.targetY - mouse.y) * ease;

      const scale = isHoveringInteractive ? 1.6 : 1.0;
      ring.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%) scale(${scale})`;

      if (isHoveringInteractive) {
        ring.style.borderColor = 'rgba(253, 224, 71, 0.95)';
        ring.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.7), inset 0 0 15px rgba(253, 224, 71, 0.4)';
        dot.style.transform += ' scale(1.4)';
      } else {
        ring.style.borderColor = 'rgba(229, 169, 60, 0.6)';
        ring.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.35)';
      }

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    // Thorough cleanup on unmount / transition out
    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      targetElement.removeEventListener('mousemove', handleMouseMove);
      targetElement.removeEventListener('mouseleave', handleMouseLeave);
      targetElement.removeEventListener('mouseenter', handleMouseEnter);
      targetElement.removeEventListener('mouseover', handleMouseOver);
    };
  }, [containerRef]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* 1. Inner celestial gold dot - instant tracking */}
      <div
        ref={dotRef}
        className="pointer-events-none absolute top-0 left-0 w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-300 to-yellow-100 opacity-0 shadow-[0_0_10px_rgba(253,224,71,1)] will-change-transform transition-opacity duration-200"
      />

      {/* 2. Outer celestial halo ring - smooth rAF trailing */}
      <div
        ref={ringRef}
        className="pointer-events-none absolute top-0 left-0 w-9 h-9 rounded-full border border-amber-400/60 opacity-0 will-change-transform transition-all duration-150 ease-out flex items-center justify-center"
      >
        {/* Subtle 4-point star ray cross inside ring */}
        <div className="w-1.5 h-1.5 border-t border-r border-amber-300/40 rotate-45" />
      </div>
    </div>
  );
}
