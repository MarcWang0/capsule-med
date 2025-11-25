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
      // Auto-switch mode or play sound could go here
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

  // Logic for the liquid height
  // Work: Starts at 0, goes to 100 (Filling up with pressure)
  // Break: Starts at 100, goes to 0 (Emptying/Relieving pressure)
  const totalTime = mode === TimerMode.WORK ? WORK_TIME : BREAK_TIME;
  const percentage = mode === TimerMode.WORK 
    ? ((totalTime - timeLeft) / totalTime) * 100 
    : (timeLeft / totalTime) * 100;

  // Bubbles for animation effect
  const bubbles = Array.from({ length: 8 }).map((_, i) => ({
    left: `${Math.random() * 80 + 10}%`,
    animationDelay: `${Math.random() * 2}s`,
    animationDuration: `${2 + Math.random() * 3}s`,
    size: `${4 + Math.random() * 8}px`
  }));

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden w-full max-w-md relative">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-100 z-20 relative bg-white">
            <button
                onClick={() => switchMode(TimerMode.WORK)}
                className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === TimerMode.WORK 
                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
                <Brain size={20} /> Travail
            </button>
            <button
                onClick={() => switchMode(TimerMode.BREAK)}
                className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === TimerMode.BREAK 
                    ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
                <Coffee size={20} /> Pause
            </button>
        </div>

        {/* Visualization Body */}
        <div className="p-8 md:p-12 flex flex-col items-center relative">
            
            {/* THE GLASS CONTAINER */}
            <div className="relative w-48 h-64 mb-10 mx-auto">
                {/* Glass borders/reflection */}
                <div className="absolute inset-0 border-[6px] border-slate-200 border-t-0 rounded-b-[3rem] z-10 pointer-events-none shadow-[inset_0_-10px_20px_rgba(0,0,0,0.05)]"></div>
                
                {/* Background of empty glass */}
                <div className="absolute inset-2 top-0 rounded-b-[2.5rem] bg-slate-50 overflow-hidden">
                    
                    {/* THE LIQUID */}
                    <div 
                        className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-linear flex items-end justify-center ${
                            mode === TimerMode.WORK ? 'bg-indigo-500' : 'bg-emerald-400'
                        }`}
                        style={{ height: `${percentage}%` }}
                    >
                        {/* Wave Effect at the top of liquid */}
                        <div className="absolute -top-3 w-[200%] h-6 bg-inherit rounded-[50%] animate-wave opacity-50 translate-x-[-25%]"></div>
                        
                        {/* Bubbles (Only visible when active and has liquid) */}
                        {isActive && percentage > 5 && bubbles.map((b, i) => (
                            <div 
                                key={i}
                                className="absolute bg-white/30 rounded-full animate-bubble bottom-0"
                                style={{
                                    left: b.left,
                                    width: b.size,
                                    height: b.size,
                                    animationDelay: b.animationDelay,
                                    animationDuration: b.animationDuration
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Time Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <span className={`text-5xl font-mono font-bold tracking-wider drop-shadow-sm ${
                        percentage > 50 ? 'text-white' : 'text-slate-700'
                    }`}>
                        {formatTime(timeLeft)}
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-widest mt-2 ${
                         percentage > 50 ? 'text-white/80' : 'text-slate-400'
                    }`}>
                        {mode === TimerMode.WORK ? 'Focus' : 'Repos'}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 w-full z-20">
                <button
                    onClick={toggleTimer}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg shadow-lg shadow-slate-200 transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
                        isActive
                        ? 'bg-white border-2 border-amber-400 text-amber-600 hover:bg-amber-50'
                        : (mode === TimerMode.WORK ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-emerald-600 text-white hover:bg-emerald-700')
                    }`}
                >
                    {isActive ? <><Pause size={24} /> Pause</> : <><Play size={24} /> Démarrer</>}
                </button>
                
                <button
                    onClick={resetTimer}
                    className="p-4 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                    title="Réinitialiser"
                >
                    <RotateCcw size={24} />
                </button>
            </div>
        </div>
        
        {/* Footer Info */}
        <div className="bg-slate-50 p-4 text-center text-sm text-slate-500 border-t border-slate-100 relative z-20">
            {mode === TimerMode.WORK 
                ? "Le verre se remplit : la pression monte, restez concentré !" 
                : "Le verre se vide : relâchez la pression, détendez-vous."}
        </div>

        {/* Global Styles for Bubbles and Waves */}
        <style>{`
            @keyframes bubble {
                0% { transform: translateY(0) scale(0.5); opacity: 0; }
                50% { opacity: 1; }
                100% { transform: translateY(-200px) scale(1.2); opacity: 0; }
            }
            .animate-bubble {
                animation-name: bubble;
                animation-timing-function: ease-in;
                animation-iteration-count: infinite;
            }
        `}</style>
      </div>
    </div>
  );
};

export default Pomodoro;