import React, { useState } from 'react';
import { getCourseData, getAllCapsules } from './services/courseData';
import { Capsule, ViewMode } from './types';
import Sidebar from './components/Sidebar';
import VideoPlayer from './components/VideoPlayer';
import Pomodoro from './components/Pomodoro';
import ChatAssistant from './components/ChatAssistant';
import { Maximize2, Minimize2, GraduationCap, Timer, MessageCircle, PlayCircle, Menu, X, ArrowRight, BookOpen, Brain, Zap, CheckCircle2 } from 'lucide-react';

type Tab = 'home' | 'courses' | 'pomodoro' | 'chat';

const App: React.FC = () => {
  const courseData = getCourseData();
  const allCapsules = getAllCapsules();
  
  // State
  const [currentCapsule, setCurrentCapsule] = useState<Capsule | null>(allCapsules[0] || null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DEFAULT);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleFocusMode = () => {
    setViewMode(prev => prev === ViewMode.DEFAULT ? ViewMode.FOCUS : ViewMode.DEFAULT);
  };

  const startLearning = () => {
    setActiveTab('courses');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">
      
      {/* --- HEADER (Desktop & Mobile) --- */}
      {viewMode === ViewMode.DEFAULT && (
        <header className="h-14 md:h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 md:px-6 shrink-0 z-20 sticky top-0">
          <button onClick={() => setActiveTab('home')} className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
            <div className="bg-indigo-600 group-hover:bg-indigo-700 transition-colors p-1.5 md:p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                <GraduationCap size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="text-left">
                <h1 className="font-bold text-lg md:text-xl text-slate-900 tracking-tight leading-tight">Capsule Med</h1>
                <p className="hidden md:block text-xs text-slate-500 font-medium">Plateforme PASS/LAS</p>
            </div>
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
             <button 
                onClick={() => setActiveTab('courses')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'courses' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Cours
             </button>
             <button 
                onClick={() => setActiveTab('pomodoro')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'pomodoro' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Pomodoro
             </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
                onClick={toggleFocusMode}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs md:text-sm font-medium hover:bg-slate-800 transition-all shadow-md active:scale-95"
            >
                <Maximize2 size={16} /> <span className="hidden lg:inline">Mode Anti-Scroll</span>
            </button>
          </div>
        </header>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* VIEW: HOME */}
        <div className={`flex-1 w-full h-full overflow-y-auto bg-slate-50 ${activeTab === 'home' ? 'block' : 'hidden'}`}>
             <div className="relative w-full min-h-full">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none"></div>
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute top-[20%] left-[-10%] w-72 h-72 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative max-w-6xl mx-auto px-6 py-12 md:py-24 flex flex-col items-center text-center z-10">
                    
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8 shadow-sm">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                        </span>
                        Nouveau : Programme complet 2025
                    </div>
                    
                    {/* Hero Title */}
                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-[1.1]">
                        Réussir sa <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Médecine</span> <br className="hidden md:block"/> une capsule à la fois.
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
                        La première plateforme 100% gratuite qui combine <strong>cours vidéos</strong>, <strong>intelligence artificielle</strong> et <strong>méthodes de productivité</strong>.
                    </p>
                    
                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-20">
                        <button 
                            onClick={startLearning}
                            className="group px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95"
                        >
                            Commencer les cours 
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                        </button>
                        <button 
                            onClick={() => setActiveTab('pomodoro')}
                            className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                        >
                            <Timer size={20} className="text-indigo-500"/> Mode Pomodoro
                        </button>
                    </div>

                    {/* Feature Cards Grid */}
                    <div className="grid md:grid-cols-3 gap-6 w-full text-left mb-20">
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                                <PlayCircle size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Format Capsule 16:9</h3>
                            <p className="text-slate-500 leading-relaxed">
                                Des cours concis et structurés pour maximiser votre rétention. Fini les heures de cours magistraux interminables.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
                                <Brain size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Tuteur IA "Dr. Gemini"</h3>
                            <p className="text-slate-500 leading-relaxed">
                                Une question sur un cours ? Notre assistant IA connait le contenu de chaque capsule et vous répond instantanément.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 text-amber-600">
                                <Zap size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Productivité Intégrée</h3>
                            <p className="text-slate-500 leading-relaxed">
                                Alternez travail intense et pauses avec le Pomodoro. Activez l'Anti-Scroll pour éliminer toute distraction.
                            </p>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="w-full bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                            <div className="flex flex-col items-center md:items-start">
                                <div className="text-4xl font-extrabold text-slate-900 mb-2">112</div>
                                <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-green-500"/> Capsules
                                </div>
                            </div>
                            <div className="flex flex-col items-center md:items-start">
                                <div className="text-4xl font-extrabold text-slate-900 mb-2">3</div>
                                <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-green-500"/> Matières
                                </div>
                            </div>
                            <div className="flex flex-col items-center md:items-start">
                                <div className="text-4xl font-extrabold text-slate-900 mb-2">24/7</div>
                                <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-green-500"/> Accès illimité
                                </div>
                            </div>
                            <div className="flex flex-col items-center md:items-start">
                                <div className="text-4xl font-extrabold text-slate-900 mb-2">100%</div>
                                <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-green-500"/> Gratuit
                                </div>
                            </div>
                        </div>
                    </div>

                    <footer className="mt-20 pb-10 text-slate-400 text-sm">
                        © 2025 Capsule Med - Fait pour les étudiants, par des passionnés.
                    </footer>

                </div>
             </div>
        </div>

        {/* VIEW: COURSES */}
        <div className={`flex-1 flex w-full h-full ${activeTab === 'courses' ? 'flex' : 'hidden'}`}>
            
            {/* Sidebar (Desktop: Static | Mobile: Drawer) */}
            {(viewMode === ViewMode.DEFAULT) && (
                <>
                    {/* Mobile Overlay */}
                    {isMobileMenuOpen && (
                        <div 
                            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    )}
                    
                    {/* Sidebar Component */}
                    <aside className={`
                        fixed inset-y-0 left-0 z-40 w-[85vw] max-w-sm bg-white shadow-2xl transform transition-transform duration-300
                        md:relative md:translate-x-0 md:w-80 md:shadow-none md:border-r md:border-slate-200 md:block
                        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                    `}>
                        <div className="h-full flex flex-col">
                            {/* Mobile Close Button */}
                            <div className="md:hidden p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <span className="font-bold text-slate-700">Sommaire</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white rounded-full shadow-sm text-slate-500">
                                    <X size={20} />
                                </button>
                            </div>
                            <Sidebar 
                                courseData={courseData} 
                                currentCapsule={currentCapsule} 
                                onSelectCapsule={(c) => {
                                    setCurrentCapsule(c);
                                    setIsMobileMenuOpen(false);
                                }}
                            />
                        </div>
                    </aside>
                </>
            )}

            {/* Video Area */}
            <section className={`flex-1 h-full overflow-y-auto relative transition-all duration-300 flex flex-col ${viewMode === ViewMode.FOCUS ? 'bg-black p-0' : 'bg-slate-50'}`}>
                
                {/* Mobile: Toggle Sidebar Button */}
                {viewMode === ViewMode.DEFAULT && (
                    <div className="md:hidden px-4 pt-4 pb-2">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="flex items-center gap-2 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-700 font-medium active:bg-slate-50"
                        >
                            <Menu size={20} /> Sommaire du cours
                        </button>
                    </div>
                )}

                {/* Focus Mode Exit Button */}
                {viewMode === ViewMode.FOCUS && (
                    <button 
                        onClick={toggleFocusMode}
                        className="absolute top-6 right-6 z-50 p-3 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md rounded-full transition-all"
                    >
                        <Minimize2 size={24} />
                    </button>
                )}

                <div className={`flex-1 ${viewMode === ViewMode.FOCUS ? 'flex items-center justify-center w-full h-full bg-black' : 'p-4 md:p-6 max-w-5xl mx-auto w-full'}`}>
                    <VideoPlayer capsule={currentCapsule} />
                </div>
            </section>

            {/* Desktop: Right Sidebar (Chat) */}
            {viewMode === ViewMode.DEFAULT && (
                <aside className="hidden lg:block w-96 shrink-0 h-full border-l border-slate-200 bg-white">
                    <ChatAssistant currentCapsule={currentCapsule} />
                </aside>
            )}
        </div>

        {/* VIEW: POMODORO (Separate Page) */}
        <div className={`flex-1 w-full h-full overflow-y-auto bg-slate-50 ${activeTab === 'pomodoro' ? 'block' : 'hidden'}`}>
            <div className="h-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col justify-center">
                <Pomodoro />
            </div>
        </div>

        {/* VIEW: CHAT (Mobile Only Tab) */}
        <div className={`flex-1 w-full h-full bg-white ${activeTab === 'chat' ? 'block lg:hidden' : 'hidden'}`}>
             <ChatAssistant currentCapsule={currentCapsule} />
        </div>

      </main>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      {viewMode === ViewMode.DEFAULT && (
          <nav className="md:hidden h-16 bg-white border-t border-slate-200 flex justify-around items-center shrink-0 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <button 
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <BookOpen size={24} className={activeTab === 'home' ? 'fill-indigo-100' : ''} />
                <span className="text-[10px] font-medium">Accueil</span>
            </button>
            <button 
                onClick={() => setActiveTab('courses')}
                className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${activeTab === 'courses' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <PlayCircle size={24} className={activeTab === 'courses' ? 'fill-indigo-100' : ''} />
                <span className="text-[10px] font-medium">Cours</span>
            </button>
            <button 
                onClick={() => setActiveTab('pomodoro')}
                className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${activeTab === 'pomodoro' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Timer size={24} className={activeTab === 'pomodoro' ? 'fill-indigo-100' : ''} />
                <span className="text-[10px] font-medium">Pomodoro</span>
            </button>
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${activeTab === 'chat' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <MessageCircle size={24} className={activeTab === 'chat' ? 'fill-indigo-100' : ''} />
                <span className="text-[10px] font-medium">Chat IA</span>
            </button>
          </nav>
      )}
    </div>
  );
};

export default App;