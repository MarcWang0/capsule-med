import React, { useState, useRef, useEffect } from 'react';
import { extractTextFromPdf } from '../services/pdfService';
import { GoogleGenAI } from "@google/genai";
import { Upload, FileText, MessageSquare, List, HelpCircle, FileInput, Loader2, Send, RotateCcw, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertTriangle, Eye, Bot, Play, X, ArrowLeft, ArrowRight, Sparkles, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Quiz from './Quiz';
import { QuizData } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import GuidedLearningBeta from './GuidedLearningBeta';

// Re-configuration du worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

type Tool = 'chat' | 'summary' | 'flashcards' | 'quiz';
type MobileView = 'document' | 'ai';

interface Flashcard {
  front: string;
  back: string;
}

const DocumentLearning: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [showBeta, setShowBeta] = useState(false);
  
  // PDF Rendering State
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2); 
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Data State
  const [pdfText, setPdfText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [extractionWarning, setExtractionWarning] = useState<string | null>(null);
  
  // UI State
  const [activeTool, setActiveTool] = useState<Tool>('chat');
  const [mobileView, setMobileView] = useState<MobileView>('document'); 
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  // Feature States
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [summary, setSummary] = useState<string>('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizData | undefined>(undefined);

  // Review Mode State
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isReviewFlipped, setIsReviewFlipped] = useState(false);

  // --- PDF RENDERING LOGIC (High DPI) ---

  useEffect(() => {
    if (file) {
      const loadPdf = async () => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument(arrayBuffer);
            const doc = await loadingTask.promise;
            setPdfDocument(doc);
            setNumPages(doc.numPages);
            setPageNumber(1);
        } catch (e) {
            console.error("Erreur chargement PDF:", e);
        }
      };
      loadPdf();
    }
  }, [file]);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current) return;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdfDocument.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      const outputScale = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale });

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      
      canvas.style.maxWidth = Math.floor(viewport.width) + "px";
      canvas.style.width = "100%";
      canvas.style.height = "auto";

      const transform = outputScale !== 1
        ? [outputScale, 0, 0, outputScale, 0, 0]
        : null;

      const renderContext = {
        canvasContext: context,
        transform: transform,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext as any);
      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
      } catch (error: any) {
        if (error.name !== 'RenderingCancelledException') {
          console.error('Render error:', error);
        }
      }
    };

    if (mobileView === 'document' || window.innerWidth >= 768) {
        requestAnimationFrame(() => renderPage());
    }
    
  }, [pdfDocument, pageNumber, scale, mobileView]);


  // --- HANDLERS ---

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsExtracting(true);
    setExtractionWarning(null);
    
    setPdfText('');
    setSummary('');
    setFlashcards([]);
    setGeneratedQuiz(undefined);
    setChatMessages([]);

    try {
      const text = await extractTextFromPdf(selectedFile);
      
      if (!text || text.trim().length < 50) {
          setExtractionWarning("Attention : Ce PDF semble être une image ou un scan. L'IA ne pourra pas lire le contenu.");
          setPdfText('');
      } else {
          setPdfText(text);
          setChatMessages([{ role: 'model', text: `J'ai analysé **${selectedFile.name}**. Je suis prêt à t'aider ! Tu peux me demander un résumé, générer des fiches ou poser des questions.` }]);
      }

    } catch (err) {
      console.error("Erreur extraction PDF", err);
      alert("Impossible de lire le texte du PDF. Vérifiez qu'il n'est pas protégé.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        processFile(droppedFile);
      } else {
        alert("Veuillez déposer un fichier PDF.");
      }
    }
  };

  const startReview = () => {
    setCurrentCardIndex(0);
    setIsReviewFlipped(false);
    setIsReviewMode(true);
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setIsReviewFlipped(false); 
      setTimeout(() => setCurrentCardIndex(prev => prev + 1), 150);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setIsReviewFlipped(false);
      setTimeout(() => setCurrentCardIndex(prev => prev - 1), 150);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isReviewMode) return;
    if (e.key === 'ArrowRight') nextCard();
    if (e.key === 'ArrowLeft') prevCard();
    if (e.key === ' ' || e.key === 'Enter') setIsReviewFlipped(!isReviewFlipped);
    if (e.key === 'Escape') setIsReviewMode(false);
  };

  // --- AI LOGIC ---

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
    if (!pdfText) {
        throw new Error("Aucun texte extrait du PDF.");
    }
    
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === "undefined") {
        throw new Error("Clé API Gemini absente.");
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const contextText = pdfText.length > 50000 ? pdfText.substring(0, 50000) + "...(tronqué)" : pdfText;
      const fullPrompt = `CONTEXTE (Cours PDF) :\n${contextText}\n\nTACHE :\n${prompt}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: fullPrompt,
        config: jsonMode ? { 
          responseMimeType: "application/json",
          temperature: 0.1 
        } : { temperature: 0.7 }
      });

      const text = response.text;
      if (!text) throw new Error("Réponse IA vide.");
      return text;
    } catch (error: any) {
      const isQuota = error.message?.includes('429') || error.status === 429;
      if (isQuota && retries > 0) {
        await sleep(delay);
        return callGemini(prompt, jsonMode, retries - 1, delay * 2);
      }
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const msg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsLoadingAI(true);
    try {
      const response = await callGemini(`
        Agis comme un tuteur pédagogique bienveillant.
        Réponds à la question en te basant sur le PDF.
        Explique les concepts simplement, fais des phrases courtes et aère ton texte.
        Utilise du gras pour les mots importants.
        Question: ${msg}
      `);
      setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'model', text: `Erreur IA : ${e.message?.includes('429') ? "Quota saturé, réessayez dans 1 min." : "Échec de connexion"}` }]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const generateSummary = async () => {
    if (summary) return;
    setIsLoadingAI(true);
    try {
      const res = await callGemini(`
        Agis comme un excellent professeur de médecine.
        Ton but est d'EXPLIQUER ce cours de manière pédagogique, claire et engageante.
        Structure ta réponse avec des titres H1 et H2, des listes à puces et du gras.
      `);
      setSummary(res);
    } catch (e: any) {
      setSummary(`Erreur : ${e.message?.includes('429') ? "Quota dépassé." : e.message}`);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const generateFlashcards = async () => {
    setIsLoadingAI(true);
    try {
      const res = await callGemini(`
        Génère 8 à 10 flashcards pertinentes pour réviser ce cours.
        Retourne UNIQUEMENT un tableau JSON brut avec ce format : [{"front": "Question", "back": "Réponse"}].
      `, true);
      const jsonStr = extractJson(res);
      setFlashcards(JSON.parse(jsonStr));
    } catch (e: any) { 
        console.error(e); 
        alert(e.message?.includes('429') ? "Le quota d'analyse est atteint. Patientez 1 min." : `Erreur: ${e.message}`);
    } finally { setIsLoadingAI(false); }
  };

  const generateQuiz = async () => {
    setIsLoadingAI(true);
    try {
      const res = await callGemini(`Génère un QCM de 5 questions difficiles basées sur le cours. Retourne UNIQUEMENT un JSON brut avec ce format exact : {"capsuleId": 999, "questions": [{"id": 1, "question": "...", "options": [{"id": 1, "text": "...", "isCorrect": boolean}], "explanation": "..."}]}`, true);
      const jsonStr = extractJson(res);
      setGeneratedQuiz(JSON.parse(jsonStr));
    } catch (e: any) { 
        console.error(e); 
        alert(e.message?.includes('429') ? "Quota saturé." : `Erreur: ${e.message}`);
    } finally { setIsLoadingAI(false); }
  };

  const renderFlashcards = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800">Cartes Mémoire ({flashcards.length})</h3>
        <div className="flex gap-2">
            {flashcards.length > 0 && (
                <button 
                    onClick={startReview}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                >
                    <Play size={14} fill="currentColor"/> Lancer le mode révision
                </button>
            )}
            <button onClick={generateFlashcards} className="text-xs text-indigo-600 hover:underline flex items-center gap-1 px-2">
                <RotateCcw size={12}/> Régénérer
            </button>
        </div>
      </div>
      {flashcards.length === 0 && !isLoadingAI && (
        <div className="text-center py-10">
          <button onClick={generateFlashcards} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Générer les fiches IA
          </button>
        </div>
      )}
      <div className="grid gap-4">
        {flashcards.map((card, idx) => (
          <FlashcardItem key={idx} card={card} />
        ))}
      </div>
    </div>
  );

  if (showBeta) {
      return <GuidedLearningBeta initialFile={file} initialText={pdfText} onBack={() => setShowBeta(false)} />;
  }

  return (
    <div 
      className="flex flex-col md:flex-row h-full bg-white relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      tabIndex={0} 
    >
      {isReviewMode && flashcards.length > 0 && (
          <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
              <div className="w-full max-w-3xl flex justify-between items-center mb-8 text-white/80">
                  <span className="font-mono font-medium bg-white/10 px-3 py-1 rounded-full">
                      Carte {currentCardIndex + 1} / {flashcards.length}
                  </span>
                  <button 
                    onClick={() => setIsReviewMode(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                  >
                      <X size={32} />
                  </button>
              </div>

              <div 
                className="w-full max-w-2xl aspect-[4/3] md:aspect-[3/2] perspective cursor-pointer group"
                onClick={() => setIsReviewFlipped(!isReviewFlipped)}
              >
                  <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isReviewFlipped ? 'rotate-y-180' : ''}`}>
                      <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 md:p-12 text-center border border-white/10">
                          <span className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-6">Question</span>
                          <div className="prose prose-lg md:prose-xl max-w-none text-slate-800 font-medium leading-relaxed overflow-y-auto max-h-full">
                              <ReactMarkdown>{flashcards[currentCardIndex].front}</ReactMarkdown>
                          </div>
                          <span className="absolute bottom-6 text-xs font-semibold text-slate-300 uppercase tracking-wide group-hover:text-indigo-400 transition-colors">
                              Cliquer pour retourner
                          </span>
                      </div>

                      <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-600 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 md:p-12 text-center text-white border border-white/10">
                          <span className="text-sm font-bold text-indigo-200 uppercase tracking-widest mb-6">Réponse</span>
                          <div className="prose prose-lg md:prose-xl max-w-none text-white/90 leading-relaxed overflow-y-auto max-h-full prose-strong:text-white prose-strong:font-bold">
                              <ReactMarkdown>{flashcards[currentCardIndex].back}</ReactMarkdown>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="flex items-center gap-8 mt-10">
                  <button 
                    onClick={(e) => { e.stopPropagation(); prevCard(); }}
                    disabled={currentCardIndex === 0}
                    className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
                  >
                      <ArrowLeft size={32} />
                  </button>
                  
                  <div className="text-white/40 text-sm font-medium hidden md:block">
                      Espace pour retourner • Flèches pour naviguer
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); nextCard(); }}
                    disabled={currentCardIndex === flashcards.length - 1}
                    className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
                  >
                      <ArrowRight size={32} />
                  </button>
              </div>
          </div>
      )}

      {isDragging && (
        <div className="absolute inset-0 z-50 bg-indigo-600/10 backdrop-blur-sm border-4 border-indigo-600 border-dashed m-4 rounded-3xl flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-slow">
                <Upload size={48} className="text-indigo-600 mb-4"/>
                <h3 className="text-2xl font-bold text-indigo-900">Relâchez pour analyser</h3>
            </div>
        </div>
      )}

      <div className={`flex-1 bg-slate-200/50 h-full border-r border-slate-200 relative flex flex-col overflow-hidden ${mobileView === 'ai' ? 'hidden md:flex' : 'flex'}`}>
        {!file ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 m-4 md:m-8 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors">
             <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                <Upload size={32} className="text-indigo-500"/>
             </div>
             <h3 className="text-xl font-bold text-slate-700 mb-2 text-center">Importez votre cours PDF</h3>
             <p className="text-sm mb-6 max-w-xs text-center text-slate-500">L'IA va analyser votre document pour générer des fiches, des quiz et répondre à vos questions.</p>
             <label className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                Choisir un fichier
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
             </label>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-2 md:px-4 shrink-0 shadow-sm z-10 overflow-x-auto">
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-slate-700 truncate max-w-[100px] md:max-w-[200px]" title={file.name}>{file.name}</span>
                    <button onClick={() => {setFile(null); setPdfDocument(null);}} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded">Fermer</button>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg shrink-0">
                    <button onClick={() => setPageNumber(prev => Math.max(1, prev - 1))} disabled={pageNumber <= 1} className="p-1 hover:bg-white rounded disabled:opacity-30"><ChevronLeft size={16}/></button>
                    <span className="text-xs font-mono font-medium min-w-[40px] md:min-w-[60px] text-center">{pageNumber} / {numPages}</span>
                    <button onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))} disabled={pageNumber >= numPages} className="p-1 hover:bg-white rounded disabled:opacity-30"><ChevronRight size={16}/></button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hidden md:block"><ZoomOut size={16}/></button>
                    <span className="text-xs font-medium w-10 text-center hidden md:block">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hidden md:block"><ZoomIn size={16}/></button>
                </div>
            </div>

            <div className="flex-1 overflow-auto flex justify-center p-4 md:p-8 relative bg-slate-100 pb-24 md:pb-8">
               <canvas ref={canvasRef} className="shadow-xl rounded-sm bg-white max-w-full" />
               
               {isExtracting && (
                 <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <Loader2 className="animate-spin text-indigo-600 mb-2" size={32}/>
                    <p className="font-medium text-indigo-900">Analyse du document...</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>

      <div className={`w-full md:w-96 lg:w-[450px] bg-white flex flex-col shrink-0 z-10 shadow-xl md:border-l md:border-slate-200 h-full ${mobileView === 'document' ? 'hidden md:flex' : 'flex'}`}>
        
        <div className="bg-indigo-600 p-4 text-white">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Beta</span>
                <Sparkles size={16} className="text-amber-300"/>
            </div>
            <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                <BrainCircuit size={16}/> Apprentissage Guidé
            </h4>
            <p className="text-xs text-indigo-100 mb-3 leading-relaxed">Générez une Mind Map interactive de votre cours pour une révision visuelle.</p>
            <button 
                onClick={() => setShowBeta(true)}
                className="w-full py-2 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-all shadow-md flex items-center justify-center gap-2"
            >
                Essayer la version Beta <ArrowRight size={14}/>
            </button>
        </div>

        <div className="flex border-b border-slate-100">
            <ToolTab active={activeTool === 'chat'} onClick={() => setActiveTool('chat')} icon={<MessageSquare size={18}/>} label="Chat" />
            <ToolTab active={activeTool === 'summary'} onClick={() => {setActiveTool('summary'); if(!summary && pdfText) generateSummary();}} icon={<FileText size={18}/>} label="Résumé" />
            <ToolTab active={activeTool === 'flashcards'} onClick={() => {setActiveTool('flashcards'); if(flashcards.length === 0 && pdfText) generateFlashcards();}} icon={<List size={18}/>} label="Fiches" />
            <ToolTab active={activeTool === 'quiz'} onClick={() => {setActiveTool('quiz'); if(!generatedQuiz && pdfText) generateQuiz();}} icon={<HelpCircle size={18}/>} label="Quiz" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 relative pb-24 md:pb-4">
            
            {!pdfText && !isExtracting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/50 backdrop-blur-sm z-20 pointer-events-none">
                    <FileInput size={48} className="mb-4 opacity-50"/>
                    <p>Veuillez d'abord importer un PDF pour utiliser l'Atelier IA.</p>
                </div>
            )}
            
            {extractionWarning && (
                <div className="mx-4 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-800 text-sm mb-4">
                    <AlertTriangle size={20} className="shrink-0 text-amber-600" />
                    <p>{extractionWarning}</p>
                </div>
            )}

            {isLoadingAI && (
                 <div className="absolute top-0 left-0 w-full h-1 bg-indigo-100 overflow-hidden z-30">
                     <div className="h-full bg-indigo-600 animate-progress"></div>
                 </div>
            )}

            {activeTool === 'chat' && (
                <div className="flex flex-col h-full">
                     <div className="flex-1 space-y-6 mb-4">
                        {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] p-4 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                                    <ReactMarkdown 
                                        components={{
                                            p: ({node, ...props}) => <p className="mb-3 leading-relaxed last:mb-0" {...props} />,
                                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-3 space-y-2" {...props} />,
                                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-3 space-y-2" {...props} />,
                                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                            strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                     </div>
                     <div className="relative mt-auto">
                        <input 
                            type="text" 
                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm shadow-sm"
                            placeholder="Posez une question..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isLoadingAI}
                        />
                        <button onClick={handleSendMessage} className="absolute right-2 top-2 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Send size={18} />
                        </button>
                     </div>
                </div>
            )}

            {activeTool === 'summary' && (
                <div className="prose prose-sm prose-indigo max-w-none bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                    {summary ? (
                        <ReactMarkdown
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-indigo-800 mb-6 mt-2 pb-2 border-b border-indigo-100" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2" {...props} />,
                                p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-slate-600 text-justify" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-700" {...props} />,
                                li: ({node, ...props}) => <li className="pl-1 marker:text-indigo-400" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                            }}
                        >
                            {summary}
                        </ReactMarkdown>
                    ) : (
                        <div className="text-center py-10 text-slate-400">
                            <FileText size={48} className="mx-auto mb-4 opacity-20"/>
                            <p>Génération du résumé pédagogique en cours...</p>
                        </div>
                    )}
                </div>
            )}

            {activeTool === 'flashcards' && renderFlashcards()}

            {activeTool === 'quiz' && (
                <div>
                    {!generatedQuiz ? (
                        <div className="text-center py-10 text-slate-400">
                            <HelpCircle size={48} className="mx-auto mb-4 opacity-20"/>
                            <p>Génération du quiz en cours...</p>
                        </div>
                    ) : (
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                             <Quiz quizData={generatedQuiz} />
                             <button onClick={generateQuiz} className="w-full mt-4 py-3 text-xs text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium">Générer un autre Quiz</button>
                        </div>
                    )}
                </div>
            )}

        </div>
      </div>

      {file && (
          <div className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 shadow-xl rounded-full p-1.5 flex gap-1">
              <button 
                onClick={() => setMobileView('document')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${mobileView === 'document' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Eye size={18}/> Document
              </button>
              <button 
                onClick={() => setMobileView('ai')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${mobileView === 'ai' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Bot size={18}/> Assistant IA
              </button>
          </div>
      )}
      
      <style>{`
        @keyframes progress {
            0% { width: 0%; margin-left: 0; }
            50% { width: 50%; margin-left: 25%; }
            100% { width: 100%; margin-left: 100%; }
        }
        .animate-progress {
            animation: progress 1.5s infinite linear;
        }
        .perspective { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const ToolTab = ({active, onClick, icon, label}: any) => (
    <button 
        onClick={onClick}
        className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors border-b-2 ${active ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'}`}
    >
        {icon}
        {label}
    </button>
);

const FlashcardItem: React.FC<{card: Flashcard}> = ({card}) => {
    const [flipped, setFlipped] = useState(false);
    return (
        <div 
            onClick={() => setFlipped(!flipped)}
            className="group perspective h-40 cursor-pointer"
        >
            <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
                <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center hover:border-indigo-300 transition-colors">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Question</span>
                    <div className="font-medium text-slate-800 text-sm line-clamp-3">
                        <ReactMarkdown components={{ p: ({node, ...props}) => <span {...props} /> }}>{card.front}</ReactMarkdown>
                    </div>
                    <span className="absolute bottom-2 right-2 text-xs text-slate-400">Cliquer pour retourner</span>
                </div>
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-600 p-4 rounded-xl shadow-md flex flex-col items-center justify-center text-center text-white">
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-2">Réponse</span>
                    <div className="font-medium text-sm line-clamp-3">
                        <ReactMarkdown components={{ p: ({node, ...props}) => <span {...props} /> }}>{card.back}</ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentLearning;