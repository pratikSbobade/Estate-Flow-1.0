
import React, { useState } from 'react';
import { Client, ClientStatus, ClientType } from '../types';
import AddClientModal from '../components/AddClientModal';

interface ClientsPageProps {
  clients: Client[];
  onAddClient: () => void;
  onUpdateClient: (client: Client) => void;
}

const ClientsPage: React.FC<ClientsPageProps> = ({ clients, onAddClient, onUpdateClient }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header with Global Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Clients</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Managing {filteredClients.length} Leads</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-grow sm:flex-grow-0">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              type="text" 
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-indigo-500 outline-none w-full sm:w-64 shadow-sm"
            />
          </div>
          <button 
            onClick={onAddClient}
            className="flex items-center gap-2 px-5 py-2.5 btn-3d btn-3d-indigo text-white rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
          >
            <i className="fas fa-plus"></i>
            <span>New Client</span>
          </button>
          <div className="flex bg-white shadow-sm border border-slate-200 rounded-xl p-1 gap-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className="fas fa-th-large text-xs"></i>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className="fas fa-list text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid/List Container */}
      <div className={viewMode === 'grid' ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {filteredClients.map((client) => (
          <ClientCard 
            key={client.id} 
            client={client} 
            viewMode={viewMode}
            onEdit={() => setEditingClient(client)}
          />
        ))}
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
    </div>
  );
};

const ClientCard: React.FC<{ client: Client, viewMode: 'grid' | 'list', onEdit: () => void }> = ({ client, viewMode, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'templates' | 'history'>('profile');

  const waTemplates = [
    { name: 'Greeting', msg: `Hi ${client.firstName}, this is Rahul from Estate Flow. Glad to connect! How's your property search going?` },
    { name: 'Follow-up', msg: `Hello ${client.firstName}, following up on our discussion regarding ${client.propertyTypes.join('/') || 'properties'}. Any updates?` },
    { name: 'Acknowledgment', msg: `Hi ${client.firstName}, thanks for sharing your requirements. I've received all details and I'm on it.` },
    { name: 'Discussion Time', msg: `Hi ${client.firstName}, when would be a good time to have a quick call today to discuss the site visit?` },
    { name: 'Site Visit Confirm', msg: `Hi ${client.firstName}, confirmed site visit for ${client.locations[0] || 'the property'} this weekend. See you there!` }
  ];

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    if (action === 'call') window.open(`tel:${client.mobile}`, '_self');
    if (action === 'wa') window.open(`https://wa.me/${client.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(waTemplates[0].msg)}`, '_blank');
    if (action === 'visit') alert(`Redirecting to schedule visit for ${client.firstName}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div 
      onClick={onEdit}
      className={`card-neo rounded-[2.5rem] overflow-hidden transition-all duration-300 border border-slate-100 cursor-pointer hover:shadow-xl hover:border-indigo-100 ${viewMode === 'list' ? 'p-3 flex items-center gap-4' : ''}`}
    >
      {/* Header Section */}
      <div className={`${viewMode === 'list' ? 'flex items-center gap-4 flex-1' : 'p-6 pb-4'}`}>
        <div className="flex items-start gap-4">
          <div 
            className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-[0_6px_15px_-4px_#4f46e5] shrink-0"
          >
            {client.firstName[0]}{client.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-black text-slate-800 text-base tracking-tight truncate uppercase leading-tight">
                {client.firstName} {client.lastName}
              </h3>
              <span className={`text-[9px] font-black ${getScoreColor(client.nurturingScore)} bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-sm whitespace-nowrap`}>
                {client.nurturingScore}% Score
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border uppercase ${
                client.priority === ClientStatus.HOT ? 'bg-red-50 border-red-200 text-red-600' : 
                client.priority === ClientStatus.WARM ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {client.priority}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{client.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Well-arranged Buttons with Icons */}
      <div className={`${viewMode === 'list' ? 'flex items-center gap-2' : 'px-6 pb-6'}`}>
        <div className="flex gap-2 w-full">
          <button onClick={(e) => handleAction(e, 'call')} className="flex-1 py-3 btn-3d btn-3d-white rounded-xl flex items-center justify-center gap-2 transition-all group">
            <i className="fas fa-phone-alt text-[10px] group-hover:text-indigo-600"></i>
            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Call</span>
          </button>
          <button onClick={(e) => handleAction(e, 'wa')} className="flex-1 py-3 btn-3d btn-3d-emerald text-white rounded-xl flex items-center justify-center gap-2 transition-all">
            <i className="fab fa-whatsapp text-sm"></i>
            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">WhatsApp</span>
          </button>
          <button onClick={(e) => handleAction(e, 'visit')} className="flex-1 py-3 btn-3d btn-3d-indigo text-white rounded-xl flex items-center justify-center gap-2 transition-all">
            <i className="fas fa-calendar-check text-[10px]"></i>
            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Visit</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className={`w-11 h-11 btn-3d rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'btn-3d-indigo text-white' : 'btn-3d-white text-slate-400'}`}
          >
            <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-info-circle'} text-xs`}></i>
          </button>
        </div>
      </div>

      {/* Dropdown/Expanded View */}
      {isExpanded && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`border-t border-slate-50 animate-slide-up ${viewMode === 'list' ? 'fixed inset-x-4 bottom-24 bg-white rounded-[2rem] shadow-2xl p-6 z-[60] sm:relative sm:inset-auto sm:shadow-none sm:p-0' : 'p-6 pt-0 bg-slate-50/30'}`}
        >
          <div className="flex border-b border-slate-100 mb-5 gap-6">
            {['profile', 'templates', 'history'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-3 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all relative ${
                  activeTab === tab ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="min-h-[160px]">
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ProfileItem label="Property Requirements" value={client.propertyTypes.join(', ') || 'Any Residential'} icon="fa-home" />
                <ProfileItem label="Required Location" value={client.locations.join(', ') || 'Nagpur Central'} icon="fa-map-marker-alt" />
                <ProfileItem label="Preferred Configuration" value={client.configuration.join(', ') || 'N/A'} icon="fa-vector-square" />
                <ProfileItem label="Budget Range" value={`₹${(client.budgetMin/100000).toFixed(0)}L - ₹${(client.budgetMax/100000).toFixed(0)}L`} icon="fa-wallet" />
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="grid gap-2 max-h-[220px] overflow-y-auto pr-2 hide-scrollbar">
                {waTemplates.map((t, idx) => (
                  <button 
                    key={idx}
                    onClick={() => window.open(`https://wa.me/${client.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(t.msg)}`, '_blank')}
                    className="w-full text-left p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-emerald-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{t.name}</span>
                      <i className="fab fa-whatsapp text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </div>
                    <p className="text-[10px] text-slate-600 italic font-medium leading-relaxed">"{t.msg}"</p>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <HistoryRow icon="fa-paper-plane" label="Details Shared" desc="Shared Godrej Prime brochure via WhatsApp" time="2h ago" />
                <HistoryRow icon="fa-phone-volume" label="Call Triggered" desc="Discussed budget constraints & bank loan" time="Yesterday" color="indigo" />
                <HistoryRow icon="fa-calendar-alt" label="Site Visit Scheduled" desc="Scheduled for Sat, 25 Nov at 11:00 AM" time="22 Oct" color="emerald" />
                <HistoryRow icon="fa-plus-circle" label="Lead Created" desc="Source: Housing.com Portal" time="15 Oct" />
              </div>
            )}
          </div>
          
          {/* Backdrop for list view overlay */}
          {viewMode === 'list' && isExpanded && (
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[-1] sm:hidden"
              onClick={() => setIsExpanded(false)}
            ></div>
          )}
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
      <p className="text-[11px] font-bold text-slate-700 truncate leading-tight">{value}</p>
    </div>
  </div>
);

const HistoryRow: React.FC<{ icon: string, label: string, desc: string, time: string, color?: string }> = ({ icon, label, desc, time, color = 'slate' }) => (
  <div className="flex gap-4 relative">
    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
      color === 'indigo' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
      color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'
    }`}>
      <i className={`fas ${icon} text-[10px]`}></i>
    </div>
    <div className="flex-1 pb-4 border-b border-slate-50">
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{label}</p>
        <span className="text-[8px] font-bold text-slate-400 uppercase">{time}</span>
      </div>
      <p className="text-[10px] text-slate-500 mt-1 font-medium leading-tight">{desc}</p>
    </div>
  </div>
);

export default ClientsPage;
