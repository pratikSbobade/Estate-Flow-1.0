
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
  
  const [bulkPhotoUrls, setBulkPhotoUrls] = useState('');
  const [bulkDocUrls, setBulkDocUrls] = useState('');
  const [bulkFloorPlanUrls, setBulkFloorPlanUrls] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const isManualScrolling = useRef(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const floorPlanInputRef = useRef<HTMLInputElement>(null);

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
    media: { photos: [], videoUrl: '', floorPlanUrl: '', floorPlans: [], documents: [] },
    source: { dedicatedRM: '', rmContact: '', tat: '' },
    status: 'Available'
  });

  // Synchronize Active Tab on Scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observerOptions = {
      root: container,
      rootMargin: '-10% 0px -70% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (isManualScrolling.current) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id.replace('section-', '');
          setActiveTab(sectionId);
          
          const navBtn = document.getElementById(`nav-${sectionId}`);
          if (navBtn && navRef.current) {
            navRef.current.scrollTo({
              left: navBtn.offsetLeft - 40,
              behavior: 'smooth'
            });
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    SECTIONS.forEach((s) => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

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
    const base64Files = await Promise.all(Array.from(files).map((file: File) => fileToBase64(file)));
    const currentPhotos = formData.media?.photos || [];
    handleChange('media.photos', [...currentPhotos, ...base64Files]);
    showToast(`${files.length} Photo(s) Added`);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newDocs = await Promise.all(Array.from(files).map(async (file: File) => ({
      name: file.name,
      url: await fileToBase64(file)
    })));
    const currentDocs = formData.media?.documents || [];
    handleChange('media.documents', [...currentDocs, ...newDocs]);
    showToast(`${files.length} Document(s) Added`);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleFloorPlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPlans = await Promise.all(Array.from(files).map(async (file: File) => ({
      name: file.name,
      url: await fileToBase64(file)
    })));
    const currentPlans = formData.media?.floorPlans || [];
    handleChange('media.floorPlans', [...currentPlans, ...newPlans]);
    showToast(`${files.length} Floor Plan(s) Added`);
    if (floorPlanInputRef.current) floorPlanInputRef.current.value = '';
  };

  const addUrlsToPhotos = () => {
    if (!bulkPhotoUrls.trim()) return;
    const urls = bulkPhotoUrls.split(',').map(u => u.trim()).filter(Boolean);
    const currentPhotos = formData.media?.photos || [];
    handleChange('media.photos', [...currentPhotos, ...urls]);
    setBulkPhotoUrls('');
    showToast(`${urls.length} URL(s) added to photos`);
  };

  const addUrlsToDocs = () => {
    if (!bulkDocUrls.trim()) return;
    const urls = bulkDocUrls.split(',').map(u => u.trim()).filter(Boolean);
    const newDocs = urls.map(url => {
        const name = url.split('/').pop()?.split('?')[0] || 'Document Link';
        return { name: name.length > 30 ? 'Document Link' : name, url };
    });
    const currentDocs = formData.media?.documents || [];
    handleChange('media.documents', [...currentDocs, ...newDocs]);
    setBulkDocUrls('');
    showToast(`${urls.length} URL(s) added to documents`);
  };

  const addUrlsToFloorPlans = () => {
    if (!bulkFloorPlanUrls.trim()) return;
    const urls = bulkFloorPlanUrls.split(',').map(u => u.trim()).filter(Boolean);
    const newPlans = urls.map(url => {
        const name = url.split('/').pop()?.split('?')[0] || 'Floor Plan Link';
        return { name: name.length > 30 ? 'Floor Plan Link' : name, url };
    });
    const currentPlans = formData.media?.floorPlans || [];
    handleChange('media.floorPlans', [...currentPlans, ...newPlans]);
    setBulkFloorPlanUrls('');
    showToast(`${urls.length} URL(s) added to floor plans`);
  };

  const removePhoto = (idx: number) => {
    const photos = [...(formData.media?.photos || [])];
    photos.splice(idx, 1);
    handleChange('media.photos', photos);
  };

  const removeDoc = (idx: number) => {
    const docs = [...(formData.media?.documents || [])];
    docs.splice(idx, 1);
    handleChange('media.documents', docs);
  };

  const removeFloorPlan = (idx: number) => {
    const plans = [...(formData.media?.floorPlans || [])];
    plans.splice(idx, 1);
    handleChange('media.floorPlans', plans);
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
      if (a > 0) updatedConfigs[index].pricePerSqUnit = Math.round(c / a);
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
    isManualScrolling.current = true;
    setActiveTab(id);
    const element = document.getElementById(`section-${id}`);
    if (element && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: element.offsetTop - 20, behavior: 'smooth' });
    }
    const navBtn = document.getElementById(`nav-${id}`);
    if (navBtn && navRef.current) {
      navRef.current.scrollTo({ left: navBtn.offsetLeft - 40, behavior: 'smooth' });
    }
    setTimeout(() => {
      isManualScrolling.current = false;
    }, 1000);
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
          <Section id="basic" title="Basic Details" subtitle="Core identification and status">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input label="Listing Title" value={formData.title} onChange={v => handleChange('title', v)} placeholder="e.g. Sunrise Heights Phase 2" />
              <Select label="Property Status" value={formData.status} onChange={v => handleChange('status', v)} options={['Available', 'Sold', 'Reserved', 'On Hold']} />
              <Input label="Possession Date" type="date" value={formData.possessionDate} onChange={v => handleChange('possessionDate', v)} />
              <Select label="Property Type" value={formData.type} onChange={v => handleChange('type', v)} options={['Apartment', 'Plot', 'Villa', 'Commercial']} />
              <Select label="Listing Type" value={formData.listingType} onChange={v => handleChange('listingType', v)} options={['Sale', 'Resale', 'Rent']} />
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

          <Section id="media" title="Media & Documents" subtitle="Visuals and paperwork (Direct Upload or Link Imports)">
            <div className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Property Gallery</h4>
                    <button onClick={() => photoInputRef.current?.click()} className="text-[10px] font-black text-[#4f46e5] uppercase bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-indigo-100 transition-colors">
                      <i className="fas fa-file-image"></i> Local Upload
                    </button>
                    <input type="file" ref={photoInputRef} multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Import Photo URLs (Comma Separated)</label>
                    <div className="flex gap-2">
                      <textarea value={bulkPhotoUrls} onChange={e => setBulkPhotoUrls(e.target.value)} placeholder="https://image1.jpg, https://image2.png ..." className="flex-1 p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-[#4f46e5] shadow-sm min-h-[60px] transition-colors" />
                      <button onClick={addUrlsToPhotos} disabled={!bulkPhotoUrls.trim()} className="px-4 bg-[#4f46e5] text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-[#3730a3] disabled:opacity-50 disabled:cursor-not-allowed transition-all">Add</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4 max-h-60 overflow-y-auto p-1 hide-scrollbar">
                    {formData.media?.photos?.map((photo, idx) => (
                      <div key={idx} className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-xl relative overflow-hidden border border-slate-200 dark:border-slate-600 group shadow-sm transition-transform hover:scale-[1.02]">
                        <img src={photo} alt={`Property ${idx}`} className="w-full h-full object-cover" />
                        <button onClick={() => removePhoto(idx)} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <i className="fas fa-trash-alt text-white text-sm"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Legal Documents</h4>
                    <button onClick={() => docInputRef.current?.click()} className="text-[10px] font-black text-[#4f46e5] uppercase bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-indigo-100 transition-colors">
                      <i className="fas fa-file-pdf"></i> Local Upload
                    </button>
                    <input type="file" ref={docInputRef} multiple className="hidden" onChange={handleDocUpload} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Import Doc URLs (Comma Separated)</label>
                    <div className="flex gap-2">
                      <textarea value={bulkDocUrls} onChange={e => setBulkDocUrls(e.target.value)} placeholder="https://site.com/rera.pdf, https://site.com/brochure.pdf ..." className="flex-1 p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-[#4f46e5] shadow-sm min-h-[60px] transition-colors" />
                      <button onClick={addUrlsToDocs} disabled={!bulkDocUrls.trim()} className="px-4 bg-[#4f46e5] text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-[#3730a3] disabled:opacity-50 disabled:cursor-not-allowed transition-all">Add</button>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4 max-h-60 overflow-y-auto p-1 hide-scrollbar">
                    {formData.media?.documents?.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl shadow-sm group hover:border-indigo-400 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-indigo-500"><i className={`fas ${doc.url.startsWith('data:') ? 'fa-file-alt' : 'fa-link'} text-xs`}></i></div>
                          <div className="min-w-0"><p className="text-[10px] font-black text-slate-700 dark:text-slate-300 truncate uppercase tracking-tight">{doc.name}</p></div>
                        </div>
                        <button onClick={() => removeDoc(idx)} className="text-slate-300 hover:text-red-500 p-1 transition-colors"><i className="fas fa-times-circle"></i></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Floor Plans</h4>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Upload images or PDF versions of the layout</p>
                  </div>
                  <button onClick={() => floorPlanInputRef.current?.click()} className="text-[10px] font-black text-white bg-[#4f46e5] px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#3730a3] transition-all shadow-md">
                    <i className="fas fa-cloud-upload-alt"></i> Upload Floor Plan
                  </button>
                  <input type="file" ref={floorPlanInputRef} multiple accept="image/*,application/pdf" className="hidden" onChange={handleFloorPlanUpload} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Bulk Import Floor Plan Links</label>
                  <div className="flex gap-2">
                    <textarea value={bulkFloorPlanUrls} onChange={e => setBulkFloorPlanUrls(e.target.value)} placeholder="https://site.com/fp1.png, https://site.com/fp2.pdf ..." className="flex-1 p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-[#4f46e5] shadow-sm min-h-[60px] transition-colors" />
                    <button onClick={addUrlsToFloorPlans} disabled={!bulkFloorPlanUrls.trim()} className="px-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Add</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-72 overflow-y-auto no-scrollbar p-1">
                  {(formData.media?.floorPlans || []).map((plan, idx) => {
                    const isPdf = plan.url.toLowerCase().endsWith('.pdf') || plan.url.startsWith('data:application/pdf');
                    return (
                      <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden group shadow-sm transition-all hover:border-indigo-400">
                        <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-900 relative">
                          {isPdf ? <div className="w-full h-full flex flex-col items-center justify-center text-red-500 gap-2"><i className="fas fa-file-pdf text-4xl"></i><span className="text-[7px] font-black uppercase text-slate-400 text-center px-2">PDF</span></div> : <img src={plan.url} alt={plan.name} className="w-full h-full object-cover" />}
                          <button onClick={() => removeFloorPlan(idx)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><i className="fas fa-times text-[10px]"></i></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
          <button onClick={handleSubmit} className="flex-[2] py-4 btn-3d btn-3d-indigo text-white font-black text-[10px] uppercase rounded-2xl">{initialData ? 'Update Property' : 'Save Property'}</button>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ id: string, title: string, subtitle: string, children: React.ReactNode }> = ({ id, title, subtitle, children }) => (
  <div id={`section-${id}`} className="space-y-6">
    <div><h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{title}</h3><p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">{subtitle}</p></div>
    <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">{children}</div>
  </div>
);

const Input: React.FC<{ label: string, value: any, onChange?: (v: any) => void, type?: string, placeholder?: string, readOnly?: boolean }> = ({ label, value, onChange, type = 'text', placeholder, readOnly }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">{label}</label>
    {type === 'textarea' ? <textarea value={value || ''} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-[#4f46e5] shadow-sm min-h-[100px] transition-colors" /> : <input type={type} value={value || ''} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} readOnly={readOnly} className={`w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-[#4f46e5] shadow-sm ${readOnly ? 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed' : ''} transition-colors`} />}
  </div>
);

const Select: React.FC<{ label: string, value: any, onChange: (v: any) => void, options: string[] }> = ({ label, value, onChange, options }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">{label}</label>
    <div className="relative"><select value={value} onChange={e => onChange(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-black dark:text-white appearance-none outline-none focus:border-[#4f46e5] shadow-sm transition-colors">{options.map(o => <option key={o} value={o}>{o}</option>)}</select><i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 pointer-events-none text-[10px]"></i></div>
  </div>
);

const Multiselect: React.FC<{ label: string, value: string[], onChange: (v: string[]) => void, options: string[] }> = ({ label, value, onChange, options }) => {
  const toggle = (opt: string) => { const next = value.includes(opt) ? value.filter(o => o !== opt) : [...value, opt]; onChange(next); };
  return (
    <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">{label}</label><div className="flex flex-wrap gap-2">{options.map(o => <button key={o} type="button" onClick={() => toggle(o)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${value.includes(o) ? 'bg-[#4f46e5] text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-[#4f46e5]'}`}>{o}</button>)}</div></div>
  );
};

export default AddPropertyModal;
