import { collection, doc, onSnapshot, setDoc, getFirestore, type Unsubscribe } from 'firebase/firestore';
import { app } from './firebase';
import type { GradeData, GradeLevel, SchoolData } from '../types';
import { createEmptySchoolData } from '../utils/storage';

export const AUTHORIZED_TEACHER_EMAIL = 'preanbal1997@gmail.com';
const db = getFirestore(app);
const gradesCollection = collection(db, 'schools', 'mlqes_aral_math', 'grades');
const GRADES: GradeLevel[] = ['1','2','3','4','5','6'];

export function watchSchoolData(onData: (data: SchoolData) => void, onError: (error: Error) => void): Unsubscribe {
  let initialized = false;
  return onSnapshot(gradesCollection, async snapshot => {
    const data = createEmptySchoolData();
    const found = new Set<GradeLevel>();
    snapshot.docs.forEach(item => {
      const grade = item.id.replace('grade_', '') as GradeLevel;
      if (GRADES.includes(grade)) {
        found.add(grade);
        const value = item.data() as Partial<GradeData>;
        data[grade] = { ...data[grade], ...value, grade, learners: Array.isArray(value.learners) ? value.learners : [] };
      }
    });
    onData(data);
    if (!initialized) {
      initialized = true;
      await Promise.all(GRADES.filter(g => !found.has(g)).map(g =>
        setDoc(doc(db, 'schools', 'mlqes_aral_math', 'grades', 'grade_' + g), data[g])
      ));
    }
  }, onError);
}
export async function saveGradeToFirestore(grade: GradeLevel, data: GradeData): Promise<void> {
  await setDoc(doc(db, 'schools', 'mlqes_aral_math', 'grades', 'grade_' + grade), data);
}
