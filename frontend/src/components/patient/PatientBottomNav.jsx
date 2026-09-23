import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, FolderHeart, Stethoscope, User } from 'lucide-react';

const PatientBottomNav = ({ activeTab: forcedActiveTab, onTabChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab');

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/patient/dashboard' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, path: '/patient/dashboard?tab=appointments' },
    { id: 'records', label: 'Records', icon: FolderHeart, path: '/patient/health-locker' },
    { id: 'clinics', label: 'Clinics', icon: Stethoscope, path: '/patient/book-appointment' },
    { id: 'profile', label: 'Profile', icon: User, path: '/patient/profile' }
  ];

  const triggerHaptic = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch {
      // Vibration not supported or permitted
    }
  };

  const handleNav = (item) => {
    triggerHaptic();

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
    <nav 
      aria-label="Patient Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 shadow-[0_-6px_25px_rgba(15,23,42,0.06)] px-2 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom,8px))]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          let isActive = false;
          if (forcedActiveTab) {
            isActive = forcedActiveTab === item.id;
          } else if (item.id === 'home') {
            isActive = currentPath === '/patient/dashboard' && (!currentTab || currentTab === 'home');
          } else if (item.id === 'appointments') {
            isActive = currentPath === '/patient/dashboard' && currentTab === 'appointments';
          } else if (item.id === 'records') {
            isActive = currentPath.startsWith('/patient/health-locker') || currentPath.startsWith('/patient/locker');
          } else if (item.id === 'clinics') {
            isActive = currentPath.startsWith('/patient/book-appointment');
          } else if (item.id === 'profile') {
            isActive = currentPath.startsWith('/patient/profile');
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              aria-label={item.label}
              className="relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-transform duration-150 active:scale-90 select-none group focus:outline-none"
            >
              <div 
                className={`relative flex items-center justify-center w-11 h-7 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-teal-50 text-teal-700 shadow-sm shadow-teal-600/10' 
                    : 'text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-50/70'
                }`}
              >
                <Icon 
                  size={20} 
                  className={`transition-all duration-300 ${
                    isActive 
                      ? 'stroke-[2.3px] text-teal-700 scale-105' 
                      : 'stroke-[1.8px] text-slate-400 group-hover:scale-105'
                  }`} 
                />
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-teal-600 rounded-full shadow-sm shadow-teal-600/40 animate-pulse" />
                )}
              </div>
              <span 
                className={`text-[10px] tracking-tight transition-all duration-200 mt-0.5 select-none leading-none ${
                  isActive 
                    ? 'font-bold text-teal-900 scale-105' 
                    : 'font-medium text-slate-500'
                }`}
              >
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
