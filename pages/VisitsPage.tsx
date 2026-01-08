
import React, { useState } from 'react';
import { SiteVisit, ClientStatus } from '../types';

interface VisitsPageProps {
  onAddVisit: () => void;
}

const VisitsPage: React.FC<VisitsPageProps> = ({ onAddVisit }) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<{visit: SiteVisit, type: 'feedback' | 'reschedule' | 'cancel'} | null>(null);

  const [visits, setVisits] = useState<SiteVisit[]>([
    {
      id: 'SV-001', clientId: 'CL-1001', clientName: 'Aakash Mehta', propertyId: 'P-501',
      propertyName: 'Godrej Prime Luxury', scheduledAt: '2023-11-20T10:30:00', status: 'Scheduled'
    },
    {
      id: 'SV-002', clientId: 'CL-1002', clientName: 'Shweta Patil', propertyId: 'P-505',
      propertyName: 'Civil Lines Regency', scheduledAt: '2023-11-21T14:00:00', status: 'Rescheduled'
    }
  ]);

  const filteredVisits = visits.filter(v => 
    v.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.propertyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateVisit = (visitId: string, updates: Partial<SiteVisit>) => {
    setVisits(prev => prev.map(v => v.id === visitId ? { ...v, ...updates } : v));
    setActiveModal(null);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Site Visits</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Agenda & Feedback Tracking</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-grow sm:flex-grow-0">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              type="text" 
              placeholder="Search visits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-indigo-500 outline-none w-full sm:w-64 shadow-sm"
            />
          </div>
          <button 
            onClick={onAddVisit}
            className="flex items-center gap-2 px-4 py-2.5 btn-3d btn-3d-indigo text-white rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
          >
            <i className="fas fa-plus"></i>
            <span>Add Visit</span>
          </button>
          <div className="flex bg-white shadow-sm border border-slate-200 rounded-xl p-1 gap-1">
            <button 
              onClick={() => setViewMode('calendar')}
              className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center ${viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className="fas fa-calendar-alt text-xs"></i>
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

      {viewMode === 'calendar' ? (
        <div className="card-neo p-6 rounded-[2rem] bg-white border border-slate-100">
          <div className="grid grid-cols-7 gap-2 mb-8">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-center text-[9px] font-black text-slate-400 uppercase py-1 tracking-widest">{d}</div>
            ))}
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className={`aspect-square flex items-center justify-center rounded-xl relative cursor-pointer btn-3d transition-all ${i + 1 === 20 ? 'btn-3d-indigo text-white shadow-md scale-105' : 'btn-3d-white shadow-none text-slate-700 font-bold'}`}>
                <span className="text-xs">{i + 1}</span>
                { (visits.some(v => new Date(v.scheduledAt).getDate() === i + 1)) && <div className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${i+1 === 20 ? 'bg-white' : 'bg-indigo-400'}`}></div> }
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span> Scheduled for Nov 20
            </h3>
            {filteredVisits.map(visit => (
              <VisitItem key={visit.id} visit={visit} onAction={(type) => setActiveModal({visit, type})} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVisits.map(visit => (
            <div key={visit.id} className="card-neo p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black shadow-md ${visit.status === 'Cancelled' ? 'bg-red-400' : visit.status === 'Completed' ? 'bg-emerald-500' : visit.status === 'Rescheduled' ? 'bg-amber-400' : 'bg-indigo-600'}`}>
                  <i className={`fas ${visit.status === 'Completed' ? 'fa-check' : 'fa-calendar-check'} text-lg`}></i>
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-base tracking-tight leading-none uppercase">{visit.clientName}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{visit.propertyName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button onClick={() => setActiveModal({visit, type:'cancel'})} className="px-4 py-2.5 btn-3d btn-3d-red text-white rounded-xl font-black text-[9px] uppercase">Cancel</button>
                <button onClick={() => setActiveModal({visit, type:'reschedule'})} className="px-4 py-2.5 btn-3d btn-3d-white text-slate-700 rounded-xl font-black text-[9px] uppercase">Reschedule</button>
                <button onClick={() => setActiveModal({visit, type:'feedback'})} className="px-6 py-2.5 btn-3d btn-3d-indigo text-white font-black text-[9px] uppercase rounded-xl">Feedback</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {activeModal?.type === 'reschedule' && (
        <RescheduleModal 
          visit={activeModal.visit} 
          onClose={() => setActiveModal(null)} 
          onConfirm={(date, reason) => handleUpdateVisit(activeModal.visit.id, { scheduledAt: date, status: 'Rescheduled' })} 
        />
      )}
      {activeModal?.type === 'cancel' && (
        <CancelModal 
          visit={activeModal.visit} 
          onClose={() => setActiveModal(null)} 
          onConfirm={(reason) => handleUpdateVisit(activeModal.visit.id, { status: 'Cancelled' })} 
        />
      )}
      {activeModal?.type === 'feedback' && (
        <FeedbackFormModal 
          visit={activeModal.visit} 
          onClose={() => setActiveModal(null)} 
          onSubmit={(feedback) => handleUpdateVisit(activeModal.visit.id, { feedback, status: 'Completed' })} 
        />
      )}
    </div>
  );
};

const VisitItem: React.FC<{ visit: SiteVisit, onAction: (type: 'feedback' | 'reschedule' | 'cancel') => void }> = ({ visit, onAction }) => (
  <div className="p-4 bg-slate-50/50 rounded-[1.75rem] border-2 border-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-white transition-all border border-slate-100/50">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex flex-col items-center justify-center shrink-0 border border-slate-100">
        <span className="text-[8px] font-black text-indigo-600 uppercase leading-none mb-0.5">Nov</span>
        <span className="text-xl font-black text-slate-800 leading-none">20</span>
      </div>
      <div>
        <h4 className="font-black text-slate-800 tracking-tight leading-none text-sm uppercase">{visit.clientName}</h4>
        <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 mt-1.5">
          <i className="fas fa-clock text-indigo-400"></i> 10:30 AM • {visit.propertyName}
        </p>
      </div>
    </div>
    <div className="flex gap-2">
      <button onClick={() => onAction('cancel')} className="w-10 h-10 btn-3d btn-3d-red text-white rounded-xl flex items-center justify-center transition-all" title="Cancel Tour">
        <i className="fas fa-times text-sm"></i>
      </button>
      <button onClick={() => onAction('reschedule')} className="px-4 py-2.5 btn-3d btn-3d-white text-slate-600 text-[9px] font-black uppercase rounded-xl transition-all">Reschedule</button>
      <button onClick={() => onAction('feedback')} className="px-7 py-2.5 btn-3d btn-3d-indigo text-white text-[9px] font-black uppercase rounded-xl">Feedback</button>
    </div>
  </div>
);

const RescheduleModal: React.FC<{ visit: SiteVisit, onClose: () => void, onConfirm: (date: string, reason: string) => void }> = ({ visit, onClose, onConfirm }) => {
  const [date, setDate] = useState(visit.scheduledAt.split('.')[0]);
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up p-8 space-y-6">
        <div className="flex items-center gap-4 mb-2">
           <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
             <i className="fas fa-calendar-day text-xl"></i>
           </div>
           <div>
             <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Reschedule Tour</h3>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Client: {visit.clientName}</p>
           </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">New Date & Time</label>
            <input 
              type="datetime-local" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-600 outline-none transition-all shadow-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Reason for Rescheduling</label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold focus:bg-white outline-none focus:border-indigo-600 transition-all shadow-sm" 
              rows={3} 
              placeholder="e.g. Client requested a change due to travel..."
            ></textarea>
          </div>
        </div>
        <div className="flex gap-4 pt-2">
          <button onClick={onClose} className="flex-1 py-4 btn-3d btn-3d-white font-black text-[10px] uppercase rounded-2xl">Dismiss</button>
          <button 
            disabled={!reason || !date}
            onClick={() => onConfirm(date, reason)} 
            className="flex-[2] py-4 btn-3d btn-3d-indigo text-white font-black text-[10px] uppercase rounded-2xl disabled:opacity-50"
          >
            Confirm Update
          </button>
        </div>
      </div>
    </div>
  );
};

const CancelModal: React.FC<{ visit: SiteVisit, onClose: () => void, onConfirm: (reason: string) => void }> = ({ visit, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up p-8 space-y-6 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl shadow-xl shadow-red-50 mb-2">
          <i className="fas fa-calendar-times"></i>
        </div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Cancel Tour Request</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed px-4">You are about to cancel the tour for <b className="text-slate-800">{visit.clientName}</b> at <b className="text-slate-800">{visit.propertyName}</b>. This action is irreversible.</p>
        
        <div className="text-left space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Cancellation Reason</label>
          <textarea 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-left focus:bg-white outline-none focus:border-red-500 transition-all shadow-sm" 
            rows={3} 
            placeholder="Please specify why this visit was cancelled..."
          ></textarea>
        </div>
        
        <div className="flex gap-4 pt-2">
          <button onClick={onClose} className="flex-1 py-4 btn-3d btn-3d-white font-black text-[10px] uppercase rounded-2xl">Keep Tour</button>
          <button 
            disabled={!reason}
            onClick={() => onConfirm(reason)} 
            className="flex-[2] py-4 btn-3d btn-3d-red text-white font-black text-[10px] uppercase rounded-2xl disabled:opacity-50"
          >
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const FeedbackFormModal: React.FC<{ visit: SiteVisit, onClose: () => void, onSubmit: (feedback: any) => void }> = ({ visit, onClose, onSubmit }) => {
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    notes: '',
    outcome: '',
    likes: '',
    dislikes: '',
    probability: ClientStatus.WARM,
    nextAction: 'Second Visit',
    nextFollowUp: '',
    attachments: []
  });

  const handleSubmit = () => {
    onSubmit(feedbackData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-none sm:rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col my-auto max-h-screen sm:max-h-[90vh]">
        <div className="p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-[0_8px_20px_-5px_#4f46e5]">
              <i className="fas fa-file-signature text-xl"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Visit Feedback</h3>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Tour with {visit.clientName} • {visit.propertyName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 btn-3d btn-3d-white rounded-full flex items-center justify-center text-slate-400">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-10 hide-scrollbar scroll-smooth">
          {/* Rating Section */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Overall Client Impression</label>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <button 
                  key={i} 
                  onClick={() => setFeedbackData({...feedbackData, rating: i})} 
                  className={`w-14 h-14 btn-3d rounded-2xl transition-all flex flex-col items-center justify-center ${
                    i <= feedbackData.rating ? 'btn-3d-amber text-white scale-110' : 'btn-3d-white'
                  }`}
                >
                  <i className="fas fa-star text-base"></i>
                  <span className="text-[8px] font-black mt-1">{i}</span>
                </button>
              ))}
              <div className="ml-auto flex items-center px-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-black text-slate-700 tracking-tight uppercase">Rating: {feedbackData.rating}/5</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <FeedbackTextarea 
              label="Special Notes (Vastu, Floor, Parking etc.)" 
              placeholder="e.g. Client requested East facing 2nd floor, highly Vastu conscious..." 
              value={feedbackData.notes}
              onChange={(v) => setFeedbackData({...feedbackData, notes: v})}
            />
            <FeedbackTextarea 
              label="Visit Outcome & Context" 
              placeholder="e.g. Detailed presentation done, client showed high interest in amenities..." 
              value={feedbackData.outcome}
              onChange={(v) => setFeedbackData({...feedbackData, outcome: v})}
            />
            <FeedbackTextarea 
              label="What did the client like?" 
              placeholder="e.g. Rooftop pool, modular kitchen finish, location connectivity..." 
              value={feedbackData.likes}
              onChange={(v) => setFeedbackData({...feedbackData, likes: v})}
            />
            <FeedbackTextarea 
              label="Dislikes / Concerns" 
              placeholder="e.g. High maintenance charges, distance from metro station..." 
              value={feedbackData.dislikes}
              onChange={(v) => setFeedbackData({...feedbackData, dislikes: v})}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <FeedbackSelect 
              label="Close Probability" 
              options={['Hot', 'Warm', 'Cold']} 
              value={feedbackData.probability}
              onChange={(v) => setFeedbackData({...feedbackData, probability: v as ClientStatus})}
            />
            <FeedbackSelect 
              label="Next Action Step" 
              options={['Second Visit', 'Send Details', 'Send Quotation', 'Negotiation Meeting', 'Drop']} 
              value={feedbackData.nextAction}
              onChange={(v) => setFeedbackData({...feedbackData, nextAction: v})}
            />
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Next Follow-up Date</label>
              <input 
                type="datetime-local" 
                value={feedbackData.nextFollowUp}
                onChange={(e) => setFeedbackData({...feedbackData, nextFollowUp: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white outline-none transition-all shadow-sm" 
              />
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Visit Documentation & Photos</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="aspect-square border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 btn-3d btn-3d-white shadow-none transition-all cursor-pointer hover:border-indigo-400 hover:text-indigo-600">
                <i className="fas fa-camera text-2xl mb-2"></i>
                <span className="text-[8px] font-black uppercase tracking-widest text-center px-2">Visit Form Photo</span>
              </div>
              <div className="aspect-square border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 btn-3d btn-3d-white shadow-none transition-all cursor-pointer hover:border-indigo-400 hover:text-indigo-600">
                <i className="fas fa-file-upload text-2xl mb-2"></i>
                <span className="text-[8px] font-black uppercase tracking-widest text-center px-2">Registration Screen</span>
              </div>
              {/* Slot for uploaded thumbnails */}
            </div>
          </div>
        </div>

        <div className="p-8 border-t bg-slate-50 flex gap-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-4 btn-3d btn-3d-white font-black text-[10px] uppercase rounded-2xl">Cancel Report</button>
          <button 
            onClick={handleSubmit} 
            className="flex-[2] py-4 btn-3d btn-3d-indigo text-white font-black text-[10px] uppercase rounded-2xl shadow-lg shadow-indigo-100"
          >
            Submit Detailed Report
          </button>
        </div>
      </div>
    </div>
  );
};

const FeedbackTextarea: React.FC<{ label: string, placeholder: string, value: string, onChange: (v: string) => void }> = ({ label, placeholder, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">{label}</label>
    <textarea 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-xs font-semibold focus:bg-white outline-none focus:border-indigo-600 transition-all shadow-sm" 
      rows={3} 
      placeholder={placeholder}
    ></textarea>
  </div>
);

const FeedbackSelect: React.FC<{ label: string, options: string[], value: string, onChange: (v: string) => void }> = ({ label, options, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">{label}</label>
    <div className="relative">
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black appearance-none focus:bg-white outline-none focus:border-indigo-600 transition-all shadow-sm"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[10px]"></i>
    </div>
  </div>
);

export default VisitsPage;
