
import React, { useState, useRef, useEffect } from 'react';
import { Property, PropertyConfiguration } from '../types';
import { GoogleGenAI } from "@google/genai";

interface AddPropertyModalProps {
  initialData?: Property;
  onClose: () => void;
  onSubmit: (property: Property) => void;
}

const SECTIONS = [
  { id: 'basic', label: '1. Basic Details' },
  { id: 'ai', label: '2. AI Description' },
  { id: 'location', label: '3. Location' },
  { id: 'project', label: '4. Project Specs' },
  { id: 'config', label: '5. Configurations' },
  { id: 'finance', label: '6. Financials' },
  { id: 'legal', label: '7. Ownership' },
  { id: 'amenities', label: '8. Amenities' },
  { id: 'media', label: '9. Media' },
  { id: 'source', label: '10. Source' }
];

const AddPropertyModal: React.FC<AddPropertyModalProps> = ({ initialData, onClose, onSubmit }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTone, setAiTone] = useState<'Professional' | 'Luxury' | 'Urgent' | 'Friendly'>('Professional');
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<Property>>(initialData || {
    id: `P-${Math.floor(1000 + Math.random() * 9000)}`,
    title: '',
    description: '',
    type: 'Apartment',
    listingType: 'Sale',
    possessionDate: '',
    location: { country: 'India', state: '', city: '', area: '', landmark: '', mapLink: '' },
    towers: [{ name: '', possession: '' }],
    totalUnits: 0,
    reraCompletionDate: '',
    configurations: [{
      bhk: '2 BHK', carpetArea: 0, builtUpArea: 0, superBuiltUpArea: 0, unit: 'sq ft',
      pricePerSqUnit: 0, bathrooms: 2, balconies: 1, parking: 'Covered', costing: 0
    }],
    financials: { priceMin: 0, priceMax: 0, allInclusive: true, maintenanceAmount: 0, maintenanceFrequency: 'Monthly', bookingAmount: 0, negotiable: true, expectedRent: 0 },
    legal: { ownershipType: 'Sole Owner', owners: [{ name: '', company: '' }], reraId: '', occupancyStatus: 'Under Construction' },
    amenities: [],
    furnishing: { status: 'Unfurnished', interiors: [] },
    views: [],
    media: { photos: [], videoUrl: '', floorPlanUrl: '', documents: [] },
    source: { dedicatedRM: '', rmContact: '', tat: '' },
    status: 'Available'
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGenerateAI = async () => {
    if (!formData.title || !formData.type) {
      showToast("Please enter a title and type first", "error");
      return;
    }
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Act as a world-class real estate copywriter. Write a ${aiTone} property description for a ${formData.type} named "${formData.title}" located in ${formData.location?.area || 'Nagpur'}. 
      Amenities include: ${formData.amenities?.join(', ') || 'Modern utilities'}. 
      Listing type is ${formData.listingType}. 
      Keep it between 100-150 words. Focus on the USP and lifestyle.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      const text = response.text;
      if (text) {
        handleChange('description', text);
        showToast("AI Description Generated!");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to generate description", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (formData.description) {
      navigator.clipboard.writeText(formData.description);
      showToast("Copied to clipboard!");
    }
  };

  const handleChange = (path: string, value: any) => {
    const keys = path.split('.');
    if (keys.length === 1) {
      setFormData(prev => ({ ...prev, [keys[0]]: value }));
    } else if (keys.length === 2) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: { ...((prev as any)[keys[0]] || {}), [keys[1]]: value }
      }));
    }
  };

  const handleTowerChange = (index: number, field: string, value: any) => {
    const updatedTowers = [...(formData.towers || [])];
    updatedTowers[index] = { ...updatedTowers[index], [field]: value };
    setFormData(prev => ({ ...prev, towers: updatedTowers }));
  };

  const removeTower = (index: number) => {
    if ((formData.towers || []).length <= 1) return;
    setFormData(prev => ({ ...prev, towers: (prev.towers || []).filter((_, i) => i !== index) }));
  };

  const handleConfigChange = (index: number, field: keyof PropertyConfiguration, value: any) => {
    const updatedConfigs = [...(formData.configurations || [])];
    updatedConfigs[index] = { ...updatedConfigs[index], [field]: value };
    
    if (field === 'costing' || field === 'carpetArea') {
      const c = Number(updatedConfigs[index].costing);
      const a = Number(updatedConfigs[index].carpetArea);
      if (a > 0) {
        updatedConfigs[index].pricePerSqUnit = Math.round(c / a);
      }
    }
    
    setFormData(prev => ({ ...prev, configurations: updatedConfigs }));
  };

  const removeConfig = (index: number) => {
    if ((formData.configurations || []).length <= 1) return;
    setFormData(prev => ({ ...prev, configurations: (prev.configurations || []).filter((_, i) => i !== index) }));
  };

  const addTower = () => setFormData(prev => ({ ...prev, towers: [...(prev.towers || []), { name: '', possession: '' }] }));
  
  const addConfig = () => setFormData(prev => ({ 
    ...prev, 
    configurations: [...(prev.configurations || []), { 
      bhk: '1 BHK', carpetArea: 0, builtUpArea: 0, superBuiltUpArea: 0, unit: 'sq ft', 
      pricePerSqUnit: 0, bathrooms: 1, balconies: 1, parking: 'Covered', costing: 0 
    }] 
  }));

  const handleSubmit = () => {
    if (!formData.title || !formData.type) {
      showToast("Missing Title or Property Type", "error");
      scrollToTab('basic');
      return;
    }
    onSubmit(formData as Property);
  };

  const scrollToTab = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(`section-${id}`);
    if (element && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: element.offsetTop - 20, behavior: 'smooth' });
    }
    const navBtn = document.getElementById(`nav-${id}`);
    if (navBtn && navRef.current) {
      navRef.current.scrollTo({ left: navBtn.offsetLeft - 40, behavior: 'smooth' });
    }
  };

  const amenityOptions = ['Lift', 'Security', 'CCTV', 'Power Backup', 'Water Source', 'Garden', 'Clubhouse', 'Gym', 'Swimming Pool', 'Play Area'];
  const viewOptions = ['Road', 'Garden', 'Pool', 'City', 'Open'];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-end sm:items-center justify-center p-0 sm:p-6">
      {toast && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[300] animate-bounce text-white font-black text-xs uppercase tracking-widest ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="bg-white w-full max-w-5xl h-[95vh] sm:h-[90vh] rounded-t-[3rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        <div className="px-8 pt-8 pb-4 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase tracking-widest">
              {initialData ? 'Edit Property' : 'Add New Property'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Listing ID: {formData.id}</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 btn-3d btn-3d-white rounded-2xl flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-6 shrink-0 border-b border-slate-50">
          <div ref={navRef} className="flex items-center gap-2 overflow-x-auto hide-scrollbar p-2">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                id={`nav-${s.id}`}
                onClick={() => scrollToTab(s.id)}
                className={`px-5 py-3 text-[9px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all ${
                  activeTab === s.id ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8 space-y-12 hide-scrollbar scroll-smooth">
          <Section id="basic" title="Basic Details" subtitle="Core identification of the property">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input label="Listing Title" value={formData.title} onChange={v => handleChange('title', v)} placeholder="e.g. Sunrise Heights Phase 2" />
              <Input label="Possession Date" type="date" value={formData.possessionDate} onChange={v => handleChange('possessionDate', v)} />
              <Select label="Property Type" value={formData.type} onChange={v => handleChange('type', v)} options={['Apartment', 'Plot', 'Villa', 'Commercial']} />
              <Select label="Listing Type" value={formData.listingType} onChange={v => handleChange('listingType', v)} options={['Sale', 'Rent', 'Lease', 'Resale', 'Pre-launch', 'Underconstruction']} />
            </div>
          </Section>

          <Section id="ai" title="AI Description Generator" subtitle="Generate high-converting copy using Gemini AI">
            <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2rem] space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <i className="fas fa-magic"></i>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Select Tone</h4>
                    <div className="flex gap-2 mt-2">
                      {['Professional', 'Luxury', 'Urgent', 'Friendly'].map(tone => (
                        <button
                          key={tone}
                          onClick={() => setAiTone(tone as any)}
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${aiTone === tone ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-400 border border-indigo-100'}`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !formData.title}
                  className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl transition-all ${isGenerating ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-200'}`}
                >
                  {isGenerating ? (
                    <><i className="fas fa-spinner animate-spin"></i> Generating...</>
                  ) : (
                    <><i className="fas fa-wand-magic-sparkles"></i> {formData.description ? 'Regenerate' : 'Generate AI Description'}</>
                  )}
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={formData.description || ''}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="AI generated description will appear here..."
                  className="w-full p-6 bg-white border border-indigo-100 rounded-[2rem] text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all min-h-[160px] resize-none"
                />
                {formData.description && (
                  <button 
                    onClick={copyToClipboard}
                    className="absolute top-4 right-4 w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center shadow-sm"
                    title="Copy to Clipboard"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                )}
              </div>
              <p className="text-[9px] font-bold text-indigo-300 italic px-2">
                * Generates optimized content using Title, Type, and Amenities.
              </p>
            </div>
          </Section>

          <Section id="location" title="Location Details" subtitle="Where is it situated?">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Input label="Country" value={formData.location?.country} onChange={v => handleChange('location.country', v)} />
              <Input label="State" value={formData.location?.state} onChange={v => handleChange('location.state', v)} />
              <Input label="City" value={formData.location?.city} onChange={v => handleChange('location.city', v)} />
              <Input label="Locality / Area" value={formData.location?.area} onChange={v => handleChange('location.area', v)} />
              <Input label="Landmark" value={formData.location?.landmark} onChange={v => handleChange('location.landmark', v)} />
              <Input label="Map Link" value={formData.location?.mapLink} onChange={v => handleChange('location.mapLink', v)} placeholder="Google Maps URL" />
            </div>
          </Section>

          <Section id="project" title="Project Specifications" subtitle="Building and RERA details">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Total No of Units" type="number" value={formData.totalUnits} onChange={v => handleChange('totalUnits', Number(v))} />
                <Input label="RERA Completion Date" type="date" value={formData.reraCompletionDate} onChange={v => handleChange('reraCompletionDate', v)} />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Towers & Possession</h4>
                  <button onClick={addTower} className="text-[#4f46e5] text-[10px] font-black uppercase tracking-widest">+ Add Tower</button>
                </div>
                {formData.towers?.map((t, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative pt-10 sm:pt-4">
                    <button 
                      onClick={() => removeTower(idx)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                    <Input label="Tower Name" value={t.name} onChange={v => handleTowerChange(idx, 'name', v)} />
                    <Input label="Possession" type="date" value={t.possession} onChange={v => handleTowerChange(idx, 'possession', v)} />
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section id="config" title="Property Configurations" subtitle="Detailed layouts and pricing per unit">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BHK / Config Details</h4>
                <button onClick={addConfig} className="text-[#4f46e5] text-[10px] font-black uppercase tracking-widest">+ Add Configuration</button>
              </div>
              {formData.configurations?.map((c, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 relative pt-12 sm:pt-6">
                  <button 
                    onClick={() => removeConfig(idx)}
                    className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Select label="Configuration" value={c.bhk} onChange={v => handleConfigChange(idx, 'bhk', v)} options={['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Villa', 'Office', 'Plot']} />
                    <Input label="Carpet Area" type="number" value={c.carpetArea} onChange={v => handleConfigChange(idx, 'carpetArea', Number(v))} />
                    <Input label="Built-up Area" type="number" value={c.builtUpArea} onChange={v => handleConfigChange(idx, 'builtUpArea', Number(v))} />
                    <Select label="Unit" value={c.unit} onChange={v => handleConfigChange(idx, 'unit', v as any)} options={['sq ft', 'sq m']} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <Input label="Costing (₹)" type="number" value={c.costing} onChange={v => handleConfigChange(idx, 'costing', Number(v))} />
                    <Input label="Price/Sq" type="number" value={c.pricePerSqUnit} readOnly />
                    <Input label="Bathrooms" type="number" value={c.bathrooms} onChange={v => handleConfigChange(idx, 'bathrooms', Number(v))} />
                    <Input label="Balconies" type="number" value={c.balconies} onChange={v => handleConfigChange(idx, 'balconies', Number(v))} />
                    <Select label="Parking" value={c.parking} onChange={v => handleConfigChange(idx, 'parking', v as any)} options={['Covered', 'Open', 'None']} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="finance" title="Financials" subtitle="Pricing and payments">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Input label="Min Price" type="number" value={formData.financials?.priceMin} onChange={v => handleChange('financials.priceMin', Number(v))} />
              <Input label="Max Price" type="number" value={formData.financials?.priceMax} onChange={v => handleChange('financials.priceMax', Number(v))} />
              <Select label="All Inclusive Price" value={formData.financials?.allInclusive ? 'Yes' : 'No'} onChange={v => handleChange('financials.allInclusive', v === 'Yes')} options={['Yes', 'No']} />
              <Input label="Maintenance Amount" type="number" value={formData.financials?.maintenanceAmount} onChange={v => handleChange('financials.maintenanceAmount', Number(v))} />
              <Select label="Maintenance Frequency" value={formData.financials?.maintenanceFrequency} onChange={v => handleChange('financials.maintenanceFrequency', v)} options={['Monthly', 'Quarterly', 'Half-Yearly', 'Annually']} />
              <Input label="Booking Amount" type="number" value={formData.financials?.bookingAmount} onChange={v => handleChange('financials.bookingAmount', Number(v))} />
              <Select label="Negotiable" value={formData.financials?.negotiable ? 'Yes' : 'No'} onChange={v => handleChange('financials.negotiable', v === 'Yes')} options={['Yes', 'No']} />
              <Input label="Expected Rent" type="number" value={formData.financials?.expectedRent} onChange={v => handleChange('financials.expectedRent', Number(v))} />
            </div>
          </Section>

          <Section id="legal" title="Ownership & Legal" subtitle="Compliance and status">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Select label="Ownership Type" value={formData.legal?.ownershipType} onChange={v => handleChange('legal.ownershipType', v)} options={['Sole Owner', 'Joint Venture']} />
                <Input label="RERA ID" value={formData.legal?.reraId} onChange={v => handleChange('legal.reraId', v)} />
                <Select label="Occupancy Status" value={formData.legal?.occupancyStatus} onChange={v => handleChange('legal.occupancyStatus', v)} options={['Under Construction', 'Ready to Move', 'Occupied', 'Vacant']} />
              </div>
              <div className="space-y-2">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Owner Names & Companies</h4>
                {formData.legal?.owners?.map((o, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-4">
                    <Input label="Owner Name" value={o.name} onChange={v => {
                      const owners = [...(formData.legal?.owners || [])];
                      owners[idx] = { ...owners[idx], name: v };
                      handleChange('legal.owners', owners);
                    }} />
                    <Input label="Company" value={o.company} onChange={v => {
                      const owners = [...(formData.legal?.owners || [])];
                      owners[idx] = { ...owners[idx], company: v };
                      handleChange('legal.owners', owners);
                    }} />
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section id="amenities" title="Amenities & Features" subtitle="Lifestyle and utilities">
            <div className="space-y-8">
              <Multiselect label="Key Amenities" value={formData.amenities || []} onChange={v => handleChange('amenities', v)} options={amenityOptions} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Select label="Furnishing Status" value={formData.furnishing?.status} onChange={v => handleChange('furnishing.status', v)} options={['Unfurnished', 'Semi-furnished', 'Fully-furnished']} />
                <Input label="Interiors / Offerings" placeholder="Split by comma..." value={formData.furnishing?.interiors?.join(',')} onChange={v => handleChange('furnishing.interiors', v.split(',').map((s:string) => s.trim()))} />
              </div>
              <Multiselect label="Views Available" value={formData.views || []} onChange={v => handleChange('views', v)} options={viewOptions} />
            </div>
          </Section>

          <Section id="media" title="Media & Documents" subtitle="Visuals and paperwork">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input label="Photo URLs (comma separated)" value={formData.media?.photos?.join(',')} onChange={v => handleChange('media.photos', v.split(',').map((s:string) => s.trim()))} />
              <Input label="Video / Virtual Tour URL" value={formData.media?.videoUrl} onChange={v => handleChange('media.videoUrl', v)} />
              <Input label="Floor Plan URL" value={formData.media?.floorPlanUrl} onChange={v => handleChange('media.floorPlanUrl', v)} />
              <Input label="Key Document Links" placeholder="Agreement, Brochure, etc." value={formData.media?.documents?.map(d => d.url).join(',')} onChange={v => handleChange('media.documents', v.split(',').map((u:string) => ({ name: 'Document', url: u.trim() })))} />
            </div>
          </Section>

          <Section id="source" title="Source & Status" subtitle="Assignment and tracking">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Input label="Dedicated RM" value={formData.source?.dedicatedRM} onChange={v => handleChange('source.dedicatedRM', v)} />
              <Input label="RM Contact" value={formData.source?.rmContact} onChange={v => handleChange('source.rmContact', v)} />
              <Input label="TAT Period" value={formData.source?.tat} onChange={v => handleChange('source.tat', v)} placeholder="e.g. 24 Hours" />
            </div>
          </Section>

          <div className="h-32"></div>
        </div>

        <div className="p-8 border-t bg-slate-50 flex gap-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-4 btn-3d btn-3d-white font-black text-[10px] uppercase rounded-2xl">Discard</button>
          <button onClick={handleSubmit} className="flex-[2] py-4 btn-3d btn-3d-indigo text-white font-black text-[10px] uppercase rounded-2xl">
            {initialData ? 'Update Property' : 'Save Property'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ id: string, title: string, subtitle: string, children: React.ReactNode }> = ({ id, title, subtitle, children }) => (
  <div id={`section-${id}`} className="space-y-6">
    <div>
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h3>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{subtitle}</p>
    </div>
    <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
      {children}
    </div>
  </div>
);

const Input: React.FC<{ label: string, value: any, onChange?: (v: any) => void, type?: string, placeholder?: string, readOnly?: boolean }> = ({ label, value, onChange, type = 'text', placeholder, readOnly }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">{label}</label>
    {type === 'textarea' ? (
      <textarea
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#4f46e5] shadow-sm min-h-[100px]"
      />
    ) : (
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#4f46e5] shadow-sm ${readOnly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
      />
    )}
  </div>
);

const Select: React.FC<{ label: string, value: any, onChange: (v: any) => void, options: string[] }> = ({ label, value, onChange, options }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black appearance-none outline-none focus:border-[#4f46e5] shadow-sm"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[10px]"></i>
    </div>
  </div>
);

const Multiselect: React.FC<{ label: string, value: string[], onChange: (v: string[]) => void, options: string[] }> = ({ label, value, onChange, options }) => {
  const toggle = (opt: string) => {
    const next = value.includes(opt) ? value.filter(o => o !== opt) : [...value, opt];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              value.includes(o) ? 'bg-[#4f46e5] text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:border-[#4f46e5]'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AddPropertyModal;
