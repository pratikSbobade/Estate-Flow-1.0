import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const inputCls =
  'w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white outline-none focus:border-indigo-600 transition-all';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice('Account created. Check your email to confirm, then sign in. An admin must approve you before you get access.');
          setMode('signin');
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
        setNotice('Password reset email sent.');
        setMode('signin');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <form onSubmit={submit} className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Estate Flow</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </p>
        </div>

        {mode === 'signup' && (
          <input className={inputCls} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
        )}
        <input className={inputCls} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        {mode !== 'reset' && (
          <input className={inputCls} type="password" placeholder="Password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
        )}

        {error && <p className="text-xs font-bold text-red-500">{error}</p>}
        {notice && <p className="text-xs font-bold text-emerald-600">{notice}</p>}

        <button disabled={busy} className="w-full py-4 btn-3d btn-3d-indigo text-white rounded-2xl font-black text-[11px] uppercase tracking-widest disabled:opacity-60">
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
        </button>

        <div className="flex justify-between text-[11px] font-bold text-indigo-600">
          {mode === 'signin' ? (
            <>
              <button type="button" onClick={() => setMode('signup')}>Create account</button>
              <button type="button" onClick={() => setMode('reset')}>Forgot password?</button>
            </>
          ) : (
            <button type="button" onClick={() => setMode('signin')}>Back to sign in</button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AuthPage;
