import React, { useRef, useState } from 'react';
import {
  Printer,
  X,
  Award,
  BookOpen,
  Download,
  Loader2,
  CheckCircle2,
  Maximize2,
  Minimize2,
  FileText
} from 'lucide-react';
import type { Learner, GradeData } from '../types';
import { computeLearnerStats } from '../services/googleSheets';
import { exportElementToA4PDF } from '../utils/pdfExport';

interface IMIPModalProps {
  learner: Learner;
  gradeData: GradeData;
  onClose: () => void;
  autoDownload?: boolean;
}

export const IMIPModal: React.FC<IMIPModalProps> = ({
  learner,
  gradeData,
  onClose,
  autoDownload = false
}) => {
  const stats = computeLearnerStats(learner, gradeData);
  const printableRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isFullSize, setIsFullSize] = useState(true);

  const cleanLearnerName = learner.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const pdfFileName = `IMIP_${cleanLearnerName}_Grade_${gradeData.grade}_A4.pdf`;

  // Download PDF file handler
  const handleDownloadPDF = async () => {
    if (!printableRef.current || isGeneratingPDF) return;
    try {
      setIsGeneratingPDF(true);
      await exportElementToA4PDF(printableRef.current, pdfFileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Browser Print handler
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

  // Split all worksheets into two balanced columns to display ALL worksheets on A4
  const totalWS = gradeData.totalWorksheets;
  const midPoint = Math.ceil(totalWS / 2);
  const leftWorksheets = Array.from({ length: midPoint }, (_, i) => i + 1);
  const rightWorksheets = Array.from({ length: totalWS - midPoint }, (_, i) => midPoint + i + 1);

  // Render a worksheet row helper
  const renderWorksheetRow = (wsNum: number) => {
    const config = gradeData.worksheetConfigs.find(c => c.number === wsNum);
    const scoreEntry = learner.scores[wsNum];
    const hasScore = scoreEntry && typeof scoreEntry.score === 'number';
    const score = hasScore ? scoreEntry.score : null;
    const totalItems = scoreEntry?.totalItems || config?.defaultTotalItems || 25;
    const pct = score !== null ? (score / totalItems) * 100 : null;

    return (
      <tr key={wsNum} className="hover:bg-slate-50 text-[10px] border-b border-slate-200">
        <td className="py-1 px-1.5 text-center font-bold font-mono text-slate-800 bg-slate-50/70 border-r border-slate-200 w-12">
          WS {wsNum}
        </td>
        <td className="py-1 px-1.5 border-r border-slate-200 text-slate-700 truncate max-w-[140px]">
          {config?.title || `Worksheet ${wsNum}`}
        </td>
        <td className="py-1 px-1.5 border-r border-slate-200 text-center font-mono font-bold text-slate-900 w-16">
          {score !== null ? `${score} / ${totalItems}` : '-'}
        </td>
        <td className="py-1 px-1.5 border-r border-slate-200 text-center font-mono font-semibold w-12">
          {pct !== null ? `${pct.toFixed(0)}%` : '-'}
        </td>
        <td className="py-1 px-1.5 text-center w-24">
          {pct === null ? (
            <span className="text-slate-400 text-[9px]">Pending</span>
          ) : pct >= 85 ? (
            <span className="text-emerald-700 font-bold text-[9px] bg-emerald-50 px-1 py-0.2 rounded">Mastered</span>
          ) : pct >= 75 ? (
            <span className="text-sky-700 font-bold text-[9px] bg-sky-50 px-1 py-0.2 rounded">Satisfactory</span>
          ) : (
            <span className="text-rose-600 font-bold text-[9px] bg-rose-50 px-1 py-0.2 rounded">Intervention</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    /* Top-aligned container (justify-start) so the top header is ALWAYS in view from pixel 0 without clipping */
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 flex flex-col items-center justify-start p-0 sm:p-4 backdrop-blur-xs">
      <div
        className={`relative w-full bg-slate-100 ${
          isFullSize ? 'max-w-[98vw] min-h-screen' : 'max-w-5xl my-4 rounded-2xl'
        } shadow-2xl border border-slate-300 flex flex-col print-container transition-all`}
      >
        {/* Sticky Modal Top Bar (Always in view while scrolling, hidden in print) */}
        <div className="sticky top-0 z-40 bg-gradient-to-r from-sky-700 via-sky-600 to-emerald-700 px-4 py-3 text-white shadow-md flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm sm:text-base font-display">
                  Individual Mathematics Intervention Plan (IMIP)
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  A4 View
                </span>
              </div>
              <p className="text-xs text-sky-100">
                Learner: <strong className="text-white">{learner.name}</strong> • Grade {gradeData.grade} - {learner.section || 'General'} • Teacher: {learner.aralTeacher || gradeData.teacherName || 'ARAL Math Teacher'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isGeneratingPDF && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-xs font-bold text-amber-200 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating A4 PDF...</span>
              </div>
            )}

            {downloadSuccess && !isGeneratingPDF && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>PDF Downloaded!</span>
              </div>
            )}

            {/* DOWNLOAD PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-md transition-all cursor-pointer text-xs"
              title="Download this IMIP document as an A4 PDF file"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD PDF</span>
            </button>

            {/* PRINT Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-md transition-all cursor-pointer text-xs"
              title="Open browser print dialog"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT</span>
            </button>

            {/* Full Size View Toggle */}
            <button
              onClick={() => setIsFullSize(!isFullSize)}
              className="p-2 bg-white/15 hover:bg-white/25 rounded-xl transition-colors cursor-pointer text-white"
              title={isFullSize ? 'Standard Size View' : 'Full Size View'}
            >
              {isFullSize ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white"
              title="Close IMIP View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Viewport - Full View with Whole Page Rendered */}
        <div className="w-full flex-1 p-2 sm:p-6 lg:p-8 flex justify-center bg-slate-200/60 overflow-x-auto">
          {/* Printable Sheet (Formatted for standard A4 page dimensions) */}
          <div
            ref={printableRef}
            className="w-full max-w-[850px] bg-white text-slate-900 shadow-xl border border-slate-300 p-6 sm:p-10 rounded-xl print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none print:w-full"
            style={{ minHeight: '1050px' }}
          >
            {/* STRICT PRINT HEADER REQUIREMENT (Centered Republic of the Philippines and DepEd header, no logo) */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
              <div className="text-xs uppercase tracking-wider text-slate-600 font-medium">
                Republic of the Philippines
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide">
                Department of Education
              </h2>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-800">
                National Capital Region
              </h3>
              <h4 className="text-xs sm:text-sm font-semibold text-slate-800">
                Division Office of Caloocan City
              </h4>
              <h1 className="text-base sm:text-xl font-black text-slate-950 uppercase tracking-tight mt-0.5">
                MANUEL L. QUEZON ELEMENTARY SCHOOL
              </h1>
              <div className="text-xs font-bold text-sky-800 uppercase tracking-wider mt-0.5">
                ARAL Math Monitoring S.Y. 2026-2027
              </div>

              {/* Exact Title as requested */}
              <div className="inline-block mt-2.5 px-4 py-1 bg-sky-50 text-sky-950 border border-slate-300 rounded font-black text-xs uppercase tracking-wider print:border-slate-400">
                INDIVIDUAL MATHEMATICS INTERVENTION PLAN (IMIP)
              </div>
            </div>

            {/* Learner Profile Information Box */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-slate-50 border border-slate-300 p-3 rounded-lg text-xs mb-4 print:bg-transparent">
              <div>
                <span className="text-slate-500 block uppercase text-[9px] font-bold">Learner Name:</span>
                <span className="font-black text-sm text-slate-950">{learner.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[9px] font-bold">LRN:</span>
                <span className="font-mono font-bold text-slate-800">{learner.lrn || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[9px] font-bold">Grade & Section:</span>
                <span className="font-bold text-slate-900">Grade {gradeData.grade} - {learner.section || 'General'}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[9px] font-bold">ARAL Teacher:</span>
                <span className="font-black text-sky-950 bg-sky-100/70 px-1.5 py-0.5 rounded border border-sky-300 print:bg-transparent print:border-none print:p-0">
                  {learner.aralTeacher || gradeData.teacherName || 'ARAL Math Teacher'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[9px] font-bold">Gender / Date:</span>
                <span className="font-bold text-slate-800">
                  {learner.gender} • {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Summary Performance Metric Cards */}
            <div className="grid grid-cols-4 gap-2 mb-4 text-center text-xs">
              <div className="border border-slate-300 p-2 rounded-lg bg-sky-50/70 print:bg-transparent">
                <div className="text-[9px] uppercase font-bold text-slate-600">Total Worksheets</div>
                <div className="text-base font-black text-sky-800">
                  {stats.completedCount} / {gradeData.totalWorksheets}
                </div>
                <div className="text-[9px] text-slate-500">Administered</div>
              </div>

              <div className="border border-slate-300 p-2 rounded-lg bg-emerald-50/70 print:bg-transparent">
                <div className="text-[9px] uppercase font-bold text-slate-600">Total Score / Points</div>
                <div className="text-base font-black text-emerald-800">
                  {stats.totalScore} / {stats.totalItems}
                </div>
                <div className="text-[9px] text-slate-500">Achieved Points</div>
              </div>

              <div className="border border-slate-300 p-2 rounded-lg bg-amber-50/70 print:bg-transparent">
                <div className="text-[9px] uppercase font-bold text-slate-600">Overall Rating</div>
                <div className="text-base font-black text-amber-800">
                  {stats.percentage.toFixed(1)}%
                </div>
                <div className="text-[9px] text-slate-500">Weighted Average</div>
              </div>

              <div className={`border p-2 rounded-lg ${
                stats.status === 'Mastery' ? 'bg-emerald-100 border-emerald-400 text-emerald-950' :
                stats.status === 'Progressing' ? 'bg-sky-100 border-sky-400 text-sky-950' :
                'bg-rose-100 border-rose-400 text-rose-950'
              } print:bg-transparent`}>
                <div className="text-[9px] uppercase font-bold">Intervention Tier</div>
                <div className="text-xs font-black uppercase mt-0.5">
                  {stats.status}
                </div>
                <div className="text-[9px]">DepEd ARAL Math</div>
              </div>
            </div>

            {/* Section I: COMPLETE ARAL MATH WORKSHEETS SCORES TABLE (Dual column displaying ALL worksheets without truncation) */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-sky-700" />
                  I. Summary Table of ARAL Math Worksheet Scores (All {totalWS} Worksheets)
                </h5>
                <span className="text-[10px] font-bold text-slate-500">
                  DepEd ARAL Rubric
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {/* Left Column: WS 1 to Midpoint */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-[10px]">
                        <th className="py-1 px-1.5 border-r border-slate-300 text-center w-12">WS #</th>
                        <th className="py-1 px-1.5 border-r border-slate-300">Competency / Title</th>
                        <th className="py-1 px-1.5 border-r border-slate-300 text-center w-16">Score / PTS</th>
                        <th className="py-1 px-1.5 border-r border-slate-300 text-center w-12">Rating</th>
                        <th className="py-1 px-1.5 text-center w-24">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leftWorksheets.map(wsNum => renderWorksheetRow(wsNum))}
                    </tbody>
                  </table>
                </div>

                {/* Right Column: Midpoint+1 to Total WS */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-[10px]">
                        <th className="py-1 px-1.5 border-r border-slate-300 text-center w-12">WS #</th>
                        <th className="py-1 px-1.5 border-r border-slate-300">Competency / Title</th>
                        <th className="py-1 px-1.5 border-r border-slate-300 text-center w-16">Score / PTS</th>
                        <th className="py-1 px-1.5 border-r border-slate-300 text-center w-12">Rating</th>
                        <th className="py-1 px-1.5 text-center w-24">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rightWorksheets.map(wsNum => renderWorksheetRow(wsNum))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Section II: Customized Recommendations */}
            <div className="mb-4">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                II. Customized Numeracy Intervention Strategies & Recommendations
              </h5>
              <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-[11px] space-y-1.5 print:bg-transparent">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-sky-200 text-sky-900 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-slate-900 mr-1">{rec.area}:</span>
                      <span className="text-slate-800">{rec.action}</span>
                      <span className="text-slate-500 block text-[9px] italic mt-0.5">
                        Schedule / Mode: {rec.timeline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Remarks if present */}
            {learner.remarks && (
              <div className="mb-3 text-[11px] bg-amber-50 border border-amber-200 p-2 rounded-lg print:border-slate-300 print:bg-transparent">
                <span className="font-bold text-slate-900">Teacher's Observations / Case Notes: </span>
                <span className="text-slate-700">{learner.remarks}</span>
              </div>
            )}

            {/* Section III: Signatures */}
            <div className="mt-5 pt-3 border-t-2 border-slate-400 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="flex flex-col items-center">
                <div className="w-60 border-b-2 border-slate-900 pb-1 mb-1">
                  <span className="font-black text-slate-950 uppercase text-xs">
                    {learner.aralTeacher || gradeData.teacherName || 'ARAL Math Teacher'}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-800">Prepared by:</div>
                <div className="text-[10px] text-slate-600">ARAL Math Teacher / Focal</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-60 border-b-2 border-slate-900 pb-1 mb-1">
                  <span className="font-black text-slate-950 uppercase text-xs">
                    {gradeData.schoolHead || 'Principal IV'}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-800">Approved by:</div>
                <div className="text-[10px] text-slate-600">School Head / Principal</div>
              </div>
            </div>

            {/* Official Footer Note */}
            <div className="mt-4 text-center text-[9px] text-slate-400 uppercase tracking-wider print:text-slate-600">
              Manuel L. Quezon Elementary School • DepEd ARAL Program • Official Monitoring Document
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
