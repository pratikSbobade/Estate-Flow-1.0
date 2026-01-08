
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/ClientsPage';
import VisitsPage from './pages/VisitsPage';
import PropertiesPage from './pages/PropertiesPage';
import ProfilePage from './pages/ProfilePage';
import EmiCalculator from './pages/EmiCalculator';
import { Client, Property, SiteVisit, ClientType, ClientStatus } from './types';
import AddClientModal from './components/AddClientModal';
import AddPropertyModal from './components/AddPropertyModal';
import BookVisitModal from './components/BookVisitModal';
import { supabase } from './lib/supabase';

const AppContent: React.FC = () => {
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isBookVisitOpen, setIsBookVisitOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  // Initial Data Fetch from Supabase
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
      } catch (error) {
        console.error('Error fetching data from Supabase:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGlobalAdd = () => {
    switch (location.pathname) {
      case '/clients': setIsAddClientOpen(true); break;
      case '/properties': setIsAddPropertyOpen(true); break;
      case '/visits': setIsBookVisitOpen(true); break;
      default: navigate('/clients'); setIsAddClientOpen(true);
    }
  };

  const handleAddVisit = async (newVisit: SiteVisit) => {
    const visitWithHistory = {
      ...newVisit,
      history: [{ status: 'Scheduled', date: new Date().toISOString(), note: 'Visit confirmed' }]
    };

    const { error } = await supabase.from('site_visits').insert([visitWithHistory]);
    
    if (error) {
      console.error('Error adding visit:', error);
      alert('Error scheduling visit. Please try again.');
    } else {
      setVisits(prev => [visitWithHistory, ...prev]);
      setIsBookVisitOpen(false);
    }
  };

  const handleUpdateVisit = async (updatedVisit: SiteVisit) => {
    const { error } = await supabase
      .from('site_visits')
      .update(updatedVisit)
      .eq('id', updatedVisit.id);

    if (error) {
      console.error('Error updating visit:', error);
    } else {
      setVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
    }
  };

  const handleAddClient = async (newClient: Client) => {
    const { error } = await supabase.from('clients').upsert([newClient]);

    if (error) {
      console.error('Error saving client:', error);
      alert('Error saving client. Please try again.');
    } else {
      setClients(prev => {
        const exists = prev.find(c => c.id === newClient.id);
        if (exists) return prev.map(c => c.id === newClient.id ? newClient : c);
        return [newClient, ...prev];
      });
      setIsAddClientOpen(false);
      navigate('/clients');
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    const { error } = await supabase
      .from('clients')
      .update(updatedClient)
      .eq('id', updatedClient.id);

    if (error) {
      console.error('Error updating client:', error);
    } else {
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    }
  };

  const handleAddProperty = async (newProperty: Property) => {
    const { error } = await supabase.from('properties').upsert([newProperty]);

    if (error) {
      console.error('Error saving property:', error);
      alert('Error saving property. Please try again.');
    } else {
      setProperties(prev => {
        const exists = prev.find(p => p.id === newProperty.id);
        if (exists) return prev.map(p => p.id === newProperty.id ? newProperty : p);
        return [newProperty, ...prev];
      });
      setEditingProperty(null);
      setIsAddPropertyOpen(false);
      navigate('/properties');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initializing Flow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddClick={handleGlobalAdd}
        onFilterClick={() => alert('Filter options opened')}
      />
      
      <main className={`flex-grow ${['/clients', '/visits', '/properties'].includes(location.pathname) ? 'pt-32' : 'pt-20'} pb-28 px-4 max-w-7xl mx-auto w-full`}>
        <Routes>
          <Route path="/" element={<Dashboard clients={clients} properties={properties} visits={visits} />} />
          <Route path="/clients" element={<ClientsPage clients={clients} properties={properties} searchQuery={searchQuery} onAddClient={() => setIsAddClientOpen(true)} onUpdateClient={handleUpdateClient} onAddVisit={handleAddVisit} />} />
          <Route path="/visits" element={<VisitsPage visits={visits} searchQuery={searchQuery} onUpdateVisit={handleUpdateVisit} onAddVisit={() => setIsBookVisitOpen(true)} />} />
          <Route path="/properties" element={<PropertiesPage properties={properties} clients={clients} searchQuery={searchQuery} onAddProperty={() => { setEditingProperty(null); setIsAddPropertyOpen(true); }} onEditProperty={(p) => { setEditingProperty(p); setIsAddPropertyOpen(true); }} onAddVisit={handleAddVisit} />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/emi" element={<EmiCalculator />} />
        </Routes>
      </main>

      <Footer />

      {isAddClientOpen && (
        <AddClientModal 
          onClose={() => setIsAddClientOpen(false)} 
          onSubmit={handleAddClient} 
        />
      )}

      {isAddPropertyOpen && (
        <AddPropertyModal 
          initialData={editingProperty || undefined}
          onClose={() => { setIsAddPropertyOpen(false); setEditingProperty(null); }} 
          onSubmit={handleAddProperty} 
        />
      )}

      {isBookVisitOpen && (
        <BookVisitModal 
          clients={clients}
          properties={properties}
          onClose={() => setIsBookVisitOpen(false)}
          onSubmit={handleAddVisit}
        />
      )}
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
