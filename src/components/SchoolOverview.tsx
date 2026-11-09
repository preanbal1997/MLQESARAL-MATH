import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import {
  Users,
  Award,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  FileSpreadsheet,
  Download,
  School,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import type { SchoolData, GradeLevel } from '../types';
import { computeLearnerStats, exportToCSV } from '../services/googleSheets';

interface SchoolOverviewProps {
  schoolData: SchoolData;
  onSelectGrade: (grade: GradeLevel) => void;
  onOpenSyncModal: () => void;
}

export const SchoolOverview: React.FC<SchoolOverviewProps> = ({
  schoolData,
  onSelectGrade,
  onOpenSyncModal
}) => {
  const grades: GradeLevel[] = ['1', '2', '3', '4', '5', '6'];

  // Aggregate stats across all grades
  let totalLearners = 0;
  let totalMale = 0;
  let totalFemale = 0;
  let totalWorksheetsAll = 0;
  let totalMastery = 0;
  let totalProgressing = 0;
  let totalIntervention = 0;
  let schoolSumScore = 0;
  let schoolSumItems = 0;

  const gradeStatsList = grades.map(g => {
    const gData = schoolData[g];
    totalLearners += gData.learners.length;
    totalWorksheetsAll += gData.totalWorksheets;

    let gradeSumScore = 0;
    let gradeSumItems = 0;
    let gMastery = 0;
    let gProgressing = 0;
    let gIntervention = 0;
    let gMale = 0;
    let gFemale = 0;

    gData.learners.forEach(l => {
      if (l.gender === 'Male') {
        totalMale++;
        gMale++;
      } else {
        totalFemale++;
        gFemale++;
      }

      const st = computeLearnerStats(l, gData);
      gradeSumScore += st.totalScore;
      gradeSumItems += st.totalItems;

      if (st.completedCount > 0) {
        if (st.status === 'Mastery') {
          totalMastery++;
          gMastery++;
        } else if (st.status === 'Progressing') {
          totalProgressing++;
          gProgressing++;
        } else if (st.status === 'Needs Intervention') {
          totalIntervention++;
          gIntervention++;
        }
      }
    });

    schoolSumScore += gradeSumScore;
    schoolSumItems += gradeSumItems;

    const avgPct = gradeSumItems > 0 ? (gradeSumScore / gradeSumItems) * 100 : 0;

    return {
      grade: g,
      gradeLabel: `Grade ${g}`,
      average: Number(avgPct.toFixed(1)),
      learners: gData.learners.length,
      male: gMale,
      female: gFemale,
      worksheets: gData.totalWorksheets,
      teacher: gData.teacherName,
      mastery: gMastery,
      progressing: gProgressing,
      intervention: gIntervention
    };
  });

  const overallSchoolAverage =
    schoolSumItems > 0 ? (schoolSumScore / schoolSumItems) * 100 : 0;

  const barColors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'];

  const distributionData = [
    { name: 'Mastery (≥85%)', value: totalMastery, color: '#10b981' },
    { name: 'Progressing (75-84%)', value: totalProgressing, color: '#3b82f6' },
    { name: 'Needs Intervention (<75%)', value: totalIntervention, color: '#ef4444' }
  ];

  const handleExportSummaryCSV = () => {
    const rows: (string | number)[][] = [
      ['MANUEL L. QUEZON ELEMENTARY SCHOOL'],
      ['ARAL MATH MONITORING - CONSOLIDATED SCHOOL OVERVIEW REPORT S.Y. 2026-2027'],
      ['Date Exported:', new Date().toLocaleString()],
      [],
      ['Grade Level', 'Worksheets', 'Learners', 'Male', 'Female', 'Average %', 'Mastery', 'Progressing', 'Needs Intervention']
    ];

    gradeStatsList.forEach(g => {
      rows.push([
        g.gradeLabel,
        g.worksheets,
        g.learners,
        g.male,
        g.female,
        `${g.average}%`,
        g.mastery,
        g.progressing,
        g.intervention
      ]);
    });

    rows.push([]);
    rows.push(['SCHOOL TOTAL', totalWorksheetsAll, totalLearners, totalMale, totalFemale, `${overallSchoolAverage.toFixed(2)}%`, totalMastery, totalProgressing, totalIntervention]);

    exportToCSV(`MLQES_ARAL_Math_School_Overview_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="w-full space-y-6">
      {/* Welcome Banner */}
      <div className="w-full bg-gradient-to-r from-sky-500 via-sky-600 to-emerald-600 rounded-2xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none translate-x-8 translate-y-8">
          <BookOpen className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 rounded-full font-black text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              School-Wide ARAL Math Overview
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
              Manuel L. Quezon Elementary School
            </h2>
            <p className="text-sky-100 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
              Academic Recovery and Accessible Learning (ARAL) Program Math Monitoring Dashboard.
              Tracking Key Stage 1 & 2 learners from Grade 1 to Grade 6 with automated scoring,
              intervention planning, and real-time Google Sheets synchronization.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={handleExportSummaryCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/30 cursor-pointer transition-all shadow-xs"
            >
              <Download className="w-4 h-4" />
              Export Overview CSV
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Metric Cards */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Learners */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Total Learners</span>
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              {totalLearners}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {totalMale} Boys • {totalFemale} Girls
            </div>
          </div>
        </div>

        {/* School Math Average */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">School Math Avg</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-display">
              {overallSchoolAverage.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              DepEd Target: ≥ 75.0%
            </div>
          </div>
        </div>

        {/* Total Worksheets */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">ARAL Worksheets</span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-amber-600 font-display">
              {totalWorksheetsAll}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across Grades 1 - 6
            </div>
          </div>
        </div>

        {/* Mastery Tier */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Mastery Tier</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-display">
              {totalMastery}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Scored ≥ 85.0%
            </div>
          </div>
        </div>

        {/* Progressing Tier */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Progressing</span>
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-blue-600 font-display">
              {totalProgressing}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Scored 75.0% - 84.9%
            </div>
          </div>
        </div>

        {/* Needs Intervention */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Intervention</span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-rose-600 font-display">
              {totalIntervention}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Scored &lt; 75.0% (IMIP)
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Bar Chart: Comparison of average scores across all grades */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-600" />
                Comparison of Average Scores Across All Grades
              </h3>
              <p className="text-xs text-slate-500">
                Grade 1 to Grade 6 Average Percentage Performance in ARAL Math Worksheets
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-500 rounded-xs" />
                <span className="text-slate-600 font-medium">Grade Average %</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-rose-500 inline-block border-b-2 border-dashed border-rose-500" />
                <span className="text-slate-600 font-medium">75% Target Standard</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={gradeStatsList}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="gradeLabel"
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#475569', fontSize: 11 }}
                  tickFormatter={val => `${val}%`}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'Average Score']}
                  labelFormatter={(label) => `${label} - MLQES ARAL Math`}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <ReferenceLine
                  y={75}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: '75% DepEd Standard',
                    position: 'top',
                    fill: '#dc2626',
                    fontSize: 11,
                    fontWeight: 700
                  }}
                />
                <Bar
                  dataKey="average"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={55}
                >
                  {gradeStatsList.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={barColors[index % barColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              School Numeracy Mastery Tiers
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              Proportion of learners according to DepEd ARAL proficiency categories
            </p>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} Learners`, 'Count']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-emerald-50 p-1.5 rounded-lg">
              <div className="font-extrabold text-emerald-700">{totalMastery}</div>
              <div className="text-[10px] text-slate-500 font-medium">Mastery</div>
            </div>
            <div className="bg-blue-50 p-1.5 rounded-lg">
              <div className="font-extrabold text-blue-700">{totalProgressing}</div>
              <div className="text-[10px] text-slate-500 font-medium">Progressing</div>
            </div>
            <div className="bg-rose-50 p-1.5 rounded-lg">
              <div className="font-extrabold text-rose-700">{totalIntervention}</div>
              <div className="text-[10px] text-slate-500 font-medium">Intervention</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Breakdown Full-Width Table */}
      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <School className="w-5 h-5 text-emerald-600" />
              Grade Level ARAL Math Implementation Status
            </h3>
            <p className="text-xs text-slate-500">
              Detailed metrics per grade level. Click any grade to view its dashboard, learners, and score submission table.
            </p>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Grade Level</th>
                <th className="py-3 px-4 text-center">Worksheets</th>
                <th className="py-3 px-4 text-center">Enrolled</th>
                <th className="py-3 px-4 text-center">Boys / Girls</th>
                <th className="py-3 px-4 text-center">Average %</th>
                <th className="py-3 px-4 text-center">Mastery / Needs IMIP</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gradeStatsList.map((g, idx) => (
                <tr
                  key={g.grade}
                  className="hover:bg-sky-50/50 transition-colors cursor-pointer group"
                  onClick={() => onSelectGrade(g.grade)}
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: barColors[idx % barColors.length] }}
                    />
                    <span className="text-sm font-display">{g.gradeLabel}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2.5 py-1 bg-slate-100 rounded-lg font-mono font-bold text-slate-800 text-xs">
                      {g.worksheets} WS
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {g.learners}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-500 font-mono text-xs">
                    {g.male}M / {g.female}F
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full font-bold font-mono text-xs ${
                        g.average >= 85
                          ? 'bg-emerald-100 text-emerald-800'
                          : g.average >= 75
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {g.average}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-emerald-700 font-bold">{g.mastery}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-rose-600 font-bold">{g.intervention}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGrade(g.grade);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white font-bold rounded-lg text-xs transition-all"
                    >
                      <span>Open Grade {g.grade}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
