import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, FolderHeart, Stethoscope, User } from 'lucide-react';

const PatientBottomNav = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentPath = location.pathname;
  const currentTab = searchParams.get('tab');

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/patient/dashboard' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, path: '/patient/dashboard?tab=appointments' },
    { id: 'records', label: 'Records', icon: FolderHeart, path: '/patient/health-locker' },
    { id: 'clinics', label: 'Clinics', icon: Stethoscope, path: '/patient/book-appointment' },
    { id: 'profile', label: 'Profile', icon: User, path: '/patient/profile' }
  ];

  const handleNav = (item) => {
    if (item.id === 'appointments') {
      if (onTabChange) onTabChange('appointments');
    } else if (item.id === 'home') {
      if (onTabChange) onTabChange('home');
    }

    const targetBasePath = item.path.split('?')[0];
    const isAppointmentsNav = item.id === 'appointments';
    const isHomeNav = item.id === 'home';

    const shouldNavigate = 
      currentPath !== targetBasePath || 
      (isAppointmentsNav && currentTab !== 'appointments') || 
      (isHomeNav && currentTab === 'appointments');

    if (shouldNavigate) {
      navigate(item.path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 px-2 py-1.5 pb-safe md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          let isActive = false;
          if (item.id === 'home') {
            isActive = (currentPath === '/patient/dashboard' && (!currentTab || currentTab === 'home') && activeTab !== 'appointments');
          } else if (item.id === 'appointments') {
            isActive = (currentPath === '/patient/dashboard' && currentTab === 'appointments') || activeTab === 'appointments';
          } else {
            isActive = currentPath.startsWith(item.path);
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'text-teal-700 bg-teal-50/90 scale-105 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
              }`}
            >
              <div className="relative">
                <Icon size={21} className={`transition-transform duration-300 ${isActive ? 'stroke-[2.5px] text-teal-700 -translate-y-0.5' : 'stroke-[1.8px] group-hover:scale-105'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-600 rounded-full animate-pulse" />
                )}
              </div>
              <span className={`text-[11px] mt-1 tracking-tight transition-all duration-300 ${isActive ? 'font-bold text-teal-900' : 'font-medium text-slate-500'}`}>
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
