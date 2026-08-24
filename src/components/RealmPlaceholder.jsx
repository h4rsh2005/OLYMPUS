import React from 'react';
import { Sparkles, RefreshCw, Mountain, Compass, Shield } from 'lucide-react';
import { GreekCorner } from './GreekDecorations';
import { OLYMPUS_CONFIG } from '../config/olympusConfig';

export default function RealmPlaceholder({ onReset }) {
  return (
    <div className="relative w-full h-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#02050E] via-[#091124] to-[#171A30] text-slate-100 p-6 overflow-hidden select-none">
      {/* Greek Frame Corners */}
      <GreekCorner position="top-left" className="top-6 left-6" />
      <GreekCorner position="top-right" className="top-6 right-6" />
      <GreekCorner position="bottom-left" className="bottom-6 left-6" />
      <GreekCorner position="bottom-right" className="bottom-6 right-6" />

      {/* Background Ambient Radiance */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      {/* Main Content Card */}
      <div className="relative z-10 max-w-2xl w-full text-center space-y-6 p-8 sm:p-12 rounded-3xl border border-amber-500/30 bg-[#080E21]/80 backdrop-blur-2xl gold-box-glow">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-semibold tracking-widest uppercase">
          <Sparkles size={14} className="text-amber-400" />
          <span>PHASE 1 COMPLETE • GATES BREACHED</span>
        </div>

        <h2 className="font-cinzel-dec text-3xl sm:text-4xl md:text-5xl font-extrabold gold-text-gradient gold-text-glow">
          WELCOME TO OLYMPUS
        </h2>

        <p className="font-outfit text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
          The loading screen, cloud parallax engine, game-style HUD, and transition triggers have been successfully forged. 
          Ready to prompt for <strong className="text-amber-300 font-medium">Phase 2</strong> (Three.js reflective ocean shader, Mount Olympus peak, and camera flythrough).
        </p>

        {/* Throne Waypoints Preview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 text-left">
          {OLYMPUS_CONFIG.thrones.slice(0, 3).map((throne) => (
            <div
              key={throne.id}
              className="p-3.5 rounded-xl border border-slate-700/60 bg-slate-900/60 hover:border-amber-500/50 transition-all duration-300"
            >
              <div className="flex items-center space-x-2 text-xs font-cinzel text-amber-400 font-bold mb-1">
                <Shield size={13} />
                <span>{throne.god}</span>
              </div>
              <div className="text-[11px] text-slate-300 font-outfit">{throne.section}</div>
            </div>
          ))}
        </div>

        {/* Reset / Replay Button */}
        <div className="pt-4 flex justify-center">
          <button
            onClick={onReset}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl border border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 hover:text-amber-100 transition-all duration-300 font-cinzel text-xs tracking-[0.2em] uppercase font-bold cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Replay Loading Experience</span>
          </button>
        </div>
      </div>
    </div>
  );
}
