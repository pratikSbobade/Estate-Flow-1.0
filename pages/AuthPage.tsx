
import React, { useState } from 'react';
import { supabase, mapProfile } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Allow anyone to sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || 'New User',
              role: email.toLowerCase() === 'admin@ef.com' ? 'role_super_admin' : 'role_agent'
            },
          },
        });

        if (signUpError) throw signUpError;
        
        if (signUpData.user) {
          // Create profile in 'users' table if it doesn't exist
          const { error: profileCreateError } = await supabase
            .from('users')
            .upsert({
              id: signUpData.user.id,
              name: name || 'New User',
              email: email,
              role: email.toLowerCase() === 'admin@ef.com' ? 'role_super_admin' : 'role_agent',
              approval_status: email.toLowerCase() === 'admin@ef.com' ? 'Approved' : 'Pending',
              created_at: new Date().toISOString(),
              join_date: new Date().toISOString()
            });
          
          if (profileCreateError) console.error("Profile creation error:", profileCreateError);
        }

        setError('Account created. Please check your email for verification (if enabled), then sign in.');
        setIsSignUp(false);
      } else {
        // Login Logic
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        // Fetch user profile from public schema
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError || !profile) {
           // If profile is missing but auth succeeded, create a default profile
           const defaultProfile = {
             id: authData.user.id,
             name: authData.user.user_metadata?.name || 'User',
             email: authData.user.email || email,
             role: authData.user.user_metadata?.role || 'role_agent',
             approval_status: email.toLowerCase() === 'admin@ef.com' ? 'Approved' : 'Pending'
           };

           const { error: createError } = await supabase
             .from('users')
             .insert([{
               id: defaultProfile.id,
               name: defaultProfile.name,
               email: defaultProfile.email,
               role: defaultProfile.role,
               approval_status: defaultProfile.approval_status,
               created_at: new Date().toISOString(),
               join_date: new Date().toISOString()
             }]);

           if (!createError || email.toLowerCase() === 'admin@ef.com') {
             onLoginSuccess(mapProfile(defaultProfile));
             return;
           }
           
           throw new Error('Profile not found and could not be created. Contact administrator.');
        }

        if (profile.approval_status === 'Deactivated') {
          await supabase.auth.signOut();
          throw new Error('Account deactivated. Please contact administrator.');
        } else if (profile.approval_status === 'Pending') {
          await supabase.auth.signOut();
          throw new Error('Account pending approval. Please wait for an administrator to approve your access.');
        } else if (profile.approval_status === 'Rejected') {
          await supabase.auth.signOut();
          throw new Error('Account access rejected. Please contact administrator.');
        } else {
          onLoginSuccess(mapProfile(profile));
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
           <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <i className="fas fa-home-alt text-white text-2xl"></i>
           </div>
           <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Estate Flow</h1>
           <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
             {isSignUp ? 'User Registration' : 'Secure CRM Terminal'}
           </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={`p-4 rounded-2xl text-[10px] font-bold uppercase tracking-tight flex items-center gap-3 ${error.includes('created') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                <i className="fas fa-info-circle"></i>
                {error}
              </div>
            )}

            <div className="space-y-4">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-600" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-600" />
              </div>
            </div>

            <button disabled={loading} className="w-full py-5 btn-3d btn-3d-indigo text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-50">
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Enter Terminal')}
            </button>
          </form>

          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-8 text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">
            {isSignUp ? 'Return to login' : 'New User? Create an Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
