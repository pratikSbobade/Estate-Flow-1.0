
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { SiteVisit, ClientStatus } from '../types';

interface VisitsPageProps {
  visits: SiteVisit[];
  searchQuery: string;
  onUpdateVisit: (updatedVisit: SiteVisit) => void;
  onAddVisit: () => void;
  onBookAtDate?: (date: string) => void;
}

type SortField = 'date' | 'name' | 'status';

const VisitsPage: React.FC<VisitsPageProps> = ({ visits, searchQuery, onUpdateVisit, onAddVisit, onBookAtDate }) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [activeModal, setActiveModal] = useState<{visit: SiteVisit, type: 'feedback' | 'reschedule' | 'cancel' | 'details'} | null>(null);
  const [dayAgenda, setDayAgenda] = useState<{ date: string, visits: SiteVisit[] } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [highlightedVisitId, setHighlightedVisitId] = useState<string | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { highlightVisitId?: string };
    if (state?.highlightVisitId) {
      navigateToListVisit(state.highlightVisitId);
    }
  }, [location.state]);

  const filteredAndSortedVisits = useMemo(() => {
    let result = visits.filter(v => 
      v.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.propertyName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      } else if (sortField === 'name') {
        comparison = a.clientName.localeCompare(b.clientName);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [visits, searchQuery, sortField, sortOrder]);

  const handleUpdateVisit = (visitId: string, updates: Partial<SiteVisit>) => {
    const visit = visits.find(v => v.id === visitId);
    if (visit) {
      const { reason, ...cleanUpdates } = updates as any;
      
      const historyUpdate = {
        status: cleanUpdates.status || visit.status,
        date: new Date().toISOString(),
        note: reason || (cleanUpdates.status === 'Completed' ? 'Feedback submitted and visit closed' : 'Status updated via Visit Management')
      };

      onUpdateVisit({ 
        ...visit, 
        ...cleanUpdates,
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
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    setTimeout(() => setHighlightedVisitId(null), 3000);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setIsSortOpen(false);
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
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Visit Management</h1>
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">{filteredAndSortedVisits.length} Records</p>
        </div>
        <div className="flex bg-white shadow-sm border border-slate-100 rounded-xl p-1 gap-1 relative">
          <button 
            onClick={() => setIsSortOpen(!isSortOpen)}
            className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${isSortOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="Sort Visits"
          >
            <i className="fas fa-sort-amount-down text-[10px]"></i>
          </button>

          {isSortOpen && (
            <div className="absolute top-full mt-2 right-0 w-44 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-2 animate-slide-up">
              {[
                { id: 'date', label: 'By Date' },
                { id: 'name', label: 'By Client' },
                { id: 'status', label: 'By Status' }
              ].map(opt => (
                <button 
                  key={opt.id}
                  onClick={() => toggleSort(opt.id as SortField)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between ${sortField === opt.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  {opt.label}
                  {sortField === opt.id && <i className={`fas fa-chevron-${sortOrder === 'asc' ? 'up' : 'down'} text-[8px]`}></i>}
                </button>
              ))}
            </div>
          )}

          <div className="w-[1px] bg-slate-100 mx-0.5"></div>

          <button 
            onClick={() => setViewMode('calendar')}
            className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <i className="fas fa-calendar-alt text-[10px]"></i>
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <i className="fas fa-list text-[10px]"></i>
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="card-neo p-6 rounded-[2.5rem] bg-white border border-slate-100">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="font-black text-slate-800 uppercase text-sm tracking-widest">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50">
                <i className="fas fa-chevron-left text-[10px]"></i>
              </button>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50">
                <i className="fas fa-chevron-right text-[10px]"></i>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[9px] font-black text-slate-400 uppercase py-2 tracking-widest">{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              const dateStr = day ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
              const dayVisits = day ? visits.filter(v => v.scheduledAt.startsWith(dateStr)) : [];
              const isToday = day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth();
              
              return (
                <div 
                  key={i} 
                  onClick={() => {
                    if (!day) return;
                    setDayAgenda({ date: dateStr, visits: dayVisits });
                  }}
                  className={`aspect-square rounded-2xl relative border cursor-pointer transition-all ${day ? (isToday ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-50 bg-white hover:border-indigo-200 hover:shadow-sm') : 'border-transparent bg-transparent'}`}
                >
                  {day && (
                    <>
                      <span className={`absolute top-2 left-2 text-[10px] font-black ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>{day}</span>
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pt-4 px-1">
                        {dayVisits.slice(0, 2).map(v => (
                          <div 
                            key={v.id}
                            onClick={(e) => { e.stopPropagation(); navigateToListVisit(v.id); }}
                            className={`w-full py-0.5 rounded-md text-[6px] font-black truncate px-1 text-white shadow-sm text-center transition-transform hover:scale-105 ${v.status === 'Completed' ? 'bg-emerald-500' : v.status === 'Cancelled' ? 'bg-red-400' : 'bg-indigo-600'}`}
                          >
                            {v.clientName.split(' ')[0]}
                          </div>
                        ))}
                        {dayVisits.length > 2 && <span className="text-[7px] font-black text-slate-300">+{dayVisits.length - 2} more</span>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedVisits.map(visit => (
            <VisitCard 
              key={visit.id} 
              visit={visit} 
              isHighlighted={highlightedVisitId === visit.id}
              onAction={(type) => setActiveModal({ visit, type })} 
              onNextAction={() => alert(`Initiating Next Action: ${visit.feedback?.nextAction}`)} 
            />
          ))}
          {filteredAndSortedVisits.length === 0 && (
            <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
              <i className="fas fa-calendar-day text-slate-200 text-4xl mb-4"></i>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No visits matching search</p>
            </div>
          )}
        </div>
      )}

      {dayAgenda && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[210] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-slide-up flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Day Agenda</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(dayAgenda.date).toLocaleDateString([], { dateStyle: 'long' })}</p>
              </div>
              <button onClick={() => setDayAgenda(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="overflow-y-auto space-y-4 pr-2 hide-scrollbar flex-1">
              {dayAgenda.visits.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => navigateToListVisit(v.id)}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group relative cursor-pointer active:scale-95"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-indigo-600 uppercase leading-none">
                      {new Date(v.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-lg border uppercase ${
                      v.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                    }`}>
                      {v.status}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-800 text-sm uppercase leading-tight">{v.clientName}</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">{v.propertyName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeModal?.type === 'details' && (
        <VisitDetailsPopup visit={activeModal.visit} onClose={() => setActiveModal(null)} onAction={(type) => setActiveModal({visit: activeModal.visit, type})} />
      )}
      {activeModal?.type === 'reschedule' && (
        <RescheduleModal visit={activeModal.visit} onClose={() => setActiveModal(null)} onConfirm={(date, reason) => handleUpdateVisit(activeModal.visit.id, { scheduledAt: date, status: 'Rescheduled', reason } as any)} />
      )}
      {activeModal?.type === 'cancel' && (
        <CancelModal visit={activeModal.visit} onClose={() => setActiveModal(null)} onConfirm={(reason) => handleUpdateVisit(activeModal.visit.id, { status: 'Cancelled', reason } as any)} />
      )}
      {activeModal?.type === 'feedback' && (
        <FeedbackModal visit={activeModal.visit} onClose={() => setActiveModal(null)} onSubmit={(data) => handleUpdateVisit(activeModal.visit.id, { feedback: data, status: 'Completed' })} />
      )}
    </div>
  );
};

const VisitCard: React.FC<{ visit: SiteVisit, isHighlighted?: boolean, onAction: (type: any) => void, onNextAction: () => void }> = ({ visit, isHighlighted, onAction, onNextAction }) => {
  const [showHistory, setShowHistory] = useState(false);
  const date = new Date(visit.scheduledAt);
  const statusColors = {
    Scheduled: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    Completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Cancelled: 'bg-red-50 text-red-600 border-red-100',
    Rescheduled: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  const isCompleted = visit.status === 'Completed';

  return (
    <div 
      id={`visit-card-${visit.id}`}
      className={`card-neo rounded-[2.5rem] overflow-hidden border transition-all duration-500 ${isHighlighted ? 'ring-4 ring-indigo-500/30 scale-[1.02] border-indigo-400 shadow-2xl' : ''} ${isCompleted ? 'border-emerald-100 bg-emerald-50/10 shadow-none' : 'border-slate-100 hover:shadow-xl'}`}
    >
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-4">
            <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition-colors ${isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
              <span className={`text-[10px] font-black uppercase leading-none mb-1 ${isCompleted ? 'text-emerald-600' : 'text-indigo-600'}`}>{date.toLocaleString('default', { month: 'short' })}</span>
              <span className="text-2xl font-black text-slate-800 leading-none">{date.getDate()}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight truncate">{visit.clientName}</h3>
                <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase ${statusColors[visit.status]}`}>
                  {visit.status}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <i className={`fas fa-building ${isCompleted ? 'text-emerald-400' : 'text-indigo-400'}`}></i> {visit.propertyName}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-clock"></i> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className={`text-[9px] font-black uppercase tracking-widest hover:underline ${isCompleted ? 'text-emerald-600' : 'text-indigo-600'}`}
                >
                  {showHistory ? 'Hide Details' : 'View Full Context'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:self-start">
            {!isCompleted ? (
              <>
                <button onClick={() => onAction('reschedule')} className="flex-1 sm:flex-none px-4 py-2.5 btn-3d btn-3d-white rounded-xl text-[9px] font-black uppercase tracking-widest">Reschedule</button>
                <button onClick={() => onAction('cancel')} className="flex-1 sm:flex-none px-4 py-2.5 btn-3d btn-3d-red text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-red-100">Cancel</button>
                <button onClick={() => onAction('feedback')} className="flex-1 sm:flex-none px-6 py-2.5 btn-3d btn-3d-indigo text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-indigo-100">Feedback</button>
              </>
            ) : (
              <button 
                onClick={onNextAction}
                className="flex-1 sm:flex-none px-6 py-4 btn-3d btn-3d-emerald text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center gap-2"
              >
                <i className="fas fa-arrow-right"></i>
                Perform Next Action: {visit.feedback?.nextAction || 'Follow Up'}
              </button>
            )}
          </div>
        </div>

        {/* Inline Feedback Preview when Completed */}
        {isCompleted && visit.feedback && !showHistory && (
          <div 
            onClick={() => setShowHistory(true)}
            className="mt-4 p-4 bg-white/60 border border-emerald-100 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-emerald-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex text-amber-400 text-[10px]">
                {Array.from({length: 5}).map((_, i) => (
                  <i key={i} className={`fas fa-star ${i < (visit.feedback?.rating || 0) ? 'text-amber-400' : 'text-slate-200'}`}></i>
                ))}
              </div>
              <p className="text-[10px] font-bold text-slate-600 italic line-clamp-1">"{visit.feedback.notes}"</p>
            </div>
            <div className="flex gap-2">
               <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">View Full Context</span>
            </div>
          </div>
        )}
      </div>

      {showHistory && (
        <div className="px-6 pb-6 bg-slate-50/50 border-t border-slate-50 animate-slide-up pt-6 space-y-6">
          {visit.feedback && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Visit Feedback</h4>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex text-amber-400 text-xs">
                        {Array.from({length: 5}).map((_, i) => (
                          <i key={i} className={`fas fa-star ${i < (visit.feedback?.rating || 0) ? 'text-amber-400' : 'text-slate-200'}`}></i>
                        ))}
                      </div>
                      <span className="text-[10px] font-black text-slate-400">({visit.feedback.rating}/5)</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed italic">"{visit.feedback.notes}"</p>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">What they liked</p>
                        <p className="text-[10px] font-bold text-slate-600">{visit.feedback.likes || 'N/A'}</p>
                      </div>
                      <div className="p-2 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-[8px] font-black text-red-600 uppercase mb-1">Their concerns</p>
                        <p className="text-[10px] font-bold text-slate-600">{visit.feedback.dislikes || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Next Steps</h4>
                  <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-100 text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">Proposed Action</p>
                        <p className="text-sm font-black uppercase">{visit.feedback.nextAction}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                      <div>
                        <p className="text-[8px] font-black text-indigo-200 uppercase">Follow-up Date</p>
                        <p className="text-[10px] font-bold">{visit.feedback.nextFollowUp ? new Date(visit.feedback.nextFollowUp).toLocaleDateString([], { dateStyle: 'medium' }) : 'TBD'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-indigo-200 uppercase">Probability</p>
                        <p className="text-[10px] font-bold">{visit.feedback.probability}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Visit Timeline</h4>
            <div className="space-y-4">
              {(visit.history || [{ status: 'Scheduled', date: visit.scheduledAt, note: 'Initial Appointment' }]).map((h, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm mt-1 shrink-0 ${
                      h.status === 'Completed' ? 'bg-emerald-500' : h.status === 'Cancelled' ? 'bg-red-400' : 'bg-indigo-600'
                    }`}></div>
                    {i < (visit.history?.length || 1) - 1 && <div className="w-[1px] flex-grow bg-slate-200 my-1"></div>}
                  </div>
                  <div className="min-w-0 pb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-700 uppercase">{h.status}</span>
                      <span className="text-[8px] font-bold text-slate-400">{new Date(h.date).toLocaleDateString()}</span>
                    </div>
                    {h.note && <p className="text-[10px] text-slate-500 font-medium italic mt-0.5 line-clamp-1">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VisitDetailsPopup: React.FC<{ visit: SiteVisit, onClose: () => void, onAction: (type: any) => void }> = ({ visit, onClose, onAction }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
    <div className="bg-white w-full max-sm rounded-[2.5rem] shadow-2xl p-8 animate-slide-up space-y-6">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <i className="fas fa-calendar-day text-xl"></i>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{visit.clientName}</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Visit at {visit.propertyName}</p>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date/Time</span>
          <span className="text-xs font-black text-slate-700">{new Date(visit.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {visit.status !== 'Completed' ? (
          <>
            <button onClick={() => { onAction('reschedule'); }} className="py-4 btn-3d btn-3d-white rounded-2xl text-[10px] font-black uppercase">Reschedule</button>
            <button onClick={() => { onAction('feedback'); }} className="py-4 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase">Feedback</button>
          </>
        ) : (
          <button onClick={onClose} className="col-span-2 py-4 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase">Close Window</button>
        )}
      </div>
    </div>
  </div>
);

const RescheduleModal: React.FC<{ visit: SiteVisit, onClose: () => void, onConfirm: (date: string, reason: string) => void }> = ({ visit, onClose, onConfirm }) => {
  const [date, setDate] = useState(visit.scheduledAt.split(':')[0] + ':' + (visit.scheduledAt.split(':')[1] || '00'));
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Reschedule Visit</h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">New Date & Time</label>
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none shadow-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Reason</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none shadow-sm" placeholder="Reason..."></textarea>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 btn-3d btn-3d-white rounded-2xl font-black text-[10px] uppercase">Back</button>
          <button onClick={() => onConfirm(date, reason)} className="flex-1 py-4 btn-3d btn-3d-indigo text-white rounded-2xl font-black text-[10px] uppercase">Confirm</button>
        </div>
      </div>
    </div>
  );
};

const CancelModal: React.FC<{ visit: SiteVisit, onClose: () => void, onConfirm: (reason: string) => void }> = ({ visit, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cancel Visit</h3>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Reason</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none shadow-sm" placeholder="Reason..."></textarea>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 btn-3d btn-3d-white rounded-2xl font-black text-[10px] uppercase">Keep Visit</button>
          <button onClick={() => onConfirm(reason)} className="flex-1 py-4 btn-3d btn-3d-red text-white rounded-2xl font-black text-[10px] uppercase">Cancel Now</button>
        </div>
      </div>
    </div>
  );
};

const FeedbackModal: React.FC<{ visit: SiteVisit, onClose: () => void, onSubmit: (data: any) => void }> = ({ visit, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [likes, setLikes] = useState('');
  const [dislikes, setDislikes] = useState('');
  const [prob, setProb] = useState(ClientStatus.WARM);
  const [nextAction, setNextAction] = useState('Second Visit');
  const [nextDate, setNextDate] = useState('');

  const handleSubmit = () => {
    onSubmit({
      rating, notes, likes, dislikes, probability: prob, nextAction, nextFollowUp: nextDate, attachments: [], outcome: 'Visit completed successfully'
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Visit Feedback</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{visit.clientName} • {visit.propertyName}</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 hide-scrollbar">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Overall Impression (1-5)</label>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRating(star)} className={`w-14 h-14 rounded-2xl btn-3d transition-all flex items-center justify-center text-xl ${star <= rating ? 'btn-3d-amber text-white' : 'btn-3d-white text-slate-300'}`}>
                  <i className="fas fa-star"></i>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">What did client like?</label>
              <textarea value={likes} onChange={e => setLikes(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none shadow-sm"></textarea>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Concerns / Dislikes</label>
              <textarea value={dislikes} onChange={e => setDislikes(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none shadow-sm"></textarea>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Closing Probability</label>
              <select value={prob} onChange={e => setProb(e.target.value as ClientStatus)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none shadow-sm">
                <option value={ClientStatus.HOT}>Hot</option>
                <option value={ClientStatus.WARM}>Warm</option>
                <option value={ClientStatus.COLD}>Cold</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Next Action</label>
              <select value={nextAction} onChange={e => setNextAction(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none shadow-sm">
                <option>Second Visit</option>
                <option>Send Details</option>
                <option>Send Quotation</option>
                <option>Negotiation Meeting</option>
                <option>Drop</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Next Follow-up</label>
              <input type="datetime-local" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none shadow-sm" />
            </div>
          </div>
        </div>

        <div className="p-8 border-t bg-slate-50 flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 btn-3d btn-3d-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest">Discard</button>
          <button onClick={handleSubmit} className="flex-[2] py-5 btn-3d btn-3d-indigo text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-indigo-100">Submit Feedback</button>
        </div>
      </div>
    </div>
  );
};

export default VisitsPage;
