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
import AuthPage from './pages/AuthPage';
import { Client, Property, SiteVisit, UserProfile, CustomRole, ResourceType, ResourceAction } from './types';
import AddClientModal from './components/AddClientModal';
import AddPropertyModal from './components/AddPropertyModal';
import BookVisitModal from './components/BookVisitModal';
import { supabase } from './lib/supabase';

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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>({
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Admin User',
    email: 'admin@ef.com',
    role: 'role_super_admin',
    approvalStatus: 'Approved'
  });
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

  // Check for active session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profile && profile.approval_status !== 'Deactivated') {
             setCurrentUser({
               id: profile.id,
               name: profile.name,
               email: profile.email,
               role: profile.role,
               approvalStatus: profile.approval_status,
               region: profile.region,
               mobile: profile.mobile,
               whatsapp: profile.whatsapp,
               reraId: profile.rera_id,
               territory: profile.territory,
               joinDate: profile.join_date,
               photo: profile.photo,
               managerId: profile.manager_id
             });
          }
        }
      } catch (e) {
        console.error("Session check failed", e);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();

    // Listen for auth state changes (e.g. sign out from another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkPermission = useCallback((resource: ResourceType, action: ResourceAction = 'Read') => {
    if (!currentUser) return false;
    if (currentUser.role === 'role_super_admin') return true;
    
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
    if (!currentUser) return;
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
      if (usersRes.data) setFullUserRegistry(usersRes.data.map((u: any) => ({
        ...u,
        approvalStatus: u.approval_status, // Map snake_case from DB
        reraId: u.rera_id,
        joinDate: u.join_date,
        managerId: u.manager_id
      })));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser({
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Admin User',
      email: 'admin@ef.com',
      role: 'role_super_admin',
      approvalStatus: 'Approved'
    });
    setClients([]);
    setProperties([]);
    setVisits([]);
    navigate('/');
  };

  const handleAddVisit = async (newVisit: SiteVisit) => {
    setVisits(prev => [newVisit, ...prev]);
    setSuccessMessage('Visit scheduled successfully.');
    
    const { error } = await supabase.from('site_visits').insert([newVisit]);
    if (error) console.error("Failed to sync visit:", error);
  };

  const handleUpdateVisit = async (updatedVisit: SiteVisit) => {
    setVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
    setSuccessMessage('Visit record updated.');

    const { error } = await supabase.from('site_visits').upsert([updatedVisit]);
    if (error) console.error("Failed to sync updated visit:", error);
  };

  const handleAddClient = async (newClient: Client) => {
    setIsAddClientOpen(false);
    setClients(prev => {
      const exists = prev.find(c => c.id === newClient.id);
      return exists ? prev.map(c => c.id === newClient.id ? newClient : c) : [newClient, ...prev];
    });
    setSuccessMessage('Client profile saved.');

    try {
      const { interactions, ...payload } = newClient;
      const { error } = await supabase.from('clients').upsert([payload]);
      if (error) throw error;
    } catch (error) {
      console.error('Database Sync Error:', error);
    }
  };

  const handleSaveProperty = async (property: Property) => {
    setIsAddPropertyOpen(false);
    setEditingProperty(undefined);
    
    setProperties(prev => {
      const exists = prev.find(p => p.id === property.id);
      return exists ? prev.map(p => p.id === property.id ? property : p) : [property, ...prev];
    });
    
    setSuccessMessage('Property details updated successfully.');

    try {
      const { error } = await supabase.from('properties').upsert([property]);
      if (error) throw error;
    } catch (error) {
      console.error('Property Database Sync Error:', error);
    }
  };

  const handleApproveUser = async (userId: string, status: UserProfile['approvalStatus'], role?: string) => {
    try {
      const updateData: any = { approval_status: status };
      if (role) updateData.role = role;

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      setFullUserRegistry(prev => prev.map(u => u.id === userId ? { ...u, approvalStatus: status, role: role || u.role } : u));
      setSuccessMessage(`User ${status.toLowerCase()} successfully.`);
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to update user status.');
    }
  };

  const handleBulkImport = async (type: 'Clients' | 'Properties' | 'Visits', data: any[]) => {
    try {
      const table = type === 'Clients' ? 'clients' : type === 'Properties' ? 'properties' : 'site_visits';
      const { error } = await supabase.from(table).insert(data);
      if (error) throw error;

      fetchData();
      setSuccessMessage(`Bulk imported ${data.length} ${type.toLowerCase()} successfully.`);
    } catch (error) {
      console.error('Bulk import error:', error);
      alert('Failed to import data.');
    }
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

  // Remove authentication bypass if needed, currently always renders app
  // if (!currentUser) {
  //   return <AuthPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  // }

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
          <Route path="/profile" element={<ProfilePage clients={clients} properties={properties} visits={visits} allUsers={fullUserRegistry} checkPermission={checkPermission} userRole={currentUser?.role} onSignOut={handleSignOut} />} />
          <Route path="/emi" element={<EmiCalculator />} />
          <Route path="/admin" element={<AdminPanel userRole={currentUser?.role || ''} clients={clients} properties={properties} visits={visits} pendingUsers={fullUserRegistry.filter(u => u.approvalStatus === 'Pending')} onBulkImport={handleBulkImport} onApproveUser={handleApproveUser} checkPermission={checkPermission} />} />
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