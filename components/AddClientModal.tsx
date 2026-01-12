
import React, { useState, useRef, useEffect } from 'react';
import { Client, ClientType, ClientStatus } from '../types';

interface AddClientModalProps {
  initialData?: Client;
  onClose: () => void;
  onSubmit: (client: Client) => void;
  availableLocations?: string[];
}

const FORM_SECTIONS = [
  { id: 'basic', label: '1. Basic Info' },
  { id: 'contact', label: '2. Contact Details' },
  { id: 'address', label: '3. Background' },
  { id: 'requirement', label: '4. Requirements' },
  { id: 'financial', label: '5. Financial' },
  { id: 'segment', label: '6. Relationships' }
];

const AddClientModal: React.FC<AddClientModalProps> = ({ initialData, onClose, onSubmit, availableLocations = [] }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<Partial<Client>>(initialData || {
    salutation: 'Mr.',
    type: ClientType.BUYER,
    requirementType: 'Buy',
    propertyTypes: [],
    locations: [],
    configuration: [],
    purpose: 'Self-use',
    timeToBuy: '0–3 months',
    employmentType: 'Salaried',
    priority: ClientStatus.WARM,
    nurturingScore: 0,
    source: 'Portal'
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Recalculate lead nurturing score based on field completion
  useEffect(() => {
    const fieldsToTrack: (keyof Client)[] = [
      'firstName', 'lastName', 'mobile', 'email', 'address', 'companyName', 
      'budgetMax', 'configuration', 'incomeRange', 'loanRequired', 'locations'
    ];
    let filled = 0;
    fieldsToTrack.forEach(f => {
      const val = formData[f];
      if (val && (Array.isArray(val) ? val.length > 0 : true)) {
        filled++;
      }
    });
    const score = Math.round((filled / fieldsToTrack.length) * 100);
    if (formData.nurturingScore !== score) {
      setFormData(prev => ({ ...prev, nurturingScore: score }));
    }
  }, [formData]);

  const handleChange = (field: keyof Client, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleMultiselect = (field: keyof Client, item: string) => {
    const current = (formData[field] as string[]) || [];
    const updated = current.includes(item) 
      ? current.filter(i => i !== item) 
      : [...current, item];
    handleChange(field, updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalClient: Client = {
      ...formData as Client,
      id: formData.id || `CL-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: formData.createdAt || new Date().toISOString(),
      agent: formData.agent || 'Rahul Singh'
    };
    onSubmit(finalClient);
  };

  const scrollToTab = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(`form-section-${id}`);
    if (element && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: element.offsetTop - 20,
        behavior: 'smooth'
      });
    }
    const navBtn = document.getElementById(`nav-btn-${id}`);
    if (navBtn && navRef.current) {
      navRef.current.scrollTo({
        left: navBtn.offsetLeft - 40,
        behavior: 'smooth'
      });
    }
  };

  // Fallback locations if no properties exist yet to provide options
  const displayLocations = availableLocations.length > 0 
    ? availableLocations 
    : ['South Nagpur', 'Mihan', 'Wardha Road', 'Manish Nagar', 'Civil Lines', 'Sonegaon'];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-[3rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up transition-colors">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
              {initialData ? 'Edit Client Profile' : 'New Client Profile'}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <div className="h-2 w-32 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-700 shadow-[0_0_10px_rgba(79,70,229,0.4)]" 
                  style={{ width: `${formData.nurturingScore}%` }}
                ></div>
              </div>
              <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg">
                Lead Score: {formData.nurturingScore}%
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 btn-3d btn-3d-white rounded-2xl flex items-center justify-center text-slate-400">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Horizontal Nav */}
        <div className="px-6 shrink-0 border-b border-slate-50 dark:border-slate-700">
          <div 
            ref={navRef}
            className="flex items-center gap-2 overflow-x-auto hide-scrollbar p-2"
          >
            {FORM_SECTIONS.map(s => (
              <button
                key={s.id}
                id={`nav-btn-${s.id}`}
                onClick={() => scrollToTab(s.id)}
                className={`px-5 py-3 text-[9px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all ${
                  activeTab === s.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-8 space-y-12 hide-scrollbar scroll-smooth"
        >
          <Section id="basic" title="Initial Introduction" subtitle="Identify and personalize your pitch quickly">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <InputField label="Salutation" type="select" value={formData.salutation} onChange={v => handleChange('salutation', v)} options={['Mr.', 'Ms.', 'Mrs.', 'Dr.']} />
              <InputField label="First Name" value={formData.firstName} onChange={v => handleChange('firstName', v)} required />
              <InputField label="Last Name" value={formData.lastName} onChange={v => handleChange('lastName', v)} required />
              <InputField label="Client Type" type="select" value={formData.type} onChange={v => handleChange('type', v)} options={Object.values(ClientType)} />
            </div>
          </Section>

          <Section id="contact" title="Contact Details" subtitle="Ask naturally during small talk">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField label="Primary Mobile" type="tel" value={formData.mobile} onChange={v => handleChange('mobile', v)} required />
              <InputField label="Secondary Phone" placeholder="Add phone numbers..." value={formData.secondaryPhone?.join(',')} onChange={v => handleChange('secondaryPhone', v.split(',').filter(Boolean))} />
              <InputField label="Email (Optional)" type="email" value={formData.email} onChange={v => handleChange('email', v)} />
            </div>
          </Section>

          <Section id="address" title="Address & Professional Background" subtitle="Understand location and financial context">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField label="Current Address" value={formData.address} onChange={v => handleChange('address', v)} />
              <InputField label="Office Location" value={formData.officeLocation} onChange={v => handleChange('officeLocation', v)} />
              <InputField label="Company Name" value={formData.companyName} onChange={v => handleChange('companyName', v)} />
              <InputField label="Designation" value={formData.designation} onChange={v => handleChange('designation', v)} />
            </div>
          </Section>

          <Section id="requirement" title="Property Requirement" subtitle="Guide the conversation around needs and intent">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField label="Requirement Type" type="select" value={formData.requirementType} onChange={v => handleChange('requirementType', v)} options={['Buy', 'Rent', 'Invest']} />
              <Multiselect label="Property Types" field="propertyTypes" value={formData.propertyTypes || []} onToggle={handleToggleMultiselect} options={['Apartment', 'Villa', 'Plot', 'Commercial', 'Shop', 'Warehouse']} />
              <Multiselect label="Preferred Areas (Derived from Inventory)" field="locations" value={formData.locations || []} onToggle={handleToggleMultiselect} options={displayLocations} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Min Budget" type="number" value={formData.budgetMin} onChange={v => handleChange('budgetMin', Number(v))} />
                <InputField label="Max Budget" type="number" value={formData.budgetMax} onChange={v => handleChange('budgetMax', Number(v))} />
              </div>
              <Multiselect label="Preferred Configuration" field="configuration" value={formData.configuration || []} onToggle={handleToggleMultiselect} options={['1RK', '1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse']} />
              <InputField label="Purpose" type="select" value={formData.purpose} onChange={v => handleChange('purpose', v)} options={['Self-use', 'Investment', 'Rental Income']} />
              <InputField label="Time to Buy" type="select" value={formData.timeToBuy} onChange={v => handleChange('timeToBuy', v)} options={['0–3 months', '3–6 months', '6–12 months', 'Just Exploring']} />
            </div>
          </Section>

          <Section id="financial" title="Financial Profile" subtitle="Qualify how serious and capable the lead is">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField label="Employment Type" type="select" value={formData.employmentType} onChange={v => handleChange('employmentType', v)} options={['Salaried', 'Self-Employed', 'Business', 'NRI']} />
              <InputField label="Monthly Income Range" value={formData.incomeRange} onChange={v => handleChange('incomeRange', v)} placeholder="e.g. 1L - 2L" />
              <InputField label="Home Loan Required" type="select" value={formData.loanRequired ? 'Yes' : 'No'} onChange={v => handleChange('loanRequired', v === 'Yes')} options={['Yes', 'No']} />
              <InputField label="Pre-approved Loan" type="select" value={formData.preApproved ? 'Yes' : 'No'} onChange={v => handleChange('preApproved', v === 'Yes')} options={['Yes', 'No']} />
            </div>
          </Section>

          <Section id="segment" title="Relationship & Segmentation" subtitle="Internal usage for CRM and reporting">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField label="Lead Source" type="select" value={formData.source} onChange={v => handleChange('source', v)} options={['Portal', 'Website', 'Referral', 'Campaign', 'Cold Call', 'Walk-in']} />
              <InputField label="Priority" type="select" value={formData.priority} onChange={v => handleChange('priority', v)} options={Object.values(ClientStatus)} />
              <InputField label="Assigned Agent/RM" value={formData.agent} onChange={v => handleChange('agent', v)} />
            </div>
          </Section>

          <div className="h-20"></div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-4 shrink-0 transition-colors">
          <button onClick={onClose} className="flex-1 py-4 btn-3d btn-3d-white font-black text-[10px] uppercase rounded-2xl">Discard</button>
          <button onClick={handleSubmit} className="flex-[2] py-4 btn-3d btn-3d-indigo text-white font-black text-[10px] uppercase rounded-2xl">
            {initialData ? 'Update Client Profile' : 'Save Client Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ id: string, title: string, subtitle: string, children: React.ReactNode }> = ({ id, title, subtitle, children }) => (
  <div id={`form-section-${id}`} className="space-y-6">
    <div>
      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{title}</h3>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">{subtitle}</p>
    </div>
    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
      {children}
    </div>
  </div>
);

const InputField: React.FC<{ label: string, value: any, onChange: (v: any) => void, type?: string, options?: string[], required?: boolean, placeholder?: string }> = ({ label, value, onChange, type = 'text', options, required, placeholder }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
    {type === 'select' ? (
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-black dark:text-white appearance-none outline-none focus:border-indigo-600 shadow-sm transition-colors">
          {options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 pointer-events-none text-[10px]"></i>
      </div>
    ) : (
      <input 
        type={type} 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-indigo-600 shadow-sm transition-colors" 
      />
    )}
  </div>
);

const Multiselect: React.FC<{ label: string, field: keyof Client, value: string[], onToggle: (f: keyof Client, item: string) => void, options: string[] }> = ({ label, field, value, onToggle, options }) => (
  <div className="col-span-full space-y-2">
    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">{label}</label>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(field, opt)}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
            value.includes(opt) 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600 hover:border-indigo-400'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

export default AddClientModal;
