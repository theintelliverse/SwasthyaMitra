import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client'; // 🔑 Added Socket Client
import { SOCKET_URL } from '../../config/runtime';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import {
  BarChart3, Users, Settings, ClipboardList, UserPlus,
  ArrowUpRight, ShieldCheck, Activity, Tv, Share2, Copy, Check, RefreshCw, FileSpreadsheet
} from 'lucide-react';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    todayVisits: 0,
    activeDoctors: 0,
    avgWait: 0,
    newPatients: 0
  });
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const token = localStorage.getItem('token');
  const adminName = localStorage.getItem('userName') || 'Admin';
  const clinicName = localStorage.getItem('clinicName') || 'Your Clinic';
  const clinicCode = localStorage.getItem('clinicCode') || 'CITY01';
  const clinicId = localStorage.getItem('clinicId');

  // The public URL for sharing
  const publicDisplayUrl = `${window.location.origin}/display/${clinicCode}`;

  const fetchLiveStats = useCallback(async () => {
    try {
      // We fetch live queue to calculate stats
      const res = await axios.get(`${API_URL}/api/queue/live`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const staffRes = await axios.get(`${API_URL}/api/staff/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const queueData = res.data.data;
      const staffData = staffRes.data.staff;

      setStats({
        todayVisits: queueData.length,
        activeDoctors: staffData.filter(s => s.role === 'doctor' && s.isAvailable).length,
        avgWait: queueData.length * 10, // Simple heuristic: 10 mins per patient
        newPatients: queueData.filter(p => p.visitType === 'Walk-in').length
      });
      setLoading(false);
    } catch (_err) {
      console.error("Failed to sync admin stats");
      setLoading(false);
    }
  }, [token]);

  // 🔌 WebSocket Lifecycle - Initialize Socket
  useEffect(() => {
    if (!SOCKET_URL) return;

    try {
      const newSocket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      socketRef.current = newSocket;

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    } catch (_err) {
      console.error('Failed to initialize socket');
    }
  }, []);

  // 🔌 WebSocket Events - Listen for updates
  useEffect(() => {
    if (!socketRef.current || !clinicId) return;

    try {
      socketRef.current.emit('joinClinic', clinicId);
      socketRef.current.on('queueUpdate', fetchLiveStats);
      socketRef.current.on('doctorStatusChanged', fetchLiveStats);
      socketRef.current.on('staffListUpdated', fetchLiveStats);

      return () => {
        if (socketRef.current) {
          socketRef.current.off('queueUpdate', fetchLiveStats);
          socketRef.current.off('doctorStatusChanged', fetchLiveStats);
          socketRef.current.off('staffListUpdated', fetchLiveStats);
        }
      };
    } catch (_err) {
      console.error('Failed to set up socket events');
    }
  }, [clinicId, fetchLiveStats]);

  // 🔄 Fetch Initial Stats
  useEffect(() => {
    fetchLiveStats();
  }, [fetchLiveStats]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${clinicName} - Live Queue`,
          text: `View the live consultation queue for ${clinicName}`,
          url: publicDisplayUrl,
        });
      } catch (_err) { console.log("Share cancelled"); }
    } else {
      navigator.clipboard.writeText(publicDisplayUrl);
      setCopied(true);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Display link copied',
        showConfirmButton: false,
        timer: 2000,
        background: '#EEF6FA'
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const modules = [
    {
      title: 'Live TV Display',
      desc: 'Launch the public-facing queue monitor for waiting room TVs.',
      icon: <Tv size={32} color="#1F6FB2" />,
      link: `/display/${clinicCode}`,
      bgColor: 'bg-marigold/10',
      isExternal: true
    },
    {
      title: 'Clinical Reports',
      desc: 'Download clinical data, staff logs, and visit summaries.',
      icon: <FileSpreadsheet size={32} color="#0F766E" />,
      link: '/admin/reports',
      bgColor: 'bg-teak/10'
    },
    {
      title: 'Staff Management',
      desc: 'Add doctors, manage roles, and monitor duty status.',
      icon: <Users size={32} color="#3FA28C" />,
      link: '/admin/staff-management',
      bgColor: 'bg-khaki/10'
    },
    {
      title: 'Medical History',
      desc: 'Access past consultation records and digital summaries.',
      icon: <ClipboardList size={32} color="#1F6FB2" />,
      link: '/admin/history',
      bgColor: 'bg-marigold/10'
    }
  ];

  return (
    <div className="flex min-h-screen bg-parchment font-body text-teak flex-col md:flex-row">
      <Sidebar role="admin" />

      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto">
        <main className="px-4 py-6 md:p-8 lg:p-12 max-w-6xl mx-auto w-full flex-grow">

          <header className="mb-8 md:mb-12 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading mb-2">Namaste, {adminName}</h1>
                <p className="text-khaki font-medium flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm md:text-base">
                  Central Command for <span className="text-marigold font-bold">{clinicName}</span>
                  <span className="bg-sandstone px-2 py-0.5 rounded text-[10px] text-teak font-black">{clinicCode}</span>
                </p>
              </div>

              <button
                onClick={handleShare}
                className="w-full sm:w-auto bg-white border border-sandstone p-3 md:p-4 rounded-2xl flex items-center gap-4 shadow-sm hover:border-marigold transition-all group"
              >
                <div className="w-10 h-10 bg-teak rounded-full flex items-center justify-center text-white group-hover:bg-marigold transition-colors flex-shrink-0">
                  {copied ? <Check size={18} /> : <Share2 size={18} />}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[8px] font-black uppercase text-khaki">Public Monitor</p>
                  <p className="text-xs font-bold text-teak">Share Live Queue</p>
                </div>
              </button>
            </div>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10">
            <StatMini label="Today's Visits" value={loading ? <RefreshCw size={14} className="animate-spin" /> : stats.todayVisits} />
            <StatMini label="Active Doctors" value={loading ? <RefreshCw size={14} className="animate-spin" /> : stats.activeDoctors} />
            <StatMini label="Queue Avg" value={loading ? "..." : `${stats.avgWait} mins`} />
            <StatMini label="Walk-ins" value={loading ? "..." : stats.newPatients} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-12">
            {modules.map((m, idx) => (
              <button
                key={idx}
                onClick={() => m.isExternal ? window.open(m.link, '_blank') : navigate(m.link)}
                className="group bg-white border border-sandstone p-6 md:p-8 lg:p-10 rounded-2xl md:rounded-3xl lg:rounded-[3rem] text-left transition-all hover:shadow-2xl hover:border-marigold flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 relative overflow-hidden"
              >
                <div className={`shrink-0 w-16 h-16 md:w-20 md:h-20 ${m.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {m.icon}
                </div>
                <div className="flex-grow text-left">
                  <h3 className="font-heading text-lg md:text-xl lg:text-2xl mb-1 md:mb-2">{m.title}</h3>
                  <p className="text-xs md:text-sm text-khaki font-medium leading-relaxed">{m.desc}</p>
                </div>
                <ArrowUpRight className="absolute top-6 right-6 md:static text-sandstone group-hover:text-marigold transition-colors flex-shrink-0" size={20} />
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            <QuickLink title="Duty Roster" icon={<UserPlus size={18} />} onClick={() => navigate('/admin/staff-management')} />
            <QuickLink title="Reception Desk" icon={<Users size={18} />} onClick={() => navigate('/receptionist/dashboard')} />
            <QuickLink title="Clinic Settings" icon={<Settings size={18} />} onClick={() => navigate('/admin/settings')} />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

const StatMini = ({ label, value }) => (
  <div className="bg-white border border-sandstone p-4 md:p-5 rounded-2xl md:rounded-3xl flex flex-col justify-center min-h-[80px] md:min-h-[100px]">
    <p className="text-[7px] md:text-[9px] font-black uppercase text-khaki tracking-widest mb-1">{label}</p>
    <div className="text-xl md:text-2xl font-heading text-teak">{value}</div>
  </div>
);

const QuickLink = ({ title, icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-2 md:gap-3 py-4 md:py-5 px-4 md:px-6 bg-white border border-sandstone rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-teak hover:bg-marigold hover:text-white hover:border-marigold transition-all shadow-sm active:scale-95 w-full sm:w-auto"
  >
    {icon} <span className="truncate">{title}</span>
  </button>
);

export default AdminDashboard;