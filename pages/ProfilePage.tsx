
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  onLogout?: () => void;
  checkPermission: (resource: ResourceType, action?: ResourceAction) => boolean;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  clients, properties, visits, allUsers = [], userRole, onUpdateClient, onSwitchRole, onLogout, checkPermission
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View States
  const [persona, setPersona] = useState<'agent' | 'admin'>('agent');
  const [activeTab, setActiveTab] = useState<'dossier' | 'performance' | 'hub'>('dossier');
  
  // Permission Logic
  const canManageTeam = checkPermission('Admin: Team');
  const canSeeRoles = checkPermission('Admin: Roles');
  const canSeeImport = checkPermission('Admin: Import');
  const isAdminAuthorized = canManageTeam || canSeeRoles || canSeeImport;
  const isSelfAdmin = userRole === 'role_admin' || userRole === 'role_super_admin';

  // Mock User Data (Extended for CRM Profile)
  const [profileData, setProfileData] = useState({
    name: 'Rahul Singh',
    id: 'AGENT-99',
    roleLabel: userRole === 'role_admin' ? 'Regional Admin' : userRole === 'role_super_admin' ? 'Super Admin' : 'Senior Sales Agent',
    email: 'rahul.singh@estateflow.com',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    reraId: 'RERA-NAG-2023-441',
    territory: 'Nagpur West / South',
    joinDate: 'Jan 2023',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'
  });

  // Derived Stats
  const stats = useMemo(() => {
    const closedProperties = properties.filter(p => p.status === 'Sold');
    const revenue = closedProperties.reduce((sum, p) => sum + (p.financials?.priceMin || 0), 0);
    return {
      visits: visits.filter(v => v.status === 'Completed').length,
      listings: properties.length,
      commission: Math.round(revenue * 0.02) // 2% flat commission mock
    };
  }, [properties, visits]);

  // Handle Photo Upload (User is allowed to do this)
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePersonaSwitch = (p: 'agent' | 'admin') => {
    if (p === 'admin' && !isAdminAuthorized) {
      alert("Unauthorized: Administration privileges required.");
      return;
    }
    setPersona(p);
    setActiveTab(p === 'admin' ? 'hub' : 'dossier');
  };

  return (
    <div className="space-y-8 animate-slide-up pb-28">
      {/* Dynamic Header & Persona Switcher */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[3.5rem] shadow-sm border border-slate-100 dark:border-slate-700 transition-all flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
           <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl gap-2 border border-slate-200 dark:border-slate-700">
             <button 
              onClick={() => handlePersonaSwitch('agent')} 
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${persona === 'agent' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
             >
               <i className="fas fa-user-tie"></i> Agent View
             </button>
             <button 
              onClick={() => handlePersonaSwitch('admin')} 
              disabled={!isAdminAuthorized}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${persona === 'admin' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : isAdminAuthorized ? 'text-slate-400' : 'text-slate-200 dark:text-slate-700 cursor-not-allowed'}`}
             >
               <i className="fas fa-shield-alt"></i> Admin View
             </button>
           </div>
        </div>

        <div className="relative mt-8 sm:mt-0 mb-6 group">
          <div className="w-36 h-36 bg-slate-100 dark:bg-slate-700 rounded-[3rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl relative">
            <img src={profileData.photo} className="w-full h-full object-cover" alt="Agent Profile" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"
            >
              <i className="fas fa-camera text-2xl"></i>
              <span className="text-[8px] font-black uppercase">Update Photo</span>
            </button>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-800">
            <i className="fas fa-check-circle"></i>
          </div>
        </div>

        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase leading-none">{profileData.name}</h2>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-[0.2em]">{profileData.roleLabel} • {profileData.id}</p>
        
        <div className="mt-8 flex flex-wrap justify-center gap-4">
           <a href={`tel:${profileData.phone}`} className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl hover:border-indigo-400 transition-all group">
              <i className="fas fa-phone-alt text-indigo-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{profileData.phone}</span>
           </a>
           <a href={`https://wa.me/${profileData.whatsapp.replace(/\D/g,'')}`} target="_blank" className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl hover:border-emerald-400 transition-all group">
              <i className="fab fa-whatsapp text-emerald-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">WhatsApp Agent</span>
           </a>
           {onLogout && (
             <button onClick={onLogout} className="px-8 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-100 dark:border-red-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">
               Log Out
             </button>
           )}
        </div>
      </div>

      {/* Tabs Control - Contextual */}
      <div className="flex bg-white dark:bg-slate-800 p-2 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm gap-2">
        {persona === 'agent' ? (
          <>
            <button onClick={() => setActiveTab('dossier')} className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dossier' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Professional Dossier</button>
            <button onClick={() => setActiveTab('performance')} className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'performance' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Performance Logs</button>
          </>
        ) : (
          <>
            <button onClick={() => setActiveTab('hub')} className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'hub' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Admin Command Hub</button>
            <button onClick={() => handlePersonaSwitch('agent')} className="flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20">Exit Hub</button>
          </>
        )}
      </div>

      {/* Content Area */}
      <div className="animate-slide-up">
        {persona === 'agent' && activeTab === 'dossier' && (
          <div className="space-y-8">
            {/* High Impact Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <StatMetric label="Executions" value={stats.visits} sub="Site Visits Done" icon="fa-calendar-check" color="indigo" />
               <StatMetric label="Commissions" value={`₹${(stats.commission/100000).toFixed(1)}L`} sub="Earnings Estimated" icon="fa-coins" color="emerald" />
               <StatMetric label="Inventory" value={stats.listings} sub="Handled Units" icon="fa-building" color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Identity Card - Conditionally Editable */}
               <div className="card-neo p-10 rounded-[3.5rem] bg-white dark:bg-slate-800 space-y-8 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Agent Credentials</h3>
                     {!isSelfAdmin && <span className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5"><i className="fas fa-lock text-[7px]"></i> Admin Lock</span>}
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                     <ProfileField label="Identity" value={profileData.name} icon="fa-user" readOnly={!isSelfAdmin} onChange={(v) => isSelfAdmin && setProfileData({...profileData, name: v})} />
                     <ProfileField label="RERA Registration" value={profileData.reraId} icon="fa-certificate" readOnly={!isSelfAdmin} onChange={(v) => isSelfAdmin && setProfileData({...profileData, reraId: v})} />
                     <ProfileField label="Assigned Territory" value={profileData.territory} icon="fa-map-marked-alt" readOnly={!isSelfAdmin} onChange={(v) => isSelfAdmin && setProfileData({...profileData, territory: v})} />
                     <ProfileField label="Corporate Email" value={profileData.email} icon="fa-envelope" readOnly={!isSelfAdmin} onChange={(v) => isSelfAdmin && setProfileData({...profileData, email: v})} />
                  </div>
               </div>

               {/* Access Visualization */}
               <div className="card-neo p-10 rounded-[3.5rem] bg-white dark:bg-slate-800 space-y-8 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authority Matrix</h3>
                     <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg uppercase">Persona: {profileData.roleLabel}</span>
                  </div>
                  <div className="rounded-[2rem] border border-slate-50 dark:border-slate-700 overflow-hidden">
                     <PermissionMatrix checkPermission={checkPermission} />
                  </div>
               </div>
            </div>
          </div>
        )}

        {persona === 'agent' && activeTab === 'performance' && (
          <div className="space-y-8">
             <div className="card-neo p-10 rounded-[3.5rem] bg-slate-900 text-white relative overflow-hidden">
                <div className="relative z-10">
                   <h3 className="text-xl font-black uppercase tracking-tight mb-2">Quarterly Execution Chart</h3>
                   <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest mb-8">Performance compared to regional average</p>
                   <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={[
                           { name: 'Leads', val: clients.length, avg: Math.round(clients.length * 0.8) },
                           { name: 'Visits', val: visits.length, avg: Math.round(visits.length * 1.2) },
                           { name: 'Sales', val: properties.filter(p => p.status === 'Sold').length, avg: 2 }
                         ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#6366f1'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#ffffff40'}} />
                            <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', fontSize: '10px'}} />
                            <Bar dataKey="val" name="My Metrics" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={40} />
                            <Bar dataKey="avg" name="Regional Avg" fill="#10b981" radius={[10, 10, 0, 0]} barSize={20} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                   <i className="fas fa-chart-line text-[150px]"></i>
                </div>
             </div>
          </div>
        )}

        {persona === 'admin' && isAdminAuthorized && (
          <div className="space-y-8 animate-slide-up">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tech Ops Gateway */}
                <div className="card-neo p-10 rounded-[3.5rem] bg-slate-900 border border-slate-800 space-y-8 group hover:border-indigo-500 transition-all">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-800 rounded-[1.5rem] flex items-center justify-center text-indigo-400 shadow-inner group-hover:rotate-12 transition-all">
                         <i className="fas fa-microchip text-2xl"></i>
                      </div>
                      <div>
                         <h4 className="text-xl font-black text-white uppercase tracking-tight">Technical Infrastructure</h4>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configure backend security & data schemas</p>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3 pt-4">
                      <AdminHubLink label="Permission Matrix" icon="fa-th-large" onClick={() => navigate('/admin')} />
                      <AdminHubLink label="Data Import" icon="fa-file-upload" onClick={() => navigate('/admin')} />
                      <AdminHubLink label="System Security" icon="fa-shield-alt" onClick={() => navigate('/admin')} />
                      <AdminHubLink label="Account Registry" icon="fa-users" onClick={() => navigate('/admin')} />
                   </div>
                </div>

                {/* Team Supervision Summary */}
                <div className="card-neo p-10 rounded-[3.5rem] bg-white dark:bg-slate-800 space-y-8 border border-slate-100 dark:border-slate-700">
                   <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personnel Management</h3>
                      <button onClick={() => navigate('/admin')} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Full Registry</button>
                   </div>
                   <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                      {allUsers.filter(u => u.approvalStatus === 'Approved').slice(0, 5).map(u => (
                        <div key={u.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between group">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-xs shadow-sm uppercase">{u.name[0]}</div>
                              <div className="text-left">
                                 <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white leading-none mb-1">{u.name}</p>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{u.role}</p>
                              </div>
                           </div>
                           <i className="fas fa-chevron-right text-[10px] text-slate-200 group-hover:text-indigo-600 transition-all"></i>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// UI COMPONENTS

const StatMetric: React.FC<{ label: string, value: string | number, sub: string, icon: string, color: string }> = ({ label, value, sub, icon, color }) => (
  <div className="card-neo p-8 rounded-[3rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 group hover:border-indigo-500 transition-all">
     <div className="flex items-center justify-between mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 ${
           color === 'indigo' ? 'bg-indigo-600 shadow-indigo-100 dark:shadow-none' :
           color === 'emerald' ? 'bg-emerald-500 shadow-emerald-100 dark:shadow-none' :
           'bg-amber-500 shadow-amber-100 dark:shadow-none'
        }`}>
           <i className={`fas ${icon} text-lg`}></i>
        </div>
        <div className="text-right">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
           <h4 className={`text-3xl font-black ${
              color === 'indigo' ? 'text-indigo-600' :
              color === 'emerald' ? 'text-emerald-600' :
              'text-amber-500'
           }`}>{value}</h4>
        </div>
     </div>
     <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{sub}</p>
  </div>
);

const ProfileField: React.FC<{ label: string, value: string, icon: string, readOnly: boolean, onChange?: (v: string) => void }> = ({ label, value, icon, readOnly, onChange }) => (
  <div className="space-y-2 group">
    <div className="flex items-center gap-2 px-1">
       <i className={`fas ${icon} text-[9px] text-slate-400 group-focus-within:text-indigo-600 transition-colors`}></i>
       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
    </div>
    <input 
      type="text" 
      value={value} 
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      className={`w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-black dark:text-white transition-all outline-none ${readOnly ? 'cursor-not-allowed text-slate-400' : 'focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 focus:shadow-xl'}`}
    />
  </div>
);

const AdminHubLink: React.FC<{ label: string, icon: string, onClick: () => void }> = ({ label, icon, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center p-5 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-2xl border border-slate-700 transition-all gap-3 group">
     <i className={`fas ${icon} text-lg transition-transform group-hover:scale-110`}></i>
     <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const PermissionMatrix: React.FC<{ checkPermission: (r: ResourceType, a: ResourceAction) => boolean }> = ({ checkPermission }) => {
  const modules: ResourceType[] = ['Leads', 'Properties', 'Site Visits', 'Reports', 'WhatsApp', 'Admin: Team'];
  const actions: ResourceAction[] = ['Read', 'Add', 'Edit', 'Delete', 'Assign'];

  return (
    <div className="overflow-x-auto bg-slate-50 dark:bg-slate-900/50">
       <table className="w-full text-left text-[9px]">
          <thead>
             <tr className="bg-slate-100 dark:bg-slate-900">
                <th className="p-3 font-black text-slate-400 uppercase tracking-widest">Module</th>
                {actions.map(a => <th key={a} className="p-3 font-black text-slate-400 text-center uppercase tracking-widest">{a[0]}</th>)}
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
             {modules.map(mod => (
               <tr key={mod} className="hover:bg-white dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{mod}</td>
                  {actions.map(act => {
                    const has = checkPermission(mod, act);
                    return (
                      <td key={act} className="p-3 text-center">
                        <i className={`fas ${has ? 'fa-check-circle text-emerald-500' : 'fa-times-circle text-slate-200 dark:text-slate-700'}`}></i>
                      </td>
                    );
                  })}
               </tr>
             ))}
          </tbody>
       </table>
    </div>
  );
};

export default ProfilePage;
