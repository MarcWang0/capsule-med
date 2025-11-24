import React, { useState } from 'react';
import { Capsule, SubjectGroup } from '../types';
import { ChevronDown, ChevronRight, Play, BookOpen } from 'lucide-react';

interface SidebarProps {
  courseData: SubjectGroup[];
  currentCapsule: Capsule | null;
  onSelectCapsule: (capsule: Capsule) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ courseData, currentCapsule, onSelectCapsule }) => {
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>(courseData.map(s => s.name)); // All open by default
  const [expandedThemes, setExpandedThemes] = useState<string[]>([]);

  const toggleSubject = (name: string) => {
    setExpandedSubjects(prev => 
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const toggleTheme = (name: string) => {
    setExpandedThemes(prev => 
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header hidden on mobile if parent handles it, but kept for desktop consistency */}
      <div className="hidden md:block p-4 border-b border-slate-100 bg-slate-50 shrink-0">
        <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={20}/>
            Programme
        </h2>
        <p className="text-xs text-slate-500 mt-1">{courseData.reduce((acc, sub) => acc + sub.themes.reduce((tAcc, t) => tAcc + t.capsules.length, 0), 0)} Capsules disponibles</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 pb-20 md:pb-2">
        {courseData.map((subject) => (
          <div key={subject.name} className="mb-2">
            <button
              onClick={() => toggleSubject(subject.name)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left transition-colors group"
            >
              <span className="font-semibold text-slate-800 text-sm">{subject.name}</span>
              {expandedSubjects.includes(subject.name) ? (
                <ChevronDown size={16} className="text-slate-400 group-hover:text-indigo-500" />
              ) : (
                <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-500" />
              )}
            </button>

            {expandedSubjects.includes(subject.name) && (
              <div className="pl-2 mt-1 space-y-1">
                {subject.themes.map((theme) => (
                  <div key={theme.name}>
                    <button
                      onClick={() => toggleTheme(theme.name)}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 text-left text-xs font-medium text-slate-600 transition-colors"
                    >
                      {expandedThemes.includes(theme.name) ? (
                        <ChevronDown size={14} className="text-slate-400" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-400" />
                      )}
                      <span className="truncate">{theme.name}</span>
                    </button>

                    {expandedThemes.includes(theme.name) && (
                      <div className="pl-6 space-y-0.5 mt-1 border-l border-slate-200 ml-2">
                        {theme.capsules.map((capsule) => (
                          <button
                            key={capsule.id}
                            onClick={() => onSelectCapsule(capsule)}
                            className={`w-full text-left p-3 md:p-2 rounded text-xs flex items-start gap-2 transition-all ${
                              currentCapsule?.id === capsule.id
                                ? 'bg-indigo-50 text-indigo-700 font-semibold border-r-2 border-indigo-600'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            <Play size={12} className={`mt-0.5 shrink-0 ${currentCapsule?.id === capsule.id ? 'fill-indigo-700' : ''}`} />
                            <span className="line-clamp-2">{capsule.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;