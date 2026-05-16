import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import {
  BarChart3, Users, Settings, ClipboardList, UserPlus,
  ArrowUpRight, ShieldCheck, Activity, Tv, Share2, Copy, Check, RefreshCw, FileSpreadsheet,
  Clock, TrendingUp, Calendar, AlertCircle, Layout, MoreHorizontal
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    todayVisits: 0,
    activeDoctors: 0,
    avgWait: 0,
    newPatients: 0,
    revenue: 12500,
    satisfaction: 98
  });
  const [recentStaffActivity, setRecentStaffActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const socketRef = useRef(null);

  const token = localStorage.getItem('token');
  const adminName = localStorage.getItem('userName') || 'Admin';
  const clinicName = localStorage.getItem('clinicName') || 'SwasthyaMitra Clinic';
  const clinicCode = localStorage.getItem('clinicCode') || 'SW-001';
  const clinicId = localStorage.getItem('clinicId');

  const publicDisplayUrl = `${window.location.origin}/display/${clinicCode}`;

  const fetchLiveStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsSyncing(true);
    try {
      const res = await axios.get(`${API_URL}/api/queue/live`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const staffRes = await axios.get(`${API_URL}/api/staff/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const queueData = res.data.data;
      const staffData = staffRes.data.staff;

      setStats(prev => ({
        ...prev,
        todayVisits: queueData.length,
        activeDoctors: staffData.filter(s => s.role === 'doctor' && s.isAvailable).length,
        avgWait: queueData.length > 0 ? Math.max(10, queueData.length * 8) : 0,
        newPatients: queueData.filter(p => p.visitType === 'Walk-in').length
      }));
      
      setRecentStaffActivity(staffData.slice(0, 5));
      setLoading(false);
    } catch (err) {
      console.error("Failed to sync admin stats", err);
      setLoading(false);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  }, [token]);

  useEffect(() => {
    if (!SOCKET_URL) return;
    const newSocket = io(SOCKET_URL, { reconnection: true });
    socketRef.current = newSocket;
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!socketRef.current || !clinicId) return;
    socketRef.current.emit('joinClinic', clinicId);
    socketRef.current.on('queueUpdate', () => fetchLiveStats(true));
    socketRef.current.on('doctorStatusChanged', () => fetchLiveStats(true));
    return () => {
      socketRef.current.off('queueUpdate');
      socketRef.current.off('doctorStatusChanged');
    };
  }, [clinicId, fetchLiveStats]);

  useEffect(() => {
    fetchLiveStats();
  }, [fetchLiveStats]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${clinicName} - Live Queue`,
          text: `Monitor the live queue for ${clinicName}`,
          url: publicDisplayUrl,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(publicDisplayUrl);
      setCopied(true);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Share Link Copied',
        showConfirmButton: false,
        timer: 2000,
        background: '#EEF6FA'
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const chartData = [
    { name: '8 AM', visits: 4 },
    { name: '10 AM', visits: 12 },
    { name: '12 PM', visits: 25 },
    { name: '2 PM', visits: 18 },
    { name: '4 PM', visits: 32 },
    { name: '6 PM', visits: 28 },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex-col md:flex-row">
      <Sidebar role="admin" />

      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto">
        <main className="px-4 md:px-8 py-8 flex-grow max-w-7xl mx-auto w-full">
          
          {/* Top Navbar Style Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
                  Clinic Administrator
                </span>
                {isSyncing && <RefreshCw size={14} className="text-teal-500 animate-spin" />}
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">
                Namaste, {adminName}
              </h1>
              <p className="text-slate-500 font-bold flex items-center gap-2">
                Operational Command Hub for <span className="text-teal-600">{clinicName}</span>
                <span className="bg-slate-100 px-2.5 py-0.5 rounded-lg text-[10px] font-black text-slate-400">ID: {clinicCode}</span>
              </p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={handleShare}
                className="flex-1 md:flex-none flex items-center gap-3 px-6 py-3.5 bg-white border-2 border-slate-100 rounded-2xl font-black text-[10px] text-slate-700 uppercase tracking-widest hover:border-teal-600 hover:text-teal-600 transition-all active:scale-95 shadow-sm group"
              >
                <Share2 size={16} className="text-teal-500 group-hover:rotate-12 transition-transform" />
                Live Monitor Link
              </button>
              <button 
                onClick={() => navigate('/admin/settings')}
                className="p-3.5 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-95"
              >
                <Settings size={22} />
              </button>
            </div>
          </header>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Left Section: Stats & Analytics */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Primary Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MetricCard 
                  title="Total Daily Visits"
                  value={stats.todayVisits}
                  change="+12.5%"
                  icon={<div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={24} /></div>}
                  color="indigo"
                />
                <MetricCard 
                  title="Average Wait Time"
                  value={`${stats.avgWait} mins`}
                  change="-2 mins"
                  icon={<div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><Clock size={24} /></div>}
                  color="teal"
                />
                <MetricCard 
                  title="Clinical Revenue"
                  value={`₹${stats.todayVisits * 500}`}
                  change="+18%"
                  icon={<div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><TrendingUp size={24} /></div>}
                  color="emerald"
                />
                <MetricCard 
                  title="Active Duty Doctors"
                  value={stats.activeDoctors}
                  change="Live"
                  icon={<div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><ShieldCheck size={24} /></div>}
                  color="rose"
                />
              </div>

              {/* Patient Traffic Area Chart */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                 <div className="flex justify-between items-center mb-8">
                    <div>
                       <h3 className="text-xl font-black text-slate-900">Patient Traffic Density</h3>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time walk-in frequency</p>
                    </div>
                    <div className="flex gap-2">
                       <button className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase">Today</button>
                       <button className="px-3 py-1 text-slate-400 rounded-lg text-[10px] font-black uppercase">Week</button>
                    </div>
                 </div>
                 <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartData}>
                          <defs>
                             <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94A3B8'}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94A3B8'}} />
                          <Tooltip 
                             contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                          />
                          <Area type="monotone" dataKey="visits" stroke="#14B8A6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            </div>

            {/* Right Section: Quick Actions & Staff Duty */}
            <div className="lg:col-span-1 space-y-8">
              
              {/* Quick Action Grid */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center justify-between">
                  Operations
                  <Layout size={18} className="text-slate-200" />
                </h3>
                <div className="grid grid-cols-2 gap-4">
                   <button 
                     onClick={() => navigate('/admin/staff-management')}
                     className="p-5 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50 group hover:bg-indigo-600 transition-all duration-300"
                   >
                      <UserPlus size={24} className="text-indigo-600 group-hover:text-white transition-colors mb-3" />
                      <p className="text-[10px] font-black text-indigo-900 group-hover:text-white uppercase tracking-widest">Add Staff</p>
                   </button>
                   <button 
                     onClick={() => navigate('/admin/reports')}
                     className="p-5 bg-teal-50/50 rounded-[2rem] border border-teal-100/50 group hover:bg-teal-600 transition-all duration-300"
                   >
                      <FileSpreadsheet size={24} className="text-teal-600 group-hover:text-white transition-colors mb-3" />
                      <p className="text-[10px] font-black text-teal-900 group-hover:text-white uppercase tracking-widest">Reports</p>
                   </button>
                   <button 
                     onClick={() => navigate('/receptionist/dashboard?fromAdmin=true')}
                     className="p-5 bg-rose-50/50 rounded-[2rem] border border-rose-100/50 group hover:bg-rose-600 transition-all duration-300"
                   >
                      <Layout size={24} className="text-rose-600 group-hover:text-white transition-colors mb-3" />
                      <p className="text-[10px] font-black text-rose-900 group-hover:text-white uppercase tracking-widest">Front Desk</p>
                   </button>
                   <button 
                     onClick={() => window.open(publicDisplayUrl, '_blank')}
                     className="p-5 bg-sky-50/50 rounded-[2rem] border border-sky-100/50 group hover:bg-sky-600 transition-all duration-300"
                   >
                      <Tv size={24} className="text-sky-600 group-hover:text-white transition-colors mb-3" />
                      <p className="text-[10px] font-black text-sky-900 group-hover:text-white uppercase tracking-widest">Live TV</p>
                   </button>
                </div>
              </div>

              {/* Staff Status Tracker */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-black text-slate-900">Staff Duty Roster</h3>
                   <button onClick={() => navigate('/admin/staff-management')} className="text-[9px] font-black text-teal-600 uppercase tracking-widest hover:underline">Manage</button>
                </div>
                <div className="space-y-5">
                   {recentStaffActivity.map((staff, idx) => (
                     <div key={idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-bold text-xs uppercase group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                              {staff.name.substring(0, 2)}
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-900 leading-none mb-1">{staff.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{staff.role}</p>
                           </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${staff.isAvailable ? 'bg-green-500 shadow-lg shadow-green-500/20 animate-pulse' : 'bg-slate-200'}`} />
                     </div>
                   ))}
                   {recentStaffActivity.length === 0 && (
                     <div className="text-center py-8">
                        <AlertCircle size={32} className="mx-auto text-slate-100 mb-2" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No staff registered</p>
                     </div>
                   )}
                </div>
              </div>

              {/* System Health Info */}
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
                 <div className="relative z-10">
                    <h4 className="text-lg font-black mb-1">System Health</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Global Sync Status</p>
                    <div className="flex items-center gap-4">
                       <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full w-[98.8%]" />
                       </div>
                       <span className="text-xs font-black text-teal-500">98.8%</span>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, change, icon, color }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
    <div className="flex justify-between items-start mb-6">
      {icon}
      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
        change === 'Live' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-50 text-slate-400'
      }`}>
        {change}
      </span>
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
    </div>
    <div className={`absolute bottom-0 right-0 w-24 h-24 bg-${color}-50/30 rounded-tl-[4rem] -mr-8 -mb-8 group-hover:scale-110 transition-transform`} />
  </div>
);

export default AdminDashboard;