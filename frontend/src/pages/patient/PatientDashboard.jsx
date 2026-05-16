import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import {
  FileText, Clock, ExternalLink, LogOut,
  ShieldCheck, Activity, Search, Pill, X, Eye, Share2, Copy, Check, ChevronRight, RefreshCcw, FolderHeart, Calendar, Plus, Stethoscope, CheckCircle,
  Home, Users, History, User, Bell, Heart, Zap, Thermometer, Weight, Droplets, ArrowUpRight, QrCode
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lastVisitUpdate, setLastVisitUpdate] = useState(Date.now());

  const fetchProfile = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsSyncing(true);

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/patient/login');
      return;
    }

    try {
      const [profileRes, appointmentsRes] = await Promise.all([
        axios.get(`${API_URL}/api/auth/patient/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/auth/patient/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { success: true, data: [] } }))
      ]);

      setPatientData(profileRes.data.data);
      setAppointments(appointmentsRes.data.data || []);
      setLastVisitUpdate(Date.now());
    } catch (err) {
      console.error("❌ Vault Access Error:", err.response?.data || err.message);
      if (err.response?.status === 401) navigate('/patient/login');
    } finally {
      setLoading(false);
      setTimeout(() => setIsSyncing(false), 1000);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
    const patientPhone = localStorage.getItem('userPhone')?.replace(/\D/g, '').slice(-10);
    if (patientPhone) {
      socket.emit('joinClinic', patientPhone);
      socket.on('queueUpdate', () => fetchProfile(true));
    }

    const visitPollInterval = setInterval(() => {
      fetchProfile(true);
    }, 10000);

    return () => {
      socket.off('queueUpdate');
      clearInterval(visitPollInterval);
    };
  }, [fetchProfile]);

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayName = patientData?.name || "Patient";
  const reportsCount = patientData?.documents?.length || 0;

  const filteredHistory = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return patientData?.visitHistory?.filter(visit =>
      visit.clinicId?.name?.toLowerCase().includes(query) ||
      visit.notes?.toLowerCase().includes(query) ||
      visit.diagnosis?.toLowerCase().includes(query) ||
      visit.doctorName?.toLowerCase().includes(query)
    ) || [];
  }, [patientData, searchTerm]);

  const upcomingAppointment = useMemo(() => {
    return appointments
      .filter(app => app.status === 'Scheduled' && new Date(app.appointmentDate) > new Date())
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))[0];
  }, [appointments]);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
      <RefreshCcw size={40} className="text-teal-600 animate-spin" />
      <p className="font-black text-slate-900 text-xl tracking-tight">Accessing Digital Locker...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-body">
      <Sidebar role="patient" />
      
      <div className="flex-grow p-6 lg:p-10 overflow-y-auto h-screen custom-scrollbar max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
                Patient Portal
              </span>
              {isSyncing && <div className="w-2 h-2 bg-teal-500 rounded-full animate-ping"></div>}
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Hello, {displayName.split(' ')[0]} <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-wider">Your digital health records and wellness hub.</p>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/patient/locker')}
              className="px-6 py-3.5 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center gap-2"
            >
              <FolderHeart size={16} /> Digital Locker
            </button>
            <button 
              onClick={() => fetchProfile(true)}
              className="p-3.5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-teal-600 hover:border-teal-100 transition-all shadow-sm active:scale-95"
            >
              <RefreshCcw size={18} className={isSyncing ? 'animate-spin text-teal-500' : ''} />
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left Panel: Identity & Quick Stats */}
          <div className="lg:col-span-1 space-y-8">
            {/* Digital Identity Card */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-teal-400">
                    <ShieldCheck size={26} />
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <QrCode size={20} className="text-teal-400" />
                  </div>
                </div>
                
                <div className="mb-8">
                  <p className="text-[10px] font-black text-teal-500 uppercase tracking-[0.2em] mb-2">Patient Name</p>
                  <h3 className="text-2xl font-black tracking-tight uppercase leading-tight">{displayName}</h3>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Clinic ID</p>
                    <p className="text-sm font-black text-white">{patientData?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Verify Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <p className="text-sm font-black text-white">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Vitals Preview */}
            <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
              <h3 className="font-black text-xl text-slate-900 mb-8 flex items-center gap-3">
                <Activity size={20} className="text-teal-600" /> Latest Vitals
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <VitalCard icon={<Zap size={14} />} label="Pulse" val={patientData?.visitHistory?.[0]?.vitals?.pulseRate || '--'} unit="bpm" color="teal" />
                <VitalCard icon={<Thermometer size={14} />} label="Temp" val={patientData?.visitHistory?.[0]?.vitals?.temperature || '--'} unit="°C" color="orange" />
                <VitalCard icon={<Weight size={14} />} label="Weight" val={patientData?.visitHistory?.[0]?.vitals?.weight || '--'} unit="kg" color="blue" />
                <VitalCard icon={<Droplets size={14} />} label="BP" val={patientData?.visitHistory?.[0]?.vitals?.bloodPressure || '--'} unit="mmHg" color="rose" />
              </div>

              <div className="mt-8 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                  Vitals are recorded by clinical staff during your consultation. Track your baseline for better wellness.
                </p>
              </div>
            </div>

            {/* Reports Summary */}
            <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm group">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-xl text-slate-900">Health Records</h3>
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl"><FileText size={20} /></div>
              </div>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">{reportsCount}</span>
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Files</span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Documents in Digital Locker</p>
              <button 
                onClick={() => navigate('/patient/locker')}
                className="w-full py-4 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-teal-500 hover:text-teal-600 transition-all active:scale-95"
              >
                Open Health Locker
              </button>
            </div>
          </div>

          {/* Right Panel: Appointments & Timeline */}
          <div className="lg:col-span-2 space-y-10">
            {/* Upcoming Appointment High Priority */}
            <div className="bg-gradient-to-br from-teal-600 to-indigo-700 p-10 rounded-[3rem] text-white shadow-2xl shadow-teal-600/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-700" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <span className="px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/20">
                      Coming Up Next
                    </span>
                    <h3 className="text-4xl font-black tracking-tight mt-6 mb-2">
                      {upcomingAppointment ? `Appointment with Dr. ${upcomingAppointment.doctorName}` : "Stay Proactive!"}
                    </h3>
                    <p className="text-teal-100 font-bold text-sm">
                      {upcomingAppointment ? upcomingAppointment.clinicName : "Schedule your next routine check-up."}
                    </p>
                  </div>
                  <div className="hidden md:flex w-20 h-20 bg-white/10 rounded-3xl items-center justify-center backdrop-blur-md border border-white/10">
                    <Calendar size={32} className="text-white" />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-10 border-t border-white/10">
                  {upcomingAppointment ? (
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-teal-200 uppercase tracking-widest mb-1">Date & Time</span>
                        <span className="text-xl font-black">{new Date(upcomingAppointment.appointmentDate).toLocaleString('en-IN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="w-px h-10 bg-white/10 hidden md:block" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-teal-200 uppercase tracking-widest mb-1">Status</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-teal-300 rounded-full animate-ping" />
                          <span className="text-sm font-black uppercase tracking-widest">Scheduled</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-teal-200 font-bold text-sm italic">"Prevention is better than cure. Book your slot today."</p>
                  )}
                  
                  <button 
                    onClick={() => navigate('/patient/book-appointment')}
                    className="px-8 py-4 bg-white text-teal-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-50 transition-all shadow-xl active:scale-95 flex items-center gap-3"
                  >
                    <Plus size={18} /> {upcomingAppointment ? "Reschedule" : "Book New Slot"}
                  </button>
                </div>
              </div>
            </div>

            {/* Visit Timeline */}
            <div className="bg-white border border-slate-100 rounded-[3rem] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
              <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search history & diagnosis..."
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl outline-none focus:border-teal-500 text-sm font-bold shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-xl text-slate-400">
                  <History size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{filteredHistory.length} Total Visits</span>
                </div>
              </div>

              <div className="flex-grow overflow-auto p-8 custom-scrollbar">
                {filteredHistory.length > 0 ? (
                  <div className="space-y-6">
                    {filteredHistory
                      .sort((a, b) => new Date(b.date || b.visitDate) - new Date(a.date || a.visitDate))
                      .map((visit) => (
                        <div key={visit._id} className="group relative flex gap-8">
                          {/* Timeline Line */}
                          <div className="hidden md:flex flex-col items-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                              <Calendar size={20} />
                            </div>
                            <div className="flex-grow w-px bg-slate-100 mt-2" />
                          </div>

                          <div className="flex-grow bg-slate-50/50 p-8 rounded-[2rem] border border-transparent hover:border-teal-100 hover:bg-teal-50/30 transition-all duration-300">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-teal-100">
                                    {new Date(visit.date || visit.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                  <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{visit.clinicName}</span>
                                </div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tight">Dr. {visit.doctorName || visit.doctorId?.name}</h4>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setSelectedVisit(visit)}
                                  className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-teal-600 transition-all shadow-sm"
                                >
                                  <Eye size={18} />
                                </button>
                                <button 
                                  className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-teal-600 transition-all shadow-sm"
                                >
                                  <ArrowUpRight size={18} />
                                </button>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-2">Diagnosis</p>
                                <p className="text-sm font-bold text-slate-700 leading-relaxed">{visit.diagnosis || 'General Consultation'}</p>
                              </div>
                              <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-2">Symptoms</p>
                                <p className="text-sm font-bold text-slate-700 line-clamp-2">{visit.symptoms || 'None recorded'}</p>
                              </div>
                            </div>

                            {visit.medicines && visit.medicines.length > 0 && (
                              <div className="mt-6 flex flex-wrap gap-2">
                                {visit.medicines.map((med, idx) => (
                                  <span key={idx} className="px-3 py-1.5 bg-teal-50/50 text-teal-700 rounded-lg text-[10px] font-black uppercase tracking-wider border border-teal-100/50">
                                    {med.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <History size={48} className="mb-4" />
                    <p className="text-sm font-black uppercase tracking-[0.2em]">No Medical History</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95">
            <div className="p-8 bg-white border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><FileText size={24} /></div>
                <div>
                  <h3 className="font-black text-xl text-slate-900 tracking-tight">{previewFile.title}</h3>
                  <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1">Digital Health Record</p>
                </div>
              </div>
              <button onClick={() => setPreviewFile(null)} className="p-3 bg-slate-50 hover:bg-rose-50 rounded-2xl transition-all text-slate-400 hover:text-rose-500"><X size={24} /></button>
            </div>
            <iframe src={previewFile.fileUrl} className="flex-grow w-full border-none bg-slate-100" title="Report" />
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareFile && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 border border-slate-100 animate-in zoom-in-95 shadow-2xl">
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 bg-teal-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-teal-600/20"><Share2 size={24} /></div>
              <button onClick={() => setShareFile(null)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-rose-500 transition-all"><X size={24} /></button>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Secure Link</h3>
            <p className="text-sm font-bold text-slate-400 mb-8">This temporary link grants secure access to your medical file.</p>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between overflow-hidden mb-8">
              <code className="text-[10px] font-bold text-slate-400 truncate pr-4">{shareFile.fileUrl}</code>
              <button 
                onClick={() => handleCopyLink(shareFile.fileUrl)} 
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all shrink-0 ${copied ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'}`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">Locker Sync ID: {shareFile._id.substring(0, 12)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const VitalCard = ({ icon, label, val, unit, color }) => {
  const colors = {
    teal: "bg-teal-50 text-teal-600 border-teal-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };
  
  return (
    <div className={`p-5 rounded-2xl border ${colors[color]} shadow-sm transition-all hover:scale-105 duration-300`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-lg bg-white/50`}>{icon}</div>
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black tracking-tight">{val}</span>
        <span className="text-[8px] font-bold opacity-60 uppercase">{unit}</span>
      </div>
    </div>
  );
};

export default PatientDashboard;