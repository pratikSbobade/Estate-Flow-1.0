
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
import { Client, Property, SiteVisit, UserProfile, CustomRole, ResourceType, ResourceAction } from './types';
import AddClientModal from './components/AddClientModal';
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
  // Hardcoded Super Admin user for direct access
  const [currentUser] = useState<UserProfile>({
    id: 'ADMIN-01',
    name: 'Rahul Singh',
    email: 'rahul.singh@estateflow.com',
    role: 'role_super_admin',
    approvalStatus: 'Approved',
    region: 'Nagpur'
  });

  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [fullUserRegistry, setFullUserRegistry] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Custom Roles
  const [customRoles] = useState<CustomRole[]>(() => {
    const saved = localStorage.getItem('ef_custom_roles');
    return saved ? JSON.parse(saved) : [];
  });

  const navigate = useNavigate();

  const checkPermission = useCallback((resource: ResourceType, action: ResourceAction = 'Read') => {
    return true; // Super admin bypasses all checks
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, propertiesRes, visitsRes, usersRes] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('properties').select('*').order('id', { ascending: false }),
        supabase.from('site_visits').select('*').order('scheduled_at', { ascending: false }),
        supabase.from('users').select('*')
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (propertiesRes.data) setProperties(propertiesRes.data);
      if (visitsRes.data) setVisits(visitsRes.data);
      if (usersRes.data) setFullUserRegistry(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleAddVisit = async (newVisit: SiteVisit) => {
    // Optimistic Update
    setVisits(prev => [newVisit, ...prev]);
    setSuccessMessage('Visit scheduled successfully.');
    
    const { error } = await supabase.from('site_visits').insert([newVisit]);
    if (error) {
      console.error("Failed to sync visit to database:", error);
      // Rollback if needed or notify user of sync issue
    }
  };

  const handleAddClient = async (newClient: Client) => {
    // 1. Instant Modal Close & Local State Update (Optimistic)
    setIsAddClientOpen(false);
    setClients(prev => {
      const exists = prev.find(c => c.id === newClient.id);
      if (exists) {
        return prev.map(c => c.id === newClient.id ? newClient : c);
      }
      return [newClient, ...prev];
    });
    setSuccessMessage('Client profile saved and synchronized.');

    // 2. Background Sync with Supabase
    try {
      const { interactions, ...payload } = newClient;
      const { error } = await supabase.from('clients').upsert([payload]);
      if (error) throw error;
    } catch (error) {
      console.error('Database Sync Error:', error);
      // We don't necessarily want to alert the user immediately since it's locally saved,
      // but in a production app, we would queue this for retry.
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Ecosystem...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-900 transition-colors duration-300">
      <Header 
        searchQuery={searchQuery} onSearchChange={setSearchQuery} onAddClick={() => setIsAddClientOpen(true)}
        theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
        role={currentUser.role} checkPermission={checkPermission}
        onFilterClick={() => {}}
      />
      <main className="flex-grow pt-32 pb-28 px-4 max-w-7xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Dashboard clients={clients} properties={properties} visits={visits} />} />
          <Route path="/clients" element={<ClientsPage clients={clients} visits={visits} properties={properties} searchQuery={searchQuery} onAddClient={() => setIsAddClientOpen(true)} onUpdateClient={handleAddClient} onAddVisit={handleAddVisit} checkPermission={checkPermission} />} />
          <Route path="/visits" element={<VisitsPage visits={visits} searchQuery={searchQuery} onUpdateVisit={() => {}} onAddVisit={handleAddVisit} onManualAddClick={() => {}} clients={clients} properties={properties} onUpdateClient={handleAddClient} checkPermission={checkPermission} />} />
          <Route path="/properties" element={<PropertiesPage properties={properties} clients={clients} searchQuery={searchQuery} onAddProperty={() => {}} onEditProperty={() => {}} onAddVisit={handleAddVisit} checkPermission={checkPermission} />} />
          <Route path="/profile" element={<ProfilePage clients={clients} properties={properties} visits={visits} allUsers={fullUserRegistry} checkPermission={checkPermission} userRole={currentUser.role} />} />
          <Route path="/emi" element={<EmiCalculator />} />
          <Route path="/admin" element={<AdminPanel userRole={currentUser.role} clients={clients} properties={properties} visits={visits} pendingUsers={fullUserRegistry.filter(u => u.approvalStatus === 'Pending')} onBulkImport={() => {}} onApproveUser={() => {}} checkPermission={checkPermission} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer role={currentUser.role} checkPermission={checkPermission} />
      {isAddClientOpen && <AddClientModal onClose={() => setIsAddClientOpen(false)} onSubmit={handleAddClient} />}
      {successMessage && <SuccessPopup message={successMessage} onClose={() => setSuccessMessage(null)} />}
    </div>
  );
};

const App: React.FC = () => <HashRouter><AppContent /></HashRouter>;
export default App;
