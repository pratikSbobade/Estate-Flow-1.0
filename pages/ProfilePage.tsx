
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Client, Property, SiteVisit, ClientStatus, ClientInteraction, UserRole, UserProfile } from '../types';

interface ProfilePageProps {
  clients: Client[];
  properties: Property[];
  visits: SiteVisit[];
  userRole?: string;
  onSwitchRole?: (role: string) => void;
  onLogout?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ clients, properties, visits, userRole, onSwitchRole, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'reports' | 'admin'>('info');
  const [adminSubTab, setAdminSubTab] = useState<'directory' | 'assignment' | 'structure'>('directory');
  const [targetRevenue, setTargetRevenue] = useState<number>(() => {
    return Number(localStorage.getItem('agent_target_revenue')) || 10000000; // 1 Cr default
  });

  const isAnyAdmin = ['role_admin', 'role_super_admin'].includes(userRole || '');

  const user = {
    name: 'Rahul Singh',
    role: userRole === 'role_admin' ? 'Regional Admin' : userRole === 'role_super_admin' ? 'Super Admin' : 'Senior Sales Agent',
    id: 'AGENT-99',
    region: 'South Nagpur',
    reraId: 'NAG/A/2023/11023',
    joinDate: '15 Jan 2022',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'
  };

  // Team Data Fetching from LocalStorage (Simulated)
  const allUsers = useMemo((): UserProfile[] => {
    const saved = localStorage.getItem('ef_user_registry');
    return saved ? JSON.parse(saved) : [];
  }, []);

  const actualRevenue = useMemo(() => {
    return properties
      .filter(p => p.status === 'Sold')
      .reduce((sum, p) => sum + (p.financials?.priceMin || 0), 0);
  }, [properties]);

  const targetProgress = Math.min(Math.round((actualRevenue / targetRevenue) * 100), 100);

  const dailyActivity = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newLeads = clients.filter(c => c.createdAt.startsWith(todayStr)).length;
    const todayVisits = visits.filter(v => v.scheduledAt.startsWith(todayStr)).length;
    const allInteractions: ClientInteraction[] = clients.flatMap(c => c.interactions || []);
    const todayCalls = allInteractions.filter(i => i.type === 'Call' && i.timestamp.startsWith(todayStr)).length;
    return { newLeads, todayVisits, todayCalls };
  }, [clients, visits]);

  const performanceAlerts = useMemo(() => {
    const alerts = [];
    const gap = targetRevenue - actualRevenue;
    if (gap > 0) alerts.push({ id: 'target', icon: 'fa-rocket', title: 'Target Engine', msg: `₹${(gap / 100000).toFixed(1)}L to reach your goal.`, color: 'bg-indigo-600' });
    const hotLeads = clients.filter(c => c.priority === ClientStatus.HOT).length;
    if (hotLeads > 0) alerts.push({ id: 'pipeline', icon: 'fa-fire', title: 'Hot Pipeline', msg: `${hotLeads} Hot Leads awaiting negotiation.`, color: 'bg-red-500' });
    return alerts;
  }, [targetRevenue, actualRevenue, clients]);

  // Bulk Assignment Logic
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState('');

  const handleBulkAssign = () => {
    if (!assigneeId || selectedLeads.length === 0) return;
    const agent = allUsers.find(u => u.id === assigneeId);
    alert(`Successfully reassigned ${selectedLeads.length} leads to ${agent?.name}`);
    setSelectedLeads([]);
    setAssigneeId('');
  };

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[3.5rem] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center transition-colors">
        <div className="relative mb-6">
          <div className="w-32 h-32 bg-slate-100 dark:bg-slate-700 rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl transition-colors">
            <img src={user.photo} className="w-full h-full object-cover" alt="Profile" />
          </div>
          <button className="absolute -bottom-2 -right-2 w-12 h-12 btn-3d btn-3d-indigo text-white rounded-2xl flex items-center justify-center">
            <i className="fas fa-pencil-alt text-sm"></i>
          </button>
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase transition-colors">{user.name}</h2>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-[0.2em]">{user.role} • {user.id}</p>
        
        <div className="flex gap-3 mt-8">
           <span className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800 transition-colors">
             {user.region} Region
           </span>
           <span className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800 transition-colors">
             RERA Verified
           </span>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
           {onSwitchRole && (
             <>
               <button onClick={() => onSwitchRole('role_agent')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${userRole === 'role_agent' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>Agent View</button>
               <button onClick={() => onSwitchRole('role_admin')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${userRole === 'role_admin' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>Admin View</button>
             </>
           )}
           {onLogout && (
             <button onClick={onLogout} className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-all border border-red-100 dark:border-red-800">Sign Out</button>
           )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex bg-white dark:bg-slate-800 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm gap-2 transition-colors">
        <button onClick={() => setActiveTab('info')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
          Dossier
        </button>
        <button onClick={() => setActiveTab('reports')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
          Performance
        </button>
        {isAnyAdmin && (
          <button onClick={() => setActiveTab('admin')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'admin' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>
            <i className="fas fa-shield-halved mr-2"></i> Admin Hub
          </button>
        )}
      </div>

      {/* Conditional Content */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             <MetricCard label="Total Leads" value={clients.length} sub="Portfolio" color="indigo" />
             <MetricCard label="Visits Logged" value={visits.length} sub="Tours" color="purple" />
             <MetricCard label="Revenue" value={`₹${(actualRevenue/10000000).toFixed(1)}Cr`} sub="Closed" color="emerald" />
             <MetricCard label="Score" value={`${Math.round(clients.reduce((acc, c) => acc + (c.nurturingScore || 0), 0) / (clients.length || 1))}%`} sub="Avg. Quality" color="amber" />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              <ProfileRow label="RERA ID" value={user.reraId} />
              <ProfileRow label="Join Date" value={user.joinDate} />
              <ProfileRow label="Region" value="Nagpur South & Metro Hub" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-8">
          <div className="bg-slate-900 text-white p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-8 text-center sm:text-left">
              <h3 className="text-xl font-black uppercase">Revenue Target: ₹{(targetRevenue/10000000).toFixed(2)}Cr</h3>
              <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500" style={{ width: `${targetProgress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="space-y-8">
           {/* Admin Sub-Navigation */}
           <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl gap-1">
              <button onClick={() => setAdminSubTab('directory')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${adminSubTab === 'directory' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Directory</button>
              <button onClick={() => setAdminSubTab('assignment')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${adminSubTab === 'assignment' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Bulk Assign</button>
              <button onClick={() => setAdminSubTab('structure')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${adminSubTab === 'structure' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Structure</button>
           </div>

           {adminSubTab === 'directory' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white">Active Team Directory</h4>
                  <span className="text-[10px] font-black text-indigo-600 uppercase">{allUsers.length} Members</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {allUsers.map(member => (
                     <div key={member.id} className="card-neo p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center font-black text-indigo-600">{member.name[0]}</div>
                           <div>
                              <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{member.name}</p>
                              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{member.region || 'Regional'}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <select 
                            value={member.role} 
                            onChange={(e) => {
                              const updated = allUsers.map(u => u.id === member.id ? {...u, role: e.target.value} : u);
                              localStorage.setItem('ef_user_registry', JSON.stringify(updated));
                              window.location.reload();
                            }}
                            className="bg-slate-50 dark:bg-slate-900 border-none text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase outline-none cursor-pointer rounded-lg px-2 py-1"
                           >
                              <option value="role_agent">Agent</option>
                              <option value="role_admin">Admin</option>
                              <option value="role_super_admin">Super Admin</option>
                           </select>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {adminSubTab === 'assignment' && (
             <div className="card-neo p-8 rounded-[3.5rem] space-y-8 bg-white dark:bg-slate-800">
                <div className="space-y-2">
                   <h4 className="text-lg font-black uppercase text-slate-800 dark:text-white">Batch Lead Reassignment</h4>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Select multiple leads to redistribute to a specific agent</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">1. Select Target Leads ({selectedLeads.length})</label>
                      <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                         {clients.map(lead => (
                           <div key={lead.id} onClick={() => setSelectedLeads(prev => prev.includes(lead.id) ? prev.filter(id => id !== lead.id) : [...prev, lead.id])} className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${selectedLeads.includes(lead.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                              <div>
                                 <p className="text-xs font-black uppercase">{lead.firstName} {lead.lastName}</p>
                                 <p className={`text-[8px] uppercase ${selectedLeads.includes(lead.id) ? 'text-indigo-100' : 'text-slate-400'}`}>Current: {lead.agent}</p>
                              </div>
                              {selectedLeads.includes(lead.id) && <i className="fas fa-check-circle"></i>}
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">2. Target Assignee</label>
                      <div className="space-y-4">
                        <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] font-black text-xs uppercase text-indigo-600 outline-none">
                           <option value="">Select Target Agent...</option>
                           {allUsers.filter(u => u.role === 'role_agent').map(u => (
                             <option key={u.id} value={u.id}>{u.name} ({u.region})</option>
                           ))}
                        </select>
                        <button onClick={handleBulkAssign} disabled={!assigneeId || selectedLeads.length === 0} className={`w-full py-5 btn-3d rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest ${assigneeId && selectedLeads.length > 0 ? 'btn-3d-indigo text-white' : 'bg-slate-100 text-slate-300'}`}>
                           Execute Assignment Flow
                        </button>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {adminSubTab === 'structure' && (
             <div className="space-y-8">
                {['Nagpur South', 'Nagpur North', 'Nagpur East', 'Nagpur West'].map(region => {
                  const members = allUsers.filter(u => u.region === region);
                  if (members.length === 0) return null;
                  return (
                    <div key={region} className="space-y-4">
                       <div className="flex items-center gap-3 px-4">
                          <i className="fas fa-map-location-dot text-indigo-500"></i>
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-white">{region} Force</h4>
                       </div>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {members.map(m => (
                            <div key={m.id} className="bg-white dark:bg-slate-800 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 text-center shadow-sm">
                               <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white truncate">{m.name}</p>
                               <span className="text-[7px] font-black text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md mt-2 inline-block">{m.role.replace('role_', '')}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  );
                })}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string, value: string | number, sub: string, color: string }> = ({ label, value, sub, color }) => (
  <div className="card-neo p-6 rounded-[2rem] border-b-8 border-indigo-500/10 hover:border-indigo-600 transition-all text-center">
    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-2xl font-black ${
      color === 'indigo' ? 'text-indigo-600' : 
      color === 'purple' ? 'text-purple-600' : 
      color === 'emerald' ? 'text-emerald-600' : 'text-amber-500'
    }`}>{value}</p>
    <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-tighter">{sub}</p>
  </div>
);

const ProfileRow: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="px-8 py-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-tight">{value}</span>
  </div>
);

export default ProfilePage;
