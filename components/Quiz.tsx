import React, { useState, useEffect } from 'react';
import { QuizData, QuizOption } from '../types';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, HelpCircle, Trophy } from 'lucide-react';

interface QuizProps {
  quizData: QuizData | undefined;
  onComplete?: () => void;
}

const Quiz: React.FC<QuizProps> = ({ quizData, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Reset state when quizData changes (new video selected)
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setSelectedOptions([]);
    setIsSubmitted(false);
    setScore(0);
    setShowResult(false);
  }, [quizData]);

  if (!quizData || quizData.questions.length === 0) {
    return null; 
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const totalQuestions = quizData.questions.length;

  const handleOptionClick = (optionId: number) => {
    if (isSubmitted) return;
    // Pour un QCM à choix unique (radio behavior), on remplace la sélection
    // Si vous voulez du choix multiple, changez la logique ici.
    setSelectedOptions([optionId]); 
  };

  const handleValidate = () => {
    if (selectedOptions.length === 0) return;
    
    setIsSubmitted(true);
    
    // Check if correct (assuming single choice for simplified logic, adaptable for multi)
    const selectedOptionId = selectedOptions[0];
    const correctOption = currentQuestion.options.find(o => o.isCorrect);
    
    if (correctOption && correctOption.id === selectedOptionId) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOptions([]);
      setIsSubmitted(false);
    } else {
      setShowResult(true);
      if (onComplete) onComplete();
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedOptions([]);
    setIsSubmitted(false);
    setScore(0);
    setShowResult(false);
  };

  if (showResult) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm mt-6">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600">
          <Trophy size={32} />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Quiz Terminé !</h3>
        <p className="text-slate-600 mb-6">
            Votre score : <span className="font-bold text-indigo-600 text-xl">{score} / {totalQuestions}</span>
        </p>
        
        <div className="flex justify-center gap-4">
             <button 
                onClick={handleRetry}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
             >
                <RotateCcw size={18} /> Recommencer
             </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      {/* Header */}
      <div className="bg-indigo-50/50 border-b border-indigo-100 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-indigo-800 font-semibold">
          <HelpCircle size={20} />
          <span>Quiz de validation</span>
        </div>
        <div className="text-xs font-medium text-indigo-400 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
          Question {currentQuestionIndex + 1} / {totalQuestions}
        </div>
      </div>

      {/* Question Body */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6 leading-relaxed">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOptions.includes(option.id);
            let itemClass = "w-full text-left p-4 rounded-xl border-2 transition-all relative ";
            
            if (isSubmitted) {
              if (option.isCorrect) {
                itemClass += "border-emerald-500 bg-emerald-50 text-emerald-800"; // Correct answer styling
              } else if (isSelected && !option.isCorrect) {
                itemClass += "border-red-500 bg-red-50 text-red-800"; // Wrong selection styling
              } else {
                itemClass += "border-slate-100 text-slate-400 opacity-60"; // Other non-selected options
              }
            } else {
              if (isSelected) {
                itemClass += "border-indigo-600 bg-indigo-50 text-indigo-800 shadow-sm";
              } else {
                itemClass += "border-slate-100 hover:border-indigo-200 hover:bg-slate-50 text-slate-700";
              }
            }

            return (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                disabled={isSubmitted}
                className={itemClass}
              >
                <div className="flex items-start justify-between">
                    <span>{option.text}</span>
                    {isSubmitted && option.isCorrect && <CheckCircle2 className="text-emerald-500 shrink-0 ml-2" size={20}/>}
                    {isSubmitted && isSelected && !option.isCorrect && <XCircle className="text-red-500 shrink-0 ml-2" size={20}/>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback Section */}
        {isSubmitted && (
            <div className={`mt-6 p-4 rounded-lg border text-sm leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300 ${
                selectedOptions.includes(currentQuestion.options.find(o => o.isCorrect)?.id || -1)
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-indigo-50 border-indigo-100 text-indigo-800'
            }`}>
                <span className="font-bold block mb-1">Correction :</span>
                {currentQuestion.explanation}
            </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
        {!isSubmitted ? (
          <button
            onClick={handleValidate}
            disabled={selectedOptions.length === 0}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            Valider
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm active:scale-95"
          >
            {currentQuestionIndex < totalQuestions - 1 ? 'Question Suivante' : 'Voir les résultats'} <ArrowRight size={16}/>
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;