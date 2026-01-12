
import React, { useState, useMemo, useRef, useEffect } from 'react';
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

type SortField = 'name' | 'score' | 'created' | 'budget';

const ClientsPage: React.FC<ClientsPageProps> = ({ clients, visits, properties, searchQuery, onAddClient, onUpdateClient, onAddVisit }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'status'>('grid');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [bookingClient, setBookingClient] = useState<Client | null>(null);
  const [callOutcomeClient, setCallOutcomeClient] = useState<Client | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter States
  const [statusFilters, setStatusFilters] = useState<ClientStatus[]>([]);
  const [locationFilters, setLocationFilters] = useState<string[]>([]);

  // Derived Data: Unique Locations from current clients
  const availableLocations = useMemo(() => {
    const locs = new Set<string>();
    clients.forEach(c => c.locations.forEach(l => locs.add(l)));
    return Array.from(locs).sort();
  }, [clients]);

  // Sorting and Filtering Logic
  const filteredClients = useMemo(() => {
    let result = clients.filter(c => {
      const matchesSearch = `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           c.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(c.priority);
      const matchesLocation = locationFilters.length === 0 || 
                             c.locations.some(loc => locationFilters.includes(loc));
      return matchesSearch && matchesStatus && matchesLocation;
    });

    // Apply Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortField === 'score') {
        comparison = a.nurturingScore - b.nurturingScore;
      } else if (sortField === 'created') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'budget') {
        comparison = a.budgetMax - b.budgetMax;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [clients, searchQuery, statusFilters, locationFilters, sortField, sortOrder]);

  const clientsByStatus = {
    [ClientStatus.HOT]: filteredClients.filter(c => c.priority === ClientStatus.HOT),
    [ClientStatus.WARM]: filteredClients.filter(c => c.priority === ClientStatus.WARM),
    [ClientStatus.COLD]: filteredClients.filter(c => c.priority === ClientStatus.COLD),
  };

  const hasActiveFilters = statusFilters.length > 0 || locationFilters.length > 0;

  const clearFilters = () => {
    setStatusFilters([]);
    setLocationFilters([]);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setIsSortOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight transition-colors">Active Leads</h1>
          <p className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest">
            {filteredClients.length} Results {hasActiveFilters && '(Filtered)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline mr-2"
            >
              Reset
            </button>
          )}
          <div className="flex bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-xl p-1 gap-1 relative transition-colors">
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center relative ${hasActiveFilters ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="Filter Leads"
            >
              <i className="fas fa-filter text-[11px]"></i>
              {hasActiveFilters && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-600 rounded-full border border-white dark:border-slate-800"></span>}
            </button>
            
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center ${isSortOpen ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="Sort Leads"
            >
              <i className="fas fa-sort-amount-down text-[11px]"></i>
            </button>

            {isSortOpen && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 p-2 animate-slide-up">
                {[
                  { id: 'name', label: 'By Name' },
                  { id: 'score', label: 'By Lead Score' },
                  { id: 'created', label: 'By Date Created' },
                  { id: 'budget', label: 'By Budget' }
                ].map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => toggleSort(opt.id as SortField)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between ${sortField === opt.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    {opt.label}
                    {sortField === opt.id && <i className={`fas fa-chevron-${sortOrder === 'asc' ? 'up' : 'down'} text-[8px]`}></i>}
                  </button>
                ))}
              </div>
            )}

            <div className="w-[1px] bg-slate-100 dark:bg-slate-700 mx-0.5"></div>
            
            <button 
              onClick={() => setViewMode('grid')} 
              className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="Grid View"
            >
              <i className="fas fa-th-large text-[11px]"></i>
            </button>
            <button 
              onClick={() => setViewMode('status')} 
              className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center ${viewMode === 'status' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="By Status"
            >
              <i className="fas fa-columns text-[11px]"></i>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard 
              key={client.id} 
              client={client} 
              visits={visits.filter(v => v.clientId === client.id)}
              onEdit={() => setEditingClient(client)}
              onVisit={() => setBookingClient(client)}
              onCallTrigger={() => setCallOutcomeClient(client)}
              onUpdateClient={onUpdateClient}
            />
          ))}
          {filteredClients.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700 transition-colors">
               <i className="fas fa-search text-slate-200 dark:text-slate-700 text-4xl mb-4"></i>
               <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">No matching leads found</p>
               {hasActiveFilters && (
                 <button onClick={clearFilters} className="mt-4 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase underline">Clear All Filters</button>
               )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar min-h-[600px]">
          {[ClientStatus.HOT, ClientStatus.WARM, ClientStatus.COLD].map((status) => {
            const isColumnVisible = statusFilters.length === 0 || statusFilters.includes(status);
            if (!isColumnVisible) return null;

            return (
              <div key={status} className="flex-1 min-w-[320px] max-w-[400px] flex flex-col gap-4">
                <div className={`p-4 rounded-[1.5rem] flex items-center justify-between border-b-4 ${
                  status === ClientStatus.HOT ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600' : 
                  status === ClientStatus.WARM ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600' : 
                  'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest transition-colors">{status}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      status === ClientStatus.HOT ? 'bg-red-600 text-white' : 
                      status === ClientStatus.WARM ? 'bg-indigo-600 text-white' : 
                      'bg-slate-400 dark:bg-slate-600 text-white'
                    }`}>
                      {clientsByStatus[status].length}
                    </span>
                  </div>
                  <i className={`fas ${status === ClientStatus.HOT ? 'fa-fire' : status === ClientStatus.WARM ? 'fa-bolt' : 'fa-snowflake'} text-xs opacity-50`}></i>
                </div>
                
                <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar pr-1">
                  {clientsByStatus[status].map((client) => (
                    <ClientCard 
                      key={client.id} 
                      client={client} 
                      visits={visits.filter(v => v.clientId === client.id)}
                      onEdit={() => setEditingClient(client)}
                      onVisit={() => setBookingClient(client)}
                      onCallTrigger={() => setCallOutcomeClient(client)}
                      onUpdateClient={onUpdateClient}
                    />
                  ))}
                  {clientsByStatus[status].length === 0 && (
                    <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] transition-colors">
                      <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">No {status} Leads</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-[3rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up transition-colors">
            <div className="p-8 border-b dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Filter Prospects</h3>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Refine your active lead list</p>
              </div>
              <button onClick={() => setIsFilterModalOpen(false)} className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-8 space-y-8">
              {/* Status Filter */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Lead Priority Status</label>
                <div className="flex flex-wrap gap-2">
                  {[ClientStatus.HOT, ClientStatus.WARM, ClientStatus.COLD].map(status => (
                    <button 
                      key={status}
                      onClick={() => setStatusFilters(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])}
                      className={`px-5 py-2.5 rounded-xl border text-[9px] font-black uppercase transition-all ${statusFilters.includes(status) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300 border-slate-100 dark:border-slate-600 hover:border-indigo-200'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Preferred Locations</label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar pr-2">
                  {availableLocations.map(loc => (
                    <button 
                      key={loc}
                      onClick={() => setLocationFilters(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc])}
                      className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${locationFilters.includes(loc) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-300 border-slate-100 dark:border-slate-600 hover:border-indigo-200'}`}
                    >
                      {loc}
                    </button>
                  ))}
                  {availableLocations.length === 0 && (
                    <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 italic">No locations found in current leads</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-8 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3 transition-colors">
              <button 
                onClick={clearFilters}
                className="flex-1 py-4 btn-3d btn-3d-white text-[10px] font-black uppercase rounded-2xl"
              >
                Reset All
              </button>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-[2] py-4 btn-3d btn-3d-indigo text-white text-[10px] font-black uppercase rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-indigo-900/40"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {editingClient && <AddClientModal initialData={editingClient} onClose={() => setEditingClient(null)} onSubmit={(updated) => { onUpdateClient(updated); setEditingClient(null); }} />}
      
      {bookingClient && <BookVisitModal client={bookingClient} clients={clients} properties={properties} onClose={() => setBookingClient(null)} onSubmit={onAddVisit} />}

      {callOutcomeClient && (
        <CallOutcomeModal 
          client={callOutcomeClient} 
          onClose={() => setCallOutcomeClient(null)} 
          onSubmit={(interaction, newPriority) => {
            const updatedInteractions = [interaction, ...(callOutcomeClient.interactions || [])];
            onUpdateClient({ ...callOutcomeClient, interactions: updatedInteractions, priority: newPriority });
            setCallOutcomeClient(null);
            if (interaction.description.includes('Schedule Visit')) {
              setBookingClient(callOutcomeClient);
            }
          }} 
        />
      )}
    </div>
  );
};

const ClientCard: React.FC<{ 
  client: Client, 
  visits: SiteVisit[], 
  onEdit: () => void, 
  onVisit: () => void, 
  onCallTrigger: () => void,
  onUpdateClient: (c: Client) => void 
}> = ({ client, visits, onEdit, onVisit, onCallTrigger, onUpdateClient }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'templates' | 'history'>('profile');
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Call' | 'WhatsApp' | 'Visit'>('All');
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    if (action === 'call') onCallTrigger();
    if (action === 'wa') window.open(`https://wa.me/${client.mobile.replace(/\D/g, '')}`, '_blank');
    if (action === 'visit') onVisit();
  };

  const unifiedLogs = [
    ...(client.interactions || []),
    ...visits.map(v => ({
      id: v.id,
      clientId: v.clientId,
      type: 'Visit' as const,
      description: `Visit: ${v.status} at ${v.propertyName}`,
      timestamp: v.scheduledAt,
      relatedId: v.id
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredLogs = historyFilter === 'All' 
    ? unifiedLogs 
    : unifiedLogs.filter(log => log.type === historyFilter);

  const handleLogClick = (log: any) => {
    if (log.type === 'Visit') {
      navigate('/visits', { state: { highlightVisitId: log.id } });
    } else if (log.type === 'Call') {
      navigate('/'); // Go to dashboard to see Call Log Maintenance
    } else if (log.type === 'WhatsApp') {
      window.open(`https://wa.me/${client.mobile.replace(/\D/g, '')}`, '_blank');
    }
  };

  return (
    <div className="card-neo rounded-[2.5rem] overflow-hidden transition-all duration-300 border border-slate-100 dark:border-slate-700 cursor-pointer hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900" onClick={onEdit}>
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shrink-0">
            {client.firstName[0]}{client.lastName[0]}
          </div>
          <div className="flex-1">
            <h3 className="font-black text-slate-800 dark:text-white text-base uppercase truncate leading-tight transition-colors">{client.firstName} {client.lastName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-lg border uppercase ${client.priority === ClientStatus.HOT ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>{client.priority}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{client.id}</span>
            </div>
          </div>
          <div className="text-right">
             <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{client.nurturingScore}%</span>
             <p className="text-[6px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Score</p>
          </div>
        </div>
      </div>

      <div className="px-6 mb-4">
        <div className="flex gap-2">
          <button onClick={(e) => handleAction(e, 'call')} className="flex-1 py-2 btn-3d btn-3d-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-colors">Call</button>
          <button onClick={(e) => handleAction(e, 'wa')} className="flex-1 py-2 btn-3d btn-3d-emerald text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-colors">WA</button>
          <button onClick={(e) => handleAction(e, 'visit')} className="flex-1 py-2 btn-3d btn-3d-indigo text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-colors">Visit</button>
        </div>
      </div>

      {/* BOTTOM DROPDOWN */}
      <div className="mt-auto border-t border-slate-100 dark:border-slate-700 transition-colors">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className={`w-full py-3 flex items-center justify-center gap-2 transition-all ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <span className="text-[9px] font-black uppercase tracking-widest">{isExpanded ? 'Hide Details' : 'View Full Profile & Log'}</span>
          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-[8px]`}></i>
        </button>

        {isExpanded && (
          <div onClick={(e) => e.stopPropagation()} className="p-6 bg-white dark:bg-slate-800 animate-slide-up transition-colors">
            <div className="flex gap-4 border-b border-slate-100 dark:border-slate-700 mb-5 overflow-x-auto no-scrollbar">
              {['profile', 'templates', 'history'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-3 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === tab ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400' : 'text-slate-400 dark:text-slate-500 border-transparent'}`}>
                  {tab === 'profile' ? 'Profile' : tab === 'templates' ? 'WA Templates' : 'Log History'}
                </button>
              ))}
            </div>

            <div className="min-h-[240px]">
              {activeTab === 'profile' && (
                <div className="grid grid-cols-2 gap-4">
                  <ProfileItem label="Budget" value={`₹${(client.budgetMin/100000).toFixed(0)}L+`} icon="fa-wallet" />
                  <ProfileItem label="Areas" value={client.locations[0] || 'Any'} icon="fa-map-marker-alt" />
                  <ProfileItem label="Config" value={client.configuration[0] || 'Any'} icon="fa-home" />
                  <ProfileItem label="Loan" value={client.loanRequired ? 'Yes' : 'No'} icon="fa-coins" />
                </div>
              )}

              {activeTab === 'templates' && (
                <div className="space-y-2">
                  <TemplateItem label="Introduction" msg="Hi! Glad to connect regarding properties in Nagpur." client={client} />
                  <TemplateItem label="Follow Up" msg="Just following up on our previous discussion." client={client} />
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                    {['All', 'Call', 'Visit', 'WhatsApp'].map(type => (
                      <button 
                        key={type} 
                        onClick={() => setHistoryFilter(type as any)} 
                        className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border transition-all ${historyFilter === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-600'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                    {filteredLogs.map(log => (
                      <div 
                        key={log.id} 
                        onClick={() => handleLogClick(log)}
                        className="p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-2xl flex items-center justify-between group hover:border-indigo-400 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] shrink-0 ${
                            log.type === 'Call' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 
                            log.type === 'Visit' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300'
                          }`}>
                            <i className={`fas ${log.type === 'Call' ? 'fa-phone' : log.type === 'Visit' ? 'fa-calendar-check' : 'fa-sticky-note'}`}></i>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-800 dark:text-white truncate uppercase transition-colors">{log.description}</p>
                            <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">{new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <i className="fas fa-chevron-right text-[8px] text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors"></i>
                      </div>
                    ))}
                    {filteredLogs.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest italic transition-colors">No logs found in this category</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileItem: React.FC<{ label: string, value: string, icon: string }> = ({ label, value, icon }) => (
  <div className="flex gap-2">
    <div className="w-6 h-6 bg-slate-50 dark:bg-slate-700/50 rounded-md flex items-center justify-center text-indigo-400 text-[8px] transition-colors"><i className={`fas ${icon}`}></i></div>
    <div><p className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase leading-none transition-colors">{label}</p><p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 uppercase transition-colors">{value}</p></div>
  </div>
);

const TemplateItem: React.FC<{ label: string, msg: string, client: Client }> = ({ label, msg, client }) => (
  <button onClick={() => window.open(`https://wa.me/${client.mobile}?text=${encodeURIComponent(msg)}`, '_blank')} className="w-full text-left p-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-500 transition-all">
    <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1 block transition-colors">{label}</span>
    <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 italic truncate transition-colors">"{msg}"</p>
  </button>
);

const CallOutcomeModal: React.FC<{ client: Client, onClose: () => void, onSubmit: (i: ClientInteraction, p: ClientStatus) => void }> = ({ client, onClose, onSubmit }) => {
  const [outcome, setOutcome] = useState('');
  const [priority, setPriority] = useState<ClientStatus>(client.priority);
  const [notes, setNotes] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    window.open(`tel:${client.mobile}`, '_self');
    timerRef.current = setInterval(() => {
      if (isTimerRunning) setSeconds(prev => prev + 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning]);

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const handleSave = () => {
    if (!outcome) return;
    onSubmit({
      id: `INT-${Math.random().toString(36).substr(2, 9)}`,
      clientId: client.id,
      type: 'Call',
      description: `Call Log [${formatTime(seconds)}]: ${outcome}${notes ? ` - ${notes}` : ''}`,
      timestamp: new Date().toISOString()
    }, priority);
  };

  const outcomes = ['Contacted', 'Not Answering', 'Busy', 'Call Back', 'Schedule Visit', 'Dropped'];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up transition-colors">
        <div className="p-8 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center transition-colors">
          <div><h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">Call Log</h3><p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mt-1">{client.firstName} {client.lastName}</p></div>
          <button onClick={onClose} className="w-10 h-10 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors"><i className="fas fa-times"></i></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="bg-slate-900 dark:bg-slate-950 rounded-[2rem] p-6 text-center shadow-xl transition-colors">
             <div className="flex items-center justify-center gap-2 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isTimerRunning ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Duration</span>
             </div>
             <h2 className="text-4xl font-mono font-black text-white">{formatTime(seconds)}</h2>
             <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`mt-4 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${isTimerRunning ? 'bg-red-500 text-white shadow-lg shadow-red-900/40' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'}`}>
                {isTimerRunning ? 'End Call Timer' : 'Resume Timer'}
             </button>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase block ml-1">Call Outcome (Mandatory)</label>
            <div className="grid grid-cols-3 gap-2">
              {outcomes.map(o => (
                <button key={o} onClick={() => setOutcome(o)} className={`p-2.5 rounded-xl border text-[8px] font-black uppercase transition-all ${outcome === o ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300 border-slate-100 dark:border-slate-600 hover:border-indigo-200'}`}>{o}</button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase block ml-1">Update Priority & Notes</label>
            <div className="flex gap-4">
               <select value={priority} onChange={e => setPriority(e.target.value as any)} className="flex-1 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-xs font-black dark:text-white outline-none transition-colors"><option value="Hot">Hot</option><option value="Warm">Warm</option><option value="Cold">Cold</option></select>
               <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Summary..." className="flex-[2] p-3 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white outline-none shadow-sm transition-colors" />
            </div>
          </div>
        </div>
        <div className="p-8 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3 transition-colors">
          <button onClick={onClose} className="flex-1 py-4 btn-3d btn-3d-white text-[10px] font-black uppercase rounded-2xl">Discard</button>
          <button onClick={handleSave} disabled={!outcome} className={`flex-[2] py-4 btn-3d text-[10px] font-black uppercase rounded-2xl ${outcome ? 'btn-3d-indigo text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'}`}>Save Disposition</button>
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;
