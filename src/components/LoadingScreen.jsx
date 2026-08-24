import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Volume2, VolumeX, Sparkles, Compass } from 'lucide-react';
import CloudCanvas from './CloudCanvas';
import CustomCursor from './CustomCursor';
import { GreekCorner, OlympusSigil, LaurelWreath } from './GreekDecorations';
import { OLYMPUS_CONFIG } from '../config/olympusConfig';
import { soundFX } from '../utils/audio';

export default function LoadingScreen({ onEnter, externalProgress = null }) {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const containerRef = useRef(null);
  const hudRef = useRef(null);
  const buttonRef = useRef(null);
  const flashRef = useRef(null);

  // Smooth loading progression
  useEffect(() => {
    if (externalProgress !== null) {
      setProgress(Math.min(100, Math.floor(externalProgress)));
      if (externalProgress >= 100 && !isLoaded) {
        setIsLoaded(true);
        soundFX.playChime(3, 0.2);
      }
      return;
    }

    // High-fidelity game-style loading progression
    let current = 0;
    const interval = setInterval(() => {
      const increment = Math.random() * (current > 75 ? 4 : current > 40 ? 6 : 9);
      current = Math.min(100, current + increment);
      
      setProgress(Math.floor(current));

      // Update quote milestones
      if (current >= 85) setQuoteIndex(4);
      else if (current >= 65) setQuoteIndex(3);
      else if (current >= 45) setQuoteIndex(2);
      else if (current >= 20) setQuoteIndex(1);
      else setQuoteIndex(0);

      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoaded(true);
          soundFX.playChime(4, 0.25);
        }, 300);
      }
    }, 90);

    return () => clearInterval(interval);
  }, [externalProgress, isLoaded]);

  // Handle "Ascend to Olympus" click with GSAP cinematic exit
  const handleEnterClick = (e) => {
    e.stopPropagation();
    soundFX.playEnterChord();

    const tl = gsap.timeline({
      onComplete: () => {
        if (onEnter) onEnter();
      }
    });

    // 1. Divine flash expands
    tl.to(flashRef.current, {
      opacity: 1,
      duration: 0.6,
      ease: "power3.in"
    });

    // 2. HUD scales up and fades out into light
    tl.to(hudRef.current, {
      scale: 1.15,
      opacity: 0,
      filter: "blur(12px)",
      duration: 0.7,
      ease: "power2.inOut"
    }, "-=0.4");

    // 3. Fade the overall screen into the realm
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 1.2,
      ease: "power2.inOut"
    }, "+=0.2");
  };

  const toggleSound = (e) => {
    e.stopPropagation();
    const muted = soundFX.toggleMute();
    setIsMuted(muted);
    if (!muted) soundFX.playChime(0, 0.15);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04060E] overflow-hidden select-none cursor-none"
    >
      {/* 0. High-Performance Custom Cursor (GPU translate3d + rAF) */}
      <CustomCursor containerRef={containerRef} />

      {/* 1. Procedural Layered Animated Clouds & Parallax Stardust */}
      <CloudCanvas containerRef={containerRef} />

      {/* 2. Vignette & Subtle Divine Radiance Overlay */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#04060e]/40 to-[#020308]/90 pointer-events-none" />

      {/* 3. Celestial Sound Toggle & HUD Header */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center space-x-3 text-amber-300/80 font-cinzel text-xs tracking-[0.25em] uppercase pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>REALM OF THE PANTHEON // PORTAL</span>
        </div>

        <button
          type="button"
          onClick={toggleSound}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-[#090e1f]/70 text-amber-300 hover:text-amber-100 hover:border-amber-400 hover:bg-amber-500/10 transition-all duration-300 backdrop-blur-md text-xs tracking-wider cursor-none pointer-events-auto relative z-30"
          title={isMuted ? "Unmute Divine Sound" : "Mute Sound"}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-amber-400" />}
          <span>{isMuted ? "AUDIO OFF" : "AUDIO ON"}</span>
        </button>
      </div>

      {/* 4. Greek Key Corner Frames on Full Screen */}
      <GreekCorner position="top-left" className="top-4 left-4" />
      <GreekCorner position="top-right" className="top-4 right-4" />
      <GreekCorner position="bottom-left" className="bottom-4 left-4" />
      <GreekCorner position="bottom-right" className="bottom-4 right-4" />

      {/* 5. Center Divine HUD Container */}
      <div
        ref={hudRef}
        className="relative z-10 flex flex-col items-center max-w-xl w-[92%] sm:w-[85%] px-6 py-10 rounded-2xl border border-amber-500/30 bg-[#080d1d]/85 backdrop-blur-xl gold-box-glow text-center transition-all duration-500"
      >
        {/* Inner Card Greek Corner Borders */}
        <GreekCorner position="top-left" className="top-2 left-2 !w-8 !h-8 opacity-60" />
        <GreekCorner position="top-right" className="top-2 right-2 !w-8 !h-8 opacity-60" />
        <GreekCorner position="bottom-left" className="bottom-2 left-2 !w-8 !h-8 opacity-60" />
        <GreekCorner position="bottom-right" className="bottom-2 right-2 !w-8 !h-8 opacity-60" />

        {/* Mount Olympus Sigil */}
        <OlympusSigil className="w-28 h-28 sm:w-32 sm:h-32 mb-4 drop-shadow-[0_0_25px_rgba(245,158,11,0.4)] pointer-events-none" />

        {/* Title & Mythological Headers */}
        <div className="space-y-1 mb-6 pointer-events-none">
          <div className="flex items-center justify-center space-x-2 text-amber-400/90 text-xs tracking-[0.35em] font-outfit uppercase font-semibold">
            <Sparkles size={12} />
            <span>MOUNT OLYMPUS</span>
            <Sparkles size={12} />
          </div>
          <h1 className="font-cinzel-dec text-3xl sm:text-4xl md:text-5xl font-black tracking-wider gold-text-gradient gold-text-glow">
            {OLYMPUS_CONFIG.title}
          </h1>
          <p className="font-cinzel text-xs sm:text-sm text-slate-300/80 tracking-[0.2em] uppercase">
            {OLYMPUS_CONFIG.subtitle}
          </p>
        </div>

        {/* Progress & Enter Transition Section */}
        {!isLoaded ? (
          <div className="w-full max-w-md space-y-4 my-2 pointer-events-none">
            {/* Progress Percentage & Status */}
            <div className="flex items-center justify-between text-xs font-outfit font-medium text-amber-300/90">
              <span className="flex items-center space-x-1.5 tracking-wider uppercase">
                <Compass size={13} className="animate-spin text-amber-400" />
                <span>Aligning Celestial Spheres...</span>
              </span>
              <span className="font-mono text-sm tracking-widest text-amber-300 font-bold">
                {progress}%
              </span>
            </div>

            {/* Mythological Golden Progress Bar */}
            <div className="relative w-full h-3.5 bg-[#030611] rounded-full p-0.5 border border-amber-500/40 shadow-inner overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-200 transition-all duration-150 relative shadow-[0_0_15px_rgba(245,158,11,0.8)]"
                style={{ width: `${progress}%` }}
              >
                {/* Shimmer Light Bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent w-1/3 animate-shimmer" />
              </div>
            </div>

            {/* Dynamic Mythological Quote */}
            <p className="text-xs sm:text-sm italic font-outfit text-amber-200/70 min-h-[2.5rem] flex items-center justify-center transition-all duration-300">
              "{OLYMPUS_CONFIG.loadingQuotes[quoteIndex]}"
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md flex flex-col items-center space-y-5 my-2 animate-fadeIn relative z-20">
            {/* Laurel Wreath Ornament */}
            <LaurelWreath className="w-28 h-8 opacity-90 -mb-2 pointer-events-none" />

            {/* Click to Enter / Ascend Button */}
            <button
              ref={buttonRef}
              type="button"
              onClick={handleEnterClick}
              onMouseEnter={() => soundFX.playChime(2, 0.15)}
              className="group relative w-full sm:w-auto px-8 py-4 rounded-xl font-cinzel text-base sm:text-lg font-bold tracking-[0.2em] text-slate-900 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-yellow-300 hover:via-amber-200 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 active:scale-95 animate-pulse-gold cursor-none pointer-events-auto shadow-[0_0_30px_rgba(245,158,11,0.6)] z-30"
            >
              <span className="relative z-10 flex items-center justify-center space-x-3 pointer-events-none">
                <Sparkles size={18} className="text-amber-900 animate-spin" />
                <span>ASCEND TO OLYMPUS</span>
                <Sparkles size={18} className="text-amber-900 animate-spin" />
              </span>
              
              {/* Button Outer Border Glow */}
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 opacity-40 blur-sm group-hover:opacity-100 transition duration-300 pointer-events-none" />
            </button>

            <p className="text-xs tracking-widest text-amber-300/80 font-outfit uppercase pointer-events-none">
              ◈ Click to breach the clouds & enter the 3D realm ◈
            </p>
          </div>
        )}

        {/* Footer Lore Status */}
        <div className="mt-6 pt-4 border-t border-amber-500/20 w-full flex items-center justify-between text-[11px] font-outfit text-slate-400 tracking-wider pointer-events-none">
          <span>PORTAL: MOUNT OLYMPUS</span>
          <span className="text-amber-400/80">LAT 39.9° N / LON 22.3° E</span>
        </div>
      </div>

      {/* 6. Divine Entrance Flash Effect (Triggered on enter click) */}
      <div
        ref={flashRef}
        className="absolute inset-0 bg-gradient-to-b from-amber-100 via-white to-amber-200 opacity-0 pointer-events-none z-50"
      />
    </div>
  );
}
