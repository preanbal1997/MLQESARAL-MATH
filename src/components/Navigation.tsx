import React from 'react';
import { Home, GraduationCap, Users } from 'lucide-react';
import type { GradeLevel, SchoolData } from '../types';

interface NavigationProps {
  currentTab: 'overview' | GradeLevel;
  onSelectTab: (tab: 'overview' | GradeLevel) => void;
  schoolData: SchoolData;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  schoolData
}) => {
  const grades: { level: GradeLevel; color: string; activeColor: string }[] = [
    { level: '1', color: 'border-red-400 text-red-700', activeColor: 'bg-red-600 text-white shadow-md' },
    { level: '2', color: 'border-blue-400 text-blue-700', activeColor: 'bg-blue-600 text-white shadow-md' },
    { level: '3', color: 'border-amber-400 text-amber-800', activeColor: 'bg-amber-500 text-slate-950 shadow-md' },
    { level: '4', color: 'border-emerald-400 text-emerald-800', activeColor: 'bg-emerald-600 text-white shadow-md' },
    { level: '5', color: 'border-purple-400 text-purple-800', activeColor: 'bg-purple-600 text-white shadow-md' },
    { level: '6', color: 'border-teal-400 text-teal-800', activeColor: 'bg-teal-600 text-white shadow-md' }
  ];

  return (
    <nav className="no-print w-full bg-white border-b border-slate-200 px-4 sm:px-6 shadow-xs sticky top-0 z-40">
      <div className="w-full flex items-center justify-between overflow-x-auto py-2 gap-2 scrollbar-thin">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* School Overview Tab */}
          <button
            onClick={() => onSelectTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all ${
              currentTab === 'overview'
                ? 'bg-sky-700 text-white shadow-md ring-2 ring-sky-400/40'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>School Overview</span>
          </button>

          <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block" />

          {/* Grade 1 - 6 Tabs */}
          {grades.map(({ level, activeColor }) => {
            const gData = schoolData[level];
            const isActive = currentTab === level;
            const learnerCount = gData.learners.length;
            const wsCount = gData.totalWorksheets;

            return (
              <button
                key={level}
                onClick={() => onSelectTab(level)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all border ${
                  isActive
                    ? `${activeColor} ring-2 ring-sky-300/60`
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>Grade {level}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isActive ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {wsCount} WS
                </span>
                <span
                  className={`hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {learnerCount} learners
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
