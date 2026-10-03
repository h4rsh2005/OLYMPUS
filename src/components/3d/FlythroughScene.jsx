import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { RefreshCw, Sparkles, Volume2, VolumeX, Eye, Compass, Navigation } from 'lucide-react';
import Atmosphere from './Atmosphere';
import Ocean from './Ocean';
import MountOlympus from './MountOlympus';
import CloudLayer from './CloudLayer';
import BackgroundMountains from './BackgroundMountains';
import Vegetation from './Vegetation';
import Jormungandr from './Jormungandr';
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

  return (
    <div className="relative w-full h-full min-h-screen bg-[#04060E] overflow-hidden select-none">
      {/* 1. Full Screen Three.js Canvas */}
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          powerPreference: 'high-performance'
        }}
        camera={{ position: [0, 3.0, 140], fov: 50, near: 0.5, far: 1800 }}
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
      >
        {/* Celestial Environment & Lighting */}
        <Atmosphere />
        <Ocean />
        <BackgroundMountains />
        <MountOlympus />
        <Jormungandr />
        <Vegetation />
        <CloudLayer />
        <DivineSanctuaryLife />
        <ThronePlaceholders isFlythroughComplete={isFlythroughComplete} />

        {/* Cinematic Path & Free Orbit Controller */}
        <FlythroughController
          key={replayCount}
          onComplete={handleFlythroughComplete}
          isReplaying={replayCount > 0}
          freeControlsEnabled={freeControls}
          onFreeControlsToggle={() => setFreeControls(prev => !prev)}
        />
      </Canvas>

      {/* 2. Top Header Navigation Bar */}
      <header className="absolute top-5 left-6 right-6 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center space-x-3 text-amber-300 font-cinzel text-xs tracking-[0.25em] uppercase px-4 py-1.5 rounded-full border border-amber-500/30 bg-[#080E21]/80 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>MOUNT OLYMPUS // SUMMIT SANCTUARY</span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Camera Drag Indicator */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-[#080E21]/70 text-slate-300 text-xs backdrop-blur-md">
            <Compass size={13} className="text-amber-400 animate-spin-very-slow" />
            <span className="text-[11px] font-outfit text-amber-200/90">
              Drag to explore 360° • Scroll to zoom
            </span>
          </div>

          <button
            onClick={toggleSound}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-[#080E21]/80 text-amber-300 hover:text-amber-100 hover:border-amber-400 transition-all duration-300 backdrop-blur-md text-xs tracking-wider cursor-pointer"
            title={isMuted ? "Unmute Divine Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-amber-400" />}
            <span>{isMuted ? "AUDIO OFF" : "AUDIO ON"}</span>
          </button>
        </div>
      </header>

      {/* 3. Screen Edge Greek Corners */}
      <GreekCorner position="top-left" className="top-3 left-3" />
      <GreekCorner position="top-right" className="top-3 right-3" />
      <GreekCorner position="bottom-left" className="bottom-3 left-3" />
      <GreekCorner position="bottom-right" className="bottom-3 right-3" />

      {/* 4. Streamlined Summit UI Overlay */}
      {isFlythroughComplete && (
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center max-w-lg w-[92%] sm:w-auto animate-fadeIn pointer-events-auto">
          <div className="flex items-center justify-between gap-4 px-6 py-3 rounded-2xl border border-amber-500/40 bg-[#080E21]/90 backdrop-blur-xl gold-box-glow text-left shadow-[0_0_35px_rgba(245,158,11,0.3)]">
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center space-x-1.5 text-amber-400 text-xs font-bold font-cinzel tracking-wider">
                <Sparkles size={13} className="text-amber-300" />
                <span>SUMMIT SANCTUARY REACHED</span>
              </div>
              <p className="text-[11px] text-slate-300 font-outfit">
                Drag mouse or finger to view around • Click thrones to enter domains.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleReplay}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 transition-all duration-200 font-cinzel text-xs font-bold cursor-pointer"
                title="Replay Camera Flythrough"
              >
                <RefreshCw size={12} />
                <span>Ascend</span>
              </button>

              <button
                onClick={onResetToLoading}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-500 transition-all duration-200 text-xs font-outfit cursor-pointer"
                title="Back to Portal Loading Screen"
              >
                Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
