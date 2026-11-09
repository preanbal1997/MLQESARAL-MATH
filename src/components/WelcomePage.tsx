import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  BookOpen,
  Calculator,
  Award,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  School,
  CheckCircle2,
  Users
} from 'lucide-react';

interface WelcomePageProps {
  onUnlock: (teacherEmail?: string) => void;
  defaultEmail?: string | null;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onUnlock,
  defaultEmail
}) => {
  const [password, setPassword] = useState('');
  const [teacherEmail, setTeacherEmail] = useState(defaultEmail || 'preanbal1997@gmail.com');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const REQUIRED_PASSWORD = '136644mlqesaralmath';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const inputClean = password.trim();

    // Check password strictly (also allow case-insensitive match for mobile keyboards)
    if (inputClean.toLowerCase() === REQUIRED_PASSWORD.toLowerCase()) {
      sessionStorage.setItem('mlqes_site_unlocked', 'true');
      if (teacherEmail.trim()) {
        localStorage.setItem('mlqes_user_email', teacherEmail.trim());
      }
      onUnlock(teacherEmail.trim() || undefined);
    } else {
      setIsSubmitting(false);
      setError('Incorrect access password. Please enter the valid MLQES ARAL Math password.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-sky-50 via-emerald-50/40 to-slate-100 flex flex-col justify-between font-sans selection:bg-amber-300 selection:text-slate-900">
      {/* Top DepEd Banner Ribbon */}
      <div className="w-full bg-sky-900 text-white px-4 py-2 border-b-2 border-amber-400">
        <div className="w-full flex flex-wrap items-center justify-between text-xs font-medium gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
              Official Portal
            </span>
            <span>Department of Education • National Capital Region • Division of Caloocan City</span>
          </div>
          <div className="flex items-center gap-2 text-sky-200">
            <span>S.Y. 2026 - 2027</span>
            <span>•</span>
            <span className="text-amber-300 font-bold">ARAL Math Program</span>
          </div>
        </div>
      </div>

      {/* Main Welcome Container */}
      <div className="w-full flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Left Brand Panel */}
          <div className="w-full lg:w-5/12 bg-gradient-to-br from-sky-600 via-sky-700 to-emerald-700 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Background watermark */}
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
              <Calculator className="w-64 h-64 text-white" />
            </div>

            <div className="relative z-10">
              {/* School Logo */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-white p-1.5 shadow-lg border-2 border-amber-300 shrink-0">
                  <img
                    src="/assets/aistudio/Untitled_design__2__40f193e5.png"
                    alt="Manuel L. Quezon Elementary School Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-amber-300 font-black text-xs uppercase tracking-wider block">
                    DepEd Caloocan
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight font-display text-white">
                    MANUEL L. QUEZON ELEMENTARY SCHOOL
                  </h3>
                  <span className="text-xs text-sky-200">School ID: 136644</span>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 rounded-full font-black text-xs uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  ARAL Program Math
                </div>
                <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white leading-tight">
                  MLQES ARAL MATH MONITORING SITE
                </h1>
                <p className="text-xs sm:text-sm text-sky-100 font-normal mt-2 leading-relaxed">
                  Academic Recovery and Accessible Learning Program for Grades 1 to 6.
                  Tracking learner progress, scores, and Individual Mathematics Intervention Plans (IMIP).
                </p>
              </div>
            </div>

            {/* Key Stage Badges */}
            <div className="relative z-10 pt-6 mt-6 border-t border-white/15 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/15">
                <div className="font-bold text-amber-300 text-xs">Key Stage 1</div>
                <div className="text-[11px] text-sky-100">Grades 1, 2, and 3</div>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/15">
                <div className="font-bold text-emerald-300 text-xs">Key Stage 2</div>
                <div className="text-[11px] text-sky-100">Grades 4, 5, and 6</div>
              </div>
            </div>
          </div>

          {/* Right Login / Password Form Panel */}
          <div className="w-full lg:w-7/12 p-8 sm:p-12 flex flex-col justify-center bg-white">
            <div className="max-w-md mx-auto w-full">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                    Teacher Portal Access
                  </h2>
                  <p className="text-xs text-slate-500">
                    Enter the authorized password to access the monitoring site
                  </p>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-shake">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Access Denied:</span> {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Teacher Email / Name */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Teacher's Email / Name
                  </label>
                  <input
                    type="text"
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    placeholder="e.g. preanbal1997@gmail.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-medium text-slate-800"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    This will identify your encoder account and reflect on student records.
                  </span>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Site Access Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoFocus
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Enter website password..."
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono transition-all text-slate-900 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Unlock Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !password.trim()}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-sky-600 via-sky-500 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Unlock className="w-4 h-4 text-amber-300" />
                  <span>Enter ARAL Math Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Security notice */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Protected DepEd ARAL Portal</span>
                </div>
                <span>S.Y. 2026 - 2027</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-3 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        MANUEL L. QUEZON ELEMENTARY SCHOOL • ARAL Math Monitoring Site • Caloocan City
      </footer>
    </div>
  );
};
