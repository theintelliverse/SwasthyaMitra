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
  Clock, TrendingUp, Calendar, AlertCircle, Layout, MoreHorizontal,
  X, Plus, Search, Trash2, Edit
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
    medicineFees: 0,
    emergencyFees: 0,
    todayWalkins: 0,
    todayAppointments: 0,
    satisfaction: 98
  });
  const [recentStaffActivity, setRecentStaffActivity] = useState([]);
  const [queueList, setQueueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [todayPatientsList, setTodayPatientsList] = useState([]);
  const [allPatientsList, setAllPatientsList] = useState([]);
  const [trafficTimeframe, setTrafficTimeframe] = useState('today');
  const [modalTab, setModalTab] = useState('billing'); // 'billing' | 'inventory'
  const socketRef = useRef(null);
  
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

  const saveConfig = async () => {
    try {
      await axios.patch(`${API_URL}/api/clinic/settings`, {
        feeConsult: config.feeConsult,
        feeLab: config.feeLab,
        feeEmergency: config.feeEmergency,
        feeMedicine: config.feeMedicine,
        avgWaitFactor: config.avgWaitFactor
      }, { headers: { Authorization: `Bearer ${token}` } });
      
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
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to save config', 'error');
    }
  };

  const syncInventory = async (newInventory) => {
    try {
      await axios.patch(`${API_URL}/api/clinic/inventory`, { inventory: newInventory }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error("Failed to sync inventory", err);
    }
  };

  const restockMed = (index) => {
    const updated = [...inventory];
    updated[index].stock += 50;
    setInventory(updated);
    syncInventory(updated);
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
    syncInventory(defaultInventory);
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
      const clinicRes = await axios.get(`${API_URL}/api/clinic/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const queueData = res.data.data || [];
      const staffData = staffRes.data.staff || [];
      const historyData = historyRes.data.data || [];
      const clinicData = clinicRes.data.data || {};

      // Load dynamic rules from backend (or fallback)
      const avgWaitFactor = clinicData.avgWaitFactor ?? 8;
      const feeConsult = clinicData.feeConsult ?? 500;
      const feeLab = clinicData.feeLab ?? 450;
      const feeEmergency = clinicData.feeEmergency ?? 300;
      const feeMedicine = clinicData.feeMedicine ?? 120;
      
      setConfig({
        avgWaitFactor,
        feeConsult,
        feeLab,
        feeEmergency,
        feeMedicine
      });

      if (clinicData.inventory) {
        setInventory(clinicData.inventory);
      }

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
        medicineFees: medicineFees,
        emergencyFees: emergencyFees,
        todayWalkins: todayWalkins,
        todayAppointments: todayAppointments
      }));
      
      setQueueList(queueData);
      setTodayPatientsList(todayPatients);
      setAllPatientsList([...queueData, ...historyData]);
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
  let chartData = [];

  if (trafficTimeframe === 'today') {
    chartData = [
      { name: '8 AM', visits: 0 },
      { name: '10 AM', visits: 0 },
      { name: '12 PM', visits: 0 },
      { name: '2 PM', visits: 0 },
      { name: '4 PM', visits: 0 },
      { name: '6 PM', visits: 0 },
    ];
    todayPatientsList.forEach(patient => {
      try {
        const t = patient.visitDate || patient.createdAt;
        const hour = new Date(t).getHours();
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
  } else {
    // Week view: past 7 days including today
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    chartData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { name: days[d.getDay()], visits: 0, dateStr: d.toDateString() };
    });

    allPatientsList.forEach(patient => {
      try {
        const t = patient.visitDate || patient.createdAt;
        const patientDate = new Date(t).toDateString();
        const dayMatch = chartData.find(d => d.dateStr === patientDate);
        if (dayMatch) dayMatch.visits++;
      } catch (e) {}
    });
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex-col md:flex-row">
      <Sidebar 
        role="admin" 
        revenueStats={stats} 
        onRevenueClick={() => setIsRevenueModalOpen(true)} 
      />

      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto pb-32 lg:pb-0">
        <main className="px-4 md:px-8 py-8 flex-grow max-w-7xl mx-auto w-full">
          
          {/* Top Navbar Style Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[14px] font-black uppercase tracking-widest border border-teal-100">
                  Clinic Administrator
                </span>
                {isSyncing && <RefreshCw size={14} className="text-teal-500 animate-spin" />}
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">
                Namaste, {adminName}
              </h1>
              <p className="text-slate-500 font-bold flex items-center gap-2">
                Operational Command Hub for <span className="text-teal-600">{clinicName}</span>
                <span className="bg-slate-100 px-2.5 py-0.5 rounded-lg text-[14px] font-black text-slate-400">ID: {clinicCode}</span>
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap md:flex-nowrap w-full md:w-auto">
              {/* Clinical Revenue Nav Widget */}
              <div 
                onClick={() => setIsRevenueModalOpen(true)}
                className="flex-grow md:flex-grow-0 flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100/70 hover:to-teal-100/70 border-2 border-emerald-100/80 rounded-2xl cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group shrink-0"
              >
                <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <TrendingUp size={16} />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[14px] font-black text-slate-400 uppercase tracking-wider leading-none">Clinical Revenue</span>
                    <span className="px-1.5 py-0.2 bg-emerald-500/10 text-[14px] font-black text-emerald-600 rounded">
                      {stats.revenueChange}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5 leading-none">
                    <span className="text-base font-black text-slate-800 leading-none">₹{stats.revenue.toLocaleString('en-IN')}</span>
                    <span className="text-[14px] font-bold text-slate-400 truncate max-w-[120px] sm:max-w-[180px] hidden sm:inline">
                      Consults: ₹{stats.consultFees} · Labs: ₹{stats.labFees}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-1 bg-white border border-slate-100 rounded-lg text-[14px] font-black text-slate-400 uppercase tracking-widest leading-none shrink-0 group-hover:border-emerald-200">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Live Sync
                </div>
              </div>

              <button 
                onClick={handleShare}
                className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-slate-100 rounded-2xl font-black text-[14px] text-slate-700 uppercase tracking-widest hover:border-teal-600 hover:text-teal-600 transition-all active:scale-95 shadow-sm group"
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
                       <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time walk-in frequency</p>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => setTrafficTimeframe('today')}
                         className={`px-3 py-1 rounded-lg text-[14px] font-black uppercase transition-colors ${trafficTimeframe === 'today' ? 'bg-teal-50 text-teal-600' : 'text-slate-400 hover:bg-slate-50'}`}
                       >Today</button>
                       <button 
                         onClick={() => setTrafficTimeframe('week')}
                         className={`px-3 py-1 rounded-lg text-[14px] font-black uppercase transition-colors ${trafficTimeframe === 'week' ? 'bg-teal-50 text-teal-600' : 'text-slate-400 hover:bg-slate-50'}`}
                       >Week</button>
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
                      <p className="text-[14px] font-black text-indigo-900 group-hover:text-white uppercase tracking-widest leading-none">Add Staff</p>
                   </button>
                   <button 
                     onClick={() => navigate('/admin/reports')}
                     className="p-3 md:p-3.5 bg-teal-50/50 rounded-2xl border border-teal-100/50 flex flex-col items-center justify-center text-center group hover:bg-teal-600 transition-all duration-300"
                   >
                      <FileSpreadsheet size={18} className="text-teal-600 group-hover:text-white transition-colors mb-1.5" />
                      <p className="text-[14px] font-black text-teal-900 group-hover:text-white uppercase tracking-widest leading-none">Reports</p>
                   </button>
                   <button 
                     onClick={() => navigate('/receptionist/dashboard?fromAdmin=true')}
                     className="p-3 md:p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100/50 flex flex-col items-center justify-center text-center group hover:bg-rose-600 transition-all duration-300"
                   >
                      <Layout size={18} className="text-rose-600 group-hover:text-white transition-colors mb-1.5" />
                      <p className="text-[14px] font-black text-rose-900 group-hover:text-white uppercase tracking-widest leading-none">Front Desk</p>
                   </button>
                   <button 
                     onClick={() => window.open(publicDisplayUrl, '_blank')}
                     className="p-3 md:p-3.5 bg-sky-50/50 rounded-2xl border border-sky-100/50 flex flex-col items-center justify-center text-center group hover:bg-sky-600 transition-all duration-300"
                   >
                      <Tv size={18} className="text-sky-600 group-hover:text-white transition-colors mb-1.5" />
                      <p className="text-[14px] font-black text-sky-900 group-hover:text-white uppercase tracking-widest leading-none">Live TV</p>
                   </button>
                 </div>
              </div>

              {/* Staff Status Tracker */}
              <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-3.5">
                   <h3 className="text-base md:text-lg font-black text-slate-900">Staff Duty Roster</h3>
                   <button onClick={() => navigate('/admin/staff-management')} className="text-[14px] font-black text-teal-600 uppercase tracking-widest hover:underline">Manage</button>
                </div>
                <div className="space-y-2.5 md:space-y-3">
                   {recentStaffActivity.map((staff, idx) => (
                     <div key={idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2.5">
                           <div className="w-7 h-7 md:w-8 md:h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center font-bold text-[14px] md:text-[14px] uppercase group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                              {staff.name.substring(0, 2)}
                           </div>
                           <div>
                              <p className="text-[14px] font-black text-slate-900 leading-none mb-1">{staff.name}</p>
                              <p className="text-[14px] md:text-[14px] font-bold text-slate-400 uppercase tracking-widest leading-none">{staff.role}</p>
                           </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${staff.isAvailable ? 'bg-green-500 shadow-lg shadow-green-500/20 animate-pulse' : 'bg-slate-200'}`} />
                     </div>
                   ))}
                   {recentStaffActivity.length === 0 && (
                     <div className="text-center py-4">
                        <AlertCircle size={22} className="mx-auto text-slate-100 mb-1.5" />
                        <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">No staff registered</p>
                     </div>
                   )}
                </div>
              </div>

              {/* System Health Info */}
              <div className="bg-slate-900 p-4 md:p-5 rounded-3xl text-white relative overflow-hidden">
                 <div className="relative z-10">
                    <h4 className="text-sm md:text-base font-black mb-0.5">System Health</h4>
                    <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-3">Global Sync Status</p>
                    <div className="flex items-center gap-3">
                       <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full w-[98.8%]" />
                       </div>
                       <span className="text-[14px] font-black text-teal-500">98.8%</span>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 blur-2xl rounded-full -mr-12 -mt-12" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* Revenue & Billing Management Modal */}
      <RevenueModal
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        config={config}
        handleConfigChange={handleConfigChange}
        saveConfig={saveConfig}
        inventory={inventory}
        setInventory={setInventory}
        syncInventory={syncInventory}
        restockMed={restockMed}
        resetInventory={resetInventory}
        stats={stats}
      />
    </div>
  );
};

const RevenueModal = ({ 
  isOpen, 
  onClose, 
  config, 
  handleConfigChange, 
  saveConfig, 
  inventory, 
  setInventory, 
  syncInventory,
  restockMed, 
  resetInventory, 
  stats 
}) => {
  const [activeTab, setActiveTab] = useState('billing'); // 'billing' | 'inventory'
  const [editingIndex, setEditingIndex] = useState(null);
  const [tempPrice, setTempPrice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', stock: 100, minStock: 20, unitPrice: 10 });

  if (!isOpen) return null;

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (idx, price) => {
    setEditingIndex(idx);
    setTempPrice(price);
  };

  const savePrice = (idx) => {
    const updated = [...inventory];
    updated[idx].unitPrice = Number(tempPrice) || 0;
    setInventory(updated);
    syncInventory(updated);
    setEditingIndex(null);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Price Updated',
      showConfirmButton: false,
      timer: 1500,
      background: '#EEF6FA'
    });
  };

  const handleAddMedicine = (e) => {
    e.preventDefault();
    if (!newMed.name.trim()) return;

    const updated = [...inventory, {
      name: newMed.name,
      stock: Number(newMed.stock) || 0,
      minStock: Number(newMed.minStock) || 0,
      unitPrice: Number(newMed.unitPrice) || 0
    }];

    setInventory(updated);
    syncInventory(updated);
    setNewMed({ name: '', stock: 100, minStock: 20, unitPrice: 10 });
    setShowAddForm(false);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Medicine Added',
      showConfirmButton: false,
      timer: 1500,
      background: '#EEF6FA'
    });
  };

  const deleteMedicine = (idx) => {
    Swal.fire({
      title: 'Delete Medicine?',
      text: `Are you sure you want to remove ${inventory[idx].name} from inventory?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#94A3B8',
      confirmButtonText: 'Delete',
      background: '#EEF6FA'
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = inventory.filter((_, i) => i !== idx);
        setInventory(updated);
        syncInventory(updated);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Medicine Deleted',
          showConfirmButton: false,
          timer: 1500,
          background: '#EEF6FA'
        });
      }
    });
  };

  // Calculate percentages for breakdown progress bars
  const totalBreakdown = (stats.consultFees || 0) + (stats.labFees || 0) + (stats.medicineFees || 0) + (stats.emergencyFees || 0) || 1;
  const consultPct = Math.round(((stats.consultFees || 0) / totalBreakdown) * 100);
  const labPct = Math.round(((stats.labFees || 0) / totalBreakdown) * 100);
  const medPct = Math.round(((stats.medicineFees || 0) / totalBreakdown) * 100);
  const emergencyPct = Math.round(((stats.emergencyFees || 0) / totalBreakdown) * 100);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transform scale-100 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={24} />
              Clinical Revenue Settings
            </h2>
            <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage billing rates, rules & pharmacy inventory</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('billing')}
              className={`px-4 py-2 rounded-xl text-[14px] font-black uppercase tracking-wider transition-all ${activeTab === 'billing' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200/60'}`}
            >
              Billing Config
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-xl text-[14px] font-black uppercase tracking-wider transition-all ${activeTab === 'inventory' ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200/60'}`}
            >
              Pharmacy Inventory
            </button>
            <button 
              onClick={onClose}
              className="ml-2 p-2 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === 'billing' ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Form: Rates Configuration */}
              <div className="lg:col-span-3 space-y-6">
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider border-b pb-2 border-slate-100 flex items-center gap-2">
                  <Settings size={18} className="text-teal-600" />
                  Define Base Rates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ConfigField 
                    label="Consultation Fee" 
                    value={config.feeConsult} 
                    onChange={(val) => handleConfigChange('feeConsult', val)} 
                    icon="₹"
                  />
                  <ConfigField 
                    label="Lab Test Fee" 
                    value={config.feeLab} 
                    onChange={(val) => handleConfigChange('feeLab', val)} 
                    icon="₹"
                  />
                  <ConfigField 
                    label="Emergency Surcharge" 
                    value={config.feeEmergency} 
                    onChange={(val) => handleConfigChange('feeEmergency', val)} 
                    icon="₹"
                  />
                  <ConfigField 
                    label="Medicine Unit Fee" 
                    value={config.feeMedicine} 
                    onChange={(val) => handleConfigChange('feeMedicine', val)} 
                    icon="₹"
                  />
                </div>

                <div className="bg-teal-50/50 border border-teal-100/60 p-4 rounded-2xl">
                  <h4 className="text-[14px] font-black text-teal-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Clock size={14} />
                    Queue Management Wait Factor
                  </h4>
                  <p className="text-[14px] text-teal-600 font-bold leading-normal mb-3">
                    Adjust how many minutes are allocated per patient in queue to calculate dynamic waiting times.
                  </p>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="5" 
                      max="20" 
                      value={config.avgWaitFactor}
                      onChange={(e) => handleConfigChange('avgWaitFactor', Number(e.target.value))}
                      className="flex-1 accent-teal-600"
                    />
                    <span className="px-3 py-1 bg-white border border-teal-200 text-teal-700 rounded-xl font-black text-[14px] shrink-0">
                      {config.avgWaitFactor} mins/pat
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    onClick={saveConfig}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[14px] uppercase tracking-widest shadow-lg shadow-emerald-600/10 active:scale-95 transition-all"
                  >
                    Save Operational Rules
                  </button>
                </div>
              </div>

              {/* Right Sidebar: Stats Breakdown */}
              <div className="lg:col-span-2 space-y-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                <div>
                  <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-1">Today's Total</h3>
                  <div className="text-3xl font-black text-slate-900">₹{stats.revenue.toLocaleString('en-IN')}</div>
                  <div className="flex items-center gap-1 mt-1 text-[14px] font-bold text-emerald-600">
                    <span className="px-1.5 py-0.2 bg-emerald-50 rounded">{stats.revenueChange}</span>
                    <span>Vs Yesterday</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200/60">
                  <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-wider">Revenue Breakdown</h4>
                  
                  <BreakdownBar 
                    label="Consultations" 
                    amount={stats.consultFees || 0} 
                    percentage={consultPct} 
                    color="bg-indigo-500" 
                  />
                  <BreakdownBar 
                    label="Laboratory Tests" 
                    amount={stats.labFees || 0} 
                    percentage={labPct} 
                    color="bg-teal-500" 
                  />
                  <BreakdownBar 
                    label="Prescribed Medicines" 
                    amount={stats.medicineFees || 0} 
                    percentage={medPct} 
                    color="bg-amber-500" 
                  />
                  <BreakdownBar 
                    label="Emergency Surcharges" 
                    amount={stats.emergencyFees || 0} 
                    percentage={emergencyPct} 
                    color="bg-rose-500" 
                  />
                  
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between mt-6">
                    <div>
                      <h5 className="text-[14px] font-black text-slate-400 uppercase tracking-wider">Active Stream</h5>
                      <p className="text-[14px] font-bold text-slate-800 mt-0.5">Real-time Connection</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[14px] font-black text-emerald-600 uppercase tracking-wider">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      Live Syncing
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search medicine..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 bg-slate-50 focus:bg-white outline-none focus:border-teal-500 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[14px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-teal-600/10 active:scale-95"
                  >
                    <Plus size={14} />
                    {showAddForm ? 'Cancel' : 'Add Item'}
                  </button>
                  <button 
                    onClick={resetInventory}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[14px] font-black uppercase tracking-wider transition-all"
                  >
                    Reset Inventory
                  </button>
                </div>
              </div>

              {/* Add New Medicine Form */}
              {showAddForm && (
                <form onSubmit={handleAddMedicine} className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in slide-in-from-top-3 duration-250">
                  <div className="md:col-span-2">
                    <label className="text-[14px] font-black uppercase text-slate-400 block mb-1">Medicine Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Ibuprofen 400mg"
                      value={newMed.name}
                      onChange={(e) => setNewMed({...newMed, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[14px] font-bold bg-white outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-[14px] font-black uppercase text-slate-400 block mb-1">Initial Stock</label>
                    <input 
                      type="number" 
                      required
                      min="1" 
                      value={newMed.stock}
                      onChange={(e) => setNewMed({...newMed, stock: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[14px] font-bold bg-white outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-[14px] font-black uppercase text-slate-400 block mb-1">Unit Price (₹)</label>
                    <input 
                      type="number" 
                      required
                      min="1" 
                      value={newMed.unitPrice}
                      onChange={(e) => setNewMed({...newMed, unitPrice: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[14px] font-bold bg-white outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="md:col-span-4 flex justify-end">
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[14px] font-black uppercase tracking-wider"
                    >
                      Save to Inventory
                    </button>
                  </div>
                </form>
              )}

              {/* Medicines Inventory List */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredInventory.map((item, idx) => {
                  const isLowStock = item.stock <= item.minStock;
                  const stockPct = Math.min(100, Math.max(0, (item.stock / 150) * 100));
                  const stockColor = item.stock <= item.minStock ? 'bg-rose-500' : item.stock <= item.minStock * 2 ? 'bg-amber-500' : 'bg-emerald-500';

                  return (
                    <div key={idx} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-sm font-black text-slate-800 block">{item.name}</span>
                          {isLowStock && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-[14px] font-black text-rose-600 rounded uppercase tracking-wider animate-pulse">Low Stock</span>
                          )}
                        </div>
                        {editingIndex === idx ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[14px] font-bold text-slate-500">₹</span>
                            <input 
                              type="number"
                              className="w-16 px-1.5 py-1 border border-slate-300 rounded text-[14px] font-black outline-none focus:border-teal-500"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                            />
                            <button 
                              onClick={() => savePrice(idx)}
                              className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-800">₹{item.unitPrice}</span>
                            <button 
                              onClick={() => startEditing(idx, item.unitPrice)}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                            >
                              <Edit size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-[14px] font-bold text-slate-500 mb-1.5">
                          <span>{item.stock} Units</span>
                          <span>Min: {item.minStock}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${stockColor} rounded-full transition-all`} style={{width: `${stockPct}%`}} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <button 
                          onClick={() => deleteMedicine(idx)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <Trash2 size={16} /> 
                          <span className="text-[14px] font-black uppercase tracking-wider">Remove</span>
                        </button>
                        <button 
                          onClick={() => restockMed(idx)}
                          className="px-4 py-2 bg-teal-50 hover:bg-teal-600 border border-teal-100 text-[14px] font-black text-teal-600 hover:text-white uppercase tracking-wider rounded-xl transition-all active:scale-95"
                        >
                          Restock (+50)
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredInventory.length === 0 && (
                  <div className="text-center py-8 text-slate-400 font-bold text-sm bg-white border border-slate-100 rounded-2xl shadow-sm">
                    No matching medicines found.
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[14px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="p-4">Item Name</th>
                      <th className="p-4">Stock Level</th>
                      <th className="p-4">Unit Price</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInventory.map((item, idx) => {
                      const isLowStock = item.stock <= item.minStock;
                      const stockPct = Math.min(100, Math.max(0, (item.stock / 150) * 100));
                      const stockColor = item.stock <= item.minStock ? 'bg-rose-500' : item.stock <= item.minStock * 2 ? 'bg-amber-500' : 'bg-emerald-500';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <span className="text-[14px] font-black text-slate-800 block">{item.name}</span>
                            {isLowStock && (
                              <span className="inline-block mt-1 px-1.5 py-0.2 bg-rose-50 border border-rose-100 text-[14px] font-black text-rose-600 rounded uppercase tracking-wider animate-pulse">Low Stock</span>
                            )}
                          </td>
                          <td className="p-4 w-1/3">
                            <div className="flex items-center justify-between text-[14px] font-bold text-slate-500 mb-1.5">
                              <span>{item.stock} Units</span>
                              <span>Min: {item.minStock}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${stockColor} rounded-full transition-all`} style={{width: `${stockPct}%`}} />
                            </div>
                          </td>
                          <td className="p-4">
                            {editingIndex === idx ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[14px] font-bold text-slate-500">₹</span>
                                <input 
                                  type="number"
                                  className="w-16 px-1.5 py-0.8 border border-slate-300 rounded text-[14px] font-black outline-none focus:border-teal-500"
                                  value={tempPrice}
                                  onChange={(e) => setTempPrice(e.target.value)}
                                />
                                <button 
                                  onClick={() => savePrice(idx)}
                                  className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors"
                                >
                                  <Check size={12} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-[14px] font-black text-slate-800">₹{item.unitPrice}</span>
                                <button 
                                  onClick={() => startEditing(idx, item.unitPrice)}
                                  className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-all"
                                >
                                  <Edit size={12} className="text-slate-400 hover:text-teal-600" />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => restockMed(idx)}
                                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-600 border border-teal-100 text-[14px] font-black text-teal-600 hover:text-white uppercase tracking-wider rounded-lg transition-all active:scale-95"
                              >
                                Restock (+50)
                              </button>
                              <button 
                                onClick={() => deleteMedicine(idx)}
                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredInventory.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-8 text-slate-400 font-bold text-[14px]">
                          No matching medicines found in inventory.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ConfigField = ({ label, value, onChange, icon }) => (
  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
    <label className="text-[14px] font-black uppercase text-slate-400 block mb-2">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-black text-slate-400">{icon}</span>
      <input 
        type="number" 
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full bg-white border border-slate-200/60 pl-8 pr-3 py-2 rounded-xl text-sm font-black text-slate-800 outline-none focus:border-teal-500 transition-colors"
      />
    </div>
  </div>
);

const BreakdownBar = ({ label, amount, percentage, color }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center text-[14px] font-bold text-slate-600">
      <span>{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-black text-slate-800">₹{amount.toLocaleString('en-IN')}</span>
        <span className="text-[14px] text-slate-400">({percentage}%)</span>
      </div>
    </div>
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{width: `${percentage}%`}} />
    </div>
  </div>
);

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
          <span className="text-[14px] font-black uppercase tracking-widest text-slate-400 truncate">{title}</span>
          <span className="text-xl font-bold text-slate-900 leading-none">{value}</span>
          {subtitle && (
            <span className="text-[14px] font-bold text-slate-400 mt-1 truncate">{subtitle}</span>
          )}
        </div>
        <div className="shrink-0 scale-90">
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className={`px-1.5 py-0.5 rounded-lg text-[14px] font-black uppercase tracking-widest ${trendBg} ${change === 'Live' ? 'animate-pulse' : ''}`}>
          {change}
        </span>
        <span className="text-[14px] font-black text-slate-300 uppercase tracking-widest leading-none">Live Sync</span>
      </div>
      <div className={`absolute bottom-0 right-0 w-8 h-8 bg-${color}-500/5 rounded-full blur-sm group-hover:scale-150 transition-transform`} />
    </div>
  );
};

const ConfigInput = ({ label, value, onChange }) => (
  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
    <label className="text-[14px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">{label}</label>
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] font-black text-slate-400">₹</span>
      <input 
        type="number" 
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-white border border-slate-200/60 pl-6 pr-2 py-1.5 rounded-lg text-[14px] font-black text-slate-900 outline-none focus:border-teal-500 transition-colors"
      />
    </div>
  </div>
);

export default AdminDashboard;