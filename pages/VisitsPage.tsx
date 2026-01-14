import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SiteVisit, ClientStatus, Client, Property, ClientInteraction, ResourceType, ResourceAction } from '../types';
import BookVisitModal from '../components/BookVisitModal';

interface VisitsPageProps {
  visits: SiteVisit[];
  searchQuery: string;
  // Support async handlers from App
  onUpdateVisit: (updatedVisit: SiteVisit) => void | Promise<void>;
  onAddVisit: (visit: SiteVisit) => void | Promise<void>;
  onManualAddClick: () => void;
  clients: Client[];
  properties: Property[];
  onUpdateClient: (client: Client) => void | Promise<void>;
  // Add missing checkPermission prop
  checkPermission: (resource: ResourceType, action?: ResourceAction) => boolean;
}

const VisitsPage: React.FC<VisitsPageProps> = ({ 
  visits, 
  searchQuery, 
  onUpdateVisit, 
  onAddVisit, 
  onManualAddClick,
  clients,
  properties,
  onUpdateClient,
  checkPermission
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [activeModal, setActiveModal] = useState<{visit: SiteVisit, type: 'feedback' | 'reschedule' | 'cancel' | 'details' | 'share_details' | 'schedule_second'} | null>(null);
  const [dayAgenda, setDayAgenda] = useState<{ date: string, visits: SiteVisit[] } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [highlightedVisitId, setHighlightedVisitId] = useState<string | null>(null);
  const [bookingRequest, setBookingRequest] = useState<{client: Client, property: Property} | null>(null);
  
  // Dropdown filter states
  const [isNextActionDropdownOpen, setIsNextActionDropdownOpen] = useState(false);
  const [nextActionFilter, setNextActionFilter] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { highlightVisitId?: string };
    if (state?.highlightVisitId) {
      navigateToListVisit(state.highlightVisitId);
    }
  }, [location.state]);

  // Handle outside click for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNextActionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nextActionStats = useMemo(() => {
    const stats: Record<string, number> = { 'Pending Feedback': 0 };
    visits.forEach(v => {
      if (v.status === 'Completed' && v.feedback?.nextAction) {
        stats[v.feedback.nextAction] = (stats[v.feedback.nextAction] || 0) + 1;
      } else {
        stats['Pending Feedback'] = (stats['Pending Feedback'] || 0) + 1;
      }
    });
    return stats;
  }, [visits]);

  const uniqueNextActions = useMemo(() => {
    return Object.keys(nextActionStats).filter(a => a !== 'Pending Feedback').sort();
  }, [nextActionStats]);

  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const matchesSearch = v.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           v.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const action = (v.status === 'Completed' && v.feedback?.nextAction) ? v.feedback.nextAction : 'Pending Feedback';
      const matchesAction = !nextActionFilter || action === nextActionFilter;

      return matchesSearch && matchesAction;
    });
  }, [visits, searchQuery, nextActionFilter]);

  const groupedByClient = useMemo(() => {
    const groups: Record<string, { client: Client | undefined, visits: SiteVisit[] }> = {};
    filteredVisits.forEach(v => {
      if (!groups[v.clientId]) {
        groups[v.clientId] = { 
          client: clients.find(c => c.id === v.clientId),
          visits: [] 
        };
      }
      groups[v.clientId].visits.push(v);
    });

    Object.values(groups).forEach(g => {
      // Fix: changed a.timestamp to a.scheduledAt as SiteVisit does not have timestamp property
      g.visits.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    });

    return Object.values(groups).sort((a, b) => {
       const dateA = a.visits[0] ? new Date(a.visits[0].scheduledAt).getTime() : 0;
       const dateB = b.visits[0] ? new Date(b.visits[0].scheduledAt).getTime() : 0;
       return dateB - dateA;
    });
  }, [filteredVisits, clients]);

  const handleUpdateVisit = (visitId: string, updates: Partial<SiteVisit>) => {
    const visit = visits.find(v => v.id === visitId);
    if (visit) {
      const historyUpdate = {
        status: (updates.status as string) || visit.status,
        date: new Date().toISOString(),
        note: (updates as any).reason || 'Status updated via Visit Manager'
      };

      onUpdateVisit({ 
        ...visit, 
        ...updates,
        history: [...(visit.history || []), historyUpdate]
      });
    }
    setActiveModal(null);
  };

  const navigateToListVisit = (visitId: string) => {
    setViewMode('list');
    setDayAgenda(null);
    setHighlightedVisitId(visitId);
    setTimeout(() => {
      const element = document.getElementById(`visit-card-${visitId}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    setTimeout(() => setHighlightedVisitId(null), 3000);
  };

  const handlePerformNextAction = (visit: SiteVisit) => {
    if (!visit.feedback) return;
    const { nextAction } = visit.feedback;

    const selClient = clients.find(c => c.id === visit.clientId);
    const selProperty = properties.find(p => p.id === visit.propertyId);

    if (['Second Visit', 'Negotiation Meeting'].includes(nextAction)) {
      if (selClient && selProperty) {
        setBookingRequest({ client: selClient, property: selProperty });
      }
    } else if (nextAction === 'Deal') {
      setActiveModal({ visit, type: 'feedback' });
    } else if (['Send Details', 'Send Quotation'].includes(nextAction)) {
      setActiveModal({ visit, type: 'share_details' });
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const days = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return day > 0 && day <= days ? day : null;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsNextActionDropdownOpen(!isNextActionDropdownOpen)}
            className="text-left group transition-all"
          >
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                {nextActionFilter || 'Visit Management'}
              </h1>
              <i className={`fas fa-chevron-down text-[10px] text-slate-400 group-hover:text-indigo-600 transition-transform duration-300 ${isNextActionDropdownOpen ? 'rotate-180' : ''}`}></i>
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">
              {filteredVisits.length} Records in Pipeline {nextActionFilter && '(Filtered)'}
            </p>
          </button>

          {isNextActionDropdownOpen && (
            <div className="absolute top-full left-0 mt-3 w-72 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700 z-[100] p-2 animate-slide-up">
              <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-700 mb-2">
                <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Filter by Next Action</p>
              </div>
              
              <button 
                onClick={() => { setNextActionFilter(null); setIsNextActionDropdownOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${!nextActionFilter ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                All Pipeline
                <span className={`px-2 py-0.5 rounded-full text-[8px] ${!nextActionFilter ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>{visits.length}</span>
              </button>

              <button 
                onClick={() => { setNextActionFilter('Pending Feedback'); setIsNextActionDropdownOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between mt-1 ${nextActionFilter === 'Pending Feedback' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                Pending Feedback
                <span className={`px-2 py-0.5 rounded-full text-[8px] ${nextActionFilter === 'Pending Feedback' ? 'bg-white/20 text-white' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600'}`}>
                  {nextActionStats['Pending Feedback'] || 0}
                </span>
              </button>

              {uniqueNextActions.map(action => (
                <button 
                  key={action}
                  onClick={() => { setNextActionFilter(action); setIsNextActionDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between mt-1 ${nextActionFilter === action ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  {action}
                  <span className={`px-2 py-0.5 rounded-full text-[8px] ${nextActionFilter === action ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                    {nextActionStats[action]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-xl p-1 gap-1">
          <button onClick={() => setViewMode('calendar')} className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center ${viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50'}`} aria-label="Calendar View"><i className="fas fa-calendar-alt text-[11px]"></i></button>
          <button onClick={() => setViewMode('list')} className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50'}`} aria-label="List View"><i className="fas fa-id-card text-[11px]"></i></button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="space-y-6">
          <div className="card-neo p-6 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="font-black text-slate-800 dark:text-white uppercase text-sm tracking-widest">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
              <div className="flex gap-2">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="w-8 h-8 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"><i className="fas fa-chevron-left text-[10px]"></i></button>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="w-8 h-8 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"><i className="fas fa-chevron-right text-[10px]"></i></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-[9px] font-black text-slate-400 uppercase py-2">{d}</div>)}
              {calendarDays.map((day, i) => {
                const dateStr = day ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                const dayVisits = day ? visits.filter(v => v.scheduledAt.startsWith(dateStr)) : [];
                const isToday = day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth();
                const hasVisits = dayVisits.length > 0;
                
                return (
                  <div 
                    key={i} 
                    onClick={() => day && setDayAgenda({ date: dateStr, visits: dayVisits })} 
                    className={`aspect-square rounded-2xl relative border cursor-pointer transition-all group ${
                      day ? (
                        isToday ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-50 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-200'
                      ) : 'border-transparent'
                    }`}
                  >
                    {day && (
                      <>
                        <span className={`absolute top-2 left-2 text-[10px] font-black ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>{day}</span>
                        {hasVisits && (
                          <div className="absolute top-2 right-2 flex gap-0.5">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                          </div>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pt-4 px-1">
                          {dayVisits.slice(0, 2).map(v => (
                            <div key={v.id} className={`w-full py-0.5 rounded-md text-[6px] font-black truncate px-1 text-white text-center shadow-sm ${v.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                              {v.clientName.split(' ')[0]}
                            </div>
                          ))}
                          {dayVisits.length > 2 && <span className="text-[6px] font-black text-slate-300">+{dayVisits.length - 2} more</span>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {dayAgenda && (
            <div className="animate-slide-up">
              <DayAgendaView 
                date={dayAgenda.date} 
                visits={dayAgenda.visits} 
                onClose={() => setDayAgenda(null)} 
                onViewVisit={navigateToListVisit}
                clients={clients}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {groupedByClient.map(group => (
            <ClientVisitGroup 
              key={group.client?.id || Math.random()} 
              group={group} 
              onAction={(visit, type) => setActiveModal({ visit, type })} 
              highlightedVisitId={highlightedVisitId} 
              onNextAction={handlePerformNextAction}
              properties={properties}
            />
          ))}
          {groupedByClient.length === 0 && (
            <div className="py-24 text-center bg-white dark:bg-slate-800 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700">
               <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                 <i className="fas fa-calendar-day text-slate-300 text-3xl"></i>
               </div>
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No visit records found</p>
            </div>
          )}
        </div>
      )}

      {activeModal?.type === 'share_details' && (
        <ShareDetailsModal 
          visit={activeModal.visit} 
          client={clients.find(c => c.id === activeModal.visit.clientId)} 
          property={properties.find(p => p.id === activeModal.visit.propertyId)} 
          onClose={() => setActiveModal(null)} 
        />
      )}
      {activeModal?.type === 'feedback' && (
        <FeedbackModal visit={activeModal.visit} onClose={() => setActiveModal(null)} onSubmit={(data) => handleUpdateVisit(activeModal.visit.id, { feedback: data, status: 'Completed' })} />
      )}
      {activeModal?.type === 'reschedule' && (
        <RescheduleModal visit={activeModal.visit} onClose={() => setActiveModal(null)} onConfirm={(date, reason) => handleUpdateVisit(activeModal.visit.id, { scheduledAt: date, status: 'Rescheduled', reason } as any)} />
      )}
      
      {bookingRequest && (
        <BookVisitModal 
          client={bookingRequest.client}
          property={bookingRequest.property}
          clients={clients}
          properties={properties}
          onClose={() => setBookingRequest(null)}
          onSubmit={(v) => { onAddVisit(v); setBookingRequest(null); }}
        />
      )}
    </div>
  );
};

const DayAgendaView: React.FC<{ 
  date: string, 
  visits: SiteVisit[], 
  onClose: () => void, 
  onViewVisit: (id: string) => void,
  clients: Client[]
}> = ({ date, visits, onClose, onViewVisit, clients }) => {
  const dateObj = new Date(date);
  const displayDate = dateObj.toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="card-neo p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Day Agenda</h3>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">{displayDate}</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 transition-colors">
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="space-y-4">
        {visits.map((visit) => {
          const client = clients.find(c => c.id === visit.clientId);
          return (
            <div 
              key={visit.id} 
              className="group p-5 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-400 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="flex gap-4 min-w-0">
                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <span className="text-xs font-black text-indigo-600">
                    {new Date(visit.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase truncate leading-tight">{visit.clientName}</h4>
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md border uppercase ${
                      visit.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                    }`}>{visit.status}</span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                    <i className="fas fa-building text-[8px] text-slate-400"></i> {visit.propertyName}
                  </p>
                  
                  {client && (
                    <div className="mt-2 flex gap-2">
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                         ₹{(client.budgetMin/100000).toFixed(0)}L+
                       </span>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                         {client.configuration[0] || 'Any BHK'}
                       </span>
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => onViewVisit(visit.id)}
                className="w-full sm:w-auto px-6 py-2.5 btn-3d btn-3d-indigo text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg transition-all"
              >
                Redirect to Schedule <i className="fas fa-arrow-right ml-1 text-[8px]"></i>
              </button>
            </div>
          );
        })}
        {visits.length === 0 && (
          <div className="py-12 text-center bg-slate-50/50 dark:bg-slate-900/20 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
            <i className="fas fa-calendar-times text-slate-200 text-3xl mb-3"></i>
            <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">No meetings recorded for this date</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ClientVisitGroup: React.FC<{ group: any, onAction: any, highlightedVisitId: string | null, onNextAction: any, properties: Property[] }> = ({ group, onAction, highlightedVisitId, onNextAction, properties }) => {
  const navigate = useNavigate();
  const client = group.client as Client | undefined;
  const [isOpen, setIsOpen] = useState(false);

  // Auto-expand if a visit within this group is highlighted
  useEffect(() => {
    if (highlightedVisitId && group.visits.some((v: SiteVisit) => v.id === highlightedVisitId)) {
      setIsOpen(true);
    }
  }, [highlightedVisitId, group.visits]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg uppercase transition-transform active:scale-95">
            {client?.firstName?.[0]}{client?.lastName?.[0]}
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">{client?.firstName} {client?.lastName}</h3>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="mt-1 flex items-center gap-2 group transition-all"
            >
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-colors ${isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:text-indigo-600'}`}>
                {group.visits.length} Visit{group.visits.length !== 1 ? 's' : ''}
              </span>
              <i className={`fas fa-chevron-down text-[8px] transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-300'}`}></i>
            </button>
          </div>
        </div>
        <button onClick={() => navigate('/clients', { state: { highlightClientId: client?.id } })} className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors self-start sm:self-auto">
          Client Profile <i className="fas fa-external-link-alt text-[8px]"></i>
        </button>
      </div>

      <div className={`space-y-4 overflow-hidden transition-all duration-500 ease-in-out px-1 ${isOpen ? 'max-h-[5000px] opacity-100 py-4' : 'max-h-0 opacity-0'}`}>
        {group.visits.map((visit: SiteVisit) => {
          const isDealClosed = visit.feedback?.nextAction === 'Deal' && visit.feedback?.bookingFormUploaded;
          const property = properties.find(p => p.id === visit.propertyId);
          
          return (
            <div 
              key={visit.id} 
              id={`visit-card-${visit.id}`} 
              className={`card-neo rounded-[2.5rem] p-6 border transition-all duration-500 relative group ${
                highlightedVisitId === visit.id 
                  ? 'ring-4 ring-indigo-500/30 scale-[1.01] border-indigo-400 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.3)]' 
                  : isDealClosed 
                    ? 'border-emerald-500 bg-emerald-50/5 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.1)]' 
                    : 'border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-6">
                <div className="flex gap-5">
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition-colors ${
                    visit.status === 'Completed' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' 
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-indigo-600'
                  }`}>
                    <span className="text-[10px] font-black uppercase leading-none mb-1">{new Date(visit.scheduledAt).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-2xl font-black leading-none">{new Date(visit.scheduledAt).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                      <h4 className="font-black text-slate-800 dark:text-white text-base uppercase leading-tight truncate">{visit.propertyName}</h4>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border uppercase ${
                        isDealClosed 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : visit.status === 'Completed' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400' 
                            : 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-400'
                      }`}>
                        {isDealClosed ? 'Deal Closed' : visit.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-slate-400 dark:text-slate-500">
                      <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                        <i className="fas fa-clock text-indigo-400"></i> {new Date(visit.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {property?.location?.area && (
                        <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 truncate transition-colors">
                          <i className="fas fa-map-marker-alt text-red-400"></i> {property.location.area}
                        </p>
                      )}
                    </div>
                    
                    {client && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                           <i className="fas fa-wallet text-[9px] text-indigo-400"></i>
                           <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter">
                             ₹{(client.budgetMin/100000).toFixed(0)}L - ₹{(client.budgetMax/100000).toFixed(0)}L
                           </span>
                        </div>
                        {client.configuration.length > 0 && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                             <i className="fas fa-home text-[9px] text-indigo-400"></i>
                             <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter">
                               {client.configuration.join(' / ')}
                             </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {visit.status !== 'Completed' ? (
                    <>
                      <button 
                        onClick={() => onAction(visit, 'reschedule')} 
                        className="flex-1 sm:flex-none py-3.5 px-6 btn-3d btn-3d-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        Reschedule
                      </button>
                      <button 
                        onClick={() => onAction(visit, 'feedback')} 
                        className="flex-1 sm:flex-none py-3.5 px-8 btn-3d btn-3d-indigo text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg transition-all"
                      >
                        Log Feedback
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => onNextAction(visit)} 
                      className={`flex-1 sm:flex-none py-3.5 px-8 btn-3d rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all ${
                        isDealClosed ? 'btn-3d-emerald text-white' : 'btn-3d-indigo text-white'
                      }`}
                    >
                      {isDealClosed ? (
                        <><i className="fas fa-trophy text-sm"></i> Deal Record 🎉</>
                      ) : (
                        <><i className="fas fa-arrow-right text-sm"></i> Next: {visit.feedback?.nextAction}</>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {visit.status === 'Completed' && visit.feedback && (
                <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30 dark:bg-slate-900/10 rounded-2xl p-4">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors">Client Sentiment & Notes</p>
                    <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed transition-colors">"{visit.feedback.notes || 'No detailed notes provided.'}"</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                       <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 transition-colors">Closing Probability</p>
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                            <p className={`text-xs font-black uppercase tracking-tighter ${
                              visit.feedback.probability === ClientStatus.HOT ? 'text-red-500' : 
                              visit.feedback.probability === ClientStatus.WARM ? 'text-amber-500' : 
                              'text-blue-500'
                            }`}>{visit.feedback.probability}</p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 transition-colors">Visit Rating</p>
                         <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <i key={i} className={`fas fa-star text-[10px] ${i < (visit.feedback?.rating || 0) ? 'text-amber-400' : 'text-slate-200'}`}></i>
                            ))}
                         </div>
                       </div>
                    </div>
                    
                    {visit.feedback.attachments && visit.feedback.attachments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">Site Photos</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                          {visit.feedback.attachments.map((img: string, i: number) => (
                            <div key={i} className="w-12 h-12 shrink-0 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
                              <img src={img} className="w-full h-full object-cover" alt="site upload" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FeedbackModal: React.FC<{ visit: SiteVisit, onClose: () => void, onSubmit: (data: any) => void }> = ({ visit, onClose, onSubmit }) => {
  const [rating, setRating] = useState(visit.feedback?.rating || 5);
  const [outcome, setOutcome] = useState(visit.feedback?.outcome || '');
  const [notes, setNotes] = useState(visit.feedback?.notes || '');
  const [likes, setLikes] = useState(visit.feedback?.likes || '');
  const [dislikes, setDislikes] = useState(visit.feedback?.dislikes || '');
  const [prob, setProb] = useState<ClientStatus>(visit.feedback?.probability || ClientStatus.WARM);
  const [nextAction, setNextAction] = useState(visit.feedback?.nextAction || 'Second Visit');
  const [nextDate, setNextDate] = useState(visit.feedback?.nextFollowUp || '');
  const [attachments, setAttachments] = useState<string[]>(visit.feedback?.attachments || []);
  const [bookingFormUploaded, setBookingFormUploaded] = useState(visit.feedback?.bookingFormUploaded || false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const base64Files = await Promise.all(Array.from(files).map((file: File) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
      });
    }));
    setAttachments(prev => [...prev, ...base64Files]);
  };

  const handleBookingUpload = () => {
    setBookingFormUploaded(true);
  };

  const handleSubmit = () => {
    onSubmit({ rating, outcome, notes, likes, dislikes, probability: prob, nextAction, nextFollowUp: nextDate, attachments, bookingFormUploaded });
  };

  const isClosedDeal = nextAction === 'Deal' && bookingFormUploaded;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] animate-slide-up transition-colors duration-300">
        <div className={`p-8 border-b dark:border-slate-700 flex justify-between items-center transition-colors duration-500 ${isClosedDeal ? 'bg-emerald-600 text-white' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
          <div>
            <h3 className={`text-2xl font-black uppercase tracking-tight ${isClosedDeal ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
              {isClosedDeal ? '🎉 Congratulations! Deal Closed' : 'Visit Feedback'}
            </h3>
            <p className={`text-[10px] font-black uppercase mt-1 ${isClosedDeal ? 'text-emerald-100' : 'text-slate-400'}`}>Lead: {visit.clientName} • {visit.propertyName}</p>
          </div>
          <button onClick={onClose} className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors ${isClosedDeal ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth">
          {isClosedDeal && (
            <div className="p-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-[2.5rem] text-center space-y-4 animate-slide-up">
               <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto shadow-inner text-emerald-600">
                 <i className="fas fa-trophy text-4xl"></i>
               </div>
               <div>
                 <h4 className="text-xl font-black text-emerald-700 dark:text-emerald-400 uppercase">Closing Confirmed</h4>
                 <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">The booking form has been successfully recorded for this lead.</p>
               </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase block tracking-widest ml-1">Overall Impression (1-5)</label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)} className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all active:scale-90 ${s <= rating ? 'bg-amber-400 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-700 text-slate-300'}`}>
                  <i className="fas fa-star"></i>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Outcome & Feedback</label><textarea value={outcome} onChange={e => setOutcome(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-colors" placeholder="General visit outcome..."></textarea></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Outcome Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-colors" placeholder="Additional details..."></textarea></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">What they liked</label><textarea value={likes} onChange={e => setLikes(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-colors" placeholder="Features liked..."></textarea></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">What they disliked / Concerns</label><textarea value={dislikes} onChange={e => setDislikes(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-colors" placeholder="Pain points..."></textarea></div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Probability</label><select value={prob} onChange={e => setProb(e.target.value as any)} className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl text-xs font-black dark:text-white outline-none transition-colors"><option value={ClientStatus.HOT}>Hot</option><option value={ClientStatus.WARM}>Warm</option><option value={ClientStatus.COLD}>Cold</option></select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Next Action</label><select value={nextAction} onChange={e => setNextAction(e.target.value as any)} className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl text-xs font-black dark:text-white outline-none transition-colors"><option>Second Visit</option><option>Negotiation Meeting</option><option>Drop</option><option>Deal</option><option>Send Details</option><option>Send Quotation</option></select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Next Follow-up</label><input type="datetime-local" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl text-xs font-bold dark:text-white outline-none transition-colors" /></div>
          </div>

          {nextAction === 'Deal' && (
            <div className={`p-6 border rounded-[2rem] flex items-center justify-between transition-all duration-500 ${bookingFormUploaded ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800' : 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800'}`}>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${bookingFormUploaded ? 'text-emerald-600' : 'text-amber-600'}`}>Booking Form Process</p>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{bookingFormUploaded ? 'Form Uploaded ✅' : 'Required for Deal Closure'}</p>
              </div>
              <button 
                onClick={handleBookingUpload} 
                className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all active:scale-95 ${bookingFormUploaded ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-amber-600 text-white shadow-lg shadow-amber-900/20'}`}
              >
                {bookingFormUploaded ? 'Upload Success' : 'Upload Form'}
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visit Photos / Attachments</label>
              <button onClick={() => fileInputRef.current?.click()} className="text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest hover:underline">+ Add Photos</button>
              <input type="file" ref={fileInputRef} multiple className="hidden" onChange={handleFileUpload} />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {attachments.map((img, i) => (
                <div key={i} className="w-24 h-24 shrink-0 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden relative group">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <i className="fas fa-trash text-white text-xs"></i>
                  </button>
                </div>
              ))}
              {attachments.length === 0 && (
                <div className="w-full py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-[2rem]">
                  <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">No photos attached</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-4 shrink-0 transition-colors">
          <button onClick={onClose} className="flex-1 py-5 btn-3d btn-3d-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all">Discard</button>
          <button 
            onClick={handleSubmit} 
            className={`flex-[2] py-5 btn-3d rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg transition-all ${isClosedDeal ? 'btn-3d-emerald text-white' : 'btn-3d-indigo text-white'}`}
          >
            {isClosedDeal ? 'Save Final Deal' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RescheduleModal: React.FC<{ visit: SiteVisit, title?: string, onClose: () => void, onConfirm: (date: string, reason: string) => void }> = ({ visit, title = "Reschedule Visit", onClose, onConfirm }) => {
  const [date, setDate] = useState(visit.scheduledAt.split(':')[0] + ':' + (visit.scheduledAt.split(':')[1] || '00'));
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6 animate-slide-up transition-colors">
        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
          {title}
        </h3>
        <div className="space-y-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase block ml-1">New Date & Time</label><input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl font-bold text-xs dark:text-white outline-none" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase block ml-1">Notes / Reason</label><textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl text-xs font-bold dark:text-white outline-none" placeholder="Reason for change..."></textarea></div>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 btn-3d btn-3d-white rounded-2xl font-black text-[10px] uppercase">Back</button>
          <button onClick={() => onConfirm(date, reason)} className="flex-1 py-4 btn-3d btn-3d-indigo text-white rounded-2xl font-black text-[10px] uppercase">Confirm</button>
        </div>
      </div>
    </div>
  );
};

const ShareDetailsModal: React.FC<{ visit: SiteVisit, client?: Client, property?: Property, onClose: () => void }> = ({ visit, client, property, onClose }) => {
  if (!client || !property) return null;
  
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>(property.configurations?.map(c => c.bhk) || []);

  const toggleConfig = (bhk: string) => {
    setSelectedConfigs(prev => 
      prev.includes(bhk) ? prev.filter(c => c !== bhk) : [...prev, bhk]
    );
  };

  const templates = [
    { 
      name: 'Brochure & Configuration', 
      msg: `Hi ${client.firstName}! It was great meeting you today at *${property.title}*. 

🏢 Project: ${property.title}
🏠 Selected Configs: ${selectedConfigs.join(', ') || 'Various Options'}
💰 Pricing: ₹${((property.financials?.priceMin || 0)/100000).toFixed(1)}L - ₹${((property.financials?.priceMax || 0)/100000).toFixed(1)}L
📍 Location: ${property.location?.mapLink || 'N/A'}

Looking forward to our next ${visit.feedback?.nextAction || 'discussion'}.` 
    },
    { 
      name: 'Post-Visit Thank You', 
      msg: `Hi ${client.firstName}, thank you for your time today at *${property.title}*. 

Glad you liked the ${visit.feedback?.likes || 'amenities and project layout'}. I've noted your interest in the ${selectedConfigs.join('/')} units. 

I'll keep you posted on the ${visit.feedback?.nextAction || 'next steps'}.` 
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-slide-up space-y-6 transition-colors flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">Share Materials</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Directly to {client.firstName}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-4">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">Selection for Template</label>
          <div className="flex flex-wrap gap-2">
            {(property.configurations || []).map(c => (
              <button 
                key={c.bhk}
                onClick={() => toggleConfig(c.bhk)}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all border ${
                  selectedConfigs.includes(c.bhk) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-400'
                }`}
              >
                {c.bhk}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 overflow-y-auto flex-1 no-scrollbar">
          {templates.map((t, idx) => (
            <button key={idx} onClick={() => { window.open(`https://wa.me/${client.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(t.msg)}`, '_blank'); onClose(); }} className="w-full text-left p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-emerald-500 transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-5">
                 <i className="fab fa-whatsapp text-4xl text-emerald-500"></i>
               </div>
               <p className="text-[10px] font-black text-emerald-600 uppercase mb-2 group-hover:text-emerald-500">{t.name}</p>
               <p className="text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-4 transition-colors leading-relaxed">"{t.msg}"</p>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full py-4 btn-3d btn-3d-white rounded-2xl text-[10px] font-black uppercase">Cancel</button>
      </div>
    </div>
  );
};

export default VisitsPage;