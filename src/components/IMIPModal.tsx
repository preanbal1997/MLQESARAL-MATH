import React from 'react';
import { Printer, X, Award, CheckCircle2, AlertTriangle, BookOpen, User, Calendar } from 'lucide-react';
import type { Learner, GradeData } from '../types';
import { computeLearnerStats } from '../services/googleSheets';

interface IMIPModalProps {
  learner: Learner;
  gradeData: GradeData;
  onClose: () => void;
}

export const IMIPModal: React.FC<IMIPModalProps> = ({ learner, gradeData, onClose }) => {
  const stats = computeLearnerStats(learner, gradeData);

  const handlePrint = () => {
    window.print();
  };

  // Determine customized recommendations based on performance percentage
  const getCustomizedRecommendations = () => {
    if (stats.percentage >= 85) {
      return [
        {
          area: 'Enrichment & Critical Thinking',
          action: 'Provide multi-step non-routine word problems and math olympiad puzzles to enhance logical reasoning.',
          timeline: '2x weekly during independent learning period'
        },
        {
          area: 'Peer Mentoring',
          action: 'Engage learner as an ARAL Math Peer Buddy to reinforce mastery by explaining math concepts to struggling classmates.',
          timeline: 'Weekly ARAL collaborative sessions'
        },
        {
          area: 'Higher-Order Application',
          action: 'Introduce real-life budgeting, estimation, and geometric construction projects.',
          timeline: 'Quarterly math performance tasks'
        }
      ];
    } else if (stats.percentage >= 75) {
      return [
        {
          area: 'Targeted Practice & Reinforcement',
          action: 'Focus on multi-digit computation and speed drills using flashcards and interactive numeracy games.',
          timeline: '3x weekly (20-minute sessions)'
        },
        {
          area: 'Conceptual Understanding (CPA Approach)',
          action: 'Utilize Concrete-Pictorial-Abstract transitions for topics where student scored below 75% on worksheets.',
          timeline: 'During regular ARAL Math intervention hours'
        },
        {
          area: 'Error Analysis & Feedback',
          action: 'Review returned worksheets together to address recurring misconception patterns in problem solving.',
          timeline: 'Bi-weekly individual feedback sessions'
        }
      ];
    } else {
      return [
        {
          area: 'Foundational Numeracy & Basic Operations',
          action: 'Intensive one-on-one remediation on basic addition/subtraction/multiplication facts, place value identification, and regrouping.',
          timeline: 'Daily 30-minute ARAL pull-out session'
        },
        {
          area: 'Manipulatives & Visual Aids',
          action: 'Provide counters, number lines, base-10 blocks, and visual step-by-step cue cards for independent task execution.',
          timeline: 'All intervention activities'
        },
        {
          area: 'Home-School Partnership',
          action: 'Coordinate with parents/guardians to provide daily 15-minute home numeracy reinforcement practice using ARAL activity sheets.',
          timeline: 'Weekly parent communication log'
        }
      ];
    }
  };

  const recommendations = getCustomizedRecommendations();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print-container">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="no-print bg-gradient-to-r from-sky-600 via-sky-700 to-emerald-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            <span className="font-bold text-lg">Individual Mathematics Intervention Plan (IMIP)</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
              Grade {gradeData.grade} - S.Y. 2026-2027
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-lg shadow-md transition-all cursor-pointer text-sm"
            >
              <Printer className="w-4 h-4" />
              Print IMIP (A4)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area - A4 Formatted */}
        <div className="p-6 sm:p-10 bg-white text-slate-800 print:p-0">
          {/* STRICT PRINT HEADER REQUIREMENT */}
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <div className="text-xs uppercase tracking-wider text-slate-600 font-medium">Republic of the Philippines</div>
            <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase">Department of Education</h2>
            <h3 className="text-sm font-semibold text-slate-800">National Capital Region</h3>
            <h4 className="text-sm font-semibold text-slate-800">Division Office of Caloocan City</h4>
            <h1 className="text-lg font-black text-slate-900 mt-1 uppercase tracking-tight">
              MANUEL L. QUEZON ELEMENTARY SCHOOL
            </h1>
            <div className="text-xs font-bold text-sky-800 mt-0.5 uppercase tracking-wider">
              ARAL Math Monitoring S.Y. 2026-2027
            </div>
            <div className="inline-block mt-3 px-4 py-1 bg-sky-100 text-sky-900 border border-sky-300 rounded font-bold text-xs uppercase tracking-wider print:border-slate-400">
              INDIVIDUAL MATHEMATICS INTERVENTION PLAN (IMIP)
            </div>
          </div>

          {/* Learner Information Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-300 p-3 rounded-lg text-xs mb-5 print:bg-transparent">
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Learner Name:</span>
              <span className="font-extrabold text-sm text-slate-900">{learner.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">LRN:</span>
              <span className="font-mono font-bold text-slate-800">{learner.lrn || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Grade & Section:</span>
              <span className="font-bold text-slate-800">Grade {gradeData.grade} - {learner.section || gradeData.sectionDefault}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Gender / Date:</span>
              <span className="font-bold text-slate-800">{learner.gender} | {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Performance Summary Banner */}
          <div className="grid grid-cols-4 gap-2 mb-5 text-center text-xs">
            <div className="border border-slate-300 p-2.5 rounded-lg bg-sky-50 print:bg-transparent">
              <div className="text-[10px] uppercase font-bold text-slate-600">Total Worksheets</div>
              <div className="text-lg font-black text-sky-700">
                {stats.completedCount} / {gradeData.totalWorksheets}
              </div>
              <div className="text-[10px] text-slate-500">Administered</div>
            </div>
            <div className="border border-slate-300 p-2.5 rounded-lg bg-emerald-50 print:bg-transparent">
              <div className="text-[10px] uppercase font-bold text-slate-600">Total Score</div>
              <div className="text-lg font-black text-emerald-700">
                {stats.totalScore} / {stats.totalItems}
              </div>
              <div className="text-[10px] text-slate-500">Points Earned</div>
            </div>
            <div className="border border-slate-300 p-2.5 rounded-lg bg-amber-50 print:bg-transparent">
              <div className="text-[10px] uppercase font-bold text-slate-600">Overall Rating</div>
              <div className="text-lg font-black text-amber-700">
                {stats.percentage.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500">Weighted Average</div>
            </div>
            <div className={`border p-2.5 rounded-lg ${
              stats.status === 'Mastery' ? 'bg-emerald-100 border-emerald-400 text-emerald-900' :
              stats.status === 'Progressing' ? 'bg-sky-100 border-sky-400 text-sky-900' :
              'bg-rose-100 border-rose-400 text-rose-900'
            } print:bg-transparent`}>
              <div className="text-[10px] uppercase font-bold">Intervention Tier</div>
              <div className="text-sm font-black mt-1 uppercase">
                {stats.status}
              </div>
              <div className="text-[10px]">DepEd ARAL Math</div>
            </div>
          </div>

          {/* Summary Table of Scores */}
          <div className="mb-5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-sky-600" />
              I. Summary Table of ARAL Math Worksheet Scores
            </h5>
            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[11px]">
                    <th className="p-2 border-r border-slate-300 text-center w-14">WS #</th>
                    <th className="p-2 border-r border-slate-300">Competency / Title</th>
                    <th className="p-2 border-r border-slate-300 text-center w-28">Score / Total</th>
                    <th className="p-2 border-r border-slate-300 text-center w-24">Rating (%)</th>
                    <th className="p-2 text-center w-36">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Array.from({ length: Math.min(gradeData.totalWorksheets, 12) }).map((_, i) => {
                    const wsNum = i + 1;
                    const config = gradeData.worksheetConfigs.find(c => c.number === wsNum);
                    const scoreEntry = learner.scores[wsNum];
                    const hasScore = scoreEntry && typeof scoreEntry.score === 'number';
                    const score = hasScore ? scoreEntry.score : null;
                    const totalItems = scoreEntry?.totalItems || config?.defaultTotalItems || 30;
                    const pct = score !== null ? (score / totalItems) * 100 : null;

                    return (
                      <tr key={wsNum} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="p-1.5 border-r border-slate-200 text-center font-bold font-mono">
                          {wsNum}
                        </td>
                        <td className="p-1.5 border-r border-slate-200 text-slate-700">
                          {config?.title || `Worksheet ${wsNum}`} (Numeracy Skill {wsNum})
                        </td>
                        <td className="p-1.5 border-r border-slate-200 text-center font-mono font-bold">
                          {score !== null ? `${score} / ${totalItems}` : '-'}
                        </td>
                        <td className="p-1.5 border-r border-slate-200 text-center font-mono">
                          {pct !== null ? `${pct.toFixed(0)}%` : '-'}
                        </td>
                        <td className="p-1.5 text-center text-[10px]">
                          {pct === null ? (
                            <span className="text-slate-400">Pending</span>
                          ) : pct >= 85 ? (
                            <span className="text-emerald-700 font-bold">Mastered</span>
                          ) : pct >= 75 ? (
                            <span className="text-sky-700 font-bold">Satisfactory</span>
                          ) : (
                            <span className="text-rose-600 font-bold">For Intervention</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {gradeData.totalWorksheets > 12 && (
                    <tr className="bg-slate-50 text-[10px] text-slate-500 italic">
                      <td colSpan={5} className="p-2 text-center">
                        ... Worksheets 13 to {gradeData.totalWorksheets} recorded in master database (Summary reflected in Overall Rating above).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customized Recommendations */}
          <div className="mb-6">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              II. Customized Numeracy Intervention Strategies & Recommendations
            </h5>
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 text-xs space-y-2.5 print:bg-transparent">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-sky-200 text-sky-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 mr-1">{rec.area}:</span>
                    <span className="text-slate-700">{rec.action}</span>
                    <span className="text-slate-500 block text-[10px] italic mt-0.5">
                      Schedule / Mode: {rec.timeline}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Teacher Remarks */}
          {learner.remarks && (
            <div className="mb-6 text-xs bg-amber-50/60 border border-amber-200 p-2.5 rounded-lg print:border-slate-300 print:bg-transparent">
              <span className="font-bold text-slate-800">Teacher's Observations / Case Notes: </span>
              <span className="text-slate-700">{learner.remarks}</span>
            </div>
          )}

          {/* Signatures Section */}
          <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="flex flex-col items-center">
              <div className="w-56 border-b-2 border-slate-800 pb-1 mb-1">
                <span className="font-bold text-slate-900 uppercase">
                  {gradeData.teacherName || 'ARAL Math Teacher'}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-700">Prepared by:</div>
              <div className="text-[10px] text-slate-500">ARAL Math Teacher / Focal</div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-56 border-b-2 border-slate-800 pb-1 mb-1">
                <span className="font-bold text-slate-900 uppercase">
                  {gradeData.schoolHead || 'Principal IV'}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-700">Approved by:</div>
              <div className="text-[10px] text-slate-500">School Head / Principal</div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center text-[9px] text-slate-400 uppercase tracking-wider print:text-slate-600">
            Manuel L. Quezon Elementary School • DepEd ARAL Program • Official Monitoring Document
          </div>
        </div>
      </div>
    </div>
  );
};
