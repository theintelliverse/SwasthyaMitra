import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, FolderHeart, Stethoscope, User } from 'lucide-react';

const PatientBottomNav = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/patient/dashboard' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, path: '/patient/dashboard?tab=appointments' },
    { id: 'records', label: 'Records', icon: FolderHeart, path: '/patient/health-locker' },
    { id: 'clinics', label: 'Clinics', icon: Stethoscope, path: '/patient/book-appointment' },
    { id: 'profile', label: 'Profile', icon: User, path: '/patient/profile' }
  ];

  const currentPath = location.pathname;

  const handleNav = (item) => {
    if (onTabChange && item.id === 'appointments') {
      onTabChange('appointments');
    }
    if (currentPath !== item.path.split('?')[0]) {
      navigate(item.path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 pb-safe md:hidden shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = (onTabChange && item.id === 'appointments' && activeTab === 'appointments') ||
            (currentPath === item.path.split('?')[0] && item.id !== 'appointments');

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-teal-700 font-bold bg-teal-50/80 scale-105' 
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5px] text-teal-700' : 'stroke-[1.8px]'} />
              <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'font-semibold text-teal-800' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default PatientBottomNav;
