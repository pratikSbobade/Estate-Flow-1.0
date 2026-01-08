
import React, { useState } from 'react';
import { SiteVisit, ClientStatus } from '../types';

interface VisitsPageProps {
  visits: SiteVisit[];
  searchQuery: string;
  onUpdateVisit: (updatedVisit: SiteVisit) => void;
  onAddVisit: () => void;
}

const VisitsPage: React.FC<VisitsPageProps> = ({ visits, searchQuery, onUpdateVisit, onAddVisit }) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [activeModal, setActiveModal] = useState<{visit: SiteVisit, type: 'feedback' | 'reschedule' | 'cancel' | 'details'} | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const filteredVisits = visits.filter(v => 
    v.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.propertyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateVisit = (visitId: string, updates: Partial<SiteVisit>) => {
    const visit = visits.find(v => v.id === visitId);
    if (visit) {
      onUpdateVisit({ ...visit, ...updates });
    }
    setActiveModal(null);
  };

  // Calendar Logic
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
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">{filteredVisits.length} Records</p>
        </div>
        <div className="flex bg-white shadow-sm border border-slate-100 rounded-xl p-1 gap-1">
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
                <div key={i} className={`aspect-square rounded-2xl relative border ${day ? 'border-slate-50 bg-white hover:border-indigo-200' : 'border-transparent bg-transparent'} transition-all`}>
                  {day && (
                    <>
                      <span className={`absolute top-2 left-2 text-[10px] font-black ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>{day}</span>
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pt-4 px-1">
                        {dayVisits.slice(0, 2).map(v => (
                          <button 
                            key={v.id}
                            onClick={() => setActiveModal({ visit: v, type: 'details' })}
                            className={`w-full py-0.5 rounded-md text-[7px] font-black truncate px-1 text-white shadow-sm ${v.status === 'Completed' ? 'bg-emerald-500' : v.status === 'Cancelled' ? 'bg-red-400' : 'bg-indigo-600'}`}
                          >
                            {v.clientName.split(' ')[0]}
                          </button>
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
          {filteredVisits.map(visit => (
            <VisitCard key={visit.id} visit={visit} onAction={(type) => setActiveModal({ visit, type })} />
          ))}
          {filteredVisits.length === 0 && (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
              <i className="fas fa-calendar-times text-4xl text-slate-200 mb-4"></i>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No site visits found</p>
            </div>
          )}
        </div>
      )}

      {/* Action Modals */}
      {activeModal?.type === 'details' && (
        <VisitDetailsPopup visit={activeModal.visit} onClose={() => setActiveModal(null)} onAction={(type) => setActiveModal({visit: activeModal.visit, type})} />
      )}
      {activeModal?.type === 'reschedule' && (
        <RescheduleModal visit={activeModal.visit} onClose={() => setActiveModal(null)} onConfirm={(date) => handleUpdateVisit(activeModal.visit.id, { scheduledAt: date, status: 'Rescheduled' })} />
      )}
      {activeModal?.type === 'cancel' && (
        <CancelModal visit={activeModal.visit} onClose={() => setActiveModal(null)} onConfirm={(reason) => handleUpdateVisit(activeModal.visit.id, { status: 'Cancelled' })} />
      )}
      {activeModal?.type === 'feedback' && (
        <FeedbackModal visit={activeModal.visit} onClose={() => setActiveModal(null)} onSubmit={(data) => handleUpdateVisit(activeModal.visit.id, { feedback: data, status: 'Completed' })} />
      )}
    </div>
  );
};

const VisitCard: React.FC<{ visit: SiteVisit, onAction: (type: any) => void }> = ({ visit, onAction }) => {
  const date = new Date(visit.scheduledAt);
  const statusColors = {
    Scheduled: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    Completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Cancelled: 'bg-red-50 text-red-600 border-red-100',
    Rescheduled: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  return (
    <div className="card-neo rounded-[2.5rem] p-6 border border-slate-100 hover:shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-slate-100">
            <span className="text-[10px] font-black text-indigo-600 uppercase leading-none mb-1">{date.toLocaleString('default', { month: 'short' })}</span>
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
              <i className="fas fa-building text-indigo-400"></i> {visit.propertyName}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <i className="fas fa-clock"></i> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:self-start">
          <button onClick={() => onAction('reschedule')} className="flex-1 sm:flex-none px-4 py-2.5 btn-3d btn-3d-white rounded-xl text-[9px] font-black uppercase tracking-widest">Reschedule</button>
          <button onClick={() => onAction('cancel')} className="flex-1 sm:flex-none px-4 py-2.5 btn-3d btn-3d-red text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-red-100">Cancel</button>
          <button onClick={() => onAction('feedback')} className="flex-1 sm:flex-none px-6 py-2.5 btn-3d btn-3d-indigo text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-indigo-100">Feedback</button>
        </div>
      </div>
    </div>
  );
};

const VisitDetailsPopup: React.FC<{ visit: SiteVisit, onClose: () => void, onAction: (type: any) => void }> = ({ visit, onClose, onAction }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-slide-up space-y-6">
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
        <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
          <span className="text-xs font-black text-indigo-600 uppercase">{visit.status}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => { onAction('reschedule'); }} className="py-4 btn-3d btn-3d-white rounded-2xl text-[10px] font-black uppercase">Reschedule</button>
        <button onClick={() => { onAction('feedback'); }} className="py-4 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase">Feedback</button>
      </div>
    </div>
  </div>
);

const RescheduleModal: React.FC<{ visit: SiteVisit, onClose: () => void, onConfirm: (date: string) => void }> = ({ visit, onClose, onConfirm }) => {
  const [date, setDate] = useState(visit.scheduledAt.split(':')[0] + ':' + visit.scheduledAt.split(':')[1]);
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Reschedule Visit</h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">New Date & Time</label>
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs focus:bg-white focus:border-indigo-600 outline-none transition-all shadow-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Reason for Reschedule</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 shadow-sm" placeholder="e.g. Client requested postponement..."></textarea>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 btn-3d btn-3d-white rounded-2xl font-black text-[10px] uppercase">Back</button>
          <button onClick={() => onConfirm(date)} className="flex-1 py-4 btn-3d btn-3d-indigo text-white rounded-2xl font-black text-[10px] uppercase">Confirm</button>
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
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Reason for Cancellation</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-red-500 shadow-sm" placeholder="e.g. Lead dropped interest..."></textarea>
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
              <textarea value={likes} onChange={e => setLikes(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 shadow-sm" placeholder="Vastu, ventilation, etc..."></textarea>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Concerns / Dislikes</label>
              <textarea value={dislikes} onChange={e => setDislikes(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 shadow-sm" placeholder="Price, floor level, etc..."></textarea>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Special Notes (Vastu, Parking, etc.)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 shadow-sm" placeholder="Any specific requirements shared..."></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Closing Probability</label>
              <select value={prob} onChange={e => setProb(e.target.value as ClientStatus)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white focus:border-indigo-600 shadow-sm">
                <option value={ClientStatus.HOT}>Hot</option>
                <option value={ClientStatus.WARM}>Warm</option>
                <option value={ClientStatus.COLD}>Cold</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Next Action</label>
              <select value={nextAction} onChange={e => setNextAction(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white focus:border-indigo-600 shadow-sm">
                <option>Second Visit</option>
                <option>Send Details</option>
                <option>Send Quotation</option>
                <option>Negotiation Meeting</option>
                <option>Drop</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Next Follow-up</label>
              <input type="datetime-local" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs focus:bg-white focus:border-indigo-600 outline-none shadow-sm" />
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
