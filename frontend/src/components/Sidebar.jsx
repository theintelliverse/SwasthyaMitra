import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  Users,
  Settings,
  UserCircle,
  LogOut,
  ClipboardList,
  Activity,
  ShieldCheck,
  X,
  ChevronRight,
  TestTubes,
  FileCheck,
  Calendar,
  FileText,
  Layout,
  FolderHeart,
  Plus,
  Bell,
  Receipt,
  Home,
  Stethoscope
} from 'lucide-react';

import { API_URL } from '../config/runtime';

const Sidebar = ({ role = 'lab' }) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isSubscriptionEnforced, setIsSubscriptionEnforced] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    let active = true;
    const fetchConfig = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/superadmin/config/public`);
        if (res.data.success && active) {
          setIsSubscriptionEnforced(res.data.isSubscriptionEnforced);
        }
      } catch (err) {
        console.error("Failed to fetch public config in Sidebar", err);
      }
    };
    fetchConfig();
    return () => { active = false; };
  }, []);

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
  const userName = getSafeStorageItem('userName', '') || getSafeStorageItem('patientName', '') || getSafeStorageItem('labName', 'Healthcare Professional');
  const userRole = role || getSafeStorageItem('role', 'staff');
  const userSpecialization = getSafeStorageItem('specialization', '');
  const userEducation = getSafeStorageItem('education', '');

  // Accurate active item detection handling both pathnames and search params (e.g. ?tab=appointments)
  const isItemActive = (itemPath) => {
    const [pathPart, queryPart] = itemPath.split('?');
    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      const currentParams = new URLSearchParams(location.search);
      let match = location.pathname === pathPart;
      for (const [k, v] of params.entries()) {
        if (currentParams.get(k) !== v) match = false;
      }
      return match;
    }
    // Prevent root /patient/dashboard matching when specific tab query is present
    if (itemPath === '/patient/dashboard' && location.search.includes('tab=appointments')) {
      return false;
    }
    if (itemPath === '/receptionist/dashboard' && location.search.includes('fromAdmin=true')) {
      return false;
    }
    return location.pathname === pathPart;
  };

  const menuItems = useMemo(() => {
    const isIndLab = getSafeStorageItem('labRole', '') === 'independent_lab';
    const config = {
      admin: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Staff Management', path: '/admin/staff-management', icon: <Users size={20} /> },
        { name: 'Front Desk', path: '/receptionist/dashboard?fromAdmin=true', icon: <Layout size={20} /> },
        { name: 'Billing & Receipts', path: '/receptionist/billing', icon: <Receipt size={20} /> },
        { name: 'Clinic Settings', path: '/admin/settings', icon: <Settings size={20} /> },
        { name: 'Reports', path: '/admin/reports', icon: <ClipboardList size={20} /> },
        { name: 'Profile', path: '/profile', icon: <UserCircle size={20} /> },
      ],
      doctor: [
        { name: 'Dashboard', path: '/doctor/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Appointments', path: '/doctor/appointments', icon: <Calendar size={20} /> },
        { name: 'Prescriptions', path: '/doctor/prescriptions', icon: <FileText size={20} /> },
        { name: 'Templates', path: '/doctor/templates', icon: <Layout size={20} /> },
        { name: 'Reports', path: '/doctor/reports', icon: <ClipboardList size={20} /> },
        { name: 'Profile', path: '/profile', icon: <UserCircle size={20} /> },
      ],
      receptionist: [
        { name: 'Reception Hub', path: '/receptionist/dashboard', icon: <Users size={20} /> },
        { name: 'Add Patient', path: '/receptionist/add', icon: <Activity size={20} /> },
        { name: 'Billing & Receipts', path: '/receptionist/billing', icon: <Receipt size={20} /> },
        { name: 'Profile', path: '/profile', icon: <UserCircle size={20} /> },
      ],
      lab: isIndLab ? [
        { name: 'Dashboard', path: '/lab/portal/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Connections', path: '/lab/portal/connections', icon: <Users size={20} /> },
        { name: 'Billing', path: '/lab/portal/billing', icon: <Receipt size={20} /> },
        { name: 'Past Reports', path: '/lab/portal/reports', icon: <FileCheck size={20} /> },
        { name: 'Analytics', path: '/lab/portal/analytics', icon: <Activity size={20} /> },
      ] : [
        { name: 'Dashboard', path: '/lab/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Test Requests', path: '/lab/requests', icon: <ClipboardList size={20} /> },
        { name: 'Samples', path: '/lab/samples', icon: <TestTubes size={20} /> },
        { name: 'Reports', path: '/lab/reports', icon: <FileCheck size={20} /> },
        { name: 'Lab Billing', path: '/receptionist/billing?type=lab', icon: <Receipt size={20} /> },
        { name: 'Analytics', path: '/lab/analytics', icon: <Activity size={20} /> },
        { name: 'Settings', path: '/lab/settings', icon: <Settings size={20} /> },
      ],
      patient: [
        { name: 'Home', path: '/patient/dashboard', icon: <Home size={20} /> },
        { name: 'Appointments', path: '/patient/dashboard?tab=appointments', icon: <Calendar size={20} /> },
        { name: 'Records', path: '/patient/health-locker', icon: <FolderHeart size={20} /> },
        { name: 'Bills & Receipts', path: '/patient/health-locker?tab=bills', icon: <Receipt size={20} /> },
        { name: 'Clinics', path: '/patient/book-appointment', icon: <Stethoscope size={20} /> },
        { name: 'Profile', path: '/patient/profile', icon: <UserCircle size={20} /> },
      ]
    };
    // Normalize role key to lowercase to match config
    const normalizedRole = (userRole || 'staff').toLowerCase();
    const items = [...(config[normalizedRole] || config.lab || [])];

    // If subscription enforcement is active, inject subscription page (except for patient)
    if (isSubscriptionEnforced && normalizedRole !== 'patient') {
      let subPath = `/${normalizedRole}/subscription`;
      if (normalizedRole === 'lab') {
        subPath = isIndLab ? '/lab/portal/subscription' : '/lab/subscription';
      }
      
      // Inject subscription page right before Profile/Settings/Logout or just append it before Profile/My Profile
      const profileIndex = items.findIndex(item => item.name.toLowerCase().includes('profile'));
      const subItem = { name: 'Subscription', path: subPath, icon: <ShieldCheck size={20} /> };
      
      if (profileIndex !== -1) {
        items.splice(profileIndex, 0, subItem);
      } else {
        items.push(subItem);
      }
    }

    return items;
  }, [userRole, isSubscriptionEnforced]);

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
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden lg:flex sticky top-0 left-0 h-screen z-40 w-72 bg-white border-r border-gray-100 flex-col shadow-none shrink-0">
        {/* Logo Section */}
        <div className="p-8">
          <div
            onClick={() => navigate(`/${userRole}/dashboard`)}
            className="flex items-center gap-4 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-600/20 group-hover:rotate-6 transition-all duration-300 overflow-hidden">
              <img src="/Appointory_logo.jpg" alt="Appointory Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">
                {clinicName.split(' ')[0]}<span className="text-teal-600">.</span>
              </h1>
              <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest">Healthcare OS</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-4 custom-scrollbar">
          {menuItems.map((item) => {
            const active = isItemActive(item.path);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 group text-left cursor-pointer
                  ${active
                    ? 'bg-teal-50 text-teal-600 shadow-sm shadow-teal-100/50'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <div className="transition-transform group-hover:scale-110 duration-200">
                  {item.icon}
                </div>
                <span className="flex-1">{item.name}</span>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                )}
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-6 border-t border-gray-50 bg-gray-50/30">
          <div
            onClick={() => navigate(userRole === 'patient' ? '/patient/profile' : '/profile')}
            className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm mb-4 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all group/card"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 font-bold text-sm border border-teal-100 group-hover/card:bg-teal-600 group-hover/card:text-white transition-colors">
                {userName.substring(0, 2).toUpperCase() || 'PT'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-black text-teal-600 uppercase tracking-widest mb-0.5">
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
                <p className="text-[14px] font-bold text-gray-400 uppercase mt-0.5 truncate">
                  {userRole === 'doctor' 
                    ? (userEducation || userSpecialization || 'Chief Physician')
                    : (userSpecialization || (userRole === 'lab' ? 'Diagnostics Lead' : userRole === 'patient' ? 'Verified Member' : 'Staff Member'))}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 group-hover/card:bg-teal-50 transition-colors">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-teal-600" />
                <span className="text-[14px] font-bold text-gray-500">Live Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[14px] font-black text-green-600 uppercase">Online</span>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-black text-[13px] uppercase tracking-widest border border-red-100 transition-all active:scale-95 group/logout cursor-pointer"
          >
            <LogOut size={16} className="group-hover/logout:rotate-12 transition-transform" />
            Sign Out
          </button>

        </div>
      </aside>

      {/* Mobile & Tablet Bottom Navigation - Permanently Docked at Bottom of Screen (Native App Shell) */}
      <nav 
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 flex items-center justify-around z-[100] px-2 pt-1.5 pb-[max(10px,env(safe-area-inset-bottom,10px))] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] transform-gpu"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)'
        }}
      >
        <div className="flex items-center justify-around w-full max-w-md mx-auto gap-0.5">
          {menuItems.map((item) => {
            const active = isItemActive(item.path);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  try {
                    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                      navigator.vibrate(8);
                    }
                  } catch {
                    // Ignore haptic error
                  }
                  navigate(item.path);
                }}
                aria-label={item.name}
                className="relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-transform duration-150 active:scale-90 select-none group focus:outline-none cursor-pointer"
              >
                <div
                  className={`relative flex items-center justify-center w-11 h-7 rounded-full transition-all duration-300 ${
                    active
                      ? 'bg-teal-50 text-teal-700 shadow-sm shadow-teal-600/10'
                      : 'text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-50/70'
                  }`}
                >
                  <div className={`transition-all duration-300 ${active ? 'scale-105' : 'group-hover:scale-105'}`}>
                    {item.icon}
                  </div>
                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-teal-600 rounded-full shadow-sm shadow-teal-600/40 animate-pulse" />
                  )}
                </div>
                <span
                  className={`text-[11px] tracking-tight transition-all duration-200 mt-0.5 select-none leading-none ${
                    active ? 'font-bold text-teal-900 scale-105' : 'font-medium text-slate-500'
                  }`}
                >
                  {item.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 🌟 Mobile Floating Quick Action Panel for Patients */}
      {userRole.toLowerCase() === 'patient' && showQuickActions && (
        <div className="fixed bottom-36 right-6 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(13,148,136,0.3)] border border-slate-100 p-6 w-[calc(100vw-3rem)] sm:w-[320px] max-w-[320px] z-[60] animate-in slide-in-from-bottom-5 duration-300 lg:hidden">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Quick Actions</h3>
              <p className="text-[14px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Patient Wellness Tools</p>
            </div>
            <button onClick={() => setShowQuickActions(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
              <X size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <QuickActionTile 
              icon={<Calendar size={20} />} 
              label="Book Slot" 
              color="bg-teal-50 text-teal-600 border-teal-100/50" 
              onClick={() => { navigate('/patient/book-appointment'); setShowQuickActions(false); }} 
            />
            <QuickActionTile 
              icon={<FolderHeart size={20} />} 
              label="Digital Locker" 
              color="bg-blue-50 text-blue-600 border-blue-100/50" 
              onClick={() => { navigate('/patient/locker'); setShowQuickActions(false); }} 
            />
            <QuickActionTile 
              icon={<FileText size={20} />} 
              label="Health History" 
              color="bg-orange-50 text-orange-600 border-orange-100/50" 
              onClick={() => { navigate('/patient/locker'); setShowQuickActions(false); }} 
            />
            <QuickActionTile 
              icon={<UserCircle size={20} />} 
              label="My Profile" 
              color="bg-rose-50 text-rose-600 border-rose-100/50" 
              onClick={() => { navigate('/profile'); setShowQuickActions(false); }} 
            />

            <button 
              className="col-span-2 mt-2 w-full flex items-center justify-center gap-2.5 px-4 py-4 bg-red-50 text-red-600 rounded-xl font-black text-[14px] uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all active:scale-95 text-center cursor-pointer"
            >
              <Bell size={14} className="animate-bounce" />
              Emergency Support
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) Trigger */}
      {userRole.toLowerCase() === 'patient' && (
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="fixed bottom-20 right-6 lg:hidden z-50 bg-gradient-to-r from-teal-600 to-indigo-600 text-white w-14 h-14 rounded-full shadow-[0_10px_25px_rgba(13,148,136,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-teal-500/20"
        >
          {showQuickActions ? <X size={24} /> : <Plus size={24} />}
        </button>
      )}
    </>
  );
};

const QuickActionTile = ({ icon, label, color, onClick }) => (
  <button 
    onClick={onClick}
    className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer ${color}`}
  >
    <div className="p-2 rounded-lg bg-white/80 shadow-sm">{icon}</div>
    <span className="text-[14px] font-black uppercase tracking-wider leading-tight">{label}</span>
  </button>
);

export default Sidebar;