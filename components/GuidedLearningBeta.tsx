import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ArrowLeft, Send, BrainCircuit, Loader2, Sparkles, ZoomIn, ZoomOut, Move, Wand2, Bot, ChevronDown, ChevronUp, Dna, Activity, Zap, CircleDashed, Atom, AlertCircle } from 'lucide-react';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pdfText] = useState(initialText || '');
  const [mindMap, setMindMap] = useState<MindMapNode | null>(null);
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  
  const [scale, setScale] = useState(0.8);
  const [offset, setOffset] = useState({ x: 200, y: 250 });
  const [isDragging, setIsDragging] = useState(false);
  
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialFile || initialText) handleStart();
  }, []);

  const extractJson = (text: string) => {
    try {
      const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      return match ? match[0] : text;
    } catch (e) {
      return text;
    }
  };

  const callGemini = async (prompt: string, jsonMode: boolean = false): Promise<string> => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey || apiKey === "undefined") {
        throw new Error("Clé API Gemini non détectée. Vérifiez vos variables d'environnement.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: jsonMode ? { 
          responseMimeType: "application/json",
          temperature: 0.1 
        } : { temperature: 0.7 }
      });
      
      const text = response.text;
      if (!text) {
        throw new Error("Le modèle a retourné une réponse vide.");
      }
      return text;
    } catch (error: any) {
      console.error("Gemini Error:", error);
      throw error;
    }
  };

  const handleStart = async () => {
    if (!pdfText) return;
    setStep('loading');
    setErrorMsg(null);
    try {
        const prompt = `Analyse ce cours de médecine. Génère un titre principal court et 5 chapitres majeurs.
        IMPORTANT: 'label' (max 4 mots), 'description' (explication détaillée).
        TEXTE : ${pdfText.substring(0, 150000)}
        FORMAT JSON : { "id": "root", "label": "Titre", "description": "...", "children": [{"id": "c1", "label": "Chapitre", "description": "..."}] }`;

        const res = await callGemini(prompt, true);
        const jsonStr = extractJson(res);
        const data = JSON.parse(jsonStr);
        
        const initialMap = { ...data, isExpanded: true, isLoaded: true };
        setMindMap(initialMap);
        setStep('workspace');

        initialMap.children?.forEach((child: any) => prefetchNode(child.id, child.label, 1));
    } catch (error: any) {
        console.error(error);
        setErrorMsg(error.message || "Impossible de générer la Mind Map.");
        setStep('init');
    }
  };

  const prefetchNode = async (nodeId: string, label: string, currentDepth: number) => {
    if (currentDepth >= MAX_DEPTH) return;

    try {
        const prompt = `Sujet : ${label}. Détaille en 4 points atomiques précis.
        CONSIGNE: 'label' (max 4 mots), 'description' pédagogique.
        CONTEXTE : ${pdfText.substring(0, 80000)}
        FORMAT JSON : [{"id": "${nodeId}_pre", "label": "...", "description": "..."}]`;

        const res = await callGemini(prompt, true);
        const jsonStr = extractJson(res);
        const children = JSON.parse(jsonStr);
        
        setMindMap(prev => {
            if (!prev) return null;
            const updateRecursive = (current: MindMapNode): MindMapNode => {
                if (current.id === nodeId) return { ...current, children, isLoaded: true };
                if (current.children) return { ...current, children: current.children.map(updateRecursive) };
                return current;
            };
            return updateRecursive(prev);
        });
    } catch (e) {
        console.warn("Prefetch failed for", nodeId);
    }
  };

  const focusOnNode = useCallback((nodeId: string) => {
    requestAnimationFrame(() => {
        const element = document.getElementById(`node-${nodeId}`);
        const viewport = viewportRef.current;
        if (!element || !viewport) return;

        const targetScale = 1.3; 
        
        const rect = element.getBoundingClientRect();
        const viewRect = viewport.getBoundingClientRect();

        const deltaX = (viewRect.left + viewRect.width / 2) - (rect.left + rect.width / 2);
        const deltaY = (viewRect.top + viewRect.height / 2) - (rect.top + rect.height / 2);

        setScale(targetScale);
        setOffset(prev => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY
        }));
    });
  }, []);

  const toggleExpand = (nodeId: string, label: string, depth: number) => {
    setMindMap(prev => {
        if (!prev) return null;

        const updateRecursive = (current: MindMapNode): MindMapNode => {
            if (current.id === nodeId) {
                const isOpening = !current.isExpanded;
                if (isOpening) {
                    focusOnNode(nodeId);
                    if (current.isLoaded && current.children && depth < MAX_DEPTH) {
                        current.children.forEach(c => {
                            if (!c.isLoaded) prefetchNode(c.id, c.label, depth + 1);
                        });
                    }
                }
                return { ...current, isExpanded: isOpening };
            }

            if (current.children) {
                const targetInThisLevel = current.children.some(c => c.id === nodeId);
                return { 
                    ...current, 
                    children: current.children.map(child => {
                        if (targetInThisLevel && child.id !== nodeId) {
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

  const toggleDescription = (nodeId: string) => {
    setMindMap(prev => {
        if (!prev) return null;
        const updateRecursive = (current: MindMapNode): MindMapNode => {
            if (current.id === nodeId) {
                if (!current.isDescriptionOpen) focusOnNode(nodeId);
                return { ...current, isDescriptionOpen: !current.isDescriptionOpen };
            }
            if (current.children) return { ...current, children: current.children.map(updateRecursive) };
            return current;
        };
        return updateRecursive(prev);
    });
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const text = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    setIsLoadingChat(true);
    try {
        const res = await callGemini(`Tuteur médecine. Question: ${text}`);
        setChatMessages(prev => [...prev, { role: 'model', text: res || "Désolé, je n'ai pas pu obtenir de réponse." }]);
    } catch (e: any) {
        setChatMessages(prev => [...prev, { role: 'model', text: `Erreur IA : ${e.message || "Échec de connexion"}` }]);
    } finally {
        setIsLoadingChat(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden font-sans">
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"><ArrowLeft size={22}/></button>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Activity size={24}/></div>
                <h2 className="font-bold text-slate-900 text-lg tracking-tight">Flow Medical <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded ml-2 uppercase font-black tracking-widest">Focus Mode v5</span></h2>
            </div>
        </div>
      </header>

      {step === 'loading' ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white">
            <div className="relative">
                <CircleDashed className="animate-spin text-indigo-600" size={64} strokeWidth={1} />
                <Dna className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" size={24}/>
            </div>
            <p className="text-slate-500 font-black animate-pulse uppercase tracking-widest text-xs mt-8 text-center px-6">Analyse structurelle et préparation du focus...</p>
        </div>
      ) : step === 'init' && errorMsg ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white p-8">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Erreur de communication IA</h3>
            <p className="text-slate-500 text-center max-w-md mb-6">{errorMsg}</p>
            <button onClick={handleStart} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700">Réessayer</button>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
            <div 
                ref={viewportRef}
                className="flex-[3] relative overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] cursor-grab active:cursor-grabbing"
                onMouseDown={() => setIsDragging(true)}
                onMouseMove={(e) => isDragging && setOffset(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }))}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onWheel={(e) => setScale(s => Math.min(Math.max(s - e.deltaY * 0.001, 0.2), 2.5))}
            >
                <div 
                    className="absolute transform-gpu transition-all duration-500 ease-out origin-top-left p-[500px]"
                    style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
                >
                    {mindMap && <MindMapTree node={mindMap} onExpand={toggleExpand} onToggleDescription={toggleDescription} />}
                </div>

                <div className="absolute bottom-8 left-8 flex flex-col gap-2">
                    <div className="bg-white p-2 rounded-2xl shadow-2xl border border-slate-200 flex flex-col gap-2">
                        <button onClick={() => setScale(s => Math.min(s + 0.2, 2.5))} className="p-3 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"><ZoomIn size={22}/></button>
                        <button onClick={() => setScale(s => Math.max(s - 0.2, 0.2))} className="p-3 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"><ZoomOut size={22}/></button>
                        <button onClick={() => {setOffset({x: 200, y: 250}); setScale(0.8);}} className="p-3 hover:bg-slate-50 text-slate-600 rounded-lg border-t border-slate-100 transition-colors"><Move size={22}/></button>
                    </div>
                </div>
            </div>

            <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-30">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider"><Bot className="text-indigo-600" size={16}/> Assistant Contextuel</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white">
                    {chatMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center px-10">
                            <Atom className="text-indigo-200 mb-4 animate-spin-slow" size={48}/>
                            <p className="text-slate-400 italic text-sm">Cliquez sur un concept pour zoomer et afficher le détail.</p>
                        </div>
                    )}
                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                            <div className={`max-w-[95%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-50 border border-slate-100 text-slate-800 shadow-sm'}`}>
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isLoadingChat && <Loader2 className="animate-spin text-indigo-600 mx-auto" size={24}/>}
                </div>
                <div className="p-5 border-t border-slate-100">
                    <div className="relative">
                        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Une question précise ?" className="w-full pl-6 pr-14 py-4 bg-slate-100 border-none rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />
                        <button onClick={() => handleSendMessage()} className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors"><Send size={18}/></button>
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
      `}</style>
    </div>
  );
};

// Fixed: Added React.FC type to handle key prop correctly in recursive map
const MindMapTree: React.FC<{ 
    node: MindMapNode, 
    level?: number, 
    onExpand: (id: string, l: string, d: number) => void, 
    onToggleDescription: (id: string) => void 
}> = ({ node, level = 0, onExpand, onToggleDescription }) => {
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = level < MAX_DEPTH;
    
    return (
        <div className="flex items-center relative py-6">
            <div className="flex items-center">
                <div id={`node-${node.id}`} className="relative z-10 flex flex-col items-center">
                    <div 
                        className={`
                            rounded-2xl shadow-xl border-2 transition-all w-[260px] overflow-hidden flex flex-col bg-white
                            ${level === 0 ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-indigo-100' : 
                              level === 1 ? 'border-emerald-400' : 
                              level === 2 ? 'border-amber-300' :
                              'border-slate-200'}
                            ${node.isLoading ? 'animate-pulse opacity-70' : 'hover:scale-[1.02]'}
                        `}
                    >
                        <div 
                            onClick={() => onToggleDescription(node.id)}
                            className="px-5 py-5 cursor-pointer flex items-center justify-between gap-3 group"
                        >
                            <div className="flex flex-col gap-1">
                                <span className={`uppercase tracking-widest text-[9px] font-black opacity-50 ${level === 0 ? 'text-indigo-600' : level === 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {level === 0 ? 'CONCEPT MAÎTRE' : level === 1 ? 'SECTION' : 'DÉTAIL'}
                                </span>
                                <span className={`font-bold text-[12px] leading-snug flex-1 line-clamp-2 ${level < 3 ? 'text-slate-900' : 'text-slate-600'}`}>{node.label}</span>
                            </div>
                            <div className="p-1.5 rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors text-slate-400">
                                {node.isDescriptionOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                            </div>
                        </div>

                        {node.isDescriptionOpen && (
                            <div className="px-5 pb-5 pt-0 text-[11px] leading-relaxed animate-in slide-in-from-top-2 duration-300 text-slate-500 italic border-t border-slate-50 mt-1">
                                <ReactMarkdown>{node.description || "Analyse profonde..."}</ReactMarkdown>
                            </div>
                        )}
                    </div>

                    {canExpand && (node.isLoaded || node.isLoading) && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onExpand(node.id, node.label, level); }}
                            className={`
                                absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-xl transition-all z-20 hover:scale-110
                                ${node.isExpanded ? 'bg-slate-900 border-slate-700 text-white rotate-180' : 'bg-white border-indigo-500 text-indigo-600'}
                            `}
                        >
                            {node.isExpanded ? <Activity size={20} /> : <Zap size={20} fill={node.isLoaded ? "currentColor" : "none"} />}
                            {node.isLoading && <Loader2 size={14} className="absolute animate-spin text-indigo-400" />}
                        </button>
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
                                        className={`${level === 0 ? 'stroke-indigo-300' : level === 1 ? 'stroke-emerald-200' : 'stroke-slate-200'} fill-none`}
                                        strokeWidth="2.5"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                );
                            })}
                        </svg>

                        {node.children!.map((child) => (
                            <MindMapTree key={child.id} node={child} level={level + 1} onExpand={onExpand} onToggleDescription={onToggleDescription} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GuidedLearningBeta;