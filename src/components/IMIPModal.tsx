import React, { useRef, useState, useEffect } from 'react';
import {
  Printer,
  X,
  Download,
  Loader2,
  CheckCircle2,
  Maximize2,
  Minimize2,
  FileText,
  Edit3,
  RotateCcw,
  BookOpen
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

interface DomainPlan {
  identifiedGaps: string;
  targetSkills: string;
  tutorNotes: string;
}

export const IMIPModal: React.FC<IMIPModalProps> = ({
  learner,
  gradeData,
  onClose
}) => {
  const stats = computeLearnerStats(learner, gradeData);
  const printableRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isFullSize, setIsFullSize] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showScoresReference, setShowScoresReference] = useState(false);

  const cleanLearnerName = learner.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const pdfFileName = `IMIP_${cleanLearnerName}_Grade_${gradeData.grade}_A4.pdf`;

  // Generate domain-specific intervention details based on learner's grade and scores
  const generateDefaultPlan = (): Record<string, DomainPlan> => {
    const pct = stats.percentage;
    const isNeedsIntervention = pct < 75;
    const isProgressing = pct >= 75 && pct < 85;

    if (isNeedsIntervention) {
      return {
        'Number and Algebra': {
          identifiedGaps:
            learner.remarks ||
            'Difficulty with multi-digit operations, place value regrouping, and identifying arithmetic patterns.',
          targetSkills:
            'Mastery of fundamental addition/subtraction with regrouping, basic multiplication facts, and problem decomposition.',
          tutorNotes:
            'Use concrete base-10 blocks and number lines. Reinforce daily 15-min fact drills. Next session: Focus on multi-digit subtraction with zero regrouping.'
        },
        'Measurement and Geometry': {
          identifiedGaps:
            'Confusion between perimeter and area concepts; inconsistent unit conversions (cm to m, grams to kg).',
          targetSkills:
            'Correct identification of 2D/3D geometric properties and formulaic calculation of perimeter and basic area.',
          tutorNotes:
            'Utilize hands-on grid paper counting and physical measurement tools. Next session: Real-life perimeter measurement of classroom objects.'
        },
        'Data and Probability': {
          identifiedGaps:
            'Struggles in reading non-routine pictographs and extracting specific comparative values from simple bar graphs.',
          targetSkills:
            'Reading, interpreting, and constructing basic tally tables, pictographs with scales, and horizontal/vertical bar graphs.',
          tutorNotes:
            'Practice reading title, labels, and scale intervals step-by-step. Next session: Analyzing simple survey data from the class.'
        }
      };
    } else if (isProgressing) {
      return {
        'Number and Algebra': {
          identifiedGaps:
            learner.remarks ||
            'Occasional computational slips in multi-step word problems and simplifying basic fractions.',
          targetSkills:
            'Fluency in 2-step word problems, fractional parts of a whole, and verifying answers using inverse operations.',
          tutorNotes:
            'Encourage writing down step-by-step equations and highlighting problem keywords. Next session: Solving 2-step non-routine word problems.'
        },
        'Measurement and Geometry': {
          identifiedGaps:
            'Requires guidance when computing area of composite rectilinear figures and elapsed time word problems.',
          targetSkills:
            'Decomposing composite shapes into simpler rectangles; accurate elapsed time computation in hours and minutes.',
          tutorNotes:
            'Provide visual color-coded partitioning tasks. Next session: Solving practical elapsed time scheduling problems.'
        },
        'Data and Probability': {
          identifiedGaps:
            'Needs practice in drawing inferences and predicting outcomes based on presented data frequency tables.',
          targetSkills:
            'Analyzing trends from double-bar graphs and understanding basic probability terms (likely, unlikely, impossible).',
          tutorNotes:
            'Conduct simple dice/spinner probability simulations. Next session: Interpreting data trends from weekly progress tables.'
        }
      };
    } else {
      // Mastery tier
      return {
        'Number and Algebra': {
          identifiedGaps:
            'Demonstrated strong mastery. Occasional pacing adjustment when encountering complex multi-step math puzzles.',
          targetSkills:
            'Higher-order algebraic thinking, non-routine math olympiad challenges, and peer tutoring demonstration.',
          tutorNotes:
            'Assign logic puzzles and multi-operation riddle tasks. Engaged as an ARAL Peer Math Buddy during collaborative work.'
        },
        'Measurement and Geometry': {
          identifiedGaps:
            'Consistently accurate. Ready for 3D spatial surface area visualization and volume modeling.',
          targetSkills:
            'Spatial visualization of prisms and pyramids; calculating volume of rectangular prisms.',
          tutorNotes:
            'Engage in 3D net construction and architectural floor plan scaling projects. Next session: Volume computation challenges.'
        },
        'Data and Probability': {
          identifiedGaps:
            'Exhibits full competency in graph reading. Ready for independent statistical survey formulation.',
          targetSkills:
            'Formulating questions, gathering primary sample data, creating multi-scale graphs, and writing analytical conclusions.',
          tutorNotes:
            'Guide learner in conducting an independent school waste/snack survey. Next session: Formulating statistical conclusions.'
        }
      };
    }
  };

  const [domainPlans, setDomainPlans] = useState<Record<string, DomainPlan>>(generateDefaultPlan);

  // Update plan field helper
  const handleUpdatePlan = (domain: string, field: keyof DomainPlan, value: string) => {
    setDomainPlans(prev => ({
      ...prev,
      [domain]: {
        ...prev[domain],
        [field]: value
      }
    }));
  };

  // Reset to auto-generated plan
  const handleResetPlan = () => {
    setDomainPlans(generateDefaultPlan());
  };

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

  const domains = ['Number and Algebra', 'Measurement and Geometry', 'Data and Probability'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 flex flex-col items-center justify-start p-0 sm:p-3 backdrop-blur-xs">
      <div
        className={`relative w-full bg-slate-100 ${
          isFullSize ? 'max-w-[98vw] min-h-screen' : 'max-w-5xl my-2 rounded-2xl'
        } shadow-2xl border border-slate-300 flex flex-col print-container transition-all`}
      >
        {/* Sticky Modal Top Bar (Always in view while scrolling, hidden in print) */}
        <div className="sticky top-0 z-40 bg-gradient-to-r from-sky-700 via-sky-600 to-emerald-700 px-4 py-2.5 text-white shadow-md flex flex-wrap items-center justify-between gap-2.5 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm sm:text-base font-display">
                  Individual Mathematics Intervention Plan (IMIP) Report
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  Official DepEd Template • A4
                </span>
              </div>
              <p className="text-[11px] text-sky-100">
                Learner: <strong className="text-white">{learner.name}</strong> • Grade {gradeData.grade} - {learner.section || 'General'} • S.Y. 2026-2027
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isGeneratingPDF && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-lg text-xs font-bold text-amber-200 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating A4 PDF...</span>
              </div>
            )}

            {downloadSuccess && !isGeneratingPDF && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PDF Downloaded!</span>
              </div>
            )}

            {/* Edit / View Mode Toggle */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isEditing
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title="Edit gaps, competencies, and tutor notes directly"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Done Editing' : 'Edit Notes'}</span>
            </button>

            {/* Toggle Worksheet Scores Reference Panel */}
            <button
              onClick={() => setShowScoresReference(!showScoresReference)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="View student's raw worksheet scores for reference"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Scores Reference ({stats.percentage.toFixed(1)}%)</span>
            </button>

            {/* DOWNLOAD PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-md transition-all cursor-pointer text-xs"
              title="Download official IMIP report as an A4 PDF file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD PDF</span>
            </button>

            {/* PRINT Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-md transition-all cursor-pointer text-xs"
              title="Print official IMIP document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT</span>
            </button>

            {/* Full Size View Toggle */}
            <button
              onClick={() => setIsFullSize(!isFullSize)}
              className="p-1.5 bg-white/15 hover:bg-white/25 rounded-xl transition-colors cursor-pointer text-white"
              title={isFullSize ? 'Standard Size View' : 'Full Size View'}
            >
              {isFullSize ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white"
              title="Close IMIP View"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional Collapsible Worksheet Scores Reference Drawer */}
        {showScoresReference && (
          <div className="bg-sky-50 border-b border-sky-200 p-4 text-xs no-print">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-sky-900 uppercase">
                  Learner Scores Quick Reference ({learner.name})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-200 text-sky-800">
                  Total Score: {stats.totalScore} / {stats.totalItems} ({stats.percentage.toFixed(1)}%) • Status: {stats.status}
                </span>
              </div>
              <button
                onClick={handleResetPlan}
                className="flex items-center gap-1 text-[11px] text-sky-700 hover:underline cursor-pointer font-bold"
                title="Reset domain entries to match these score metrics"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Auto-fill Plan from Scores</span>
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5 max-h-36 overflow-y-auto p-1 bg-white rounded-lg border border-sky-200">
              {Array.from({ length: gradeData.totalWorksheets }).map((_, i) => {
                const w = i + 1;
                const sc = learner.scores[w];
                const cfg = gradeData.worksheetConfigs.find(c => c.number === w);
                const max = sc?.totalItems || cfg?.defaultTotalItems || 25;
                const score = sc ? sc.score : null;
                return (
                  <div key={w} className="p-1 text-center bg-slate-50 border border-slate-200 rounded text-[10px]">
                    <div className="font-bold text-slate-600">WS {w}</div>
                    <div className="font-mono font-bold text-slate-900">
                      {score !== null ? `${score}/${max}` : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Document Viewport - Full View with Whole Page Rendered */}
        <div className="w-full flex-1 p-2 sm:p-6 lg:p-8 flex justify-center bg-slate-200/60 overflow-x-auto">
          {/* Official Printable Sheet - Formatted to exactly match the attached IMIP PDF template */}
          <div
            ref={printableRef}
            className="w-full max-w-[850px] bg-white text-slate-950 shadow-xl border border-slate-300 p-8 sm:p-12 rounded-xl print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            {/* OFFICIAL HEADER (Exact 5 Lines with School Logo on Left as requested) */}
            <div className="relative flex items-center justify-center mb-6">
              {/* School Logo */}
              <div className="absolute left-0 top-0">
                <img
                  src="/assets/aistudio/Untitled_design__2__40f193e5.png"
                  alt="Manuel L. Quezon Elementary School Logo"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                />
              </div>

              {/* Exact 5-Line Header */}
              <div className="text-center w-full px-16 sm:px-20">
                {/* 1st Line: Republic of the Philippines */}
                <div className="text-xs sm:text-sm text-slate-700 tracking-wide font-normal">
                  Republic of the Philippines
                </div>
                {/* 2nd Line: National Capital Region */}
                <div className="text-xs sm:text-sm text-slate-700 tracking-wide font-normal mt-0.5">
                  National Capital Region
                </div>
                {/* 3rd Line: Schools Division Office of Caloocan City */}
                <div className="text-xs sm:text-sm text-slate-700 tracking-wide font-normal mt-0.5">
                  Schools Division Office of Caloocan City
                </div>
                {/* 4th Line: MANUEL L. QUEZON ELEMENTARY SCHOOL */}
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-wider uppercase mt-0.5">
                  MANUEL L. QUEZON ELEMENTARY SCHOOL
                </h1>
                {/* 5th Line: Meaning of IMIP Report */}
                <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight mt-2.5">
                  INDIVIDUAL MATHEMATICS INTERVENTION PLAN (IMIP)
                </h2>
              </div>
            </div>

            {/* LEARNER & TEACHER INFORMATION SECTION (Structured with lines matching the template) */}
            <div className="mb-6 space-y-3 text-xs sm:text-sm font-sans">
              {/* Row 1: Learner's Name & Grade Level & Section */}
              <div className="flex flex-col sm:flex-row items-baseline gap-4 sm:gap-8">
                <div className="flex-1 flex items-baseline gap-2 w-full">
                  <span className="font-bold text-slate-900 shrink-0">Learner's Name:</span>
                  <div className="flex-1 border-b border-slate-900 pb-0.5 px-2 font-bold text-slate-900 text-sm">
                    {learner.name}
                  </div>
                </div>
                <div className="w-full sm:w-5/12 flex items-baseline gap-2">
                  <span className="font-bold text-slate-900 shrink-0">Grade Level & Section:</span>
                  <div className="flex-1 border-b border-slate-900 pb-0.5 px-2 font-bold text-slate-900 text-sm">
                    Grade {gradeData.grade} - {learner.section || 'General'}
                  </div>
                </div>
              </div>

              {/* Row 2: Tutor's / Teacher's Name & School Year */}
              <div className="flex flex-col sm:flex-row items-baseline gap-4 sm:gap-8">
                <div className="flex-1 flex items-baseline gap-2 w-full">
                  <span className="font-bold text-slate-900 shrink-0">Tutor's / Teacher's Name:</span>
                  <div className="flex-1 border-b border-slate-900 pb-0.5 px-2 font-bold text-slate-900 text-sm">
                    {learner.aralTeacher || gradeData.teacherName || 'ARAL Math Teacher'}
                  </div>
                </div>
                <div className="w-full sm:w-5/12 flex items-baseline gap-2">
                  <span className="font-bold text-slate-900 shrink-0">School Year:</span>
                  <div className="flex-1 border-b border-slate-900 pb-0.5 px-2 font-bold text-slate-900 text-sm">
                    2026 - 2027
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN IMIP INTERVENTION TABLE (Matching the official 4-column structure) */}
            <div className="mb-8 border border-slate-900">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 font-bold text-slate-900 text-xs">
                    <th className="p-3 border-r border-slate-900 text-center w-[20%] font-bold">
                      Domain
                    </th>
                    <th className="p-3 border-r border-slate-900 text-center w-[26%] font-bold">
                      Identified Gaps
                    </th>
                    <th className="p-3 border-r border-slate-900 text-center w-[27%] font-bold">
                      Target Skills / Competencies
                    </th>
                    <th className="p-3 text-center w-[27%] font-bold">
                      <div>Tutor Notes / Observations</div>
                      <div className="text-[10px] font-normal italic text-slate-600">
                        (Include observable remarks and next session's target)
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((domain, index) => {
                    const plan = domainPlans[domain] || {
                      identifiedGaps: '',
                      targetSkills: '',
                      tutorNotes: ''
                    };
                    const isLast = index === domains.length - 1;

                    return (
                      <tr key={domain} className={`${!isLast ? 'border-b border-slate-900' : ''} align-top`}>
                        {/* Column 1: Domain */}
                        <td className="p-3.5 border-r border-slate-900 font-bold text-slate-900 text-xs bg-slate-50/40 print:bg-transparent">
                          {domain}
                        </td>

                        {/* Column 2: Identified Gaps */}
                        <td className="p-3.5 border-r border-slate-900 text-slate-800 text-[11px] leading-relaxed">
                          {isEditing ? (
                            <textarea
                              rows={4}
                              value={plan.identifiedGaps}
                              onChange={e => handleUpdatePlan(domain, 'identifiedGaps', e.target.value)}
                              className="w-full p-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                            />
                          ) : (
                            <div className="whitespace-pre-line">{plan.identifiedGaps}</div>
                          )}
                        </td>

                        {/* Column 3: Target Skills / Competencies */}
                        <td className="p-3.5 border-r border-slate-900 text-slate-800 text-[11px] leading-relaxed">
                          {isEditing ? (
                            <textarea
                              rows={4}
                              value={plan.targetSkills}
                              onChange={e => handleUpdatePlan(domain, 'targetSkills', e.target.value)}
                              className="w-full p-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                            />
                          ) : (
                            <div className="whitespace-pre-line">{plan.targetSkills}</div>
                          )}
                        </td>

                        {/* Column 4: Tutor Notes / Observations */}
                        <td className="p-3.5 text-slate-800 text-[11px] leading-relaxed">
                          {isEditing ? (
                            <textarea
                              rows={4}
                              value={plan.tutorNotes}
                              onChange={e => handleUpdatePlan(domain, 'tutorNotes', e.target.value)}
                              className="w-full p-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                            />
                          ) : (
                            <div className="whitespace-pre-line">{plan.tutorNotes}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* SIGNATURES SECTION (Exact format from template) */}
            <div className="grid grid-cols-2 gap-12 text-xs sm:text-sm font-sans mt-10 pt-2">
              {/* Left Column: Prepared by */}
              <div>
                <div className="font-bold text-slate-900 mb-8">Prepared by:</div>
                <div className="w-full max-w-[320px]">
                  <div className="border-b border-slate-900 pb-1 text-center font-bold text-slate-900 text-xs sm:text-sm uppercase">
                    {learner.aralTeacher || gradeData.teacherName || 'ARAL Math Teacher'}
                  </div>
                  <div className="text-center text-[10px] sm:text-xs text-slate-600 mt-1 italic font-medium">
                    Teacher / Tutor Signature over Printed Name
                  </div>
                </div>
              </div>

              {/* Right Column: Noted by */}
              <div>
                <div className="font-bold text-slate-900 mb-8">Noted by:</div>
                <div className="w-full max-w-[320px]">
                  <div className="border-b border-slate-900 pb-1 text-center font-bold text-slate-900 text-xs sm:text-sm uppercase">
                    {gradeData.schoolHead || 'Principal IV'}
                  </div>
                  <div className="text-center text-[10px] sm:text-xs text-slate-600 mt-1 italic font-medium">
                    School Head / Principal Signature over Printed Name
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
