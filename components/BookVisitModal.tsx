
import React, { useState } from 'react';
import { Property, Client, SiteVisit } from '../types';

interface BookVisitModalProps {
  property?: Property;
  client?: Client;
  properties: Property[];
  clients: Client[];
  onClose: () => void;
  onSubmit: (visit: SiteVisit) => void;
}

const BookVisitModal: React.FC<BookVisitModalProps> = ({ 
  property, 
  client, 
  properties, 
  clients, 
  onClose, 
  onSubmit 
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState(property?.id || '');
  const [selectedClientId, setSelectedClientId] = useState(client?.id || '');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('11:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selProperty = properties.find(p => p.id === selectedPropertyId);
    const selClient = clients.find(c => c.id === selectedClientId);

    if (!selProperty || !selClient || !visitDate) return;

    const newVisit: SiteVisit = {
      id: `SV-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: selClient.id,
      clientName: `${selClient.firstName} ${selClient.lastName}`,
      propertyId: selProperty.id,
      propertyName: selProperty.title,
      scheduledAt: `${visitDate}T${visitTime}:00`,
      status: 'Scheduled'
    };

    onSubmit(newVisit);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up p-8 space-y-6">
        <div className="flex items-center gap-4 mb-2">
           <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
             <span className="material-symbols-outlined text-2xl">event_available</span>
           </div>
           <div>
             <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Schedule Visit</h3>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
               {client ? `For ${client.firstName} ${client.lastName}` : property ? `For ${property.title}` : 'Plan a tour'}
             </p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!client && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Select Client</label>
              <select 
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-600 outline-none transition-all shadow-sm"
              >
                <option value="">Choose a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.id})</option>
                ))}
              </select>
            </div>
          )}

          {!property && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Select Property</label>
              <select 
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-600 outline-none transition-all shadow-sm"
              >
                <option value="">Choose a property...</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.title} - {p.location.area}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Preferred Date</label>
              <input 
                type="date" 
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs focus:bg-white focus:border-indigo-600 outline-none transition-all shadow-sm" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Preferred Time</label>
              <input 
                type="time" 
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs focus:bg-white focus:border-indigo-600 outline-none transition-all shadow-sm" 
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 btn-3d btn-3d-white font-black text-[10px] uppercase rounded-2xl">Cancel</button>
            <button 
              type="submit"
              className="flex-[2] py-4 btn-3d btn-3d-indigo text-white font-black text-[10px] uppercase rounded-2xl shadow-lg shadow-blue-100"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookVisitModal;
