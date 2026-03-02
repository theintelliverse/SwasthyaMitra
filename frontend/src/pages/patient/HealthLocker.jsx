import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '../../config/runtime';
import {
  User, FileText, Activity, History, Download, ExternalLink, Share2, Calendar,
  ShieldCheck, TrendingUp, ArrowLeft, RefreshCw, Smartphone, Hash
} from 'lucide-react';
const API_URL = API_BASE_URL;
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const normalizeUrl = (value = '') => value.toString().trim().replace(/^http:\/\//i, 'https://');

const toCloudinaryDownloadUrl = (url = '') => {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }
  return url.replace('/upload/', '/upload/fl_attachment/');
};

const getDocumentUrl = (doc) => (
  normalizeUrl(
    doc?.secureUrl ||
    doc?.fileUrl ||
    doc?.url ||
    doc?.secure_url ||
    doc?.secureUrl ||
    doc?.filePath ||
    doc?.reportUrl ||
    doc?.publicUrl ||
    doc?.documentUrl ||
    '')
);

const getDocumentFileName = (doc) => {
  const safeTitle = (doc?.title || 'Clinical_Report').replace(/[^a-z0-9-_]/gi, '_');
  const type = (doc?.fileType || '').toLowerCase();
  if (type.includes('pdf')) return `${safeTitle}.pdf`;
  if (type.includes('image')) return `${safeTitle}.jpg`;

  const url = getDocumentUrl(doc);
  const lastSegment = url.split('?')[0].split('/').pop() || '';
  if (lastSegment.includes('.')) return lastSegment;

  return `${safeTitle}.pdf`;
};

const HealthLocker = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('history');

  const documents = [
    ...(Array.isArray(data?.documents) ? data.documents : []),
    ...(Array.isArray(data?.digitalLocker) ? data.digitalLocker : [])
  ].filter(Boolean);

  const openDocument = (doc) => {
    const fileUrl = getDocumentUrl(doc);
    if (!fileUrl) {
      return;
    }
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async (doc) => {
    const fileUrl = getDocumentUrl(doc);
    if (!fileUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: doc?.title || 'Clinical Report',
          text: 'Patient report link',
          url: fileUrl
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fileUrl);
      }
    } catch {
      // no-op
    }
  };

  const handleDownload = async (doc) => {
    const fileUrl = getDocumentUrl(doc);
    if (!fileUrl) return;

    const downloadUrl = toCloudinaryDownloadUrl(fileUrl);

    try {
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.download = getDocumentFileName(doc);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      return;
    } catch {
      // fallback below
    }

    try {
      const response = await fetch(fileUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = getDocumentFileName(doc);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      const fallbackAnchor = document.createElement('a');
      fallbackAnchor.href = fileUrl;
      fallbackAnchor.target = '_blank';
      fallbackAnchor.rel = 'noopener noreferrer';
      fallbackAnchor.download = getDocumentFileName(doc);
      document.body.appendChild(fallbackAnchor);
      fallbackAnchor.click();
      fallbackAnchor.remove();
    }
  };

  const fetchHealthData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsSyncing(true);

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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
  }, [navigate]);

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
  }, [fetchHealthData]);

  if (loading) return (
    <div className="min-h-screen bg-[#EEF6FA] flex flex-col items-center justify-center gap-4">
      <RefreshCw size={32} className="text-[#1F6FB2] animate-spin" />
      <div className="font-heading text-xl text-[#0F766E]">Unlocking Appointory Vault...</div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#EEF6FA] flex flex-col items-center justify-center p-10">
      <p className="font-heading text-xl text-[#3FA28C] mb-6">No records found for this account.</p>
      <button onClick={() => navigate(-1)} className="px-8 py-3 bg-[#0F766E] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#EEF6FA] font-body text-[#0F766E] p-6 pb-20">
      <div className="max-w-5xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3FA28C] hover:text-[#0F766E] transition-colors"
          >
            <ArrowLeft size={14} /> Close Vault
          </button>
          {isSyncing && (
            <div className="flex items-center gap-2 text-[#1F6FB2] animate-pulse">
              <RefreshCw size={12} className="animate-spin" />
              <span className="text-[8px] font-black uppercase tracking-widest">Live Sync Active</span>
            </div>
          )}
        </div>

        {/* --- Header --- */}
        <div className="bg-[#0F766E] rounded-[3rem] p-8 md:p-12 shadow-xl mb-10 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <ShieldCheck size={120} />
          </div>

          <div className="w-24 h-24 bg-[#1F6FB2] rounded-[2rem] flex items-center justify-center text-white text-4xl font-heading shadow-lg z-10">
            {data.name?.charAt(0) || 'P'}
          </div>

          <div className="text-center md:text-left z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A4F8A] mb-1">Authenticated Identity</p>
            <h1 className="text-4xl font-heading">{data.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
              <p className="text-white/60 text-[10px] font-bold flex items-center gap-2"><Smartphone size={12} /> {data.phone}</p>
              <p className="text-white/60 text-[10px] font-bold flex items-center gap-2"><Hash size={12} /> {data.visitHistory?.length} Consultations</p>
            </div>
          </div>
        </div>

        {/* --- Navigation Tabs --- */}
        <div className="flex gap-4 mb-8 bg-[#AFC4D8]/20 p-2 rounded-2xl w-fit mx-auto md:mx-0 overflow-x-auto no-scrollbar">
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={16} />} label="Consultations" />
          <TabButton active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} icon={<FileText size={16} />} label="Digital Locker" />
        </div>

        {/* --- Dynamic Content Area --- */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'history' && (
            <div className="space-y-6">
              {data.visitHistory?.length > 0 ? (
                data.visitHistory.map((record) => (
                  <div key={record._id} className="bg-white p-8 rounded-[2.5rem] border border-[#AFC4D8] shadow-sm hover:border-[#1F6FB2] transition-all animate-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-heading text-xl text-[#0F766E]">Dr. {record.doctorId?.name}</h3>
                        <p className="text-[10px] font-black text-[#3FA28C] uppercase tracking-widest">{record.clinicId?.name}</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#1F6FB2] bg-[#1F6FB2]/10 px-4 py-1.5 rounded-full flex items-center gap-2">
                        <Calendar size={12} /> {new Date(record.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="p-6 bg-[#EEF6FA] rounded-3xl border border-[#AFC4D8]/50 text-sm text-[#0F766E] leading-relaxed whitespace-pre-wrap font-medium">
                      {record.notes || 'No notes provided by doctor.'}
                    </div>
                  </div>
                ))
              ) : <EmptyState message="No consultation history found." />}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.length > 0 ? (
                documents.map((doc, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-[#AFC4D8] flex items-center justify-between group hover:border-[#1F6FB2] transition-all animate-in zoom-in-95">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#EEF6FA] rounded-2xl flex items-center justify-center text-[#1F6FB2] border border-[#AFC4D8]">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{doc.title || 'Clinical Report'}</h4>
                        <p className="text-[9px] font-black text-[#3FA28C] uppercase">{doc.fileType || 'Report'} • {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown date'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openDocument(doc)} className="p-3 bg-[#EEF6FA] text-[#1F6FB2] hover:bg-[#1F6FB2] hover:text-white rounded-xl transition-all border border-[#AFC4D8]">
                        <ExternalLink size={16} />
                      </button>
                      <button type="button" onClick={() => handleShare(doc)} className="p-3 bg-[#EEF6FA] text-[#1F6FB2] hover:bg-[#1F6FB2] hover:text-white rounded-xl transition-all border border-[#AFC4D8]">
                        <Share2 size={16} />
                      </button>
                      <button type="button" onClick={() => handleDownload(doc)} className="p-3 bg-[#0F766E] text-white hover:bg-[#1F6FB2] rounded-xl transition-all shadow-md">
                        <Download size={18} />
                      </button>
                    </div>
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
    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${active ? 'bg-[#1F6FB2] text-white shadow-lg' : 'bg-white text-[#3FA28C] border border-[#AFC4D8] hover:border-[#0F766E]'}`}
  >
    {icon} {label}
  </button>
);

const EmptyState = ({ message }) => (
  <div className="bg-white border-2 border-dashed border-[#AFC4D8] p-24 rounded-[4rem] text-center text-[#3FA28C] w-full flex flex-col items-center">
    <div className="w-16 h-16 bg-[#EEF6FA] rounded-full flex items-center justify-center mb-6 border border-[#AFC4D8]">
      <Activity size={32} className="opacity-20" />
    </div>
    <p className="font-heading text-xl opacity-60 italic">{message}</p>
  </div>
);

export default HealthLocker;