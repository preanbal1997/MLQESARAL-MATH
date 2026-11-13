/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import type { SchoolData, GradeLevel, GradeData, Learner, GoogleSheetsSyncConfig } from './types';
import {
  loadSchoolData,
  saveSchoolData,
  createEmptySchoolData,
  loadGoogleSheetsConfig,
  saveGoogleSheetsConfig
} from './utils/storage';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { SchoolOverview } from './components/SchoolOverview';
import { GradeView } from './components/GradeView';
import { IMIPModal } from './components/IMIPModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { SignInModal } from './components/SignInModal';
import { WelcomePage } from './components/WelcomePage';
import { initAuth, googleSignIn, getAccessToken, logout } from './services/firebase';
import { syncAllDataToSpreadsheet } from './services/googleSheets';
import { watchSchoolData, saveGradeToFirestore, AUTHORIZED_TEACHER_EMAIL } from './services/firestore';

export default function App() {
  // Password protection: Teacher will not access the site unless they encode 136644mlqesaralmath
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('mlqes_site_unlocked') === 'true';
  });

  const [schoolData, setSchoolData] = useState<SchoolData>(createEmptySchoolData);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudMessage, setCloudMessage] = useState('Sign in with the authorized Google account to enable cloud sync.');
  const [currentTab, setCurrentTab] = useState<'overview' | GradeLevel>('overview');

  // Google Workspace / Sheets sync state
  const [syncConfig, setSyncConfig] = useState<GoogleSheetsSyncConfig>(loadGoogleSheetsConfig);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // This must reflect Firebase Authentication only, never a remembered email typed into the welcome form.
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Selected learner for IMIP printing modal
  const [selectedLearnerForIMIP, setSelectedLearnerForIMIP] = useState<{
    learner: Learner;
    gradeData: GradeData;
  } | null>(null);

  // Debounced auto-sync timer ref
  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Firestore is the source of truth; legacy browser records are not migrated.
  useEffect(() => {
    let stopWatching: (() => void) | undefined;
    const unsubscribe = initAuth((user, token) => {
      setAccessToken(token || null);
      const email = (user.email || '').toLowerCase();
      setUserEmail(user.email || null);
      if (email !== AUTHORIZED_TEACHER_EMAIL) {
        setCloudReady(false);
        setCloudMessage('Access denied. Sign in using preanbal1997@gmail.com.');
        stopWatching?.();
        return;
      }
      setCloudMessage('Connecting to the shared school database…');
      stopWatching?.();
      stopWatching = watchSchoolData(data => {
        setSchoolData(data);
        saveSchoolData(data);
        setCloudReady(true);
        setCloudMessage('Connected — changes sync across devices automatically.');
      }, error => {
        console.error('Firestore connection failed:', error);
        setCloudReady(false);
        setCloudMessage('Cloud connection failed. Check Firestore rules and sign-in, then reload.');
      });
    }, () => {
      stopWatching?.();
      stopWatching = undefined;
      setCloudReady(false);
      setAccessToken(null);
      setCloudMessage('Sign in with preanbal1997@gmail.com to connect to the shared database.');
    });
    return () => { stopWatching?.(); unsubscribe?.(); };
  }, []);

  // Save to localStorage whenever schoolData changes
  const handleUpdateSchoolData = (updated: SchoolData) => {
    setSchoolData(updated);
    saveSchoolData(updated);
    if (cloudReady) {
      const changed = (Object.keys(updated) as GradeLevel[]).find(g => updated[g] !== schoolData[g]);
      if (changed) saveGradeToFirestore(changed, updated[changed]).catch(error => {
        console.error('Firestore save failed:', error);
        setCloudMessage('Save failed. The latest change is not in the shared database yet.');
      });
    }

    // Auto-sync to connected Google Sheet if configured and authorized
    if (syncConfig.spreadsheetId && syncConfig.autoSync && accessToken) {
      if (autoSyncTimerRef.current) {
        clearTimeout(autoSyncTimerRef.current);
      }
      autoSyncTimerRef.current = setTimeout(async () => {
        try {
          setIsSyncing(true);
          await syncAllDataToSpreadsheet(accessToken, syncConfig.spreadsheetId!, updated);
          const newConfig: GoogleSheetsSyncConfig = {
            ...syncConfig,
            lastSyncedAt: new Date().toISOString(),
            status: 'synced',
            errorMessage: undefined
          };
          setSyncConfig(newConfig);
          saveGoogleSheetsConfig(newConfig);
        } catch (e: any) {
          console.error('Auto-sync to Google Sheets failed:', e);
        } finally {
          setIsSyncing(false);
        }
      }, 2500); // 2.5s debounce
    }
  };

  const handleUpdateGradeData = (gradeLevel: GradeLevel, updatedGradeData: GradeData) => {
    if (!cloudReady) { window.alert('Please sign in with preanbal1997@gmail.com before editing learner records.'); return; }
    const updated: SchoolData = {
      ...schoolData,
      [gradeLevel]: updatedGradeData
    };
    handleUpdateSchoolData(updated);
  };

  const handleManualSyncNow = async () => {
    if (!accessToken) {
      setIsSheetsModalOpen(true);
      return;
    }
    if (!syncConfig.spreadsheetId) {
      setIsSheetsModalOpen(true);
      return;
    }

    try {
      setIsSyncing(true);
      await syncAllDataToSpreadsheet(accessToken, syncConfig.spreadsheetId, schoolData);
      const newConfig: GoogleSheetsSyncConfig = {
        ...syncConfig,
        lastSyncedAt: new Date().toISOString(),
        status: 'synced',
        errorMessage: undefined
      };
      setSyncConfig(newConfig);
      saveGoogleSheetsConfig(newConfig);
    } catch (err: any) {
      console.error('Manual sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignInWithEmail = (_email: string, _teacherName?: string) => {
    // Typing an email is not authentication. Firestore access requires a real Google sign-in.
    setCloudMessage('Email entry alone cannot authorize cloud access. Please use Google Account Popup.');
    setIsSignInModalOpen(true);
  };

  const handleUnlock = (email?: string) => {
    setIsUnlocked(true);
    sessionStorage.setItem('mlqes_site_unlocked', 'true');
    // Welcome-page email is a profile field, not a Firebase-authenticated identity.
  };

  const handleLockSite = () => {
    sessionStorage.removeItem('mlqes_site_unlocked');
    setIsUnlocked(false);
  };

  const handleSignOut = async () => {
    setUserEmail(null);
    localStorage.removeItem('mlqes_user_email');
    await logout().catch(() => {});
  };

  const handleSignInGoogle = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setAccessToken(res.accessToken);
        const email = (res.user.email || '').toLowerCase();
        if (email !== AUTHORIZED_TEACHER_EMAIL) {
          await logout();
          setUserEmail(null);
          setAccessToken(null);
          setCloudMessage('Access denied. Please choose preanbal1997@gmail.com in the Google account popup.');
          throw new Error('Only preanbal1997@gmail.com is authorized to edit learner records.');
        }
        setUserEmail(res.user.email);
        localStorage.setItem('mlqes_user_email', res.user.email || '');
      }
    } catch (e) {
      console.error('Sign-in failed:', e);
    }
  };

  // If site is locked, render the Welcome Home Page first
  if (!isUnlocked) {
    return (
      <WelcomePage
        onUnlock={handleUnlock}
        defaultEmail={AUTHORIZED_TEACHER_EMAIL}
      />
    );
  }

  // Calculate overall school statistics for the Header
  const totalSchoolLearners = Object.values(schoolData).reduce(
    (acc, g) => acc + g.learners.length,
    0
  );

  let totalScoreAll = 0;
  let totalItemsAll = 0;
  Object.values(schoolData).forEach(gData => {
    gData.learners.forEach(l => {
      Object.values(l.scores).forEach(sc => {
        if (typeof sc.score === 'number' && sc.totalItems > 0) {
          totalScoreAll += sc.score;
          totalItemsAll += sc.totalItems;
        }
      });
    });
  });
  const schoolAveragePct = totalItemsAll > 0 ? (totalScoreAll / totalItemsAll) * 100 : 0;

  return (
    <div className={`w-full ${selectedLearnerForIMIP ? 'min-h-screen print:min-h-0' : 'min-h-screen'} bg-slate-100/70 flex flex-col font-sans`}>
      {/* DepEd ARAL Top Header (Full Width) */}
      <Header
        syncConfig={syncConfig}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onSyncNow={handleManualSyncNow}
        isSyncing={isSyncing}
        totalSchoolLearners={totalSchoolLearners}
        schoolAveragePct={schoolAveragePct}
        userEmail={userEmail}
        onSignInGoogle={() => setIsSignInModalOpen(true)}
        onSignOut={handleSignOut}
        onLockSite={handleLockSite}
      />

      <div className={`no-print ${cloudReady ? 'px-4 py-2 text-xs bg-emerald-50 text-emerald-800 border-b border-emerald-100' : 'px-4 py-2 text-xs bg-amber-50 text-amber-800 border-b border-amber-100'}`}>{cloudMessage}</div>

      {/* Main Top Navigation (School Overview + Grade 1 to 6 tabs) */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        schoolData={schoolData}
      />

      {/* Main Content Area (FULL-WIDTH, NO MAX-WIDTH CONSTRAINTS) */}
      <main className={`w-full flex-1 px-3 sm:px-6 py-5 ${selectedLearnerForIMIP ? 'no-print' : ''}`}>
        {currentTab === 'overview' ? (
          <SchoolOverview
            schoolData={schoolData}
            onSelectGrade={(g) => setCurrentTab(g)}
            onOpenSyncModal={() => setIsSheetsModalOpen(true)}
          />
        ) : (
          <GradeView
            key={currentTab}
            gradeData={schoolData[currentTab]}
            onUpdateGradeData={(updated) => handleUpdateGradeData(currentTab, updated)}
            onOpenIMIP={(learner) =>
              setSelectedLearnerForIMIP({
                learner,
                gradeData: schoolData[currentTab]
              })
            }
            onOpenSyncModal={() => setIsSheetsModalOpen(true)}
          />
        )}
      </main>

      {/* Individual Mathematics Intervention Plan (IMIP) Modal (A4 Print-Ready) */}
      {selectedLearnerForIMIP && (
        <IMIPModal
          learner={selectedLearnerForIMIP.learner}
          gradeData={selectedLearnerForIMIP.gradeData}
          onClose={() => setSelectedLearnerForIMIP(null)}
        />
      )}

      {/* Google Sheets Synchronization Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        schoolData={schoolData}
        syncConfig={syncConfig}
        onUpdateSyncConfig={(cfg) => {
          setSyncConfig(cfg);
          saveGoogleSheetsConfig(cfg);
        }}
        accessToken={accessToken}
        onSignInGoogle={() => setIsSignInModalOpen(true)}
        userEmail={userEmail}
      />

      {/* Teacher Email Sign-In Modal */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        currentEmail={userEmail}
        onSignInWithEmail={handleSignInWithEmail}
        onGooglePopupSignIn={handleSignInGoogle}
      />

      {/* Subtle School Footer */}
      <footer className="no-print w-full py-4 px-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-700">MLQES ARAL MATH MONITORING SITE</strong> • Manuel L. Quezon Elementary School, S.Y. 2026-2027
          </div>
          <div className="text-[11px] text-slate-400">
            DepEd Academic Recovery and Accessible Learning (ARAL) Program • Key Stage 1 & 2
          </div>
        </div>
      </footer>
    </div>
  );
}
