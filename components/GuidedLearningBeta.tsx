import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
// Added missing ChevronRight import
import { ArrowLeft, Send, Loader2, Sparkles, ZoomIn, ZoomOut, Bot, ChevronDown, ChevronUp, Activity, Zap, CircleDashed, X, ChevronLeft, ChevronRight, Play, RotateCcw, BookOpen, Layers, MessageCircle, FileText, LayoutList } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const MAX_DEPTH = 3; 

interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  children?: MindMapNode[];
  isExpanded?: boolean;
  isDescriptionOpen?: boolean;
  isLoading?: boolean;
  isLoaded?: boolean;
}

interface GuidedLearningBetaProps {
  initialFile?: File | null;
  initialText?: string;
  onBack: () => void;
}

const GuidedLearningBeta: React.FC<GuidedLearningBetaProps> = ({ initialFile, initialText, onBack }) => {
  const [step, setStep] = useState<'init' | 'loading' | 'workspace'>('init');
  const [mindMap, setMindMap] = useState<MindMapNode | null>(null);
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  
  // Responsive et Mobile Phases
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobilePhase, setMobilePhase] = useState<'overview' | 'learning'>('overview');
  const [lastLearningIndex, setLastLearningIndex] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [rightSideMode, setRightSideMode] = useState<'ai' | 'pdf'>('ai');
  
  // PDF State
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Tour / Navigation State
  const [tourIndex, setTourIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Desktop Map State
  const [scale, setScale] = useState(1.1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const mapContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        if (!mobile) setIsChatOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (initialFile) {
      const load = async () => {
        const arrayBuffer = await initialFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setPdfTotalPages(doc.numPages);
      };
      load();
    }
  }, [initialFile]);

  useEffect(() => {
    const render = async () => {
      if (!pdfDoc || !canvasRef.current || rightSideMode !== 'pdf') return;
      if (renderTaskRef.current) renderTaskRef.current.cancel();
      const page = await pdfDoc.getPage(pdfPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      const viewport = page.getViewport({ scale: 1.5 });
      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = "100%";
      const renderContext = {
        canvasContext: context,
        transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
        viewport: viewport,
      };
      const task = page.render(renderContext as any);
      renderTaskRef.current = task;
      try { await task.promise; } catch (e) {}
    };
    render();
  }, [pdfDoc, pdfPage, rightSideMode, isChatOpen]);

  // Linear Tour Sequence for both Desktop Tour and Mobile Cards
  const tourSequence = useMemo(() => {
    if (!mindMap) return [];
    const sequence: {id: string, label: string, level: number, phase: 'plan' | 'deep'}[] = [];
    sequence.push({ id: mindMap.id, label: mindMap.label, level: 0, phase: 'plan' });
    const chapters = mindMap.children || [];
    chapters.forEach((child, idx) => {
        sequence.push({ id: child.id, label: child.label, level: 1, phase: 'plan' });
    });
    chapters.forEach((chapter, idx) => {
        sequence.push({ id: chapter.id, label: chapter.label, level: 1, phase: 'deep' });
        const traverseDeep = (node: MindMapNode, level: number) => {
            if (level >= 2) sequence.push({ id: node.id, label: node.label, level: level, phase: 'deep' });
            if (node.children) node.children.forEach(c => traverseDeep(c, level + 1));
        };
        traverseDeep(chapter, 1);
    });
    return sequence;
  }, [mindMap]);

  useEffect(() => { if (initialText) handleStart(); }, [initialText]);

  const extractJson = (text: string) => {
    try {
      const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      return match ? match[0] : text;
    } catch (e) { return text; }
  };

  const callGemini = async (prompt: string, jsonMode: boolean = false): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: jsonMode ? { responseMimeType: "application/json", temperature: 0.1 } : { temperature: 0.7 }
    });
    return response.text || "";
  };

  const prefetchChildren = async (nodeId: string, label: string, level: number) => {
    if (level >= MAX_DEPTH) return;
    try {
        const prompt = `Contexte médical : ${initialText?.substring(0, 5000)}. 
        Approfondis "${label}" avec 3 points précis. 
        FORMAT JSON : { "children": [{"id": "${nodeId}-${Date.now()}", "label": "...", "description": "...", "isLoaded": false}] }`;
        const res = await callGemini(prompt, true);
        const data = JSON.parse(extractJson(res));
        setMindMap(prev => {
            if (!prev) return null;
            const updateRecursive = (current: MindMapNode): MindMapNode => {
                if (current.id === nodeId) return { ...current, children: data.children, isLoaded: true, isLoading: false };
                if (current.children) return { ...current, children: current.children.map(updateRecursive) };
                return current;
            };
            return updateRecursive(prev);
        });
    } catch (e) {}
  };

  const handleStart = async () => {
    if (!initialText) return;
    setStep('loading');
    try {
        const prompt = `Analyse ce cours de médecine. Génère un titre court et les 4 ou 5 chapitres majeurs. FORMAT JSON : { "id": "root", "label": "Titre", "description": "Résumé global", "children": [{"id": "c1", "label": "Chapitre 1", "description": "Résumé court"}] }`;
        const res = await callGemini(prompt, true);
        const data = JSON.parse(extractJson(res));
        setMindMap({ ...data, isExpanded: true, isLoaded: true });
        setStep('workspace');
        if (data.children) data.children.forEach((child: any) => prefetchChildren(child.id, child.label, 1));
    } catch (error: any) { setStep('init'); }
  };

  const findNodeById = (node: MindMapNode, id: string): MindMapNode | null => {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const focusOnNode = useCallback((nodeId: string, targetScale?: number) => {
    if (isMobile) return;
    requestAnimationFrame(() => {
        const nodeEl = document.getElementById(`node-${nodeId}`);
        const viewport = viewportRef.current;
        const content = mapContentRef.current;
        if (!nodeEl || !viewport || !content) return;
        const s = targetScale || scale;
        const nodeRect = nodeEl.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        const logicalCenterX = (nodeRect.left + nodeRect.width / 2 - contentRect.left) / scale;
        const logicalCenterY = (nodeRect.top + nodeRect.height / 2 - contentRect.top) / scale;
        const nextX = (viewport.clientWidth / 2) - (logicalCenterX * s);
        const nextY = (viewport.clientHeight / 2) - (logicalCenterY * s);
        if (targetScale) setScale(s);
        setOffset({ x: nextX, y: nextY });
    });
  }, [scale, isMobile]);

  const goToTourStep = async (index: number) => {
    if (index < 0 || index >= tourSequence.length || isNavigating) return;
    const target = tourSequence[index];
    setIsNavigating(true);
    setTourIndex(index);
    if (isMobile) {
        setMobilePhase('learning');
        setLastLearningIndex(index);
    }
    
    setMindMap(prev => {
        if (!prev) return null;
        const updateRecursive = (current: MindMapNode): MindMapNode => {
            if (current.id === target.id) {
                if (current.children) current.children.forEach(c => { if(!c.isLoaded) prefetchChildren(c.id, c.label, index); });
                return { ...current, isExpanded: target.phase === 'deep', isDescriptionOpen: true };
            }
            if (current.children) {
                const contains = (n: MindMapNode): boolean => n.id === target.id || (n.children?.some(contains) ?? false);
                return { ...current, isExpanded: contains(current) ? true : current.isExpanded, children: current.children.map(updateRecursive) };
            }
            return current;
        };
        return updateRecursive(prev);
    });
    
    if (!isMobile) {
        setTimeout(() => { focusOnNode(target.id, 1.2); setIsNavigating(false); }, 450);
    } else {
        setIsNavigating(false);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const msg = text || chatInput;
    if (!msg.trim() || isLoadingChat) return;
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatInput('');
    setIsLoadingChat(true);
    try {
        const res = await callGemini(`Tuteur médical expert. Concept: "${tourSequence[tourIndex]?.label}". Question: ${msg}`);
        setChatMessages(prev => [...prev, { role: 'model', text: res }]);
    } catch (e) { setChatMessages(prev => [...prev, { role: 'model', text: "Erreur IA." }]); }
    finally { setIsLoadingChat(false); }
  };

  // --- MOBILE VIEWS ---

  const MobileOverview = () => (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-indigo-600 rounded-3xl p-6 text-white mb-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <BookOpen size={80} />
            </div>
            <h2 className="text-xl font-black mb-2 flex items-center gap-2">
                <LayoutList size={24}/> Sommaire du Cours
            </h2>
            <p className="text-indigo-100 text-xs leading-relaxed opacity-90">{mindMap?.description}</p>
        </div>

        <div className="space-y-3">
            {mindMap?.children?.map((chapter, idx) => (
                <div key={chapter.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <details className="group">
                        <summary className="p-4 flex items-center justify-between cursor-pointer list-none">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">
                                    {String(idx + 1).padStart(2, '0')}
                                </div>
                                <span className="font-bold text-slate-800 text-sm">{chapter.label}</span>
                            </div>
                            <ChevronDown size={18} className="text-slate-400 group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="px-4 pb-4 border-t border-slate-50 pt-3 animate-in slide-in-from-top-2">
                            <p className="text-xs text-slate-500 leading-relaxed italic mb-4">{chapter.description}</p>
                            <button 
                                onClick={() => goToTourStep(tourSequence.findIndex(s => s.id === chapter.id))}
                                className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                <Play size={14} fill="currentColor"/> Étudier ce chapitre
                            </button>
                        </div>
                    </details>
                </div>
            ))}
        </div>
    </div>
  );

  const MobileLearningView = () => {
    const currentNode = findNodeById(mindMap!, tourSequence[tourIndex]?.id);
    const isNewChapter = tourSequence[tourIndex]?.level === 1 && tourSequence[tourIndex]?.phase === 'plan';

    return (
        <div className="flex-1 flex flex-col p-6 animate-in fade-in zoom-in duration-500 relative pb-32 overflow-y-auto">
            {isNewChapter && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-40 bg-indigo-600/10 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-center border border-indigo-200 animate-bounce">
                    Nouveau Chapitre
                </div>
            )}
            
            <div className="flex-1 flex flex-col items-center justify-center gap-6 mt-12">
                <div className={`w-full bg-white rounded-[2.5rem] shadow-2xl border-2 p-8 flex flex-col gap-6 transform transition-all active:scale-[0.98] ${tourSequence[tourIndex]?.level === 0 ? 'border-indigo-500 ring-8 ring-indigo-50' : 'border-emerald-400 ring-8 ring-emerald-50'}`}>
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 opacity-60">
                            {tourSequence[tourIndex]?.phase === 'plan' ? 'Phase de Survol' : 'Phase d\'Immersion'}
                        </span>
                        <h3 className="text-2xl font-black text-slate-900 leading-tight">
                            {currentNode?.label}
                        </h3>
                    </div>
                    
                    <div className="h-px bg-slate-100 w-full" />

                    <div className="text-slate-600 text-sm leading-relaxed max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        <ReactMarkdown>{currentNode?.description || "Chargement des données pédagogiques..."}</ReactMarkdown>
                    </div>

                    <button 
                        onClick={() => { setIsChatOpen(true); setRightSideMode('ai'); handleSendMessage(`Dis-m'en plus sur : ${currentNode?.label}`); }}
                        className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-sm"
                    >
                        <Bot size={18}/> Approfondir avec Dr. Gemini
                    </button>
                </div>
            </div>
        </div>
    );
  };

  // --- RENDERING LOGIC ---

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden select-none">
      {/* HEADER UNIFIÉ */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0 z-[60]">
        <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"><ArrowLeft size={20}/></button>
            <span className="font-black text-slate-900 text-sm tracking-tight">Pathfinder <span className="text-indigo-600">Guided</span></span>
        </div>
        
        {/* FAB BOT DÉPLACÉ DANS LE HEADER SUR MOBILE POUR PLUS DE CLARTÉ */}
        {isMobile && (
            <button 
                onClick={() => setIsChatOpen(!isChatOpen)} 
                className={`p-2.5 rounded-xl transition-all shadow-lg active:scale-95 ${isChatOpen ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-indigo-600'}`}
            >
                {isChatOpen ? <X size={20}/> : <Bot size={20}/>}
            </button>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {step === 'loading' ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white z-50">
                <CircleDashed className="animate-spin text-indigo-600" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-6">Analyse structurée en cours...</p>
            </div>
        ) : (
            <div className="flex-1 relative flex flex-col overflow-hidden bg-slate-50">
                
                {/* --- SEPARATION STRICTE MOBILE / DESKTOP --- */}
                {isMobile ? (
                    mobilePhase === 'overview' ? <MobileOverview /> : <MobileLearningView />
                ) : (
                    <div 
                        ref={viewportRef}
                        className="flex-1 relative overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:40px_40px] cursor-grab active:cursor-grabbing"
                        onMouseDown={() => setIsDragging(true)}
                        onMouseMove={(e) => isDragging && setOffset(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }))}
                        onMouseUp={() => setIsDragging(false)}
                        onWheel={(e) => setScale(s => Math.min(Math.max(s - e.deltaY * 0.001, 0.2), 2.5))}
                    >
                        <div 
                            ref={mapContentRef}
                            className="absolute transform-gpu origin-top-left p-[2000px] will-change-transform"
                            style={{ 
                                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                                transition: (isDragging || isNavigating) ? 'none' : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' 
                            }}
                        >
                            {mindMap && (
                                <MindMapTree 
                                    node={mindMap} 
                                    rootChildren={mindMap.children || []}
                                    onExpand={(id) => setMindMap(prev => {
                                        const update = (n: any): any => n.id === id ? { ...n, isExpanded: !n.isExpanded } : { ...n, children: n.children?.map(update) };
                                        return prev ? update(prev) : null;
                                    })} 
                                    onToggleDescription={(id) => setMindMap(prev => {
                                        const update = (n: any): any => n.id === id ? { ...n, isDescriptionOpen: !n.isDescriptionOpen } : { ...n, children: n.children?.map(update) };
                                        return prev ? update(prev) : null;
                                    })} 
                                    onAskDeepExplanation={(label) => { setIsChatOpen(true); setRightSideMode('ai'); handleSendMessage(`Explique ${label}`); }}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* --- BARRE DE NAVIGATION (FIXÉE AU BAS) --- */}
                <div className="absolute bottom-6 left-0 right-0 px-4 z-50">
                   <div className="bg-white/95 backdrop-blur-xl border border-slate-200 p-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-lg mx-auto overflow-hidden">
                        
                        {/* Mobile : Switcher Overview/Learning | PC : Précédent */}
                        {isMobile && mobilePhase === 'learning' ? (
                            <button onClick={() => setMobilePhase('overview')} className="p-3 bg-slate-100 rounded-xl text-slate-500 active:scale-95 transition-all">
                                <RotateCcw size={20}/>
                            </button>
                        ) : (
                            <button onClick={() => goToTourStep(tourIndex - 1)} disabled={tourIndex === 0} className="p-3 bg-slate-100 rounded-xl disabled:opacity-30"><ChevronLeft size={20}/></button>
                        )}
                        
                        <div className="flex-1 flex flex-col items-center min-w-0">
                            <span className="text-[9px] font-black uppercase text-indigo-600 truncate w-full text-center tracking-widest">
                                Étape {tourIndex + 1} / {tourSequence.length} • {tourSequence[tourIndex]?.phase === 'plan' ? 'Survol' : 'Détails'}
                            </span>
                            <span className="text-[12px] font-bold text-slate-800 truncate w-full text-center">
                                {tourSequence[tourIndex]?.label}
                            </span>
                        </div>

                        {/* Mobile Overview: Bouton Commencer / Reprendre */}
                        {isMobile && mobilePhase === 'overview' ? (
                            <button 
                                onClick={() => {
                                    if(tourIndex > 0) setMobilePhase('learning');
                                    else goToTourStep(1);
                                }}
                                className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                            >
                                {tourIndex > 0 ? 'Reprendre' : 'Démarrer'} <ChevronRight size={16}/>
                            </button>
                        ) : (
                            <button 
                                onClick={() => goToTourStep(tourIndex + 1)} 
                                disabled={tourIndex >= tourSequence.length - 1}
                                className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                            >
                                {isNavigating ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                                <span>Suivant</span>
                            </button>
                        )}
                   </div>
                </div>

                {!isMobile && (
                    <div className="absolute left-6 top-6 flex flex-col gap-2">
                        <button onClick={() => setScale(s => Math.min(s+0.2, 2.5))} className="p-3 bg-white border border-slate-200 rounded-xl shadow-lg"><ZoomIn size={18}/></button>
                        <button onClick={() => setScale(s => Math.max(s-0.2, 0.2))} className="p-3 bg-white border border-slate-200 rounded-xl shadow-lg"><ZoomOut size={18}/></button>
                    </div>
                )}
            </div>
        )}

        {/* --- ATELIER IA / PDF (OVERLAY PLEIN ÉCRAN SUR MOBILE) --- */}
        <div className={`bg-white shadow-2xl z-[100] transition-all duration-300 ${isChatOpen ? 'fixed inset-0 md:relative md:w-[450px] md:border-l md:border-slate-200' : 'w-0 overflow-hidden'}`}>
            <div className="flex flex-col h-full">
                {/* Header Atelier Mobile */}
                <div className="flex bg-slate-50 border-b border-slate-100 shrink-0 items-center pr-2">
                    <button onClick={() => setRightSideMode('ai')} className={`flex-1 py-4 text-xs font-bold border-b-2 transition-all ${rightSideMode === 'ai' ? 'text-indigo-600 border-indigo-600 bg-white' : 'text-slate-400 border-transparent'}`}>Assistant IA</button>
                    <button onClick={() => setRightSideMode('pdf')} className={`flex-1 py-4 text-xs font-bold border-b-2 transition-all ${rightSideMode === 'pdf' ? 'text-indigo-600 border-indigo-600 bg-white' : 'text-slate-400 border-transparent'}`}>Source PDF</button>
                    
                    {isMobile && (
                        <button 
                            onClick={() => setIsChatOpen(false)}
                            className="p-3 text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30 relative">
                    {rightSideMode === 'ai' ? (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pb-24">
                                {chatMessages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-10">
                                        <Bot size={48} className="mb-4" />
                                        <p className="text-sm font-medium">Posez une question sur le concept actuel pour débloquer de nouvelles explications.</p>
                                    </div>
                                )}
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[90%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-800 shadow-sm'}`}>
                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        </div>
                                    </div>
                                ))}
                                {isLoadingChat && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin text-indigo-600"/>
                                            <span className="text-[10px] text-slate-400 font-black uppercase">Dr. Gemini réfléchit...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-0 inset-x-0 p-4 border-t border-slate-100 bg-white md:relative">
                                <div className="relative flex gap-2">
                                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Une question ?" className="flex-1 px-4 py-3 bg-slate-100 rounded-xl outline-none text-sm font-medium" />
                                    <button onClick={() => handleSendMessage()} className="w-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center transition-transform active:scale-90"><Send size={18}/></button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col bg-slate-200">
                            <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aperçu Source • Page {pdfPage}</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setPdfPage(p => Math.max(1, p - 1))} className="p-2 bg-slate-50 rounded-lg"><ChevronLeft size={16}/></button>
                                    <button onClick={() => setPdfPage(p => Math.min(pdfTotalPages, p + 1))} className="p-2 bg-slate-50 rounded-lg"><ChevronRight size={16}/></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto p-4 bg-slate-300/50 flex justify-center">
                                <canvas ref={canvasRef} className="shadow-2xl bg-white rounded-sm h-fit max-w-full" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
        @media (max-width: 768px) {
            .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        }
      `}</style>
    </div>
  );
};

// COMPOSANT MIND MAP TREE (DESKTOP)
const MindMapTree: React.FC<{ 
    node: MindMapNode, 
    level?: number, 
    rootChildren: MindMapNode[],
    onExpand: (id: string) => void, 
    onToggleDescription: (id: string) => void,
    onAskDeepExplanation: (label: string) => void
}> = ({ node, level = 0, rootChildren, onExpand, onToggleDescription, onAskDeepExplanation }) => {
    const hasChildren = node.children && node.children.length > 0;
    return (
        <div className="flex items-center relative py-6">
            <div id={`node-${node.id}`} className="relative z-10 flex items-center">
                <div className={`rounded-2xl shadow-xl border-2 transition-all w-[280px] bg-white overflow-hidden ${level === 0 ? 'border-indigo-500 ring-4 ring-indigo-50' : level === 1 ? 'border-emerald-400' : 'border-slate-200'}`}>
                    <div onClick={() => onToggleDescription(node.id)} className="px-5 py-4 cursor-pointer flex items-center justify-between gap-3">
                        <div className="flex-1 flex flex-col">
                            <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">{level === 0 ? 'Maitre' : `Concept ${level}`}</span>
                            <span className="font-bold text-sm text-slate-900 leading-tight">{node.label}</span>
                        </div>
                        {node.isDescriptionOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </div>
                    {node.isDescriptionOpen && (
                        <div className="px-5 pb-5 animate-in slide-in-from-top-2">
                            <div className="text-[11px] text-slate-500 italic mb-4">
                                <ReactMarkdown>{node.description}</ReactMarkdown>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); onAskDeepExplanation(node.label); }} className="w-full py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2"><Bot size={14}/> Approfondir</button>
                        </div>
                    )}
                </div>
                {level < MAX_DEPTH && (
                    <button onClick={(e) => { e.stopPropagation(); onExpand(node.id); }} className={`absolute -right-6 w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-xl transition-all ${node.isExpanded ? 'bg-slate-900 border-slate-700 text-white rotate-180' : 'bg-white border-indigo-500 text-indigo-600'}`}>
                        {node.isLoading ? <Loader2 size={18} className="animate-spin" /> : (node.isExpanded ? <Activity size={20} /> : <Zap size={20} fill={node.isLoaded ? "currentColor" : "none"} />)}
                    </button>
                )}
            </div>
            {hasChildren && node.isExpanded && (
                <div className="flex flex-col ml-24 relative">
                    <svg className="absolute top-0 bottom-0 -left-24 w-24 pointer-events-none overflow-visible">
                        {node.children!.map((child, idx) => {
                            const step = 100 / node.children!.length;
                            const yPos = (idx + 0.5) * step;
                            return <path key={child.id} d={`M 0 50% C 30 50%, 30 ${yPos}%, 100 ${yPos}%`} className="stroke-slate-200 fill-none" strokeWidth="2" vectorEffect="non-scaling-stroke"/>;
                        })}
                    </svg>
                    {node.children!.map((child) => <MindMapTree key={child.id} node={child} level={level + 1} rootChildren={rootChildren} onExpand={onExpand} onToggleDescription={onToggleDescription} onAskDeepExplanation={onAskDeepExplanation}/>)}
                </div>
            )}
        </div>
    );
};

export default GuidedLearningBeta;