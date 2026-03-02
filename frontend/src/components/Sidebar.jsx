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
  const clinicName = localStorage.getItem('clinicName') || 'Swasthya Hub';
  const userName = localStorage.getItem('userName') || 'User';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // --- 🛠️ DYNAMIC ROLE-BASED NAVIGATION ---
  const menuItems = {
    admin: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20}/> },
      { name: 'Staff Management', path: '/admin/staff-management', icon: <Users size={20}/> },
      { name: 'Clinic Analytics', path: '/admin/analytics', icon: <Activity size={20}/> },
      { name: 'Medical History', path: '/admin/history', icon: <ClipboardList size={20}/> },
      { name: 'Clinic Settings', path: '/admin/settings', icon: <Settings size={20}/> },
    ],
    doctor: [
      { name: 'Patient Queue', path: '/doctor/dashboard', icon: <Activity size={20}/> },
      { name: 'Health Locker', path: '/doctor/locker-search', icon: <ShieldCheck size={20}/> },
      { name: 'Clinic Records', path: '/doctor/records', icon: <ClipboardList size={20}/> },
    ],
    receptionist: [
      { name: 'Reception Hub', path: '/receptionist/dashboard', icon: <Users size={20}/> },
      { name: 'Add Patient', path: '/receptionist/add', icon: <Activity size={20}/> },
    ],
    lab: [
      { name: 'Diagnostics Hub', path: '/lab/dashboard', icon: <Beaker size={20}/> },
    ]
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-[#E8DDCB] flex flex-col p-6 sticky top-0 z-40">
      
      {/* --- Clinic Branding --- */}
      <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => navigate(`/${role}/dashboard`)}>
        <div className="w-10 h-10 bg-[#FFA800] rounded-xl flex items-center justify-center shadow-lg shadow-marigold/20">
          <span className="text-white font-heading font-bold text-xl">A</span>
        </div>
        <div>
          <h2 className="font-heading text-lg leading-tight text-[#422D0B]">Appointory</h2>
          <p className="text-[9px] font-black uppercase tracking-widest text-[#967A53]">{clinicName}</p>
        </div>
      </div>

      {/* --- Navigation Links --- */}
      <nav className="flex-grow space-y-1.5">
        <p className="text-[9px] font-black uppercase text-[#967A53] mb-4 px-4 tracking-[0.2em] opacity-60">Menu</p>
        {menuItems[role]?.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all
              ${isActive 
                ? 'bg-[#FFFBF5] text-[#FFA800] border border-[#E8DDCB] shadow-sm' 
                : 'text-[#967A53] hover:bg-[#FFFBF5] hover:text-[#422D0B]'}
            `}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* --- Bottom Profile Section --- */}
      <div className="pt-6 border-t border-[#E8DDCB] mt-auto space-y-2">
        <div className="px-4 py-3 mb-2 flex items-center gap-3 bg-[#FFFBF5] rounded-2xl border border-[#E8DDCB]/50">
           <div className="w-8 h-8 bg-[#422D0B] rounded-lg flex items-center justify-center text-white text-[10px] font-black">
              {userName.charAt(0)}
           </div>
           <div className="overflow-hidden">
              <p className="text-[10px] font-black text-[#422D0B] truncate uppercase">{userName}</p>
              <p className="text-[8px] font-bold text-[#967A53] uppercase tracking-tighter capitalize">{role}</p>
           </div>
        </div>

        <NavLink
          to="/profile"
          className={({ isActive }) => `
            flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm transition-all
            ${isActive ? 'bg-[#FFA800] text-white' : 'text-[#967A53] hover:bg-[#FFFBF5] hover:text-[#422D0B]'}
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