
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';

const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Total Properties', value: '142', sub: '12 new this month', icon: 'fa-building', color: 'indigo' },
    { label: 'Active Listings', value: '86', sub: '61% efficiency', icon: 'fa-check-circle', color: 'emerald' },
    { label: 'Revenue Generated', value: '₹2.4Cr', sub: 'Payout pending: ₹12L', icon: 'fa-coins', color: 'amber' },
    { label: 'Visits Today', value: '08', sub: '4 completed', icon: 'fa-calendar-day', color: 'purple' },
  ];

  const chartData = [
    { name: 'Mon', visits: 4, conversion: 2 },
    { name: 'Tue', visits: 7, conversion: 1 },
    { name: 'Wed', visits: 5, conversion: 4 },
    { name: 'Thu', visits: 9, conversion: 3 },
    { name: 'Fri', visits: 12, conversion: 6 },
    { name: 'Sat', visits: 15, conversion: 8 },
    { name: 'Sun', visits: 10, conversion: 5 },
  ];

  const reminders = [
    { type: 'Site Visit', client: 'Rohit Sharma', time: '10:30 AM', property: 'Godrej Prime 3BHK' },
    { type: 'Follow-up', client: 'Priya Verma', time: '02:00 PM', property: 'Villas at Nagpur' },
    { type: 'Pending', client: 'Unknown Lead', time: 'Overdue', property: 'Cold Call', urgent: true },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Agent Dashboard</h1>
          <p className="text-slate-500 font-medium">Tracking your real estate performance for Nagpur region.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
           <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
             <i className="fas fa-trophy text-xl"></i>
           </div>
           <div>
             <p className="text-[10px] font-black uppercase text-slate-400">Team Rank</p>
             <p className="font-black text-slate-800">#3 / 12 Agents</p>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="card-neo p-6 rounded-[2rem] border-b-8 border-indigo-500/10 hover:border-indigo-500 transition-all cursor-default group">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:scale-110 transition-transform ${
              stat.color === 'indigo' ? 'bg-indigo-600 shadow-indigo-200' :
              stat.color === 'emerald' ? 'bg-emerald-500 shadow-emerald-200' :
              stat.color === 'amber' ? 'bg-amber-500 shadow-amber-200' : 'bg-purple-600 shadow-purple-200'
            }`}>
              <i className={`fas ${stat.icon} text-xl`}></i>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
            <p className="text-xs font-bold text-slate-400 mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 card-neo p-8 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Visit Activity</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scheduled vs. Completed</p>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1">
              <button className="px-6 py-2 btn-3d btn-3d-indigo text-white shadow-none rounded-lg text-xs font-black">Weekly</button>
              <button className="px-6 py-2 btn-3d btn-3d-white shadow-none rounded-lg text-xs font-black">Monthly</button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontWeight: 800 }}
                />
                <Area type="monotone" dataKey="visits" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorVisits)" />
                <Area type="monotone" dataKey="conversion" stroke="#10b981" strokeWidth={4} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reminders Sidebar */}
        <div className="card-neo p-8 rounded-[2.5rem] bg-slate-900 text-white">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black tracking-tight">Today's Focus</h2>
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <i className="fas fa-bell animate-swing"></i>
            </div>
          </div>
          <div className="space-y-5">
            {reminders.map((rem, idx) => (
              <div key={idx} className={`p-5 rounded-[1.5rem] border-l-4 transition-transform hover:scale-[1.02] cursor-pointer ${
                rem.urgent ? 'bg-red-500/10 border-red-500' : 'bg-white/5 border-indigo-400'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${rem.urgent ? 'bg-red-500 text-white' : 'bg-indigo-500 text-white'}`}>
                      {rem.type}
                    </span>
                    <h4 className="font-black text-white text-lg mt-2">{rem.client}</h4>
                  </div>
                  <span className="text-xs font-black text-white/50">{rem.time}</span>
                </div>
                <p className="text-xs font-bold text-white/40 mt-1 flex items-center gap-2">
                  <i className="fas fa-location-arrow text-[10px]"></i>
                  {rem.property}
                </p>
                {rem.urgent && (
                  <button className="mt-4 w-full py-4 btn-3d btn-3d-red text-white text-xs font-black uppercase rounded-2xl active:translate-y-1 transition-all">
                    Urgent Call
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
