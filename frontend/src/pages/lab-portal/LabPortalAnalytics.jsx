import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import Swal from 'sweetalert2';
import { Helmet } from 'react-helmet-async';
import {
  FlaskConical,
  BarChart3,
  RefreshCw,
  LogOut,
  Link2,
  LayoutDashboard,
  Activity,
  Flame,
  ShieldAlert,
  Clock,
  Sparkles
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts';
import { API_URL } from '../../config/runtime';

const LabPortalAnalytics = () => {
  const navigate = useNavigate();
  const labName = localStorage.getItem('labName') || 'Lab';
  const labCode = localStorage.getItem('labCode') || '';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch Requests
  const fetchRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsSyncing(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/lab-connect/test-requests/lab`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setRequests(res.data.data);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  // Socket setup
  useEffect(() => {
    fetchRequests();

    const socket = io(API_URL, {
      auth: { token: localStorage.getItem('token') }
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      const labId = localStorage.getItem('labId');
      if (labId) {
        socket.emit('joinLab', { labId });
      }
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('testRequestUpdate', () => {
      fetchRequests(true);
    });

    socket.on('queueUpdate', () => {
      fetchRequests(true);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/lab/login');
  };

  // Calculate Stats
  const getStats = () => {
    const pending = requests.filter(r => r.status === 'Pending').length;
    const processing = requests.filter(r => r.status === 'Processing' || r.status === 'Accepted').length;
    const completed = requests.filter(r => r.status === 'Completed').length;
    const total = requests.length;
    return { pending, processing, completed, total };
  };

  const stats = getStats();

  const getChartData = () => {
    const data = [];
    if (stats.pending > 0) data.push({ name: 'Pending', value: stats.pending, color: '#f59e0b' });
    if (stats.processing > 0) data.push({ name: 'Processing', value: stats.processing, color: '#a855f7' });
    if (stats.completed > 0) data.push({ name: 'Completed', value: stats.completed, color: '#10b981' });
    return data;
  };

  const chartData = getChartData();

  // Active Samples
  const activeSamples = requests.filter(r => 
    r.status === 'Pending' || r.status === 'Accepted' || r.status === 'Processing'
  );

  return (
    <div className="min-h-screen font-body" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 50%, #f0f9ff 100%)' }}>
      <Helmet>
        <title>Lab Analytics & Samples | Appointory</title>
      </Helmet>

      {/* ─── Top Nav ─── */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-blue-100 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #0F4C75, #1B6CA8)' }}>
              <FlaskConical className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold leading-none text-slate-800">{labName}</h1>
              <p className="text-[11px] font-black uppercase tracking-widest text-blue-500">{labCode} · Analytics Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-3 bg-blue-50/50 border border-blue-100/50 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">
              <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className={socketConnected ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold'}>{socketConnected ? 'Live' : 'Offline'}</span>
            </div>
            <button
              onClick={() => navigate('/lab/portal/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              <LayoutDashboard size={15} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/lab/portal/connections')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100 transition-all shadow-sm"
            >
              <Link2 size={15} />
              <span className="hidden sm:inline">Connections Hub</span>
            </button>
            <button
              onClick={() => fetchRequests(true)}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all bg-white"
              title="Refresh"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-all shadow-sm"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Sync Info */}
        <div className="flex justify-between items-center bg-white/60 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-blue-50/50 text-[10px] font-black uppercase tracking-wider text-slate-500 shadow-sm">
          <span>Last sync: {lastUpdate.toLocaleTimeString()}</span>
          <span>Overview & Active Pipelines</span>
        </div>

        {/* ─── Hero Row with Stats Summary Panel ─── */}
        <div className="bg-white rounded-3xl p-6 border border-blue-100/60 shadow-sm flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1.5">Overview Analytics</h3>
              <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider mb-4">Request distribution summary</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100/30">
                <span className="text-[11px] font-bold uppercase text-amber-700 tracking-wider">Pending</span>
                <p className="text-2xl font-black text-amber-800 mt-1">{stats.pending}</p>
              </div>
              <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100/30">
                <span className="text-[11px] font-bold uppercase text-purple-700 tracking-wider">Processing</span>
                <p className="text-2xl font-black text-purple-800 mt-1">{stats.processing}</p>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/30">
                <span className="text-[11px] font-bold uppercase text-emerald-700 tracking-wider">Completed</span>
                <p className="text-2xl font-black text-emerald-800 mt-1">{stats.completed}</p>
              </div>
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/30">
                <span className="text-[11px] font-bold uppercase text-blue-700 tracking-wider">Total</span>
                <p className="text-2xl font-black text-blue-800 mt-1">{stats.total}</p>
              </div>
            </div>
          </div>

          {/* Recharts Pie Chart */}
          <div className="w-full md:w-48 h-48 md:h-full shrink-0 flex items-center justify-center relative min-h-[180px] self-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-300">
                <BarChart3 className="mx-auto opacity-30 mb-2" size={32} />
                <span className="text-[12px] font-bold">No active chart data</span>
              </div>
            )}
            {chartData.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Done</span>
                <span className="text-xl font-black text-slate-800">{stats.completed}</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Recent Active Samples Carousel ─── */}
        <div className="bg-white rounded-3xl p-6 border border-blue-100/60 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1.5">Recent Active Samples</h3>
              <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider">Track specimens currently undergoing processing</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500">
              <Sparkles size={12} className="text-amber-500" />
              <span>Active: {activeSamples.length}</span>
            </div>
          </div>

          <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2 snap-x snap-mandatory">
            {activeSamples.length === 0 ? (
              <div className="w-full text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No active specimens in queue. All clear!</p>
              </div>
            ) : (
              activeSamples.map(sample => {
                const getStatusStyle = (status) => {
                  switch (status) {
                    case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-100';
                    case 'Accepted': return 'bg-blue-50 text-blue-700 border-blue-100';
                    case 'Processing': return 'bg-purple-50 text-purple-700 border-purple-100';
                    default: return 'bg-slate-50 text-slate-700 border-slate-100';
                  }
                };

                const getStatusIcon = (status) => {
                  switch (status) {
                    case 'Pending': return <ShieldAlert size={14} className="text-amber-600 animate-pulse" />;
                    case 'Accepted': return <Clock size={14} className="text-blue-600" />;
                    case 'Processing': return <Flame size={14} className="text-purple-600 animate-bounce" />;
                    default: return <Activity size={14} />;
                  }
                };

                return (
                  <div
                    key={sample._id}
                    className="snap-start shrink-0 w-64 bg-slate-50/50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-200 transition-all hover:bg-white"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Patient</span>
                        <span className="font-extrabold text-sm text-slate-800 truncate block mt-0.5">{sample.patientName}</span>
                      </div>
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${getStatusStyle(sample.status)}`}>
                        {getStatusIcon(sample.status)}
                        <span>{sample.status}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-150/60 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500">
                      <div>
                        <span>Specimen / Test</span>
                        <p className="text-slate-800 font-extrabold truncate mt-0.5">{sample.testName || 'Routine Diagnosis'}</p>
                      </div>
                      <div>
                        <span>Referred By</span>
                        <p className="text-slate-800 font-extrabold truncate mt-0.5">{sample.referredBy || 'Direct Booking'}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LabPortalAnalytics;
