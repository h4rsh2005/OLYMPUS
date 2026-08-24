import React, { useState } from 'react';
import LoadingScreen from './components/LoadingScreen';
import FlythroughScene from './components/3d/FlythroughScene';

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const handleEnter = () => {
    setHasEntered(true);
  };

  const handleResetToLoading = () => {
    setHasEntered(false);
    setSessionKey(prev => prev + 1);
  };

  return (
    <main className="w-full h-screen bg-[#04060E] text-slate-100 relative overflow-hidden font-outfit">
      {!hasEntered ? (
        <LoadingScreen key={sessionKey} onEnter={handleEnter} />
      ) : (
        <FlythroughScene onResetToLoading={handleResetToLoading} />
      )}
    </main>
  );
}
