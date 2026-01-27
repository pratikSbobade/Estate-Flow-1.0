
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';
import { Client, Property, SiteVisit, UserProfile, ResourceType, ResourceAction } from '../types';

interface ProfilePageProps {
  clients: Client[];
  properties: Property[];
  visits: SiteVisit[];
  allUsers?: UserProfile[];
  userRole?: string;
  onUpdateClient?: (client: Client) => void | Promise<void>;
  onSwitchRole?: (role: string) => void;
  checkPermission: (resource: ResourceType, action?: ResourceAction) => boolean;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  clients, properties, visits, allUsers = [], userRole, onUpdateClient, checkPermission
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Forced Admin Persona for Direct Access Mode
  const [persona, setPersona] = useState<'agent' | 'admin'>('admin');
  const [activeTab, setActiveTab] = useState<'dossier' | 'performance' | 'hub'>('dossier');

  const [profileData, setProfileData] = useState<Partial<UserProfile>>({
    name: 'Rahul Singh',
    id: 'ADMIN-01',
    role: 'Super Admin',
    email: 'rahul.singh@estateflow.com',
    mobile: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    reraId: 'RERA-NAG-2023-441',
    territory: 'Nagpur Headquarters',
    joinDate: 'Jan 15, 2023',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'
  });

  const stats = useMemo(() => {
    const personalVisits = visits.filter(v => v.status === 'Completed').length;
    const personalListings = properties.length;
    const totalSoldValue = properties
      .filter(p => p.status === 'Sold')
      .reduce((sum, p) => sum + (p.financials?.priceMin || 0), 0);
    const personalCommissions = Math.round(totalSoldValue * 0.015);

    return { personalVisits, personalListings, personalCommissions };
  }, [properties, visits]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 animate-slide-up pb-28">
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[3.5rem] shadow-sm border border-slate-100 dark:border-slate-700 transition-all flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
           <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl gap-2 border border-slate-200 dark:border-slate-700">
             <button 
               onClick={() => setPersona('agent')}
               className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${persona === 'agent' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
             >
               Agent View
             </button>
             <button 
               onClick={() => setPersona('admin')}
               className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${persona === 'admin' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
             >
               Admin View
             </button>
           </div>
        </div>

        <div className="relative group mb-6 mt-10 sm:mt-0">
          <div className="w-36 h-36 bg-slate-100 dark:bg-slate-700 rounded-[3rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl relative">
            <img src={profileData.photo} className="w-full h-full object-cover" alt="Profile" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity"
            >
              <i className="fas fa-camera text-2xl"></i>
              <span className="text-[8px] font-black uppercase">Upload</span>
            </button>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-800">
            <i className="fas fa-check-circle"></i>
          </div>
        </div>

        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase leading-none">{profileData.name}</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
            {profileData.role}
          </span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">DIRECT ACCESS MODE</span>
        </div>
        
        <div className="mt-8 flex flex-wrap justify-center gap-4">
           <ContactButton icon="fa-phone-alt" label={profileData.mobile || ''} href={`tel:${profileData.mobile}`} color="indigo" />
           <ContactButton icon="fab fa-whatsapp" label="WhatsApp" href={`https://wa.me/${profileData.whatsapp?.replace(/\D/g,'')}`} color="emerald" />
        </div>
      </div>

      <div className="flex bg-white dark:bg-slate-800 p-2 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm gap-2">
        <TabButton active={activeTab === 'dossier'} onClick={() => setActiveTab('dossier')} label="The Dossier" />
        <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} label="Performance" />
        <TabButton active={activeTab === 'hub'} onClick={() => setActiveTab('hub')} label="Admin Hub" color="slate-900" />
      </div>

      <div className="animate-slide-up">
        {activeTab === 'dossier' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <StatCard label="Total Site Visits" value={stats.personalVisits} sub="Execution Count" color="indigo" icon="fa-map-marked-alt" />
               <StatCard label="Commissions Earned" value={`₹${(stats.personalCommissions/100000).toFixed(1)}L`} sub="Lifetime Value" color="amber" icon="fa-coins" />
               <StatCard label="Listings Handled" value={stats.personalListings} sub="Active Inventory" color="emerald" icon="fa-building" />
            </div>

            <div className="card-neo p-10 rounded-[3.5rem] bg-white dark:bg-slate-800 space-y-8 border border-slate-100 dark:border-slate-700">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System Identity</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditableField label="Full Identity" value={profileData.name || ''} readOnly={false} onChange={v => handleFieldChange('name', v)} icon="fa-user" />
                  <EditableField label="RERA Registration ID" value={profileData.reraId || ''} readOnly={false} onChange={v => handleFieldChange('reraId', v)} icon="fa-certificate" />
                  <EditableField label="Territory Assignment" value={profileData.territory || ''} readOnly={false} onChange={v => handleFieldChange('territory', v)} icon="fa-map-marker-alt" />
                  <EditableField label="Member Join Date" value={profileData.joinDate || ''} readOnly={false} onChange={v => handleFieldChange('joinDate', v)} icon="fa-calendar-alt" />
               </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="card-neo p-10 rounded-[3.5rem] bg-slate-900 text-white">
             <h3 className="text-2xl font-black uppercase tracking-tight">Productivity Radar</h3>
             <div className="h-72 mt-8">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={[
                     { name: 'Visits', current: stats.personalVisits, target: 50 },
                     { name: 'Leads', current: clients.length, target: 100 },
                     { name: 'Inventory', current: properties.length, target: 80 }
                   ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#6366f1'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#ffffff30'}} />
                      <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', fontSize: '10px'}} />
                      <Bar dataKey="current" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={40} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        )}

        {activeTab === 'hub' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="card-neo p-10 rounded-[3.5rem] bg-slate-900 text-white space-y-8">
                <h4 className="text-xl font-black uppercase tracking-tight">Infrastructure Hub</h4>
                <div className="grid grid-cols-2 gap-4">
                   <HubButton label="Roles & Perms" icon="fa-shield-alt" onClick={() => navigate('/admin')} />
                   <HubButton label="System Health" icon="fa-database" onClick={() => navigate('/admin')} />
                </div>
             </div>
             <div className="card-neo p-10 rounded-[3.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Team Oversight</h3>
                <div className="mt-6 space-y-4">
                   {allUsers.slice(0, 4).map(u => (
                      <div key={u.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black">{u.name[0]}</div>
                            <div>
                               <p className="text-[11px] font-black uppercase text-slate-800 dark:text-white leading-none">{u.name}</p>
                               <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{u.role}</p>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// UI COMPONENTS

const ContactButton: React.FC<{ icon: string, label: string, href: string, color: 'indigo' | 'emerald' }> = ({ icon, label, href, color }) => (
  <a href={href} target="_blank" className={`flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl hover:border-${color}-400 transition-all shadow-sm`}>
    <i className={`${icon} ${color === 'indigo' ? 'text-indigo-500' : 'text-emerald-500'}`}></i>
    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{label}</span>
  </a>
);

const TabButton: React.FC<{ active: boolean, onClick: () => void, label: string, color?: string }> = ({ active, onClick, label, color }) => (
  <button onClick={onClick} className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${active ? (color ? `bg-slate-900 text-white shadow-lg` : 'bg-indigo-600 text-white shadow-lg') : 'text-slate-400 hover:text-slate-600'}`}>
    {label}
  </button>
);

const StatCard: React.FC<{ label: string, value: string | number, sub: string, color: 'indigo' | 'amber' | 'emerald', icon: string }> = ({ label, value, sub, color, icon }) => (
  <div className="card-neo p-8 rounded-[3.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 group">
     <div className="flex items-center justify-between mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${color === 'indigo' ? 'bg-indigo-600' : color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
           <i className={`fas ${icon} text-lg`}></i>
        </div>
        <div className="text-right">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
           <h4 className={`text-3xl font-black ${color === 'indigo' ? 'text-indigo-600' : color === 'amber' ? 'text-amber-500' : 'text-emerald-600'}`}>{value}</h4>
        </div>
     </div>
     <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{sub}</p>
  </div>
);

const EditableField: React.FC<{ label: string, value: string, readOnly: boolean, onChange: (v: string) => void, icon: string }> = ({ label, value, readOnly, onChange, icon }) => (
  <div className="space-y-2">
     <div className="flex items-center gap-2 ml-1">
        <i className={`fas ${icon} text-[9px] text-slate-300`}></i>
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
     </div>
     <input 
       type="text" 
       value={value} 
       onChange={e => onChange(e.target.value)}
       readOnly={readOnly}
       className="w-full p-4 rounded-2xl text-xs font-bold dark:text-white outline-none border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus:border-indigo-600 shadow-sm"
     />
  </div>
);

const HubButton: React.FC<{ label: string, icon: string, onClick: () => void }> = ({ label, icon, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center p-6 bg-slate-800 hover:bg-indigo-600 rounded-2xl border border-slate-700 transition-all gap-3">
     <i className={`fas ${icon} text-xl text-slate-400 group-hover:text-white`}></i>
     <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">{label}</span>
  </button>
);

export default ProfilePage;
