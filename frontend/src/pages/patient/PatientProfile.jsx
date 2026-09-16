import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { User, Phone, Mail, Shield, Bell, HelpCircle, LogOut, ChevronRight, CheckCircle2 } from 'lucide-react';
import PatientBottomNav from '../../components/patient/PatientBottomNav';
import SEO from '../../components/SEO';
import { API_URL } from '../../config/runtime';

const PatientProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/patient/login');
      return;
    }

    Promise.resolve().then(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/patient/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (active && res.data.success) {
          setProfile(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    });

    return () => { active = false; };
  }, [navigate]);

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to log out of Appointory?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0D9488',
      cancelButtonColor: '#94A3B8',
      confirmButtonText: 'Yes, Logout'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate('/patient/login');
      }
    });
  };

  const name = profile?.name || 'Patient User';
  const phone = profile?.phone || localStorage.getItem('userPhone') || '+91 98765 43210';
  const email = profile?.email || 'patient@appointory.in';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-28">
      <SEO title="Profile - Appointory" />

      {/* Context Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md shadow-teal-600/20 overflow-hidden border border-teal-500/20 shrink-0">
            <img src="/Appointory_logo.jpg" alt="Appointory Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-base font-black text-slate-900 tracking-tight">My Profile</h1>
        </div>
        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 uppercase tracking-wide">
          ✓ Verified
        </span>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* User Card */}
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-teal-600 text-white font-bold text-xl flex items-center justify-center shadow-sm">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-slate-900 truncate">{name}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
              <Phone size={12} className="text-slate-400" />
              {phone}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate flex items-center gap-1">
              <Mail size={12} className="text-slate-400" />
              {email}
            </p>
          </div>
        </div>

        {/* Grouped Settings Section 1: Account */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Account & Security</p>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            <button 
              onClick={() => navigate('/patient/dashboard')}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <User size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-900">Personal Information</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            <button 
              onClick={() => navigate('/patient/health-locker')}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-900">Digital Health Records</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Grouped Settings Section 2: Preferences */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Preferences</p>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-900">SMS & WhatsApp Alerts</span>
              </div>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">Enabled</span>
            </div>

            <button 
              onClick={() => Swal.fire('Support', 'Appointory Support Hotline: +91 800-123-4567\nEmail: support@appointory.in', 'info')}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-900">Help & Support</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Grouped Settings Section 3: Logout */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full py-3.5 px-4 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-98"
          >
            <LogOut size={18} />
            <span>Logout Account</span>
          </button>
        </div>
      </main>

      <PatientBottomNav activeTab="profile" />
    </div>
  );
};

export default PatientProfile;
