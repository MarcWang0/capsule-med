import React, { useState, useRef, useEffect } from 'react';
import { Capsule } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, Loader2, AlertCircle } from 'lucide-react';

interface ChatAssistantProps {
  currentCapsule: Capsule | null;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ currentCapsule }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Bonjour ! Je suis Dr. Gemini. Posez-moi une question sur le cours en cours.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset chat when video changes
  useEffect(() => {
    if (currentCapsule) {
        setMessages([{ role: 'model', text: `Nous regardons "${currentCapsule.title}". Une question sur ce sujet ?` }]);
    }
  }, [currentCapsule]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check for API Key validity gracefully
    if (!process.env.API_KEY) {
         setMessages(prev => [...prev, { role: 'user', text: input }]);
         setMessages(prev => [...prev, { role: 'model', text: "Erreur: Clé API manquante. Veuillez configurer process.env.API_KEY." }]);
         setInput('');
        return;
    }

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = `
        Tu es un tuteur médical expert pour l'application "Capsule Med".
        L'étudiant regarde actuellement la capsule vidéo : "${currentCapsule?.title || 'Aucune vidéo sélectionnée'}".
        Sujet : ${currentCapsule?.subject || 'Général'}.
        Thème : ${currentCapsule?.theme || 'Général'}.
        
        Réponds aux questions de l'étudiant de manière concise, pédagogique et encourageante.
        Si la question n'a rien à voir avec la médecine ou le cours, ramène gentiment le sujet au cours.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts: [{ text: context + "\n\nQuestion étudiante: " + userMessage }] }
        ],
      });

      const responseText = response.text || "Désolé, je n'ai pas pu générer de réponse.";
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Une erreur est survenue lors de la communication avec l'IA." }]);
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
      <div className="bg-indigo-600 p-4 flex items-center gap-2 text-white shrink-0">
        <Bot size={24} />
        <div>
            <h3 className="font-semibold text-base leading-none">Dr. Gemini</h3>
            <span className="text-xs text-indigo-200">Assistant Médical IA</span>
        </div>
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
              {msg.text}
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
        {!process.env.API_KEY && (
             <div className="mt-2 text-[10px] text-red-500 flex items-center justify-center gap-1">
                 <AlertCircle size={10} /> Mode démo sans clé API
             </div>
        )}
      </div>
    </div>
  );
};

export default ChatAssistant;