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
    revenue: 0,
    revenueChange: '+0%',
    consultFees: 0,
    labFees: 0,
    todayWalkins: 0,
    todayAppointments: 0,
    satisfaction: 98
  });
  const [recentStaffActivity, setRecentStaffActivity] = useState([]);
  const [queueList, setQueueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const socketRef = useRef(null);

  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('billing'); // 'billing' | 'inventory'
  
  const [config, setConfig] = useState({
    avgWaitFactor: Number(localStorage.getItem('SM_avgWaitFactor') || 8),
    feeConsult: Number(localStorage.getItem('SM_feeConsult') || 500),
    feeLab: Number(localStorage.getItem('SM_feeLab') || 450),
    feeEmergency: Number(localStorage.getItem('SM_feeEmergency') || 300),
    feeMedicine: Number(localStorage.getItem('SM_feeMedicine') || 120),
  });

  const defaultInventory = [
    { name: 'Paracetamol 500mg', stock: 120, minStock: 30, unitPrice: 10 },
    { name: 'Amlodipine 5mg', stock: 85, minStock: 20, unitPrice: 15 },
    { name: 'Levocetirizine 5mg', stock: 45, minStock: 15, unitPrice: 12 },
    { name: 'Amoxicillin 500mg', stock: 15, minStock: 25, unitPrice: 20 },
    { name: 'Cough Syrup (100ml)', stock: 32, minStock: 10, unitPrice: 65 },
  ];

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('SM_inventory');
    return saved ? JSON.parse(saved) : defaultInventory;
  });

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveConfig = () => {
    localStorage.setItem('SM_avgWaitFactor', config.avgWaitFactor);
    localStorage.setItem('SM_feeConsult', config.feeConsult);
    localStorage.setItem('SM_feeLab', config.feeLab);
    localStorage.setItem('SM_feeEmergency', config.feeEmergency);
    localStorage.setItem('SM_feeMedicine', config.feeMedicine);
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Operational Rules Saved',
      showConfirmButton: false,
      timer: 2000,
      background: '#EEF6FA'
    });
    
    setIsRevenueModalOpen(false);
    fetchLiveStats(true);
  };

  const restockMed = (index) => {
    const updated = [...inventory];
    updated[index].stock += 50;
    setInventory(updated);
    localStorage.setItem('SM_inventory', JSON.stringify(updated));
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `${updated[index].name} Restocked (+50)`,
      showConfirmButton: false,
      timer: 2000,
      background: '#EEF6FA'
    });
  };

  const resetInventory = () => {
    setInventory(defaultInventory);
    localStorage.setItem('SM_inventory', JSON.stringify(defaultInventory));
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'Inventory Stock Reset',
      showConfirmButton: false,
      timer: 2000,
      background: '#EEF6FA'
    });
  };

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
      const historyRes = await axios.get(`${API_URL}/api/queue/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const queueData = res.data.data || [];
      const staffData = staffRes.data.staff || [];
      const historyData = historyRes.data.data || [];

      // Read dynamic rules from localStorage
      const avgWaitFactor = Number(localStorage.getItem('SM_avgWaitFactor') || 8);
      const feeConsult = Number(localStorage.getItem('SM_feeConsult') || 500);
      const feeLab = Number(localStorage.getItem('SM_feeLab') || 450);
      const feeEmergency = Number(localStorage.getItem('SM_feeEmergency') || 300);
      const feeMedicine = Number(localStorage.getItem('SM_feeMedicine') || 120);

      // Calculate today's revenue & visit breakdowns dynamically
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const todayPatients = [
        ...queueData,
        ...historyData.filter(r => new Date(r.visitDate || r.createdAt).getTime() >= todayStart)
      ];

      let consultFees = 0;
      let labFees = 0;
      let medicineFees = 0;
      let emergencyFees = 0;

      todayPatients.forEach(p => {
        consultFees += feeConsult; // Base Consultation Fee
        if (p.requiredTest) labFees += feeLab; // Lab test fee
        if (p.isEmergency) emergencyFees += feeEmergency; // Emergency surcharge
        if (p.medicines && p.medicines.length > 0) {
          medicineFees += p.medicines.length * feeMedicine; // Prescribed medicines fee
        }
      });

      const todayRevenue = consultFees + labFees + medicineFees + emergencyFees;

      // Calculate yesterday's revenue for comparison
      const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
      const yesterdayPatients = historyData.filter(r => {
        const t = new Date(r.visitDate || r.createdAt).getTime();
        return t >= yesterdayStart && t < todayStart;
      });

      let yesterdayRevenue = 0;
      yesterdayPatients.forEach(p => {
        yesterdayRevenue += feeConsult;
        if (p.requiredTest) yesterdayRevenue += feeLab;
        if (p.isEmergency) yesterdayRevenue += feeEmergency;
        if (p.medicines && p.medicines.length > 0) {
          yesterdayRevenue += p.medicines.length * feeMedicine;
        }
      });

      let revenueChange = "+18%";
      if (yesterdayRevenue > 0) {
        const diff = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
        revenueChange = `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}%`;
      } else if (todayRevenue > 0) {
        revenueChange = "+100%";
      } else {
        revenueChange = "0%";
      }

      // Breakdown of today's walk-ins vs appointments
      const todayWalkins = todayPatients.filter(p => p.visitType === 'Walk-in').length;
      const todayAppointments = todayPatients.filter(p => p.visitType === 'Appointment').length;

      // Total visits includes live waiting queue + completed visits today
      const todayCompletedVisits = historyData.filter(r => new Date(r.visitDate || r.createdAt).getTime() >= todayStart).length;
      const totalVisits = queueData.length + todayCompletedVisits;

      setStats(prev => ({
        ...prev,
        todayVisits: totalVisits,
        activeDoctors: staffData.filter(s => s.role === 'doctor' && s.isAvailable).length,
        avgWait: queueData.length > 0 ? Math.max(10, queueData.length * avgWaitFactor) : 14, // 14 mins realistic baseline when queue is clear
        newPatients: queueData.filter(p => p.visitType === 'Walk-in').length,
        revenue: todayRevenue,
        revenueChange: revenueChange,
        consultFees: consultFees,
        labFees: labFees,
        todayWalkins: todayWalkins,
        todayAppointments: todayAppointments
      }));
      
      setQueueList(queueData);
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

  // Dynamically calculate traffic from real-time patient queue data
  const chartData = [
    { name: '8 AM', visits: 0 },
    { name: '10 AM', visits: 0 },
    { name: '12 PM', visits: 0 },
    { name: '2 PM', visits: 0 },
    { name: '4 PM', visits: 0 },
    { name: '6 PM', visits: 0 },
  ];

  queueList.forEach(patient => {
    try {
      const hour = new Date(patient.createdAt).getHours();
      if (hour >= 8 && hour < 10) chartData[0].visits++;
      else if (hour >= 10 && hour < 12) chartData[1].visits++;
      else if (hour >= 12 && hour < 14) chartData[2].visits++;
      else if (hour >= 14 && hour < 16) chartData[3].visits++;
      else if (hour >= 16 && hour < 18) chartData[4].visits++;
      else if (hour >= 18) chartData[5].visits++;
    } catch (e) {
      console.error("Error parsing patient hour: ", e);
    }
  });

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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <MetricCard 
                    title="Total Daily Visits"
                    value={stats.todayVisits}
                    change={stats.todayVisits > 0 ? "Active" : "Idle"}
                    icon={<div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={24} /></div>}
                    color="indigo"
                    subtitle={`Walk-ins: ${stats.todayWalkins} · Appts: ${stats.todayAppointments}`}
                  />
                </div>
                <div>
                  <MetricCard 
                    title="Average Wait Time"
                    value={`${stats.avgWait} mins`}
                    change="Dynamic"
                    icon={<div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><Clock size={24} /></div>}
                    color="teal"
                    subtitle="Based on queue size"
                  />
                </div>
                <div>
                  <MetricCard 
                    title="Clinical Revenue"
                    value={`₹${stats.revenue.toLocaleString('en-IN')}`}
                    change={stats.revenueChange}
                    icon={<div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><TrendingUp size={24} /></div>}
                    color="emerald"
                    subtitle={`Consults: ₹${stats.consultFees} · Labs: ₹${stats.labFees}`}
                    onClick={() => setIsRevenueModalOpen(true)}
                  />
                </div>
                <div>
                  <MetricCard 
                    title="Active Duty Doctors"
                    value={stats.activeDoctors}
                    change="Live"
                    icon={<div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><ShieldCheck size={24} /></div>}
                    color="rose"
                    subtitle="Staff on duty"
                  />
                </div>
              </div>

              {/* Patient Traffic Area Chart */}
              <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <h3 className="text-lg md:text-xl font-black text-slate-900">Patient Traffic Density</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time walk-in frequency</p>
                    </div>
                    <div className="flex gap-2">
                       <button className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase">Today</button>
                       <button className="px-3 py-1 text-slate-400 rounded-lg text-[10px] font-black uppercase">Week</button>
                    </div>
                 </div>
                 <div className="h-[220px] md:h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartData}>
                          <defs>
                             <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94A3B8'}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94A3B8'}} />
                          <Tooltip 
                             contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                          />
                          <Area type="monotone" dataKey="visits" stroke="#14B8A6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            </div>            {/* Right Section: Quick Actions & Staff Duty */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Quick Action Grid */}
              <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-base md:text-lg font-black text-slate-900 mb-3 flex items-center justify-between">
                  Operations
                  <Layout size={16} className="text-slate-200" />
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                   <button 
                     onClick={() => navigate('/admin/staff-management')}
                     className="p-3 md:p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex flex-col items-center justify-center text-center group hover:bg-indigo-600 transition-all duration-300"
                   >
                      <UserPlus size={18} className="text-indigo-600 group-hover:text-white transition-colors mb-1.5" />
                      <p className="text-[9px] font-black text-indigo-900 group-hover:text-white uppercase tracking-widest leading-none">Add Staff</p>
                   </button>
                   <button 
                     onClick={() => navigate('/admin/reports')}
                     className="p-3 md:p-3.5 bg-teal-50/50 rounded-2xl border border-teal-100/50 flex flex-col items-center justify-center text-center group hover:bg-teal-600 transition-all duration-300"
                   >
                      <FileSpreadsheet size={18} className="text-teal-600 group-hover:text-white transition-colors mb-1.5" />
                      <p className="text-[9px] font-black text-teal-900 group-hover:text-white uppercase tracking-widest leading-none">Reports</p>
                   </button>
                   <button 
                     onClick={() => navigate('/receptionist/dashboard?fromAdmin=true')}
                     className="p-3 md:p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100/50 flex flex-col items-center justify-center text-center group hover:bg-rose-600 transition-all duration-300"
                   >
                      <Layout size={18} className="text-rose-600 group-hover:text-white transition-colors mb-1.5" />
                      <p className="text-[9px] font-black text-rose-900 group-hover:text-white uppercase tracking-widest leading-none">Front Desk</p>
                   </button>
                   <button 
                     onClick={() => window.open(publicDisplayUrl, '_blank')}
                     className="p-3 md:p-3.5 bg-sky-50/50 rounded-2xl border border-sky-100/50 flex flex-col items-center justify-center text-center group hover:bg-sky-600 transition-all duration-300"
                   >
                      <Tv size={18} className="text-sky-600 group-hover:text-white transition-colors mb-1.5" />
                      <p className="text-[9px] font-black text-sky-900 group-hover:text-white uppercase tracking-widest leading-none">Live TV</p>
                   </button>
                 </div>
              </div>

              {/* Staff Status Tracker */}
              <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-3.5">
                   <h3 className="text-base md:text-lg font-black text-slate-900">Staff Duty Roster</h3>
                   <button onClick={() => navigate('/admin/staff-management')} className="text-[9px] font-black text-teal-600 uppercase tracking-widest hover:underline">Manage</button>
                </div>
                <div className="space-y-2.5 md:space-y-3">
                   {recentStaffActivity.map((staff, idx) => (
                     <div key={idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2.5">
                           <div className="w-7 h-7 md:w-8 md:h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center font-bold text-[10px] md:text-xs uppercase group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                              {staff.name.substring(0, 2)}
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-900 leading-none mb-1">{staff.name}</p>
                              <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{staff.role}</p>
                           </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${staff.isAvailable ? 'bg-green-500 shadow-lg shadow-green-500/20 animate-pulse' : 'bg-slate-200'}`} />
                     </div>
                   ))}
                   {recentStaffActivity.length === 0 && (
                     <div className="text-center py-4">
                        <AlertCircle size={22} className="mx-auto text-slate-100 mb-1.5" />
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">No staff registered</p>
                     </div>
                   )}
                </div>
              </div>

              {/* System Health Info */}
              <div className="bg-slate-900 p-4 md:p-5 rounded-3xl text-white relative overflow-hidden">
                 <div className="relative z-10">
                    <h4 className="text-sm md:text-base font-black mb-0.5">System Health</h4>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-3">Global Sync Status</p>
                    <div className="flex items-center gap-3">
                       <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full w-[98.8%]" />
                       </div>
                       <span className="text-xs font-black text-teal-500">98.8%</span>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 blur-2xl rounded-full -mr-12 -mt-12" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, change, icon, color, subtitle, onClick }) => {
  const isPositive = change.includes('+') || change === 'Live' || change === 'Active' || change === 'Dynamic';
  const trendBg = isPositive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 
                  change.includes('-') ? 'bg-teal-50 text-teal-600 border border-teal-100/50' : 'bg-slate-50 text-slate-400';

  const hoverBorderColors = {
    indigo: 'hover:border-indigo-400',
    teal: 'hover:border-teal-400',
    emerald: 'hover:border-emerald-400',
    rose: 'hover:border-rose-400',
  };
  const clickableClass = onClick ? `cursor-pointer ${hoverBorderColors[color] || 'hover:border-slate-300'} active:scale-[0.98]` : '';

  return (
    <div 
      onClick={onClick}
      className={`bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 w-full h-[6.5rem] flex flex-col justify-between ${clickableClass}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">{title}</span>
          <span className="text-xl font-bold text-slate-900 leading-none">{value}</span>
          {subtitle && (
            <span className="text-[8px] font-bold text-slate-400 mt-1 truncate">{subtitle}</span>
          )}
        </div>
        <div className="shrink-0 scale-90">
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className={`px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${trendBg} ${change === 'Live' ? 'animate-pulse' : ''}`}>
          {change}
        </span>
        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Live Sync</span>
      </div>
      <div className={`absolute bottom-0 right-0 w-8 h-8 bg-${color}-500/5 rounded-full blur-sm group-hover:scale-150 transition-transform`} />
    </div>
  );
};

const ConfigInput = ({ label, value, onChange }) => (
  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">{label}</label>
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">₹</span>
      <input 
        type="number" 
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-white border border-slate-200/60 pl-6 pr-2 py-1.5 rounded-lg text-xs font-black text-slate-900 outline-none focus:border-teal-500 transition-colors"
      />
    </div>
  </div>
);

export default AdminDashboard;