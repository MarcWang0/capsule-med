import React, { useState, useEffect } from 'react';
import { TimerMode } from '../types';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';

const Pomodoro: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
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
      // Optional: Add sound notification here
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === TimerMode.WORK ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === TimerMode.WORK ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === TimerMode.WORK 
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100 
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden w-full max-w-md">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-100">
            <button
                onClick={() => switchMode(TimerMode.WORK)}
                className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === TimerMode.WORK 
                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
                <Brain size={20} /> Mode Travail
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

        {/* Timer Body */}
        <div className="p-8 md:p-12 flex flex-col items-center">
            
            {/* Timer Display */}
            <div className="relative mb-8 md:mb-12">
                <div className="text-7xl md:text-8xl font-mono font-bold text-slate-800 tracking-wider tabular-nums">
                    {formatTime(timeLeft)}
                </div>
                {/* Status Badge */}
                <div className={`absolute -top-6 right-0 left-0 mx-auto w-max px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest ${
                    isActive 
                        ? (mode === TimerMode.WORK ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600')
                        : 'bg-slate-100 text-slate-500'
                }`}>
                    {isActive ? 'En cours' : 'En attente'}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ease-linear ${mode === TimerMode.WORK ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 w-full">
                <button
                    onClick={toggleTimer}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
                        isActive
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : (mode === TimerMode.WORK ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200')
                    }`}
                >
                    {isActive ? <><Pause size={24} /> Pause</> : <><Play size={24} /> Démarrer</>}
                </button>
                
                <button
                    onClick={resetTimer}
                    className="p-4 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                    title="Réinitialiser"
                >
                    <RotateCcw size={24} />
                </button>
            </div>
        </div>
        
        {/* Footer Info */}
        <div className="bg-slate-50 p-4 text-center text-sm text-slate-500 border-t border-slate-100">
            {mode === TimerMode.WORK 
                ? "Concentrez-vous sur une seule tâche." 
                : "Détendez-vous, respirez et bougez un peu."}
        </div>
      </div>
    </div>
  );
};

export default Pomodoro;