import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, RefreshCw, Hammer, HeartPulse } from 'lucide-react';
import SEO from '../../components/SEO';
import { API_URL } from '../../config/runtime';

const MaintenanceMode = () => {
  const [message, setMessage] = useState('System is undergoing scheduled maintenance.');
  const [checking, setChecking] = useState(false);

  const fetchStatus = async () => {
    setChecking(true);
    try {
      const res = await axios.get(`${API_URL}/api/superadmin/config/public`);
      if (res.data.success) {
        if (!res.data.isMaintenanceMode) {
          // If maintenance mode is turned off, redirect to home/login
          window.location.href = '/';
        } else {
          setMessage(res.data.maintenanceMessage);
        }
      }
    } catch (err) {
      console.error('Failed to look up public config:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto check status every 20 seconds
    const interval = setInterval(fetchStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans">
      <SEO title="System Maintenance Underway" noindex={true} />

      <div className="max-w-md w-full bg-slate-950/50 border border-slate-800 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow effect */}
        <div className="absolute -right-24 -top-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-24 -bottom-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative">
          {/* Animated/pulse gears/wrench icon */}
          <div className="w-16 h-16 bg-gradient-to-tr from-sky-500/15 to-indigo-500/15 text-sky-400 border border-sky-500/25 rounded-3xl flex items-center justify-center mx-auto shadow-inner animate-pulse">
            <Hammer size={28} className="animate-bounce" />
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-6 text-indigo-400 font-extrabold uppercase tracking-widest text-[10px]">
            <HeartPulse size={12} /> SwasthyaMitra Healthcare Network
          </div>

          <h2 className="text-2xl font-extrabold text-slate-100 mt-3 tracking-tight">Temporary Downtime</h2>
          
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 leading-relaxed font-medium mt-5 text-left break-words">
            <p className="font-extrabold text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Notice from Admin Desk</p>
            {message}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={fetchStatus}
            disabled={checking}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-750 disabled:opacity-50"
          >
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Syncing...' : 'Sync Status'}
          </button>
          
          <p className="text-[10px] text-slate-500 font-bold mt-4 uppercase tracking-wider">
            Thank you for your patience. We will be back up shortly!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;
