import React, { useState, useRef, useEffect } from 'react';
import { Capsule } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, Loader2, AlertCircle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatAssistantProps {
  currentCapsule: Capsule | null;
  onClose?: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ currentCapsule, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Bonjour ! Je suis Dr. Gemini. Posez-moi une question sur le cours en cours.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Accès sécurisé à la variable d'environnement VITE_API_KEY
  // On utilise (import.meta as any) pour éviter les erreurs de typage strict
  const env = (import.meta as any).env || {};
  const apiKey = env.VITE_API_KEY;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset chat when video changes
  useEffect(() => {
    if (currentCapsule) {
        setMessages([{ role: 'model', text: `Nous regardons **"${currentCapsule.title}"**. Une question sur ce sujet ?` }]);
    }
  }, [currentCapsule]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check for API Key validity gracefully
    if (!apiKey) {
         setMessages(prev => [...prev, { role: 'user', text: input }]);
         setMessages(prev => [...prev, { role: 'model', text: "Erreur configuration : Clé API manquante. Ajoutez la variable VITE_API_KEY dans Vercel." }]);
         setInput('');
        return;
    }

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Utilisation de la clé récupérée via Vite
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const context = `
        Tu es un tuteur médical expert pour l'application "Capsule Med".
        L'étudiant regarde actuellement la capsule vidéo : "${currentCapsule?.title || 'Aucune vidéo sélectionnée'}".
        Sujet : ${currentCapsule?.subject || 'Général'}.
        Thème : ${currentCapsule?.theme || 'Général'}.
        
        Ta mission :
        1. Répondre aux questions de l'étudiant de manière concise, pédagogique et encourageante.
        2. Si la question porte sur le cours, donne une explication claire adaptée à un étudiant de première année de médecine (PASS/LAS).
        3. Si la question n'a rien à voir avec la médecine ou le cours, ramène gentiment le sujet au cours.
        4. Sois bienveillant et motivant.
        5. Utilise le Markdown pour structurer ta réponse (gras pour les mots clés, listes à puces pour les étapes).
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { 
              role: 'user', 
              parts: [{ text: `${context}\n\nQuestion de l'étudiant: ${userMessage}` }] 
            }
        ],
      });

      const responseText = response.text || "Désolé, je n'ai pas pu générer de réponse précise.";
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);

    } catch (error) {
      console.error("Erreur Gemini:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Une erreur est survenue lors de la communication avec Dr. Gemini." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white md:border-l md:border-slate-200">
      <div className="bg-indigo-600 p-4 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-2">
            <Bot size={24} />
            <div>
                <h3 className="font-semibold text-base leading-none">Dr. Gemini</h3>
                <span className="text-xs text-indigo-200">Assistant Médical IA</span>
            </div>
        </div>
        {onClose && (
            <button 
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                title="Fermer le chat"
            >
                <X size={20} />
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
              }`}
            >
              <ReactMarkdown
                components={{
                  // Personnalisation des éléments Markdown pour s'adapter au style du chat
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="pl-1" {...props} />,
                  strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                  a: ({node, ...props}) => <a className="underline hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props} />
                }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-sm shadow-sm">
              <Loader2 className="animate-spin text-indigo-600" size={16} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-slate-100 shrink-0 mb-safe">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Posez une question sur le cours..."
            disabled={isLoading}
            className="w-full pl-4 pr-12 py-3 text-sm border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 bg-slate-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 top-1.5 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Send size={16} />
          </button>
        </div>
        {!apiKey && (
             <div className="mt-2 text-[10px] text-red-500 flex items-center justify-center gap-1">
                 <AlertCircle size={10} /> Clé API manquante
             </div>
        )}
      </div>
    </div>
  );
};

export default ChatAssistant;