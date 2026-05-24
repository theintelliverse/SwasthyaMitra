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
import { QRCodeSVG } from 'qrcode.react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const socket = SOCKET_URL ? io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true
}) : { on: () => { }, off: () => { }, emit: () => { } };

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
  const [showQrModal, setShowQrModal] = useState(false);
  const [lastVisitUpdate, setLastVisitUpdate] = useState(Date.now());
  const [selectedVisit, setSelectedVisit] = useState(null);

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

  const MobileSummary = () => {
    const pulse = patientData?.vitals?.[0]?.pulseRate || patientData?.visitHistory?.[0]?.vitals?.pulseRate || '--';
    const temp = patientData?.vitals?.[0]?.temperature || patientData?.visitHistory?.[0]?.vitals?.temperature || '--';
    const weight = patientData?.vitals?.[0]?.weight || patientData?.visitHistory?.[0]?.vitals?.weight || '--';
    const bp = patientData?.vitals?.[0]?.bloodPressure || patientData?.visitHistory?.[0]?.vitals?.bloodPressure || '--';

    return (
      <div className="md:hidden space-y-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black">Hello, {displayName.split(' ')[0]} <span className="inline-block">👋</span></p>
              <p className="text-xs text-slate-400 mt-1">Your digital health records and wellness hub.</p>
            </div>
            <button onClick={() => navigate('/patient/locker')} className="bg-teal-600 text-white px-3 py-2 rounded-lg text-xs font-black">Digital Locker</button>
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Patient Name</p>
                <p className="font-black">{displayName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Patient ID</p>
                <p className="font-black">{patientData?.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <p className="text-sm font-black">Active</p>
              </div>
              <div className="text-xs text-slate-500">Verified</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-[10px] text-slate-400">Pulse</p>
              <p className="font-black text-sm">{pulse}</p>
              <p className="text-[10px] text-slate-400">bpm</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-[10px] text-slate-400">Temp</p>
              <p className="font-black text-sm">{temp}</p>
              <p className="text-[10px] text-slate-400">°C</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-[10px] text-slate-400">Weight</p>
              <p className="font-black text-sm">{weight}</p>
              <p className="text-[10px] text-slate-400">kg</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-[10px] text-slate-400">BP</p>
              <p className="font-black text-sm">{bp}</p>
              <p className="text-[10px] text-slate-400">mmHg</p>
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black">Health Records</p>
                <p className="text-[10px] text-slate-400">{reportsCount} Files</p>
              </div>
              <button onClick={() => navigate('/patient/locker')} className="px-3 py-2 rounded-lg border border-slate-100 text-[10px] font-black">Open Health Locker</button>
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <p className="text-xs font-black">Coming Up Next</p>
            <p className="text-sm text-slate-600 mt-1">{upcomingAppointment ? `Appointment with Dr. ${upcomingAppointment.doctorName}` : 'Stay Proactive! Schedule your next routine check-up.'}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => navigate('/patient/book-appointment', { state: { rescheduleApp: upcomingAppointment } })} className="flex-1 bg-teal-600 text-white py-2 rounded-lg font-black text-sm">{upcomingAppointment ? 'Reschedule' : 'Book New Slot'}</button>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
          <div className="text-xs text-slate-400 font-black uppercase">Search history & diagnosis...</div>
          <div className="text-sm font-black mt-2">{filteredHistory.length} Total Visits</div>
          {filteredHistory.length === 0 && <div className="text-xs text-slate-400 mt-2">No Medical</div>}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
      <RefreshCcw size={40} className="text-teal-600 animate-spin" />
      <p className="font-black text-slate-900 text-xl tracking-tight">Accessing Digital Locker...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-body">
      <Sidebar role="patient" />

      <div className="flex-grow p-3 pb-32 lg:p-4 lg:pb-4 overflow-y-auto h-screen custom-scrollbar max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="px-2 py-0.5 bg-teal-50 text-teal-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-teal-100">
                Patient Portal
              </span>
              {isSyncing && <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping"></div>}
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Hello, {displayName.split(' ')[0]} <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] mt-0.5 uppercase tracking-wider">Your digital health records and wellness hub.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/patient/locker')}
              className="px-3 py-2 bg-teal-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center gap-1.5"
            >
              <FolderHeart size={12} /> Digital Locker
            </button>
            <button
              onClick={() => fetchProfile(true)}
              className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-teal-600 hover:border-teal-100 transition-all shadow-sm active:scale-95"
            >
              <RefreshCcw size={13} className={isSyncing ? 'animate-spin text-teal-500' : ''} />
            </button>
          </div>
        </header>

        {/* Mobile summary card */}
        <MobileSummary />

        <div className="grid lg:grid-cols-3 gap-3">
          {/* Left Panel: Identity & Quick Stats */}
          <div className="lg:col-span-1 space-y-3">
            {/* Digital Identity Card */}
            <div className="bg-slate-900 p-8 rounded-3xl text-white overflow-hidden relative group min-h-[16rem]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full -ml-8 -mb-8 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-teal-400">
                    <ShieldCheck size={20} />
                  </div>
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="p-2.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <QrCode size={18} className="text-teal-400" />
                  </button>
                </div>

                <div className="mb-8">
                  <p className="text-[10px] font-black text-teal-500 uppercase tracking-[0.25em] mb-1.5">Patient Name</p>
                  <h3 className="text-xl font-black tracking-tight uppercase leading-tight">{displayName}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Patient ID</p>
                    <p className="text-xs font-black text-white">{patientData?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Verify Status</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                      <p className="text-xs font-black text-white">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Vitals Preview */}
            <div className="bg-white border border-slate-100 p-2.5 rounded-xl shadow-sm">
              <h3 className="font-black text-xs text-slate-900 mb-2 flex items-center gap-1">
                <Activity size={11} className="text-teal-600" /> Latest Vitals
              </h3>

              <div className="grid grid-cols-2 gap-1.5">
                <VitalCard icon={<Zap size={9} />} label="Pulse" val={patientData?.vitals?.[0]?.pulseRate || patientData?.visitHistory?.[0]?.vitals?.pulseRate || '--'} unit="bpm" color="teal" />
                <VitalCard icon={<Thermometer size={9} />} label="Temp" val={patientData?.vitals?.[0]?.temperature || patientData?.visitHistory?.[0]?.vitals?.temperature || '--'} unit="°C" color="orange" />
                <VitalCard icon={<Weight size={9} />} label="Weight" val={patientData?.vitals?.[0]?.weight || patientData?.visitHistory?.[0]?.vitals?.weight || '--'} unit="kg" color="blue" />
                <VitalCard icon={<Droplets size={9} />} label="BP" val={patientData?.vitals?.[0]?.bloodPressure || patientData?.visitHistory?.[0]?.vitals?.bloodPressure || '--'} unit="mmHg" color="rose" />
              </div>

              <div className="mt-2 p-1.5 bg-slate-50 rounded-md border border-slate-100">
                <p className="text-[7px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                  Vitals are recorded by clinical staff during your consultation. Track your baseline for better wellness.
                </p>
              </div>
            </div>

            {/* Reports Summary */}
            <div className="bg-white border border-slate-100 p-3.5 rounded-2xl shadow-sm group">
              <div className="flex justify-between items-center mb-2.5">
                <h3 className="font-black text-sm text-slate-900">Health Records</h3>
                <div className="p-1 bg-teal-50 text-teal-600 rounded-md"><FileText size={12} /></div>
              </div>
              <div className="flex items-end gap-1.5 mb-0.5">
                <span className="text-2xl font-black text-slate-900 tracking-tighter">{reportsCount}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Files</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Documents in Digital Locker</p>
              <button
                onClick={() => navigate('/patient/locker')}
                className="w-full py-2 border-2 border-slate-100 rounded-lg font-black text-[9px] uppercase tracking-widest hover:border-teal-500 hover:text-teal-600 transition-all active:scale-95"
              >
                Open Health Locker
              </button>
            </div>
          </div>

          {/* Right Panel: Appointments & Timeline */}
          <div className="lg:col-span-2 space-y-3">
            {/* Upcoming Appointment High Priority */}
            <div className="bg-gradient-to-br from-teal-600 to-indigo-700 p-4 rounded-2xl text-white shadow-lg shadow-teal-600/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-white/20">
                      Coming Up Next
                    </span>
                    <h3 className="text-lg font-black tracking-tight mt-2 mb-0.5">
                      {upcomingAppointment ? `Appointment with Dr. ${upcomingAppointment.doctorName}` : "Stay Proactive!"}
                    </h3>
                    <p className="text-teal-100 font-bold text-[10px]">
                      {upcomingAppointment ? upcomingAppointment.clinicName : "Schedule your next routine check-up."}
                    </p>
                  </div>
                  <div className="hidden md:flex w-10 h-10 bg-white/10 rounded-xl items-center justify-center backdrop-blur-md border border-white/10">
                    <Calendar size={16} className="text-white" />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-3 border-t border-white/10">
                  {upcomingAppointment ? (
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-teal-200 uppercase tracking-widest mb-0.5">Date & Time</span>
                        <span className="text-sm font-black">{new Date(upcomingAppointment.appointmentDate).toLocaleString('en-IN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="w-px h-6 bg-white/10 hidden md:block" />
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-teal-200 uppercase tracking-widest mb-0.5">Status</span>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-teal-300 rounded-full animate-ping" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Scheduled</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-teal-200 font-bold text-[10px] italic">"Prevention is better than cure. Book your slot today."</p>
                  )}

                  <button
                    onClick={() => navigate('/patient/book-appointment', { state: { rescheduleApp: upcomingAppointment } })}
                    className="px-3.5 py-2 bg-white text-teal-600 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] hover:bg-teal-50 transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <Plus size={11} /> {upcomingAppointment ? "Reschedule" : "Book New Slot"}
                  </button>
                </div>
              </div>
            </div>

            {/* Visit Timeline */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[300px]">
              <div className="p-3 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-2 bg-slate-50/50">
                <div className="relative w-full md:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input
                    type="text"
                    placeholder="Search history & diagnosis..."
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-100 rounded-lg outline-none focus:border-teal-500 text-xs font-bold shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-100 rounded-md text-slate-400">
                  <History size={11} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{filteredHistory.length} Total Visits</span>
                </div>
              </div>

              <div className="flex-grow overflow-auto p-3 custom-scrollbar">
                {filteredHistory.length > 0 ? (
                  <div className="space-y-2.5">
                    {filteredHistory
                      .sort((a, b) => new Date(b.date || b.visitDate) - new Date(a.date || a.visitDate))
                      .map((visit) => (
                        <div key={visit._id} className="group relative flex gap-2.5">
                          {/* Timeline Line */}
                          <div className="hidden md:flex flex-col items-center">
                            <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                              <Calendar size={12} />
                            </div>
                            <div className="flex-grow w-px bg-slate-100 mt-1.5" />
                          </div>

                          <div className="flex-grow bg-slate-50/50 p-3 rounded-xl border border-transparent hover:border-teal-100 hover:bg-teal-50/30 transition-all duration-300">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-2.5">
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest bg-white px-2 py-0.5 rounded-full border border-teal-100">
                                    {new Date(visit.date || visit.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                  <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{visit.clinicName}</span>
                                </div>
                                <h4 className="text-sm font-black text-slate-900 tracking-tight">Dr. {visit.doctorName || visit.doctorId?.name}</h4>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setSelectedVisit(visit)}
                                  className="p-1.5 bg-white border border-slate-100 rounded-md text-slate-400 hover:text-teal-600 transition-all shadow-sm"
                                >
                                  <Eye size={11} />
                                </button>
                                <button
                                  className="p-1.5 bg-white border border-slate-100 rounded-md text-slate-400 hover:text-teal-600 transition-all shadow-sm"
                                >
                                  <ArrowUpRight size={11} />
                                </button>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-2">
                              <div className="p-2.5 bg-white rounded-lg border border-slate-100 shadow-sm">
                                <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest mb-0.5">Diagnosis</p>
                                <p className="text-[10px] font-bold text-slate-700 leading-relaxed">{visit.diagnosis || 'General Consultation'}</p>
                              </div>
                              <div className="p-2.5 bg-white rounded-lg border border-slate-100 shadow-sm">
                                <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest mb-0.5">Symptoms</p>
                                <p className="text-[10px] font-bold text-slate-700 line-clamp-2">{visit.symptoms || 'None recorded'}</p>
                              </div>
                            </div>

                            {visit.medicines && visit.medicines.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {visit.medicines.map((med, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-teal-50/50 text-teal-700 rounded-md text-[8px] font-black uppercase tracking-wider border border-teal-100/50">
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
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                    {appointments.length > 0 ? (
                      appointments.slice(0, 3).map((apt, idx) => (
                        <div key={apt._id || idx} className="group relative flex gap-2.5">
                          <div className="hidden md:flex flex-col items-center">
                            <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                              <Calendar size={12} />
                            </div>
                            <div className="flex-grow w-px bg-slate-100 mt-1.5" />
                          </div>

                          <div className="flex-grow bg-slate-50/50 p-3 rounded-xl border border-transparent hover:border-teal-100 hover:bg-teal-50/30 transition-all duration-300">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-2.5">
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest bg-white px-2 py-0.5 rounded-full border border-teal-100">
                                    {new Date(apt.appointmentDate || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                  <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{apt.clinicName || 'Clinic'}</span>
                                </div>
                                <h4 className="text-sm font-black text-slate-900 tracking-tight">Dr. {apt.doctorName || 'Doctor'}</h4>
                              </div>
                              <div className="px-2 py-1 bg-teal-50 text-teal-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-teal-100">
                                Scheduled
                              </div>
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-100 shadow-sm">
                              <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest mb-0.5">Reason / Symptoms</p>
                              <p className="text-[10px] font-bold text-slate-700 leading-relaxed">{apt.reason || 'General Consultation'}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      [
                        { id: 1, date: new Date(Date.now() - 86400000 * 2), clinic: 'City Care Hospital', doctor: 'A. Sharma', diagnosis: 'Viral Fever', symptoms: 'Fever, Body Ache' },
                        { id: 2, date: new Date(Date.now() - 86400000 * 15), clinic: 'Wellness Center', doctor: 'S. Gupta', diagnosis: 'Routine Checkup', symptoms: 'None' },
                        { id: 3, date: new Date(Date.now() - 86400000 * 45), clinic: 'Prime Diagnostics', doctor: 'R. Patel', diagnosis: 'Blood Test Review', symptoms: 'Weakness' }
                      ].map((dummy, idx) => (
                        <div key={dummy.id} className="group relative flex gap-2.5">
                          <div className="hidden md:flex flex-col items-center">
                            <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                              <Calendar size={12} />
                            </div>
                            <div className="flex-grow w-px bg-slate-100 mt-1.5" />
                          </div>

                          <div className="flex-grow bg-slate-50/50 p-3 rounded-xl border border-transparent hover:border-teal-100 hover:bg-teal-50/30 transition-all duration-300">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-2.5">
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest bg-white px-2 py-0.5 rounded-full border border-teal-100">
                                    {dummy.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                  <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{dummy.clinic}</span>
                                </div>
                                <h4 className="text-sm font-black text-slate-900 tracking-tight">Dr. {dummy.doctor}</h4>
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-2">
                              <div className="p-2.5 bg-white rounded-lg border border-slate-100 shadow-sm">
                                <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest mb-0.5">Diagnosis</p>
                                <p className="text-[10px] font-bold text-slate-700 leading-relaxed">{dummy.diagnosis}</p>
                              </div>
                              <div className="p-2.5 bg-white rounded-lg border border-slate-100 shadow-sm">
                                <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest mb-0.5">Symptoms</p>
                                <p className="text-[10px] font-bold text-slate-700 line-clamp-2">{dummy.symptoms}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
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

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[120] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 border border-slate-100 animate-in zoom-in-95 shadow-2xl relative text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-6 right-6 p-3 bg-slate-50 hover:bg-rose-50 rounded-2xl transition-all text-slate-400 hover:text-rose-500 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="mx-auto w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mb-6">
              <QrCode size={36} />
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Your Patient Pass</h3>
            <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">Scan at Clinic Desk to Check-In</p>

            <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
              <QRCodeSVG
                value={patientData?.phone || ''}
                size={180}
                bgColor="#F8FAFC"
                fgColor="#0F172A"
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="space-y-1">
              <h4 className="font-black text-slate-900">{displayName}</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {patientData?.phone || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Visit Detail Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300">
            <div className="p-4 bg-slate-900 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-0.5">Consultation Record</p>
                <h3 className="text-sm font-black text-white tracking-tight">Dr. {selectedVisit.doctorName || selectedVisit.doctorId?.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold">{selectedVisit.clinicName}</p>
              </div>
              <button onClick={() => setSelectedVisit(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all">
                <X size={14} />
              </button>
            </div>
            <div className="px-4 py-2 bg-teal-50 border-b border-teal-100 flex items-center gap-2">
              <Calendar size={11} className="text-teal-600" />
              <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">
                {new Date(selectedVisit.date || selectedVisit.visitDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest mb-1">Diagnosis</p>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">{selectedVisit.diagnosis || 'General Consultation'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest mb-1">Symptoms</p>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">{selectedVisit.symptoms || 'None recorded'}</p>
                </div>
              </div>
              {selectedVisit.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest mb-1">Doctor's Notes</p>
                  <p className="text-xs font-bold text-slate-700 italic">"{selectedVisit.notes}"</p>
                </div>
              )}
              {selectedVisit.medicines && selectedVisit.medicines.length > 0 && (
                <div className="p-3 bg-slate-900 rounded-xl">
                  <p className="text-[8px] font-black text-teal-400 uppercase tracking-widest mb-2">Prescribed Medicines</p>
                  <div className="space-y-1.5">
                    {selectedVisit.medicines.map((med, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-xs font-black text-white">{med.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{med.time}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-teal-400">{med.amount}</p>
                          <p className="text-[9px] font-bold text-slate-500">Total: {med.total}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedVisit.vitals && Object.values(selectedVisit.vitals).some(v => v) && (
                <div className="grid grid-cols-4 gap-1.5">
                  {selectedVisit.vitals.pulseRate && <div className="p-2 bg-teal-50 rounded-lg border border-teal-100 text-center"><p className="text-[7px] font-black text-teal-600 uppercase">Pulse</p><p className="text-sm font-black text-teal-700">{selectedVisit.vitals.pulseRate}</p><p className="text-[6px] text-teal-500">bpm</p></div>}
                  {selectedVisit.vitals.bloodPressure && <div className="p-2 bg-rose-50 rounded-lg border border-rose-100 text-center"><p className="text-[7px] font-black text-rose-600 uppercase">BP</p><p className="text-sm font-black text-rose-700">{selectedVisit.vitals.bloodPressure}</p><p className="text-[6px] text-rose-500">mmHg</p></div>}
                  {selectedVisit.vitals.temperature && <div className="p-2 bg-orange-50 rounded-lg border border-orange-100 text-center"><p className="text-[7px] font-black text-orange-600 uppercase">Temp</p><p className="text-sm font-black text-orange-700">{selectedVisit.vitals.temperature}</p><p className="text-[6px] text-orange-500">°C</p></div>}
                  {selectedVisit.vitals.weight && <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-center"><p className="text-[7px] font-black text-blue-600 uppercase">Weight</p><p className="text-sm font-black text-blue-700">{selectedVisit.vitals.weight}</p><p className="text-[6px] text-blue-500">kg</p></div>}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setSelectedVisit(null)} className="w-full py-2 bg-slate-900 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">Close</button>
            </div>
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
    <div className={`p-1.5 rounded-md border ${colors[color]} shadow-sm transition-all hover:scale-105 duration-300`}>
      <div className="flex items-center gap-0.5 mb-0.5">
        <div className={`p-0.5 rounded bg-white/50`}>{icon}</div>
        <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-sm font-black tracking-tight">{val}</span>
        <span className="text-[6px] font-bold opacity-60 uppercase">{unit}</span>
      </div>
    </div>
  );
};

export default PatientDashboard;