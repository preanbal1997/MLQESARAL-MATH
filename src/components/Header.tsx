import React from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Award,
  Sparkles,
  School,
  Calculator
} from 'lucide-react';
import type { GoogleSheetsSyncConfig } from '../types';

interface HeaderProps {
  syncConfig: GoogleSheetsSyncConfig;
  onOpenSheetsModal: () => void;
  onSyncNow: () => void;
  isSyncing: boolean;
  totalSchoolLearners: number;
  schoolAveragePct: number;
  userEmail?: string | null;
  onSignInGoogle: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  syncConfig,
  onOpenSheetsModal,
  onSyncNow,
  isSyncing,
  totalSchoolLearners,
  schoolAveragePct,
  userEmail,
  onSignInGoogle,
  onSignOut
}) => {
  return (
    <header className="no-print w-full bg-gradient-to-r from-sky-600 via-sky-500 to-emerald-600 text-white shadow-lg border-b-4 border-amber-400">
      {/* Top Banner Ribbon */}
      <div className="w-full bg-sky-900/40 border-b border-white/10 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="bg-amber-400 text-slate-900 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
            DepEd ARAL
          </span>
          <span className="text-sky-100 font-medium">
            Academic Recovery and Accessible Learning Program • National Capital Region • Division of Caloocan City
          </span>
        </div>

        <div className="flex items-center gap-4 text-sky-100">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold">School Year:</span>
            <span className="bg-white/15 px-2 py-0.5 rounded font-mono font-bold text-amber-300">
              2026 - 2027
            </span>
          </div>
          {userEmail ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-emerald-200 font-medium flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Teacher: <strong className="text-white">{userEmail}</strong></span>
              </span>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="text-[10px] text-sky-200 hover:text-amber-300 underline cursor-pointer"
                  title="Switch or Sign Out"
                >
                  (Switch)
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onSignInGoogle}
              className="hover:underline text-[11px] text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer bg-white/10 px-2.5 py-1 rounded-lg border border-white/20"
            >
              Sign in with Email
            </button>
          )}
        </div>
      </div>

      {/* Main Header Full-Width */}
      <div className="w-full px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* School & ARAL Logo Branding */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Logo badge */}
          <div className="relative group shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 shadow-md border-2 border-amber-400 overflow-hidden flex items-center justify-center">
              <img
                src="/assets/aistudio/Untitled_design__2__40f193e5.png"
                alt="Manuel L. Quezon Elementary School Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full border border-white uppercase shadow-sm">
              MATH
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white font-display">
                MLQES ARAL MATH MONITORING SITE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-sky-100 font-medium flex items-center gap-2 mt-0.5">
              <span>MANUEL L. QUEZON ELEMENTARY SCHOOL</span>
              <span className="hidden sm:inline text-white/40">•</span>
              <span className="hidden sm:inline text-amber-300 font-semibold">Key Stage 1 & 2 Numeracy Mastery</span>
            </p>
          </div>
        </div>

        {/* Real-Time Sync & Stats Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Quick Metrics Pills */}
          <div className="flex items-center gap-2 bg-sky-950/30 backdrop-blur-xs border border-white/15 px-3 py-1.5 rounded-xl">
            <div className="text-right">
              <div className="text-[10px] text-sky-200 uppercase font-bold">Total Learners</div>
              <div className="text-base font-black text-amber-300">{totalSchoolLearners}</div>
            </div>
            <div className="h-6 w-px bg-white/20 mx-1" />
            <div className="text-right">
              <div className="text-[10px] text-sky-200 uppercase font-bold">School Avg</div>
              <div className="text-base font-black text-emerald-300">{schoolAveragePct.toFixed(1)}%</div>
            </div>
          </div>

          {/* Google Sheets Sync Status Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSheetsModal}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all border ${
                syncConfig.spreadsheetId
                  ? 'bg-emerald-500/90 hover:bg-emerald-500 border-emerald-300 text-white'
                  : 'bg-white/15 hover:bg-white/25 border-white/30 text-white'
              }`}
              title="Google Sheets Data Synchronization"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              <span>
                {syncConfig.spreadsheetId ? 'Google Sheets Synced' : 'Sync Google Sheet'}
              </span>
              {syncConfig.spreadsheetId && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            {syncConfig.spreadsheetId && (
              <button
                onClick={onSyncNow}
                disabled={isSyncing}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/20 cursor-pointer transition-all"
                title="Sync Changes to Google Sheet Now"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
