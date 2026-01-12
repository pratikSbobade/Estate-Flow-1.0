
import React, { useState, useRef, useEffect } from 'react';
import { Property, PropertyConfiguration } from '../types';

interface AddPropertyModalProps {
  initialData?: Property;
  onClose: () => void;
  onSubmit: (property: Property) => void;
}

const SECTIONS = [
  { id: 'basic', label: '1. Basic Details' },
  { id: 'location', label: '2. Location' },
  { id: 'project', label: '3. Project Specs' },
  { id: 'config', label: '4. Configurations' },
  { id: 'finance', label: '5. Financials' },
  { id: 'legal', label: '6. Ownership' },
  { id: 'amenities', label: '7. Amenities' },
  { id: 'media', label: '8. Media' },
  { id: 'source', label: '9. Source' }
];

const AddPropertyModal: React.FC<AddPropertyModalProps> = ({ initialData, onClose, onSubmit }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

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

  // AUTO-SYNC: Update financial range when configurations change
  useEffect(() => {
    if (formData.configurations && formData.configurations.length > 0) {
      const prices = formData.configurations.map(c => c.costing).filter(p => p > 0);
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        
        if (formData.financials?.priceMin !== min || formData.financials?.priceMax !== max) {
          setFormData(prev => ({
            ...prev,
            financials: {
              ...(prev.financials || { allInclusive: true, maintenanceAmount: 0, maintenanceFrequency: 'Monthly', bookingAmount: 0, negotiable: true }),
              priceMin: min,
              priceMax: max
            }
          }));
        }
      }
    }
  }, [formData.configurations]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Fixed: Added explicit type annotation (file: File) to resolve TypeScript error on line 109
    const base64Files = await Promise.all(Array.from(files).map((file: File) => fileToBase64(file)));
    const currentPhotos = formData.media?.photos || [];
    handleChange('media.photos', [...currentPhotos, ...base64Files]);
    showToast(`${files.length} Photo(s) Added`);
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Fixed: Added explicit type annotation (file: File) to resolve TypeScript errors on lines 120 and 121
    const newDocs = await Promise.all(Array.from(files).map(async (file: File) => ({
      name: file.name,
      url: await fileToBase64(file)
    })));

    const currentDocs = formData.media?.documents || [];
    handleChange('media.documents', [...currentDocs, ...newDocs]);
    showToast(`${files.length} Document(s) Added`);
  };

  const removePhoto = (index: number) => {
    const photos = [...(formData.media?.photos || [])];
    photos.splice(index, 1);
    handleChange('media.photos', photos);
  };

  const removeDoc = (index: number) => {
    const docs = [...(formData.media?.documents || [])];
    docs.splice(index, 1);
    handleChange('media.documents', docs);
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

      <div className="bg-white dark:bg-slate-800 w-full max-w-5xl h-[95vh] sm:h-[90vh] rounded-t-[3rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up transition-colors duration-300">
        <div className="px-8 pt-8 pb-4 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase tracking-widest">
              {initialData ? 'Edit Property' : 'Add New Property'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Listing ID: {formData.id}</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 btn-3d btn-3d-white rounded-2xl flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-6 shrink-0 border-b border-slate-50 dark:border-slate-700">
          <div ref={navRef} className="flex items-center gap-2 overflow-x-auto hide-scrollbar p-2">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                id={`nav-${s.id}`}
                onClick={() => scrollToTab(s.id)}
                className={`px-5 py-3 text-[9px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all ${
                  activeTab === s.id ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-100' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
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
            <div className="mt-6">
              <Input label="Property Description" type="textarea" value={formData.description} onChange={v => handleChange('description', v)} placeholder="Enter details about the property..." />
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
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Towers & Possession</h4>
                  <button onClick={addTower} className="text-[#4f46e5] text-[10px] font-black uppercase tracking-widest">+ Add Tower</button>
                </div>
                {formData.towers?.map((t, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm relative pt-10 sm:pt-4">
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
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">BHK / Config Details</h4>
                <button onClick={addConfig} className="text-[#4f46e5] text-[10px] font-black uppercase tracking-widest">+ Add Configuration</button>
              </div>
              {formData.configurations?.map((c, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-700 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-600 shadow-sm space-y-4 relative pt-12 sm:pt-6">
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
                <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Owner Names & Companies</h4>
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

          <Section id="media" title="Media & Documents" subtitle="Visuals and paperwork (Upload local files or add links)">
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Photos Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">Property Photos</label>
                    <button 
                      onClick={() => photoInputRef.current?.click()}
                      className="text-[#4f46e5] text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                    >
                      <i className="fas fa-upload"></i> Upload
                    </button>
                    <input type="file" ref={photoInputRef} multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </div>
                  <Input 
                    label="Add Photo URLs (separate by comma)" 
                    value={formData.media?.photos?.filter(p => p.startsWith('http')).join(',')} 
                    onChange={v => {
                      const localFiles = formData.media?.photos?.filter(p => p.startsWith('data:')) || [];
                      const remoteLinks = v.split(',').map((s:string) => s.trim()).filter(Boolean);
                      handleChange('media.photos', [...localFiles, ...remoteLinks]);
                    }} 
                  />
                  
                  {/* Gallery Preview */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
                    {formData.media?.photos?.map((photo, idx) => (
                      <div key={idx} className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-xl relative overflow-hidden border border-slate-200 dark:border-slate-600 group">
                        <img src={photo} alt={`Property ${idx}`} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removePhoto(idx)}
                          className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <i className="fas fa-trash text-white text-xs"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">Property Documents</label>
                    <button 
                      onClick={() => docInputRef.current?.click()}
                      className="text-[#4f46e5] text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                    >
                      <i className="fas fa-file-upload"></i> Upload
                    </button>
                    <input type="file" ref={docInputRef} multiple className="hidden" onChange={handleDocUpload} />
                  </div>
                  <Input 
                    label="Add Doc URLs (Agreements, Brochures, etc.)" 
                    placeholder="Comma separated links..."
                    value={formData.media?.documents?.filter(d => d.url.startsWith('http')).map(d => d.url).join(',')} 
                    onChange={v => {
                      const localDocs = formData.media?.documents?.filter(d => d.url.startsWith('data:')) || [];
                      const remoteDocs = v.split(',').map((u:string) => ({ name: 'Document Link', url: u.trim() })).filter(d => d.url);
                      handleChange('media.documents', [...localDocs, ...remoteDocs]);
                    }} 
                  />
                  
                  {/* Doc List */}
                  <div className="space-y-2 mt-4">
                    {formData.media?.documents?.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <i className={`fas ${doc.url.startsWith('data:') ? 'fa-file-alt' : 'fa-link'} text-indigo-500`}></i>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate uppercase">{doc.name}</span>
                        </div>
                        <button onClick={() => removeDoc(idx)} className="text-red-400 hover:text-red-600 p-1">
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Video / Virtual Tour URL" value={formData.media?.videoUrl} onChange={v => handleChange('media.videoUrl', v)} placeholder="YouTube, Vimeo or Drive Link" />
                <Input label="Floor Plan URL (Direct Link)" value={formData.media?.floorPlanUrl} onChange={v => handleChange('media.floorPlanUrl', v)} placeholder="Image URL or Drive PDF Link" />
              </div>
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

        <div className="p-8 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex gap-4 shrink-0 transition-colors">
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
      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{title}</h3>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">{subtitle}</p>
    </div>
    <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
      {children}
    </div>
  </div>
);

const Input: React.FC<{ label: string, value: any, onChange?: (v: any) => void, type?: string, placeholder?: string, readOnly?: boolean }> = ({ label, value, onChange, type = 'text', placeholder, readOnly }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">{label}</label>
    {type === 'textarea' ? (
      <textarea
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-[#4f46e5] shadow-sm min-h-[100px] transition-colors"
      />
    ) : (
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-[#4f46e5] shadow-sm ${readOnly ? 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed' : ''} transition-colors`}
      />
    )}
  </div>
);

const Select: React.FC<{ label: string, value: any, onChange: (v: any) => void, options: string[] }> = ({ label, value, onChange, options }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-black dark:text-white appearance-none outline-none focus:border-[#4f46e5] shadow-sm transition-colors"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 pointer-events-none text-[10px]"></i>
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
      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              value.includes(o) ? 'bg-[#4f46e5] text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-[#4f46e5]'
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
