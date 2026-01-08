
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  onFilterToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onFilterToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-100 z-50 px-4 sm:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-3 group btn-3d"
        >
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_4px_12px_-4px_#4f46e5] transition-transform">
            <i className="fas fa-home-alt text-white text-sm"></i>
          </div>
          <div className="text-left">
            <span className="block font-black text-slate-900 leading-none text-sm tracking-tight">Estate Flow</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">CRM Solutions</span>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button 
          onClick={onFilterToggle}
          className="w-9 h-9 btn-3d btn-3d-white flex items-center justify-center rounded-xl transition-all"
          title="Filter Results"
        >
          <i className="fas fa-sliders-h text-sm"></i>
        </button>

        <button 
          onClick={() => navigate('/profile')}
          className="w-9 h-9 btn-3d btn-3d-white flex items-center justify-center rounded-xl transition-all"
        >
          <i className="fas fa-user-circle text-base"></i>
        </button>
      </div>
    </header>
  );
};

export default Header;
