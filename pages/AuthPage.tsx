
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [region, setRegion] = useState('Nagpur South');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        // 1. Authenticate with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        // 2. Fetch extended profile from public.users
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError || !profile) {
          throw new Error('Profile not found. Please contact support.');
        }

        // 3. Check Approval Status
        if (profile.approval_status === 'Pending') {
          setIsPending(true);
        } else if (profile.approval_status === 'Deactivated') {
          await supabase.auth.signOut();
          throw new Error('This account has been deactivated.');
        } else {
          onLoginSuccess({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            approvalStatus: profile.approval_status,
            region: profile.region
          });
        }
      } else {
        // SIGN UP LOGIC
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('Sign up failed');

        // Create the public user profile
        const { error: profileCreateError } = await supabase
          .from('users')
          .insert([
            { 
              id: signUpData.user.id, 
              name, 
              email, 
              region, 
              role: 'role_agent', 
              approval_status: 'Pending' 
            }
          ]);

        if (profileCreateError) throw profileCreateError;
        
        setIsPending(true);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[3rem] p-10 text-center shadow-2xl space-y-6 animate-slide-up border border-slate-100 dark:border-slate-700">
           <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <i className="fas fa-user-clock text-3xl"></i>
           </div>
           <div className="space-y-2">
             <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Access Pending</h2>
             <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-widest">
               Your account is created. Access is restricted until a Super Admin approves your profile. Please check back later.
             </p>
           </div>
           <button 
             onClick={() => { setIsPending(false); setMode('login'); }}
             className="w-full py-4 btn-3d btn-3d-indigo text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
           >
             Return to Login
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center space-y-2">
           <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-xl shadow-indigo-200 dark:shadow-none mb-6">
              <i className="fas fa-home-alt text-white text-2xl"></i>
           </div>
           <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Estate Flow</h1>
           <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Corporate CRM Authentication</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-700 transition-colors">
          <form onSubmit={handleAction} className="space-y-6">
            <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-100 dark:border-slate-700">
              <button type="button" onClick={() => setMode('login')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Sign In</button>
              <button type="button" onClick={() => setMode('register')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'register' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Join Team</button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl flex items-center gap-3 animate-shake">
                 <i className="fas fa-shield-alt text-red-500 text-sm"></i>
                 <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-tight leading-tight">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity</label>
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-colors" />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                <div className="relative">
                  <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@estateflow.com" className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
                <div className="relative">
                  <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 btn-3d btn-3d-indigo text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 dark:shadow-none transition-all mt-4 disabled:opacity-50"
            >
              {loading ? <i className="fas fa-circle-notch animate-spin mr-2"></i> : null}
              {mode === 'login' ? 'Authenticate' : 'Submit Registration'}
            </button>
          </form>
        </div>

        {/* Development Helper */}
        <div className="text-center space-y-4">
           <div className="p-4 bg-indigo-50/50 dark:bg-slate-900/50 rounded-2xl border border-indigo-100/50 dark:border-slate-800">
             <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Development Tip</p>
             <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
               Sign up a new account, then use the Supabase Dashboard to change your <code className="text-indigo-600 bg-white dark:bg-slate-800 px-1 rounded">approval_status</code> to 'Approved' in the <code className="text-indigo-600">users</code> table.
             </p>
           </div>
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
             Cloud Secure Access • <span className="text-indigo-600 cursor-pointer hover:underline">Support</span>
           </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
