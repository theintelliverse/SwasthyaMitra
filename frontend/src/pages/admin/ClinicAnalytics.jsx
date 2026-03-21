import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client'; // 🔑 Added Socket Client
import { SOCKET_URL } from '../../config/runtime';
import {
  RefreshCw, Activity, TrendingUp, AlertTriangle,
  Beaker, UserCheck, Settings, ArrowRight
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import ClinicQR from '../../components/ClinicQR';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
// Initialize socket
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const ClinicAnalytics = () => {
  const navigate = useNavigate();
  const [clinicInfo, setClinicInfo] = useState({ code: '', name: '' });
  const [stats, setStats] = useState({
    activeQueue: 0,
    emergenciesToday: 0,
    pendingLab: 0,
    onDutyStaff: 0,
    staffOnBreak: 0
  });
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const token = localStorage.getItem('token');
  const clinicId = localStorage.getItem('clinicId');

  const fetchAnalytics = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsSyncing(true);
    try {
      const [queueRes, staffRes] = await Promise.all([
        axios.get(`${API_URL}/api/queue/live`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/staff/all`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const liveQueue = queueRes.data.data;
      const totalStaff = staffRes.data.staff;

      setStats({
        activeQueue: liveQueue.length,
        emergenciesToday: liveQueue.filter(p => p.isEmergency).length,
        pendingLab: liveQueue.filter(p => p.currentStage === 'Lab-Pending').length,
        onDutyStaff: totalStaff.filter(s => s.isAvailable && s.isActive !== false).length,
        staffOnBreak: totalStaff.filter(s => !s.isAvailable && s.role !== 'admin' && s.isActive !== false).length
      });
      setLoading(false);
    } catch (err) {
      console.error("Analytics sync error", err);
      setLoading(false);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  // 🔌 WebSocket Lifecycle
  useEffect(() => {
    const savedName = localStorage.getItem('clinicName') || 'Clinic';
    const savedCode = localStorage.getItem('clinicCode') || 'CODE01';
    setClinicInfo({ name: savedName, code: savedCode });

    fetchAnalytics();

    if (clinicId) {
      socket.emit('joinClinic', clinicId);

      // 📢 Listen for real-time events to update the command center
      socket.on('queueUpdate', () => fetchAnalytics(true));
      socket.on('doctorStatusChanged', () => fetchAnalytics(true));
      socket.on('staffListUpdated', () => fetchAnalytics(true));
      socket.on('clinicSettingsUpdated', (data) => {
        setClinicInfo(prev => ({ ...prev, name: data.name, code: data.clinicCode }));
      });
    }

    return () => {
      socket.off('queueUpdate');
      socket.off('doctorStatusChanged');
      socket.off('staffListUpdated');
      socket.off('clinicSettingsUpdated');
    };
  }, [token, clinicId]);

  if (loading) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw size={32} className="text-marigold animate-spin" />
        <div className="font-heading text-xl text-khaki">Accessing Command Center...</div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-parchment font-body text-teak">
      <Sidebar role="admin" />

      <div className="flex-grow flex flex-col h-screen overflow-y-auto">
        <nav className="bg-white border-b border-sandstone px-8 py-4 shadow-sm sticky top-0 z-30 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${isSyncing ? 'bg-marigold animate-ping' : 'bg-green-500'}`}></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-khaki">Operational Status</p>
              <h2 className="text-sm font-bold text-teak">{isSyncing ? 'Nodes Synchronizing...' : 'Satellite Link Active'}</h2>
            </div>
          </div>
          <button
            onClick={() => fetchAnalytics(false)}
            className="flex items-center gap-2 px-4 py-2 bg-parchment border border-sandstone rounded-xl text-[10px] font-black uppercase tracking-widest text-khaki hover:text-marigold transition-all"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} /> Force Refresh
          </button>
        </nav>

        <main className="flex-grow max-w-7xl w-full mx-auto px-8 py-10">
          <header className="mb-12">
            <h2 className="text-5xl font-heading mb-3 text-teak">{clinicInfo.name} Overview</h2>
            <div className="flex items-center gap-3">
              <span className="bg-teak text-parchment px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">ID: {clinicInfo.code}</span>
              <p className="text-khaki font-medium italic">Live patient density and resource distribution.</p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <InsightCard label="Live Queue" value={stats.activeQueue} icon={<TrendingUp size={24} />} color="bg-blue-50 text-blue-600" />
            <InsightCard label="Emergency" value={stats.emergenciesToday} icon={<AlertTriangle size={24} />} color="bg-red-50 text-red-600" pulse={stats.emergenciesToday > 0} />
            <InsightCard label="Lab Pending" value={stats.pendingLab} icon={<Beaker size={24} />} color="bg-marigold/10 text-marigold" />
            <InsightCard label="On Duty" value={stats.onDutyStaff} icon={<UserCheck size={24} />} color="bg-green-50 text-green-600" />
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 bg-white border border-sandstone p-10 rounded-[3.5rem] shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h3 className="font-heading text-2xl mb-1">Traffic Density</h3>
                  <p className="text-[10px] text-khaki font-black uppercase tracking-widest">Live Consultation Patterns</p>
                </div>
              </div>

              <div className="h-72 flex items-end justify-between gap-4 px-2 mb-4">
                {[30, 45, 25, 60, stats.activeQueue * 8 + 10, 35, 20].map((h, i) => (
                  <div key={i} className="flex-grow bg-parchment rounded-t-3xl relative group/bar overflow-hidden" style={{ height: `${Math.min(h + 15, 100)}%` }}>
                    <div className={`absolute inset-0 transition-all duration-700 ${i === 4 ? 'bg-marigold' : 'bg-sandstone group-hover/bar:bg-marigold/40'}`}></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-8 text-[10px] font-black uppercase text-khaki px-6 tracking-[0.4em] opacity-60">
                <span>09:00</span><span>Real-Time Peak</span><span>21:00</span>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white border border-sandstone p-8 rounded-[3rem] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <UserCheck size={20} className="text-marigold" />
                  <h3 className="font-heading text-xl">Staff Efficiency</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-khaki uppercase tracking-widest mb-1">Staff on Break</p>
                      <p className={`font-heading text-3xl ${stats.staffOnBreak > 0 ? 'text-red-500' : 'text-teak'}`}>{stats.staffOnBreak}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-khaki uppercase tracking-widest mb-1">Active Rate</p>
                      <p className="text-xl font-heading text-marigold">
                        {Math.round((stats.onDutyStaff / (stats.onDutyStaff + stats.staffOnBreak || 1)) * 100)}%
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-parchment border border-sandstone rounded-full overflow-hidden">
                    <div className="h-full bg-marigold transition-all duration-1000" style={{ width: `${(stats.onDutyStaff / (stats.onDutyStaff + stats.staffOnBreak || 1)) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              <ClinicQR clinicCode={clinicInfo.code} clinicName={clinicInfo.name} />

              <div className="bg-teak p-8 rounded-[3rem] text-parchment shadow-2xl relative overflow-hidden group">
                <h3 className="font-heading text-xl mb-6 white ">System Shortcuts</h3>
                <div className="space-y-3 relative z-10">
                  <button onClick={() => navigate('/admin/staff-management')} className="w-full py-4 bg-white/5 hover:bg-marigold hover:text-teak border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Staff Roster <ArrowRight size={12} className="inline ml-1" /></button>
                  <button onClick={() => navigate('/admin/settings')} className="w-full py-4 bg-white/5 hover:bg-marigold hover:text-teak border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">General Settings <ArrowRight size={12} className="inline ml-1" /></button>
                </div>
                <Settings className="absolute -bottom-6 -right-6 text-marigold/10" size={120} />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

const InsightCard = ({ label, value, icon, color, pulse }) => (
  <div className={`bg-white border border-sandstone p-8 rounded-[3rem] shadow-sm transition-all hover:shadow-xl hover:border-marigold group ${pulse ? 'ring-4 ring-red-500/10' : ''}`}>
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:-translate-y-1 ${pulse ? 'animate-pulse' : ''}`}>
      {icon}
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-khaki mb-1 group-hover:text-teak">{label}</p>
    <p className="text-4xl font-heading text-teak">{value}</p>
  </div>
);

export default ClinicAnalytics;