
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
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
  
  const allInteractions: ClientInteraction[] = clients.reduce((acc, client) => {
    return [...acc, ...(client.interactions || [])];
  }, [] as ClientInteraction[]);

  const callInteractions = allInteractions.filter(i => i.type === 'Call');
  
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
    { label: 'Total Properties', value: properties.length.toString(), sub: `${properties.filter(p => p.listingType === 'Pre-launch').length} Pre-launch`, icon: 'fa-building', color: 'indigo' },
    { label: 'Call Productivity', value: callInteractions.length.toString(), sub: `Total logs`, icon: 'fa-phone-volume', color: 'emerald' },
    { label: 'Revenue Generated', value: `₹${(totalRevenue / 10000000).toFixed(2)}Cr`, sub: `Closed sales`, icon: 'fa-coins', color: 'amber' },
    { label: 'Visits Today', value: visitsToday.toString().padStart(2, '0'), sub: `${visits.filter(v => v.status === 'Completed').length} total`, icon: 'fa-calendar-day', color: 'purple' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Agent Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Monitoring Nagpur region performance.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
           <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
             <i className="fas fa-trophy text-xl"></i>
           </div>
           <div>
             <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Team Rank</p>
             <p className="font-black text-slate-800 dark:text-white">#3 / 12 Agents</p>
           </div>
        </div>
      </div>

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
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h3>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card-neo p-8 rounded-[2.5rem]">
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-6">Call Log Maintenance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lead</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Summary</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {callInteractions.slice(0, 5).map((log) => {
                  const client = clients.find(c => c.id === log.clientId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-slate-800 dark:text-white uppercase leading-tight">{client ? `${client.firstName} ${client.lastName}` : 'Guest'}</p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{log.clientId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800">
                          {log.description.split(': ')[1]?.split(' - ')[0] || 'Called'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 italic truncate max-w-[200px]">
                          {log.description.split(' - ')[1] || 'No notes.'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-neo p-8 rounded-[2.5rem]">
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-4">Disposition Breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
