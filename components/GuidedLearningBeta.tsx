import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ArrowLeft, Send, BrainCircuit, Loader2, Sparkles, ZoomIn, ZoomOut, Move, Wand2, Bot, ChevronDown, ChevronUp, Dna, Activity, Zap, CircleDashed, Atom, AlertCircle, ChevronRight, MessageSquare, Settings2, LayoutList, Info, X, ChevronLeft, Play, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
  const [autoCloseSiblings, setAutoCloseSiblings] = useState(true);
  
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

  /**
   * CONSTRUCTION DU CHEMIN PÉDAGOGIQUE DYNAMIQUE
   * Phase 1 (Plan) : Racine -> Chapitre 1 -> Chapitre 2...
   * Phase 2 (Immersion) : Chapitre 1 -> Détails Chap 1 -> Chapitre 2 -> Détails Chap 2...
   */
  const tourSequence = useMemo(() => {
    if (!mindMap) return [];
    
    const sequence: {id: string, label: string, level: number, phase: 'plan' | 'deep'}[] = [];
    
    // 1. Racine (Titre)
    sequence.push({ id: mindMap.id, label: mindMap.label, level: 0, phase: 'plan' });
    
    // 2. PHASE PLAN : Les chapitres (Niveau 1)
    const chapters = mindMap.children || [];
    chapters.forEach((child, idx) => {
        sequence.push({ id: child.id, label: `Plan : Chapitre ${idx + 1}`, level: 1, phase: 'plan' });
    });

    // 3. PHASE PROFONDEUR : Immersion totale
    chapters.forEach((chapter, idx) => {
        // RE-PASSAGE SUR LE CHAPITRE pour marquer la transition vers ses détails
        sequence.push({ id: chapter.id, label: `Immersion : Chapitre ${idx + 1}`, level: 1, phase: 'deep' });

        const traverseDeep = (node: MindMapNode, level: number) => {
            if (level >= 2) {
                sequence.push({ id: node.id, label: node.label, level: level, phase: 'deep' });
            }
            if (node.children) {
                node.children.forEach(c => traverseDeep(c, level + 1));
            }
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
    } catch (e) {
      return text;
    }
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
                if (current.id === nodeId) {
                    return { ...current, children: data.children, isLoaded: true, isLoading: false };
                }
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
            initialMap.children.forEach((child: any) => {
                prefetchChildren(child.id, child.label, 1);
            });
        }
    } catch (error: any) {
        setStep('init');
    }
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
    if (setOffTrack && tourSequence[tourIndex]?.id !== nodeId) {
        setIsOffTrack(true);
    }

    setMindMap(prev => {
        if (!prev) return null;
        const updateRecursive = (current: MindMapNode): MindMapNode => {
            if (current.id === nodeId) {
                return { ...current, ...updates };
            }
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

  // NAVIGATION PAS À PAS SÉCURISÉE ET SCÉNARISÉE
  const goToTourStep = async (index: number) => {
    if (index < 0 || index >= tourSequence.length || isNavigating) return;
    
    const target = tourSequence[index];
    
    // Vérification du nœud
    let targetNode: MindMapNode | undefined;
    const findNode = (n: MindMapNode) => {
        if (n.id === target.id) targetNode = n;
        else if (n.children) n.children.forEach(findNode);
    };
    if (mindMap) findNode(mindMap);

    // Anti-spam sur les nœuds en chargement
    if (!targetNode || targetNode.isLoading) {
        return; 
    }

    setIsNavigating(true);
    setTourIndex(index);
    setIsOffTrack(false);

    setMindMap(prev => {
        if (!prev) return null;
        const updateRecursive = (current: MindMapNode): MindMapNode => {
            if (current.id === target.id) {
                // PHASE PLAN : On n'ouvre PAS les branches enfants (isExpanded: false) pour ne pas spoiler
                // PHASE IMMERSION : On ouvre les branches (isExpanded: true) pour explorer
                const shouldExpand = target.phase === 'deep';
                
                // Pré-chargement silencieux pour les étapes suivantes
                if (current.children) {
                    current.children.forEach(child => {
                        if (!child.isLoaded && !child.isLoading) {
                            prefetchChildren(child.id, child.label, target.level + 1);
                        }
                    });
                }
                
                return { 
                    ...current, 
                    isExpanded: shouldExpand, 
                    isDescriptionOpen: true 
                };
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
                    // Les parents du chemin doivent rester ouverts
                    isExpanded: containsTarget(current) ? true : current.isExpanded,
                    children: current.children.map(child => {
                        if (autoCloseSiblings && isSiblingLevel && child.id !== target.id && child.isExpanded) {
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

    setTimeout(() => {
        focusOnNode(target.id, 1.25);
        setIsNavigating(false);
    }, 450);
  };

  const handleNext = () => {
    if (isOffTrack) {
        goToTourStep(tourIndex);
    } else {
        goToTourStep(tourIndex + 1);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoadingChat) return;
    const text = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    setIsLoadingChat(true);
    try {
        const res = await callGemini(`Tuteur médical expert. Question sur le concept "${tourSequence[tourIndex]?.label}". Question : ${text}`);
        setChatMessages(prev => [...prev, { role: 'model', text: res }]);
    } catch (e: any) {
        setChatMessages(prev => [...prev, { role: 'model', text: "Erreur IA." }]);
    } finally {
        setIsLoadingChat(false);
    }
  };

  // Anti-Spam Logic
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
                <h2 className="font-bold text-slate-900 text-lg tracking-tight">Flow Medical <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded ml-2 uppercase font-black">Pathfinder v20</span></h2>
            </div>
        </div>
        <div className="flex items-center gap-2 relative">
            <button 
                onClick={() => setAutoCloseSiblings(!autoCloseSiblings)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${autoCloseSiblings ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
            >
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
                    const newOffsetX = mouseX - (mouseX - offset.x) * ratio;
                    const newOffsetY = mouseY - (mouseY - offset.y) * ratio;
                    setScale(newScale);
                    setOffset({ x: newOffsetX, y: newOffsetY });
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
                            />
                        )}
                    </div>
                </div>

                {/* NAVIGATION TOUR FLOATING BAR */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
                   <div className="bg-white/95 backdrop-blur-2xl border border-slate-200 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10 duration-700 ring-1 ring-black/5">
                        <button 
                            onClick={() => goToTourStep(tourIndex - 1)}
                            disabled={tourIndex === 0 || isNavigating}
                            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl disabled:opacity-30 transition-all active:scale-90"
                        >
                            <ChevronLeft size={24}/>
                        </button>

                        <div className="flex flex-col items-center min-w-[240px]">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${tourSequence[tourIndex]?.phase === 'plan' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    {tourSequence[tourIndex]?.phase === 'plan' ? 'Phase 1 : Survol du plan' : 'Phase 2 : Immersion profonde'}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">Étape {tourIndex + 1}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-800 truncate max-w-[300px]">
                                {tourSequence[tourIndex]?.label}
                            </span>
                        </div>

                        <button 
                            onClick={handleNext}
                            disabled={(tourIndex >= tourSequence.length - 1 && !isOffTrack) || isNavigating || (isNextStepLocked && !isOffTrack)}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold transition-all active:scale-95 shadow-lg ${isOffTrack ? 'bg-amber-500 text-white shadow-amber-200 hover:bg-amber-600' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'} disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none min-w-[180px] justify-center`}
                        >
                            {isNavigating || (isNextStepLocked && !isOffTrack) ? (
                                <><Loader2 size={20} className="animate-spin"/> IA en cours...</>
                            ) : isOffTrack ? (
                                <><RotateCcw size={20}/> Reprendre</>
                            ) : (
                                <><Sparkles size={20}/> {tourIndex === 0 ? "Commencer" : "Suivant"}</>
                            )}
                        </button>
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

            <div className={`bg-white border-l border-slate-200 flex flex-col shadow-2xl z-30 transition-all duration-300 ${isChatOpen ? 'w-[420px]' : 'w-0 overflow-hidden'}`}>
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider"><Bot className="text-indigo-600" size={16}/> Assistant IA</h3>
                    <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400">
                        <ChevronRight size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white scrollbar-hide">
                    {chatMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center px-10">
                            <Atom className="text-indigo-100 mb-4 animate-spin-slow" size={48}/>
                            <p className="text-slate-400 italic text-sm">Approfondissez ce concept avec l'IA.</p>
                        </div>
                    )}
                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[95%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isLoadingChat && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-indigo-600" size={24}/></div>}
                </div>
                <div className="p-5 border-t border-slate-100 shrink-0">
                    <div className="relative">
                        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Une question ?" className="w-full pl-6 pr-14 py-4 bg-slate-100 border-none rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500" />
                        <button onClick={() => handleSendMessage()} className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all"><Send size={18}/></button>
                    </div>
                </div>
            </div>
        </div>
      )}
      <style>{`
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 12s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes border-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-border-spin {
            animation: border-spin 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

const MindMapTree: React.FC<{ 
    node: MindMapNode, 
    level?: number, 
    rootChildren: MindMapNode[],
    onExpand: (id: string, label: string, level: number) => void, 
    onToggleDescription: (id: string) => void 
}> = ({ node, level = 0, rootChildren, onExpand, onToggleDescription }) => {
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = level < MAX_DEPTH;
    const isReady = node.isLoaded;

    // Calcul du numéro de chapitre si c'est le niveau 1
    const chapterNumber = level === 1 ? rootChildren.findIndex(c => c.id === node.id) + 1 : null;
    
    return (
        <div className="flex items-center relative py-6">
            <div className="flex items-center">
                <div id={`node-${node.id}`} className="relative z-10 flex flex-col items-center">
                    <div 
                        className={`
                            rounded-2xl shadow-xl border-2 transition-all w-[300px] min-h-[90px] overflow-hidden flex flex-col bg-white
                            ${level === 0 ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-indigo-100' : 
                              level === 1 ? 'border-emerald-400 shadow-emerald-50' : 
                              level === 2 ? 'border-amber-300 shadow-amber-50' :
                              'border-slate-200'}
                            ${node.isLoading ? 'opacity-60 grayscale' : 'hover:shadow-2xl hover:-translate-y-1 duration-300'}
                        `}
                    >
                        <div 
                            onClick={() => onToggleDescription(node.id)}
                            className="px-6 py-5 cursor-pointer flex items-center justify-between gap-4 group"
                        >
                            <div className="flex flex-col gap-2 flex-1">
                                <span className={`uppercase tracking-widest text-[9px] font-black opacity-60 ${level === 0 ? 'text-indigo-600' : level === 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {level === 0 ? 'CONCEPT MAÎTRE' : level === 1 ? `CHAPITRE ${chapterNumber}` : 'DÉTAIL'}
                                </span>
                                <span className="font-bold text-[14px] text-slate-900 leading-tight">
                                    {node.label}
                                </span>
                            </div>
                            <div className="p-1.5 rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors text-slate-400 shrink-0">
                                {node.isDescriptionOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                            </div>
                        </div>

                        {node.isDescriptionOpen && (
                            <div className="px-6 pb-6 pt-0 text-[12px] leading-relaxed animate-in slide-in-from-top-2 duration-300 text-slate-600 italic border-t border-slate-50 mt-1">
                                <ReactMarkdown>{node.description || "Analyse approfondie en cours..."}</ReactMarkdown>
                            </div>
                        )}
                    </div>

                    {canExpand && (
                        <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 z-20">
                            {!isReady && !node.isExpanded && (
                                <div className="absolute inset-0 rounded-full border-2 border-indigo-100 border-t-indigo-600 animate-border-spin pointer-events-none"></div>
                            )}
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); onExpand(node.id, node.label, level); }}
                                className={`
                                    w-full h-full rounded-full border-2 flex items-center justify-center shadow-xl transition-all hover:scale-110
                                    ${node.isExpanded ? 'bg-slate-900 border-slate-700 text-white rotate-180' : 'bg-white border-indigo-500 text-indigo-600'}
                                    ${!isReady && !node.isExpanded ? 'border-transparent' : ''}
                                    ${node.isLoading ? 'animate-pulse cursor-wait' : ''}
                                `}
                            >
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
                                    <path 
                                        key={child.id}
                                        d={`M 0 50% C 64 50%, 64 ${yPos}%, 100 ${yPos}%`}
                                        className={`${level === 0 ? 'stroke-indigo-300' : level === 1 ? 'stroke-emerald-200' : 'stroke-slate-200'} fill-none transition-all duration-500`}
                                        strokeWidth="3"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                );
                            })}
                        </svg>

                        {node.children!.map((child) => (
                            <MindMapTree 
                                key={child.id} 
                                node={child} 
                                level={level + 1} 
                                rootChildren={rootChildren}
                                onExpand={onExpand} 
                                onToggleDescription={onToggleDescription} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GuidedLearningBeta;