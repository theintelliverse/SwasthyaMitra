import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_URL, API_URL } from '../../config/runtime';
import {
  FileText, Clock, ExternalLink, LogOut,
  ShieldCheck, Activity, Search, Pill, X, Eye, Share2, Copy, Check, ChevronRight, RefreshCcw, FolderHeart, Calendar, Plus, Stethoscope, CheckCircle,
  Home, Users, History, User, Bell, Heart, Zap, Thermometer, Weight, Droplets, ArrowUpRight, QrCode, Upload, ArrowRight, Sparkles, MapPin, AlertCircle, Receipt,
  Sunrise, Sun, Moon, Utensils, Timer
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import SEO from '../../components/SEO';
import AppointmentCard from '../../components/patient/AppointmentCard';
import AppointmentDetailSheet from '../../components/patient/AppointmentDetailSheet';
import {
  categorizePrescriptions,
  getPrescriptionSchedule
} from '../../utils/medicationTracker';

const socket = SOCKET_URL ? io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true
}) : { on: () => { }, off: () => { }, emit: () => { } };

// Modern Mobile Patient Summary Header
const MobileSummary = ({ patientData, displayName, onShowQr }) => {
  const pulse = patientData?.vitals?.[0]?.pulseRate || patientData?.medicalHistory?.[0]?.vitals?.pulseRate || patientData?.visitHistory?.[0]?.vitals?.pulseRate || '--';
  const temp = patientData?.vitals?.[0]?.temperature || patientData?.medicalHistory?.[0]?.vitals?.temperature || patientData?.visitHistory?.[0]?.vitals?.temperature || '--';
  const weight = patientData?.vitals?.[0]?.weight || patientData?.medicalHistory?.[0]?.vitals?.weight || patientData?.visitHistory?.[0]?.vitals?.weight || '--';
  const bp = patientData?.vitals?.[0]?.bloodPressure || patientData?.medicalHistory?.[0]?.vitals?.bloodPressure || patientData?.visitHistory?.[0]?.vitals?.bloodPressure || '--';

  return (
    <div className="md:hidden space-y-3 mb-5">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-5 rounded-3xl text-white shadow-xl shadow-slate-900/15 relative overflow-hidden border border-teal-500/20">
        {/* Background glow effects */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-tr from-teal-400 to-emerald-400 text-slate-950 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg shadow-teal-500/30">
              {displayName.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-300">Verified Patient</p>
              <h2 className="text-base font-bold tracking-tight text-white">{displayName}</h2>
            </div>
          </div>
          <button
            onClick={onShowQr}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-teal-300 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
          >
            <QrCode size={15} />
            <span>Card</span>
          </button>
        </div>

        {/* Vitals Horizontal Bar */}
        <div className="relative z-10 grid grid-cols-4 gap-2 pt-3 border-t border-white/10 text-center">
          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] font-medium text-teal-300 uppercase tracking-wider">Pulse</p>
            <p className="font-bold text-white text-xs mt-0.5">{pulse}</p>
          </div>
          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] font-medium text-rose-300 uppercase tracking-wider">Temp</p>
            <p className="font-bold text-white text-xs mt-0.5">{temp}</p>
          </div>
          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] font-medium text-blue-300 uppercase tracking-wider">Weight</p>
            <p className="font-bold text-white text-xs mt-0.5">{weight}</p>
          </div>
          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] font-medium text-emerald-300 uppercase tracking-wider">BP</p>
            <p className="font-bold text-white text-xs mt-0.5">{bp}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'appointments' ? 'appointments' : 'home';

  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [appointmentSegment, setAppointmentSegment] = useState('upcoming'); // 'upcoming' | 'past'
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const handleTabSwitch = (newTab) => {
    if (newTab === 'appointments') {
      setSearchParams({ tab: 'appointments' });
    } else {
      setSearchParams({});
    }
  };

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

    const rawPhone = localStorage.getItem('userPhone') || patientData?.phone;
    const patientPhone = rawPhone ? rawPhone.toString().replace(/\D/g, '').slice(-10) : null;
    if (patientPhone) {
      if (!localStorage.getItem('userPhone')) {
        localStorage.setItem('userPhone', patientPhone);
      }
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
  }, [fetchProfile, patientData?.phone]);

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

  const prescriptionSummary = useMemo(() => {
    const history = patientData?.medicalHistory || patientData?.visitHistory || [];
    return categorizePrescriptions(history);
  }, [patientData]);

  const recentActivities = useMemo(() => {
    const list = [];

    // 1. Clinical visits from Medical History (from doctor/EHR)
    const history = patientData?.medicalHistory || patientData?.visitHistory || [];
    history.forEach((visit, idx) => {
      const schedule = getPrescriptionSchedule(visit);
      let badge = 'Medical Record';
      let badgeColor = 'bg-teal-50 text-teal-700 border-teal-200';
      if (visit.medicines?.length > 0) {
        if (schedule.isActive) {
          badge = `🟢 Active (Day ${schedule.currentDay}/${schedule.totalDays})`;
          badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        } else if (schedule.isCompleted) {
          badge = `✓ Completed (${schedule.totalDays}d)`;
          badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
        }
      }

      list.push({
        id: visit.visitId || visit._id || `visit-${idx}`,
        type: 'visit',
        title: visit.clinicName || visit.clinicId?.name || 'Clinic Consultation',
        doctorName: visit.doctorName || 'Consultant Specialist',
        subtitle: visit.diagnosis || visit.symptoms || visit.notes || 'Consultation Logged',
        date: visit.date || visit.createdAt || visit.visitDate,
        badge,
        badgeColor,
        raw: visit,
      });
    });

    // 2. Appointments / Consultations (Upcoming & Recent)
    (appointments || []).forEach((apt, idx) => {
      const isPast = apt.status === 'Completed' || apt.status === 'Cancelled' || new Date(apt.appointmentDate || apt.createdAt) < new Date();
      list.push({
        id: apt._id || `apt-${idx}`,
        type: 'appointment',
        title: apt.clinicName || apt.clinicId?.name || 'Clinic Consultation',
        doctorName: apt.doctorName || apt.doctorId?.name || 'Consultant Specialist',
        subtitle: apt.tokenNumber ? `Queue Token #${apt.tokenNumber}` : (apt.status || (isPast ? 'Completed' : 'Scheduled')),
        date: apt.appointmentDate || apt.createdAt,
        badge: apt.status || (isPast ? 'Completed' : 'Scheduled'),
        badgeColor: (apt.status === 'Completed' || isPast)
          ? 'bg-slate-100 text-slate-600 border-slate-200'
          : apt.status === 'Waiting'
            ? 'bg-teal-50 text-teal-700 border-teal-200'
            : apt.status === 'Cancelled'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        raw: apt,
      });
    });

    // 3. Billing Invoices & Receipts
    (patientData?.invoices || []).forEach((inv, idx) => {
      const isLab = inv.billingType === 'lab';
      list.push({
        id: inv._id || `inv-${idx}`,
        type: 'invoice',
        title: inv.clinicId?.name || inv.clinicName || (isLab ? 'Diagnostic Laboratory' : 'Clinic Facility'),
        doctorName: inv.doctorName ? `Dr. ${inv.doctorName}` : (isLab ? 'Lab Diagnostic' : 'Consultation'),
        subtitle: `Receipt #${inv.invoiceNumber} · ₹${(inv.totalAmount || 0).toLocaleString('en-IN')}`,
        date: inv.billingDate || inv.createdAt,
        badge: inv.paymentStatus || 'Paid',
        badgeColor: inv.paymentStatus === 'Paid'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : inv.paymentStatus === 'Partially Paid'
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-rose-50 text-rose-700 border-rose-200',
        raw: inv,
      });
    });

    // Sort descending by date (most recent first)
    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [patientData, appointments]);

  return (
    <div className="w-full text-slate-800 font-body">
      <SEO title="Patient Hub - Appointory" />

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center shadow-md shadow-teal-600/20 overflow-hidden border border-teal-500/20 shrink-0">
              <img src="/Appointory_logo.jpg" alt="Appointory Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm md:text-base tracking-tight">Appointory</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:block">Smart Healthcare Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile: icon-only compact QR button */}
            <button
              onClick={() => setShowQrModal(true)}
              className="sm:hidden p-2.5 bg-slate-900 hover:bg-slate-800 text-teal-400 rounded-xl transition-all shadow-md active:scale-95"
              aria-label="Digital Health Card"
            >
              <QrCode size={17} />
            </button>
            {/* Desktop: full button with text */}
            <button
              onClick={() => setShowQrModal(true)}
              className="hidden sm:flex px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-md active:scale-95 items-center gap-2 text-xs font-semibold"
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
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-teal-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles size={13} /> Personal Healthcare Hub
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back, {displayName}</h1>
            <p className="text-slate-500 text-sm font-normal mt-1">Manage your consultations, digital vault, and instant clinic queue tokens.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/patient/book-appointment')}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 active:scale-95"
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
            onClick={() => handleTabSwitch('home')}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'home'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <Home size={14} className={activeTab === 'home' ? 'text-teal-600' : ''} />
            <span>Overview</span>
          </button>
          <button
            onClick={() => handleTabSwitch('appointments')}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'appointments'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <Calendar size={14} className={activeTab === 'appointments' ? 'text-teal-600' : ''} />
            <span>Appointments ({appointments.length})</span>
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-500/40 rounded-full text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                      Next Scheduled Visit
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                      {nextHeroAppointment.clinicName || 'Clinic Appointment'}
                    </h3>
                    <p className="text-slate-300 text-xs md:text-sm font-medium mt-1 flex items-center gap-2">
                      <Stethoscope size={15} className="text-teal-400" />
                      Dr. {nextHeroAppointment.doctorName || 'Consultant Specialist'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 bg-white/10 p-2.5 rounded-2xl border border-white/10">
                    <div className="px-3 py-1 bg-teal-500/30 text-teal-200 rounded-xl font-semibold text-xs flex items-center gap-1.5">
                      <Clock size={13} />
                      {nextHeroAppointment.appointmentDate ? new Date(nextHeroAppointment.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today'}
                    </div>
                    {nextHeroAppointment.tokenNumber && (
                      <div className="px-3 py-1 bg-emerald-500/30 text-emerald-200 rounded-xl font-semibold text-xs">
                        Token #{nextHeroAppointment.tokenNumber}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setSelectedAppointment(nextHeroAppointment)}
                    className="w-full sm:flex-1 py-3 px-5 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>View Details &amp; Queue Live</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => navigate('/patient/book-appointment', { state: { rescheduleApp: nextHeroAppointment } })}
                    className="w-full sm:w-auto py-3 px-5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase tracking-wider rounded-xl border border-white/15 transition-all"
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
                  <h3 className="text-xl font-bold tracking-tight">No Active Appointments</h3>
                  <p className="text-slate-400 text-xs font-medium mt-1">Book an instant clinic queue token or schedule your next specialist visit online.</p>
                </div>
                <button
                  onClick={() => navigate('/patient/book-appointment')}
                  className="py-3 px-6 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-semibold text-xs rounded-2xl shadow-lg shadow-teal-500/30 transition-all inline-flex items-center gap-2 active:scale-95"
                >
                  <Plus size={16} />
                  <span>Book Appointment Now</span>
                </button>
              </div>
            )}

            {/* ACTIVE MEDICATION SCHEDULE (DAY-WISE DURATION TRACKER) */}
            {prescriptionSummary.activePrescriptions.length > 0 && (
              <div className="bg-gradient-to-br from-white via-white to-teal-50/40 rounded-3xl border-2 border-teal-500/35 p-5 md:p-6 shadow-xl shadow-teal-900/5 relative overflow-hidden space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30 shrink-0">
                      <Pill size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
                          Active Medication Schedule
                        </h3>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>{prescriptionSummary.activeCount} Ongoing Course{prescriptionSummary.activeCount > 1 ? 's' : ''}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Day-wise medication course prescribed by your doctor. Automatically ends once duration concludes.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/patient/health-locker?tab=medicine')}
                    className="self-start sm:self-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <span>View Prescriptions</span>
                    <ArrowRight size={13} className="text-teal-400" />
                  </button>
                </div>

                {/* Active Courses Cards */}
                <div className="space-y-3">
                  {prescriptionSummary.activePrescriptions.map((record, rIdx) => {
                    const schedule = record.schedule;
                    return (
                      <div
                        key={record.uniqueKey || rIdx}
                        className="bg-white/95 rounded-2xl border border-teal-100 p-4 shadow-xs hover:border-teal-300 transition-all space-y-3"
                      >
                        {/* Course Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-xs flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              Day {schedule.currentDay} of {schedule.totalDays}
                            </span>
                            <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                              ⏱️ {schedule.remainingDays} Day{schedule.remainingDays > 1 ? 's' : ''} Remaining
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-slate-700">
                            Dr. {record.doctorName} <span className="text-slate-400 font-normal">({record.clinicName})</span>
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                            <span className="text-teal-700">Course Progress: {schedule.progressPercent}%</span>
                            <span className="text-slate-400 font-normal">
                              Ends {new Date(schedule.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-700"
                              style={{ width: `${Math.max(5, schedule.progressPercent)}%` }}
                            />
                          </div>
                        </div>

                        {/* Prescribed Medicines to Take Today */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                          {(schedule.medicinesSchedule || []).map((med, mIdx) => (
                            <div
                              key={mIdx}
                              className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 hover:bg-white hover:border-teal-200 transition-all space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <h5 className="font-bold text-slate-900 text-xs truncate">
                                  {med.name}
                                </h5>
                                {med.strength && (
                                  <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                                    {med.strength}
                                  </span>
                                )}
                              </div>

                              {/* Timing Badges */}
                              <div className="flex flex-wrap items-center gap-1">
                                {(med.timingSlots || []).map((slot, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 shadow-2xs"
                                  >
                                    {slot.id === 'morning' ? (
                                      <Sunrise size={10} className="text-amber-500" />
                                    ) : slot.id === 'afternoon' ? (
                                      <Sun size={10} className="text-orange-500" />
                                    ) : slot.id === 'night' ? (
                                      <Moon size={10} className="text-indigo-500" />
                                    ) : (
                                      <Clock size={10} className="text-teal-600" />
                                    )}
                                    <span>{slot.label}</span>
                                  </span>
                                ))}
                                {med.beforeAfter && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded border border-teal-100">
                                    <Utensils size={9} />
                                    <span>{med.beforeAfter}</span>
                                  </span>
                                )}
                              </div>

                              {med.instructions && (
                                <p className="text-[11px] text-slate-500 italic truncate">
                                  "{med.instructions}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUICK ACTIONS GRID */}
            <div>
              <div className="flex justify-between items-center mb-3 px-1">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Actions</h4>
                <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">5 Essential Tools</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                <button
                  onClick={() => navigate('/patient/book-appointment')}
                  className="p-4 bg-white border border-slate-200/80 hover:border-teal-500/50 hover:shadow-lg rounded-2xl flex flex-col items-start transition-all group text-left shadow-sm"
                >
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all">
                    <Calendar size={20} />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">Book Token</span>
                  <span className="text-xs text-slate-400 font-normal mt-0.5">Instant Queue Check-in</span>
                </button>

                <button
                  onClick={() => navigate('/patient/book-appointment')}
                  className="p-4 bg-white border border-slate-200/80 hover:border-teal-500/50 hover:shadow-lg rounded-2xl flex flex-col items-start transition-all group text-left shadow-sm"
                >
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all">
                    <Stethoscope size={20} />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">Find Clinic</span>
                  <span className="text-xs text-slate-400 font-normal mt-0.5">Explore Nearby Doctors</span>
                </button>

                <button
                  onClick={() => navigate('/patient/health-locker?action=upload')}
                  className="p-4 bg-white border border-slate-200/80 hover:border-teal-500/50 hover:shadow-lg rounded-2xl flex flex-col items-start transition-all group text-left shadow-sm"
                >
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all">
                    <Upload size={20} />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">Upload Report</span>
                  <span className="text-xs text-slate-400 font-normal mt-0.5">Add Lab Files &amp; Scans</span>
                </button>

                <button
                  onClick={() => navigate('/patient/health-locker')}
                  className="p-4 bg-white border border-slate-200/80 hover:border-teal-500/50 hover:shadow-lg rounded-2xl flex flex-col items-start transition-all group text-left shadow-sm"
                >
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all">
                    <FolderHeart size={20} />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">Health Vault</span>
                  <span className="text-xs text-slate-400 font-normal mt-0.5">Prescriptions &amp; History</span>
                </button>

                <button
                  onClick={() => navigate('/patient/health-locker?tab=bills')}
                  className="p-4 bg-white border border-slate-200/80 hover:border-teal-500/50 hover:shadow-lg rounded-2xl flex flex-col items-start transition-all group text-left shadow-sm col-span-2 sm:col-span-1"
                >
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all">
                    <Receipt size={20} />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">Bills &amp; Receipts</span>
                  <span className="text-xs text-slate-400 font-normal mt-0.5">Payment Invoices &amp; Dues</span>
                </button>
              </div>
            </div>

            {/* RECENT ACTIVITY FEED */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Consultations &amp; Records</h4>
                </div>
                <div className="flex items-center gap-3">
                  {appointments.length > 0 && (
                    <button
                      onClick={() => handleTabSwitch('appointments')}
                      className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1"
                    >
                      <span>Appointments ({appointments.length})</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/patient/health-locker')}
                    className="text-xs font-semibold text-slate-500 hover:text-teal-600 hover:underline flex items-center gap-1"
                  >
                    <span>Health Vault</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-2 shadow-sm divide-y divide-slate-100">
                {recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      onClick={() => {
                        if (item.type === 'appointment') {
                          setSelectedAppointment(item.raw);
                        } else if (item.type === 'invoice') {
                          navigate('/patient/health-locker?tab=bills');
                        } else {
                          navigate('/patient/health-locker?tab=medicine');
                        }
                      }}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center shrink-0 border border-teal-100 transition-all">
                          {item.type === 'appointment' ? <Calendar size={18} /> : item.type === 'invoice' ? <Receipt size={18} /> : <Activity size={18} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-teal-600 transition-colors">
                              {item.title}
                            </p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-xs font-normal text-slate-500 truncate mt-0.5">
                            Dr. {item.doctorName} • {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                        </span>
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center space-y-2">
                    <Activity size={32} className="text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No Recent Visits Logged</p>
                    <p className="text-xs text-slate-400 font-normal">Your upcoming consultations and medical logs will appear here.</p>
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
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all ${appointmentSegment === 'upcoming'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Upcoming ({upcomingAppointments.length})
              </button>
              <button
                onClick={() => setAppointmentSegment('past')}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all ${appointmentSegment === 'past'
                    ? 'bg-white text-slate-900 shadow-sm'
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
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-4 shadow-sm">
                    <div className="w-14 h-14 bg-teal-50 rounded-2xl border border-teal-100 text-teal-600 flex items-center justify-center mx-auto">
                      <Calendar size={28} />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900">No Upcoming Appointments</p>
                      <p className="text-xs text-slate-500 mt-1">Select a doctor or clinic to book a token now.</p>
                    </div>
                    <button
                      onClick={() => navigate('/patient/book-appointment')}
                      className="py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-teal-600/20 active:scale-95 transition-all inline-flex items-center gap-2"
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
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-2 shadow-sm">
                    <History size={32} className="text-slate-300 mx-auto" />
                    <p className="text-base font-bold text-slate-900">No Past Appointments</p>
                    <p className="text-xs text-slate-500">Your completed consultation records will show here.</p>
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
          onReschedule={(apt) => {
            const targetApt = apt || selectedAppointment;
            setSelectedAppointment(null);
            navigate('/patient/book-appointment', { state: { rescheduleApp: targetApt } });
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-teal-500/30 mb-2">
                Verified Health Pass
              </div>
              <h3 className="text-xl font-bold tracking-tight">Digital Identity QR</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Present this code at clinic reception for fast check-in</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-teal-500/40 inline-block shadow-xl shadow-teal-500/10">
              <QRCodeSVG value={JSON.stringify({ type: 'APPOINTORY_PATIENT', phone: patientData?.phone || '', name: patientData?.name || '' })} size={180} />
            </div>

            <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-left space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-400">Patient Name</span>
                <span className="text-xs font-semibold text-teal-400">Active</span>
              </div>
              <p className="text-sm font-bold text-white">{displayName}</p>
              <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <span>Phone: {patientData?.phone || 'Registered'}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;