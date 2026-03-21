import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import {
  User, FileText, Activity, History, Download, Calendar,
  ShieldCheck, TrendingUp, ArrowLeft, RefreshCw, Smartphone, Hash
} from 'lucide-react';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const HealthLocker = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('history');

  const fetchHealthData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsSyncing(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/auth/patient/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 🔑 Updated to use res.data.data from our new Controller
      setData(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Locker fetch error", err);
      if (err.response?.status === 401) navigate('/patient/login');
      setLoading(false);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  useEffect(() => {
    fetchHealthData();

    const userPhone = localStorage.getItem('userPhone')?.replace(/\D/g, '').slice(-10);

    if (userPhone) {
      socket.emit('joinClinic', userPhone);
      socket.on('queueUpdate', () => {
        console.log("♻️ Vault Refresh Triggered");
        fetchHealthData(true);
      });
    }

    return () => {
      socket.off('queueUpdate');
    };
  }, [navigate]);

  if (loading) return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center gap-4">
      <RefreshCw size={32} className="text-marigold animate-spin" />
      <div className="font-heading text-xl text-teak">Unlocking Swasthya Vault...</div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center p-10">
      <p className="font-heading text-xl text-khaki mb-6">No records found for this account.</p>
      <button onClick={() => navigate(-1)} className="px-8 py-3 bg-teak text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Go Back</button>
    </div>
  );

  // 🔑 Updated logic for Stats: Extracting from visitHistory or locker
  const latestVisit = data.visitHistory?.[0];

  return (
    <div className="min-h-screen bg-parchment font-body text-teak p-6 pb-20">
      <div className="max-w-5xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-khaki hover:text-teak transition-colors"
          >
            <ArrowLeft size={14} /> Close Vault
          </button>
          {isSyncing && (
            <div className="flex items-center gap-2 text-marigold animate-pulse">
              <RefreshCw size={12} className="animate-spin" />
              <span className="text-[8px] font-black uppercase tracking-widest">Live Sync Active</span>
            </div>
          )}
        </div>

        {/* --- Header --- */}
        <div className="bg-teak rounded-[3rem] p-8 md:p-12 shadow-xl mb-10 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <ShieldCheck size={120} />
          </div>

          <div className="w-24 h-24 bg-marigold rounded-[2rem] flex items-center justify-center text-white text-4xl font-heading shadow-lg z-10">
            {data.name?.charAt(0) || 'P'}
          </div>

          <div className="text-center md:text-left z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-saffron mb-1">Authenticated Identity</p>
            <h1 className="text-4xl font-heading">{data.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
              <p className="text-white/60 text-[10px] font-bold flex items-center gap-2"><Smartphone size={12} /> {data.phone}</p>
              <p className="text-white/60 text-[10px] font-bold flex items-center gap-2"><Hash size={12} /> {data.visitHistory?.length} Consultations</p>
            </div>
          </div>
        </div>

        {/* --- Navigation Tabs --- */}
        <div className="flex gap-4 mb-8 bg-sandstone/20 p-2 rounded-2xl w-fit mx-auto md:mx-0 overflow-x-auto no-scrollbar">
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={16} />} label="Consultations" />
          <TabButton active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} icon={<FileText size={16} />} label="Digital Locker" />
        </div>

        {/* --- Dynamic Content Area --- */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'history' && (
            <div className="space-y-6">
              {data.visitHistory?.length > 0 ? (
                data.visitHistory.map((record, i) => (
                  <div key={record._id} className="bg-white p-8 rounded-[2.5rem] border border-sandstone shadow-sm hover:border-marigold transition-all animate-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-heading text-xl text-teak">Dr. {record.doctorId?.name}</h3>
                        <p className="text-[10px] font-black text-khaki uppercase tracking-widest">{record.clinicId?.name}</p>
                      </div>
                      <span className="text-[10px] font-bold text-marigold bg-marigold/10 px-4 py-1.5 rounded-full flex items-center gap-2">
                        <Calendar size={12} /> {new Date(record.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="p-6 bg-parchment rounded-3xl border border-sandstone/50 text-sm text-teak leading-relaxed whitespace-pre-wrap font-medium">
                      {record.notes || 'No notes provided by doctor.'}
                    </div>
                  </div>
                ))
              ) : <EmptyState message="No consultation history found." />}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.digitalLocker?.length > 0 ? (
                data.digitalLocker.map((doc, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-sandstone flex items-center justify-between group hover:border-marigold transition-all animate-in zoom-in-95">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-parchment rounded-2xl flex items-center justify-center text-marigold border border-sandstone">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{doc.title}</h4>
                        <p className="text-[9px] font-black text-khaki uppercase">{doc.fileType} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-3 bg-teak text-white hover:bg-marigold rounded-xl transition-all shadow-md">
                      <Download size={18} />
                    </a>
                  </div>
                ))
              ) : <EmptyState message="Your Digital Locker is empty." />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// UI Components
const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${active ? 'bg-marigold text-white shadow-lg' : 'bg-white text-khaki border border-sandstone hover:border-teak'}`}
  >
    {icon} {label}
  </button>
);

const EmptyState = ({ message }) => (
  <div className="bg-white border-2 border-dashed border-sandstone p-24 rounded-[4rem] text-center text-khaki w-full flex flex-col items-center">
    <div className="w-16 h-16 bg-parchment rounded-full flex items-center justify-center mb-6 border border-sandstone">
      <Activity size={32} className="opacity-20" />
    </div>
    <p className="font-heading text-xl opacity-60 italic">{message}</p>
  </div>
);

export default HealthLocker;