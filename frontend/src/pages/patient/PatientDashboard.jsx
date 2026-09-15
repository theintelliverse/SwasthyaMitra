import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_URL, API_URL } from '../../config/runtime';
import {
  FileText, Clock, ExternalLink, LogOut,
  ShieldCheck, Activity, Search, Pill, X, Eye, Share2, Copy, Check, ChevronRight, RefreshCcw, FolderHeart, Calendar, Plus, Stethoscope, CheckCircle,
  Home, Users, History, User, Bell, Heart, Zap, Thermometer, Weight, Droplets, ArrowUpRight, QrCode, Upload, ArrowRight, Sparkles, MapPin, AlertCircle
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { QRCodeSVG } from 'qrcode.react';
import SEO from '../../components/SEO';
import PatientBottomNav from '../../components/patient/PatientBottomNav';
import AppointmentCard from '../../components/patient/AppointmentCard';
import AppointmentDetailSheet from '../../components/patient/AppointmentDetailSheet';

const socket = SOCKET_URL ? io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true
}) : { on: () => { }, off: () => { }, emit: () => { } };

// Modern Mobile Patient Summary Header
const MobileSummary = ({ patientData, displayName, onShowQr }) => {
  const pulse = patientData?.vitals?.[0]?.pulseRate || patientData?.visitHistory?.[0]?.vitals?.pulseRate || '--';
  const temp = patientData?.vitals?.[0]?.temperature || patientData?.visitHistory?.[0]?.vitals?.temperature || '--';
  const weight = patientData?.vitals?.[0]?.weight || patientData?.visitHistory?.[0]?.vitals?.weight || '--';
  const bp = patientData?.vitals?.[0]?.bloodPressure || patientData?.visitHistory?.[0]?.vitals?.bloodPressure || '--';

  return (
    <div className="md:hidden space-y-3 mb-5">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-5 rounded-3xl text-white shadow-xl shadow-slate-900/15 relative overflow-hidden border border-teal-500/20">
        {/* Background glow effects */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-tr from-teal-400 to-emerald-400 text-slate-950 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-teal-500/30">
              {displayName.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-400">Authenticated Patient</p>
              <h2 className="text-lg font-black tracking-tight">{displayName}</h2>
            </div>
          </div>
          <button 
            onClick={onShowQr}
            className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-teal-300 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-black"
          >
            <QrCode size={16} />
            <span>Card</span>
          </button>
        </div>

        {/* Vitals Horizontal Bar */}
        <div className="relative z-10 grid grid-cols-4 gap-2 pt-3 border-t border-white/10 text-center">
          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[9px] font-black text-teal-300 uppercase tracking-wider">Pulse</p>
            <p className="font-black text-white text-xs mt-0.5">{pulse}</p>
          </div>
          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[9px] font-black text-rose-300 uppercase tracking-wider">Temp</p>
            <p className="font-black text-white text-xs mt-0.5">{temp}</p>
          </div>
          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[9px] font-black text-blue-300 uppercase tracking-wider">Weight</p>
            <p className="font-black text-white text-xs mt-0.5">{weight}</p>
          </div>
          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[9px] font-black text-emerald-300 uppercase tracking-wider">BP</p>
            <p className="font-black text-white text-xs mt-0.5">{bp}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'appointments' ? 'appointments' : 'home';

  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab); // 'home' | 'appointments'
  const [appointmentSegment, setAppointmentSegment] = useState('upcoming'); // 'upcoming' | 'past'
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const fetchProfile = useCallback(async () => {
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
    } catch (err) {
      console.error("❌ Vault Access Error:", err.response?.data || err.message);
      if (err.response?.status === 401) navigate('/patient/login');
    }
  }, [navigate]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchProfile();
    });

    const patientPhone = localStorage.getItem('userPhone')?.replace(/\D/g, '').slice(-10);
    if (patientPhone) {
      socket.emit('joinClinic', patientPhone);
      socket.on('queueUpdate', () => fetchProfile());
    }

    const visitPollInterval = setInterval(() => {
      fetchProfile();
    }, 10000);

    return () => {
      active = false;
      socket.off('queueUpdate');
      clearInterval(visitPollInterval);
    };
  }, [fetchProfile]);

  const displayName = patientData?.name || "Patient";

  const upcomingAppointments = useMemo(() => {
    return appointments.filter(app => 
      app.status === 'Scheduled' || app.status === 'Waiting' || app.status === 'Confirmed' || new Date(app.appointmentDate || app.createdAt) >= new Date()
    ).sort((a, b) => new Date(a.appointmentDate || a.createdAt) - new Date(b.appointmentDate || b.createdAt));
  }, [appointments]);

  const pastAppointments = useMemo(() => {
    return appointments.filter(app => 
      app.status === 'Completed' || app.status === 'Cancelled' || new Date(app.appointmentDate || app.createdAt) < new Date()
    ).sort((a, b) => new Date(b.appointmentDate || b.createdAt) - new Date(a.appointmentDate || a.createdAt));
  }, [appointments]);

  const nextHeroAppointment = upcomingAppointments[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-28 md:pb-10">
      <SEO title="Patient Hub - Appointory" />

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 text-white flex items-center justify-center font-black text-base shadow-md shadow-teal-600/20">
              A
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-base tracking-tight">Appointory</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Smart Healthcare Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQrModal(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 text-xs font-black tracking-wide"
            >
              <QrCode size={15} className="text-teal-400" />
              <span>Digital Health Card</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Desktop Welcome Banner */}
        <div className="hidden md:flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Sparkles size={120} />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-teal-700 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles size={13} /> Personal Healthcare Hub
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back, {displayName}</h1>
            <p className="text-slate-400 text-sm font-semibold mt-1">Manage your consultations, digital vault, and instant clinic queue tokens.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/patient/book-appointment')}
              className="px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-teal-600/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus size={16} /> Book Appointment
            </button>
          </div>
        </div>

        {/* Standalone Mobile Summary */}
        <MobileSummary 
          patientData={patientData} 
          displayName={displayName} 
          navigate={navigate}
          onShowQr={() => setShowQrModal(true)}
        />

        {/* Tab Selector Pill (Home vs Appointments) */}
        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl max-w-sm mx-auto shadow-inner">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'home'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home size={14} /> Overview
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'appointments'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar size={14} /> Appointments ({appointments.length})
          </button>
        </div>

        {/* --- 4.1 Home / Dashboard View --- */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* HERO UPCOMING VISIT CARD */}
            {nextHeroAppointment ? (
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden border border-teal-500/30 group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/20 transition-all duration-500" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-500/40 rounded-full text-teal-300 text-xs font-black uppercase tracking-widest mb-2">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                      Next Scheduled Visit
                    </div>
                    <h3 className="text-xl md:text-2xl font-black tracking-tight text-white">
                      {nextHeroAppointment.clinicName || 'Clinic Appointment'}
                    </h3>
                    <p className="text-slate-300 text-xs md:text-sm font-semibold mt-1 flex items-center gap-2">
                      <Stethoscope size={15} className="text-teal-400" />
                      Dr. {nextHeroAppointment.doctorName || 'Consultant Specialist'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 bg-white/10 p-2.5 rounded-2xl border border-white/10">
                    <div className="px-3 py-1 bg-teal-500/30 text-teal-200 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={13} />
                      {nextHeroAppointment.appointmentDate ? new Date(nextHeroAppointment.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today'}
                    </div>
                    {nextHeroAppointment.tokenNumber && (
                      <div className="px-3 py-1 bg-emerald-500/30 text-emerald-200 rounded-xl font-black text-xs uppercase tracking-wider">
                        Token #{nextHeroAppointment.tokenNumber}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setSelectedAppointment(nextHeroAppointment)}
                    className="w-full sm:flex-1 py-3 px-5 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-teal-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>View Details & Queue Live</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => navigate('/patient/book-appointment')}
                    className="w-full sm:w-auto py-3 px-5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest rounded-2xl border border-white/15 transition-all"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-teal-900/90 via-slate-900 to-slate-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-teal-500/20 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center mx-auto shadow-inner">
                  <Calendar size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">No Active Appointments</h3>
                  <p className="text-slate-400 text-xs font-semibold mt-1">Book an instant clinic queue token or schedule your next specialist visit online.</p>
                </div>
                <button
                  onClick={() => navigate('/patient/book-appointment')}
                  className="py-3 px-6 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-teal-500/30 transition-all inline-flex items-center gap-2 active:scale-95"
                >
                  <Plus size={16} />
                  <span>Book Appointment Now</span>
                </button>
              </div>
            )}

            {/* QUICK ACTIONS GRID */}
            <div>
              <div className="flex justify-between items-center mb-3 px-1">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Quick Actions</h4>
                <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">4 Essential Tools</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <button
                  onClick={() => navigate('/patient/book-appointment')}
                  className="p-4 bg-white border border-slate-100 hover:border-teal-500/50 hover:shadow-xl hover:-translate-y-1 rounded-2xl flex flex-col items-start transition-all duration-300 group text-left shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all">
                    <Calendar size={22} />
                  </div>
                  <span className="text-sm font-black text-slate-900 group-hover:text-teal-600 transition-colors">Book Token</span>
                  <span className="text-[11px] font-bold text-slate-400 mt-0.5">Instant Queue Check-in</span>
                </button>

                <button
                  onClick={() => navigate('/patient/book-appointment')}
                  className="p-4 bg-white border border-slate-100 hover:border-teal-500/50 hover:shadow-xl hover:-translate-y-1 rounded-2xl flex flex-col items-start transition-all duration-300 group text-left shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all">
                    <Stethoscope size={22} />
                  </div>
                  <span className="text-sm font-black text-slate-900 group-hover:text-teal-600 transition-colors">Find Clinic</span>
                  <span className="text-[11px] font-bold text-slate-400 mt-0.5">Explore Nearby Doctors</span>
                </button>

                <button
                  onClick={() => navigate('/patient/health-locker')}
                  className="p-4 bg-white border border-slate-100 hover:border-teal-500/50 hover:shadow-xl hover:-translate-y-1 rounded-2xl flex flex-col items-start transition-all duration-300 group text-left shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all">
                    <Upload size={22} />
                  </div>
                  <span className="text-sm font-black text-slate-900 group-hover:text-teal-600 transition-colors">Upload Report</span>
                  <span className="text-[11px] font-bold text-slate-400 mt-0.5">Add Lab Files & Scans</span>
                </button>

                <button
                  onClick={() => navigate('/patient/health-locker')}
                  className="p-4 bg-white border border-slate-100 hover:border-teal-500/50 hover:shadow-xl hover:-translate-y-1 rounded-2xl flex flex-col items-start transition-all duration-300 group text-left shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all">
                    <FolderHeart size={22} />
                  </div>
                  <span className="text-sm font-black text-slate-900 group-hover:text-teal-600 transition-colors">Health Vault</span>
                  <span className="text-[11px] font-bold text-slate-400 mt-0.5">Prescriptions & History</span>
                </button>
              </div>
            </div>

            {/* RECENT ACTIVITY FEED */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Clinical Activity</h4>
                </div>
                <button onClick={() => navigate('/patient/health-locker')} className="text-xs font-black text-teal-600 hover:underline flex items-center gap-1">
                  <span>View All Records</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-2 shadow-sm divide-y divide-slate-100">
                {patientData?.visitHistory && patientData.visitHistory.length > 0 ? (
                  patientData.visitHistory.slice(0, 4).map((visit, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-2xl transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 font-black border border-teal-100">
                          <Activity size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">
                            {visit.clinicId?.name || visit.doctorName || 'Clinic Visit'}
                          </p>
                          <p className="text-xs font-bold text-slate-400 truncate mt-0.5">
                            {visit.diagnosis || visit.notes || 'Consultation Logged'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {visit.createdAt ? new Date(visit.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center space-y-2">
                    <Activity size={32} className="text-slate-300 mx-auto" />
                    <p className="text-sm font-black text-slate-700">No Recent Visits Logged</p>
                    <p className="text-xs font-bold text-slate-400">Your upcoming consultations and medical logs will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- 4.2 Appointments Screen View --- */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {/* Segment Switcher */}
            <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center max-w-sm mx-auto shadow-inner">
              <button
                onClick={() => setAppointmentSegment('upcoming')}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                  appointmentSegment === 'upcoming'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Upcoming ({upcomingAppointments.length})
              </button>
              <button
                onClick={() => setAppointmentSegment('past')}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                  appointmentSegment === 'past'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Past ({pastAppointments.length})
              </button>
            </div>

            {/* List of Appointment Cards */}
            <div className="space-y-3">
              {appointmentSegment === 'upcoming' ? (
                upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((apt, idx) => (
                    <AppointmentCard 
                      key={apt._id || idx} 
                      appointment={apt} 
                      onClick={(a) => setSelectedAppointment(a)} 
                    />
                  ))
                ) : (
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-4 shadow-sm">
                    <div className="w-14 h-14 bg-teal-50 rounded-2xl border border-teal-100 text-teal-600 flex items-center justify-center mx-auto">
                      <Calendar size={28} />
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-900">No Upcoming Appointments</p>
                      <p className="text-xs font-bold text-slate-400 mt-1">Select a doctor or clinic to book a token now.</p>
                    </div>
                    <button
                      onClick={() => navigate('/patient/book-appointment')}
                      className="py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all inline-flex items-center gap-2"
                    >
                      <Plus size={16} /> Book Token
                    </button>
                  </div>
                )
              ) : (
                pastAppointments.length > 0 ? (
                  pastAppointments.map((apt, idx) => (
                    <AppointmentCard 
                      key={apt._id || idx} 
                      appointment={{ ...apt, status: apt.status || 'Completed' }} 
                      onClick={(a) => setSelectedAppointment(a)} 
                    />
                  ))
                ) : (
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-2 shadow-sm">
                    <History size={32} className="text-slate-300 mx-auto" />
                    <p className="text-base font-black text-slate-900">No Past Appointments</p>
                    <p className="text-xs font-bold text-slate-400">Your completed consultation records will show here.</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </main>

      {/* Appointment Detail Bottom Sheet Modal */}
      {selectedAppointment && (
        <AppointmentDetailSheet
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onReschedule={() => {
            setSelectedAppointment(null);
            navigate('/patient/book-appointment');
          }}
          onCancel={() => {
            setSelectedAppointment(null);
            fetchProfile();
          }}
        />
      )}

      {/* Modern QR Health Card Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-teal-500/30 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 relative shadow-2xl text-white overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <ShieldCheck size={120} />
            </div>

            <button 
              onClick={() => setShowQrModal(false)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <X size={20} />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-500/30 mb-2">
                Verified Health Pass
              </div>
              <h3 className="text-xl font-black tracking-tight">Digital Identity QR</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Present this code at clinic reception for fast check-in</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-teal-500/40 inline-block shadow-xl shadow-teal-500/10">
              <QRCodeSVG value={JSON.stringify({ type: 'APPOINTORY_PATIENT', phone: patientData?.phone || '', name: patientData?.name || '' })} size={180} />
            </div>

            <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-left space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Name</span>
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Active</span>
              </div>
              <p className="text-sm font-black text-white">{displayName}</p>
              <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <span>Phone: {patientData?.phone || 'Registered'}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Patient Bottom Navigation */}
      <PatientBottomNav 
        activeTab={activeTab} 
        onTabChange={(t) => setActiveTab(t)} 
      />
    </div>
  );
};

export default PatientDashboard;