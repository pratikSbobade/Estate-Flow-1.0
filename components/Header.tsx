
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole, ResourceType, ResourceAction } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddClick: () => void;
  onFilterClick: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  role?: string;
  checkPermission?: (resource: ResourceType, action?: ResourceAction) => boolean;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange, onAddClick, onFilterClick, theme, onToggleTheme, role, checkPermission }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Removed '/admin' from isMainPage to hide the global search bar in the admin module
  const isMainPage = ['/clients', '/visits', '/properties'].includes(location.pathname);
  const isExpandedAddPage = ['/clients', '/properties', '/visits'].includes(location.pathname);

  // Dynamic Visibility checks
  const canSeeLeads = checkPermission ? checkPermission('Leads') : true;
  const canSeeProperties = checkPermission ? checkPermission('Properties') : true;
  const canSeeVisits = checkPermission ? checkPermission('Site Visits') : true;

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/clients': return 'Leads';
      case '/visits': return 'Site Visit';
      case '/properties': return 'Properties';
      case '/emi': return 'EMI Calc';
      case '/profile': return 'My Profile';
      case '/admin': return 'Admin Panel';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 sm:px-6 flex items-center justify-between shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_4px_12px_-4px_#4f46e5] transition-transform active:scale-95">
              <i className="fas fa-home-alt text-white text-sm"></i>
            </div>
            <div className="text-left">
              <span className="block font-black text-slate-900 dark:text-white leading-none text-sm tracking-tight">Estate Flow</span>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">CRM Solutions</span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {(role === 'role_admin' || role === 'role_super_admin') && (
            <button 
              onClick={() => navigate('/admin')}
              className={`w-9 h-9 btn-3d flex items-center justify-center rounded-xl transition-all ${
                location.pathname === '/admin' ? 'btn-3d-indigo text-white' : 'btn-3d-white'
              }`}
              title="Admin Panel"
            >
              <i className="fas fa-lock text-sm"></i>
            </button>
          )}

          <button onClick={onToggleTheme} className="w-9 h-9 btn-3d btn-3d-white flex items-center justify-center rounded-xl transition-all" title="Toggle Theme">
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-sm`}></i>
          </button>

          <button onClick={() => navigate('/emi')} className={`w-9 h-9 btn-3d flex items-center justify-center rounded-xl transition-all ${location.pathname === '/emi' ? 'btn-3d-indigo text-white' : 'btn-3d-white'}`} title="EMI Calculator">
            <i className="fas fa-calculator text-sm"></i>
          </button>

          <button onClick={() => navigate('/profile')} className={`w-9 h-9 btn-3d flex items-center justify-center rounded-xl transition-all ${location.pathname === '/profile' ? 'btn-3d-indigo text-white' : 'btn-3d-white'}`} title="My Profile">
            <i className="fas fa-user-circle text-base"></i>
          </button>
        </div>
      </header>

      {isMainPage && (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex items-center gap-2 animate-slide-up transition-colors duration-300">
          <div className="flex-1 relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs"></i>
            <input type="text" placeholder={`Search ${getPageTitle()}...`} value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700 border-none rounded-xl text-xs font-semibold dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500" />
          </div>
          
          {isExpandedAddPage && (
            <button onClick={onAddClick} className="h-10 px-6 btn-3d btn-3d-indigo text-white flex items-center justify-center rounded-xl gap-2 transition-all" title="Add New">
              <i className="fas fa-plus text-sm"></i>
              <span className="text-[10px] font-black uppercase tracking-widest">Add</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Header;
