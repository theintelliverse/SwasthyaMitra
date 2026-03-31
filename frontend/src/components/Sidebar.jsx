import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Settings,
  UserCircle,
  LogOut,
  ClipboardList,
  Activity,
  Beaker,
  ShieldCheck,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const Sidebar = ({ role }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const clinicName = localStorage.getItem('clinicName') || 'Appointory Hub';
  const userName = localStorage.getItem('userName') || 'User';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // --- 🛠️ DYNAMIC ROLE-BASED NAVIGATION ---
  const menuItems = {
    admin: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
      { name: 'Staff Management', path: '/admin/staff-management', icon: <Users size={20} /> },
      { name: 'Clinic Analytics', path: '/admin/analytics', icon: <Activity size={20} /> },
      { name: 'Medical History', path: '/admin/history', icon: <ClipboardList size={20} /> },
      { name: 'Clinic Settings', path: '/admin/settings', icon: <Settings size={20} /> },
    ],
    doctor: [
      { name: 'Patient Queue', path: '/doctor/dashboard', icon: <Activity size={20} /> },
      { name: 'Health Locker', path: '/doctor/locker-search', icon: <ShieldCheck size={20} /> },
      { name: 'Clinic Records', path: '/doctor/records', icon: <ClipboardList size={20} /> },
    ],
    receptionist: [
      { name: 'Reception Hub', path: '/receptionist/dashboard', icon: <Users size={20} /> },
      { name: 'Add Patient', path: '/receptionist/add', icon: <Activity size={20} /> },
    ],
    lab: [
      { name: 'Diagnostics Hub', path: '/lab/dashboard', icon: <Beaker size={20} /> },
    ]
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-8 right-8 z-50 w-14 h-14 bg-marigold text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all active:scale-95"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-40
          w-64 bg-gradient-to-b from-white to-parchment/30 border-r border-sandstone flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:translate-x-0 overflow-y-auto
        `}
      >
        {/* --- Clinic Branding --- */}
        <div className="flex-shrink-0 p-6 border-b border-sandstone/30">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              navigate(`/${role}/dashboard`);
              setIsOpen(false);
            }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-marigold to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-marigold/30 group-hover:shadow-xl transition-all">
              <span className="text-white font-heading font-bold text-xl">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-lg leading-tight text-teak text-nowrap">Appointory</h2>
              <p className="text-[9px] font-black uppercase tracking-widest text-khaki truncate">{clinicName}</p>
            </div>
          </div>
        </div>

        {/* --- Navigation Links --- */}
        <nav className="flex-grow px-3 py-6 space-y-1">
          <p className="text-[9px] font-black uppercase text-khaki mb-4 px-4 tracking-[0.2em] opacity-60">Menu</p>
          {menuItems[role]?.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200
                group relative overflow-hidden
                ${isActive
                  ? 'bg-gradient-to-r from-marigold/20 to-orange-50 text-marigold border-l-4 border-marigold shadow-sm'
                  : 'text-khaki hover:bg-parchment/60 hover:text-teak hover:translate-x-1'}
              `}
            >
              <span className="flex items-center gap-3">
                <span className="transition-transform group-hover:scale-110">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </span>
              <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* --- Bottom Profile Section --- */}
        <div className="flex-shrink-0 p-4 border-t border-sandstone/30 bg-gradient-to-b from-transparent to-parchment/40 space-y-3">
          <div className="px-3 py-3 mb-1 flex items-center gap-3 bg-white border border-sandstone/20 rounded-xl hover:border-sandstone/40 transition-all hover:shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-teak to-orange-700 rounded-lg flex items-center justify-center text-white text-[11px] font-black flex-shrink-0 shadow-md">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-[10px] font-black text-teak truncate uppercase">{userName}</p>
              <p className="text-[8px] font-bold text-khaki uppercase tracking-tighter capitalize">{role}</p>
            </div>
          </div>

          <NavLink
            to="/profile"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all
              ${isActive
                ? 'bg-gradient-to-r from-marigold to-orange-500 text-white shadow-md hover:shadow-lg'
                : 'text-khaki hover:bg-parchment/60 hover:text-teak'}
            `}
          >
            <UserCircle size={18} />
            <span className="text-xs">Account</span>
          </NavLink>

          <button
            onClick={() => {
              handleLogout();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs text-red-500 bg-red-50/50 hover:bg-red-100 hover:text-red-700 transition-all active:scale-95 border border-red-100"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;