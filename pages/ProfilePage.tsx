
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Client, Property, SiteVisit, ClientStatus, ClientInteraction, UserRole, UserProfile } from '../types';

interface ProfilePageProps {
  clients: Client[];
  // Fix: changed 'properties[]' to 'Property[]' as 'Property' is the imported type name.
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
    return Number(localStorage.getItem('agent_target_revenue')) || 10000000; 
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

  const actualRevenue = useMemo(() => {
    return properties
      .filter(p => p.status === 'Sold')
      .reduce((sum, p) => sum + (p.financials?.priceMin || 0), 0);
  }, [properties]);

  const targetProgress = Math.min(Math.round((actualRevenue / targetRevenue) * 100), 100);

  // --- ENHANCED DAILY METRICS ---
  const dailyMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayInteractions = clients.flatMap(c => c.interactions || [])
      .filter(i => i.timestamp.startsWith(todayStr));
    
    const todayCalls = todayInteractions.filter(i => i.type === 'Call');
    const connectedCalls = todayCalls.filter(i => {
      const desc = i.description.toLowerCase();
      return desc.includes('contacted') || desc.includes('schedule visit') || desc.includes('callback');
    });

    const todayVisits = visits.filter(v => v.scheduledAt.startsWith(todayStr));

    return {
      callsToday: todayCalls.length,
      connectedToday: connectedCalls.length,
      visitsToday: todayVisits.length,
      leadCount: clients.length
    };
  }, [clients, visits]);

  // --- CHART DATA GENERATION ---
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
    { name: 'Hot Leads', value: clients.filter(c => c.priority === ClientStatus.HOT).length, color: '#ef4444' },
    { name: 'Warm Leads', value: clients.filter(c => c.priority === ClientStatus.WARM).length, color: '#4f46e5' },
    { name: 'Cold Leads', value: clients.filter(c => c.priority === ClientStatus.COLD).length, color: '#94a3b8' },
  ];

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[3.5rem] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center transition-colors">
        <div className="relative mb-6">
          <div className="w-32 h-32 bg-slate-100 dark:bg-slate-700 rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl transition-colors">
            <img src={user.photo} className="w-full h-full object-cover" alt="Profile" />
          </div>
          <button className="absolute -bottom-2 -right-2 w-12 h-12 btn-3d btn-3d-indigo text-white rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-pencil-alt text-sm"></i>
          </button>
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase transition-colors">{user.name}</h2>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-[0.2em]">{user.role} • {user.id}</p>
        
        <div className="flex gap-3 mt-8">
           <span className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800 transition-colors">
             {user.region} Force
           </span>
           <span className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800 transition-colors">
             Verified Agent
           </span>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
           {onSwitchRole && (
             <>
               <button onClick={() => onSwitchRole('role_agent')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${userRole === 'role_agent' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 bg-slate-100 dark:bg-slate-700'}`}>Agent Profile</button>
               <button onClick={() => onSwitchRole('role_admin')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${userRole === 'role_admin' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 bg-slate-100 dark:bg-slate-700'}`}>Admin View</button>
             </>
           )}
           {onLogout && (
             <button onClick={onLogout} className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-all border border-red-100 dark:border-red-800">Log Out</button>
           )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex bg-white dark:bg-slate-800 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm gap-2 transition-colors">
        <button onClick={() => setActiveTab('info')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Dossier</button>
        <button onClick={() => setActiveTab('reports')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Command Center</button>
        {isAnyAdmin && (
          <button onClick={() => setActiveTab('admin')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'admin' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Team Ops</button>
        )}
      </div>

      {/* Dossier Content */}
      {activeTab === 'info' && (
        <div className="space-y-6 animate-slide-up">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             <MetricCard label="Total Leads" value={clients.length} sub="Lifetime" color="indigo" />
             <MetricCard label="Visits Done" value={visits.filter(v => v.status === 'Completed').length} sub="Property Tours" color="purple" />
             <MetricCard label="Revenue" value={`₹${(actualRevenue/10000000).toFixed(1)}Cr`} sub="Sold Inventory" color="emerald" />
             <MetricCard label="Lead Score" value={`${Math.round(clients.reduce((acc, c) => acc + (c.nurturingScore || 0), 0) / (clients.length || 1))}%`} sub="Avg Quality" color="amber" />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              <ProfileRow label="RERA License" value={user.reraId} />
              <ProfileRow label="Employment" value={user.joinDate} />
              <ProfileRow label="Location Hub" value="Nagpur Metropolitan" />
              <ProfileRow label="Email" value="rahul.singh@estateflow.com" />
            </div>
          </div>
        </div>
      )}

      {/* Reports / Command Center Content */}
      {activeTab === 'reports' && (
        <div className="space-y-10 animate-slide-up">
          {/* Daily Productivity Dashboard */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-4">
               <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
               <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Today's Daily Pulse</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <ReportStatCard label="Calls Today" value={dailyMetrics.callsToday} icon="fa-phone-volume" color="indigo" sub="Attempts" />
               <ReportStatCard label="Connected" value={dailyMetrics.connectedToday} icon="fa-headset" color="emerald" sub="Success" />
               <ReportStatCard label="Visits Fixed" value={dailyMetrics.visitsToday} icon="fa-calendar-check" color="purple" sub="Scheduled" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Weekly Activity Histogram */}
            <div className="card-neo p-8 rounded-[3.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-colors">
              <div className="flex justify-between items-center mb-8">
                 <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Weekly Activity Pipeline</h4>
                 <div className="flex gap-2">
                    <span className="flex items-center gap-1.5 text-[8px] font-black uppercase text-indigo-500"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Calls</span>
                    <span className="flex items-center gap-1.5 text-[8px] font-black uppercase text-purple-500"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Visits</span>
                 </div>
              </div>
              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={weeklyActivityData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#64748b', textTransform: 'uppercase'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#64748b'}} />
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                      <Bar dataKey="calls" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={16} />
                      <Bar dataKey="visits" fill="#a855f7" radius={[6, 6, 0, 0]} barSize={16} />
                   </BarChart>
                 </ResponsiveContainer>
              </div>
            </div>

            {/* Pipeline Share Pie Chart */}
            <div className="card-neo p-8 rounded-[3.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-colors">
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8 text-center">Lead Portfolio Maturity</h4>
              <div className="h-64 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie 
                        data={leadPriorityShare} 
                        cx="50%" cy="50%" 
                        innerRadius={60} 
                        outerRadius={85} 
                        paddingAngle={5} 
                        dataKey="value"
                        stroke="none"
                       >
                          {leadPriorityShare.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Pie>
                       <Tooltip />
                       <Legend verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', paddingTop: '20px'}} />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-10">
                    <span className="text-2xl font-black text-slate-800 dark:text-white">{clients.length}</span>
                    <span className="text-[7px] font-black text-slate-400 uppercase">Total Leads</span>
                 </div>
              </div>
            </div>
          </div>

          {/* Revenue Tracker Area Chart */}
          <div className="card-neo p-10 rounded-[3.5rem] bg-slate-900 text-white overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><i className="fas fa-coins text-[120px]"></i></div>
             <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-1">Target Pace</p>
                      <h3 className="text-3xl font-black tracking-tight uppercase">₹{(actualRevenue/10000000).toFixed(2)}Cr / ₹{(targetRevenue/10000000).toFixed(2)}Cr</h3>
                   </div>
                   <div className="text-right">
                      <p className="text-emerald-400 text-2xl font-black">{targetProgress}%</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase">Goal Achieved</p>
                   </div>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden shadow-inner">
                   <div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all duration-1000" style={{ width: `${targetProgress}%` }}></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4">
                   <ReportMiniStat label="Pending Pipeline" value="₹2.5Cr" />
                   <ReportMiniStat label="Avg Deal Value" value="₹85L" />
                   <ReportMiniStat label="Closing Ratio" value="12%" />
                   <ReportMiniStat label="Last Sale" value="2 Days ago" />
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="space-y-8 animate-slide-up">
           {/* Admin Sub-Navigation */}
           <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl gap-1">
              <button onClick={() => setAdminSubTab('directory')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${adminSubTab === 'directory' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Registry</button>
              <button onClick={() => setAdminSubTab('assignment')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${adminSubTab === 'assignment' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Bulk Assign</button>
              <button onClick={() => setAdminSubTab('structure')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${adminSubTab === 'structure' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Hierarchy</button>
           </div>

           {adminSubTab === 'directory' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white">Authorized Team Registry</h4>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Active Status</span>
                </div>
                {/* Personnel Registry rendering logic remains standard but integrated in profile hub */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {/* This is a simplified directory for profile view */}
                   <PersonnelList role="role_agent" />
                </div>
             </div>
           )}

           {adminSubTab === 'assignment' && (
             <div className="card-neo p-10 rounded-[3.5rem] bg-white dark:bg-slate-800 space-y-8">
                <div className="space-y-2">
                   <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Lead Distribution Hub</h4>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Centralized pool for re-allocating active lead files across the Nagpur sales force</p>
                </div>
                <div className="py-20 text-center border-4 border-dashed border-slate-50 dark:border-slate-700 rounded-[3rem]">
                   <i className="fas fa-project-diagram text-slate-200 dark:text-slate-700 text-5xl mb-4"></i>
                   <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Select Agent to Begin Transfer</p>
                </div>
             </div>
           )}
        </div>
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
    <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-tighter">{sub}</p>
  </div>
);

const ReportStatCard: React.FC<{ label: string, value: number, icon: string, color: string, sub: string }> = ({ label, value, icon, color, sub }) => (
  <div className="card-neo p-8 rounded-[3rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-colors flex items-center justify-between group">
     <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <h4 className={`text-4xl font-black ${color === 'indigo' ? 'text-indigo-600' : color === 'emerald' ? 'text-emerald-600' : color === 'purple' ? 'text-purple-600' : 'text-purple-600'}`}>
          {value.toString().padStart(2, '0')}
        </h4>
        <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">{sub} Count</p>
     </div>
     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg transition-transform group-hover:scale-110 ${color === 'indigo' ? 'bg-indigo-600 shadow-indigo-100' : color === 'emerald' ? 'bg-emerald-500 shadow-emerald-100' : 'bg-purple-600 shadow-purple-100'}`}>
        <i className={`fas ${icon}`}></i>
     </div>
  </div>
);

const ReportMiniStat: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="space-y-1">
     <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
     <p className="text-sm font-black text-white">{value}</p>
  </div>
);

const ProfileRow: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="px-8 py-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-tight">{value}</span>
  </div>
);

const PersonnelList: React.FC<{ role: string }> = ({ role }) => {
   const names = ['Vikram M.', 'Pooja K.', 'Aman S.', 'Neha R.'];
   return (
     <>
       {names.map(name => (
          <div key={name} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-4 group hover:border-indigo-400 transition-all">
             <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-xs font-black shadow-sm">{name[0]}</div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white">{name}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Sales Specialist</p>
             </div>
          </div>
       ))}
     </>
   );
}

export default ProfilePage;
