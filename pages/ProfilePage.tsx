
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Client, Property, SiteVisit, ClientStatus, UserProfile } from '../types';

interface ProfilePageProps {
  clients: Client[];
  properties: Property[];
  visits: SiteVisit[];
  allUsers?: UserProfile[];
  userRole?: string;
  onUpdateClient?: (client: Client) => void | Promise<void>;
  onSwitchRole?: (role: string) => void;
  onLogout?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  clients, properties, visits, allUsers = [], userRole, onUpdateClient, onSwitchRole, onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'reports' | 'admin'>('info');
  const [adminSubTab, setAdminSubTab] = useState<'directory' | 'assignment' | 'structure'>('directory');
  const [viewingUserReport, setViewingUserReport] = useState<UserProfile | null>(null);
  
  // Bulk Assign States
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkAssignFilterPriority, setBulkAssignFilterPriority] = useState<ClientStatus | null>(null);
  const [bulkAssignTargetAgent, setBulkAssignTargetAgent] = useState<string>('');

  const [targetRevenue] = useState<number>(10000000); // 1Cr target
  const navigate = useNavigate();
  const isAnyAdmin = ['role_admin', 'role_super_admin'].includes(userRole || '');

  const user = {
    name: 'Rahul Singh',
    role: userRole === 'role_admin' ? 'Regional Admin' : userRole === 'role_super_admin' ? 'Super Admin' : 'Senior Sales Agent',
    id: 'AGENT-99',
    region: 'South Nagpur',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'
  };

  const actualRevenue = useMemo(() => {
    return properties
      .filter(p => p.status === 'Sold')
      .reduce((sum, p) => sum + (p.financials?.priceMin || 0), 0);
  }, [properties]);

  const targetProgress = Math.min(Math.round((actualRevenue / targetRevenue) * 100), 100);

  const dailyMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayInteractions = clients.flatMap(c => c.interactions || [])
      .filter(i => i.timestamp.startsWith(todayStr));
    
    const todayCalls = todayInteractions.filter(i => i.type === 'Call');
    const todayVisits = visits.filter(v => v.scheduledAt.startsWith(todayStr));

    return {
      callsToday: todayCalls.length,
      visitsToday: todayVisits.length,
      leadCount: clients.length
    };
  }, [clients, visits]);

  const weeklyActivityData = [
    { day: 'Mon', calls: 12, visits: 2 },
    { day: 'Tue', calls: 18, visits: 4 },
    { day: 'Wed', calls: 15, visits: 3 },
    { day: 'Thu', calls: 22, visits: 5 },
    { day: 'Fri', calls: 25, visits: 6 },
    { day: 'Sat', calls: 10, visits: 8 },
    { day: 'Sun', calls: 2, visits: 1 },
  ];

  const leadPriorityShare = [
    { name: 'Hot', value: clients.filter(c => c.priority === ClientStatus.HOT).length, color: '#ef4444' },
    { name: 'Warm', value: clients.filter(c => c.priority === ClientStatus.WARM).length, color: '#4f46e5' },
    { name: 'Cold', value: clients.filter(c => c.priority === ClientStatus.COLD).length, color: '#94a3b8' },
  ];

  // Bulk Assignment Lead List
  const bulkLeads = useMemo(() => {
    return clients.filter(c => {
      if (bulkAssignFilterPriority && c.priority !== bulkAssignFilterPriority) return false;
      return true;
    });
  }, [clients, bulkAssignFilterPriority]);

  const handleToggleLead = (id: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignTargetAgent || selectedLeadIds.length === 0) return;
    
    const confirmTransfer = window.confirm(`Confirm transfer of ${selectedLeadIds.length} lead files to ${bulkAssignTargetAgent}?`);
    if (!confirmTransfer) return;

    for (const leadId of selectedLeadIds) {
      const client = clients.find(c => c.id === leadId);
      if (client && onUpdateClient) {
        await onUpdateClient({ ...client, agent: bulkAssignTargetAgent });
      }
    }

    setSelectedLeadIds([]);
    alert('Lead Re-allocation complete.');
  };

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[3.5rem] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="w-32 h-32 bg-slate-100 dark:bg-slate-700 rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl">
            <img src={user.photo} className="w-full h-full object-cover" alt="Profile" />
          </div>
          <button className="absolute -bottom-2 -right-2 w-12 h-12 btn-3d btn-3d-indigo text-white rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-pencil-alt text-sm"></i>
          </button>
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase">{user.name}</h2>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-[0.2em]">{user.role} • {user.id}</p>
        
        <div className="mt-8 flex flex-wrap justify-center gap-2">
           {onSwitchRole && (
             <>
               <button onClick={() => onSwitchRole('role_agent')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${userRole === 'role_agent' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 bg-slate-100 dark:bg-slate-700'}`}>Agent Profile</button>
               <button onClick={() => onSwitchRole('role_admin')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${['role_admin', 'role_super_admin'].includes(userRole || '') ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 bg-slate-100 dark:bg-slate-700'}`}>Admin View</button>
             </>
           )}
           {onLogout && (
             <button onClick={onLogout} className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-100 dark:border-red-800">Log Out</button>
           )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white dark:bg-slate-800 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm gap-2">
        <button onClick={() => setActiveTab('info')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Dossier</button>
        <button onClick={() => setActiveTab('reports')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Command Center</button>
        {isAnyAdmin && (
          <button onClick={() => setActiveTab('admin')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'admin' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Admin View</button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'info' && (
        <div className="space-y-6 animate-slide-up">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             <MetricCard label="Leads" value={clients.length} sub="Managed" color="indigo" />
             <MetricCard label="Visits" value={visits.filter(v => v.status === 'Completed').length} sub="Done" color="purple" />
             <MetricCard label="Sold" value={`₹${(actualRevenue/10000000).toFixed(1)}Cr`} sub="Revenue" color="emerald" />
             <MetricCard label="Health" value="84%" sub="Lead Quality" color="amber" />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-700 overflow-hidden">
             <ProfileRow label="Region" value={user.region} />
             <ProfileRow label="Work Email" value="rahul.singh@estateflow.com" />
             <ProfileRow label="Hiring Date" value="Jan 2023" />
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-10 animate-slide-up">
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <ReportStatCard label="Calls Today" value={dailyMetrics.callsToday} icon="fa-phone-volume" color="indigo" />
              <ReportStatCard label="Leads Active" value={clients.length} icon="fa-users" color="emerald" />
              <ReportStatCard label="Visits Fixed" value={dailyMetrics.visitsToday} icon="fa-calendar-check" color="purple" />
           </div>
           <div className="card-neo p-8 rounded-[3.5rem] bg-slate-900 text-white overflow-hidden relative group">
             <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-1">Target Progress</p>
                      <h3 className="text-2xl font-black uppercase">₹{(actualRevenue/10000000).toFixed(2)}Cr / ₹{(targetRevenue/10000000).toFixed(2)}Cr</h3>
                   </div>
                   <p className="text-emerald-400 text-xl font-black">{targetProgress}%</p>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all duration-1000" style={{ width: `${targetProgress}%` }}></div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'admin' && (activeTab === 'admin' && (
        <div className="space-y-10 animate-slide-up">
           {/* Technical Ops Section */}
           <div className="space-y-4">
              <div className="flex items-center gap-3 px-4">
                 <div className="w-1 h-6 bg-red-600 rounded-full"></div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Technical Ops</h3>
              </div>
              <div className="card-neo p-8 rounded-[3.5rem] bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all hover:border-indigo-500/50">
                 <div className="flex items-center gap-6 text-left">
                    <div className="w-16 h-16 bg-slate-800 rounded-[1.5rem] flex items-center justify-center text-indigo-400 shadow-inner">
                       <i className="fas fa-microchip text-2xl"></i>
                    </div>
                    <div>
                       <h4 className="text-lg font-black text-white uppercase tracking-tight">Admin Control Center</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">System wide configurations and data pumps</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => navigate('/admin')}
                  className="w-full sm:w-auto px-8 py-4 btn-3d btn-3d-indigo text-white rounded-2xl font-black text-[11px] uppercase tracking-widest"
                 >
                    Launch Admin Console
                 </button>
              </div>
           </div>

           {/* Personnel Management Section */}
           <div className="space-y-4">
              <div className="flex items-center gap-3 px-4">
                 <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Personnel Management</h3>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl gap-1">
                 <button onClick={() => setAdminSubTab('directory')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${adminSubTab === 'directory' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Registry</button>
                 <button onClick={() => setAdminSubTab('assignment')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${adminSubTab === 'assignment' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Bulk Assign</button>
                 <button onClick={() => setAdminSubTab('structure')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${adminSubTab === 'structure' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Hierarchy</button>
              </div>

              {adminSubTab === 'directory' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
                   <PersonnelList users={allUsers} onViewReport={(u) => setViewingUserReport(u)} />
                </div>
              )}

              {adminSubTab === 'assignment' && (
                <div className="card-neo p-8 rounded-[3.5rem] bg-white dark:bg-slate-800 space-y-6 animate-slide-up relative overflow-hidden">
                   <div className="flex items-center justify-between mb-4">
                      <div className="text-left">
                        <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Lead Distribution Hub</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Select files for bulk re-allocation</p>
                      </div>
                      <select 
                        value={bulkAssignFilterPriority || ''} 
                        onChange={(e) => setBulkAssignFilterPriority(e.target.value as ClientStatus || null)}
                        className="bg-slate-50 dark:bg-slate-900 border-none text-[9px] font-black uppercase rounded-lg px-3 py-2 outline-none"
                      >
                         <option value="">All Priorities</option>
                         <option value="Hot">Hot Only</option>
                         <option value="Warm">Warm Only</option>
                         <option value="Cold">Cold Only</option>
                      </select>
                   </div>

                   <div className="max-h-[350px] overflow-y-auto no-scrollbar space-y-2 pb-24">
                      {bulkLeads.map(lead => (
                        <div 
                          key={lead.id} 
                          onClick={() => handleToggleLead(lead.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${selectedLeadIds.includes(lead.id) ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-300'}`}
                        >
                           <div className="flex items-center gap-4">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedLeadIds.includes(lead.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 dark:border-slate-700'}`}>
                                 {selectedLeadIds.includes(lead.id) && <i className="fas fa-check text-[10px] text-white"></i>}
                              </div>
                              <div className="text-left">
                                 <p className="text-[11px] font-black uppercase text-slate-800 dark:text-white leading-none mb-1">{lead.firstName} {lead.lastName}</p>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Curr: {lead.agent || 'Unassigned'}</p>
                              </div>
                           </div>
                           <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${lead.priority === 'Hot' ? 'bg-red-100 text-red-600' : lead.priority === 'Warm' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>{lead.priority}</span>
                        </div>
                      ))}
                      {bulkLeads.length === 0 && (
                        <div className="py-20 text-center text-slate-300 text-[10px] uppercase font-black">No Leads Found</div>
                      )}
                   </div>

                   {selectedLeadIds.length > 0 && (
                     <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-900 text-white border-t border-white/10 z-10 flex flex-col sm:flex-row items-center gap-4 justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black shadow-lg">{selectedLeadIds.length}</div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-left leading-tight">Leads selected<br/>for assignment</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                           <select 
                             value={bulkAssignTargetAgent} 
                             onChange={(e) => setBulkAssignTargetAgent(e.target.value)}
                             className="flex-1 sm:w-48 p-3 bg-slate-800 border border-slate-700 rounded-xl text-[10px] font-black uppercase outline-none"
                           >
                              <option value="">Target Agent...</option>
                              {allUsers.filter(u => u.approvalStatus === 'Approved').map(u => (
                                <option key={u.id} value={u.name}>{u.name}</option>
                              ))}
                           </select>
                           <button 
                             onClick={handleBulkAssign}
                             disabled={!bulkAssignTargetAgent}
                             className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${bulkAssignTargetAgent ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                           >
                             Transfer Leads
                           </button>
                        </div>
                     </div>
                   )}
                </div>
              )}
              
              {adminSubTab === 'structure' && (
                <div className="card-neo p-10 rounded-[3.5rem] bg-white dark:bg-slate-800 space-y-8 animate-slide-up">
                   <div className="space-y-2 text-center">
                      <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Org Hierarchy</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Visual authority tiers</p>
                   </div>
                   <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-center">
                      <i className="fas fa-sitemap text-slate-300 text-4xl mb-4"></i>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual Tree in Admin Console</p>
                   </div>
                </div>
              )}
           </div>
        </div>
      ))}

      {viewingUserReport && (
        <UserPerformanceModal 
          user={viewingUserReport} 
          clients={clients} 
          visits={visits} 
          properties={properties} 
          onClose={() => setViewingUserReport(null)} 
        />
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string, value: string | number, sub: string, color: string }> = ({ label, value, sub, color }) => (
  <div className="card-neo p-6 rounded-[2.5rem] border-b-8 border-indigo-500/10 hover:border-indigo-600 transition-all text-center bg-white dark:bg-slate-800">
    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-2xl font-black ${
      color === 'indigo' ? 'text-indigo-600' : 
      color === 'purple' ? 'text-purple-600' : 
      color === 'emerald' ? 'text-emerald-600' : 'text-amber-500'
    }`}>{value}</p>
    <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1">{sub}</p>
  </div>
);

const ReportStatCard: React.FC<{ label: string, value: number, icon: string, color: string }> = ({ label, value, icon, color }) => (
  <div className="card-neo p-8 rounded-[3rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between group">
     <div className="text-left">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <h4 className={`text-4xl font-black ${color === 'indigo' ? 'text-indigo-600' : color === 'emerald' ? 'text-emerald-600' : color === 'purple' ? 'text-purple-600' : 'text-purple-600'}`}>
          {value.toString().padStart(2, '0')}
        </h4>
     </div>
     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg transition-transform group-hover:scale-110 ${color === 'indigo' ? 'bg-indigo-600 shadow-indigo-100' : color === 'emerald' ? 'bg-emerald-500 shadow-emerald-100' : 'bg-purple-600 shadow-purple-100'}`}>
        <i className={`fas ${icon}`}></i>
     </div>
  </div>
);

const ProfileRow: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="px-8 py-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-tight">{value}</span>
  </div>
);

const PersonnelList: React.FC<{ users: UserProfile[], onViewReport: (u: UserProfile) => void }> = ({ users, onViewReport }) => {
   const filteredUsers = users.filter(u => u.approvalStatus === 'Approved');
   return (
     <>
       {filteredUsers.map(u => (
          <div 
            key={u.id} 
            onClick={() => onViewReport(u)}
            className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between group hover:border-indigo-400 cursor-pointer transition-all"
          >
             <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-xs font-black shadow-sm uppercase">{u.name[0]}</div>
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white mb-0.5">{u.name}</p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{u.email}</p>
                </div>
             </div>
             <i className="fas fa-chart-line text-[10px] text-slate-300 group-hover:text-indigo-600"></i>
          </div>
       ))}
     </>
   );
};

const UserPerformanceModal: React.FC<{ user: UserProfile, clients: Client[], visits: SiteVisit[], properties: Property[], onClose: () => void }> = ({ user, clients, visits, properties, onClose }) => {
  const userLeads = useMemo(() => clients.filter(c => c.agent === user.name), [user, clients]);
  const userVisits = useMemo(() => visits.filter(v => userLeads.some(ul => ul.id === v.clientId)), [userLeads, visits]);
  const userDeals = useMemo(() => userVisits.filter(v => v.feedback?.nextAction === 'Deal'), [userVisits]);
  
  const stats = [
    { label: 'Leads', value: userLeads.length, color: '#4f46e5' },
    { label: 'Visits', value: userVisits.length, color: '#10b981' },
    { label: 'Deals', value: userDeals.length, color: '#f59e0b' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[350] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl max-h-[90vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col transition-colors">
        <div className="p-8 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black uppercase">{user.name[0]}</div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{user.name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel Productivity Audit</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm"><i className="fas fa-times text-xl"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
           <div className="grid grid-cols-3 gap-6">
              {stats.map(s => (
                <div key={s.label} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
                   <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{s.label}</p>
                   <p className="text-3xl font-black dark:text-white" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
           </div>

           <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#64748b'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#64748b'}} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                       {stats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
        <div className="p-8 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
           <button onClick={onClose} className="px-8 py-4 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Close Audit</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
