import React from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { LogOut, Bell, User, Settings, ShieldCheck } from 'lucide-react';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const StaffNavbar = ({ roleName }) => {
  const navigate = useNavigate();
  const clinicName = localStorage.getItem('clinicName') || 'Clinic';
  const userName = localStorage.getItem('userName') || 'Staff Member';

  const handleLogout = () => {
    Swal.fire({
      title: 'Sign Out?',
      text: "Ensure all patient records are saved before leaving.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0F766E',
      cancelButtonColor: '#AFC4D8',
      confirmButtonText: 'Sign Out',
      background: '#EEF6FA'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate('/login');
      }
    });
  };

  return (
    <nav className="bg-white border-b border-sandstone px-8 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
      {/* Left Section: Context */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-marigold rounded-xl flex items-center justify-center shadow-lg shadow-marigold/20">
          <span className="text-white font-heading font-bold text-xl">{roleName ? roleName[0] : 'S'}</span>
        </div>
        <div>
          <h1 className="font-heading text-xl text-teak leading-none">{roleName} Portal</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-[9px] font-black uppercase tracking-widest text-khaki">{clinicName} • Live System</p>
          </div>
        </div>
      </div>

      {/* Right Section: Actions & Profile */}
      <div className="flex items-center gap-6">
        {/* Quick Utilities */}
        <div className="hidden md:flex items-center gap-2 border-r border-sandstone pr-6 mr-2">
          <button className="p-2 text-khaki hover:text-marigold hover:bg-parchment rounded-lg transition-all" title="Notifications">
            <Bell size={18} />
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="p-2 text-khaki hover:text-marigold hover:bg-parchment rounded-lg transition-all"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* User Identity */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase text-teak">{userName}</p>
            <p className="text-[8px] font-bold text-khaki uppercase tracking-tighter">Authorized Access</p>
          </div>

          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 px-4 py-2 bg-parchment border border-sandstone rounded-xl text-[10px] font-black uppercase tracking-widest text-khaki hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95"
          >
            <LogOut size={14} className="transition-transform group-hover:translate-x-0.5" />
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default StaffNavbar;