import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  PlusCircle,
  Download,
  Link2,
  ShieldCheck,
  Check,
  Sparkles
} from 'lucide-react';
import type { SchoolData, GoogleSheetsSyncConfig } from '../types';
import { createARALSpreadsheet, syncAllDataToSpreadsheet, exportToCSV } from '../services/googleSheets';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolData: SchoolData;
  syncConfig: GoogleSheetsSyncConfig;
  onUpdateSyncConfig: (config: GoogleSheetsSyncConfig) => void;
  accessToken: string | null;
  onSignInGoogle: () => void | Promise<void>;
  userEmail?: string | null;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  schoolData,
  syncConfig,
  onUpdateSyncConfig,
  accessToken,
  onSignInGoogle,
  userEmail
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [customSheetId, setCustomSheetId] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!isOpen) return null;

  const handleCreateSheet = async () => {
    if (!accessToken) {
      setErrorMsg('Please sign in with Google first.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const result = await createARALSpreadsheet(accessToken, schoolData);
      const updated: GoogleSheetsSyncConfig = {
        ...syncConfig,
        spreadsheetId: result.spreadsheetId,
        spreadsheetUrl: result.spreadsheetUrl,
        lastSyncedAt: new Date().toISOString(),
        status: 'synced',
        errorMessage: undefined
      };
      onUpdateSyncConfig(updated);
      setSuccessMsg('Successfully created and synchronized new Google Sheet with all 6 Grade levels!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create Google Spreadsheet. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncNow = async () => {
    if (!accessToken) {
      setErrorMsg('Please sign in with Google first.');
      return;
    }
    if (!syncConfig.spreadsheetId) {
      setErrorMsg('No Google Sheet connected. Please create or link a sheet first.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      await syncAllDataToSpreadsheet(accessToken, syncConfig.spreadsheetId, schoolData);
      const updated: GoogleSheetsSyncConfig = {
        ...syncConfig,
        lastSyncedAt: new Date().toISOString(),
        status: 'synced',
        errorMessage: undefined
      };
      onUpdateSyncConfig(updated);
      setSuccessMsg('All learner scores and worksheet updates have been synced to Google Sheets in real time!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to sync to Google Sheets. Check permissions.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectExisting = () => {
    if (!customSheetId.trim()) return;
    let extractedId = customSheetId.trim();
    // Check if user pasted a full URL
    const match = extractedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      extractedId = match[1];
    }

    const updated: GoogleSheetsSyncConfig = {
      ...syncConfig,
      spreadsheetId: extractedId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${extractedId}/edit`,
      status: 'idle',
      errorMessage: undefined
    };
    onUpdateSyncConfig(updated);
    setShowCustomInput(false);
    setSuccessMsg('Connected to spreadsheet! Click "Sync Data Now" to update it.');
  };

  const handleExportAllCSV = () => {
    const grades = ['1', '2', '3', '4', '5', '6'] as const;
    const rows: (string | number)[][] = [
      ['MANUEL L. QUEZON ELEMENTARY SCHOOL - ARAL MATH MONITORING S.Y. 2026-2027'],
      ['Exported on:', new Date().toLocaleString()],
      [],
      ['Grade', 'LRN', 'Learner Name', 'Gender', 'Section', 'Total Score', 'Total Items', 'Overall %', 'Status', 'Teacher Remarks']
    ];

    grades.forEach(g => {
      const gData = schoolData[g];
      gData.learners.forEach(l => {
        let totalScore = 0;
        let totalItems = 0;
        Object.values(l.scores).forEach(sc => {
          totalScore += sc.score;
          totalItems += sc.totalItems;
        });
        const pct = totalItems > 0 ? ((totalScore / totalItems) * 100).toFixed(2) : '0';
        rows.push([
          `Grade ${g}`,
          l.lrn,
          l.name,
          l.gender,
          l.section || gData.sectionDefault,
          totalScore,
          totalItems,
          `${pct}%`,
          Number(pct) >= 85 ? 'Mastery' : Number(pct) >= 75 ? 'Progressing' : 'Needs Intervention',
          l.remarks || ''
        ]);
      });
    });

    exportToCSV(`MLQES_ARAL_Math_All_Grades_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight font-display">Google Sheets Data Synchronization</h3>
              <p className="text-xs text-emerald-100">
                Real-time cloud sync for Manuel L. Quezon Elementary School ARAL Math
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Account Status */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${accessToken ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <div>
                <div className="text-sm font-bold text-slate-800">
                  {accessToken ? 'Google Workspace Connected' : 'Google Workspace Not Signed In'}
                </div>
                <div className="text-xs text-slate-500">
                  {accessToken
                    ? userEmail
                      ? `Signed in as ${userEmail}`
                      : 'Authorized with Sheets & Drive access'
                    : 'Connect your Google account to create and sync sheets in real time'}
                </div>
              </div>
            </div>

            {!accessToken ? (
              <button
                onClick={onSignInGoogle}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Sign in with Google
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ready to Sync
              </span>
            )}
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Connected Sheet Details */}
          {syncConfig.spreadsheetId ? (
            <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h4 className="font-bold text-slate-800 text-sm">
                      Connected Google Spreadsheet
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-mono break-all">
                    ID: {syncConfig.spreadsheetId}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Last Synced:{' '}
                    {syncConfig.lastSyncedAt
                      ? new Date(syncConfig.lastSyncedAt).toLocaleString()
                      : 'Not synced yet'}
                  </p>
                </div>
                {syncConfig.spreadsheetUrl && (
                  <a
                    href={syncConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    Open Sheet
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-200/60">
                <button
                  onClick={handleSyncNow}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  {isProcessing ? 'Syncing Real-Time Data...' : 'Sync All Grades Now'}
                </button>

                <button
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Change Connected Sheet ID
                </button>
              </div>
            </div>
          ) : (
            /* Not connected yet */
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="font-bold text-slate-800 text-base">No Google Spreadsheet Connected</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Create a new Google Sheet to synchronize Manuel L. Quezon Elementary School's ARAL Math records, student names, and scores in real time.
                </p>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
                <button
                  onClick={handleCreateSheet}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md text-xs cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  {isProcessing ? 'Creating Sheet...' : 'Create Official MLQES ARAL Sheet'}
                </button>

                <button
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-xs text-xs cursor-pointer transition-all"
                >
                  <Link2 className="w-4 h-4 text-slate-500" />
                  Link Existing Sheet ID
                </button>
              </div>
            </div>
          )}

          {/* Link custom ID accordion */}
          {showCustomInput && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Paste Google Sheet URL or Spreadsheet ID:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  value={customSheetId}
                  onChange={e => setCustomSheetId(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <button
                  onClick={handleConnectExisting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  Connect
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Make sure the signed-in Google account has Editor access to the spreadsheet.
              </p>
            </div>
          )}

          {/* Offline backup fallback */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Offline Backup / Excel Export</span>
              <span className="text-[11px] text-slate-500">Download consolidated CSV containing all Grades 1-6 records</span>
            </div>
            <button
              onClick={handleExportAllCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
