
import React, { useState } from 'react';
import { Client, ClientStatus, ClientType, Property, SiteVisit } from '../types';
import AddClientModal from '../components/AddClientModal';
import BookVisitModal from '../components/BookVisitModal';

interface ClientsPageProps {
  clients: Client[];
  properties: Property[];
  searchQuery: string;
  onAddClient: () => void;
  onUpdateClient: (client: Client) => void;
  onAddVisit: (newVisit: SiteVisit) => void;
}

const ClientsPage: React.FC<ClientsPageProps> = ({ clients, properties, searchQuery, onAddClient, onUpdateClient, onAddVisit }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [bookingClient, setBookingClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Leads</h1>
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">{filteredClients.length} Results Found</p>
        </div>
        <div className="flex bg-white shadow-sm border border-slate-100 rounded-xl p-1 gap-1">
          <button 
            onClick={() => setViewMode('grid')}
            className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <i className="fas fa-th-large text-[10px]"></i>
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <i className="fas fa-list text-[10px]"></i>
          </button>
        </div>
      </div>

      <div className={viewMode === 'grid' ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {filteredClients.map((client) => (
          <ClientCard 
            key={client.id} 
            client={client} 
            viewMode={viewMode}
            onEdit={() => setEditingClient(client)}
            onVisit={() => setBookingClient(client)}
          />
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <i className="fas fa-search text-4xl text-slate-200 mb-4"></i>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No matching clients found</p>
          </div>
        )}
      </div>

      {editingClient && (
        <AddClientModal 
          initialData={editingClient}
          onClose={() => setEditingClient(null)}
          onSubmit={(updated) => {
            onUpdateClient(updated);
            setEditingClient(null);
          }}
        />
      )}

      {bookingClient && (
        <BookVisitModal 
          client={bookingClient}
          clients={clients}
          properties={properties}
          onClose={() => setBookingClient(null)}
          onSubmit={onAddVisit}
        />
      )}
    </div>
  );
};

const ClientCard: React.FC<{ client: Client, viewMode: 'grid' | 'list', onEdit: () => void, onVisit: () => void }> = ({ client, viewMode, onEdit, onVisit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'templates' | 'history'>('profile');

  const waTemplates = [
    { name: 'Greeting', msg: `Hi ${client.firstName}, this is Rahul from Estate Flow. Glad to connect! How's your property search going?` },
    { name: 'Follow-up', msg: `Hello ${client.firstName}, following up on our discussion regarding properties in ${client.locations.join(', ') || 'Nagpur'}. Any updates?` },
    { name: 'Acknowledgment', msg: `Hi ${client.firstName}, thank you for sharing your requirements. I've noted your preference for ${client.configuration.join('/') || 'units'} in ${client.locations.join('/') || 'various areas'}. Will get back to you shortly.` },
    { name: 'Discussion', msg: `Hi ${client.firstName}, would you be available for a quick 5-minute call today to discuss some exclusive listings that match your criteria?` },
    { name: 'Site Visit', msg: `Hi ${client.firstName}, let's schedule a site visit for one of the properties we discussed. When would be a convenient time for you this week?` },
  ];

  const handleAction = (e: React.MouseEvent, action: string, message?: string) => {
    e.stopPropagation();
    if (action === 'call') window.open(`tel:${client.mobile}`, '_self');
    if (action === 'wa') {
      const text = message || waTemplates[0].msg;
      window.open(`https://wa.me/${client.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    }
    if (action === 'visit') onVisit();
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (score >= 40) return 'text-amber-500 bg-amber-50 border-amber-100';
    return 'text-red-500 bg-red-50 border-red-100';
  };

  return (
    <div 
      className={`card-neo rounded-[2rem] overflow-hidden transition-all duration-300 border border-slate-100 cursor-pointer hover:shadow-xl hover:border-indigo-100 ${viewMode === 'list' ? 'p-3' : ''}`}
      onClick={onEdit}
    >
      <div className={`${viewMode === 'list' ? 'flex items-center gap-4' : 'p-6 pb-4'}`}>
        <div className="flex items-start gap-4 w-full">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-[0_6px_15px_-4px_#4f46e5] shrink-0">
            {client.firstName[0]}{client.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <h3 className="font-black text-slate-800 text-base tracking-tight truncate uppercase leading-tight">
                  {client.firstName} {client.lastName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-lg border uppercase ${
                    client.priority === ClientStatus.HOT ? 'bg-red-50 border-red-200 text-red-600' : 
                    client.priority === ClientStatus.WARM ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    {client.priority}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{client.id}</span>
                </div>
              </div>
              <div className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl border shadow-sm ${getScoreColor(client.nurturingScore)}`}>
                <span className="text-[10px] font-black">{client.nurturingScore}%</span>
                <span className="text-[6px] font-bold uppercase tracking-tighter">Score</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${viewMode === 'list' ? 'px-3 pb-3' : 'px-6 pb-6'}`}>
        <div className="flex gap-2 w-full mt-2">
          <button onClick={(e) => handleAction(e, 'call')} className="flex-1 py-2.5 btn-3d btn-3d-white rounded-xl flex items-center justify-center gap-2 transition-all group">
            <i className="fas fa-phone-alt text-[10px] group-hover:text-indigo-600"></i>
            <span className="text-[9px] font-black uppercase tracking-widest">Call</span>
          </button>
          <button onClick={(e) => handleAction(e, 'wa')} className="flex-1 py-2.5 btn-3d btn-3d-emerald text-white rounded-xl flex items-center justify-center gap-2 transition-all">
            <i className="fab fa-whatsapp text-sm"></i>
            <span className="text-[9px] font-black uppercase tracking-widest">WA</span>
          </button>
          <button onClick={(e) => handleAction(e, 'visit')} className="flex-1 py-2.5 btn-3d btn-3d-indigo text-white rounded-xl flex items-center justify-center gap-2 transition-all">
            <i className="fas fa-calendar-check text-[10px]"></i>
            <span className="text-[9px] font-black uppercase tracking-widest">Visit</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className={`w-10 h-10 btn-3d rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'btn-3d-indigo text-white' : 'btn-3d-white text-slate-400'}`}
          >
            <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-info-circle'} text-xs`}></i>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="border-t border-slate-50 animate-slide-up p-6 bg-slate-50/50"
        >
          <div className="flex border-b border-slate-100 mb-5 gap-4 overflow-x-auto no-scrollbar">
            {['profile', 'templates', 'history'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-3 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                {tab === 'profile' ? 'Profile' : tab === 'templates' ? 'WA Templates' : 'History'}
              </button>
            ))}
          </div>

          <div className="min-h-[140px]">
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ProfileItem label="Requirements" value={client.propertyTypes.join(', ') || 'Any Residential'} icon="fa-home" />
                <ProfileItem label="Location" value={client.locations.join(', ') || 'Anywhere'} icon="fa-map-marker-alt" />
                <ProfileItem label="Configuration" value={client.configuration.join(', ') || 'N/A'} icon="fa-vector-square" />
                <ProfileItem label="Budget" value={`₹${(client.budgetMin/100000).toFixed(0)}L - ₹${(client.budgetMax/100000).toFixed(0)}L`} icon="fa-wallet" />
              </div>
            )}
            
            {activeTab === 'templates' && (
              <div className="space-y-2">
                {waTemplates.map((t, idx) => (
                  <button 
                    key={idx}
                    onClick={(e) => handleAction(e, 'wa', t.msg)}
                    className="w-full text-left p-3 bg-white border border-slate-100 rounded-xl hover:border-emerald-400 transition-all group"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">{t.name}</span>
                      <i className="fab fa-whatsapp text-emerald-400 text-xs group-hover:scale-110 transition-transform"></i>
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 line-clamp-1 italic">"{t.msg}"</p>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                <HistoryItem label="Profile Created" date={new Date(client.createdAt).toLocaleDateString()} icon="fa-plus-circle" color="text-indigo-500" />
                <HistoryItem label="Contacted via WhatsApp" date="Just now" icon="fa-paper-plane" color="text-emerald-500" />
                <HistoryItem label="Details Shared" date="Yesterday" icon="fa-file-export" color="text-blue-500" />
                <div className="text-center py-2">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">End of recent log</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileItem: React.FC<{ label: string, value: string, icon: string }> = ({ label, value, icon }) => (
  <div className="flex gap-3">
    <div className="w-8 h-8 bg-white rounded-xl border border-slate-100 flex items-center justify-center shrink-0">
      <i className={`fas ${icon} text-[10px] text-indigo-400`}></i>
    </div>
    <div className="min-w-0">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-[10px] font-bold text-slate-700 truncate leading-tight uppercase">{value}</p>
    </div>
  </div>
);

const HistoryItem: React.FC<{ label: string, date: string, icon: string, color: string }> = ({ label, date, icon, color }) => (
  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100">
    <div className="flex items-center gap-3">
      <i className={`fas ${icon} ${color} text-[10px]`}></i>
      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{label}</span>
    </div>
    <span className="text-[8px] font-black text-slate-400 uppercase">{date}</span>
  </div>
);

export default ClientsPage;
