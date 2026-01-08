
import React from 'react';

const ProfilePage: React.FC = () => {
  const user = {
    name: 'Rahul Singh',
    role: 'Senior Sales Agent',
    id: 'AGENT-99',
    region: 'South Nagpur',
    reraId: 'NAG/A/2023/11023',
    visits: 25,
    earnings: 245000,
    rank: 3,
    totalAgents: 12,
    joinDate: '15 Jan 2022'
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="w-28 h-28 bg-indigo-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
            <i className="fas fa-user-tie text-indigo-600 text-5xl"></i>
          </div>
          <button className="absolute bottom-0 right-0 w-10 h-10 btn-3d btn-3d-indigo text-white rounded-full border-2 border-white flex items-center justify-center">
            <i className="fas fa-camera text-xs"></i>
          </button>
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{user.name}</h2>
        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{user.role} • {user.id}</p>
        <div className="flex gap-2 mt-6">
          <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            {user.region}
          </span>
          <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            Verified RERA
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card-neo p-6 rounded-[2rem] flex flex-col items-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visits</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{user.visits}</p>
        </div>
        <div className="card-neo p-6 rounded-[2rem] flex flex-col items-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Earnings</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">₹{user.earnings/1000}K</p>
        </div>
        <div className="card-neo p-6 rounded-[2rem] flex flex-col items-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</p>
          <p className="text-2xl font-black text-amber-500 mt-1">#{user.rank}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-5 border-b bg-slate-50">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Professional Details</h3>
        </div>
        <div className="divide-y divide-slate-50">
          <ProfileRow label="RERA ID" value={user.reraId} />
          <ProfileRow label="Join Date" value={user.joinDate} />
          <ProfileRow label="Territory" value="Nagpur South & Wardha Road" />
          <ProfileRow label="Specialization" value="Luxury Residential" />
        </div>
      </div>

      <button className="w-full py-5 btn-3d btn-3d-red text-white font-black rounded-3xl transition-colors flex items-center justify-center gap-3 uppercase text-xs tracking-widest">
        <i className="fas fa-sign-out-alt"></i> Logout Session
      </button>
    </div>
  );
};

const ProfileRow: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="px-8 py-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-slate-700 tracking-tight">{value}</span>
  </div>
);

export default ProfilePage;
