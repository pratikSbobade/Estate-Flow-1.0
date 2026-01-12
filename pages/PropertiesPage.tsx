
import React, { useState } from 'react';
import { Property, Client, SiteVisit, PropertyConfiguration } from '../types';
import BookVisitModal from '../components/BookVisitModal';

interface PropertiesPageProps {
  properties: Property[];
  clients: Client[];
  searchQuery: string;
  onAddProperty: () => void;
  onEditProperty: (property: Property) => void;
  onAddVisit: (newVisit: SiteVisit) => void;
}

const PropertiesPage: React.FC<PropertiesPageProps> = ({ properties, clients, searchQuery, onAddProperty, onEditProperty, onAddVisit }) => {
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [filter, setFilter] = useState('All');
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [sharingProperty, setSharingProperty] = useState<Property | null>(null);
  const [bookingProperty, setBookingProperty] = useState<Property | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || 
                          (filter === 'Ready' && (p.possessionDate === 'Ready' || p.possessionDate === 'Immediate')) ||
                          (filter === 'Plot' && p.type === 'Plot') ||
                          (filter === 'Under Construction' && p.listingType === 'Underconstruction');
    return matchesSearch && matchesFilter;
  });

  const toggleSelect = (id: string) => {
    setSelectedProperties(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const getSelectedPropertyDetails = () => {
    return properties.filter(p => selectedProperties.includes(p.id));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Inventory</h1>
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">{filteredProperties.length} Matches Found</p>
        </div>
        <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
          {['All', 'Ready', 'Plot', 'Under Construction'].map(chip => (
            <button 
              key={chip}
              onClick={() => setFilter(chip)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all border ${
                filter === chip 
                ? 'bg-indigo-600 border-transparent text-white shadow-md' 
                : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-400'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map(property => (
          <PropertyCard 
            key={property.id} 
            property={property} 
            isSelected={selectedProperties.includes(property.id)}
            onToggle={() => toggleSelect(property.id)}
            onViewDetails={() => setViewingProperty(property)}
            onShare={() => setSharingProperty(property)}
            onBook={() => setBookingProperty(property)}
          />
        ))}
      </main>

      {/* COMPARISON BAR */}
      {selectedProperties.length > 1 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-slide-up w-full max-w-md px-4">
          <div className="bg-slate-900 text-white rounded-[2rem] p-4 flex items-center justify-between shadow-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black">
                {selectedProperties.length}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Selected</p>
                <p className="text-sm font-black">Properties</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedProperties([])} className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Clear</button>
              <button 
                onClick={() => setIsComparing(true)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <i className="fas fa-columns"></i> Compare
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingProperty && (
        <PropertyDetailsDrawer 
          property={viewingProperty} 
          onClose={() => setViewingProperty(null)} 
          onEdit={() => { onEditProperty(viewingProperty); setViewingProperty(null); }}
        />
      )}

      {sharingProperty && (
        <SharePropertyModal 
          property={sharingProperty} 
          onClose={() => setSharingProperty(null)} 
        />
      )}

      {bookingProperty && (
        <BookVisitModal 
          property={bookingProperty} 
          clients={clients}
          properties={properties}
          onClose={() => setBookingProperty(null)} 
          onSubmit={onAddVisit}
        />
      )}

      {isComparing && (
        <PropertyComparisonModal 
          selectedProperties={getSelectedPropertyDetails()}
          onClose={() => setIsComparing(false)}
        />
      )}
    </div>
  );
};

const PropertyCard: React.FC<{ 
  property: Property, 
  isSelected: boolean, 
  onToggle: () => void, 
  onViewDetails: () => void,
  onShare: () => void,
  onBook: () => void
}> = ({ property, isSelected, onToggle, onViewDetails, onShare, onBook }) => {
  const mainPhoto = property.media?.photos?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400';

  return (
    <div 
      className={`group relative rounded-[2rem] bg-white p-3 shadow-sm transition-all border ${isSelected ? 'ring-2 ring-indigo-600 border-transparent' : 'border-transparent hover:border-indigo-100 hover:shadow-xl'}`}
    >
      <div className="absolute top-4 right-4 z-10">
        <label className="relative flex items-center justify-center p-1 rounded-full bg-white shadow-md cursor-pointer group/cb">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={onToggle}
            className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-slate-200 bg-white checked:border-indigo-600 checked:bg-indigo-600 transition-all"
          />
          <i className="fas fa-check absolute text-white opacity-0 peer-checked:opacity-100 text-xs pointer-events-none"></i>
        </label>
      </div>

      <div onClick={onViewDetails} className="cursor-pointer">
        <div className="flex gap-4 mb-4">
          <div 
            className="w-24 h-24 shrink-0 rounded-2xl bg-cover bg-center bg-slate-100 relative overflow-hidden" 
            style={{ backgroundImage: `url("${mainPhoto}")` }}
          >
            <div className="absolute top-1 left-1">
               <span className="bg-white/95 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-black text-slate-800 uppercase shadow-sm">
                 {property.type}
               </span>
            </div>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">#{property.id}</span>
            <h3 className="text-base font-black text-slate-900 leading-tight mt-1 truncate uppercase">{property.title}</h3>
            <div className="flex items-center gap-1 mt-1.5 text-slate-500">
              <i className="fas fa-map-marker-alt text-[10px]"></i>
              <span className="text-[10px] font-bold truncate">{property.location.area}</span>
            </div>
            <div className="mt-auto">
              <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[8px] font-black uppercase ring-1 ring-inset ${
                property.listingType === 'Sale' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-purple-50 text-purple-700 ring-purple-700/10'
              }`}>
                {property.listingType}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 py-4 border-t border-b border-slate-50">
           <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Pricing</span>
              <span className="text-xs font-black text-indigo-600">₹{(property.financials.priceMin/100000).toFixed(1)}L - ₹{(property.financials.priceMax/100000).toFixed(1)}L</span>
           </div>
           <div className="flex flex-wrap gap-2">
             {property.configurations.map((c, idx) => (
               <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex flex-col flex-1 min-w-[100px]">
                  <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">{c.bhk}</span>
                  <span className="text-[10px] font-black text-slate-800 leading-none">₹{(c.costing/100000).toFixed(1)}L</span>
               </div>
             ))}
           </div>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onShare(); }}
          className="flex-1 py-3.5 btn-3d btn-3d-white rounded-2xl flex items-center justify-center gap-2 transition-all group"
        >
          <i className="fas fa-share-alt text-[10px] text-slate-400 group-hover:text-indigo-600"></i>
          <span className="text-[9px] font-black uppercase tracking-widest">Share</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onBook(); }}
          className="flex-[1.5] py-3.5 btn-3d btn-3d-indigo text-white rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100"
        >
          <i className="fas fa-calendar-plus text-sm"></i>
          <span className="text-[9px] font-black uppercase tracking-widest">Schedule Visit</span>
        </button>
      </div>
    </div>
  );
};

const SharePropertyModal: React.FC<{ property: Property, onClose: () => void }> = ({ property, onClose }) => {
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>(property.configurations.map(c => c.bhk));

  const toggleConfig = (bhk: string) => {
    setSelectedConfigs(prev => 
      prev.includes(bhk) ? prev.filter(c => c !== bhk) : [...prev, bhk]
    );
  };

  const templates = [
    { 
      name: 'Property Details', 
      msg: `Hi! Check out this amazing property: *${property.title}* at ${property.location.area}. 
🏠 Available Configs: ${selectedConfigs.join(', ')}
💰 Range: ₹${(property.financials.priceMin/100000).toFixed(1)}L - ₹${(property.financials.priceMax/100000).toFixed(1)}L
✨ Amenities: ${property.amenities.slice(0,3).join(', ')}
📍 Location: ${property.location.mapLink}
Interested? Let me know!` 
    },
    { 
      name: 'Schedule Site Visit', 
      msg: `Hi! Would you like to schedule a site visit for *${property.title}*? We have slots available this weekend for the ${selectedConfigs.join('/')} units. Please share your preferred time!` 
    },
    { 
      name: 'Follow-up (Check Details)', 
      msg: `Hi, hope you've gone through the shared details for *${property.title}*. What are your initial thoughts on the ${selectedConfigs.join('/')} configurations?` 
    },
    { 
      name: 'Developer Quality', 
      msg: `I noticed you're considering *${property.title}*. Do you have any doubts regarding the developer quality or their legacy? I can share their track record and project history if needed.` 
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
        <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Share Unit Details</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select configurations to include in the message</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="p-6 border-b space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Configurations</label>
          <div className="flex flex-wrap gap-2">
            {property.configurations.map(c => (
              <button 
                key={c.bhk}
                onClick={() => toggleConfig(c.bhk)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  selectedConfigs.includes(c.bhk) ? 'bg-indigo-600 border-transparent text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                {c.bhk}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
          {templates.map((t, idx) => (
            <button 
              key={idx}
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(t.msg)}`, '_blank')}
              className="w-full text-left p-5 bg-white border border-slate-100 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20">
                <i className="fab fa-whatsapp text-4xl text-emerald-500"></i>
              </div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">{t.name}</p>
              <p className="text-xs text-slate-600 font-medium leading-relaxed italic line-clamp-2">"{t.msg}"</p>
              <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase tracking-tighter">
                <i className="fas fa-paper-plane"></i> Send via WhatsApp
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-6 border-t bg-slate-50">
          <button onClick={onClose} className="w-full py-4 btn-3d btn-3d-white rounded-2xl font-black text-[10px] uppercase">Close</button>
        </div>
      </div>
    </div>
  );
};

const PropertyComparisonModal: React.FC<{ selectedProperties: Property[], onClose: () => void }> = ({ selectedProperties, onClose }) => {
  const handleShareComparison = () => {
    let message = `🏠 *Property Comparison Report*\n\n`;
    selectedProperties.forEach((p, idx) => {
      message += `*${idx + 1}. ${p.title}*\n`;
      message += `📍 Area: ${p.location.area}\n`;
      message += `💰 Range: ₹${(p.financials.priceMin/100000).toFixed(1)}L - ₹${(p.financials.priceMax/100000).toFixed(1)}L\n`;
      message += `📐 Configs: ${p.configurations.map(c => c.bhk).join(', ')}\n`;
      message += `🗓️ Possession: ${p.possessionDate || 'TBD'}\n`;
      message += `-------------------\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="bg-white w-full max-w-6xl h-[95vh] sm:h-[85vh] rounded-t-[3rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        <div className="p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Compare Properties</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Side-by-side analysis of {selectedProperties.length} units</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-x-auto p-4 sm:p-8 hide-scrollbar">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="p-6 text-left w-64 sticky left-0 bg-white z-10">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parameters</span>
                </th>
                {selectedProperties.map(p => (
                  <th key={p.id} className="p-6 min-w-[300px]">
                    <div className="flex flex-col items-center text-center">
                      <div 
                        className="w-full h-32 rounded-[2rem] bg-slate-100 bg-cover bg-center mb-4 shadow-inner" 
                        style={{ backgroundImage: `url("${p.media?.photos?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400'}")` }}
                      ></div>
                      <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">{p.title}</h4>
                      <p className="text-[10px] font-black text-indigo-600 uppercase mt-1">#{p.id}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <ComparisonRow label="Configurations" values={selectedProperties.map(p => p.configurations.map(c => c.bhk).join(', '))} />
              <ComparisonRow label="Price Range" values={selectedProperties.map(p => `₹${(p.financials.priceMin/100000).toFixed(1)}L - ₹${(p.financials.priceMax/100000).toFixed(1)}L`)} />
              <ComparisonRow label="Area / Locality" values={selectedProperties.map(p => p.location.area)} />
              <ComparisonRow label="Property Type" values={selectedProperties.map(p => p.type)} />
              <ComparisonRow label="Possession" values={selectedProperties.map(p => p.possessionDate || 'TBD')} />
              <ComparisonRow label="RERA ID" values={selectedProperties.map(p => p.legal.reraId)} />
              <ComparisonRow label="Amenities" values={selectedProperties.map(p => `${p.amenities.length} Features`)} />
              <ComparisonRow label="Negotiable" values={selectedProperties.map(p => p.financials.negotiable ? '✅ Yes' : '❌ No')} />
              <ComparisonRow label="All Inclusive" values={selectedProperties.map(p => p.financials.allInclusive ? '✅ Yes' : '❌ No')} />
            </tbody>
          </table>
        </div>

        <div className="p-8 border-t bg-slate-50 shrink-0 flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 btn-3d btn-3d-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest">Close View</button>
          <button 
            onClick={handleShareComparison}
            className="flex-[2] py-5 btn-3d btn-3d-indigo text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center gap-3"
          >
            <i className="fab fa-whatsapp text-lg"></i>
            Share Comparison Table
          </button>
        </div>
      </div>
    </div>
  );
};

const ComparisonRow: React.FC<{ label: string, values: string[] }> = ({ label, values }) => (
  <tr className="group hover:bg-slate-50/50 transition-colors">
    <td className="p-6 sticky left-0 bg-white/95 backdrop-blur-sm z-10 border-r border-slate-50 font-black">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </td>
    {values.map((v, i) => (
      <td key={i} className="p-6 text-center">
        <span className="text-xs font-bold text-slate-700">{v}</span>
      </td>
    ))}
  </tr>
);

const PropertyDetailsDrawer: React.FC<{ property: Property, onClose: () => void, onEdit: () => void }> = ({ property, onClose, onEdit }) => {
  const photos = property.media?.photos || [];
  const mainPhoto = photos[0] || 'https://via.placeholder.com/800x450';

  return (
    <div className="fixed inset-0 z-[160] flex items-end sm:items-stretch sm:justify-end">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white w-full sm:max-w-2xl h-[92vh] sm:h-full shadow-2xl overflow-y-auto animate-slide-up sm:animate-none sm:translate-x-0 flex flex-col hide-scrollbar">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-20 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{property.type} • #{property.id}</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mt-1 uppercase">{property.title}</h2>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
            <i className="fas fa-times text-slate-500"></i>
          </button>
        </div>

        <div className="p-8 space-y-12 pb-32">
          {/* Visuals Section */}
          <div className="space-y-4">
            <div 
              className="aspect-video bg-slate-100 rounded-[2.5rem] bg-cover bg-center shadow-inner border border-slate-100" 
              style={{ backgroundImage: `url("${mainPhoto}")` }}
            ></div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {photos.slice(1).map((p, idx) => (
                <div key={idx} className="w-24 h-24 shrink-0 bg-slate-100 rounded-2xl bg-cover bg-center border border-slate-100" style={{ backgroundImage: `url("${p}")` }}></div>
              ))}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <DetailStat label="Type" value={property.type} icon="fa-building" />
            <DetailStat label="Listing" value={property.listingType} icon="fa-tag" color="text-indigo-600" />
            <DetailStat label="Possession" value={property.possessionDate || 'N/A'} icon="fa-calendar-alt" />
            <DetailStat label="Total Units" value={property.totalUnits.toString()} icon="fa-layer-group" />
          </div>

          {/* Basic & About Section */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-[1px] bg-slate-200"></span> About Property
            </h3>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed font-medium">{property.description}</p>
            </div>
          </section>

          {/* Location Details */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-[1px] bg-slate-200"></span> Location & Connectivity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoBox label="Full Address" value={`${property.location.area}, ${property.location.city}, ${property.location.state}`} icon="fa-map-pin" />
              <InfoBox label="Landmark" value={property.location.landmark} icon="fa-landmark" />
            </div>
            <a 
              href={property.location.mapLink} 
              target="_blank" 
              className="w-full py-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
            >
              <i className="fas fa-external-link-alt"></i> View on Google Maps
            </a>
          </section>

          {/* Project Specifications */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-[1px] bg-slate-200"></span> Project Specifications
            </h3>
            <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-50 flex justify-between bg-slate-50/50">
                <span className="text-[10px] font-black text-slate-400 uppercase">RERA Completion</span>
                <span className="text-xs font-black text-slate-700">{property.reraCompletionDate || 'N/A'}</span>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tower Wise Status</p>
                {property.towers.map((t, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{t.name}</span>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{t.possession}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Configurations Section */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-[1px] bg-slate-200"></span> Available Configurations
            </h3>
            <div className="space-y-3">
              {property.configurations.map((c, idx) => (
                <div key={idx} className="bg-white border border-slate-100 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                      <i className="fas fa-vector-square"></i>
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-800 uppercase tracking-tight">{c.bhk}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.carpetArea} {c.unit} Carpet • {c.bathrooms} Bath • {c.balconies} Balcony</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Per Sq {c.unit}</p>
                      <p className="text-xs font-black text-slate-600">₹{c.pricePerSqUnit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Unit Cost</p>
                      <p className="text-lg font-black text-indigo-600">₹{(c.costing/100000).toFixed(1)}L</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Financials Section */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-[1px] bg-slate-200"></span> Financial Terms
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FinancialItem label="Booking Amount" value={`₹${(property.financials.bookingAmount/1000).toFixed(0)}K`} />
              <FinancialItem label="Maintenance" value={`₹${property.financials.maintenanceAmount} / ${property.financials.maintenanceFrequency}`} />
              <FinancialItem label="All Inclusive" value={property.financials.allInclusive ? '✅ YES' : '❌ NO'} />
              <FinancialItem label="Negotiable" value={property.financials.negotiable ? '✅ YES' : '❌ NO'} />
              {property.financials.expectedRent && <FinancialItem label="Expected Rent" value={`₹${property.financials.expectedRent.toLocaleString()}`} />}
            </div>
          </section>

          {/* Legal & Ownership */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-[1px] bg-slate-200"></span> Legal & Compliance
            </h3>
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] space-y-6">
              <div className="grid grid-cols-2 gap-8 border-b border-white/10 pb-6">
                <div>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">RERA ID</p>
                  <p className="text-base font-black tracking-tight">{property.legal.reraId}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Ownership</p>
                  <p className="text-base font-black tracking-tight">{property.legal.ownershipType}</p>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-3">Owner Details</p>
                {property.legal.owners.map((o, idx) => (
                  <div key={idx} className="flex flex-col gap-0.5 mb-2">
                    <p className="text-sm font-black">{o.name}</p>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{o.company}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                <i className="fas fa-shield-check text-emerald-400"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Status: {property.legal.occupancyStatus}</span>
              </div>
            </div>
          </section>

          {/* Amenities & Features */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-[1px] bg-slate-200"></span> Amenities & Lifestyle
            </h3>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map(a => (
                <span key={a} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest">{a}</span>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-3">Furnishing Status</p>
                <div className="flex items-center gap-3">
                  <i className="fas fa-couch text-indigo-600"></i>
                  <span className="text-sm font-black text-slate-800 uppercase">{property.furnishing.status}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {property.furnishing.interiors.map(i => (
                    <span key={i} className="px-2 py-0.5 bg-white border border-slate-100 rounded-lg text-[8px] font-bold text-slate-500 uppercase">{i}</span>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-3">Views</p>
                <div className="flex flex-wrap gap-2">
                  {property.views.map(v => (
                    <span key={v} className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                      <i className="fas fa-eye text-emerald-500 text-[10px]"></i> {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Media Links */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-[1px] bg-slate-200"></span> Documents & Virtual Tour
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MediaButton label="Virtual Tour" icon="fa-video" url={property.media?.videoUrl || ''} color="text-red-500" />
              <MediaButton label="Floor Plan" icon="fa-draw-polygon" url={property.media?.floorPlanUrl || ''} color="text-indigo-500" />
              {property.media?.documents?.map((d, i) => (
                <MediaButton key={i} label={d.name} icon="fa-file-pdf" url={d.url} color="text-slate-600" />
              ))}
            </div>
          </section>

          {/* RM & Source */}
          <section className="p-8 bg-indigo-600 rounded-[2.5rem] text-white">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Dedicated Relationship Manager</h3>
              <span className="px-3 py-1 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-tighter">TAT: {property.source.tat}</span>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center text-3xl font-black border border-white/20">
                {property.source.dedicatedRM[0] || '?'}
              </div>
              <div>
                <p className="text-xl font-black tracking-tight">{property.source.dedicatedRM}</p>
                <p className="text-sm font-bold text-white/60 mb-3">{property.source.rmContact}</p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-indigo-900/40">Call RM</button>
                  <button className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-emerald-900/40">WhatsApp</button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-md border-t border-slate-100 flex gap-4 z-30">
          <button 
            onClick={onEdit} 
            className="flex-1 py-5 btn-3d btn-3d-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <i className="fas fa-edit"></i> Edit Details
          </button>
          <button 
            onClick={() => { onClose(); }} // Add functional redirection if needed
            className="flex-[2] py-5 btn-3d btn-3d-indigo text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200"
          >
            Create Quote
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailStat: React.FC<{ label: string, value: string, icon: string, color?: string }> = ({ label, value, icon, color }) => (
  <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-center flex flex-col items-center">
    <i className={`fas ${icon} text-base mb-2 ${color || 'text-slate-400'}`}></i>
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{label}</p>
    <p className="text-[11px] font-black text-slate-800 leading-none truncate w-full uppercase">{value}</p>
  </div>
);

const InfoBox: React.FC<{ label: string, value: string, icon: string }> = ({ label, value, icon }) => (
  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
      <i className={`fas ${icon} text-indigo-500`}></i>
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs font-black text-slate-800 leading-tight uppercase">{value}</p>
    </div>
  </div>
);

const FinancialItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="px-5 py-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-xs font-black text-slate-700">{value}</span>
  </div>
);

const MediaButton: React.FC<{ label: string, icon: string, url: string, color: string }> = ({ label, icon, url, color }) => (
  <button 
    disabled={!url}
    onClick={() => url && window.open(url, '_blank')}
    className={`p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-3 transition-all ${url ? 'hover:shadow-md hover:border-indigo-100 active:scale-95' : 'opacity-40 cursor-not-allowed'}`}
  >
    <div className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center ${color}`}>
      <i className={`fas ${icon} text-sm`}></i>
    </div>
    <div className="text-left">
      <p className="text-[10px] font-black uppercase tracking-widest leading-none text-slate-800">{label}</p>
      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{url ? 'Available' : 'No Link'}</p>
    </div>
  </button>
);

export default PropertiesPage;
