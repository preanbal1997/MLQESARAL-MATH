import React, { useState } from 'react';
import { Mail, User, X, Check, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string | null;
  onSignInWithEmail: (email: string, teacherName?: string) => void;
  onGooglePopupSignIn: () => Promise<void>;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
  onSignInWithEmail,
  onGooglePopupSignIn
}) => {
  const [email, setEmail] = useState(currentEmail || 'preanbal1997@gmail.com');
  const [teacherName, setTeacherName] = useState('');
  const [isPopupLoading, setIsPopupLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg(null);
    onSignInWithEmail(email.trim(), teacherName.trim());
    onClose();
  };

  const handlePopup = async () => {
    try {
      setIsPopupLoading(true);
      setErrorMsg(null);
      await onGooglePopupSignIn();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to sign in via Google popup. You can sign in using your email above.');
    } finally {
      setIsPopupLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-emerald-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-display">Teacher Sign In</h3>
              <p className="text-xs text-sky-100">Manuel L. Quezon Elementary School • ARAL Math</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmitEmail} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Enter Your Email Address: *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. teacher@deped.gov.ph or your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-xs bg-slate-50 focus:bg-white"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Use your DepEd or personal Google email to record scores and synchronize data.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Teacher Name (Optional):
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Maria Elena Santos"
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-800 text-xs bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-xs transition-colors"
            >
              <span>Sign In with Email</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Alternative Google OAuth Popup */}
          <div className="pt-3 border-t border-slate-200">
            <div className="text-center text-[11px] text-slate-500 mb-2">
              or connect with Google account popup for cloud Drive access
            </div>
            <button
              type="button"
              onClick={handlePopup}
              disabled={isPopupLoading}
              className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-2xs flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isPopupLoading ? 'Opening Google Sign-In...' : 'Google Account Popup'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
