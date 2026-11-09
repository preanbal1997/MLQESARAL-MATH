import type { SchoolData, GradeLevel, GradeData, Learner, WorksheetConfig, GoogleSheetsSyncConfig } from '../types';

export const DEFAULT_WORKSHEET_COUNTS: Record<GradeLevel, number> = {
  '1': 29,
  '2': 36,
  '3': 24,
  '4': 34,
  '5': 32,
  '6': 35
};

const GRADE_DEFAULTS: Record<GradeLevel, { teacher: string; section: string; defaultItems: number }> = {
  '1': { teacher: 'Maria Elena Santos', section: 'Mabini', defaultItems: 25 },
  '2': { teacher: 'Rowena V. Bautista', section: 'Rizal', defaultItems: 25 },
  '3': { teacher: 'Corazon A. Mendoza', section: 'Bonifacio', defaultItems: 30 },
  '4': { teacher: 'Danilo P. Reyes', section: 'Luna', defaultItems: 30 },
  '5': { teacher: 'Lilibeth G. Ramos', section: 'Del Pilar', defaultItems: 30 },
  '6': { teacher: 'Jonathan S. Cruz', section: 'Aquino', defaultItems: 35 }
};

const INITIAL_LEARNERS_BY_GRADE: Record<GradeLevel, Omit<Learner, 'scores'>[]> = {
  '1': [
    { id: 'g1-1', lrn: '136589260101', name: 'Alcantara, Gabriel M.', gender: 'Male', section: 'Mabini', remarks: 'Good in counting, needs help with subtraction' },
    { id: 'g1-2', lrn: '136589260102', name: 'Bernardo, Sophia Mae R.', gender: 'Female', section: 'Mabini', remarks: 'Active participant' },
    { id: 'g1-3', lrn: '136589260103', name: 'Castillo, Ethan James D.', gender: 'Male', section: 'Mabini', remarks: 'Intervention on number bonds' },
    { id: 'g1-4', lrn: '136589260104', name: 'De Leon, Chloe Nicole S.', gender: 'Female', section: 'Mabini', remarks: 'Mastered addition facts' },
    { id: 'g1-5', lrn: '136589260105', name: 'Evangelista, Liam Noah T.', gender: 'Male', section: 'Mabini', remarks: 'Needs visual counters' },
    { id: 'g1-6', lrn: '136589260106', name: 'Flores, Andrea Beatrice C.', gender: 'Female', section: 'Mabini', remarks: 'Consistently completes worksheets' },
    { id: 'g1-7', lrn: '136589260107', name: 'Garcia, Mateo Luis V.', gender: 'Male', section: 'Mabini', remarks: 'Requires guided practice' },
    { id: 'g1-8', lrn: '136589260108', name: 'Hernandez, Samantha Joy P.', gender: 'Female', section: 'Mabini', remarks: 'High numeracy aptitude' }
  ],
  '2': [
    { id: 'g2-1', lrn: '136589250201', name: 'Aquino, Joshua Caleb B.', gender: 'Male', section: 'Rizal', remarks: 'Needs regrouping assistance' },
    { id: 'g2-2', lrn: '136589250202', name: 'Bautista, Alyssa Jane M.', gender: 'Female', section: 'Rizal', remarks: 'Fast learner in 2-digit addition' },
    { id: 'g2-3', lrn: '136589250203', name: 'Cruz, Dominic Elijah G.', gender: 'Male', section: 'Rizal', remarks: 'Improves with manipulative blocks' },
    { id: 'g2-4', lrn: '136589250204', name: 'Dizon, Angela Grace L.', gender: 'Female', section: 'Rizal', remarks: 'Consistent high achiever' },
    { id: 'g2-5', lrn: '136589250205', name: 'Enriquez, Rafael Miguel K.', gender: 'Male', section: 'Rizal', remarks: 'Frequent absences, catch-up needed' },
    { id: 'g2-6', lrn: '136589250206', name: 'Ferrer, Princess Dianne O.', gender: 'Female', section: 'Rizal', remarks: 'Excels in skip counting' }
  ],
  '3': [
    { id: 'g3-1', lrn: '136589240301', name: 'Abad, Kyle Vincent C.', gender: 'Male', section: 'Bonifacio', remarks: 'Mastered multiplication tables 2-5' },
    { id: 'g3-2', lrn: '136589240302', name: 'Balagtas, Mikaela Rose T.', gender: 'Female', section: 'Bonifacio', remarks: 'Needs drill on division concepts' },
    { id: 'g3-3', lrn: '136589240303', name: 'Custodio, Angelo Mark E.', gender: 'Male', section: 'Bonifacio', remarks: 'Struggling with multi-step word problems' },
    { id: 'g3-4', lrn: '136589240304', name: 'Dela Cruz, Patricia Ann H.', gender: 'Female', section: 'Bonifacio', remarks: 'Peer mentor in ARAL group' },
    { id: 'g3-5', lrn: '136589240305', name: 'Espiritu, Sean Patrick R.', gender: 'Male', section: 'Bonifacio', remarks: 'Shows steady weekly improvement' },
    { id: 'g3-6', lrn: '136589240306', name: 'Gonzales, Hailey Denise M.', gender: 'Female', section: 'Bonifacio', remarks: 'Consistent 90%+ average' }
  ],
  '4': [
    { id: 'g4-1', lrn: '136589230401', name: 'Agustin, Jeric Daniel V.', gender: 'Male', section: 'Luna', remarks: 'Needs review on long division' },
    { id: 'g4-2', lrn: '136589230402', name: 'Beltran, Camille Joy N.', gender: 'Female', section: 'Luna', remarks: 'Good grasp of factors and multiples' },
    { id: 'g4-3', lrn: '136589230403', name: 'Castro, Christian Dave Q.', gender: 'Male', section: 'Luna', remarks: 'Intervention on fractions' },
    { id: 'g4-4', lrn: '136589230404', name: 'Domingo, Erika Louise F.', gender: 'Female', section: 'Luna', remarks: 'Top scorer in fraction worksheets' },
    { id: 'g4-5', lrn: '136589230405', name: 'Esteban, Mark Anthony G.', gender: 'Male', section: 'Luna', remarks: 'Remediation on perimeter & area' }
  ],
  '5': [
    { id: 'g5-1', lrn: '136589220501', name: 'Alvarez, Justin Drake B.', gender: 'Male', section: 'Del Pilar', remarks: 'Mastered decimals and percentages' },
    { id: 'g5-2', lrn: '136589220502', name: 'Briones, Jasmine Kate P.', gender: 'Female', section: 'Del Pilar', remarks: 'Struggling with ratio and proportion' },
    { id: 'g5-3', lrn: '136589220503', name: 'Corpuz, Adrian Carl S.', gender: 'Male', section: 'Del Pilar', remarks: 'Great progress in geometric shapes' },
    { id: 'g5-4', lrn: '136589220504', name: 'David, Kimberly Anne M.', gender: 'Female', section: 'Del Pilar', remarks: 'Consistent problem solver' },
    { id: 'g5-5', lrn: '136589220505', name: 'Faustino, Prince John L.', gender: 'Male', section: 'Del Pilar', remarks: 'Needs reinforcement on volume formulas' }
  ],
  '6': [
    { id: 'g6-1', lrn: '136589210601', name: 'Arcega, Nathan Miguel D.', gender: 'Male', section: 'Aquino', remarks: 'Ready for high school transition' },
    { id: 'g6-2', lrn: '136589210602', name: 'Buenaventura, Christine M.', gender: 'Female', section: 'Aquino', remarks: 'Needs intensive drill in integers and algebra' },
    { id: 'g6-3', lrn: '136589210603', name: 'Cabrera, Kenneth Ross A.', gender: 'Male', section: 'Aquino', remarks: 'Excellent in rate, speed and proportion' },
    { id: 'g6-4', lrn: '136589210604', name: 'Dionisio, Stephanie Nicole Z.', gender: 'Female', section: 'Aquino', remarks: 'Mastered ARAL Math competencies' },
    { id: 'g6-5', lrn: '136589210605', name: 'Enriquez, Vince Lawrence T.', gender: 'Male', section: 'Aquino', remarks: 'Progressing well in surface area calculations' }
  ]
};

// Generate realistic initial scores for sample learners
function generateInitialScores(totalWs: number, defaultItems: number, learnerIndex: number): Record<number, { score: number; totalItems: number }> {
  const scores: Record<number, { score: number; totalItems: number }> = {};
  // Fill the first 8-12 completed worksheets to show active progress
  const completedCount = Math.min(totalWs, 8 + (learnerIndex % 5));

  for (let w = 1; w <= completedCount; w++) {
    const totalItems = defaultItems;
    // Vary scores based on learner profile
    let score: number;
    if (learnerIndex % 3 === 0) {
      // High performer (85% - 100%)
      const minScore = Math.floor(totalItems * 0.85);
      score = minScore + Math.floor(Math.random() * (totalItems - minScore + 1));
    } else if (learnerIndex % 3 === 1) {
      // Average performer (75% - 84%)
      const minScore = Math.floor(totalItems * 0.72);
      const maxScore = Math.floor(totalItems * 0.84);
      score = minScore + Math.floor(Math.random() * (maxScore - minScore + 1));
    } else {
      // Needs intervention (< 75%)
      const minScore = Math.floor(totalItems * 0.50);
      const maxScore = Math.floor(totalItems * 0.72);
      score = minScore + Math.floor(Math.random() * (maxScore - minScore + 1));
    }
    scores[w] = { score: Math.min(score, totalItems), totalItems };
  }

  return scores;
}

export function createDefaultSchoolData(): SchoolData {
  const grades: GradeLevel[] = ['1', '2', '3', '4', '5', '6'];
  const schoolData: Partial<SchoolData> = {};

  for (const g of grades) {
    const totalWs = DEFAULT_WORKSHEET_COUNTS[g];
    const { teacher, section, defaultItems } = GRADE_DEFAULTS[g];

    const worksheetConfigs: WorksheetConfig[] = [];
    for (let w = 1; w <= totalWs; w++) {
      worksheetConfigs.push({
        number: w,
        title: `Worksheet ${w}`,
        defaultTotalItems: defaultItems
      });
    }

    const rawLearners = INITIAL_LEARNERS_BY_GRADE[g] || [];
    const learners: Learner[] = rawLearners.map((raw, idx) => ({
      ...raw,
      aralTeacher: teacher,
      scores: generateInitialScores(totalWs, defaultItems, idx)
    }));

    schoolData[g] = {
      grade: g,
      totalWorksheets: totalWs,
      worksheetConfigs,
      learners,
      teacherName: teacher,
      schoolHead: 'Dr. Ferdinand S. Santos (Principal IV)',
      sectionDefault: section
    };
  }

  return schoolData as SchoolData;
}

// Fresh installations start with an empty learner register; never migrate demo/local records.
export function createEmptySchoolData(): SchoolData {
  const data = createDefaultSchoolData();
  (Object.keys(data) as GradeLevel[]).forEach(grade => { data[grade] = { ...data[grade], learners: [] }; });
  return data;
}
const STORAGE_KEY = 'mlqes_aral_math_data_v1';
const SHEETS_CONFIG_KEY = 'mlqes_aral_sheets_config_v1';

export function loadSchoolData(): SchoolData {
  // Learner records are now sourced exclusively from Firestore.
  return createEmptySchoolData();
}

export function saveSchoolData(data: SchoolData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving school data to localStorage:', e);
  }
}

export function loadGoogleSheetsConfig(): GoogleSheetsSyncConfig {
  try {
    const stored = localStorage.getItem(SHEETS_CONFIG_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading sheets config:', e);
  }

  return {
    spreadsheetId: null,
    spreadsheetUrl: null,
    lastSyncedAt: null,
    autoSync: true,
    status: 'idle'
  };
}

export function saveGoogleSheetsConfig(config: GoogleSheetsSyncConfig): void {
  try {
    localStorage.setItem(SHEETS_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving sheets config:', e);
  }
}
