import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { RefreshCw, Volume2, VolumeX, Compass, ChevronUp } from 'lucide-react';
import Atmosphere from './Atmosphere';
import Ocean from './Ocean';
import MountOlympus from './MountOlympus';
import CloudLayer from './CloudLayer';
import BackgroundMountains from './BackgroundMountains';
import Vegetation from './Vegetation';
import Jormungandr from './Jormungandr';
import GreekGateway from './GreekGateway';
import GreekFloatingIslands from './GreekFloatingIslands';
import DivineSanctuaryLife from './DivineSanctuaryLife';
import ThronePlaceholders from './ThronePlaceholders';
import FlythroughController from './FlythroughController';
import { GreekCorner } from '../GreekDecorations';
import { soundFX } from '../../utils/audio';

export default function FlythroughScene({ onResetToLoading }) {
  const [isFlythroughComplete, setIsFlythroughComplete] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [freeControls, setFreeControls] = useState(true);

  // Discreet UI & Interaction states
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const interactionTimerRef = useRef(null);

  const handleFlythroughComplete = useCallback(() => {
    setIsFlythroughComplete(true);
    soundFX.playChime(3, 0.2);
  }, []);

  const handleReplay = () => {
    setIsFlythroughComplete(false);
    setReplayCount((prev) => prev + 1);
    soundFX.playEnterChord();
  };

  const toggleSound = () => {
    const muted = soundFX.toggleMute();
    setIsMuted(muted);
    if (!muted) soundFX.playChime(0, 0.15);
  };

  // Fade instructional UI after user interacts or after a brief duration
  const triggerInteraction = useCallback(() => {
    setHasInteracted(true);
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = setTimeout(() => {
      // stays faded
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    };
  }, []);

  return (
    <div
      className="relative w-full h-full min-h-screen bg-[#04060E] overflow-hidden select-none"
      onPointerDown={triggerInteraction}
      onWheel={triggerInteraction}
    >
      {/* 1. Full Screen Three.js Canvas */}
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          powerPreference: 'high-performance'
        }}
        camera={{ position: [0, 3.0, 140], fov: 50, near: 0.5, far: 5000 }}
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
      >
        {/* Unified Celestial Environment & Physical Lighting */}
        <Atmosphere />
        <Ocean />
        <BackgroundMountains />
        <GreekGateway />
        <MountOlympus />
        <GreekFloatingIslands />
        <Jormungandr />
        <Vegetation />
        <CloudLayer />
        <DivineSanctuaryLife />
        <ThronePlaceholders isFlythroughComplete={isFlythroughComplete} />

        {/* Cinematic Flythrough & Inertial Orbit Controller */}
        <FlythroughController
          key={replayCount}
          onComplete={handleFlythroughComplete}
          isReplaying={replayCount > 0}
          freeControlsEnabled={freeControls}
          onFreeControlsToggle={() => setFreeControls((prev) => !prev)}
        />
      </Canvas>

      {/* 2. Top-Left Ancient Location Watermark (Quiet & Cinematic, not a SaaS pill) */}
      <div className="absolute top-6 left-7 z-20 pointer-events-none flex flex-col items-start select-none">
        <div className="flex items-center space-x-2 text-slate-300 font-cinzel text-xs tracking-[0.28em] uppercase">
          <span className="text-amber-400/80 text-[10px]">✦</span>
          <span>MOUNT OLYMPUS</span>
          <span className="text-slate-600">//</span>
          <span className="text-slate-400 font-normal">SUMMIT SANCTUARY</span>
        </div>
        <span className="font-outfit text-[10px] text-slate-500 tracking-[0.2em] uppercase mt-0.5 ml-4">
          Elevation 2,917m • Realm of the Immortals
        </span>
      </div>

      {/* 3. Top-Right Discreet Controls & Instructional Helper */}
      <header className="absolute top-6 right-7 flex items-center space-x-4 z-20 pointer-events-auto select-none">
        {/* Instructional UI that softly fades to 15% opacity once user knows the controls */}
        <div
          className={`hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full border border-slate-700/30 bg-[#070B16]/50 text-slate-400 text-xs backdrop-blur-sm transition-opacity duration-700 ${
            hasInteracted ? 'opacity-20 hover:opacity-90' : 'opacity-85'
          }`}
        >
          <Compass size={12} className="text-amber-400/70" />
          <span className="text-[11px] font-outfit text-slate-300 tracking-wide">
            Drag to explore • Scroll to zoom
          </span>
        </div>

        {/* Audio Ambient Mute/Unmute */}
        <button
          onClick={toggleSound}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-full border border-slate-700/40 bg-[#070B16]/60 text-slate-300 hover:text-white hover:border-slate-500 transition-all duration-300 backdrop-blur-sm text-[11px] tracking-wider cursor-pointer"
          title={isMuted ? "Unmute Ambient Sound" : "Mute Sound"}
        >
          {isMuted ? <VolumeX size={13} className="text-slate-500" /> : <Volume2 size={13} className="text-amber-400/80" />}
          <span className="font-outfit text-[10px] text-slate-400 uppercase tracking-widest">
            {isMuted ? "Muted" : "Sound"}
          </span>
        </button>
      </header>

      {/* 4. Classical Architectural Watermark Corners */}
      <GreekCorner position="top-left" className="top-3 left-3 opacity-40" />
      <GreekCorner position="top-right" className="top-3 right-3 opacity-40" />
      <GreekCorner position="bottom-left" className="bottom-3 left-3 opacity-40" />
      <GreekCorner position="bottom-right" className="bottom-3 right-3 opacity-40" />

      {/* 5. Minimal Contextual Bottom Control (Does NOT permanently cover the view) */}
      {isFlythroughComplete && (
        <div
          className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center pointer-events-auto"
          onMouseEnter={() => setIsPanelExpanded(true)}
          onMouseLeave={() => setIsPanelExpanded(false)}
        >
          {/* Collapsed Default State: Discreet Pill */}
          {!isPanelExpanded ? (
            <button
              onClick={() => setIsPanelExpanded(true)}
              className="flex items-center space-x-2 px-4 py-1.5 rounded-full border border-slate-700/50 bg-[#070B16]/80 text-slate-300 hover:text-white hover:border-amber-500/40 transition-all duration-300 backdrop-blur-md shadow-lg cursor-pointer group"
            >
              <span className="text-amber-400 text-[10px]">✦</span>
              <span className="font-cinzel text-xs font-semibold tracking-wider text-slate-200">
                SUMMIT SANCTUARY
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="font-outfit text-[11px] text-slate-400 group-hover:text-amber-200 transition-colors">
                Explore
              </span>
              <ChevronUp size={13} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
            </button>
          ) : (
            /* Expanded Drawer: Revealed smoothly on hover or click */
            <div className="flex items-center space-x-5 px-5 py-2.5 rounded-xl border border-slate-700/60 bg-[#070B16]/90 backdrop-blur-xl shadow-2xl transition-all duration-300">
              <div className="flex flex-col text-left">
                <span className="font-cinzel text-[11px] font-bold text-amber-200/90 tracking-wider">
                  SUMMIT SANCTUARY
                </span>
                <span className="font-outfit text-[10px] text-slate-400">
                  Select a divine throne to enter its domain
                </span>
              </div>

              <div className="h-6 w-px bg-slate-700/60" />

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleReplay}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-md border border-slate-600/60 bg-slate-800/50 text-slate-200 hover:text-white hover:border-amber-400/60 hover:bg-amber-500/10 transition-all text-xs font-cinzel cursor-pointer"
                  title="Replay Camera Flight"
                >
                  <RefreshCw size={11} className="text-amber-400/80" />
                  <span>Ascend</span>
                </button>

                <button
                  onClick={onResetToLoading}
                  className="px-3 py-1 rounded-md border border-slate-700/60 bg-slate-800/30 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all text-xs font-outfit cursor-pointer"
                  title="Return to Portal Gate"
                >
                  Portal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
