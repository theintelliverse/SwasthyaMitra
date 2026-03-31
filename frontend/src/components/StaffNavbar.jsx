import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { LogOut, Bell, User, Settings, ShieldCheck, Menu, X, Clock } from 'lucide-react';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const StaffNavbar = ({ roleName }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    <>
      <nav className="bg-gradient-to-r from-white to-parchment/40 border-b border-sandstone/30 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        {/* Left Section: Context */}
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-marigold to-orange-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-marigold/20 flex-shrink-0">
            <span className="text-white font-heading font-bold text-lg md:text-xl">{roleName ? roleName[0].toUpperCase() : 'S'}</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-lg md:text-xl text-teak leading-none truncate">{roleName} Portal</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
              <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-khaki truncate">{clinicName} • Live</p>
            </div>
          </div>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-3 md:gap-6">
          {/* Quick Utilities - Hidden on Mobile */}
          <div className="hidden md:flex items-center gap-2 border-r border-sandstone/20 pr-4 md:pr-6">
            <button
              className="p-2 text-khaki hover:text-marigold hover:bg-parchment rounded-lg transition-all relative group"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="invisible group-hover:visible absolute bottom-full right-0 mb-2 bg-teak text-white text-xs px-2 py-1 rounded whitespace-nowrap">Notifications</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="p-2 text-khaki hover:text-marigold hover:bg-parchment rounded-lg transition-all group relative"
              title="Settings"
            >
              <Settings size={18} />
              <span className="invisible group-hover:visible absolute bottom-full right-0 mb-2 bg-teak text-white text-xs px-2 py-1 rounded whitespace-nowrap">Settings</span>
            </button>
          </div>

          {/* User Identity - Hidden on Small Screens */}
          <div className="hidden sm:flex items-center gap-3 md:gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-teak truncate">{userName}</p>
              <p className="text-[8px] font-bold text-khaki uppercase tracking-tighter">Authorized Access</p>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-khaki hover:text-marigold hover:bg-parchment rounded-lg transition-all"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Sign Out Button - Desktop */}
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-parchment to-parchment/80 border border-sandstone rounded-xl text-[10px] font-black uppercase tracking-widest text-khaki hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95 group"
          >
            <LogOut size={14} className="transition-transform group-hover:translate-x-0.5" />
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/20 z-10 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Mobile Menu Panel */}
          <div className="fixed top-16 right-0 left-4 bg-white border border-sandstone rounded-xl shadow-lg z-20 md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-3 pb-3 border-b border-sandstone/20">
                <div className="w-10 h-10 bg-gradient-to-br from-teak to-orange-700 rounded-lg flex items-center justify-center text-white text-[11px] font-black">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-teak uppercase">{userName}</p>
                  <p className="text-[8px] text-khaki capitalize">{roleName}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 text-khaki hover:bg-parchment rounded-lg transition-all text-sm font-bold"
                onClick={() => {
                  setIsMenuOpen(false);
                }}
              >
                <Bell size={16} />
                <span>Notifications</span>
              </button>

              <button
                onClick={() => {
                  navigate('/profile');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-khaki hover:bg-parchment rounded-lg transition-all text-sm font-bold"
              >
                <User size={16} />
                <span>Profile</span>
              </button>

              <button
                onClick={() => {
                  navigate('/profile');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-khaki hover:bg-parchment rounded-lg transition-all text-sm font-bold"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>

              <div className="pt-3 border-t border-sandstone/20">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all text-sm font-bold border border-red-100"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default StaffNavbar;