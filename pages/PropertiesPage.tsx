
import React, { useState, useMemo } from 'react';
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

type SortField = 'price' | 'title' | 'possession';

const PropertiesPage: React.FC<PropertiesPageProps> = ({ properties, clients, searchQuery, onAddProperty, onEditProperty, onAddVisit }) => {
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [filter, setFilter] = useState('All');
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [sharingProperty, setSharingProperty] = useState<Property | null>(null);
  const [bookingProperty, setBookingProperty] = useState<Property | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedProperties = useMemo(() => {
    let result = properties.filter(p => {
      const matchesSearch = (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.location?.area || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'All' || 
                            (filter === 'Ready' && (p.possessionDate === 'Ready' || p.possessionDate === 'Immediate')) ||
                            (filter === 'Plot' && p.type === 'Plot') ||
                            (filter === 'Under Construction' && p.listingType === 'Underconstruction');
      return matchesSearch && matchesFilter;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'price') {
        comparison = (a.financials?.priceMin || 0) - (b.financials?.priceMin || 0);
      } else if (sortField === 'title') {
        comparison = (a.title || '').localeCompare(b.title || '');
      } else if (sortField === 'possession') {
        const dateA = a.possessionDate ? new Date(a.possessionDate).getTime() : 0;
        const dateB = b.possessionDate ? new Date(b.possessionDate).getTime() : 0;
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [properties, searchQuery, filter, sortField, sortOrder]);

  const toggleSelect = (id: string) => {
    setSelectedProperties(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
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

  const getSelectedPropertyDetails = () => {
    return properties.filter(p => selectedProperties.includes(p.id));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight transition-colors">Inventory</h1>
          <p className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest transition-colors">{filteredAndSortedProperties.length} Matches Found</p>
        </div>
        <div className="flex items-center gap-3 relative">
          <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
            {['All', 'Ready', 'Plot', 'Under Construction'].map(chip => (
              <button 
                key={chip}
                onClick={() => setFilter(chip)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all border ${
                  filter === chip 
                  ? 'bg-indigo-600 border-transparent text-white shadow-md' 
                  : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-400 hover:border-indigo-400'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          
          <div className="flex bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-xl p-1 gap-1 relative transition-colors">
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${isSortOpen ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="Sort Inventory"
            >
              <i className="fas fa-sort-amount-down text-[10px]"></i>
            </button>

            {isSortOpen && (
              <div className="absolute top-full mt-2 right-0 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 p-2 animate-slide-up transition-colors">
                {[
                  { id: 'price', label: 'By Price' },
                  { id: 'title', label: 'By Title' },
                  { id: 'possession', label: 'By Possession' }
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
          </div>
        </div>
      </div>

      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedProperties.map(property => (
          <PropertyCard 
            key={property.id} 
            property={property} 
            isSelected={selectedProperties.includes(property.id)}
            onToggle={() => toggleSelect(property.id)}
            onEdit={() => onEditProperty(property)}
            onView={() => setViewingProperty(property)}
            onShare={() => setSharingProperty(property)}
            onBook={() => setBookingProperty(property)}
          />
        ))}
      </main>

      {/* COMPARISON BAR */}
      {selectedProperties.length > 1 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-slide-up w-full max-w-md px-4">
          <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-[2rem] p-4 flex items-center justify-between shadow-2xl border border-white/10 dark:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black">
                {selectedProperties.length}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none">Selected</p>
                <p className="text-sm font-black">Properties</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedProperties([])} className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Clear</button>
              <button 
                onClick={() => setIsComparing(true)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20"
              >
                <i className="fas fa-columns"></i> Compare
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingProperty && (
        <PropertyDetailsModal 
          property={viewingProperty} 
          onClose={() => setViewingProperty(null)}
          onEdit={() => { onEditProperty(viewingProperty); setViewingProperty(null); }}
          onShare={() => setSharingProperty(viewingProperty)}
          onBook={() => setBookingProperty(viewingProperty)}
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
          onSubmit={(v) => { onAddVisit(v); setBookingProperty(null); }}
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
  onEdit: () => void, 
  onView: () => void,
  onShare: () => void,
  onBook: () => void
}> = ({ property, isSelected, onToggle, onEdit, onView, onShare, onBook }) => {
  const mainPhoto = property.media?.photos?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400';

  const nearestPossession = useMemo(() => {
    if (property.possessionDate) return property.possessionDate;
    if (property.towers && property.towers.length > 0) {
      const dates = property.towers
        .map(t => t.possession)
        .filter(Boolean)
        .map(d => new Date(d).getTime());
      if (dates.length > 0) {
        return new Date(Math.min(...dates)).toLocaleDateString([], { month: 'short', year: 'numeric' });
      }
    }
    return 'TBD';
  }, [property.possessionDate, property.towers]);

  const towerCount = property.towers?.length || 0;

  return (
    <div 
      className={`group relative rounded-[2.5rem] bg-white dark:bg-slate-800 p-3 shadow-sm transition-all border cursor-pointer ${isSelected ? 'ring-2 ring-indigo-600 border-transparent' : 'border-transparent dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-xl'}`}
      onClick={onView}
    >
      {/* Select Toggle */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700 hover:scale-105'}`}
          title="Add to Comparison"
        >
          <i className={`fas ${isSelected ? 'fa-check' : 'fa-columns'} text-xs`}></i>
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <div 
          className="w-24 h-24 shrink-0 rounded-2xl bg-cover bg-center bg-slate-100 dark:bg-slate-700 relative overflow-hidden transition-colors" 
          style={{ backgroundImage: `url("${mainPhoto}")` }}
        >
          <div className="absolute top-1 left-1 flex flex-col gap-1">
             <span className="bg-white/95 dark:bg-slate-900/95 backdrop-blur px-1.5 py-0.5 rounded text-[7px] font-black text-slate-800 dark:text-white uppercase shadow-sm">
               {property.type}
             </span>
             {towerCount > 1 && (
               <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[7px] font-black uppercase shadow-sm">
                 {towerCount} Towers
               </span>
             )}
          </div>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-colors">#{property.id}</span>
          <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight mt-1 truncate uppercase transition-colors">{property.title}</h3>
          <div className="flex items-center gap-1 mt-1.5 text-slate-500 dark:text-slate-400 transition-colors">
            <i className="fas fa-map-marker-alt text-[10px]"></i>
            <span className="text-[10px] font-bold truncate">{property.location?.area || 'Unknown Area'}</span>
          </div>
          <div className="mt-2 flex flex-col gap-1">
            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">RERA ID: <span className="text-slate-700 dark:text-slate-300">{property.legal?.reraId || 'Pending'}</span></p>
            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">Completion: <span className="text-indigo-600 dark:text-indigo-400">{property.reraCompletionDate || 'TBD'}</span></p>
          </div>
          <div className="mt-auto flex items-center gap-2">
            <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[8px] font-black uppercase ring-1 ring-inset ${
              property.listingType === 'Sale' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-green-600/20' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 ring-purple-700/10'
            }`}>
              {property.listingType}
            </span>
            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase transition-colors">Est: {nearestPossession}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 py-4 border-t border-b border-slate-50 dark:border-slate-700 transition-colors">
         <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest transition-colors">Pricing</span>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 transition-colors">₹{((property.financials?.priceMin || 0)/100000).toFixed(1)}L - ₹{((property.financials?.priceMax || 0)/100000).toFixed(1)}L</span>
         </div>
         <div className="flex flex-wrap gap-2">
           {(property.configurations || []).slice(0, 3).map((c, idx) => (
             <div key={idx} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-xl p-2 flex flex-col flex-1 min-w-[100px] transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase leading-none transition-colors">{c.bhk}</span>
                  <span className="text-[7px] font-bold text-slate-400">{c.carpetArea} {c.unit}</span>
                </div>
                <span className="text-[10px] font-black text-slate-800 dark:text-white leading-none transition-colors">₹{(c.costing/100000).toFixed(1)}L</span>
             </div>
           ))}
           {(property.configurations || []).length > 3 && (
             <div className="p-2 flex items-center justify-center">
                <span className="text-[9px] font-black text-slate-300 uppercase">+{(property.configurations || []).length - 3} More</span>
             </div>
           )}
         </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onShare(); }}
          className="flex-1 py-3.5 btn-3d btn-3d-white rounded-2xl flex items-center justify-center gap-2 transition-all group"
        >
          <i className="fas fa-share-alt text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"></i>
          <span className="text-[9px] font-black uppercase tracking-widest transition-colors">Share</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onBook(); }}
          className="flex-[1.5] py-3.5 btn-3d btn-3d-indigo text-white rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/40"
        >
          <i className="fas fa-calendar-plus text-sm"></i>
          <span className="text-[9px] font-black uppercase tracking-widest transition-colors">Schedule Visit</span>
        </button>
      </div>
    </div>
  );
};

const PropertyDetailsModal: React.FC<{ 
  property: Property, 
  onClose: () => void, 
  onEdit: () => void,
  onShare: () => void,
  onBook: () => void
}> = ({ property, onClose, onEdit, onShare, onBook }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'configs' | 'amenities' | 'docs'>('overview');
  const [activePhoto, setActivePhoto] = useState(property.media?.photos?.[0] || '');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="bg-white dark:bg-slate-800 w-full max-w-5xl h-[95vh] sm:h-[90vh] rounded-t-[3rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up transition-colors">
        <div className="px-8 pt-8 pb-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <i className="fas fa-building text-xl"></i>
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{property.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">ID: #{property.id}</span>
                   <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></span>
                   <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{property.location?.area}, {property.location?.city}</span>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={onEdit} className="w-10 h-10 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600" title="Edit Property">
                <i className="fas fa-pencil-alt text-xs"></i>
             </button>
             <button onClick={onClose} className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500">
                <i className="fas fa-times"></i>
             </button>
          </div>
        </div>

        <div className="px-8 shrink-0 border-b border-slate-50 dark:border-slate-700 mb-6 overflow-x-auto no-scrollbar flex gap-6">
           {['overview', 'configs', 'amenities', 'docs'].map(t => (
             <button 
               key={t}
               onClick={() => setActiveTab(t as any)}
               className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === t ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
             >
               {t}
             </button>
           ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-0 hide-scrollbar">
           {activeTab === 'overview' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <div className="aspect-video bg-slate-100 dark:bg-slate-700 rounded-[2.5rem] overflow-hidden shadow-inner relative group">
                      <img src={activePhoto} className="w-full h-full object-cover" alt="Main" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"><i className="fas fa-expand text-indigo-600"></i></button>
                      </div>
                   </div>
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                      {(property.media?.photos || []).map((p, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setActivePhoto(p)}
                          className={`w-20 h-20 shrink-0 rounded-2xl overflow-hidden border-4 transition-all ${activePhoto === p ? 'border-indigo-600 scale-95' : 'border-white dark:border-slate-800'}`}
                        >
                           <img src={p} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <DetailBadge label="Type" value={property.type} icon="fa-building" />
                      <DetailBadge label="Listing" value={property.listingType} icon="fa-tag" />
                      <DetailBadge label="Min Price" value={`₹${((property.financials?.priceMin || 0)/100000).toFixed(1)}L`} icon="fa-coins" />
                      <DetailBadge label="RERA ID" value={property.legal?.reraId || 'Pending'} icon="fa-certificate" />
                      <DetailBadge label="Possession" value={property.possessionDate || 'TBD'} icon="fa-calendar-check" />
                      <DetailBadge label="Negotiable" value={property.financials?.negotiable ? 'Yes' : 'No'} icon="fa-comments-dollar" />
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">About Property</h4>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                         {property.description || 'No description available for this property.'}
                      </p>
                   </div>

                   {property.location?.mapLink && (
                     <a href={property.location.mapLink} target="_blank" className="flex items-center justify-between p-5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-[1.5rem] group hover:bg-indigo-600 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm"><i className="fas fa-map-marked-alt"></i></div>
                           <div>
                              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest group-hover:text-white">Location Map</p>
                              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-indigo-100">Click to view on Google Maps</p>
                           </div>
                        </div>
                        <i className="fas fa-external-link-alt text-indigo-300 group-hover:text-white"></i>
                     </a>
                   )}
                </div>
             </div>
           )}

           {activeTab === 'configs' && (
             <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {(property.configurations || []).map((c, idx) => (
                     <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm space-y-4 hover:border-indigo-400 transition-colors">
                        <div className="flex justify-between items-start">
                           <h4 className="text-2xl font-black text-slate-900 dark:text-white">{c.bhk}</h4>
                           <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase">₹{(c.costing/100000).toFixed(1)}L</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <ConfigItem label="Carpet" value={`${c.carpetArea || 0} ${c.unit || 'sq ft'}`} />
                           <ConfigItem label="Bathrooms" value={String(c.bathrooms || 0)} />
                           <ConfigItem label="Parking" value={c.parking || 'None'} />
                           <ConfigItem label="Balconies" value={String(c.balconies || 0)} />
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {activeTab === 'amenities' && (
             <div className="flex flex-wrap gap-4">
                {(property.amenities || []).map(a => (
                  <div key={a} className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-3">
                     <i className="fas fa-check-circle text-indigo-500"></i>
                     <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{a}</span>
                  </div>
                ))}
             </div>
           )}

           {activeTab === 'docs' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(property.media?.documents || []).map((d, idx) => (
                  <a key={idx} href={d.url} target="_blank" className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 transition-colors">
                     <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600"><i className="fas fa-file-pdf"></i></div>
                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest truncate">{d.name}</p>
                     </div>
                     <i className="fas fa-download text-slate-300"></i>
                  </a>
                ))}
                {(property.media?.documents || []).length === 0 && (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
                     <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">No documents attached</p>
                  </div>
                )}
             </div>
           )}
        </div>

        <div className="p-8 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex gap-4 shrink-0 transition-colors">
           <button onClick={onShare} className="flex-1 py-5 btn-3d btn-3d-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3"><i className="fas fa-share"></i> Share Details</button>
           <button onClick={onBook} className="flex-[2] py-5 btn-3d btn-3d-indigo text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-indigo-900/40 flex items-center justify-center gap-3"><i className="fas fa-calendar-check"></i> Schedule Site Visit</button>
        </div>
      </div>
    </div>
  );
};

const DetailBadge: React.FC<{ label: string, value: string, icon: string }> = ({ label, value, icon }) => (
  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center text-center shadow-sm">
     <i className={`fas ${icon} text-indigo-500 mb-2 text-xs`}></i>
     <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
     <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase">{value}</p>
  </div>
);

const ConfigItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
     <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
     <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase leading-none">{value}</p>
  </div>
);

const SharePropertyModal: React.FC<{ property: Property, onClose: () => void }> = ({ property, onClose }) => {
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>(property.configurations?.map(c => c.bhk) || []);

  const toggleConfig = (bhk: string) => {
    setSelectedConfigs(prev => 
      prev.includes(bhk) ? prev.filter(c => c !== bhk) : [...prev, bhk]
    );
  };

  const templates = [
    { 
      name: 'Property Details', 
      msg: `Hi! Check out this amazing property: *${property.title}* at ${property.location?.area || 'N/A'}. 
🏠 Available Configs: ${selectedConfigs.join(', ')}
💰 Range: ₹${((property.financials?.priceMin || 0)/100000).toFixed(1)}L - ₹${((property.financials?.priceMax || 0)/100000).toFixed(1)}L
✨ Amenities: ${(property.amenities || []).slice(0,3).join(', ')}
📍 Location: ${property.location?.mapLink || 'N/A'}
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh] transition-colors">
        <div className="p-8 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center transition-colors">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase transition-colors">Share Unit Details</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 transition-colors">Select configurations to include in the message</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="p-6 border-b dark:border-slate-700 space-y-4 transition-colors">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1 transition-colors">Configurations</label>
          <div className="flex flex-wrap gap-2">
            {(property.configurations || []).map(c => (
              <button 
                key={c.bhk}
                onClick={() => toggleConfig(c.bhk)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  selectedConfigs.includes(c.bhk) ? 'bg-indigo-600 border-transparent text-white shadow-md' : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-400 dark:text-slate-400'
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
              className="w-full text-left p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all group relative overflow-hidden transition-colors"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20">
                <i className="fab fa-whatsapp text-4xl text-emerald-500"></i>
              </div>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 transition-colors">{t.name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic line-clamp-2 transition-colors">"{t.msg}"</p>
              <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter transition-colors">
                <i className="fas fa-paper-plane"></i> Send via WhatsApp
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 transition-colors">
          <button onClick={onClose} className="w-full py-4 btn-3d btn-3d-white rounded-2xl font-black text-[10px] uppercase transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};

const ComparisonRow: React.FC<{ label: string, values: string[], isMultiline?: boolean }> = ({ label, values, isMultiline }) => (
  <tr className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
    <td className="p-6 sticky left-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm z-10 border-r border-slate-50 dark:border-slate-700 font-black transition-colors">
      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">{label}</span>
    </td>
    {values.map((v, i) => (
      <td key={i} className="p-6 text-center">
        <span className={`text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors ${isMultiline ? 'whitespace-pre-line' : ''}`}>
          {v}
        </span>
      </td>
    ))}
  </tr>
);

// Added PropertyComparisonModal to fix the compilation error
const PropertyComparisonModal: React.FC<{ 
  selectedProperties: Property[], 
  onClose: () => void 
}> = ({ selectedProperties, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col animate-slide-up transition-colors">
        <div className="p-8 border-b dark:border-slate-700 flex justify-between items-center transition-colors">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Compare Properties</h2>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Direct feature-by-feature breakdown</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-8 hide-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-6 sticky left-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm z-20 text-left border-r border-slate-50 dark:border-slate-700 min-w-[150px] transition-colors">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Key Features</span>
                </th>
                {selectedProperties.map(p => (
                  <th key={p.id} className="p-6 min-w-[250px] text-center bg-slate-50/30 dark:bg-slate-900/30 transition-colors">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden mb-3 border-4 border-white dark:border-slate-700 shadow-sm">
                        <img src={p.media?.photos?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=200'} className="w-full h-full object-cover" alt="" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase truncate w-full">{p.title}</h4>
                      <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 uppercase tracking-tighter">₹{((p.financials?.priceMin || 0)/100000).toFixed(1)}L - ₹{((p.financials?.priceMax || 0)/100000).toFixed(1)}L</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700 transition-colors">
              <ComparisonRow label="Type" values={selectedProperties.map(p => p.type)} />
              <ComparisonRow label="Possession" values={selectedProperties.map(p => p.possessionDate || 'TBD')} />
              <ComparisonRow label="Area" values={selectedProperties.map(p => p.location?.area || 'N/A')} />
              <ComparisonRow label="Total Units" values={selectedProperties.map(p => String(p.totalUnits))} />
              <ComparisonRow label="RERA ID" values={selectedProperties.map(p => p.legal?.reraId || 'Pending')} />
              <ComparisonRow label="BHK Range" values={selectedProperties.map(p => (p.configurations || []).map(c => c.bhk).join(', '))} />
              <ComparisonRow label="Amenities" values={selectedProperties.map(p => (p.amenities || []).slice(0, 5).join(', '))} isMultiline />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPage;
