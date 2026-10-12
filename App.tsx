import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/ClientsPage';
import VisitsPage from './pages/VisitsPage';
import PropertiesPage from './pages/PropertiesPage';
import ProfilePage from './pages/ProfilePage';
import EmiCalculator from './pages/EmiCalculator';
import AdminPanel from './pages/AdminPanel';
// AuthPage import removed
import { Client, Property, SiteVisit, UserProfile, CustomRole, ResourceType, ResourceAction, UserRole } from './types';
import AddClientModal from './components/AddClientModal';
import AddPropertyModal from './components/AddPropertyModal';
import BookVisitModal from './components/BookVisitModal';
import { supabase } from './lib/supabase';
import { userFromDb, updateUser } from './lib/users';
import AuthPage from './pages/AuthPage';
import type { Session } from '@supabase/supabase-js';

const AccessScreen: React.FC<{ user: UserProfile; onSignOut: () => void; onRefresh: () => void }> = ({ user, onSignOut, onRefresh }) => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
    <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl text-center space-y-5">
      <h2 className="text-xl font-black text-slate-800 dark:text-white">
        {user.approvalStatus === 'Pending' ? 'Waiting for approval' : 'Access disabled'}
      </h2>
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
        {user.approvalStatus === 'Pending'
          ? `Signed in as ${user.email}. An admin needs to approve your account before you can use Estate Flow.`
          : `The account ${user.email} is ${user.approvalStatus.toLowerCase()}. Contact your admin.`}
      </p>
      <div className="flex gap-3">
        <button onClick={onRefresh} className="flex-1 py-3 btn-3d btn-3d-indigo text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Check again</button>
        <button onClick={onSignOut} className="flex-1 py-3 btn-3d btn-3d-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Sign out</button>
      </div>
    </div>
  </div>
);

const SuccessPopup: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-6">
    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl max-w-sm w-full text-center space-y-6 animate-slide-up">
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
        <i className="fas fa-check-circle text-4xl"></i>
      </div>
      <div>
        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Confirmed!</h3>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed uppercase tracking-widest">{message}</p>
      </div>
      <button onClick={onClose} className="w-full py-4 btn-3d btn-3d-indigo text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100">Continue</button>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isBookVisitOpen, setIsBookVisitOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [fullUserRegistry, setFullUserRegistry] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // Loads (or creates) the profile row for the signed-in user.
  const loadProfile = async (sess: Session | null) => {
    if (!sess) { setCurrentUser(null); return; }
    const uid = sess.user.id;
    let { data, error } = await supabase.from('users').select('*').eq('id', uid).maybeSingle();
    if (!data && !error) {
      // First sign-in: create a pending profile; an admin approves it.
      const meta = sess.user.user_metadata || {};
      const res = await supabase.from('users').insert([{
        id: uid,
        email: sess.user.email,
        name: meta.name || sess.user.email,
        role: 'role_agent',
        approval_status: 'Pending',
        join_date: new Date().toISOString(),
      }]).select().single();
      data = res.data; error = res.error;
    }
    if (error) {
      console.error('Profile load failed:', error);
      alert(`Could not load your profile: ${error.message}`);
      setCurrentUser(null);
      return;
    }
    setCurrentUser(userFromDb(data));
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      if (event === 'PASSWORD_RECOVERY') {
        const pw = window.prompt('Enter a new password (min 6 characters):');
        if (pw) supabase.auth.updateUser({ password: pw }).then(({ error }) => alert(error ? error.message : 'Password updated.'));
      }
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // defer to avoid calling Supabase inside the auth callback
        setTimeout(() => loadProfile(sess), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const isApproved = currentUser?.approvalStatus === 'Approved';

  const checkPermission = useCallback((resource: ResourceType, action: ResourceAction = 'Read') => {
    if (!currentUser) return false;
    if (currentUser.role === 'role_super_admin' || currentUser.role === 'role_admin') return true;
    
    // Logic to check permissions based on custom roles from localStorage or context
    const customRoles = JSON.parse(localStorage.getItem('ef_custom_roles') || '[]');
    const userRoleDef = customRoles.find((r: any) => r.id === currentUser.role);
    
    if (userRoleDef) {
      return userRoleDef.permissions?.[resource]?.[action] || false;
    }
    
    // Fallback for default 'role_agent' if not in custom roles (though it should be)
    if (currentUser.role === 'role_agent') {
       const isSales = ['Leads', 'Properties', 'Site Visits', 'WhatsApp'].includes(resource);
       return isSales && action !== 'Delete';
    }

    return false;
  }, [currentUser]);

  const fetchData = async () => {
    if (!currentUser || currentUser.approvalStatus !== 'Approved') return;
    try {
      const [clientsRes, propertiesRes, visitsRes, usersRes] = await Promise.all([
        supabase.from('clients').select('*').order('createdAt', { ascending: false }),
        supabase.from('properties').select('*').order('id', { ascending: false }),
        supabase.from('site_visits').select('*').order('scheduledAt', { ascending: false }),
        supabase.from('users').select('*')
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (propertiesRes.data) setProperties(propertiesRes.data);
      if (visitsRes.data) setVisits(visitsRes.data);
      if (usersRes.data) setFullUserRegistry(usersRes.data.map(userFromDb));
      const firstError = [clientsRes, propertiesRes, visitsRes, usersRes].find(r => r.error)?.error;
      if (firstError) console.error('Error fetching data:', firstError);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (isApproved) {
      fetchData();
    }
  }, [currentUser?.id, isApproved]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setClients([]); setProperties([]); setVisits([]); setFullUserRegistry([]);
    navigate('/');
  };

  // Saves to Supabase first; only shows success if the database accepted it.
  // On failure, shows the real error and reloads data so the screen matches the DB.
  const saveToDb = async (table: string, rows: any[], okMessage: string) => {
    const { error } = await supabase.from(table).upsert(rows);
    if (error) {
      console.error(`Save to ${table} failed:`, error);
      alert(`Could not save to database: ${error.message}`);
      await fetchData();
      return false;
    }
    setSuccessMessage(okMessage);
    return true;
  };

  const handleAddVisit = async (newVisit: SiteVisit) => {
    setVisits(prev => [newVisit, ...prev]);
    await saveToDb('site_visits', [newVisit], 'Visit scheduled successfully.');
  };

  const handleUpdateVisit = async (updatedVisit: SiteVisit) => {
    setVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
    await saveToDb('site_visits', [updatedVisit], 'Visit record updated.');
  };

  const handleAddClient = async (newClient: Client) => {
    setIsAddClientOpen(false);
    setClients(prev => {
      const exists = prev.find(c => c.id === newClient.id);
      return exists ? prev.map(c => c.id === newClient.id ? newClient : c) : [newClient, ...prev];
    });
    // interactions (call logs) are saved in the clients.interactions column
    await saveToDb('clients', [{ ...newClient, interactions: newClient.interactions || [] }], 'Client profile saved.');
  };

  const handleSaveProperty = async (property: Property) => {
    setIsAddPropertyOpen(false);
    setEditingProperty(undefined);
    setProperties(prev => {
      const exists = prev.find(p => p.id === property.id);
      return exists ? prev.map(p => p.id === property.id ? property : p) : [property, ...prev];
    });
    await saveToDb('properties', [property], 'Property details updated successfully.');
  };

  const handleBulkImport = async (type: 'Clients' | 'Properties' | 'Visits', data: any[]) => {
    if (!data.length) return;
    const table = type === 'Clients' ? 'clients' : type === 'Properties' ? 'properties' : 'site_visits';
    const ok = await saveToDb(table, data, `${data.length} ${type.toLowerCase()} imported.`);
    if (ok) await fetchData();
  };

  const handleHeaderAdd = () => {
    if (location.pathname === '/clients') {
      setIsAddClientOpen(true);
    } else if (location.pathname === '/properties') {
      setEditingProperty(undefined);
      setIsAddPropertyOpen(true);
    } else if (location.pathname === '/visits') {
      setIsBookVisitOpen(true);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Flow...</p>
      </div>
    </div>
  );

  if (!session) return <AuthPage />;
  if (!currentUser) return (
    <div className="flex items-center justify-center min-h-screen">
      <button onClick={handleSignOut} className="text-xs font-bold text-indigo-600">Could not load profile — sign out</button>
    </div>
  );
  if (!isApproved) return <AccessScreen user={currentUser} onSignOut={handleSignOut} onRefresh={() => loadProfile(session)} />;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-900 transition-colors duration-300">
      <Header 
        searchQuery={searchQuery} onSearchChange={setSearchQuery} onAddClick={handleHeaderAdd}
        theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
        role={currentUser?.role} checkPermission={checkPermission}
        onFilterClick={() => {}}
      />
      <main className="flex-grow pt-32 pb-28 px-4 max-w-7xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Dashboard clients={clients} properties={properties} visits={visits} />} />
          <Route path="/clients" element={<ClientsPage clients={clients} visits={visits} properties={properties} searchQuery={searchQuery} onAddClient={() => setIsAddClientOpen(true)} onUpdateClient={handleAddClient} onAddVisit={handleAddVisit} checkPermission={checkPermission} />} />
          <Route path="/visits" element={<VisitsPage visits={visits} searchQuery={searchQuery} onUpdateVisit={handleUpdateVisit} onAddVisit={handleAddVisit} onManualAddClick={() => setIsBookVisitOpen(true)} clients={clients} properties={properties} onUpdateClient={handleAddClient} checkPermission={checkPermission} />} />
          <Route path="/properties" element={<PropertiesPage properties={properties} clients={clients} searchQuery={searchQuery} onAddProperty={() => { setEditingProperty(undefined); setIsAddPropertyOpen(true); }} onEditProperty={(p) => { setEditingProperty(p); setIsAddPropertyOpen(true); }} onAddVisit={handleAddVisit} checkPermission={checkPermission} />} />
          <Route path="/profile" element={<ProfilePage clients={clients} properties={properties} visits={visits} allUsers={fullUserRegistry} checkPermission={checkPermission} userRole={currentUser?.role} currentUser={currentUser} onSignOut={handleSignOut} />} />
          <Route path="/emi" element={<EmiCalculator />} />
          <Route path="/admin" element={<AdminPanel userRole={currentUser?.role || ''} clients={clients} properties={properties} visits={visits} allUsers={fullUserRegistry} currentUserId={currentUser.id} onUsersChanged={fetchData} pendingUsers={fullUserRegistry.filter(u => u.approvalStatus === 'Pending')} onBulkImport={handleBulkImport} onApproveUser={async (id, status, role) => { if (await updateUser(id, { approvalStatus: status, ...(role ? { role } : {}) })) await fetchData(); }} checkPermission={checkPermission} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer role={currentUser?.role} checkPermission={checkPermission} />
      
      {isAddClientOpen && <AddClientModal onClose={() => setIsAddClientOpen(false)} onSubmit={handleAddClient} />}
      
      {isAddPropertyOpen && (
        <AddPropertyModal 
          initialData={editingProperty} 
          onClose={() => { setIsAddPropertyOpen(false); setEditingProperty(undefined); }} 
          onSubmit={handleSaveProperty} 
        />
      )}

      {isBookVisitOpen && (
        <BookVisitModal 
          clients={clients}
          properties={properties}
          onClose={() => setIsBookVisitOpen(false)} 
          onSubmit={(v) => { handleAddVisit(v); setIsBookVisitOpen(false); }}
        />
      )}
      
      {successMessage && <SuccessPopup message={successMessage} onClose={() => setSuccessMessage(null)} />}
    </div>
  );
};

const App: React.FC = () => <HashRouter><AppContent /></HashRouter>;
export default App;