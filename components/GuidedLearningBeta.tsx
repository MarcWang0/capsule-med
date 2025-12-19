import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ArrowLeft, Send, BrainCircuit, Loader2, Sparkles, ZoomIn, ZoomOut, Move, Wand2, Bot, ChevronDown, ChevronUp, Dna, Activity, Zap, CircleDashed, Atom, AlertCircle, ChevronRight, MessageSquare, Settings2, LayoutList, Info, X, ChevronLeft, Play, RotateCcw, FileText, MessagesSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';

// Configuration du worker PDF
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
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [rightSideMode, setRightSideMode] = useState<'ai' | 'pdf'>('ai');
  const [autoCloseSiblings, setAutoCloseSiblings] = useState(true);
  
  // PDF State
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Navigation Tour State
  const [tourIndex, setTourIndex] = useState(0);
  const [isOffTrack, setIsOffTrack] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Map Navigation State
  const [scale, setScale] = useState(1.1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const mapContentRef = useRef<HTMLDivElement>(null);

  // Load PDF document
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

  // Render PDF page
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
      canvas.style.height = "auto";

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
  }, [pdfDoc, pdfPage, rightSideMode]);

  const tourSequence = useMemo(() => {
    if (!mindMap) return [];
    const sequence: {id: string, label: string, level: number, phase: 'plan' | 'deep'}[] = [];
    sequence.push({ id: mindMap.id, label: mindMap.label, level: 0, phase: 'plan' });
    const chapters = mindMap.children || [];
    chapters.forEach((child, idx) => {
        sequence.push({ id: child.id, label: `Plan : Chapitre ${idx + 1}`, level: 1, phase: 'plan' });
    });
    chapters.forEach((chapter, idx) => {
        sequence.push({ id: chapter.id, label: `Immersion : Chapitre ${idx + 1}`, level: 1, phase: 'deep' });
        const traverseDeep = (node: MindMapNode, level: number) => {
            if (level >= 2) sequence.push({ id: node.id, label: node.label, level: level, phase: 'deep' });
            if (node.children) node.children.forEach(c => traverseDeep(c, level + 1));
        };
        traverseDeep(chapter, 1);
    });
    return sequence;
  }, [mindMap]);

  useEffect(() => {
    if (initialText) handleStart();
  }, [initialText]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const extractJson = (text: string) => {
    try {
      const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      return match ? match[0] : text;
    } catch (e) { return text; }
  };

  const callGemini = async (prompt: string, jsonMode: boolean = false, retries = 3, delay = 2000): Promise<string> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: jsonMode ? { 
          responseMimeType: "application/json",
          temperature: 0.1 
        } : { temperature: 0.7 }
      });
      return response.text || "";
    } catch (error: any) {
      if (retries > 0 && (error.status === 429 || error.message?.includes('429'))) {
        await sleep(delay);
        return callGemini(prompt, jsonMode, retries - 1, delay * 2);
      }
      throw error;
    }
  };

  const prefetchChildren = async (nodeId: string, label: string, level: number) => {
    if (level >= MAX_DEPTH) return;
    try {
        const prompt = `Contexte médical : ${initialText?.substring(0, 5000)}. 
        Approfondis le concept "${label}" avec 3 sous-points précis et techniques pour un étudiant en médecine. 
        FORMAT JSON : { "children": [{"id": "${nodeId}-child-${Date.now()}-${Math.random()}", "label": "...", "description": "...", "isLoaded": false}] }`;
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
    } catch (e) {
        setMindMap(prev => {
            if (!prev) return null;
            const updateRecursive = (current: MindMapNode): MindMapNode => {
                if (current.id === nodeId) return { ...current, isLoading: false, isLoaded: false };
                if (current.children) return { ...current, children: current.children.map(updateRecursive) };
                return current;
            };
            return updateRecursive(prev);
        });
    }
  };

  const handleStart = async () => {
    if (!initialText) return;
    setStep('loading');
    try {
        const prompt = `Analyse ce cours de médecine. Génère un titre principal court et les 4 ou 5 chapitres majeurs. TEXTE : ${initialText.substring(0, 80000)} FORMAT JSON : { "id": "root", "label": "Titre", "description": "Résumé global", "children": [{"id": "c1", "label": "Chapitre 1", "description": "Résumé court"}] }`;
        const res = await callGemini(prompt, true);
        const data = JSON.parse(extractJson(res));
        const initialMap = { ...data, isExpanded: true, isLoaded: true };
        setMindMap(initialMap);
        setStep('workspace');
        if (initialMap.children) {
            initialMap.children.forEach((child: any) => prefetchChildren(child.id, child.label, 1));
        }
    } catch (error: any) { setStep('init'); }
  };

  const focusOnNode = useCallback((nodeId: string, targetScale?: number) => {
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
  }, [scale]);

  const updateNodeState = (nodeId: string, updates: Partial<MindMapNode>, setOffTrack: boolean = true) => {
    if (setOffTrack && tourSequence[tourIndex]?.id !== nodeId) setIsOffTrack(true);
    setMindMap(prev => {
        if (!prev) return null;
        const updateRecursive = (current: MindMapNode): MindMapNode => {
            if (current.id === nodeId) return { ...current, ...updates };
            if (current.children) {
                const isSiblingLevel = current.children.some(c => c.id === nodeId);
                return {
                    ...current,
                    children: current.children.map(child => {
                        if (autoCloseSiblings && isSiblingLevel && child.id !== nodeId && child.isExpanded && updates.isExpanded) {
                            return { ...child, isExpanded: false, isDescriptionOpen: false };
                        }
                        return updateRecursive(child);
                    })
                };
            }
            return current;
        };
        return updateRecursive(prev);
    });
  };

  const toggleExpand = (nodeId: string, label: string, level: number) => {
    if (isNavigating) return;
    setMindMap(prev => {
        if (!prev) return null;
        let isNowExpanded = false;
        const findNode = (n: MindMapNode) => {
            if (n.id === nodeId) isNowExpanded = !n.isExpanded;
            else if (n.children) n.children.forEach(findNode);
        };
        findNode(prev);
        updateNodeState(nodeId, { isExpanded: isNowExpanded });
        if (isNowExpanded) setTimeout(() => focusOnNode(nodeId, 1.1), 300);
        return prev;
    });
  };

  const toggleDescription = (nodeId: string) => {
    if (isNavigating) return;
    setMindMap(prev => {
        if (!prev) return null;
        let isNowOpen = false;
        const findNode = (n: MindMapNode) => {
            if (n.id === nodeId) isNowOpen = !n.isDescriptionOpen;
            else if (n.children) n.children.forEach(findNode);
        };
        findNode(prev);
        updateNodeState(nodeId, { isDescriptionOpen: isNowOpen });
        if (isNowOpen) setTimeout(() => focusOnNode(nodeId, 1.2), 350);
        return prev;
    });
  };

  const goToTourStep = async (index: number) => {
    if (index < 0 || index >= tourSequence.length || isNavigating) return;
    const target = tourSequence[index];
    let targetNode: MindMapNode | undefined;
    const findNode = (n: MindMapNode) => { if (n.id === target.id) targetNode = n; else if (n.children) n.children.forEach(findNode); };
    if (mindMap) findNode(mindMap);
    if (!targetNode || targetNode.isLoading) return; 
    setIsNavigating(true);
    setTourIndex(index);
    setIsOffTrack(false);
    setMindMap(prev => {
        if (!prev) return null;
        const updateRecursive = (current: MindMapNode): MindMapNode => {
            if (current.id === target.id) {
                const shouldExpand = target.phase === 'deep';
                if (current.children) {
                    current.children.forEach(child => {
                        if (!child.isLoaded && !child.isLoading) prefetchChildren(child.id, child.label, target.level + 1);
                    });
                }
                return { ...current, isExpanded: shouldExpand, isDescriptionOpen: true };
            }
            const containsTarget = (node: MindMapNode): boolean => {
                if (node.id === target.id) return true;
                if (node.children) return node.children.some(containsTarget);
                return false;
            };
            if (current.children) {
                const isSiblingLevel = current.children.some(c => c.id === target.id);
                return {
                    ...current,
                    isExpanded: containsTarget(current) ? true : current.isExpanded,
                    children: current.children.map(child => {
                        if (autoCloseSiblings && isSiblingLevel && child.id !== target.id && child.isExpanded) return { ...child, isExpanded: false, isDescriptionOpen: false };
                        return updateRecursive(child);
                    })
                };
            }
            return current;
        };
        return updateRecursive(prev);
    });
    setTimeout(() => { focusOnNode(target.id, 1.25); setIsNavigating(false); }, 450);
  };

  const handleSendMessage = async (customMessage?: string) => {
    const text = customMessage || chatInput;
    if (!text.trim() || isLoadingChat) return;
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    setIsLoadingChat(true);
    try {
        const context = `Tuteur médical expert. Focus sur le concept "${tourSequence[tourIndex]?.label}" extrait du cours PDF.`;
        const res = await callGemini(`${context} Question : ${text}`);
        setChatMessages(prev => [...prev, { role: 'model', text: res }]);
    } catch (e: any) {
        setChatMessages(prev => [...prev, { role: 'model', text: "Erreur IA." }]);
    } finally { setIsLoadingChat(false); }
  };

  const handleAskDeepExplanation = (nodeLabel: string) => {
      setIsChatOpen(true);
      setRightSideMode('ai');
      setTimeout(() => {
          handleSendMessage(`Peux-tu m'expliquer plus en profondeur ce concept : "${nodeLabel}" ? Quels sont les points clés à retenir pour l'examen ?`);
      }, 500);
  };

  const isNextStepLocked = useMemo(() => {
      const nextTarget = tourSequence[tourIndex + 1];
      if (!nextTarget) return false;
      let node: any;
      const find = (n: any) => { if(n.id === nextTarget.id) node = n; else n.children?.forEach(find); };
      if (mindMap) find(mindMap);
      return !node || node.isLoading;
  }, [mindMap, tourIndex, tourSequence]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-[60]">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"><ArrowLeft size={22}/></button>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100"><Activity size={24}/></div>
                <h2 className="font-bold text-slate-900 text-lg tracking-tight">Flow Medical <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded ml-2 uppercase font-black">Pathfinder v22</span></h2>
            </div>
        </div>
        <div className="flex items-center gap-2 relative">
            <button onClick={() => setAutoCloseSiblings(!autoCloseSiblings)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${autoCloseSiblings ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                <LayoutList size={14}/> {autoCloseSiblings ? "Auto-Focus ACTIF" : "Auto-Focus DÉSACTIVÉ"}
            </button>
        </div>
      </header>

      {step === 'loading' ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white">
            <CircleDashed className="animate-spin text-indigo-600" size={64} strokeWidth={1} />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-8 text-center px-10">Exploration de votre cours...</p>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
            {!isChatOpen && (
                <button 
                    onClick={() => setIsChatOpen(true)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-[70] w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white animate-in slide-in-from-right-10"
                >
                    <Bot size={28}/>
                </button>
            )}

            <div 
                ref={viewportRef}
                className="flex-1 relative overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:40px_40px] cursor-grab active:cursor-grabbing"
                onMouseDown={() => setIsDragging(true)}
                onMouseMove={(e) => isDragging && setOffset(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }))}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onWheel={(e) => {
                    if (!viewportRef.current) return;
                    const viewportRect = viewportRef.current.getBoundingClientRect();
                    const mouseX = e.clientX - viewportRect.left;
                    const mouseY = e.clientY - viewportRect.top;
                    const zoomIntensity = 0.001;
                    const delta = -e.deltaY * zoomIntensity;
                    const newScale = Math.min(Math.max(scale + delta, 0.2), 2.5);
                    if (newScale === scale) return;
                    const ratio = newScale / scale;
                    setScale(newScale);
                    setOffset({ x: mouseX - (mouseX - offset.x) * (newScale / scale), y: mouseY - (mouseY - offset.y) * (newScale / scale) });
                }}
            >
                <div 
                    ref={mapContentRef}
                    className="absolute transform-gpu origin-top-left p-[2000px] will-change-transform"
                    style={{ 
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                        transition: (isDragging || isNavigating) ? 'none' : 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)' 
                    }}
                >
                    <div className="flex items-center justify-center min-w-max min-h-max">
                        {mindMap && (
                            <MindMapTree 
                                node={mindMap} 
                                rootChildren={mindMap.children || []}
                                onExpand={toggleExpand} 
                                onToggleDescription={toggleDescription} 
                                onAskDeepExplanation={handleAskDeepExplanation}
                            />
                        )}
                    </div>
                </div>

                {/* BARRE DE NAVIGATION FLOTTANTE */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
                   <div className="bg-white/95 backdrop-blur-2xl border border-slate-200 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 duration-700 ring-1 ring-black/5">
                        <button 
                            onClick={() => goToTourStep(tourIndex - 1)}
                            disabled={tourIndex === 0 || isNavigating}
                            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl disabled:opacity-30 transition-all active:scale-90"
                        >
                            <ChevronLeft size={24}/>
                        </button>

                        <div className="flex flex-col items-center min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${tourSequence[tourIndex]?.phase === 'plan' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    {tourSequence[tourIndex]?.phase === 'plan' ? 'Phase 1 : Survol' : 'Phase 2 : Immersion'}
                                </span>
                            </div>
                            <span className="text-sm font-bold text-slate-800 truncate max-w-[200px]">
                                {tourSequence[tourIndex]?.label}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handleAskDeepExplanation(tourSequence[tourIndex]?.label)}
                                className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-2xl transition-all active:scale-90 border border-indigo-100"
                            >
                                <Bot size={24}/>
                            </button>
                            
                            <button 
                                onClick={() => goToTourStep(tourIndex + 1)}
                                disabled={(tourIndex >= tourSequence.length - 1 && !isOffTrack) || isNavigating || (isNextStepLocked && !isOffTrack)}
                                className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold transition-all active:scale-95 shadow-lg ${isOffTrack ? 'bg-amber-500 text-white shadow-amber-200 hover:bg-amber-600' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'} disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none min-w-[160px] justify-center`}
                            >
                                {isNavigating || (isNextStepLocked && !isOffTrack) ? (
                                    <><Loader2 size={20} className="animate-spin"/> IA...</>
                                ) : isOffTrack ? (
                                    <><RotateCcw size={20}/> Reprendre</>
                                ) : (
                                    <><Sparkles size={20}/> {tourIndex === 0 ? "Début" : "Suivant"}</>
                                )}
                            </button>
                        </div>
                   </div>
                </div>

                <div className="absolute bottom-8 left-8 flex flex-col gap-2">
                    <div className="bg-white p-2 rounded-2xl shadow-2xl border border-slate-200 flex flex-col gap-2">
                        <button onClick={() => setScale(s => Math.min(s + 0.2, 2.5))} className="p-3 hover:bg-slate-50 text-slate-600 rounded-lg"><ZoomIn size={22}/></button>
                        <button onClick={() => setScale(s => Math.max(s - 0.2, 0.2))} className="p-3 hover:bg-slate-50 text-slate-600 rounded-lg"><ZoomOut size={22}/></button>
                        <button onClick={() => focusOnNode('root', 1.0)} className="p-3 hover:bg-slate-50 text-indigo-600 rounded-lg border-t border-slate-100"><Move size={22}/></button>
                    </div>
                </div>
            </div>

            {/* PARTIE DROITE : IA & MON PDF */}
            <div className={`bg-white border-l border-slate-200 flex flex-col shadow-2xl z-[80] transition-all duration-300 relative ${isChatOpen ? 'w-[450px]' : 'w-0 overflow-hidden'}`}>
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider"><Sparkles className="text-indigo-600" size={18}/> Atelier Interactif</h3>
                    <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                        <ChevronRight size={24} />
                    </button>
                </div>
                
                {/* ONGLETS REVISITÉS */}
                <div className="flex bg-slate-50 border-b border-slate-100">
                    <button 
                        onClick={() => setRightSideMode('ai')}
                        className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold transition-all border-b-2 ${rightSideMode === 'ai' ? 'text-indigo-600 border-indigo-600 bg-white' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                    >
                        <Bot size={16}/> Assistant IA
                    </button>
                    <button 
                        onClick={() => setRightSideMode('pdf')}
                        className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold transition-all border-b-2 ${rightSideMode === 'pdf' ? 'text-indigo-600 border-indigo-600 bg-white' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                    >
                        <FileText size={16}/> Mon PDF
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-50/30">
                    {rightSideMode === 'ai' ? (
                        /* MODE CHAT - CONCEPT ACTUEL */
                        <>
                            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
                                {chatMessages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center px-10 py-20">
                                        <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                                            <MessagesSquare size={32}/>
                                        </div>
                                        <h4 className="font-bold text-slate-700 mb-2">Concept Actuel</h4>
                                        <p className="text-slate-400 text-sm italic">Posez vos questions sur le concept de la Mind Map sélectionné.</p>
                                    </div>
                                )}
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[95%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-bl-sm'}`}>
                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        </div>
                                    </div>
                                ))}
                                {isLoadingChat && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-3">
                                            <Loader2 className="animate-spin text-indigo-600" size={18}/>
                                            <span className="text-xs font-medium text-slate-500">Réflexion...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-5 border-t border-slate-100 bg-white shrink-0">
                                <div className="relative">
                                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Question sur ce concept..." className="w-full pl-6 pr-14 py-4 bg-slate-100 border-none rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500" />
                                    <button onClick={() => handleSendMessage()} className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center"><Send size={18}/></button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* MODE PDF - VISUALISATION */
                        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-200">
                            <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Aperçu du cours</span>
                                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg">
                                    <button onClick={() => setPdfPage(p => Math.max(1, p - 1))} className="p-1 hover:text-indigo-600"><ChevronLeft size={16}/></button>
                                    <span className="text-[10px] font-mono font-bold">{pdfPage} / {pdfTotalPages}</span>
                                    <button onClick={() => setPdfPage(p => Math.min(pdfTotalPages, p + 1))} className="p-1 hover:text-indigo-600"><ChevronRight size={16}/></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto p-4 flex justify-center">
                                <canvas ref={canvasRef} className="shadow-lg bg-white rounded-sm max-w-full" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes border-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-border-spin { animation: border-spin 2s linear infinite; }
      `}</style>
    </div>
  );
};

const MindMapTree: React.FC<{ 
    node: MindMapNode, 
    level?: number, 
    rootChildren: MindMapNode[],
    onExpand: (id: string, label: string, level: number) => void, 
    onToggleDescription: (id: string) => void,
    onAskDeepExplanation: (label: string) => void
}> = ({ node, level = 0, rootChildren, onExpand, onToggleDescription, onAskDeepExplanation }) => {
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = level < MAX_DEPTH;
    const isReady = node.isLoaded;
    const chapterNumber = level === 1 ? rootChildren.findIndex(c => c.id === node.id) + 1 : null;
    
    return (
        <div className="flex items-center relative py-6">
            <div className="flex items-center">
                <div id={`node-${node.id}`} className="relative z-10 flex flex-col items-center">
                    <div className={`rounded-2xl shadow-xl border-2 transition-all w-[300px] min-h-[90px] overflow-hidden flex flex-col bg-white ${level === 0 ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-indigo-100' : level === 1 ? 'border-emerald-400 shadow-emerald-50' : level === 2 ? 'border-amber-300 shadow-amber-50' : 'border-slate-200'} ${node.isLoading ? 'opacity-60 grayscale' : 'hover:shadow-2xl hover:-translate-y-1 duration-300'}`}>
                        <div onClick={() => onToggleDescription(node.id)} className="px-6 py-5 cursor-pointer flex items-center justify-between gap-4 group">
                            <div className="flex flex-col gap-2 flex-1">
                                <span className={`uppercase tracking-widest text-[9px] font-black opacity-60 ${level === 0 ? 'text-indigo-600' : level === 1 ? `CHAPITRE ${chapterNumber}` : 'DÉTAIL'}`}>
                                    {level === 0 ? 'CONCEPT MAÎTRE' : level === 1 ? `CHAPITRE ${chapterNumber}` : 'DÉTAIL'}
                                </span>
                                <span className="font-bold text-[14px] text-slate-900 leading-tight">{node.label}</span>
                            </div>
                            <div className="p-1.5 rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors text-slate-400 shrink-0">
                                {node.isDescriptionOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                            </div>
                        </div>

                        {node.isDescriptionOpen && (
                            <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-300 border-t border-slate-50 mt-1">
                                <div className="text-[12px] leading-relaxed text-slate-600 italic mb-4">
                                    <ReactMarkdown>{node.description || "Chargement..."}</ReactMarkdown>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onAskDeepExplanation(node.label); }}
                                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    <Bot size={14}/> Approfondir avec l'IA
                                </button>
                            </div>
                        )}
                    </div>

                    {canExpand && (
                        <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 z-20">
                            {!isReady && !node.isExpanded && <div className="absolute inset-0 rounded-full border-2 border-indigo-100 border-t-indigo-600 animate-border-spin pointer-events-none"></div>}
                            <button onClick={(e) => { e.stopPropagation(); onExpand(node.id, node.label, level); }} className={`w-full h-full rounded-full border-2 flex items-center justify-center shadow-xl transition-all hover:scale-110 ${node.isExpanded ? 'bg-slate-900 border-slate-700 text-white rotate-180' : 'bg-white border-indigo-500 text-indigo-600'} ${!isReady && !node.isExpanded ? 'border-transparent' : ''} ${node.isLoading ? 'animate-pulse cursor-wait' : ''}`}>
                                {node.isLoading ? <Loader2 size={18} className="animate-spin" /> : (node.isExpanded ? <Activity size={20} /> : <Zap size={20} fill={isReady ? "currentColor" : "none"} />)}
                            </button>
                        </div>
                    )}
                </div>

                {hasChildren && node.isExpanded && (
                    <div className="flex flex-col ml-32 relative">
                        <svg className="absolute top-0 bottom-0 -left-32 w-32 pointer-events-none overflow-visible">
                            {node.children!.map((child, idx) => {
                                const step = 100 / node.children!.length;
                                const yPos = (idx + 0.5) * step;
                                return (
                                    <path key={child.id} d={`M 0 50% C 64 50%, 64 ${yPos}%, 100 ${yPos}%`} className={`${level === 0 ? 'stroke-indigo-300' : level === 1 ? 'stroke-emerald-200' : 'stroke-slate-200'} fill-none transition-all duration-500`} strokeWidth="3" vectorEffect="non-scaling-stroke"/>
                                );
                            })}
                        </svg>
                        {node.children!.map((child) => (
                            <MindMapTree key={child.id} node={child} level={level + 1} rootChildren={rootChildren} onExpand={onExpand} onToggleDescription={onToggleDescription} onAskDeepExplanation={onAskDeepExplanation}/>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GuidedLearningBeta;