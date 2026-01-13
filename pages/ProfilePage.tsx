
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Client, Property, SiteVisit, ClientStatus, ClientInteraction, UserRole } from '../types';

interface ProfilePageProps {
  clients: Client[];
  properties: Property[];
  visits: SiteVisit[];
  userRole?: string;
  onSwitchRole?: (role: string) => void;
  onLogout?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ clients, properties, visits, userRole, onSwitchRole, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'reports'>('info');
  const [targetRevenue, setTargetRevenue] = useState<number>(() => {
    return Number(localStorage.getItem('agent_target_revenue')) || 10000000; // 1 Cr default
  });

  const user = {
    name: 'Rahul Singh',
    role: userRole === 'role_admin' ? 'Super Admin' : 'Senior Sales Agent',
    id: 'AGENT-99',
    region: 'South Nagpur',
    reraId: 'NAG/A/2023/11023',
    joinDate: '15 Jan 2022',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'
  };

  // 1. REVENUE CALCULATIONS
  const actualRevenue = useMemo(() => {
    return properties
      .filter(p => p.status === 'Sold')
      .reduce((sum, p) => sum + (p.financials?.priceMin || 0), 0);
  }, [properties]);

  const targetProgress = Math.min(Math.round((actualRevenue / targetRevenue) * 100), 100);

  // 2. DAILY ACTIVITY DATA
  const dailyActivity = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newLeads = clients.filter(c => c.createdAt.startsWith(todayStr)).length;
    const todayVisits = visits.filter(v => v.scheduledAt.startsWith(todayStr)).length;
    
    const allInteractions: ClientInteraction[] = clients.flatMap(c => c.interactions || []);
    const todayCalls = allInteractions.filter(i => i.type === 'Call' && i.timestamp.startsWith(todayStr)).length;

    return { newLeads, todayVisits, todayCalls };
  }, [clients, visits]);

  // 3. CALLS BY 2-HOUR INTERVALS
  const callDistributionData = useMemo(() => {
    const allInteractions: ClientInteraction[] = clients.flatMap(c => c.interactions || []);
    const calls = allInteractions.filter(i => i.type === 'Call');
    
    const slots = [
      { slot: '08-10', count: 0, label: '8AM-10AM' },
      { slot: '10-12', count: 0, label: '10AM-12PM' },
      { slot: '12-14', count: 0, label: '12PM-2PM' },
      { slot: '14-16', count: 0, label: '2PM-4PM' },
      { slot: '16-18', count: 0, label: '4PM-6PM' },
      { slot: '18-20', count: 0, label: '6PM-8PM' },
      { slot: '20-22', count: 0, label: '8PM-10PM' },
    ];

    calls.forEach(call => {
      const hour = new Date(call.timestamp).getHours();
      const slotIndex = Math.floor((hour - 8) / 2);
      if (slotIndex >= 0 && slotIndex < slots.length) {
        slots[slotIndex].count++;
      }
    });

    return slots;
  }, [clients]);

  // 4. MOTIVATION & INTELLIGENCE ALERTS
  const performanceAlerts = useMemo(() => {
    const alerts = [];
    const gap = targetRevenue - actualRevenue;
    
    if (gap > 0) {
      alerts.push({
        id: 'target',
        icon: 'fa-rocket',
        title: 'Target Engine',
        msg: `₹${(gap / 100000).toFixed(1)}L to reach your goal. Reach for the gold!`,
        color: 'bg-indigo-600'
      });
    }

    const hotLeads = clients.filter(c => c.priority === ClientStatus.HOT).length;
    if (hotLeads > 0) {
      alerts.push({
        id: 'pipeline',
        icon: 'fa-fire',
        title: 'Hot Pipeline',
        msg: `${hotLeads} Hot Leads awaiting negotiation. Closing window is open!`,
        color: 'bg-red-500'
      });
    }

    const pendingQuotes = visits.filter(v => v.status === 'Completed' && v.feedback?.nextAction === 'Send Quotation').length;
    if (pendingQuotes > 0) {
      alerts.push({
        id: 'quote',
        icon: 'fa-file-invoice-dollar',
        title: 'Quote Velocity',
        msg: `${pendingQuotes} quotes need sending. Boost your conversion numbers now.`,
        color: 'bg-amber-500'
      });
    }

    return alerts;
  }, [targetRevenue, actualRevenue, clients, visits]);

  const handleSetTarget = (val: number) => {
    setTargetRevenue(val);
    localStorage.setItem('agent_target_revenue', val.toString());
  };

  return (
    <div className="space-y-8 animate-slide-up">
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
               <button 
                 onClick={() => onSwitchRole('role_agent')} 
                 className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${userRole === 'role_agent' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}
               >
                 Agent Role
               </button>
               <button 
                 onClick={() => onSwitchRole('role_admin')} 
                 className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${userRole === 'role_admin' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}
               >
                 Super Admin Role
               </button>
             </>
           )}
           {onLogout && (
             <button 
               onClick={onLogout} 
               className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-all border border-red-100 dark:border-red-800"
             >
               Sign Out <i className="fas fa-sign-out-alt ml-1"></i>
             </button>
           )}
        </div>
      </div>

      <div className="flex bg-white dark:bg-slate-800 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm gap-2 transition-colors">
        <button onClick={() => setActiveTab('info')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
          <i className="fas fa-user-circle mr-2"></i> Professional Dossier
        </button>
        <button onClick={() => setActiveTab('reports')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
          <i className="fas fa-chart-line mr-2"></i> Performance Analytics
        </button>
      </div>

      {activeTab === 'info' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             <MetricCard label="Total Leads" value={clients.length} sub="Managed Portfolio" color="indigo" />
             <MetricCard label="Visits Logged" value={visits.length} sub="Total Tours" color="purple" />
             <MetricCard label="Revenue Output" value={`₹${(actualRevenue/10000000).toFixed(1)}Cr`} sub="Sold Properties" color="emerald" />
             <MetricCard label="Lead Score" value={`${Math.round(clients.reduce((acc, c) => acc + (c.nurturingScore || 0), 0) / (clients.length || 1))}%`} sub="Avg. Quality" color="amber" />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
            <div className="px-8 py-6 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 transition-colors">
              <h3 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-widest">Administrative Record</h3>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              <ProfileRow label="RERA ID" value={user.reraId} />
              <ProfileRow label="Join Date" value={user.joinDate} />
              <ProfileRow label="Primary Region" value="Nagpur South & Metro Hub" />
              <ProfileRow label="Agent Code" value={user.id} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 pb-10">
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {performanceAlerts.map(alert => (
              <div key={alert.id} className="min-w-[300px] bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm flex gap-4 animate-slide-up transition-colors">
                 <div className={`w-12 h-12 ${alert.color} text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0`}>
                    <i className={`fas ${alert.icon} text-lg`}></i>
                 </div>
                 <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">{alert.title}</p>
                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed mt-1">{alert.msg}</p>
                 </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 text-white p-8 sm:p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 transform rotate-12 transition-transform group-hover:rotate-45 duration-700">
               <i className="fas fa-trophy text-9xl"></i>
            </div>
            
            <div className="relative z-10 space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tight">Quarterly Revenue Target</h3>
                   <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mt-1">Strategic Goal Setter</p>
                </div>
                <div className="text-right">
                   <p className="text-4xl font-black tracking-tight">₹{(targetRevenue/10000000).toFixed(2)}Cr</p>
                </div>
              </div>

              <div className="space-y-4">
                 <input type="range" min="1000000" max="100000000" step="1000000" value={targetRevenue} onChange={(e) => handleSetTarget(Number(e.target.value))} className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-400" />
                 <div className="flex justify-between text-[8px] font-black text-white/40 uppercase tracking-widest">
                    <span>Min (10L)</span>
                    <span>Max (10Cr)</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                 <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm transition-colors hover:bg-white/10">
                    <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-2">Completion</p>
                    <p className="text-3xl font-black">{targetProgress}%</p>
                 </div>
                 <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm transition-colors hover:bg-white/10">
                    <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-2">Current Gap</p>
                    <p className="text-3xl font-black">₹{Math.max(0, (targetRevenue - actualRevenue)/1000000).toFixed(1)}L</p>
                 </div>
                 <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm transition-colors hover:bg-white/10">
                    <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-2">Performance Tier</p>
                    <p className="text-xl font-black uppercase tracking-widest">{targetProgress > 80 ? 'Elite' : 'Active'}</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="card-neo p-8 rounded-[3rem]">
            <div className="flex justify-between items-center mb-8">
               <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white transition-colors">Daily Activity command</h4>
               <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 transition-colors">
                  <i className="fas fa-bolt text-xs"></i>
               </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
               <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center transition-colors hover:border-indigo-400">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">New Leads</p>
                  <p className="text-3xl font-black text-indigo-600">{dailyActivity.newLeads}</p>
               </div>
               <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center transition-colors hover:border-emerald-400">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Calls Disposed</p>
                  <p className="text-3xl font-black text-emerald-600">{dailyActivity.todayCalls}</p>
               </div>
               <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center transition-colors hover:border-amber-400">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Visits Conducted</p>
                  <p className="text-3xl font-black text-amber-500">{dailyActivity.todayVisits}</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card-neo p-8 rounded-[3rem] lg:col-span-2">
               <div className="flex justify-between items-center mb-8">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white transition-colors">Call Intensity Distribution</h4>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">2-Hour Record Velocity Tracking</p>
                  </div>
               </div>
               <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={callDistributionData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="label" axisLine={false} tickLine={false} style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }} />
                     <YAxis axisLine={false} tickLine={false} style={{ fontSize: '9px', fontWeight: 900 }} />
                     <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', fontSize: '10px', border: 'none', fontWeight: 900, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                     <Bar dataKey="count" name="Calls" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={40} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string, value: string | number, sub: string, color: string }> = ({ label, value, sub, color }) => (
  <div className="card-neo p-6 rounded-[2rem] border-b-8 border-indigo-500/10 hover:border-indigo-600 transition-all text-center">
    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">{label}</p>
    <p className={`text-2xl font-black transition-colors ${
      color === 'indigo' ? 'text-indigo-600' : 
      color === 'purple' ? 'text-purple-600' : 
      color === 'emerald' ? 'text-emerald-600' : 'text-amber-500'
    }`}>{value}</p>
    <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-tighter transition-colors">{sub}</p>
  </div>
);

const ProfileRow: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="px-8 py-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">{label}</span>
    <span className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-tight transition-colors">{value}</span>
  </div>
);

export default ProfilePage;
