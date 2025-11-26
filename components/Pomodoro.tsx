import React, { useState, useEffect } from 'react';
import { TimerMode } from '../types';
import { Play, Pause, RotateCcw, Coffee, Brain, Sparkles } from 'lucide-react';

const Pomodoro: React.FC = () => {
  const WORK_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<TimerMode>(TimerMode.WORK);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((seconds) => seconds - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === TimerMode.WORK ? WORK_TIME : BREAK_TIME);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === TimerMode.WORK ? WORK_TIME : BREAK_TIME);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Logic: Work fills up (0->100%), Break empties (100%->0%)
  const totalTime = mode === TimerMode.WORK ? WORK_TIME : BREAK_TIME;
  const percentage = mode === TimerMode.WORK 
    ? ((totalTime - timeLeft) / totalTime) * 100 
    : (timeLeft / totalTime) * 100;

  // Generate deterministic but random-looking bubbles
  const bubbles = Array.from({ length: 12 }).map((_, i) => ({
    left: `${(i * 8) + Math.random() * 5}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${3 + Math.random() * 4}s`,
    size: `${4 + Math.random() * 6}px`
  }));

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 w-full max-w-md relative overflow-hidden">
        
        {/* Background Ambient Glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-30 blur-3xl transition-colors duration-1000 pointer-events-none ${
             mode === TimerMode.WORK ? 'bg-indigo-300' : 'bg-emerald-300'
        }`} />

        {/* Header Tabs */}
        <div className="flex border-b border-slate-100 z-20 relative bg-white/50 backdrop-blur-sm">
            <button
                onClick={() => switchMode(TimerMode.WORK)}
                className={`flex-1 py-4 text-center font-bold transition-all flex items-center justify-center gap-2 ${
                mode === TimerMode.WORK 
                    ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' 
                    : 'text-slate-400 hover:bg-slate-50/50 hover:text-slate-600'
                }`}
            >
                <Brain size={20} className={mode === TimerMode.WORK ? "animate-pulse" : ""} /> Travail
            </button>
            <button
                onClick={() => switchMode(TimerMode.BREAK)}
                className={`flex-1 py-4 text-center font-bold transition-all flex items-center justify-center gap-2 ${
                mode === TimerMode.BREAK 
                    ? 'text-emerald-600 bg-emerald-50/50 border-b-2 border-emerald-500' 
                    : 'text-slate-400 hover:bg-slate-50/50 hover:text-slate-600'
                }`}
            >
                <Coffee size={20} className={mode === TimerMode.BREAK ? "animate-bounce-slow" : ""} /> Pause
            </button>
        </div>

        {/* Visualization Body */}
        <div className="p-8 md:p-12 flex flex-col items-center relative z-10">
            
            {/* THE GLASS CONTAINER */}
            <div className="relative w-56 h-56 mb-10 mx-auto group cursor-pointer" onClick={toggleTimer}>
                
                {/* Outer Glow Ring */}
                <div className={`absolute inset-0 rounded-full blur-md opacity-40 transition-colors duration-700 ${
                    isActive 
                    ? (mode === TimerMode.WORK ? 'bg-indigo-400' : 'bg-emerald-400') 
                    : 'bg-transparent'
                }`}></div>

                {/* The Circle Container */}
                <div className="absolute inset-0 rounded-full border-[8px] border-white bg-slate-100 shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)] overflow-hidden transform transition-transform duration-300 hover:scale-[1.02]">
                    
                    {/* LIQUID WRAPPER */}
                    <div 
                        className="absolute bottom-0 left-0 w-full transition-all duration-700 ease-in-out"
                        style={{ height: `${percentage}%` }}
                    >
                        {/* Wave 1 (Back - Darker) */}
                        <div className={`absolute -top-[120px] -left-[120px] w-[500px] h-[500px] rounded-[40%] opacity-40 animate-spin-slow ${
                            mode === TimerMode.WORK ? 'bg-indigo-500' : 'bg-emerald-500'
                        }`} style={{ animationDuration: '8s' }}></div>

                        {/* Wave 2 (Front - Lighter) */}
                        <div className={`absolute -top-[125px] -left-[120px] w-[500px] h-[500px] rounded-[38%] opacity-80 animate-spin-slow ${
                            mode === TimerMode.WORK ? 'bg-indigo-600' : 'bg-emerald-600'
                        }`} style={{ animationDuration: '5s' }}></div>

                        {/* Solid Fill below waves */}
                        <div className={`absolute top-[80px] left-0 w-full h-[500px] ${
                             mode === TimerMode.WORK ? 'bg-indigo-600' : 'bg-emerald-600'
                        }`}></div>

                        {/* Bubbles */}
                        {isActive && bubbles.map((b, i) => (
                            <div 
                                key={i}
                                className="absolute bg-white/40 rounded-full animate-bubble"
                                style={{
                                    left: b.left,
                                    width: b.size,
                                    height: b.size,
                                    bottom: '-20px',
                                    animationDelay: b.delay,
                                    animationDuration: b.duration
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Time Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                    <span className={`text-6xl font-black tracking-tighter drop-shadow-lg transition-colors duration-300 ${
                        percentage > 55 ? 'text-white' : 'text-slate-800'
                    }`}>
                        {formatTime(timeLeft)}
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-[0.2em] mt-1 transition-colors duration-300 ${
                         percentage > 55 ? 'text-white/80' : 'text-slate-400'
                    }`}>
                        {isActive ? (mode === TimerMode.WORK ? 'Concentration' : 'Relaxation') : 'En pause'}
                    </span>
                </div>

                {/* Glass Reflection Shine */}
                <div className="absolute top-4 left-10 w-8 h-4 bg-white/30 rounded-full -rotate-45 blur-[1px] pointer-events-none z-30"></div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 w-full z-20">
                <button
                    onClick={toggleTimer}
                    className={`flex-1 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
                        isActive
                        ? 'bg-white text-slate-700 ring-2 ring-slate-100 hover:bg-slate-50'
                        : (mode === TimerMode.WORK 
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1' 
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-1')
                    }`}
                >
                    {isActive ? <><Pause size={24} /> Pause</> : <><Play size={24} fill="currentColor" /> Démarrer</>}
                </button>
                
                <button
                    onClick={resetTimer}
                    className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-200 transition-all shadow-sm active:scale-95"
                    title="Réinitialiser"
                >
                    <RotateCcw size={24} />
                </button>
            </div>
        </div>
        
        {/* Footer Info */}
        <div className="bg-slate-50/80 p-4 text-center text-sm font-medium text-slate-500 border-t border-slate-100 relative z-20 flex items-center justify-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            {mode === TimerMode.WORK 
                ? "Restez focus, la réussite se construit maintenant." 
                : "Respirez, votre cerveau a besoin de ce moment."}
        </div>

        {/* Global Styles for Animations */}
        <style>{`
            @keyframes spin-slow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .animate-spin-slow {
                animation: spin-slow linear infinite;
            }
            @keyframes bubble {
                0% { transform: translateY(0) translateX(0); opacity: 0; }
                20% { opacity: 1; }
                50% { transform: translateY(-60px) translateX(10px); }
                100% { transform: translateY(-140px) translateX(-5px); opacity: 0; }
            }
            .animate-bubble {
                animation-name: bubble;
                animation-timing-function: ease-in-out;
                animation-iteration-count: infinite;
            }
            .animate-bounce-slow {
                animation: bounce 2s infinite;
            }
        `}</style>
      </div>
    </div>
  );
};

export default Pomodoro;