
import React, { useState } from 'react';

const EmiCalculator: React.FC = () => {
  const [amount, setAmount] = useState(5000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  const calculateEMI = () => {
    const r = rate / 12 / 100;
    const n = tenure * 12;
    const emi = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return emi || 0;
  };

  const emi = calculateEMI();
  const totalPayment = emi * tenure * 12;
  const totalInterest = totalPayment - amount;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">EMI Calculator</h1>
      
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-10">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Amount (₹)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-40 text-right font-black text-indigo-600 border-b-4 border-indigo-100 focus:border-indigo-500 outline-none pb-1 bg-transparent"
            />
          </div>
          <input 
            type="range" 
            min="100000" 
            max="100000000" 
            step="100000"
            value={amount} 
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interest Rate (%)</label>
            <input 
              type="number" 
              value={rate} 
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-40 text-right font-black text-indigo-600 border-b-4 border-indigo-100 focus:border-indigo-500 outline-none pb-1 bg-transparent"
            />
          </div>
          <input 
            type="range" 
            min="1" 
            max="20" 
            step="0.1"
            value={rate} 
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tenure (Years)</label>
            <input 
              type="number" 
              value={tenure} 
              onChange={(e) => setTenure(Number(e.target.value))}
              className="w-40 text-right font-black text-indigo-600 border-b-4 border-indigo-100 focus:border-indigo-500 outline-none pb-1 bg-transparent"
            />
          </div>
          <input 
            type="range" 
            min="1" 
            max="30" 
            value={tenure} 
            onChange={(e) => setTenure(Number(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </div>

      <div className="bg-indigo-600 p-10 rounded-[3rem] shadow-2xl text-white space-y-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
          <i className="fas fa-calculator text-9xl"></i>
        </div>
        <div className="text-center relative z-10">
          <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-2">Monthly EMI</p>
          <h2 className="text-5xl font-black tracking-tight">₹{Math.round(emi).toLocaleString()}</h2>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-indigo-500/50 relative z-10">
          <div>
            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Total Interest</p>
            <p className="text-xl font-black mt-1">₹{Math.round(totalInterest/100000).toLocaleString()}L</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Total Payment</p>
            <p className="text-xl font-black mt-1">₹{(totalPayment/10000000).toFixed(2)}Cr</p>
          </div>
        </div>

        <button className="w-full py-5 btn-3d btn-3d-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-none">
          Send Quote via WhatsApp
        </button>
      </div>
    </div>
  );
};

export default EmiCalculator;
