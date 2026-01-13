
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types';

interface FooterProps {
  role?: UserRole;
}

const Footer: React.FC<FooterProps> = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Clients', icon: 'fa-users', path: '/clients' },
    { label: 'Visits', icon: 'fa-calendar-check', path: '/visits' },
    { label: 'Properties', icon: 'fa-building', path: '/properties' },
  ];

  if (role === UserRole.SUPER_ADMIN) {
    navItems.push({ label: 'Admin', icon: 'fa-lock', path: '/admin' });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl text-slate-800 px-6 py-3 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 flex items-center gap-4 border border-white/40 transition-all duration-300">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`btn-3d px-6 py-2 rounded-2xl flex flex-col items-center gap-1 transition-all duration-300 ${
            isActive(item.path) ? 'btn-3d-indigo text-white' : 'btn-3d-white'
          }`}
        >
          <div className="relative">
            <i className={`fas ${item.icon} text-lg`}></i>
            {isActive(item.path) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border-2 border-indigo-600"></span>
            )}
          </div>
          <span className="text-[9px] font-black tracking-widest uppercase">{item.label}</span>
        </button>
      ))}
    </footer>
  );
};

export default Footer;
