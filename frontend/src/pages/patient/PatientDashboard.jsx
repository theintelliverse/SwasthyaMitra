import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_URL, API_URL } from '../../config/runtime';
import {
  FileText, Clock, ExternalLink, LogOut,
  ShieldCheck, Activity, Search, Pill, X, Eye, Share2, Copy, Check, ChevronRight, RefreshCcw, FolderHeart, Calendar, Plus, Stethoscope, CheckCircle,
  Home, Users, History, User, Bell, Heart, Zap, Thermometer, Weight, Droplets, ArrowUpRight, QrCode, Upload, ArrowRight
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

// Standalone Mobile Summary Component (Declared outside render to prevent React Compiler state reset)
const MobileSummary = ({ patientData, displayName, navigate }) => {
  const pulse = patientData?.vitals?.[0]?.pulseRate || patientData?.visitHistory?.[0]?.vitals?.pulseRate || '--';
  const temp = patientData?.vitals?.[0]?.temperature || patientData?.visitHistory?.[0]?.vitals?.temperature || '--';
  const weight = patientData?.vitals?.[0]?.weight || patientData?.visitHistory?.[0]?.vitals?.weight || '--';
  const bp = patientData?.vitals?.[0]?.bloodPressure || patientData?.visitHistory?.[0]?.vitals?.bloodPressure || '--';

  return (
    <div className="md:hidden space-y-4 mb-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-slate-900">Hello, {displayName.split(' ')[0]} 👋</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Your health vault & appointments hub.</p>
          </div>
          <button 
            onClick={() => navigate('/patient/health-locker')} 
            className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Digital Vault
          </button>
        </div>

        <div className="mt-3.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Patient Name</p>
              <p className="font-semibold text-slate-900 text-sm mt-0.5">{displayName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Mobile</p>
              <p className="font-semibold text-slate-900 text-sm mt-0.5">{patientData?.phone || 'Registered'}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-medium">Pulse</p>
            <p className="font-bold text-slate-900 text-xs mt-0.5">{pulse}</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-medium">Temp</p>
            <p className="font-bold text-slate-900 text-xs mt-0.5">{temp}</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-medium">Weight</p>
            <p className="font-bold text-slate-900 text-xs mt-0.5">{weight}</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-medium">BP</p>
            <p className="font-bold text-slate-900 text-xs mt-0.5">{bp}</p>
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
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab); // 'home' | 'appointments'
  const [appointmentSegment, setAppointmentSegment] = useState('upcoming'); // 'upcoming' | 'past'
  const [selectedAppointment, setSelectedAppointment] = useState(null);

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
    } catch (err) {
      console.error("❌ Vault Access Error:", err.response?.data || err.message);
      if (err.response?.status === 401) navigate('/patient/login');
    } finally {
      setLoading(false);
      setTimeout(() => setIsSyncing(false), 1000);
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
      socket.on('queueUpdate', () => fetchProfile(true));
    }

    const visitPollInterval = setInterval(() => {
      fetchProfile(true);
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-safe">
      <SEO title="Appointory - Patient Mobile Hub" />

      {/* Context Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
            A
          </div>
          <span className="font-bold text-slate-900 text-base tracking-tight">Appointory</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="p-2 text-slate-600 hover:text-teal-700 bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <QrCode size={16} />
            <span className="hidden sm:inline">Health Card</span>
          </button>
        </div>
      </header>

      <main className="max-w-md md:max-w-4xl mx-auto px-4 py-5 space-y-6">
        {/* Standalone Mobile Patient Summary */}
        <MobileSummary patientData={patientData} displayName={displayName} navigate={navigate} />

        {/* --- 4.1 Home / Dashboard View --- */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Spec 4.1: Greeting + Next Upcoming Appointment Hero Card */}
            {nextHeroAppointment ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100 uppercase tracking-wider">
                    Next Upcoming Visit
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {new Date(nextHeroAppointment.appointmentDate || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {nextHeroAppointment.clinicName || 'Clinic Appointment'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Dr. {nextHeroAppointment.doctorName || 'Abhishek Rao'} • General Medicine
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedAppointment(nextHeroAppointment)}
                    className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors text-center shadow-sm"
                  >
                    View Details / Join
                  </button>
                  <button
                    onClick={() => navigate('/patient/book-appointment')}
                    className="py-2.5 px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
                  <Calendar size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">No Upcoming Appointment</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Book a token online or find a clinic near you.</p>
                </div>
                <button
                  onClick={() => navigate('/patient/book-appointment')}
                  className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={16} />
                  <span>Book Appointment</span>
                </button>
              </div>
            )}

            {/* Spec 4.1: Quick Actions Row (Icon + Label, 12px cards) */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 px-1">Quick Actions</h4>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => navigate('/patient/book-appointment')}
                  className="p-3.5 bg-white border border-slate-200 hover:border-teal-500/50 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-all active:scale-95 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Calendar size={20} />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 leading-tight">Book Token</span>
                </button>

                <button
                  onClick={() => navigate('/patient/book-appointment')}
                  className="p-3.5 bg-white border border-slate-200 hover:border-teal-500/50 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-all active:scale-95 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Stethoscope size={20} />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 leading-tight">Find Clinic</span>
                </button>

                <button
                  onClick={() => navigate('/patient/health-locker')}
                  className="p-3.5 bg-white border border-slate-200 hover:border-teal-500/50 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-all active:scale-95 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload size={20} />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 leading-tight">Upload Report</span>
                </button>
              </div>
            </div>

            {/* Spec 4.1: Recent Activity Feed (Minimal list rows, not heavy cards) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Activity</h4>
                <button onClick={() => navigate('/patient/health-locker')} className="text-xs font-semibold text-teal-700 hover:underline">
                  View Vault
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {patientData?.visitHistory && patientData.visitHistory.length > 0 ? (
                  patientData.visitHistory.slice(0, 4).map((visit, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 text-teal-700 flex items-center justify-center flex-shrink-0 font-bold">
                          <Activity size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {visit.clinicId?.name || visit.doctorName || 'Clinic Visit'}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            {visit.diagnosis || visit.notes || 'Consultation Record'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium flex-shrink-0">
                        {new Date(visit.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 font-medium">
                    No recent activity. Book an appointment to get started.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- 4.2 Appointments Screen View --- */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {/* Spec 4.2: Segmented Control (Upcoming / Past) */}
            <div className="bg-slate-200/70 p-1 rounded-xl flex items-center">
              <button
                onClick={() => setAppointmentSegment('upcoming')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  appointmentSegment === 'upcoming'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upcoming ({upcomingAppointments.length})
              </button>
              <button
                onClick={() => setAppointmentSegment('past')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  appointmentSegment === 'past'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
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
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
                    <Calendar size={32} className="text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No upcoming appointments</p>
                    <button
                      onClick={() => navigate('/patient/book-appointment')}
                      className="py-2 px-4 bg-teal-600 text-white font-semibold text-xs rounded-lg shadow-sm"
                    >
                      Book Now
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
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
                    <History size={32} className="text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No past visits recorded</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </main>

      {/* Spec 4.2 Detail Bottom Sheet Modal */}
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
            fetchProfile(true);
          }}
        />
      )}

      {/* QR Health Card Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 relative shadow-2xl">
            <button 
              onClick={() => setShowQrModal(false)} 
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-slate-900">Digital Health QR</h3>
            <p className="text-xs text-slate-500 font-medium">Show this QR at reception for instant check-in</p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 inline-block">
              <QRCodeSVG value={patientData?.phone || 'SW-PATIENT'} size={180} />
            </div>

            <p className="text-sm font-bold text-slate-900">{displayName}</p>
          </div>
        </div>
      )}

      {/* Spec 3: Bottom Navigation Bar */}
      <PatientBottomNav 
        activeTab={activeTab} 
        onTabChange={(t) => setActiveTab(t)} 
      />
    </div>
  );
};

export default PatientDashboard;