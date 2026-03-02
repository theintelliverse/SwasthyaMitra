import React from 'react';
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
  Search
} from 'lucide-react';
const API_URL = import.meta.env.VITE_API_URL;
const Sidebar = ({ role }) => {
  const navigate = useNavigate();
  const clinicName = sessionStorage.getItem('clinicName') || localStorage.getItem('clinicName') || 'Swasthya Hub';
  const userName = sessionStorage.getItem('userName') || localStorage.getItem('userName') || 'User';

  const handleLogout = () => {
    sessionStorage.clear();
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
    <aside className="w-64 min-h-screen bg-white border-r border-[#AFC4D8] flex flex-col p-6 sticky top-0 z-40">

      {/* --- Clinic Branding --- */}
      <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => navigate(`/${role}/dashboard`)}>
        <div className="w-10 h-10 bg-[#1F6FB2] rounded-xl flex items-center justify-center shadow-lg shadow-marigold/20">
          <span className="text-white font-heading font-bold text-xl">A</span>
        </div>
        <div>
          <h2 className="font-heading text-lg leading-tight text-[#0F766E]">Appointory</h2>
          <p className="text-[9px] font-black uppercase tracking-widest text-[#3FA28C]">{clinicName}</p>
        </div>
      </div>

      {/* --- Navigation Links --- */}
      <nav className="flex-grow space-y-1.5">
        <p className="text-[9px] font-black uppercase text-[#3FA28C] mb-4 px-4 tracking-[0.2em] opacity-60">Menu</p>
        {menuItems[role]?.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all
              ${isActive
                ? 'bg-[#EEF6FA] text-[#1F6FB2] border border-[#AFC4D8] shadow-sm'
                : 'text-[#3FA28C] hover:bg-[#EEF6FA] hover:text-[#0F766E]'}
            `}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* --- Bottom Profile Section --- */}
      <div className="pt-6 border-t border-[#AFC4D8] mt-auto space-y-2">
        <div className="px-4 py-3 mb-2 flex items-center gap-3 bg-[#EEF6FA] rounded-2xl border border-[#AFC4D8]/50">
          <div className="w-8 h-8 bg-[#0F766E] rounded-lg flex items-center justify-center text-white text-[10px] font-black">
            {userName.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black text-[#0F766E] truncate uppercase">{userName}</p>
            <p className="text-[8px] font-bold text-[#3FA28C] uppercase tracking-tighter capitalize">{role}</p>
          </div>
        </div>

        <NavLink
          to="/profile"
          className={({ isActive }) => `
            flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm transition-all
            ${isActive ? 'bg-[#1F6FB2] text-white' : 'text-[#3FA28C] hover:bg-[#EEF6FA] hover:text-[#0F766E]'}
          `}
        >
          <UserCircle size={20} />
          Account
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;