
import React, { useState } from 'react';
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

const AppContent: React.FC = () => {
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isBookVisitOpen, setIsBookVisitOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();

  // Shared Data State
  const [clients, setClients] = useState<Client[]>([
    {
      id: 'CL-1001', salutation: 'Mr.', firstName: 'Aakash', lastName: 'Mehta', type: ClientType.BUYER,
      mobile: '+91 9876543210', email: 'aakash.m@gmail.com', address: 'Skyline Apts, Nagpur',
      requirementType: 'Buy', propertyTypes: ['Apartment'], locations: ['Nagpur South'],
      budgetMin: 5000000, budgetMax: 8500000, configuration: ['2BHK', '3BHK'],
      purpose: 'Self-use', timeToBuy: '0–3 months', employmentType: 'Salaried',
      incomeRange: '1L - 2L', loanRequired: true, preApproved: false, source: 'Portal',
      priority: ClientStatus.HOT, agent: 'Rahul Singh', nurturingScore: 85, createdAt: '2023-11-01',
    }
  ]);

  const [properties, setProperties] = useState<Property[]>([
    {
      id: 'P-1024',
      title: 'Sunrise Heights - Phase 2',
      description: 'Modern apartment building facade at sunset. Excellent investment opportunity with high ROI potential.',
      type: 'Apartment',
      listingType: 'Sale',
      possessionDate: '2025-12-01',
      location: { country: 'India', state: 'Maharashtra', city: 'Nagpur', area: 'Downtown District', landmark: 'Sector 4', mapLink: '#' },
      towers: [{ name: 'Tower A', possession: '2025-12-01' }],
      totalUnits: 320,
      reraCompletionDate: '2026-06-30',
      configurations: [
        { bhk: '2 BHK', carpetArea: 850, builtUpArea: 1000, superBuiltUpArea: 1200, unit: 'sq ft', pricePerSqUnit: 125, bathrooms: 2, balconies: 1, parking: 'Covered', costing: 1500000 }
      ],
      financials: { priceMin: 1500000, priceMax: 2250000, allInclusive: true, maintenanceAmount: 2000, maintenanceFrequency: 'Monthly', bookingAmount: 50000, negotiable: true },
      legal: { ownershipType: 'Sole Owner', owners: [{ name: 'BuildCorp Ltd', company: 'BuildCorp' }], reraId: 'P50500012345', occupancyStatus: 'Under Construction' },
      amenities: ['Lift', 'Security', 'CCTV', 'Power Backup', 'Water Source', 'Garden', 'Clubhouse', 'Gym', 'Swimming Pool'],
      furnishing: { status: 'Semi-furnished', interiors: ['Modular Kitchen', 'Wardrobes'] },
      views: ['Garden', 'Pool'],
      media: { photos: ['https://lh3.googleusercontent.com/aida-public/AB6AXuACjYyY9Gy3Mdvx8S0rNNbyE0Mzc5ZLvYuzGkEqApLnYroCQJYdSd2BGbB9PfjxfVvDwmnFAYq2hfsaiv3bXiwoEtZe-ba25kf-UdzCMQpf1B6VkRnRh7Vn19w6dijht3QKJ1LrFGyyBCzmPheCR7wRhOp7NCgIWlpkQsnlqP35s5pnp289lVfqHy4XwrAttBmoQTIdXbOOZXlW8hP0k0QqoEl48q0IXMfTXBjT0I2hD8rsvQWZetYRsfriRAkhWFU2ZnGd0CpB8VM3'], videoUrl: '', floorPlanUrl: '', documents: [] },
      source: { dedicatedRM: 'Alok Nath', rmContact: '+91 9000000001', tat: '24 Hours' },
      status: 'Available'
    }
  ]);

  const [visits, setVisits] = useState<SiteVisit[]>([
    {
      id: 'SV-001', clientId: 'CL-1001', clientName: 'Aakash Mehta', propertyId: 'P-1024',
      propertyName: 'Sunrise Heights - Phase 2', scheduledAt: '2023-11-20T10:30:00', status: 'Scheduled'
    }
  ]);

  const handleGlobalAdd = () => {
    switch (location.pathname) {
      case '/clients': setIsAddClientOpen(true); break;
      case '/properties': setIsAddPropertyOpen(true); break;
      case '/visits': setIsBookVisitOpen(true); break;
      default: navigate('/clients'); setIsAddClientOpen(true);
    }
  };

  const handleAddVisit = (newVisit: SiteVisit) => {
    setVisits(prev => [newVisit, ...prev]);
    setIsBookVisitOpen(false);
    alert('Site visit scheduled successfully!');
  };

  const handleUpdateVisit = (updatedVisit: SiteVisit) => {
    setVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
  };

  const handleAddClient = (newClient: Client) => {
    setClients(prev => {
      const exists = prev.find(c => c.id === newClient.id);
      if (exists) return prev.map(c => c.id === newClient.id ? newClient : c);
      return [newClient, ...prev];
    });
    setIsAddClientOpen(false);
    navigate('/clients');
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleAddProperty = (newProperty: Property) => {
    setProperties(prev => {
      const exists = prev.find(p => p.id === newProperty.id);
      if (exists) return prev.map(p => p.id === newProperty.id ? newProperty : p);
      return [newProperty, ...prev];
    });
    setEditingProperty(null);
    setIsAddPropertyOpen(false);
    navigate('/properties');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddClick={handleGlobalAdd}
        onFilterClick={() => alert('Filter options opened')}
      />
      
      {/* Dynamic padding based on whether the search bar is present */}
      <main className={`flex-grow ${['/clients', '/visits', '/properties'].includes(location.pathname) ? 'pt-32' : 'pt-20'} pb-28 px-4 max-w-7xl mx-auto w-full`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
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
