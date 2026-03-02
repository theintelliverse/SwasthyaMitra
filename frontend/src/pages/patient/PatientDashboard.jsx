import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import {
  FileText, Clock, ExternalLink, LogOut,
  ShieldCheck, Activity, Search, Building2, Pill, X, Eye, Share2, Copy, Check, ChevronRight, RefreshCw, RefreshCcw, FolderHeart
} from 'lucide-react';
import Footer from '../../components/Footer';
const API_URL = import.meta.env.VITE_API_URL;
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchProfile = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsSyncing(true);

    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
      navigate('/patient/login');
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/api/auth/patient/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPatientData(res.data.data);
    } catch (err) {
      console.error("❌ Vault Access Error:", err.response?.data || err.message);
      if (err.response?.status === 401) navigate('/patient/login');
    } finally {
      setLoading(false);
      setTimeout(() => setIsSyncing(false), 1000);
    }
  };

  useEffect(() => {
    fetchProfile();
    const patientPhone = localStorage.getItem('userPhone')?.replace(/\D/g, '').slice(-10);
    if (patientPhone) {
      socket.emit('joinClinic', patientPhone);
      socket.on('queueUpdate', () => fetchProfile(true));
    }
    return () => socket.off('queueUpdate');
  }, []);

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 🔑 FIX 1: Accessing correct DB fields for Name and Counters
  const displayName = patientData?.name || "User";
  const uniqueClinicsCount = patientData?.visitHistory ? new Set(patientData.visitHistory.map(h => h.clinicId?._id || h.clinicId)).size : 0;

  // 🔑 FIX 2: Ensuring the Reports count looks at 'documents'
  const reportsCount = patientData?.documents?.length || 0;

  const filteredHistory = patientData?.visitHistory?.filter(visit =>
    visit.clinicId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) return (
    <div className="min-h-screen bg-[#EEF6FA] flex flex-col items-center justify-center">
      <RefreshCw size={40} className="text-[#1F6FB2] animate-spin mb-4" />
      <p className="font-heading text-[#0F766E]">Unlocking Health Vault...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#EEF6FA] font-body text-[#0F766E] flex flex-col">
      <nav className="bg-white border-b border-[#AFC4D8] px-6 py-4 sticky top-0 z-30 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1F6FB2] rounded-xl flex items-center justify-center text-white font-heading text-xl shadow-md cursor-pointer" onClick={() => fetchProfile(true)}>S</div>
          <div>
            <h1 className="font-heading text-lg leading-none">Appointory Locker</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-[#1F6FB2] animate-ping' : 'bg-green-500'}`}></div>
              <p className="text-[8px] font-black text-[#3FA28C] uppercase tracking-widest">Live Security Active</p>
            </div>
          </div>
        </div>
        <button onClick={() => { sessionStorage.clear(); navigate('/patient/login'); }} className="text-[10px] font-black uppercase text-[#3FA28C] hover:text-red-500 transition-colors flex items-center gap-2">
          <LogOut size={14} /> Logout
        </button>
      </nav>

      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-10">
        <header className="bg-[#0F766E] text-[#EEF6FA] p-10 rounded-[3rem] shadow-xl mb-12 flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
          <div className="relative z-10 text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A4F8A] mb-3">Verified Patient Profile</p>
            <h2 className="text-5xl font-heading mb-4 capitalize">{displayName}</h2>
            <div className="flex gap-4 justify-center md:justify-start">
              <span className="bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase border border-white/5">
                {uniqueClinicsCount} Facilities Visited
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/Patient/HealthLocker')}
            className="mt-8 md:mt-0 relative z-10 flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 group"
          >
            <FolderHeart size={18} className="group-hover:animate-bounce" />
            Open Full Health Locker
            <ChevronRight size={16} />
          </button>

          <ShieldCheck size={100} className="text-[#1F6FB2] opacity-10 absolute right-10 bottom-[-20px] md:bottom-auto" />
        </header>

        <div className="grid lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white border border-[#AFC4D8] p-8 rounded-[3rem] shadow-sm">
              <h3 className="font-heading text-xl mb-6 flex items-center gap-2"><Activity className="text-[#1F6FB2]" size={20} /> Snapshot</h3>
              <VitalMini label="Consultations" val={patientData?.visitHistory?.length} unit="Visits" />
              <VitalMini label="Reports" val={reportsCount} unit="Files" />
            </div>
            <div className="bg-white border border-[#AFC4D8] p-8 rounded-[3rem] shadow-sm sticky top-32">
              <h3 className="font-heading text-lg mb-4">Quick Find</h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3FA28C]" size={16} />
                <input
                  type="text" placeholder="Search diagnosis..."
                  className="w-full pl-11 pr-4 py-3 bg-[#EEF6FA] border border-[#AFC4D8] rounded-2xl outline-none focus:border-[#1F6FB2] text-sm font-bold"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-3xl">Recent Visits</h3>
              <button onClick={() => fetchProfile(true)} className="p-3 bg-white border border-[#AFC4D8] rounded-2xl text-[#3FA28C] hover:text-[#1F6FB2] transition-all">
                <RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''} />
              </button>
            </div>

            {filteredHistory.length > 0 ? (
              filteredHistory.map((visit) => {
                // 🔑 FIX 3: Prioritize 'documents' over 'digitalLocker' to match your DB Example
                const allDocs = patientData?.documents || patientData?.digitalLocker || [];
                const visitReports = allDocs.filter(doc =>
                  doc.visitId === (visit.visitId || visit._id)
                );

                return (
                  <div key={visit._id} className="bg-white p-8 rounded-[3.5rem] border border-[#AFC4D8] shadow-sm hover:border-[#1F6FB2] transition-all animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 size={16} className="text-[#3FA28C]" />
                          <h4 className="font-heading text-2xl text-[#0F766E]">{visit.clinicName || visit.clinicId?.name}</h4>
                        </div>
                        <p className="text-[10px] font-black uppercase text-[#1F6FB2] tracking-widest">
                          {new Date(visit.date || visit.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} • Dr. {visit.doctorName || visit.doctorId?.name}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#EEF6FA] p-6 rounded-[2rem] border border-[#AFC4D8]/50 mb-8 font-medium text-[#0F766E] text-sm line-clamp-2">
                      {visit.notes || visit.diagnosis || 'Routine consultation summary.'}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <button onClick={() => setSelectedVisit(visit)} className="flex items-center justify-between p-5 bg-[#0F766E] text-white rounded-2xl hover:bg-[#1F6FB2] transition-all shadow-lg group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20"><Pill size={18} /></div>
                          <span className="text-xs font-bold uppercase tracking-widest">View Summary</span>
                        </div>
                        <ChevronRight size={18} />
                      </button>

                      <div className="space-y-3">
                        {visitReports?.length > 0 ? (
                          <div className="space-y-2">
                            {visitReports.map((report, rIdx) => (
                              <div key={rIdx} className="flex gap-2">
                                <button onClick={() => setPreviewFile(report)} className="flex-grow flex items-center justify-between p-4 bg-white border border-[#AFC4D8] rounded-2xl hover:border-[#0F766E] transition-all group/report">
                                  <div className="flex items-center gap-3 overflow-hidden text-left">
                                    <FileText size={16} className="text-[#1F6FB2] shrink-0" />
                                    <span className="text-[11px] font-bold truncate group-hover/report:text-[#1F6FB2]">{report.title}</span>
                                  </div>
                                  <Eye size={14} className="text-[#AFC4D8]" />
                                </button>
                                <button onClick={() => setShareFile(report)} className="p-4 bg-[#EEF6FA] border border-[#AFC4D8] rounded-2xl text-[#1F6FB2] hover:bg-[#1F6FB2] hover:text-white transition-all shadow-sm"><Share2 size={16} /></button>
                              </div>
                            ))}
                          </div>
                        ) : <div className="p-4 border-2 border-dashed border-[#AFC4D8] rounded-2xl text-center opacity-30 text-[10px] font-bold">No linked reports</div>}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-[#AFC4D8] animate-in fade-in">
                <p className="font-heading text-2xl text-[#3FA28C] italic">No visit history found.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- MODALS --- */}
      {previewFile && (
        <div className="fixed inset-0 bg-[#0F766E]/90 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
          <div className="bg-[#EEF6FA] w-full max-w-5xl h-[90vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border border-[#AFC4D8]">
            <div className="p-6 bg-white border-b border-[#AFC4D8] flex justify-between items-center">
              <h3 className="font-heading text-lg">{previewFile.title}</h3>
              <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-red-50 rounded-xl transition-all text-red-500"><X size={24} /></button>
            </div>
            <iframe src={previewFile.fileUrl} className="flex-grow w-full border-none" title="Report" />
          </div>
        </div>
      )}

      {shareFile && (
        <div className="fixed inset-0 bg-[#0F766E]/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 border border-[#AFC4D8] animate-in zoom-in-95 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-[#1F6FB2]/10 rounded-2xl flex items-center justify-center text-[#1F6FB2]"><Share2 size={24} /></div>
              <button onClick={() => setShareFile(null)} className="text-[#3FA28C] hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>
            <h3 className="font-heading text-2xl text-[#0F766E] mb-2">Secure Link</h3>
            <p className="text-xs text-[#3FA28C] mb-6">Share this medical file with your doctor.</p>
            <div className="bg-[#EEF6FA] border border-[#AFC4D8] rounded-2xl p-4 flex items-center justify-between overflow-hidden">
              <code className="text-[10px] text-[#3FA28C] truncate pr-4">{shareFile.fileUrl}</code>
              <button onClick={() => handleCopyLink(shareFile.fileUrl)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all shrink-0 ${copied ? 'bg-green-500 text-white' : 'bg-[#0F766E] text-white'}`}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedVisit && (
        <div className="fixed inset-0 bg-[#0F766E]/60 backdrop-blur-md z-[90] flex items-center justify-center p-6">
          <div className="bg-[#EEF6FA] w-full max-w-2xl rounded-[3rem] p-10 border border-[#AFC4D8] shadow-2xl relative">
            <div className="flex justify-between mb-8 items-center border-b border-[#AFC4D8] pb-6">
              <div>
                <h2 className="text-2xl font-heading">Consultation Notes</h2>
                <p className="text-[10px] font-black uppercase text-[#1F6FB2] tracking-widest mt-1">Dr. {selectedVisit.doctorName || selectedVisit.doctorId?.name} • {selectedVisit.clinicName || selectedVisit.clinicId?.name}</p>
              </div>
              <button onClick={() => setSelectedVisit(null)} className="p-2 hover:bg-black/5 rounded-full transition-all text-[#3FA28C]"><X size={24} /></button>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-[#AFC4D8] shadow-inner font-medium text-[#0F766E] leading-relaxed whitespace-pre-wrap min-h-[300px]">
              {selectedVisit.notes || selectedVisit.diagnosis || 'No specific notes recorded.'}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

const VitalMini = ({ label, val, unit }) => (
  <div className="flex justify-between items-end border-b border-[#AFC4D8]/30 pb-3 mb-3">
    <span className="text-[10px] font-black text-[#3FA28C] uppercase tracking-widest">{label}</span>
    <div className="text-right">
      <span className="text-xl font-heading text-[#0F766E]">{val || '0'}</span>
      <span className="text-[8px] font-bold text-[#3FA28C] ml-1">{unit}</span>
    </div>
  </div>
);

export default PatientDashboard;