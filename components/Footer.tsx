
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ResourceType, ResourceAction } from '../types';

interface FooterProps {
  role?: string;
  checkPermission?: (resource: ResourceType, action?: ResourceAction) => boolean;
}

const Footer: React.FC<FooterProps> = ({ role, checkPermission }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Core navigation items focusing on CRM data modules
  const allNavItems = [
    { label: 'Leads', icon: 'fa-users', path: '/clients', resource: 'Leads' as ResourceType },
    { label: 'Site Visit', icon: 'fa-calendar-check', path: '/visits', resource: 'Site Visits' as ResourceType },
    { label: 'Properties', icon: 'fa-building', path: '/properties', resource: 'Properties' as ResourceType },
  ];

  // Filter items based on user permissions
  const navItems = allNavItems.filter(item => 
    checkPermission ? checkPermission(item.resource) : true
  );

  const isActive = (path: string) => location.pathname === path;

  // If no items are permitted, don't render footer
  if (navItems.length === 0) return null;

  return (
    <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl px-6 py-4 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] z-[100] border border-white/40 dark:border-slate-800/50 transition-all duration-300">
      <div className="flex items-center justify-around gap-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex-1 flex flex-col items-center gap-1.5 py-1 px-1 rounded-2xl transition-all duration-300 group ${
              isActive(item.path) 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isActive(item.path) 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none scale-105' 
                : 'bg-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-700/50'
            }`}>
              <i className={`fas ${item.icon} text-lg`}></i>
            </div>
            <span className={`text-[8px] font-black uppercase tracking-[0.15em] transition-opacity duration-300 ${isActive(item.path) ? 'opacity-100' : 'opacity-60'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </footer>
  );
};

export default Footer;
