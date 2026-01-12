
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Client, Property, SiteVisit, ClientInteraction } from '../types';

interface DashboardProps {
  clients: Client[];
  properties: Property[];
  visits: SiteVisit[];
}

const Dashboard: React.FC<DashboardProps> = ({ clients, properties, visits }) => {
  const todayDateStr = new Date().toISOString().split('T')[0];
  const visitsToday = visits.filter(v => v.scheduledAt.startsWith(todayDateStr)).length;
  
  // Aggregate all call interactions from all clients
  const allInteractions: ClientInteraction[] = clients.reduce((acc, client) => {
    return [...acc, ...(client.interactions || [])];
  }, [] as ClientInteraction[]);

  const callInteractions = allInteractions.filter(i => i.type === 'Call');
  
  // Status breakdown for Pie Chart
  const statusCounts = callInteractions.reduce((acc, curr) => {
    const status = curr.description.split(': ')[1]?.split(' - ')[0] || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#64748b'];

  const totalRevenue = properties
    .filter(p => p.status === 'Sold')
    .reduce((sum, p) => sum + (p.financials.priceMin || 0), 0);

  const stats = [
    { 
      label: 'Total Properties', 
      value: properties.length.toString(), 
      sub: `${properties.filter(p => p.listingType === 'Pre-launch').length} Pre-launch`, 
      icon: 'fa-building', 
      color: 'indigo' 
    },
    { 
      label: 'Call Productivity', 
      value: callInteractions.length.toString(), 
      sub: `Total calls logged`, 
      icon: 'fa-phone-volume', 
      color: 'emerald' 
    },
    { 
      label: 'Revenue Generated', 
      value: `₹${(totalRevenue / 10000000).toFixed(2)}Cr`, 
      sub: `Based on closed sales`, 
      icon: 'fa-coins', 
      color: 'amber' 
    },
    { 
      label: 'Visits Today', 
      value: visitsToday.toString().padStart(2, '0'), 
      sub: `${visits.filter(v => v.status === 'Completed').length} total completed`, 
      icon: 'fa-calendar-day', 
      color: 'purple' 
    },
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

        {/* Call Log Maintenance Pie Chart */}
        <div className="card-neo p-8 rounded-[2.5rem] bg-white border border-slate-100">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Call Disposition</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outcome Distribution</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Total Logged</p>
                <p className="text-xl font-black text-indigo-600">{callInteractions.length}</p>
             </div>
             <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase">Conversion</p>
                <p className="text-xl font-black text-emerald-500">
                   {callInteractions.length > 0 ? Math.round((statusCounts['Contacted'] || 0) / callInteractions.length * 100) : 0}%
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Call Log Maintenance Window */}
      <div className="card-neo rounded-[2.5rem] overflow-hidden bg-white border border-slate-100">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Call Log Maintenance</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time interaction audit</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">Export Logs</button>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-headset"></i>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration/Outcome</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Summary Note</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {callInteractions.slice(0, 8).map((log) => {
                const client = clients.find(c => c.id === log.clientId);
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-[10px]">
                          {client ? client.firstName[0] + client.lastName[0] : '??'}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 uppercase leading-tight">{client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{log.clientId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <p className="text-[10px] font-bold text-slate-600">{new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                        {log.description.split(': ')[1]?.split(' - ')[0] || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <p className="text-[10px] font-medium text-slate-500 italic max-w-xs truncate">
                        {log.description.split(' - ')[1] || 'No summary notes provided.'}
                      </p>
                    </td>
                    <td className="px-8 py-4 text-right">
                       <button className="text-indigo-600 hover:text-indigo-800 transition-colors p-2">
                          <i className="fas fa-chevron-right text-xs"></i>
                       </button>
                    </td>
                  </tr>
                );
              })}
              {callInteractions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <i className="fas fa-phone-slash text-4xl text-slate-200 mb-4"></i>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No call logs recorded yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {callInteractions.length > 8 && (
           <div className="p-6 text-center border-t border-slate-50">
              <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All {callInteractions.length} Logs</button>
           </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
