
import React, { useState } from 'react';
import { Property, PropertyConfiguration } from '../types';

interface PropertiesPageProps {
  properties: Property[];
  onAddProperty: () => void;
}

const PropertiesPage: React.FC<PropertiesPageProps> = ({ properties, onAddProperty }) => {
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All Properties');
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All Properties' || 
                          (filter === 'Residential' && (p.type === 'Apartment' || p.type === 'Villa' || p.type === 'Plot')) ||
                          (filter === 'Commercial' && p.type === 'Commercial') ||
                          (filter === 'For Sale' && p.listingType === 'Sale') ||
                          (filter === 'Under Construction' && p.listingType === 'Underconstruction');
    return matchesSearch && matchesFilter;
  });

  const toggleSelect = (id: string) => {
    setSelectedProperties(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f8]">
      {/* Sub-Header Section */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200 shadow-sm -mx-4 px-4 pt-4">
        {/* Title & Main Actions */}
        <div className="flex items-center justify-between pb-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Properties</h1>
          <button 
            onClick={onAddProperty}
            className="bg-[#136dec] hover:bg-blue-600 text-white rounded-lg w-10 h-10 flex items-center justify-center transition-colors shadow-sm shadow-blue-500/30"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="pb-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input 
                type="text"
                placeholder="Search ID, Title, or Location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-lg border-0 bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-[#136dec] focus:bg-white transition-all"
              />
            </div>
            <button className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar">
          {['All Properties', 'Residential', 'Commercial', 'For Sale', 'Under Construction'].map(chip => (
            <button 
              key={chip}
              onClick={() => setFilter(chip)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                filter === chip 
                ? 'bg-[#136dec]/10 border-[#136dec]/20 text-[#136dec] hover:bg-[#136dec]/20' 
                : 'bg-slate-100 border-transparent text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{chip}</span>
              {filter === chip && chip !== 'All Properties' && (
                <span className="material-symbols-outlined text-[14px]" onClick={(e) => { e.stopPropagation(); setFilter('All Properties'); }}>close</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Feed */}
      <main className="flex flex-col gap-4 py-4 pb-40">
        {filteredProperties.map(property => (
          <PropertyCard 
            key={property.id} 
            property={property} 
            isSelected={selectedProperties.includes(property.id)}
            onToggle={() => toggleSelect(property.id)}
            onViewDetails={() => setViewingProperty(property)}
          />
        ))}

        {filteredProperties.length === 0 && (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
            <p className="mt-2 text-slate-400 text-sm font-medium">No properties found matching your criteria</p>
          </div>
        )}
      </main>

      {/* Property Details Drawer */}
      {viewingProperty && (
        <PropertyDetailsDrawer 
          property={viewingProperty} 
          onClose={() => setViewingProperty(null)} 
        />
      )}

      {/* Floating Action Bar */}
      {selectedProperties.length > 0 && (
        <div className="fixed bottom-24 inset-x-4 z-40 animate-slide-up">
          <div className="flex items-center justify-between bg-slate-900 text-white rounded-xl shadow-2xl p-2 pl-4 border border-slate-700/50">
            <span className="text-sm font-medium">{selectedProperties.length} Selected</span>
            <div className="flex gap-2">
              <button className="bg-[#136dec] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/30">
                <span className="material-symbols-outlined text-[18px]">compare_arrows</span>
                Compare
              </button>
              <button 
                onClick={() => setSelectedProperties([])}
                className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PropertyCard: React.FC<{ 
  property: Property, 
  isSelected: boolean, 
  onToggle: () => void, 
  onViewDetails: () => void 
}> = ({ property, isSelected, onToggle, onViewDetails }) => {
  return (
    <div 
      onClick={onViewDetails}
      className={`group relative rounded-xl bg-white p-3 shadow-sm transition-all border cursor-pointer ${isSelected ? 'ring-2 ring-[#136dec] border-transparent' : 'border-transparent hover:border-slate-200 hover:shadow-md'}`}
    >
      {/* Selection Checkbox (Absolute) */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-3 right-3 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}
      >
        <label className="relative flex items-center justify-center p-1 rounded-full bg-white shadow-sm cursor-pointer">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={onToggle}
            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 bg-white checked:border-[#136dec] checked:bg-[#136dec] transition-all"
          />
          <span className="material-symbols-outlined absolute text-white opacity-0 peer-checked:opacity-100 text-[16px] pointer-events-none">check</span>
        </label>
      </div>

      {/* Card Header: Image & Main Info */}
      <div className="flex gap-3 mb-3">
        <div 
          className="w-24 h-24 shrink-0 rounded-lg bg-cover bg-center bg-no-repeat bg-slate-200" 
          style={{ backgroundImage: `url("${property.media.photos[0] || 'https://via.placeholder.com/150'}")` }}
        ></div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">#{property.id} • {property.type}</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 leading-tight mt-1 truncate">{property.title}</h3>
          <div className="flex items-center gap-1 mt-1 text-slate-600">
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            <span className="text-xs truncate">{property.location.area}, {property.location.city}</span>
          </div>
          <div className="flex gap-2 mt-auto">
            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
              property.listingType === 'Sale' 
              ? 'bg-green-50 text-green-700 ring-green-600/20' 
              : 'bg-purple-50 text-purple-700 ring-purple-700/10'
            }`}>
              {property.listingType}
            </span>
            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
              property.possessionDate === 'Ready' || property.possessionDate === 'Immediate'
              ? 'bg-slate-100 text-slate-600 ring-slate-500/10'
              : 'bg-blue-50 text-blue-700 ring-blue-700/10'
            }`}>
              {property.possessionDate || 'Under Construction'}
            </span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 py-3 border-t border-b border-slate-100">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Possession</span>
          <span className="text-xs font-semibold text-slate-700 truncate">{property.possessionDate || 'TBD'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">{property.type === 'Commercial' ? 'Floors' : 'Towers'}</span>
          <span className="text-xs font-semibold text-slate-700">{property.towers.length}</span>
        </div>
        <div className="flex flex-col mt-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Completion</span>
          <span className="text-xs font-semibold text-slate-700">{property.possessionDate === 'Ready' ? '100%' : '85%'}</span>
        </div>
        <div className="flex flex-col mt-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Total Units</span>
          <span className="text-xs font-semibold text-slate-700">{property.totalUnits}</span>
        </div>
      </div>

      {/* Configurations */}
      <div className="mt-3 space-y-2">
        {property.configurations.slice(0, 2).map((config, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">{config.bhk} <span className="text-slate-500 font-normal">({config.carpetArea} {config.unit})</span></span>
            </div>
            <span className="text-sm font-bold text-[#136dec]">
              ₹{(config.costing / 100000).toFixed(1)}L
            </span>
          </div>
        ))}
      </div>

      {/* View Details Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
        className="w-full mt-3 py-2 text-xs font-black uppercase tracking-widest text-[#136dec] hover:bg-slate-50 rounded-lg border border-dashed border-[#136dec]/30 transition-colors"
      >
        View Full Details
      </button>
    </div>
  );
};

const PropertyDetailsDrawer: React.FC<{ property: Property, onClose: () => void }> = ({ property, onClose }) => {
  return (
    <div className="fixed inset-0 z-[160] flex items-end sm:items-stretch sm:justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Drawer Content */}
      <div className="relative bg-white w-full sm:max-w-xl h-[92vh] sm:h-full shadow-2xl overflow-y-auto animate-slide-up sm:animate-none sm:translate-x-0 flex flex-col hide-scrollbar">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-6 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{property.type} • #{property.id}</span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">{property.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-10 pb-32">
          {/* Main Photo Gallery */}
          <div className="grid grid-cols-1 gap-2">
            <div 
              className="aspect-video bg-slate-100 rounded-3xl bg-cover bg-center shadow-inner"
              style={{ backgroundImage: `url("${property.media.photos[0] || 'https://via.placeholder.com/400x225'}")` }}
            ></div>
            {property.media.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {property.media.photos.slice(1).map((p, idx) => (
                  <div 
                    key={idx} 
                    className="w-24 h-24 shrink-0 bg-slate-100 rounded-2xl bg-cover bg-center" 
                    style={{ backgroundImage: `url("${p}")` }}
                  ></div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <DetailStat label="Type" value={property.type} icon="apartment" />
            <DetailStat label="Status" value={property.listingType} icon="sell" color="text-green-600" />
            <DetailStat label="Possession" value={property.possessionDate || 'N/A'} icon="calendar_today" />
            <DetailStat label="Units" value={property.totalUnits.toString()} icon="groups" />
          </div>

          {/* Description */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-[1px] bg-slate-200"></span> About Property
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {property.description}
            </p>
          </section>

          {/* Location Details */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-[1px] bg-slate-200"></span> Location & Landmarks
            </h3>
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[#136dec]">location_on</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{property.location.area}, {property.location.city}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Landmark: {property.location.landmark}</p>
                <a href={property.location.mapLink} target="_blank" className="text-[11px] font-black text-[#136dec] uppercase mt-3 inline-block hover:underline">View on Map</a>
              </div>
            </div>
          </section>

          {/* Configurations Table */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-[1px] bg-slate-200"></span> Unit Configurations
            </h3>
            <div className="space-y-3">
              {property.configurations.map((c, idx) => (
                <div key={idx} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-[#136dec]/30 transition-colors">
                  <div>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{c.bhk}</p>
                    <p className="text-[11px] text-slate-500 font-bold">{c.carpetArea} {c.unit} Carpet</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-[#136dec]">₹{(c.costing/100000).toFixed(1)}L</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">₹{c.pricePerSqUnit}/Sq</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Financials */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-[1px] bg-slate-200"></span> Financial Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FinancialRow label="Maintenance" value={`₹${property.financials.maintenanceAmount} / ${property.financials.maintenanceFrequency}`} />
              <FinancialRow label="Booking Amount" value={`₹${(property.financials.bookingAmount/1000).toFixed(0)}K`} />
              <FinancialRow label="All Inclusive" value={property.financials.allInclusive ? 'YES' : 'NO'} />
              <FinancialRow label="Negotiable" value={property.financials.negotiable ? 'YES' : 'NO'} />
            </div>
          </section>

          {/* Amenities */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-[1px] bg-slate-200"></span> Key Amenities
            </h3>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map(a => (
                <span key={a} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">{a}</span>
              ))}
            </div>
          </section>

          {/* Source/RM */}
          <section className="p-6 bg-[#136dec] rounded-[2.5rem] text-white">
            <h3 className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] mb-4">Dedicated Relationship Manager</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
                <span className="material-symbols-outlined text-2xl">person</span>
              </div>
              <div>
                <p className="text-lg font-black tracking-tight">{property.source.dedicatedRM}</p>
                <p className="text-xs font-bold text-blue-100">{property.source.rmContact}</p>
                <div className="mt-2 inline-block px-2 py-0.5 bg-white/20 rounded-lg text-[9px] font-black uppercase">TAT: {property.source.tat}</div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => window.open(`tel:${property.source.rmContact}`, '_self')}
                className="flex-1 py-3 bg-white text-[#136dec] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg"
              >
                Call RM
              </button>
              <button 
                className="flex-1 py-3 bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg"
              >
                WhatsApp RM
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 flex gap-3">
          <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[20px]">share</span>
            Share Property
          </button>
          <button className="flex-1 py-4 bg-[#136dec] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            Book Visit
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailStat: React.FC<{ label: string, value: string, icon: string, color?: string }> = ({ label, value, icon, color }) => (
  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center flex flex-col items-center">
    <span className={`material-symbols-outlined text-lg mb-1 ${color || 'text-slate-400'}`}>{icon}</span>
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{label}</p>
    <p className="text-[11px] font-black text-slate-800 leading-none truncate w-full">{value}</p>
  </div>
);

const FinancialRow: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 px-4 bg-slate-50 rounded-xl">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-[11px] font-black text-slate-800">{value}</span>
  </div>
);

export default PropertiesPage;
