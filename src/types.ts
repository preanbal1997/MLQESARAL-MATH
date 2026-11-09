export type GradeLevel = '1' | '2' | '3' | '4' | '5' | '6';

export type Gender = 'Male' | 'Female';

export interface ScoreValue {
  score: number;
  totalItems: number;
}

export interface Learner {
  id: string;
  lrn: string;
  name: string;
  gender: Gender;
  section: string;
  remarks?: string;
  scores: Record<number, ScoreValue>;
}

export interface WorksheetConfig {
  number: number;
  title: string;
  defaultTotalItems: number;
}

export interface GradeData {
  grade: GradeLevel;
  totalWorksheets: number;
  worksheetConfigs: WorksheetConfig[];
  learners: Learner[];
  teacherName: string;
  schoolHead: string;
  sectionDefault: string;
}

export type SchoolData = Record<GradeLevel, GradeData>;

export interface GoogleSheetsSyncConfig {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  autoSync: boolean;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
}

export interface LearnerSummary {
  learner: Learner;
  totalScore: number;
  totalItems: number;
  percentage: number;
  completedWorksheets: number;
  totalWorksheets: number;
  status: 'Mastery' | 'Progressing' | 'Needs Intervention' | 'No Data';
}

export interface GradeSummary {
  grade: GradeLevel;
  totalLearners: number;
  maleCount: number;
  femaleCount: number;
  averagePercentage: number;
  totalWorksheets: number;
  masteryCount: number;
  progressingCount: number;
  interventionCount: number;
}
