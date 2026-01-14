
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
import { Client, Property, SiteVisit, ClientType, ClientStatus, UserRole, UserProfile, CustomRole, ResourceType, ResourceAction } from './types';
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
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed uppercase tracking-widest">
          {message}
        </p>
      </div>
      <button 
        onClick={onClose}
        className="w-full py-4 btn-3d btn-3d-indigo text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100"
      >
        Continue
      </button>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('ef_current_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isBookVisitOpen, setIsBookVisitOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [fullUserRegistry, setFullUserRegistry] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Custom Roles for Permission Checking
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => {
    const saved = localStorage.getItem('ef_custom_roles');
    return saved ? JSON.parse(saved) : [];
  });

  const refreshUserRegistry = useCallback(() => {
    const registryJson = localStorage.getItem('ef_user_registry');
    if (registryJson) {
      const registry: UserProfile[] = JSON.parse(registryJson);
      setFullUserRegistry(registry);
    } else {
      const initial: UserProfile[] = [
        { id: 'S-ADMIN-01', name: 'Estate Flow Super', role: 'role_super_admin', email: 'super@estateflow.com', password: 'admin', approvalStatus: 'Approved', createdAt: new Date().toISOString() },
        { id: 'S-ADMIN-02', name: 'Pratik Bobade', role: 'role_super_admin', email: 'pratikbobade62@gmail.com', password: '12345', approvalStatus: 'Approved', createdAt: new Date().toISOString() },
        { id: 'ADMIN-01', name: 'Admin User', role: 'role_admin', email: 'admin@estateflow.com', password: 'admin', approvalStatus: 'Approved', createdAt: new Date().toISOString() }
      ];
      localStorage.setItem('ef_user_registry', JSON.stringify(initial));
      setFullUserRegistry(initial);
    }
    
    const savedRoles = localStorage.getItem('ef_custom_roles');
    if (savedRoles) setCustomRoles(JSON.parse(savedRoles));
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  // Role Checking Helper
  const checkPermission = useCallback((resource: ResourceType, action: ResourceAction = 'Read') => {
    if (currentUser?.role === 'role_super_admin') return true;
    const role = customRoles.find(r => r.id === currentUser?.role);
    if (!role) {
       if (currentUser?.role === 'role_admin') return true;
       return false;
    };
    return role.permissions[resource]?.[action] || false;
  }, [currentUser, customRoles]);

  const canReadLeads = useMemo(() => checkPermission('Leads'), [checkPermission]);
  const canReadProperties = useMemo(() => checkPermission('Properties'), [checkPermission]);
  const canReadVisits = useMemo(() => checkPermission('Site Visits'), [checkPermission]);
  const isAnyAdmin = useMemo(() => ['role_admin', 'role_super_admin'].includes(currentUser?.role || ''), [currentUser]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clientsRes, propertiesRes, visitsRes] = await Promise.all([
          supabase.from('clients').select('*').order('createdAt', { ascending: false }),
          supabase.from('properties').select('*').order('id', { ascending: false }),
          supabase.from('site_visits').select('*').order('scheduledAt', { ascending: false })
        ]);

        if (clientsRes.data) setClients(clientsRes.data);
        if (propertiesRes.data) setProperties(propertiesRes.data);
        if (visitsRes.data) setVisits(visitsRes.data);
        
        refreshUserRegistry();
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshUserRegistry]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('ef_current_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ef_current_session');
    window.location.reload();
  };

  const handleGlobalAdd = () => {
    switch (location.pathname) {
      case '/clients': setIsAddClientOpen(true); break;
      case '/properties': setIsAddPropertyOpen(true); break;
      case '/visits': setIsBookVisitOpen(true); break;
      default: navigate('/clients'); setIsAddClientOpen(true);
    }
  };

  const handleAddVisit = async (newVisit: SiteVisit) => {
    const { error } = await supabase.from('site_visits').insert([newVisit]);
    if (!error) {
      setVisits(prev => [newVisit, ...prev]);
      setIsBookVisitOpen(false);
      setSuccessMessage('Visit scheduled successfully.');
    }
  };

  const handleUpdateVisit = async (updatedVisit: SiteVisit) => {
    const { id, ...payload } = updatedVisit;
    const { error } = await supabase.from('site_visits').update(payload).eq('id', id);
    if (!error) {
      setVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
      setSuccessMessage('Visit updated.');
    }
  };

  const handleAddProperty = async (newProperty: Property) => {
    const { error } = await supabase.from('properties').upsert([newProperty]);
    if (!error) {
      setProperties(prev => {
        const exists = prev.find(p => p.id === newProperty.id);
        if (exists) return prev.map(p => p.id === newProperty.id ? newProperty : p);
        return [newProperty, ...prev];
      });
      setIsAddPropertyOpen(false);
      setSuccessMessage('Property saved.');
    }
  };

  const handleAddClient = async (newClient: Client) => {
    const { interactions, ...payload } = newClient;
    const { error } = await supabase.from('clients').upsert([payload]);
    if (!error) {
      setClients(prev => {
        const exists = prev.find(c => c.id === newClient.id);
        if (exists) return prev.map(c => c.id === newClient.id ? newClient : c);
        return [newClient, ...prev];
      });
      setIsAddClientOpen(false);
      setSuccessMessage('Client saved.');
    }
  };

  const handleBulkImport = (type: 'Clients' | 'Properties' | 'Visits', data: any[]) => {
    if (type === 'Clients') setClients(prev => [...data, ...prev]);
    if (type === 'Properties') setProperties(prev => [...data, ...prev]);
    if (type === 'Visits') setVisits(prev => [...data, ...prev]);
    setSuccessMessage(`Import of ${data.length} records completed.`);
  };

  const handleUserApproval = (userId: string, status: UserProfile['approvalStatus'], role?: string) => {
    const registryJson = localStorage.getItem('ef_user_registry');
    if (registryJson) {
      let registry: UserProfile[] = JSON.parse(registryJson);
      registry = registry.map(u => {
        if (u.id === userId) {
          return { ...u, approvalStatus: status, role: role || u.role };
        }
        return u;
      });
      localStorage.setItem('ef_user_registry', JSON.stringify(registry));
      setFullUserRegistry(registry);
      setSuccessMessage(`User profile ${status.toLowerCase()}.`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Ecosystem...</p>
        </div>
      </div>
    );
  }

  // Mandatory Login Screen
  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  const pendingUsersToApprove = fullUserRegistry.filter(u => u.approvalStatus === 'Pending');

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-900 transition-colors duration-300">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddClick={handleGlobalAdd}
        onFilterClick={() => {}}
        theme={theme}
        onToggleTheme={toggleTheme}
        role={currentUser?.role as string}
        checkPermission={checkPermission}
      />
      
      <main className={`flex-grow ${['/clients', '/visits', '/properties', '/admin'].includes(location.pathname) ? 'pt-32' : 'pt-20'} pb-28 px-4 max-w-7xl mx-auto w-full`}>
        <Routes>
          <Route path="/" element={<Dashboard clients={clients} properties={properties} visits={visits} />} />
          <Route path="/clients" element={canReadLeads ? <ClientsPage clients={clients} visits={visits} properties={properties} searchQuery={searchQuery} onAddClient={() => setIsAddClientOpen(true)} onUpdateClient={handleAddClient} onAddVisit={handleAddVisit} checkPermission={checkPermission} /> : <Navigate to="/" replace />} />
          <Route path="/visits" element={canReadVisits ? <VisitsPage visits={visits} searchQuery={searchQuery} onUpdateVisit={handleUpdateVisit} onAddVisit={handleAddVisit} onManualAddClick={() => setIsBookVisitOpen(true)} clients={clients} properties={properties} onUpdateClient={handleAddClient} checkPermission={checkPermission} /> : <Navigate to="/" replace />} />
          <Route path="/properties" element={canReadProperties ? <PropertiesPage properties={properties} clients={clients} searchQuery={searchQuery} onAddProperty={() => { setEditingProperty(null); setIsAddPropertyOpen(true); }} onEditProperty={(p) => { setEditingProperty(p); setIsAddPropertyOpen(true); }} onAddVisit={handleAddVisit} checkPermission={checkPermission} /> : <Navigate to="/" replace />} />
          <Route path="/profile" element={<ProfilePage clients={clients} properties={properties} visits={visits} allUsers={fullUserRegistry} onUpdateClient={handleAddClient} userRole={currentUser?.role as string} onSwitchRole={(r) => setCurrentUser(prev => prev ? ({ ...prev, role: r }) : null)} onLogout={handleLogout} />} />
          <Route path="/emi" element={<EmiCalculator />} />
          <Route path="/admin" element={isAnyAdmin ? <AdminPanel userRole={currentUser?.role as string} clients={clients} properties={properties} visits={visits} pendingUsers={pendingUsersToApprove} onBulkImport={handleBulkImport} onApproveUser={handleUserApproval} checkPermission={checkPermission} /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer role={currentUser?.role as string} checkPermission={checkPermission} />

      {isAddClientOpen && <AddClientModal onClose={() => setIsAddClientOpen(false)} onSubmit={handleAddClient} />}
      {isAddPropertyOpen && <AddPropertyModal initialData={editingProperty || undefined} onClose={() => { setIsAddPropertyOpen(false); setEditingProperty(null); }} onSubmit={handleAddProperty} />}
      {isBookVisitOpen && <BookVisitModal clients={clients} properties={properties} onClose={() => setIsBookVisitOpen(false)} onSubmit={handleAddVisit} />}
      {successMessage && <SuccessPopup message={successMessage} onClose={() => setSuccessMessage(null)} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
