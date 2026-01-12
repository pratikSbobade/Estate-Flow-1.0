
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, ClientStatus, ClientType, Property, SiteVisit, ClientInteraction } from '../types';
import AddClientModal from '../components/AddClientModal';
import BookVisitModal from '../components/BookVisitModal';

interface ClientsPageProps {
  clients: Client[];
  visits: SiteVisit[];
  properties: Property[];
  searchQuery: string;
  onAddClient: () => void;
  onUpdateClient: (client: Client) => void;
  onAddVisit: (newVisit: SiteVisit) => void;
}

const ClientsPage: React.FC<ClientsPageProps> = ({ clients, visits, properties, searchQuery, onAddClient, onUpdateClient, onAddVisit }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [bookingClient, setBookingClient] = useState<Client | null>(null);
  const [callOutcomeClient, setCallOutcomeClient] = useState<Client | null>(null);

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
            visits={visits.filter(v => v.clientId === client.id)}
            viewMode={viewMode}
            onEdit={() => setEditingClient(client)}
            onVisit={() => setBookingClient(client)}
            onCallTrigger={() => setCallOutcomeClient(client)}
            onUpdateClient={onUpdateClient}
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

      {callOutcomeClient && (
        <CallOutcomeModal 
          client={callOutcomeClient}
          onClose={() => setCallOutcomeClient(null)}
          onSubmit={(interaction, newPriority) => {
            const updatedInteractions = [interaction, ...(callOutcomeClient.interactions || [])];
            onUpdateClient({ 
              ...callOutcomeClient, 
              interactions: updatedInteractions,
              priority: newPriority 
            });
            setCallOutcomeClient(null);
          }}
        />
      )}
    </div>
  );
};

const ClientCard: React.FC<{ 
  client: Client, 
  visits: SiteVisit[], 
  viewMode: 'grid' | 'list', 
  onEdit: () => void, 
  onVisit: () => void, 
  onCallTrigger: () => void,
  onUpdateClient: (c: Client) => void 
}> = ({ client, visits, viewMode, onEdit, onVisit, onCallTrigger, onUpdateClient }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'templates' | 'history'>('profile');
  const [quickNote, setQuickNote] = useState('');
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    if (action === 'call') onCallTrigger();
    if (action === 'wa') {
      const defaultMsg = `Hi ${client.firstName}, this is Rahul from Estate Flow. Glad to connect!`;
      window.open(`https://wa.me/${client.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(defaultMsg)}`, '_blank');
    }
    if (action === 'visit') onVisit();
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNote.trim()) return;
    const newInteraction: ClientInteraction = {
      id: `INT-${Math.random().toString(36).substr(2, 9)}`,
      clientId: client.id,
      type: 'Note',
      description: quickNote,
      timestamp: new Date().toISOString(),
    };
    onUpdateClient({
      ...client,
      interactions: [newInteraction, ...(client.interactions || [])]
    });
    setQuickNote('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (score >= 40) return 'text-amber-500 bg-amber-50 border-amber-100';
    return 'text-red-500 bg-red-50 border-red-100';
  };

  const categorizedHistory = {
    Calls: (client.interactions || []).filter(i => i.type === 'Call'),
    Messages: (client.interactions || []).filter(i => i.type === 'WhatsApp'),
    Visits: visits.map(v => ({
      id: v.id,
      clientId: v.clientId,
      type: 'Visit' as const,
      description: `Site Visit: ${v.status} @ ${v.propertyName}`,
      timestamp: v.scheduledAt,
      relatedId: v.id
    })),
    Notes: (client.interactions || []).filter(i => i.type === 'Note')
  };

  const waTemplates = [
    { name: 'Greeting', msg: `Hi ${client.firstName}, this is Rahul from Estate Flow. Glad to connect! How's your property search going?` },
    { name: 'Follow-up', msg: `Hello ${client.firstName}, following up on our discussion regarding properties in ${client.locations.join(', ') || 'Nagpur'}. Any updates?` },
    { name: 'Acknowledgment', msg: `Hi ${client.firstName}, thank you for sharing your requirements. I've noted your preference for ${client.configuration.join('/') || 'units'} in ${client.locations.join('/') || 'various areas'}.` },
  ];

  return (
    <div 
      className={`card-neo rounded-[2.5rem] overflow-hidden transition-all duration-300 border border-slate-100 cursor-pointer hover:shadow-xl hover:border-indigo-100 ${viewMode === 'list' ? 'p-3 flex items-center gap-4' : ''}`}
      onClick={onEdit}
    >
      <div className={`${viewMode === 'list' ? 'flex-1' : 'p-6 pb-4'}`}>
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

      <div className={`${viewMode === 'list' ? 'px-3 w-48' : 'px-6 mb-4'}`}>
        <div className="flex gap-2 w-full">
          <button onClick={(e) => handleAction(e, 'call')} className="flex-1 py-2 btn-3d btn-3d-white rounded-xl flex items-center justify-center gap-2 transition-all group">
            <i className="fas fa-phone-alt text-[10px] group-hover:text-indigo-600"></i>
            <span className="text-[8px] font-black uppercase tracking-widest">Call</span>
          </button>
          <button onClick={(e) => handleAction(e, 'wa')} className="flex-1 py-2 btn-3d btn-3d-emerald text-white rounded-xl flex items-center justify-center gap-2 transition-all">
            <i className="fab fa-whatsapp text-sm"></i>
            <span className="text-[8px] font-black uppercase tracking-widest">WA</span>
          </button>
          <button onClick={(e) => handleAction(e, 'visit')} className="flex-1 py-2 btn-3d btn-3d-indigo text-white rounded-xl flex items-center justify-center gap-2 transition-all">
            <i className="fas fa-calendar-check text-[10px]"></i>
            <span className="text-[8px] font-black uppercase tracking-widest">Visit</span>
          </button>
        </div>
      </div>

      {/* BOTTOM EXPANDABLE DROPDOWN */}
      <div className="mt-auto">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className={`w-full py-3 flex items-center justify-center gap-2 border-t border-slate-100 transition-all ${isExpanded ? 'bg-indigo-600 text-white shadow-inner' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
        >
          <span className="text-[9px] font-black uppercase tracking-widest">
            {isExpanded ? 'Hide Details' : 'View Profile, Templates & Log'}
          </span>
          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-[8px]`}></i>
        </button>

        {isExpanded && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="p-6 bg-white border-t border-slate-50 animate-slide-up"
          >
            <div className="flex gap-4 border-b border-slate-100 mb-5 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`pb-3 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === 'profile' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                Profile
              </button>
              <button 
                onClick={() => setActiveTab('templates')}
                className={`pb-3 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === 'templates' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                WA Templates
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`pb-3 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === 'history' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                Activity Log
              </button>
            </div>

            <div className="min-h-[160px]">
              {activeTab === 'profile' && (
                <div className="grid grid-cols-2 gap-4">
                  <ProfileItem label="Requirements" value={client.propertyTypes.join(', ') || 'Any'} icon="fa-home" />
                  <ProfileItem label="Budget" value={`₹${(client.budgetMin/100000).toFixed(0)}L - ₹${(client.budgetMax/100000).toFixed(0)}L`} icon="fa-wallet" />
                  <ProfileItem label="Location" value={client.locations.join(', ') || 'Anywhere'} icon="fa-map-marker-alt" />
                  <ProfileItem label="Configuration" value={client.configuration.join(', ') || 'Any'} icon="fa-vector-square" />
                </div>
              )}
              
              {activeTab === 'templates' && (
                <div className="space-y-2">
                  {waTemplates.map((t, idx) => (
                    <button 
                      key={idx}
                      onClick={() => window.open(`https://wa.me/${client.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(t.msg)}`, '_blank')}
                      className="w-full text-left p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-emerald-400 transition-all group"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">{t.name}</span>
                        <i className="fab fa-whatsapp text-emerald-400 text-[10px]"></i>
                      </div>
                      <p className="text-[9px] font-medium text-slate-500 truncate italic">"{t.msg}"</p>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <HistoryCategory 
                      icon="fa-phone" 
                      label="Calls" 
                      count={categorizedHistory.Calls.length} 
                      latest={categorizedHistory.Calls[0]?.description}
                    />
                    <HistoryCategory 
                      icon="fa-calendar-check" 
                      label="Visits" 
                      count={categorizedHistory.Visits.length} 
                      latest={categorizedHistory.Visits[0]?.description}
                      onClick={() => categorizedHistory.Visits[0] && navigate('/visits', { state: { highlightVisitId: categorizedHistory.Visits[0].id } })}
                    />
                    <HistoryCategory 
                      icon="fa-whatsapp" 
                      label="Messages" 
                      count={categorizedHistory.Messages.length} 
                      latest={categorizedHistory.Messages[0]?.description}
                    />
                    <HistoryCategory 
                      icon="fa-sticky-note" 
                      label="Notes" 
                      count={categorizedHistory.Notes.length} 
                      latest={categorizedHistory.Notes[0]?.description}
                    />
                  </div>

                  <form onSubmit={handleSaveNote} className="relative mt-2">
                    <input 
                      value={quickNote}
                      onChange={(e) => setQuickNote(e.target.value)}
                      placeholder="Add a quick note to activity log..."
                      className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                    />
                    <button 
                      type="submit"
                      className="absolute right-1.5 top-1.5 w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-transform"
                    >
                      <i className="fas fa-save text-[9px]"></i>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HistoryCategory: React.FC<{ icon: string, label: string, count: number, latest?: string, onClick?: () => void }> = ({ icon, label, count, latest, onClick }) => (
  <div 
    onClick={(e) => { if(onClick) { e.stopPropagation(); onClick(); } }}
    className={`p-2.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 transition-all ${onClick ? 'cursor-pointer hover:border-indigo-400 hover:shadow-sm' : ''}`}
  >
    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
      <i className={`fas ${icon} text-[10px]`}></i>
    </div>
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600">{count}</span>
      </div>
      <p className="text-[9px] font-bold text-slate-600 truncate leading-tight mt-0.5">
        {latest || 'No activity'}
      </p>
    </div>
  </div>
);

const ProfileItem: React.FC<{ label: string, value: string, icon: string }> = ({ label, value, icon }) => (
  <div className="flex gap-2.5">
    <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-indigo-400 border border-slate-100 shrink-0">
      <i className={`fas ${icon} text-[9px]`}></i>
    </div>
    <div className="min-w-0">
      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-[9px] font-bold text-slate-700 truncate leading-tight uppercase">{value}</p>
    </div>
  </div>
);

const CallOutcomeModal: React.FC<{ client: Client, onClose: () => void, onSubmit: (i: ClientInteraction, p: ClientStatus) => void }> = ({ client, onClose, onSubmit }) => {
  const [outcome, setOutcome] = useState('Contacted');
  const [priority, setPriority] = useState<ClientStatus>(client.priority);
  const [notes, setNotes] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [isDialed, setIsDialed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    handleDial();
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleDial = () => {
    setIsDialed(true);
    window.open(`tel:${client.mobile}`, '_self');
    if (!timerRef.current) {
        timerRef.current = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const outcomes = [
    { label: 'Contacted', icon: 'fa-check', color: 'text-emerald-500' },
    { label: 'Not Answering', icon: 'fa-phone-slash', color: 'text-red-400' },
    { label: 'Busy', icon: 'fa-clock', color: 'text-amber-400' },
    { label: 'Call Back', icon: 'fa-rotate-right', color: 'text-indigo-400' },
    { label: 'Schedule Visit', icon: 'fa-calendar-plus', color: 'text-purple-400' },
    { label: 'Dropped', icon: 'fa-trash-alt', color: 'text-slate-400' }
  ];

  const handleSave = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const durationStr = formatTime(seconds);
    const interaction: ClientInteraction = {
      id: `INT-${Math.random().toString(36).substr(2, 9)}`,
      clientId: client.id,
      type: 'Call',
      description: `Call Log [${durationStr}]: ${outcome}${notes ? ` - ${notes}` : ''}`,
      timestamp: new Date().toISOString()
    };
    onSubmit(interaction, priority);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Call Disposition</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Lead: {client.firstName} {client.lastName}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center justify-center py-6 bg-slate-900 rounded-[2rem] text-white shadow-xl shadow-slate-200">
             <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${isDialed ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Call Duration</span>
             </div>
             <h2 className="text-5xl font-mono font-black tabular-nums">{formatTime(seconds)}</h2>
             <button 
                onClick={handleDial}
                className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
             >
                {isDialed ? 'Redial Number' : 'Start Dialing'}
             </button>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Call Outcome</label>
            <div className="grid grid-cols-3 gap-2">
              {outcomes.map(o => (
                <button 
                  key={o.label}
                  onClick={() => setOutcome(o.label)}
                  className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                    outcome === o.label ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'
                  }`}
                >
                  <i className={`fas ${o.icon} text-xs ${outcome === o.label ? 'text-white' : o.color}`}></i>
                  <span className="text-[8px] font-black uppercase tracking-tighter whitespace-nowrap">{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Lead Priority Update</label>
              <select 
                value={priority} 
                onChange={e => setPriority(e.target.value as ClientStatus)}
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black outline-none focus:bg-white focus:border-indigo-600 shadow-sm"
              >
                {Object.values(ClientStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Call Notes</label>
              <input 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                placeholder="Brief summary..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600 shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-8 border-t bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 btn-3d btn-3d-white text-[10px] font-black uppercase rounded-2xl">Discard Log</button>
          <button onClick={handleSave} className="flex-[2] py-4 btn-3d btn-3d-indigo text-white text-[10px] font-black uppercase rounded-2xl shadow-lg shadow-indigo-100">
             Save Call Summary
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;
