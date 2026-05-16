import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  ChevronRight,
  TestTubes,
  FileCheck,
  Calendar,
  MessageSquare,
  LifeBuoy,
  HelpCircle,
  FileText,
  Layout
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const Sidebar = ({ role = 'lab' }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [analysisMode, setAnalysisMode] = useState(false);
  const navigate = useNavigate();

  // Safely get user info from localStorage
  const getSafeStorageItem = (key, fallback) => {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      console.warn(`Storage access failed for ${key}`, e);
      return fallback;
    }
  };

  const clinicName = getSafeStorageItem('clinicName', 'Appointory Hub');
  const userName = getSafeStorageItem('userName', 'Healthcare Professional');
  const userRole = role || getSafeStorageItem('role', 'staff');

  const menuItems = useMemo(() => {
    const config = {
      admin: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Staff Management', path: '/admin/staff-management', icon: <Users size={20} /> },
        { name: 'Clinic Settings', path: '/admin/settings', icon: <Settings size={20} /> },
        { name: 'Reports', path: '/admin/reports', icon: <Settings size={20} /> },
        { name: 'Profile', path: '/profile', icon: <UserCircle size={20} /> },
      ],
      doctor: [
        { name: 'Dashboard', path: '/doctor/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Appointments', path: '/doctor/appointments', icon: <Calendar size={20} /> },
        { name: 'Patients', path: '/doctor/patients', icon: <Users size={20} /> },
        { name: 'Prescriptions', path: '/doctor/prescriptions', icon: <FileText size={20} /> },
        { name: 'Templates', path: '/doctor/templates', icon: <Layout size={20} /> },
        { name: 'Reports', path: '/doctor/reports', icon: <ClipboardList size={20} /> },
        { name: 'Profile', path: '/profile', icon: <UserCircle size={20} /> },
      ],
      receptionist: [
        { name: 'Reception Hub', path: '/receptionist/dashboard', icon: <Users size={20} /> },
        { name: 'Add Patient', path: '/receptionist/add', icon: <Activity size={20} /> },
      ],
      lab: [
        { name: 'Dashboard', path: '/lab/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Test Requests', path: '/lab/requests', icon: <ClipboardList size={20} /> },
        { name: 'Samples', path: '/lab/samples', icon: <TestTubes size={20} /> },
        { name: 'Reports', path: '/lab/reports', icon: <FileCheck size={20} /> },
        { name: 'Analytics', path: '/lab/analytics', icon: <Activity size={20} /> },
        { name: 'Settings', path: '/lab/settings', icon: <Settings size={20} /> },
      ],
      patient: [
        { name: 'Health Hub', path: '/patient/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Health Locker', path: '/patient/locker', icon: <ShieldCheck size={20} /> },
        { name: 'Book Slot', path: '/patient/book-appointment', icon: <Calendar size={20} /> },
        { name: 'My Profile', path: '/profile', icon: <UserCircle size={20} /> },
      ]
    };
    // Normalize role key to lowercase to match config
    const normalizedRole = (userRole || 'staff').toLowerCase();
    return config[normalizedRole] || config.lab || [];
  }, [userRole]);

  const handleLogout = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      const token = localStorage.getItem('token');

      if (sessionId && token) {
        await axios.post(`${API_URL}/api/auth/logout`, { sessionId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error("Logout tracking failed", err);
    } finally {
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-3 bg-teal-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-40
          w-72 bg-white border-r border-gray-100 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-2xl lg:shadow-none
        `}
      >
        {/* Logo Section */}
        <div className="p-8">
          <div
            onClick={() => navigate(`/${userRole}/dashboard`)}
            className="flex items-center gap-4 group cursor-pointer"
          >
            <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-600/20 group-hover:rotate-6 transition-all duration-300">
              <ShieldCheck size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">
                {clinicName.split(' ')[0]}<span className="text-teal-600">.</span>
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Healthcare OS</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-4 custom-scrollbar">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 group
                ${isActive
                  ? 'bg-teal-50 text-teal-600 shadow-sm shadow-teal-100/50'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
              `}
              onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
            >
              <div className={`transition-transform group-hover:scale-110 duration-200`}>
                {item.icon}
              </div>
              <span className="flex-1">{item.name}</span>
              {item.name === 'Dashboard' && (
                <div className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              )}
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="p-6 border-t border-gray-50 bg-gray-50/30">
          <div 
            onClick={() => navigate('/profile')}
            className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm mb-4 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all group/card"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 font-bold text-sm border border-teal-100 group-hover/card:bg-teal-600 group-hover/card:text-white transition-colors">
                {userName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-0.5">
                  {userRole === 'doctor' ? 'Doctor' : userRole === 'lab' ? 'Laboratory' : userRole === 'patient' ? 'Patient' : userRole}
                </p>
                <p className="text-sm font-black text-gray-900 truncate tracking-tight leading-tight group-hover/card:text-teal-600 transition-colors">
                  {(() => {
                    const name = userName;
                    if (userRole === 'doctor') {
                      return name.toLowerCase().startsWith('dr') ? name : `Dr. ${name}`;
                    }
                    return name;
                  })()}
                </p>
                <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">
                  {userRole === 'doctor' ? 'Chief Physician' : userRole === 'lab' ? 'Diagnostics Lead' : userRole === 'patient' ? 'Wellness Member' : 'Staff Member'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 group-hover/card:bg-teal-50 transition-colors">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-teal-600" />
                <span className="text-[10px] font-bold text-gray-500">Live Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-black text-green-600 uppercase">Online</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-xs text-red-500 hover:bg-red-50 transition-all active:scale-95 border border-transparent hover:border-red-100 group"
          >
            <div className="p-2 rounded-xl bg-red-50 group-hover:bg-red-100 transition-colors">
              <LogOut size={16} />
            </div>
            <span className="flex-1 text-left uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;