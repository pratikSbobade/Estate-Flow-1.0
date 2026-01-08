
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddClick: () => void;
  onFilterClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange, onAddClick, onFilterClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isMainPage = ['/clients', '/visits', '/properties'].includes(location.pathname);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/clients': return 'Clients';
      case '/visits': return 'Site Visits';
      case '/properties': return 'Properties';
      case '/emi': return 'EMI Calc';
      case '/profile': return 'My Profile';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Top Brand Row */}
      <header className="h-16 bg-white border-b border-slate-100 px-4 sm:px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_4px_12px_-4px_#4f46e5] transition-transform active:scale-95">
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
            onClick={() => navigate('/emi')}
            className={`w-9 h-9 btn-3d flex items-center justify-center rounded-xl transition-all ${
              location.pathname === '/emi' ? 'btn-3d-indigo text-white' : 'btn-3d-white'
            }`}
            title="EMI Calculator"
          >
            <i className="fas fa-calculator text-sm"></i>
          </button>

          <button 
            onClick={() => navigate('/profile')}
            className={`w-9 h-9 btn-3d flex items-center justify-center rounded-xl transition-all ${
              location.pathname === '/profile' ? 'btn-3d-indigo text-white' : 'btn-3d-white'
            }`}
            title="My Profile"
          >
            <i className="fas fa-user-circle text-base"></i>
          </button>
        </div>
      </header>

      {/* Secondary Search/Add/Filter Bar for Main Pages */}
      {isMainPage && (
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center gap-2 animate-slide-up">
          <div className="flex-1 relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              type="text"
              placeholder={`Search ${getPageTitle()}...`}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          
          <button 
            onClick={onFilterClick}
            className="w-10 h-10 btn-3d btn-3d-white flex items-center justify-center rounded-xl"
            title="Filter"
          >
            <i className="fas fa-filter text-xs"></i>
          </button>

          <button 
            onClick={onAddClick}
            className="w-10 h-10 btn-3d btn-3d-indigo text-white flex items-center justify-center rounded-xl"
            title="Add New"
          >
            <i className="fas fa-plus text-sm"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
