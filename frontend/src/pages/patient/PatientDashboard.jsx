import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import {
  FileText, Clock, ExternalLink, LogOut,
  ShieldCheck, Activity, Search, Building2, Pill, X, Eye, Share2, Copy, Check, ChevronRight, RefreshCw, RefreshCcw, FolderHeart, Calendar, Plus, Stethoscope, CheckCircle
} from 'lucide-react';
import Footer from '../../components/Footer';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVisit, setSelectedVisit] = useState(null);
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
      setLastVisitUpdate(Date.now()); // Update timestamp for Recent Visits
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

    // 🔄 Auto-refresh Recent Visits every 10 seconds for live updates
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

  // 🔑 FIX 1: Accessing correct DB fields for Name and Counters
  const displayName = patientData?.name || "User";

  // 🔑 FIX 2: Ensuring the Reports count looks at 'documents'
  const reportsCount = patientData?.documents?.length || 0;

  const filteredHistory = patientData?.visitHistory?.filter(visit =>
    visit.clinicId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center">
      <RefreshCw size={40} className="text-marigold animate-spin mb-4" />
      <p className="font-heading text-teak">Unlocking Health Vault...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-parchment font-body text-teak flex flex-col">
      <nav className="bg-white border-b border-sandstone px-6 py-4 sticky top-0 z-30 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-marigold rounded-xl flex items-center justify-center text-white font-heading text-xl shadow-md cursor-pointer" onClick={() => fetchProfile(true)}>S</div>
          <div>
            <h1 className="font-heading text-lg leading-none">Appointory Locker</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-marigold animate-ping' : 'bg-green-500'}`}></div>
              <p className="text-[8px] font-black text-khaki uppercase tracking-widest">Live Security Active</p>
            </div>
          </div>
        </div>
        <button onClick={() => { localStorage.clear(); navigate('/patient/login'); }} className="text-[10px] font-black uppercase text-khaki hover:text-red-500 transition-colors flex items-center gap-2">
          <LogOut size={14} /> Logout
        </button>
      </nav>

      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-10">
        <header className="bg-teak text-parchment p-10 rounded-[3rem] shadow-xl mb-12 flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
          <div className="relative z-10 text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-saffron mb-3">Verified Patient Profile</p>
            <h2 className="text-5xl font-heading mb-4 capitalize">{displayName}</h2>
          </div>

          <button
            onClick={() => navigate('/Patient/HealthLocker')}
            className="mt-8 md:mt-0 relative z-10 flex items-center gap-3  bg-marigold hover:bg-saffron text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 group"
          >
            <FolderHeart size={18} className="group-hover:animate-bounce" />
            Open Full Health Locker
            <ChevronRight size={16} />
          </button>

          <ShieldCheck size={100} className="text-marigold opacity-10 absolute right-10 bottom-[-20px] md:bottom-auto" />
        </header>

        <div className="grid lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1 space-y-8">
            {/* Enhanced Consultations Card */}
            <div className="bg-white border border-sandstone rounded-[3rem] shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 px-8 py-6 border-b border-sandstone/30">
                <h3 className="font-heading text-xl text-teak mb-2 flex items-center gap-2">
                  <Stethoscope size={20} className="text-marigold" />
                  Consultations
                </h3>
                <p className="text-[8px] font-black text-khaki uppercase tracking-widest">Medical Visit History</p>
              </div>

              {/* Content */}
              <div className="p-8">
                {patientData?.visitHistory && patientData.visitHistory.length > 0 ? (
                  <>
                    {/* Big Number Display */}
                    <div className="mb-6 p-6 bg-gradient-to-br from-marigold/10 to-saffron/10 rounded-2xl border-2 border-marigold/30">
                      <p className="text-[9px] font-black text-marigold uppercase tracking-wider mb-2">Total Consultations</p>
                      <p className="font-heading text-5xl text-teak mb-1">{patientData.visitHistory.length}</p>
                      <p className="text-[8px] text-khaki font-bold">Medical visits recorded</p>
                    </div>

                    {/* Recent Consultation */}
                    {(() => {
                      const latestConsult = patientData.visitHistory.sort((a, b) => 
                        new Date(b.date || b.visitDate) - new Date(a.date || a.visitDate)
                      )[0];
                      
                      return (
                        <div className="bg-parchment p-4 rounded-2xl border border-sandstone/50 mb-4">
                          <p className="text-[8px] font-black text-khaki uppercase tracking-wider mb-3">📅 Latest Visit</p>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="text-[8px] font-black text-marigold uppercase">Doctor:</span>
                              <span className="text-sm font-bold text-teak">Dr. {latestConsult.doctorName || 'N/A'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-[8px] font-black text-marigold uppercase">Date:</span>
                              <span className="text-sm font-bold text-teak">{new Date(latestConsult.date || latestConsult.visitDate).toLocaleDateString('en-IN')}</span>
                            </div>
                            {latestConsult.clinicName && (
                              <div className="flex items-start gap-2">
                                <span className="text-[8px] font-black text-marigold uppercase">Clinic:</span>
                                <span className="text-sm font-bold text-teak">{latestConsult.clinicName}</span>
                              </div>
                            )}
                            {latestConsult.diagnosis && (
                              <div className="flex items-start gap-2 mt-3 pt-3 border-t border-sandstone/30">
                                <span className="text-[8px] font-black text-khaki uppercase">Diagnosis:</span>
                                <span className="text-[13px] font-bold text-teak line-clamp-2">{latestConsult.diagnosis}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                        <p className="text-[7px] font-black text-khaki uppercase mb-1">Avg Per Year</p>
                        <p className="font-heading text-lg text-teak">{(patientData.visitHistory.length / 1).toFixed(1)}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                        <p className="text-[7px] font-black text-khaki uppercase mb-1">Last 90 Days</p>
                        <p className="font-heading text-lg text-teak">
                          {patientData.visitHistory.filter(v => {
                            const visitDate = new Date(v.date || v.visitDate);
                            const ninetyDaysAgo = new Date();
                            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                            return visitDate >= ninetyDaysAgo;
                          }).length}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Stethoscope size={40} className="text-marigold opacity-20 mx-auto mb-3" />
                    <p className="font-heading text-lg text-khaki mb-1">No Consultations Yet</p>
                    <p className="text-[9px] text-khaki opacity-60 mb-4">Schedule an appointment to get started</p>
                    <button 
                      onClick={() => navigate('/patient/book-appointment')}
                      className="text-[8px] font-black bg-teak text-white px-4 py-2 rounded-xl uppercase tracking-wider hover:bg-marigold transition-all"
                    >
                      Book Appointment
                    </button>
                  </div>
                )}
              </div>

              {/* Footer Button */}
              {patientData?.visitHistory && patientData.visitHistory.length > 0 && (
                <div className="border-t border-sandstone/30 px-8 py-4 bg-parchment/30">
                  <button 
                    onClick={() => document.querySelector('.Latest Visit')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full text-center text-[10px] font-black text-marigold uppercase tracking-widest hover:text-teak transition-colors"
                  >
                    View Full History →
                  </button>
                </div>
              )}
            </div>

            {/* Reports Mini Card */}
            <div className="bg-white border border-sandstone p-8 rounded-[3rem] shadow-sm">
              <h3 className="font-heading text-xl mb-6 flex items-center gap-2"><FileText className="text-marigold" size={20} /> Reports</h3>
              <VitalMini label="Medical Files" val={reportsCount} unit="Documents" />
            </div>
            <div className="bg-white border border-sandstone p-8 rounded-[3rem] shadow-sm sticky top-32">
              <h3 className="font-heading text-lg mb-4">Quick Find</h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-khaki" size={16} />
                <input
                  type="text" placeholder="Search diagnosis..."
                  className="w-full pl-11 pr-4 py-3 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold text-sm font-bold"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-8">
            {/* Appointments Section */}
            {appointments && appointments.length > 0 && appointments.some(app => app.status === 'Scheduled' && new Date(app.appointmentDate) > new Date()) && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-heading text-3xl flex items-center gap-2">
                    <Calendar size={28} className="text-marigold" />
                    Upcoming Appointments
                  </h3>
                  <button
                    onClick={() => navigate('/patient/book-appointment')}
                    className="flex items-center gap-2 px-4 py-2 bg-marigold text-white rounded-xl text-sm font-bold hover:bg-saffron transition-all"
                  >
                    <Plus size={16} />
                    Book Now
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {appointments
                    .filter(app => {
                      // ✅ Filter 1: Only show Scheduled appointments (not Completed, Cancelled, etc.)
                      if (app.status !== 'Scheduled') return false;
                      
                      // ✅ Filter 2: Only show future appointments (not past dates)
                      const appointmentTime = new Date(app.appointmentDate);
                      const now = new Date();
                      if (appointmentTime <= now) return false;
                      
                      return true;
                    })
                    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
                    .slice(0, 2)
                    .map((appointment) => (
                      <div
                        key={appointment._id}
                        className="bg-white p-6 rounded-2xl border border-marigold/30 hover:border-marigold shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3">
                            <Stethoscope size={24} className="text-marigold mt-1" />
                            <div>
                              <h4 className="font-bold text-teak">Dr. {appointment.doctorName}</h4>
                              <p className="text-xs text-khaki">{appointment.clinicName}</p>
                            </div>
                          </div>
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold">
                            Scheduled
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-teak">
                          <Clock size={14} className="text-marigold" />
                          {new Date(appointment.appointmentDate).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Book Appointment CTA */}
            {(!appointments || appointments.length === 0 || !appointments.some(app => app.status === 'Scheduled' && new Date(app.appointmentDate) > new Date())) && (
              <div className="bg-gradient-to-r from-marigold/10 to-saffron/10 p-8 rounded-[2rem] border border-marigold/30 text-center">
                <Calendar size={40} className="text-marigold mx-auto mb-4" />
                <h3 className="font-heading text-2xl text-teak mb-2">No Appointments Yet</h3>
                <p className="text-khaki mb-6">Book your appointment with a doctor at your preferred clinic</p>
                <button
                  onClick={() => navigate('/patient/book-appointment')}
                  className="inline-flex items-center gap-2 px-6 py-4 bg-marigold text-white rounded-2xl font-bold hover:bg-saffron transition-all"
                >
                  <Plus size={18} />
                  Book Appointment
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <h3 className="font-heading text-3xl text-teak">Latest Visit</h3>
              <button onClick={() => fetchProfile(true)} className="p-3 bg-white border border-sandstone rounded-2xl text-khaki hover:text-marigold transition-all hover:border-marigold">
                <RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''} />
              </button>
            </div>

            {filteredHistory.length > 0 ? (
              <div className="space-y-6">
                {(() => {
                  const latestVisit = filteredHistory
                    .sort((a, b) => new Date(b.date || b.visitDate) - new Date(a.date || a.visitDate))[0];
                  
                  if (!latestVisit) return null;
                  
                  const allDocs = patientData?.documents || patientData?.digitalLocker || [];
                  const visitReports = allDocs.filter(doc => doc.visitId === (latestVisit.visitId || latestVisit._id));

                  return (
                    <div key={latestVisit._id} className="bg-white p-6 md:p-8 rounded-xl md:rounded-2xl border border-sandstone shadow-sm hover:border-marigold transition-all">
                      {/* Header with Clinic & Date */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                        <div>
                          <h3 className="font-heading text-lg md:text-xl text-teak flex items-center gap-2 mb-2">
                            <Pill size={20} className="text-marigold flex-shrink-0" />
                            Latest Medical Visit
                          </h3>
                          <p className="text-[8px] md:text-[9px] font-black text-khaki uppercase tracking-wider md:tracking-widest">{latestVisit.clinicName}</p>
                        </div>
                        <span className="text-[8px] md:text-[9px] font-bold text-marigold bg-marigold/10 px-4 py-2 rounded-full flex items-center gap-2 flex-shrink-0">
                          <Calendar size={12} /> {new Date(latestVisit.date || latestVisit.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </span>
                      </div>

                      {/* Prescription Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                        <div className="p-4 md:p-5 bg-parchment rounded-lg md:rounded-2xl border border-sandstone/50">
                          <p className="text-[8px] md:text-[9px] font-black text-khaki uppercase tracking-wider md:tracking-widest mb-2">👨‍⚕️ Doctor</p>
                          <p className="font-bold text-base md:text-lg text-teak">Dr. {latestVisit.doctorName || latestVisit.doctorId?.name}</p>
                        </div>
                        <div className="p-4 md:p-5 bg-parchment rounded-lg md:rounded-2xl border border-sandstone/50">
                          <p className="text-[8px] md:text-[9px] font-black text-khaki uppercase tracking-wider md:tracking-widest mb-2">🔍 Diagnosis</p>
                          <p className="font-bold text-base md:text-lg text-teak">{latestVisit.diagnosis || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Symptoms */}
                      {latestVisit.symptoms && (
                        <div className="mb-6 p-4 md:p-5 bg-parchment rounded-lg md:rounded-2xl border border-sandstone/50">
                          <p className="text-[8px] md:text-[9px] font-black text-khaki uppercase tracking-wider md:tracking-widest mb-3">🩹 Symptoms</p>
                          <p className="text-sm md:text-base text-teak leading-relaxed whitespace-pre-wrap">{latestVisit.symptoms}</p>
                        </div>
                      )}

                      {/* Vitals Display */}
                      {latestVisit.vitals && Object.keys(latestVisit.vitals).some(k => latestVisit.vitals[k]) && (
                        <div className="mb-6 p-4 md:p-5 bg-parchment rounded-lg md:rounded-2xl border border-sandstone/50">
                          <p className="text-[8px] md:text-[9px] font-black text-khaki uppercase tracking-wider md:tracking-widest mb-4">📊 Vitals Recorded</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {latestVisit.vitals.bloodPressure && (
                              <div className="bg-white p-3 rounded-lg border border-sandstone/50 text-center">
                                <p className="text-[7px] md:text-[8px] font-bold text-khaki uppercase mb-1">BP</p>
                                <p className="font-bold text-sm md:text-base text-teak">{latestVisit.vitals.bloodPressure}</p>
                              </div>
                            )}
                            {latestVisit.vitals.pulseRate && (
                              <div className="bg-white p-3 rounded-lg border border-sandstone/50 text-center">
                                <p className="text-[7px] md:text-[8px] font-bold text-khaki uppercase mb-1">Pulse</p>
                                <p className="font-bold text-sm md:text-base text-teak">{latestVisit.vitals.pulseRate} bpm</p>
                              </div>
                            )}
                            {latestVisit.vitals.temperature && (
                              <div className="bg-white p-3 rounded-lg border border-sandstone/50 text-center">
                                <p className="text-[7px] md:text-[8px] font-bold text-khaki uppercase mb-1">Temp</p>
                                <p className="font-bold text-sm md:text-base text-teak">{latestVisit.vitals.temperature}°C</p>
                              </div>
                            )}
                            {latestVisit.vitals.weight && (
                              <div className="bg-white p-3 rounded-lg border border-sandstone/50 text-center">
                                <p className="text-[7px] md:text-[8px] font-bold text-khaki uppercase mb-1">Weight</p>
                                <p className="font-bold text-sm md:text-base text-teak">{latestVisit.vitals.weight} kg</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Medicine Details - Highlighted Box */}
                      {latestVisit.medicines && Array.isArray(latestVisit.medicines) && latestVisit.medicines.filter(m => m.name || m.amount).length > 0 ? (
                        <div className="p-4 md:p-6 bg-yellow-50 rounded-lg md:rounded-2xl border-2 border-yellow-200 mb-6">
                          <h4 className="font-heading text-base md:text-lg text-teak mb-4 flex items-center gap-2">
                            <Pill size={18} className="text-marigold flex-shrink-0" />
                            <span className="text-xs md:text-sm">Medicine Details</span>
                          </h4>
                          <div className="space-y-3 md:space-y-4">
                            {latestVisit.medicines.map((med, mIdx) => (
                              (med.name || med.amount || med.time || med.total) && (
                                <div key={mIdx} className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border-2 border-yellow-200 shadow-sm">
                                  {/* Medicine Name Header */}
                                  <div className="mb-3 pb-3 border-b border-yellow-100">
                                    <p className="text-[7px] md:text-[8px] font-black text-marigold uppercase tracking-wider mb-1">💊 Medicine #{mIdx + 1}</p>
                                    <p className="font-bold text-sm md:text-base text-teak">{med.name || 'N/A'}</p>
                                  </div>

                                  {/* Time, Dosage, Total Grid */}
                                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-3">
                                    {/* Time */}
                                    {med.time && (
                                      <div className="bg-orange-50 p-2.5 md:p-3 rounded-lg border border-orange-200">
                                        <p className="text-[7px] md:text-[8px] font-black text-khaki uppercase tracking-wider mb-1">🕐 Time</p>
                                        <p className="font-bold text-xs md:text-sm text-teak">{med.time}</p>
                                      </div>
                                    )}

                                    {/* Per Dose Amount */}
                                    {med.amount && (
                                      <div className="bg-blue-50 p-2.5 md:p-3 rounded-lg border border-blue-200">
                                        <p className="text-[7px] md:text-[8px] font-black text-khaki uppercase tracking-wider mb-1">Per Dose</p>
                                        <p className="font-bold text-xs md:text-sm text-teak">{med.amount}</p>
                                      </div>
                                    )}

                                    {/* Total Quantity */}
                                    {med.total && (
                                      <div className="bg-green-50 p-2.5 md:p-3 rounded-lg border border-green-200 col-span-2 md:col-span-1">
                                        <p className="text-[7px] md:text-[8px] font-black text-khaki uppercase tracking-wider mb-1">📦 Total</p>
                                        <p className="font-bold text-xs md:text-sm text-teak">{med.total}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Consultation Notes */}
                      {latestVisit.notes && (
                        <div className="mb-6 p-4 md:p-5 bg-parchment rounded-lg md:rounded-2xl border border-sandstone/50">
                          <p className="text-[8px] md:text-[9px] font-black text-khaki uppercase tracking-wider md:tracking-widest mb-2">📝 Notes</p>
                          <p className="text-sm md:text-base text-teak">{latestVisit.notes}</p>
                        </div>
                      )}

                      {/* Medical Records */}
                      {visitReports?.length > 0 && (
                        <div className="mb-6 p-4 md:p-5 bg-white border border-sandstone rounded-lg md:rounded-2xl">
                          <p className="text-[8px] md:text-[9px] font-black text-khaki uppercase tracking-wider md:tracking-widest mb-4">📄 Medical Records ({visitReports?.length || 0})</p>
                          <div className="space-y-2">
                            {visitReports.map((report, rIdx) => (
                              <div key={rIdx} className="flex gap-2">
                                <button onClick={() => setPreviewFile(report)} className="flex-grow flex items-center gap-2 p-3 bg-parchment hover:bg-marigold/10 border border-sandstone hover:border-marigold rounded-lg text-left transition-all group/report text-[10px] truncate">
                                  <FileText size={14} className="text-marigold shrink-0" />
                                  <span className="truncate font-bold group-hover/report:text-marigold">{report.title}</span>
                                </button>
                                <button onClick={() => setShareFile(report)} className="p-3 bg-parchment hover:bg-marigold hover:text-white border border-sandstone hover:border-marigold rounded-lg text-marigold transition-all"><Share2 size={14} /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-sandstone animate-in fade-in">
                <Activity size={40} className="text-marigold opacity-30 mx-auto mb-4" />
                <p className="font-heading text-2xl text-khaki mb-2">No visit history yet</p>
                <p className="text-sm text-khaki opacity-60">Your medical visits will appear here</p>
              </div>
            )}

            {filteredHistory.length > 0 && (
              <div className="pt-8 border-t border-sandstone flex items-center justify-between">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200 shadow-sm">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">LIVE</span>
                </div>
                <p className="text-[8px] text-khaki opacity-60">Last updated: {new Date(lastVisitUpdate).toLocaleTimeString()}</p>
                <p className="text-[8px] font-black text-marigold uppercase tracking-widest">{filteredHistory.length} Total Visits</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- MODALS --- */}
      {previewFile && (
        <div className="fixed inset-0 bg-teak/90 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
          <div className="bg-parchment w-full max-w-5xl h-[90vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border border-sandstone">
            <div className="p-6 bg-white border-b border-sandstone flex justify-between items-center">
              <h3 className="font-heading text-lg">{previewFile.title}</h3>
              <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-red-50 rounded-xl transition-all text-red-500"><X size={24} /></button>
            </div>
            <iframe src={previewFile.fileUrl} className="flex-grow w-full border-none" title="Report" />
          </div>
        </div>
      )}

      {shareFile && (
        <div className="fixed inset-0 bg-teak/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 border border-sandstone animate-in zoom-in-95 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-marigold/10 rounded-2xl flex items-center justify-center text-marigold"><Share2 size={24} /></div>
              <button onClick={() => setShareFile(null)} className="text-khaki hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>
            <h3 className="font-heading text-2xl text-teak mb-2">Secure Link</h3>
            <p className="text-xs text-khaki mb-6">Share this medical file with your doctor.</p>
            <div className="bg-parchment border border-sandstone rounded-2xl p-4 flex items-center justify-between overflow-hidden">
              <code className="text-[10px] text-khaki truncate pr-4">{shareFile.fileUrl}</code>
              <button onClick={() => handleCopyLink(shareFile.fileUrl)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all shrink-0 ${copied ? 'bg-green-500 text-white' : 'bg-teak text-white'}`}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedVisit && (
        <div className="fixed inset-0 bg-teak/60 backdrop-blur-md z-[90] flex items-center justify-center p-6">
          <div className="bg-parchment w-full max-w-2xl rounded-[3rem] p-10 border border-sandstone shadow-2xl relative">
            <div className="flex justify-between mb-8 items-center border-b border-sandstone pb-6">
              <div>
                <h2 className="text-2xl font-heading">Consultation Notes</h2>
                <p className="text-[10px] font-black uppercase text-marigold tracking-widest mt-1">Dr. {selectedVisit.doctorName || selectedVisit.doctorId?.name} • {selectedVisit.clinicName || selectedVisit.clinicId?.name}</p>
              </div>
              <button onClick={() => setSelectedVisit(null)} className="p-2 hover:bg-black/5 rounded-full transition-all text-khaki"><X size={24} /></button>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-sandstone shadow-inner font-medium text-teak leading-relaxed whitespace-pre-wrap min-h-[300px]">
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
  <div className="flex justify-between items-end border-b border-sandstone/30 pb-3 mb-3">
    <span className="text-[10px] font-black text-khaki uppercase tracking-widest">{label}</span>
    <div className="text-right">
      <span className="text-xl font-heading text-teak">{val || '0'}</span>
      <span className="text-[8px] font-bold text-khaki ml-1">{unit}</span>
    </div>
  </div>
);

export default PatientDashboard;