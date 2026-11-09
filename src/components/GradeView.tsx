import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  LayoutDashboard,
  Users,
  Table as TableIcon,
  Printer,
  Plus,
  Trash2,
  Edit2,
  Search,
  Settings,
  Download,
  AlertTriangle,
  Award,
  CheckCircle2,
  UserPlus,
  ArrowUpDown,
  Filter,
  Check,
  X,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import type { GradeLevel, GradeData, Learner, WorksheetConfig, ScoreValue } from '../types';
import { computeLearnerStats, exportToCSV } from '../services/googleSheets';

interface GradeViewProps {
  gradeData: GradeData;
  onUpdateGradeData: (updated: GradeData) => void;
  onOpenIMIP: (learner: Learner) => void;
  onOpenSyncModal: () => void;
}

export const GradeView: React.FC<GradeViewProps> = ({
  gradeData,
  onUpdateGradeData,
  onOpenIMIP,
  onOpenSyncModal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'learners' | 'scores'>('scores');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');

  // Modals
  const [isAddLearnerOpen, setIsAddLearnerOpen] = useState(false);
  const [editingLearner, setEditingLearner] = useState<Learner | null>(null);
  const [isWorksheetConfigOpen, setIsWorksheetConfigOpen] = useState(false);
  const [bulkInputOpen, setBulkInputOpen] = useState(false);
  const [bulkNamesText, setBulkNamesText] = useState('');

  // Editing state for total worksheets
  const [newTotalWs, setNewTotalWs] = useState<number>(gradeData.totalWorksheets);

  // Cell editing state: active cell key "learnerId-wsNum"
  const [editingCell, setEditingCell] = useState<{
    learnerId: string;
    wsNum: number;
    scoreStr: string;
    itemsStr: string;
  } | null>(null);

  // New learner form state
  const [learnerForm, setLearnerForm] = useState({
    lrn: '',
    name: '',
    gender: 'Male' as 'Male' | 'Female',
    section: '',
    aralTeacher: gradeData.teacherName || '',
    remarks: ''
  });

  // Calculate stats for all learners
  const learnersWithStats = useMemo(() => {
    return gradeData.learners.map(learner => {
      const stats = computeLearnerStats(learner, gradeData);
      return {
        ...learner,
        stats
      };
    });
  }, [gradeData]);

  // Filtered learners
  const filteredLearners = useMemo(() => {
    return learnersWithStats.filter(l => {
      const matchesSearch =
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.lrn.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGender = genderFilter === 'All' || l.gender === genderFilter;
      return matchesSearch && matchesGender;
    });
  }, [learnersWithStats, searchTerm, genderFilter]);

  // Aggregate Grade metrics
  const gradeMetrics = useMemo(() => {
    const total = learnersWithStats.length;
    let sumPct = 0;
    let validCount = 0;
    let mastery = 0;
    let progressing = 0;
    let intervention = 0;
    let male = 0;
    let female = 0;

    learnersWithStats.forEach(l => {
      if (l.gender === 'Male') male++;
      else female++;

      if (l.stats.completedCount > 0) {
        sumPct += l.stats.percentage;
        validCount++;
        if (l.stats.status === 'Mastery') mastery++;
        else if (l.stats.status === 'Progressing') progressing++;
        else if (l.stats.status === 'Needs Intervention') intervention++;
      }
    });

    const avg = validCount > 0 ? sumPct / validCount : 0;
    return { total, avg, mastery, progressing, intervention, male, female };
  }, [learnersWithStats]);

  // Compute average score per worksheet for the Dashboard bar chart
  const worksheetPerformanceData = useMemo(() => {
    const list = [];
    for (let w = 1; w <= gradeData.totalWorksheets; w++) {
      let sumPct = 0;
      let count = 0;
      gradeData.learners.forEach(l => {
        const sc = l.scores[w];
        if (sc && sc.totalItems > 0 && typeof sc.score === 'number') {
          sumPct += (sc.score / sc.totalItems) * 100;
          count++;
        }
      });
      list.push({
        ws: `WS ${w}`,
        average: count > 0 ? Number((sumPct / count).toFixed(1)) : 0,
        submissions: count
      });
    }
    return list;
  }, [gradeData]);

  // Handlers for Total Worksheets Editing
  const handleSaveTotalWorksheets = () => {
    const targetCount = Math.max(1, Math.min(60, Number(newTotalWs) || 1));
    const currentConfigs = [...gradeData.worksheetConfigs];

    // If expanding, add new worksheet configs
    while (currentConfigs.length < targetCount) {
      const nextNum = currentConfigs.length + 1;
      currentConfigs.push({
        number: nextNum,
        title: `Worksheet ${nextNum}`,
        defaultTotalItems: 25
      });
    }

    // If contracting, truncate
    const updatedConfigs = currentConfigs.slice(0, targetCount);

    onUpdateGradeData({
      ...gradeData,
      totalWorksheets: targetCount,
      worksheetConfigs: updatedConfigs
    });
    setIsWorksheetConfigOpen(false);
  };

  // Handler to update PTS (total items) for a specific worksheet
  const handleUpdateWorksheetPTS = (wsNum: number, newPTS: number) => {
    const pts = Math.max(1, Math.min(200, Number(newPTS) || 1));
    const currentConfigs = [...gradeData.worksheetConfigs];
    const existingIndex = currentConfigs.findIndex(c => c.number === wsNum);
    
    if (existingIndex >= 0) {
      currentConfigs[existingIndex] = {
        ...currentConfigs[existingIndex],
        defaultTotalItems: pts
      };
    } else {
      currentConfigs.push({
        number: wsNum,
        title: `Worksheet ${wsNum}`,
        defaultTotalItems: pts
      });
    }

    // Automatically update learners' totalItems for this worksheet if they have recorded scores
    const updatedLearners = gradeData.learners.map(l => {
      const existing = l.scores[wsNum];
      if (existing) {
        return {
          ...l,
          scores: {
            ...l.scores,
            [wsNum]: {
              score: Math.min(existing.score, pts),
              totalItems: pts
            }
          }
        };
      }
      return l;
    });

    onUpdateGradeData({
      ...gradeData,
      worksheetConfigs: currentConfigs,
      learners: updatedLearners
    });
  };

  // Handler to batch set PTS for all worksheets in this grade
  const handleBatchSetPTS = (ptsValue: number) => {
    const pts = Math.max(1, Math.min(200, ptsValue));
    const updatedConfigs = gradeData.worksheetConfigs.map(c => ({
      ...c,
      defaultTotalItems: pts
    }));

    const updatedLearners = gradeData.learners.map(l => {
      const newScores = { ...l.scores };
      Object.keys(newScores).forEach(key => {
        const w = Number(key);
        if (newScores[w]) {
          newScores[w] = {
            score: Math.min(newScores[w].score, pts),
            totalItems: pts
          };
        }
      });
      return { ...l, scores: newScores };
    });

    onUpdateGradeData({
      ...gradeData,
      worksheetConfigs: updatedConfigs,
      learners: updatedLearners
    });
  };

  // Handlers for Score Cell Input (Both Score and PTS editable)
  const handleStartEditCell = (learnerId: string, wsNum: number, currentEntry?: ScoreValue) => {
    const config = gradeData.worksheetConfigs.find(c => c.number === wsNum);
    const defItems = config?.defaultTotalItems || 30;
    setEditingCell({
      learnerId,
      wsNum,
      scoreStr: currentEntry ? String(currentEntry.score) : '',
      itemsStr: currentEntry ? String(currentEntry.totalItems) : String(defItems)
    });
  };

  const handleSaveCell = () => {
    if (!editingCell) return;
    const { learnerId, wsNum, scoreStr, itemsStr } = editingCell;

    let scoreVal: number | null = null;
    let itemsVal = parseFloat(itemsStr.trim());

    if (isNaN(itemsVal) || itemsVal <= 0) {
      const config = gradeData.worksheetConfigs.find(c => c.number === wsNum);
      itemsVal = config?.defaultTotalItems || 30;
    }

    // Support entering "28/30" or "28 / 30" in scoreStr
    if (scoreStr.includes('/')) {
      const parts = scoreStr.split('/');
      scoreVal = parseFloat(parts[0].trim());
      if (parts[1] && parts[1].trim()) {
        const parsedItems = parseFloat(parts[1].trim());
        if (!isNaN(parsedItems) && parsedItems > 0) {
          itemsVal = parsedItems;
        }
      }
    } else if (scoreStr.trim() !== '') {
      scoreVal = parseFloat(scoreStr.trim());
    }

    const updatedLearners = gradeData.learners.map(l => {
      if (l.id !== learnerId) return l;
      const newScores = { ...l.scores };
      if (scoreVal !== null && !isNaN(scoreVal)) {
        newScores[wsNum] = {
          score: Math.min(scoreVal, itemsVal),
          totalItems: itemsVal
        };
      } else if (scoreStr.trim() === '') {
        delete newScores[wsNum];
      }
      return {
        ...l,
        scores: newScores
      };
    });

    onUpdateGradeData({
      ...gradeData,
      learners: updatedLearners
    });
    setEditingCell(null);
  };

  // Handlers for Learners Management
  const handleSaveLearner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnerForm.name.trim()) return;

    if (editingLearner) {
      const updatedLearners = gradeData.learners.map(l =>
        l.id === editingLearner.id
          ? {
              ...l,
              lrn: learnerForm.lrn.trim(),
              name: learnerForm.name.trim(),
              gender: learnerForm.gender,
              section: learnerForm.section.trim(),
              aralTeacher: learnerForm.aralTeacher.trim() || l.aralTeacher || gradeData.teacherName,
              remarks: learnerForm.remarks.trim()
            }
          : l
      );
      onUpdateGradeData({ ...gradeData, learners: updatedLearners });
      setEditingLearner(null);
    } else {
      const newLearner: Learner = {
        id: `learner-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        lrn: learnerForm.lrn.trim() || `136589260${Math.floor(100 + Math.random() * 900)}`,
        name: learnerForm.name.trim(),
        gender: learnerForm.gender,
        section: learnerForm.section.trim() || 'General',
        aralTeacher: learnerForm.aralTeacher.trim() || gradeData.teacherName || 'ARAL Math Teacher',
        remarks: learnerForm.remarks.trim(),
        scores: {}
      };
      onUpdateGradeData({
        ...gradeData,
        learners: [...gradeData.learners, newLearner]
      });
      setIsAddLearnerOpen(false);
    }

    setLearnerForm({
      lrn: '',
      name: '',
      gender: 'Male',
      section: '',
      aralTeacher: gradeData.teacherName || '',
      remarks: ''
    });
  };

  const handleDeleteLearner = (learnerId: string, learnerName: string) => {
    if (confirm(`Are you sure you want to remove learner "${learnerName}" from Grade ${gradeData.grade}?`)) {
      const updated = gradeData.learners.filter(l => l.id !== learnerId);
      onUpdateGradeData({ ...gradeData, learners: updated });
    }
  };

  const handleBulkAdd = () => {
    if (!bulkNamesText.trim()) return;
    const lines = bulkNamesText.split('\n').filter(line => line.trim().length > 0);
    const newLearners: Learner[] = lines.map((line, idx) => {
      // Supports "Name, Gender" or just "Name"
      const parts = line.split(',');
      const name = parts[0].trim();
      const gender: 'Male' | 'Female' = parts[1] && parts[1].trim().toLowerCase().startsWith('f') ? 'Female' : 'Male';
      return {
        id: `bulk-${Date.now()}-${idx}`,
        lrn: `136589260${Math.floor(100 + Math.random() * 900)}`,
        name,
        gender,
        section: gradeData.sectionDefault,
        remarks: 'Enrolled via bulk list',
        scores: {}
      };
    });

    onUpdateGradeData({
      ...gradeData,
      learners: [...gradeData.learners, ...newLearners]
    });
    setBulkNamesText('');
    setBulkInputOpen(false);
  };

  // CSV Export for Grade Level
  const handleExportGradeCSV = () => {
    const colHeaders: (string | number)[] = [
      'No.',
      'LRN',
      'Learner Name',
      'Gender',
      'Section'
    ];
    for (let w = 1; w <= gradeData.totalWorksheets; w++) {
      colHeaders.push(`WS ${w} Score`);
      colHeaders.push(`WS ${w} Max Items`);
    }
    colHeaders.push('Total Score', 'Total Items', 'Overall %', 'Status', 'Remarks');

    const rows: (string | number)[][] = [
      [`MANUEL L. QUEZON ELEMENTARY SCHOOL - GRADE ${gradeData.grade} ARAL MATH`],
      [`Teacher: ${gradeData.teacherName || 'ARAL Teacher'}`, `Section: ${gradeData.sectionDefault || ''}`],
      [],
      colHeaders
    ];

    learnersWithStats.forEach((l, idx) => {
      const row: (string | number)[] = [
        idx + 1,
        l.lrn,
        l.name,
        l.gender,
        l.section || gradeData.sectionDefault
      ];
      for (let w = 1; w <= gradeData.totalWorksheets; w++) {
        const sc = l.scores[w];
        row.push(sc ? sc.score : '-');
        row.push(sc ? sc.totalItems : '-');
      }
      row.push(
        l.stats.totalScore,
        l.stats.totalItems,
        `${l.stats.percentage.toFixed(2)}%`,
        l.stats.status,
        l.remarks || ''
      );
      rows.push(row);
    });

    exportToCSV(`MLQES_Grade_${gradeData.grade}_ARAL_Math_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="w-full space-y-4">
      {/* Grade Control Bar (Full-Width) */}
      <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white flex items-center justify-center font-black text-xl font-display shadow-sm">
            G{gradeData.grade}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                Grade {gradeData.grade} ARAL Math Portal
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                S.Y. 2026-2027
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Worksheets: <span className="font-bold text-sky-700">{gradeData.totalWorksheets} Total</span> • Key Stage Numeracy Mastery Monitoring
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Editable Worksheet Totals Button */}
          <button
            onClick={() => {
              setNewTotalWs(gradeData.totalWorksheets);
              setIsWorksheetConfigOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
            title="Edit Total Worksheets for this Grade"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Worksheets: {gradeData.totalWorksheets} (Edit)</span>
          </button>

          <button
            onClick={handleExportGradeCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
            <span>Sync Sheets</span>
          </button>
        </div>
      </div>

      {/* Grade Sub-Tabs (Dashboard | Learners Management | Score Submission) */}
      <div className="w-full flex items-center justify-between border-b border-slate-200 bg-white px-2 pt-2 rounded-t-2xl shadow-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Score Submission Tab */}
          <button
            onClick={() => setActiveSubTab('scores')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm border-b-2 cursor-pointer transition-all ${
              activeSubTab === 'scores'
                ? 'border-sky-600 text-sky-600 bg-sky-50/50 rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Score Submission Table</span>
            <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded-md font-mono">
              {gradeData.totalWorksheets} WS
            </span>
          </button>

          {/* Learners Management Tab */}
          <button
            onClick={() => setActiveSubTab('learners')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm border-b-2 cursor-pointer transition-all ${
              activeSubTab === 'learners'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50 rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Learners Management</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-mono">
              {learnersWithStats.length}
            </span>
          </button>

          {/* Dashboard Tab */}
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm border-b-2 cursor-pointer transition-all ${
              activeSubTab === 'dashboard'
                ? 'border-purple-600 text-purple-600 bg-purple-50/50 rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Grade Dashboard</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SCORE SUBMISSION TABLE */}
      {activeSubTab === 'scores' && (
        <div className="w-full bg-white rounded-b-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Header Filter & Instructions Bar */}
          <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[200px] max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or LRN..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Quick Batch Set PTS */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                <span className="text-slate-500 font-bold text-[11px]">Set all WS to:</span>
                {[20, 25, 30, 35, 40].map(pts => (
                  <button
                    key={pts}
                    onClick={() => handleBatchSetPTS(pts)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-sky-100 hover:text-sky-700 text-slate-700 font-mono font-bold text-[10px] rounded border border-slate-200 cursor-pointer transition-colors"
                    title={`Set all ${gradeData.totalWorksheets} worksheets in Grade ${gradeData.grade} to ${pts} total points`}
                  >
                    {pts} pts
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-1.5 text-slate-600 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
                <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="text-[11px]">
                  <strong>Editable PTS:</strong> Edit <span className="font-mono text-sky-800 font-bold">PTS</span> in any column header or click any cell to edit both <span className="font-mono text-sky-800 font-bold">Score & PTS</span>.
                </span>
              </div>

              <button
                onClick={() => setIsAddLearnerOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer shadow-xs text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Student
              </button>
            </div>
          </div>

          {/* Detailed Wide-Spanning Grading Table */}
          <div className="w-full overflow-x-auto max-h-[72vh] relative scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-20 bg-slate-100 border-b-2 border-slate-300 shadow-xs">
                <tr className="text-slate-700 font-bold uppercase text-[11px]">
                  {/* Sticky Column 1: # (40px) */}
                  <th className="sticky left-0 z-30 bg-slate-100 p-2 text-center w-[40px] min-w-[40px] max-w-[40px] border-r border-slate-300">
                    #
                  </th>

                  {/* Sticky Column 2: IMIP (64px) */}
                  <th className="sticky left-[40px] z-30 bg-slate-100 p-2 text-center w-[64px] min-w-[64px] max-w-[64px] border-r border-slate-300">
                    IMIP
                  </th>

                  {/* Sticky Column 3: LRN (110px) */}
                  <th className="sticky left-[104px] z-30 bg-slate-100 p-2 text-left w-[110px] min-w-[110px] max-w-[110px] border-r border-slate-300">
                    LRN
                  </th>

                  {/* Sticky Column 4: Student Name (190px) */}
                  <th className="sticky left-[214px] z-30 bg-slate-100 p-2 text-left w-[190px] min-w-[190px] max-w-[190px] border-r-2 border-slate-400 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)]">
                    Learner Name
                  </th>

                  {/* Dynamic Worksheet Columns (WS 1 to WS N) */}
                  {Array.from({ length: gradeData.totalWorksheets }).map((_, i) => {
                    const wsNum = i + 1;
                    const config = gradeData.worksheetConfigs.find(c => c.number === wsNum);
                    const defItems = config?.defaultTotalItems || 25;
                    const isWS1 = wsNum === 1;

                    return (
                      <th
                        key={wsNum}
                        className={`p-2 border-r border-slate-300 text-center min-w-[105px] max-w-[115px] ${
                          isWS1
                            ? 'bg-amber-100/90 border-l-2 border-l-amber-500 shadow-inner'
                            : 'bg-slate-100 hover:bg-slate-200/70'
                        } transition-colors`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className={`font-black text-xs ${isWS1 ? 'text-amber-950 font-bold' : 'text-slate-800'}`}>
                            WS {wsNum}
                          </span>
                          {isWS1 && (
                            <span className="px-1 py-0.2 bg-amber-500 text-slate-950 font-black text-[9px] rounded uppercase shadow-2xs">
                              WS 1
                            </span>
                          )}
                        </div>
                        {/* Editable PTS input in the header */}
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-[10px] font-bold text-slate-500">PTS:</span>
                          <input
                            type="number"
                            min={1}
                            max={200}
                            value={defItems}
                            onChange={e => handleUpdateWorksheetPTS(wsNum, parseInt(e.target.value) || 1)}
                            className="w-12 text-center font-mono font-bold text-[11px] bg-white border border-slate-300 rounded px-1 py-0.5 text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 hover:border-sky-500 shadow-2xs cursor-text"
                            title={`Click to edit total PTS for WS ${wsNum}`}
                          />
                        </div>
                      </th>
                    );
                  })}

                  {/* Summary Computed Columns */}
                  <th className="p-2.5 border-r border-slate-300 text-center min-w-[90px] bg-slate-200 font-black text-slate-900">
                    Total Score
                  </th>
                  <th className="p-2.5 border-r border-slate-300 text-center min-w-[90px] bg-slate-200 font-black text-slate-900">
                    Total Items
                  </th>
                  <th className="p-2.5 border-r border-slate-300 text-center min-w-[100px] bg-amber-100 font-black text-amber-950">
                    Overall %
                  </th>
                  <th className="p-2.5 text-center min-w-[120px] bg-slate-100">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredLearners.length === 0 ? (
                  <tr>
                    <td
                      colSpan={gradeData.totalWorksheets + 8}
                      className="p-8 text-center text-slate-400 text-sm font-medium"
                    >
                      No learners found matching filter criteria. Click "Add Student" above to begin.
                    </td>
                  </tr>
                ) : (
                  filteredLearners.map((l, index) => {
                    const pct = l.stats.percentage;
                    const isMastery = l.stats.status === 'Mastery';
                    const isProgressing = l.stats.status === 'Progressing';
                    const isIntervention = l.stats.status === 'Needs Intervention';

                    return (
                      <tr
                        key={l.id}
                        className={`group hover:bg-sky-50/70 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                        }`}
                      >
                        {/* Sticky Column 1: # (40px) */}
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-sky-50 p-2 text-center font-mono font-bold text-slate-600 w-[40px] min-w-[40px] max-w-[40px] border-r border-slate-200">
                          {index + 1}
                        </td>

                        {/* Sticky Column 2: Print IMIP Button (64px) */}
                        <td className="sticky left-[40px] z-10 bg-white group-hover:bg-sky-50 p-1.5 text-center w-[64px] min-w-[64px] max-w-[64px] border-r border-slate-200">
                          <button
                            onClick={() => onOpenIMIP(l)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-md shadow-2xs cursor-pointer text-[10px] transition-all"
                            title="Print Individual Mathematics Intervention Plan (IMIP)"
                          >
                            <Printer className="w-3 h-3" />
                            <span>IMIP</span>
                          </button>
                        </td>

                        {/* Sticky Column 3: LRN (110px) */}
                        <td className="sticky left-[104px] z-10 bg-white group-hover:bg-sky-50 p-2 font-mono text-[11px] text-slate-700 w-[110px] min-w-[110px] max-w-[110px] border-r border-slate-200 truncate">
                          {l.lrn || '-'}
                        </td>

                        {/* Sticky Column 4: Student Name (190px) */}
                        <td className="sticky left-[214px] z-10 bg-white group-hover:bg-sky-50 p-2 font-extrabold text-slate-900 w-[190px] min-w-[190px] max-w-[190px] border-r-2 border-slate-300 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)]">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">{l.name}</span>
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-bold shrink-0 ${
                                l.gender === 'Male'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-pink-100 text-pink-700'
                              }`}
                            >
                              {l.gender[0]}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5 flex items-center gap-1">
                            <span className="font-semibold text-sky-800">Sec: {l.section || 'General'}</span>
                            <span className="text-slate-300">•</span>
                            <span className="truncate text-slate-600" title={`ARAL Teacher: ${l.aralTeacher || gradeData.teacherName}`}>
                              {l.aralTeacher || gradeData.teacherName}
                            </span>
                          </div>
                        </td>

                        {/* Editable Worksheet Score & PTS Cells */}
                        {Array.from({ length: gradeData.totalWorksheets }).map((_, i) => {
                          const wsNum = i + 1;
                          const scoreEntry = l.scores[wsNum];
                          const isEditingThisCell =
                            editingCell?.learnerId === l.id && editingCell?.wsNum === wsNum;
                          const config = gradeData.worksheetConfigs.find(c => c.number === wsNum);
                          const defItems = config?.defaultTotalItems || 25;
                          const isWS1 = wsNum === 1;

                          // Editing cell: Side-by-side editable Score AND PTS
                          if (isEditingThisCell) {
                            return (
                              <td
                                key={wsNum}
                                className={`p-1 border-r border-slate-200 ${
                                  isWS1 ? 'bg-amber-100/70 border-l border-l-amber-400' : 'bg-amber-50/90'
                                } text-center z-10 relative`}
                              >
                                <div className="flex flex-col items-center p-1 bg-white border-2 border-amber-500 rounded-lg shadow-md min-w-[125px]">
                                  <div className="text-[9px] font-bold text-amber-800 uppercase mb-1">
                                    WS {wsNum} • Score / PTS
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="flex flex-col items-center">
                                      <label className="text-[8px] font-bold text-slate-500 uppercase">Score</label>
                                      <input
                                        type="number"
                                        autoFocus
                                        min={0}
                                        placeholder="0"
                                        value={editingCell.scoreStr}
                                        onChange={e =>
                                          setEditingCell({
                                            ...editingCell,
                                            scoreStr: e.target.value
                                          })
                                        }
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') handleSaveCell();
                                          if (e.key === 'Escape') setEditingCell(null);
                                        }}
                                        className="w-12 px-1 py-1 text-center font-black font-mono text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                      />
                                    </div>
                                    <span className="text-slate-400 font-bold text-sm mt-3">/</span>
                                    <div className="flex flex-col items-center">
                                      <label className="text-[8px] font-bold text-slate-500 uppercase">PTS</label>
                                      <input
                                        type="number"
                                        min={1}
                                        max={200}
                                        placeholder={`${defItems}`}
                                        value={editingCell.itemsStr}
                                        onChange={e =>
                                          setEditingCell({
                                            ...editingCell,
                                            itemsStr: e.target.value
                                          })
                                        }
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') handleSaveCell();
                                          if (e.key === 'Escape') setEditingCell(null);
                                        }}
                                        className="w-12 px-1 py-1 text-center font-black font-mono text-xs bg-sky-50 border border-sky-300 rounded text-sky-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1.5 pt-1 border-t border-slate-100 w-full justify-center">
                                    <button
                                      onClick={handleSaveCell}
                                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <Check className="w-3 h-3" /> Save
                                    </button>
                                    <button
                                      onClick={() => setEditingCell(null)}
                                      className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-semibold cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          const hasScore = scoreEntry && typeof scoreEntry.score === 'number';
                          const cellPct = hasScore
                            ? (scoreEntry.score / scoreEntry.totalItems) * 100
                            : null;

                          return (
                            <td
                              key={wsNum}
                              onClick={() => handleStartEditCell(l.id, wsNum, scoreEntry)}
                              className={`p-2 border-r border-slate-200 text-center cursor-pointer hover:bg-amber-100/60 transition-colors group/cell ${
                                isWS1 ? 'bg-amber-50/50 border-l border-l-amber-200' : ''
                              }`}
                              title="Click to edit Score and PTS"
                            >
                              {hasScore ? (
                                <div className="flex flex-col items-center group-hover/cell:scale-105 transition-transform">
                                  <div className="font-mono font-black text-slate-900 text-xs flex items-center gap-1">
                                    <span>{scoreEntry.score}</span>
                                    <span className="text-slate-400 font-normal">/</span>
                                    <span
                                      className="text-sky-800 bg-sky-100 px-1 py-0.2 rounded text-[10px] font-bold"
                                      title="Total PTS for this student"
                                    >
                                      {scoreEntry.totalItems} pts
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span
                                      className={`text-[10px] font-bold font-mono ${
                                        cellPct! >= 85
                                          ? 'text-emerald-700'
                                          : cellPct! >= 75
                                          ? 'text-blue-700'
                                          : 'text-rose-600'
                                      }`}
                                    >
                                      {cellPct!.toFixed(0)}%
                                    </span>
                                    <Edit2 className="w-2.5 h-2.5 text-slate-300 group-hover/cell:text-amber-600" />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center text-slate-400 group-hover/cell:text-slate-700">
                                  <span className="font-mono text-xs">
                                    - / <strong className="text-sky-800">{defItems} pts</strong>
                                  </span>
                                  <span className="text-[9px] text-slate-400 group-hover/cell:text-amber-600 font-semibold mt-0.5 flex items-center gap-0.5">
                                    <Plus className="w-2.5 h-2.5" /> Enter
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Computed Totals & Percentage */}
                        <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-slate-800 bg-slate-50/50">
                          {l.stats.totalScore}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-slate-700 bg-slate-50/50">
                          {l.stats.totalItems}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center font-mono font-extrabold text-sm bg-amber-50">
                          <span
                            className={
                              pct >= 85
                                ? 'text-emerald-700'
                                : pct >= 75
                                ? 'text-blue-700'
                                : pct > 0
                                ? 'text-rose-600'
                                : 'text-slate-400'
                            }
                          >
                            {pct > 0 ? `${pct.toFixed(1)}%` : '0%'}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                              isMastery
                                ? 'bg-emerald-100 text-emerald-800'
                                : isProgressing
                                ? 'bg-blue-100 text-blue-800'
                                : isIntervention
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {l.stats.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LEARNERS MANAGEMENT */}
      {activeSubTab === 'learners' && (
        <div className="w-full bg-white rounded-b-2xl border border-slate-200 shadow-xs p-5 space-y-5">
          {/* Top Actions & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or LRN..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Gender Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                {(['All', 'Male', 'Female'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                      genderFilter === g
                        ? 'bg-white shadow-xs text-slate-900 font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkInputOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 cursor-pointer transition-colors"
              >
                <UserPlus className="w-4 h-4 text-slate-600" />
                <span>Bulk Import Names</span>
              </button>

              <button
                onClick={() => {
                  setEditingLearner(null);
                  setLearnerForm({
                    lrn: `136589260${Math.floor(100 + Math.random() * 900)}`,
                    name: '',
                    gender: 'Male',
                    section: '',
                    aralTeacher: gradeData.teacherName || '',
                    remarks: ''
                  });
                  setIsAddLearnerOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Learner</span>
              </button>
            </div>
          </div>

          {/* Learners Roster Table */}
          <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3 w-36">LRN</th>
                  <th className="p-3">Learner Full Name</th>
                  <th className="p-3 w-20 text-center">Gender</th>
                  <th className="p-3 w-28">Section</th>
                  <th className="p-3 w-40">ARAL Teacher</th>
                  <th className="p-3 text-center w-24">Score %</th>
                  <th className="p-3">Observations / Remarks</th>
                  <th className="p-3 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLearners.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400">
                      No learners match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredLearners.map((learner, idx) => (
                    <tr key={learner.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center font-mono font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-mono font-medium text-slate-700">
                        {learner.lrn || '-'}
                      </td>
                      <td className="p-3 font-bold text-slate-900 text-sm">
                        {learner.name}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            learner.gender === 'Male'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-pink-100 text-pink-800'
                          }`}
                        >
                          {learner.gender}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        {learner.section || 'General'}
                      </td>
                      <td className="p-3 text-sky-900 font-semibold">
                        {learner.aralTeacher || gradeData.teacherName || 'ARAL Math Teacher'}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold font-mono text-[11px] ${
                            learner.stats.percentage >= 85
                              ? 'bg-emerald-100 text-emerald-800'
                              : learner.stats.percentage >= 75
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {learner.stats.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 text-xs italic">
                        {learner.remarks || 'No specific notes'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenIMIP(learner)}
                            className="p-1.5 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors cursor-pointer"
                            title="Print IMIP"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingLearner(learner);
                              setLearnerForm({
                                lrn: learner.lrn,
                                name: learner.name,
                                gender: learner.gender,
                                section: learner.section || '',
                                aralTeacher: learner.aralTeacher || gradeData.teacherName || '',
                                remarks: learner.remarks || ''
                              });
                              setIsAddLearnerOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit Learner Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLearner(learner.id, learner.name)}
                            className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Remove Learner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GRADE DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <div className="w-full space-y-5">
          {/* Grade Metrics Banner */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs uppercase font-bold text-slate-500">Grade {gradeData.grade} Learners</div>
              <div className="text-3xl font-black text-slate-900 font-display mt-1">
                {gradeMetrics.total}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {gradeMetrics.male} Boys • {gradeMetrics.female} Girls
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs uppercase font-bold text-slate-500">Grade Average Score</div>
              <div className="text-3xl font-black text-sky-600 font-display mt-1">
                {gradeMetrics.avg.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                DepEd Standard: ≥ 75.0%
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs uppercase font-bold text-slate-500">Mastery Level (≥85%)</div>
              <div className="text-3xl font-black text-emerald-600 font-display mt-1">
                {gradeMetrics.mastery}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {gradeMetrics.total > 0 ? ((gradeMetrics.mastery / gradeMetrics.total) * 100).toFixed(0) : 0}% of class
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs uppercase font-bold text-slate-500">Needs IMIP Intervention</div>
              <div className="text-3xl font-black text-rose-600 font-display mt-1">
                {gradeMetrics.intervention}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Scored &lt; 75% in numeracy
              </div>
            </div>
          </div>

          {/* Worksheet Performance Chart */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-display">
                  Average Score per Worksheet (WS 1 - WS {gradeData.totalWorksheets})
                </h3>
                <p className="text-xs text-slate-500">
                  Identify specific numeracy competency worksheets needing remedial reinforcement
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-sky-500 rounded-xs" />
                  <span className="text-slate-600 font-medium">Class Avg %</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-rose-500 inline-block border-b-2 border-dashed border-rose-500" />
                  <span className="text-slate-600 font-medium">75% Target</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={worksheetPerformanceData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="ws"
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#475569', fontSize: 11 }}
                    tickFormatter={val => `${val}%`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Class Average']}
                    labelFormatter={label => `${label} - Grade ${gradeData.grade}`}
                  />
                  <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" />
                  <Bar dataKey="average" radius={[4, 4, 0, 0]} fill="#0284c7">
                    {worksheetPerformanceData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.average >= 75 ? '#0284c7' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Students Needing IMIP Quick List */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base font-display flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Learners Requiring IMIP Action Plan (Grade {gradeData.grade})
            </h3>
            {learnersWithStats.filter(l => l.stats.status === 'Needs Intervention').length === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>All learners in Grade {gradeData.grade} currently meet or exceed the 75% numeracy threshold!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {learnersWithStats
                  .filter(l => l.stats.status === 'Needs Intervention')
                  .map(learner => (
                    <div
                      key={learner.id}
                      className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{learner.name}</div>
                        <div className="text-xs text-rose-700 font-semibold mt-0.5">
                          Score: {learner.stats.percentage.toFixed(1)}% ({learner.stats.completedCount} completed)
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenIMIP(learner)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print IMIP
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT LEARNER MODAL */}
      {isAddLearnerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="font-bold text-slate-900 text-base font-display">
                {editingLearner ? `Edit Learner: ${editingLearner.name}` : `Add New Learner (Grade ${gradeData.grade})`}
              </h3>
              <button
                onClick={() => setIsAddLearnerOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLearner} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Learner Reference Number (LRN - 12 digits):
                </label>
                <input
                  type="text"
                  placeholder="e.g. 136589260101"
                  value={learnerForm.lrn}
                  onChange={e => setLearnerForm({ ...learnerForm, lrn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name (Last Name, First Name M.I.): *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Santos, Juanito M."
                  value={learnerForm.name}
                  onChange={e => setLearnerForm({ ...learnerForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender: *</label>
                  <select
                    value={learnerForm.gender}
                    onChange={e =>
                      setLearnerForm({
                        ...learnerForm,
                        gender: e.target.value as 'Male' | 'Female'
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section: *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mabini, Rizal..."
                    value={learnerForm.section}
                    onChange={e => setLearnerForm({ ...learnerForm, section: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ARAL Teacher's Name: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Elena Santos"
                  value={learnerForm.aralTeacher}
                  onChange={e => setLearnerForm({ ...learnerForm, aralTeacher: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  The ARAL Teacher's name encoded here will flash directly on this learner's printable Individual Mathematics Intervention Plan (IMIP).
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observations / Teacher Notes:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Requires manipulatives for addition facts"
                  value={learnerForm.remarks}
                  onChange={e => setLearnerForm({ ...learnerForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddLearnerOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  {editingLearner ? 'Save Changes' : 'Add Learner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK IMPORT LEARNERS */}
      {bulkInputOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="font-bold text-slate-900 text-base font-display">
                Bulk Add Learners to Grade {gradeData.grade}
              </h3>
              <button
                onClick={() => setBulkInputOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Paste a list of student names below (one per line). Format can be "Lastname, Firstname" or "Lastname, Firstname, Male/Female".
            </p>

            <textarea
              rows={8}
              placeholder={`Dela Cruz, Juan M., Male\nSantos, Maria Elena, Female\nBautista, Angelo R., Male`}
              value={bulkNamesText}
              onChange={e => setBulkNamesText(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setBulkInputOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkAdd}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
              >
                Import Names
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT TOTAL WORKSHEETS FOR THIS GRADE */}
      {isWorksheetConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="font-bold text-slate-900 text-base font-display">
                Configure Grade {gradeData.grade} Worksheets
              </h3>
              <button
                onClick={() => setIsWorksheetConfigOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Total Number of ARAL Worksheets for Grade {gradeData.grade}:
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={newTotalWs}
                  onChange={e => setNewTotalWs(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm font-bold font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Default: Grade 1 (29), Grade 2 (36), Grade 3 (24), Grade 4 (34), Grade 5 (32), Grade 6 (35).
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Teacher:</label>
                <input
                  type="text"
                  value={gradeData.teacherName}
                  onChange={e =>
                    onUpdateGradeData({ ...gradeData, teacherName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">School Head / Principal:</label>
                <input
                  type="text"
                  value={gradeData.schoolHead}
                  onChange={e =>
                    onUpdateGradeData({ ...gradeData, schoolHead: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setIsWorksheetConfigOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTotalWorksheets}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
              >
                Save Worksheet Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
