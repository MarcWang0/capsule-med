import React, { useState } from 'react';
import { getCourseData, getAllCapsules } from './services/courseData';
import { Capsule, ViewMode } from './types';
import Sidebar from './components/Sidebar';
import VideoPlayer from './components/VideoPlayer';
import Pomodoro from './components/Pomodoro';
import ChatAssistant from './components/ChatAssistant';
import { Maximize2, Minimize2, GraduationCap, Timer, MessageCircle, PlayCircle, Menu, X, ArrowRight, BookOpen } from 'lucide-react';

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
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50">
      
      {/* --- HEADER (Desktop & Mobile) --- */}
      {viewMode === ViewMode.DEFAULT && (
        <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-20 shadow-sm relative">
          <button onClick={() => setActiveTab('home')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-indigo-600 p-1.5 md:p-2 rounded-lg text-white">
                <GraduationCap size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="text-left">
                <h1 className="font-bold text-lg md:text-xl text-slate-900 tracking-tight leading-tight">Capsule Med</h1>
                <p className="hidden md:block text-xs text-slate-500 font-medium">Plateforme de Révision PASS/LAS</p>
            </div>
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg">
             <button 
                onClick={() => setActiveTab('courses')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'courses' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Cours
             </button>
             <button 
                onClick={() => setActiveTab('pomodoro')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'pomodoro' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Pomodoro
             </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
                onClick={toggleFocusMode}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-slate-800 transition-all shadow-sm"
            >
                <Maximize2 size={16} /> <span className="hidden lg:inline">Mode Anti-Scroll</span>
            </button>
          </div>
        </header>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* VIEW: HOME */}
        <div className={`flex-1 w-full h-full overflow-y-auto bg-white ${activeTab === 'home' ? 'block' : 'hidden'}`}>
             <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    Nouvelle formation PASS/LAS disponible
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
                    Réussir sa <span className="text-indigo-600">Médecine</span> <br/> une capsule à la fois.
                </h1>
                <p className="text-lg text-slate-600 mb-10 max-w-2xl leading-relaxed">
                    Accédez à plus de 100 capsules de cours structurées, optimisées pour la mémorisation. 
                    Utilisez le Pomodoro intégré et l'assistant IA pour maximiser votre efficacité.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button 
                        onClick={startLearning}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                        Commencer les cours <ArrowRight size={20} />
                    </button>
                    <button 
                        onClick={() => setActiveTab('pomodoro')}
                        className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Timer size={20} /> Mode Pomodoro
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 w-full border-t border-slate-100 pt-12">
                    <div>
                        <div className="text-3xl font-bold text-slate-900 mb-1">112</div>
                        <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">Capsules</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900 mb-1">3</div>
                        <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">Matières</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900 mb-1">IA</div>
                        <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">Tuteur 24/7</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-900 mb-1">100%</div>
                        <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">Gratuit</div>
                    </div>
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
                            className="fixed inset-0 bg-black/50 z-30 md:hidden"
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
          <nav className="md:hidden h-16 bg-white border-t border-slate-200 flex justify-around items-center shrink-0 pb-safe z-50">
             <button 
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center gap-1 p-2 w-full ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}
            >
                <BookOpen size={24} className={activeTab === 'home' ? 'fill-indigo-100' : ''} />
                <span className="text-[10px] font-medium">Accueil</span>
            </button>
            <button 
                onClick={() => setActiveTab('courses')}
                className={`flex flex-col items-center gap-1 p-2 w-full ${activeTab === 'courses' ? 'text-indigo-600' : 'text-slate-400'}`}
            >
                <PlayCircle size={24} className={activeTab === 'courses' ? 'fill-indigo-100' : ''} />
                <span className="text-[10px] font-medium">Cours</span>
            </button>
            <button 
                onClick={() => setActiveTab('pomodoro')}
                className={`flex flex-col items-center gap-1 p-2 w-full ${activeTab === 'pomodoro' ? 'text-indigo-600' : 'text-slate-400'}`}
            >
                <Timer size={24} className={activeTab === 'pomodoro' ? 'fill-indigo-100' : ''} />
                <span className="text-[10px] font-medium">Pomodoro</span>
            </button>
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex flex-col items-center gap-1 p-2 w-full ${activeTab === 'chat' ? 'text-indigo-600' : 'text-slate-400'}`}
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