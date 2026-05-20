import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import {
  Activity,
  Calendar,
  Users,
  FileText,
  ClipboardList,
  Clock,
  ChevronDown,
  Bell,
  Search,
  Plus,
  X,
  UserPlus,
  FlaskConical,
  Layout,
  MoreHorizontal,
  Coffee,
  Play,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  TrendingUp,
  RefreshCw,
  History,
  Mic,
  Trash2
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import PatientQuickView from '../../components/PatientQuickView';

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')).replace(/\/$/, '');
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const QuickActionTile = ({ icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-3 p-4 rounded-[1.5rem] bg-white border border-gray-50 hover:border-teal-100 hover:shadow-xl hover:shadow-teal-100/30 hover:-translate-y-1 transition-all group aspect-square shadow-sm"
  >
    <div className={`p-4 rounded-2xl transition-all group-hover:scale-110 ${color}`}>
      {icon}
    </div>
    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center leading-tight">
      {label}
    </span>
  </button>
);

const MetricCard = ({ title, value, change, icon, color }) => {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  // Ultra short titles for mobile 1x4
  const shortTitle = title
    .replace('Scheduled Appointments', 'Appts')
    .replace('In Consultation', 'Consult')
    .replace('Avg. Wait Time', 'Wait')
    .replace('Pending Follow Ups', 'Follows');

  return (
    <div className="bg-white p-2 md:p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col items-center md:items-start text-center md:text-left h-24 justify-center">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start w-full mb-1 md:mb-1.5 gap-1 md:gap-0">
        <h3 className="hidden md:block text-[10px] font-black text-gray-400 uppercase tracking-widest flex-1 text-left leading-tight pr-2">{title}</h3>
        <div className={`p-1.5 rounded-lg shrink-0 ${colorMap[color] || 'bg-gray-50 text-gray-600'} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      <h3 className="md:hidden text-[8px] font-black text-gray-400 uppercase tracking-widest w-full mb-0.5 leading-tight">{shortTitle}</h3>
      <p className="text-sm md:text-2xl font-black text-gray-900 mb-0">{value}</p>
      {change && (
        <div className="hidden md:flex items-center gap-1 mt-0.5">
          <TrendingUp size={10} className={change.startsWith('+') ? 'text-green-500' : 'text-red-500'} />
          <span className={`text-[9px] font-bold ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{change}</span>
          <span className="text-[10px] text-gray-400 hidden sm:inline">from yesterday</span>
        </div>
      )}
      {!change && <p className="hidden md:block text-[8px] text-gray-400 mt-0.5 uppercase tracking-widest font-black">Currently active</p>}
    </div>
  );
};

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    scheduled: 0,
    inConsultation: 0,
    avgWaitTime: localStorage.getItem('avgWaitTime') || '0 mins',
    pendingFollowUps: 0
  });
  const [queue, setQueue] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ patientName: '', patientPhone: '', visitType: 'Appointment', appointmentDate: '' });
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', email: '', gender: 'Male', age: '' });
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Viral Fever Protocol', drugs: 'Paracetamol 500mg, Vitamin C', instruction: 'Post meals' },
    { id: 2, name: 'Acute Hypertension', drugs: 'Amlodipine 5mg', instruction: 'Once daily' },
    { id: 3, name: 'General Cough/Cold', drugs: 'Levocetirizine 5mg, Cough Syrup', instruction: 'Before bed' }
  ]);
  const [templateSearch, setTemplateSearch] = useState("");
  const [activeTab, setActiveTab] = useState('All');
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activePatient, setActivePatient] = useState(null);
  const [isConsultationMode, setIsConsultationMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [workStartTime] = useState(new Date());
  const [elapsedWorkTime, setElapsedWorkTime] = useState("0h 0m");
  const [showQuickActions, setShowQuickActions] = useState(false);

  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState([{ name: '', time: '', amount: '', total: '' }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [showHistoryLocker, setShowHistoryLocker] = useState(false);

  const [isDictating, setIsDictating] = useState(false);
  const handleStartDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Swal.fire('Not Supported', 'Speech recognition is not supported on this browser. Try Chrome or Safari.', 'warning');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsDictating(true);
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsDictating(false);
    };

    recognition.onend = () => {
      setIsDictating(false);
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setDiagnosis((prev) => prev ? `${prev} ${speechToText}` : speechToText);
    };

    recognition.start();
  };

  useEffect(() => {
    const savedTemplates = localStorage.getItem('doctor_templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('doctor_templates', JSON.stringify(templates));
  }, [templates]);

  const token = localStorage.getItem('token');
  const clinicId = localStorage.getItem('clinicId');
  const doctorId = localStorage.getItem('userId');
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const filteredQueue = queue.filter(p => {
    const matchesSearch = p.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tokenNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'All') return true;
    if (activeTab === 'Waiting') return p.status === 'Waiting';
    if (activeTab === 'In') return p.status === 'In-Consultation';
    if (activeTab === 'Completed') return p.status === 'Completed';
    return true;
  });

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setIsSyncing(true);
    try {
      const res = await axios.get(`${API_URL}/api/queue/stats/doctor`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data) {
        const backendStats = res.data.data.stats || { scheduled: 0, inConsultation: 0, avgWaitTime: '0 mins', pendingFollowUps: 0 };
        setStats({
          ...backendStats,
          avgWaitTime: localStorage.getItem('avgWaitTime') || backendStats.avgWaitTime || '0 mins'
        });
        setQueue(res.data.data.queue || []);
        setReminders(res.data.data.reminders || []);

        const queueData = res.data.data.queue || [];
        const inConsultationPatient = queueData.find(p => p.status === 'In-Consultation');
        if (inConsultationPatient) {
          setActivePatient(inConsultationPatient);
          setIsConsultationMode(true);
        } else if (!isConsultationMode) {
          setActivePatient(null);
        }
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [token, isConsultationMode]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchDashboardData();

    if (clinicId) {
      socket.emit('joinClinic', clinicId);
      socket.on('queueUpdate', () => {
        fetchDashboardData(false);
      });
    }

    const interval = setInterval(() => fetchDashboardData(false), 30000);

    const timerInterval = setInterval(() => {
      const diff = new Date().getTime() - workStartTime.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setElapsedWorkTime(`${hours}h ${minutes}m`);
    }, 60000);

    return () => {
      socket.off('queueUpdate');
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, [token, clinicId, navigate, fetchDashboardData, workStartTime]);

  useEffect(() => {
    if (activePatient && isConsultationMode) {
      const fetchPatientDetails = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/staff/patient-full-profile/${activePatient.patientPhone}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setPatientData(res.data.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchPatientDetails();

      // --- 💾 LOAD CONSULTATION DRAFT ---
      const savedDraft = localStorage.getItem(`consultation_draft_${activePatient._id}`);
      if (savedDraft) {
        try {
          const { diagnosis: draftDiag, medicines: draftMeds, notes: draftNotes } = JSON.parse(savedDraft);
          setDiagnosis(draftDiag || "");
          setMedicines(draftMeds || [{ name: '', time: '', amount: '', total: '' }]);
          setNotes(draftNotes || "");
        } catch (e) {
          console.error("Draft load error:", e);
        }
      } else {
        setDiagnosis("");
        setMedicines([{ name: '', time: '', amount: '', total: '' }]);
        setNotes("");
      }
    }
  }, [activePatient, isConsultationMode, token]);

  const handleStartConsultation = async (patient) => {
    try {
      const res = await axios.patch(`${API_URL}/api/queue/start/${patient._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setActivePatient(res.data.data);
        setIsConsultationMode(true);
        fetchDashboardData(false);
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to start consultation', 'error');
    }
  };

  const handleCompleteVisit = async (e) => {
    e.preventDefault();
    setIsSyncing(true);
    try {
      const payload = {
        notes,
        diagnosis,
        medicines
      };

      const res = await axios.patch(`${API_URL}/api/queue/complete/${activePatient._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        // Clear local storage draft
        localStorage.removeItem(`consultation_draft_${activePatient._id}`);

        setIsConsultationMode(false);
        setActivePatient(null);
        setNotes("");
        setDiagnosis("");
        setMedicines([]);
        Swal.fire('Success', 'Consultation record locked and saved.', 'success');
        fetchDashboardData(false);
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to save record. Try again.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReferToLab = async () => {
    const { value: testName } = await Swal.fire({
      title: 'Refer Patient to Lab',
      input: 'text',
      inputLabel: 'Enter Lab Test / Investigation Name',
      placeholder: 'e.g. Complete Blood Count, Chest X-Ray',
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#ef4444',
      inputValidator: (value) => {
        if (!value) {
          return 'Please enter a test name!';
        }
      }
    });

    if (!testName) return;

    setIsSyncing(true);
    try {
      const res = await axios.patch(`${API_URL}/api/queue/refer/lab/${activePatient._id}`, { testName }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        localStorage.removeItem(`consultation_draft_${activePatient._id}`);
        setIsConsultationMode(false);
        setActivePatient(null);
        setNotes("");
        setDiagnosis("");
        setMedicines([]);
        Swal.fire({
          icon: 'success',
          title: 'Referred to Lab',
          text: `Patient has been routed to the lab for: ${testName}`,
          confirmButtonColor: '#0d9488'
        });
        fetchDashboardData(true);
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to refer patient to lab. Please try again.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveDraft = () => {
    if (!activePatient?._id) return;
    const draftData = {
      diagnosis,
      medicines,
      notes
    };
    localStorage.setItem(`consultation_draft_${activePatient._id}`, JSON.stringify(draftData));
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Draft Saved Locally',
      showConfirmButton: false,
      timer: 2000
    });
    setIsConsultationMode(false);
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/queue/add`, {
        ...newAppointment,
        doctorId: doctorId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        Swal.fire('Success', 'Appointment scheduled successfully', 'success');
        setShowAppointmentModal(false);
        setNewAppointment({ patientName: '', patientPhone: '', visitType: 'Appointment', appointmentDate: '' });
        fetchDashboardData(false);
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to create appointment', 'error');
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/staff/register-patient`, newPatient, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        Swal.fire('Success', 'Patient registered successfully', 'success');
        setShowPatientModal(false);
        setNewPatient({ name: '', phone: '', email: '', gender: 'Male', age: '' });
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to register patient', 'error');
    }
  };

  const handleToggleBreak = async () => {
    try {
      const res = await axios.patch(`${API_URL}/api/staff/toggle-status/me`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsOnBreak(!res.data.isAvailable);
      fetchDashboardData(false);
    } catch (err) {
      Swal.fire('Error', 'Failed to toggle status', 'error');
    }
  };

  if (loading && !isSyncing) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar role="doctor" />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-body text-gray-900 flex-col md:flex-row">
      <Sidebar role="doctor" />

      <div className="flex-grow flex flex-col min-h-screen overflow-hidden">
        {/* TOP NAV */}
        <nav className="bg-white/80 backdrop-blur-md px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-30 border-b border-gray-200/60">
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-extrabold text-gray-900 tracking-tight leading-tight truncate">
              {(() => {
                const h = new Date().getHours();
                const g = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
                const n = localStorage.getItem('userName') || 'Doctor';
                return `${g}, ${n.toLowerCase().startsWith('dr') ? n : `Dr. ${n}`}`;
              })()}
            </h1>
            <p className="text-[10px] text-gray-400 mt-0.5 font-semibold hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isSyncing && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 rounded-lg border border-teal-100">
                <RefreshCw size={11} className="text-teal-600 animate-spin" />
                <span className="text-[8px] font-bold text-teal-600 uppercase tracking-widest">Syncing</span>
              </div>
            )}

            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-all">
                <Bell size={16} />
                {reminders.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[7px] font-bold rounded-full border-2 border-white flex items-center justify-center">{reminders.length}</span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute top-12 right-0 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-[100]">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-gray-900">Notifications</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-[10px] font-semibold text-teal-600">Dismiss</button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {reminders.slice(0, 4).map((rem, i) => (
                      <div key={i} className="flex gap-2.5 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                        <div className={`p-1.5 rounded-lg shrink-0 ${rem.type === 'lab' ? 'bg-red-50 text-red-500' : rem.type === 'followup' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                          {rem.type === 'lab' ? <FlaskConical size={12} /> : rem.type === 'followup' ? <Calendar size={12} /> : <Bell size={12} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-gray-800 truncate">{rem.title}</p>
                          <p className="text-[9px] text-gray-400 truncate">{rem.patientName}</p>
                        </div>
                      </div>
                    ))}
                    {reminders.length === 0 && <p className="text-center py-3 text-[10px] text-gray-400">No alerts</p>}
                  </div>
                </div>
              )}
            </div>

            <div onClick={() => navigate('/profile')} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-xl transition-all">
              {localStorage.getItem('userImage') ? (
                <img src={localStorage.getItem('userImage')} alt="Dr" className="w-8 h-8 rounded-lg border-2 border-white shadow-sm object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {(localStorage.getItem('userName') || 'D').substring(0, 1).toUpperCase()}
                </div>
              )}
              <div className="hidden lg:block">
                <p className="text-xs font-bold text-gray-900 leading-tight">
                  {(() => { const n = localStorage.getItem('userName') || 'Doctor'; return n.toLowerCase().startsWith('dr') ? n : `Dr. ${n}`; })()}
                </p>
                <p className="text-[9px] text-gray-400 leading-tight">{localStorage.getItem('specialization') || 'Physician'}</p>
              </div>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="flex-grow p-3 md:p-5 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full">
          {isConsultationMode ? (
            /* CONSULTATION MODE */
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <button onClick={() => setIsConsultationMode(false)} className="flex items-center gap-2 text-xs font-bold text-teal-600 hover:text-teal-700 transition-all">
                  <ArrowRight className="rotate-180" size={14} /> Back to Dashboard
                </button>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-teal-50 text-teal-600 border border-teal-100 rounded-full text-[10px] font-bold animate-pulse">In Consultation</span>
                  <span className="text-[10px] text-gray-400">Started {new Date(activePatient.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative">
                    <button onClick={() => setShowProfile(true)} className="absolute top-4 right-4 text-gray-300 hover:text-teal-600 transition-colors"><Layout size={18} /></button>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-xl font-bold shrink-0">
                        {activePatient.patientName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold text-gray-900 truncate">{activePatient.patientName}</h2>
                        <p className="text-[10px] font-semibold text-teal-600">Token #{activePatient.tokenNumber}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'BP', val: patientData?.vitals?.[0]?.bloodPressure || '120/80' },
                        { label: 'Temp', val: `${patientData?.vitals?.[0]?.temperature || '98.6'}F` },
                        { label: 'Pulse', val: `${patientData?.vitals?.[0]?.pulseRate || '72'} bpm` },
                        { label: 'Sugar', val: `${patientData?.vitals?.[0]?.sugarLevel || '96'} mg/dL` }
                      ].map(v => (
                        <div key={v.label} className="bg-gray-50 p-2.5 rounded-lg">
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{v.label}</p>
                          <p className="font-bold text-xs text-gray-900">{v.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-900 mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <button onClick={() => navigate('/doctor/reports')} className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-all"><FlaskConical size={15} /> Order Lab Test</button>
                      <button type="button" onClick={() => setShowHistoryLocker(true)} className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-all"><History size={15} /> Medical History</button>
                      <button onClick={() => navigate('/doctor/appointments')} className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-all"><Calendar size={15} /> Schedule Follow-up</button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <form onSubmit={handleCompleteVisit} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-gray-700">Clinical Diagnosis</label>
                        {('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
                          <button type="button" onClick={handleStartDictation}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${isDictating ? 'bg-red-500 text-white animate-pulse' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'}`}>
                            <Mic size={11} className={isDictating ? 'animate-bounce' : ''} />
                            {isDictating ? 'Listening...' : 'Dictate'}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {['Fever', 'Dry Cough', 'Headache', 'Hypertension', 'Body Ache', 'Chest Pain', 'Nausea', 'Fatigue', 'Cold & Flu'].map((s) => (
                          <button key={s} type="button" onClick={() => setDiagnosis(prev => prev ? `${prev}, ${s}` : s)}
                            className="px-2 py-0.5 bg-gray-50 border border-gray-100 hover:border-teal-300 hover:bg-teal-50 text-gray-500 hover:text-teal-700 rounded text-[9px] font-semibold transition-all">+{s}</button>
                        ))}
                      </div>
                      <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Symptoms, diagnostic codes, observations..."
                        className="w-full h-24 bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm outline-none focus:border-teal-400 focus:bg-white transition-all text-gray-800" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold text-gray-700">Medicines</label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setShowTemplatesModal(true)} className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-1"><Layout size={12} /> Templates</button>
                          <button type="button" onClick={() => setMedicines([...medicines, { name: '', time: '', amount: '', total: '' }])} className="text-[9px] font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg flex items-center gap-1"><Plus size={12} /> Add</button>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {medicines.map((m, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center group bg-gray-50 p-2.5 rounded-xl">
                            <input type="text" placeholder="Medicine" value={m.name} onChange={(e) => { const u = [...medicines]; u[idx].name = e.target.value; setMedicines(u); }} className="flex-1 bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-teal-400 transition-all w-full" />
                            <input type="text" placeholder="Dosage" value={m.amount} onChange={(e) => { const u = [...medicines]; u[idx].amount = e.target.value; setMedicines(u); }} className="w-full sm:w-24 bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-teal-400 transition-all" />
                            <input type="text" placeholder="Timing" value={m.time || ''} onChange={(e) => { const u = [...medicines]; u[idx].time = e.target.value; setMedicines(u); }} className="w-full sm:w-24 bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-teal-400 transition-all" />
                            <button type="button" onClick={() => setMedicines(medicines.filter((_, i) => i !== idx))} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all shrink-0"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                      <button type="submit" disabled={isProcessing} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold text-xs hover:bg-teal-700 transition-all shadow-md shadow-teal-600/20 disabled:opacity-50 active:scale-[0.98]">{isProcessing ? 'Saving...' : 'Complete Consultation'}</button>
                      <button type="button" onClick={handleReferToLab} disabled={isProcessing} className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-all shadow-md disabled:opacity-50 active:scale-[0.98]">Lab</button>
                      <button type="button" onClick={handleSaveDraft} className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all active:scale-[0.98]">Draft</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* DASHBOARD MODE */
            <div className="space-y-3 md:space-y-4">
              {/* Metric Strip - single row on all screens */}
              <div className="grid grid-cols-4 gap-1.5 md:gap-3">
                {[
                  { label: 'Appts', full: 'Appointments', value: stats.scheduled, grad: 'from-teal-500 to-cyan-500', icon: <Calendar size={12} className="md:hidden" /> },
                  { label: 'Consult', full: 'In Consult', value: stats.inConsultation, grad: 'from-blue-500 to-indigo-500', icon: <Stethoscope size={12} className="md:hidden" /> },
                  { label: 'Wait', full: 'Avg. Wait', value: stats.avgWaitTime, grad: 'from-violet-500 to-purple-500', icon: <Clock size={12} className="md:hidden" /> },
                  { label: 'Follow', full: 'Follow-ups', value: stats.pendingFollowUps, grad: 'from-orange-500 to-amber-500', icon: <ClipboardList size={12} className="md:hidden" /> }
                ].map((c) => (
                  <div key={c.label} className="bg-white rounded-lg md:rounded-xl border border-gray-100 px-2 py-2 md:p-3.5 hover:shadow-md transition-all group text-center md:text-left">
                    <div className="hidden md:flex items-center justify-between mb-2.5">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.grad} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform`}>
                        <Calendar size={16} />
                      </div>
                    </div>
                    <div className={`md:hidden w-6 h-6 rounded-md bg-gradient-to-br ${c.grad} flex items-center justify-center text-white mx-auto mb-1`}>
                      {c.icon}
                    </div>
                    <p className="text-base md:text-xl font-extrabold text-gray-900 leading-none">{c.value}</p>
                    <p className="text-[7px] md:text-[10px] font-semibold text-gray-400 mt-0.5 truncate"><span className="md:hidden">{c.label}</span><span className="hidden md:inline">{c.full}</span></p>
                  </div>
                ))}
              </div>

              {/* Queue + Sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* Queue */}
                <div className="lg:col-span-8 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '340px' }}>
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-gray-900">Today's Queue</h2>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-600 text-[7px] font-bold uppercase rounded-full tracking-wider border border-green-100">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-teal-500 animate-ping' : 'bg-green-500'}`} />
                        {isSyncing ? 'Sync' : 'Live'}
                      </span>
                    </div>
                    <button onClick={() => navigate('/doctor/appointments')} className="text-[10px] font-bold text-teal-600 hover:text-teal-700">Full Schedule</button>
                  </div>

                  <div className="px-4 pt-1.5 flex gap-0.5 border-b border-gray-100">
                    {[
                      { id: 'All', label: 'All', count: queue.length },
                      { id: 'Waiting', label: 'Waiting', count: queue.filter(p => p.status === 'Waiting').length },
                      { id: 'In', label: 'Active', count: queue.filter(p => p.status === 'In-Consultation').length },
                      { id: 'Completed', label: 'Done', count: queue.filter(p => p.status === 'Completed').length }
                    ].map((tab) => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-2.5 py-2 text-[10px] font-bold transition-all relative ${activeTab === tab.id ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        {tab.label}
                        <span className={`ml-1 text-[8px] px-1 py-0.5 rounded ${activeTab === tab.id ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400'}`}>{tab.count}</span>
                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-teal-500 rounded-t" />}
                      </button>
                    ))}
                  </div>

                  <div className="flex-grow overflow-y-auto">
                    {filteredQueue.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                        <Users size={24} className="text-gray-200 mb-2" />
                        <p className="text-xs font-semibold text-gray-400">No patients in queue</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {filteredQueue.map((patient, idx) => (
                          <div key={patient._id}
                            onClick={() => {
                              if (patient.status === 'Waiting') {
                                if (patient.currentStage === 'Lab-Pending') { Swal.fire({ icon: 'info', title: 'Lab Pending', text: 'Patient is at the lab.', confirmButtonColor: '#0d9488' }); return; }
                                handleStartConsultation(patient);
                              } else if (patient.status === 'In-Consultation') { setActivePatient(patient); setIsConsultationMode(true); }
                            }}
                            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-teal-50/30 transition-all cursor-pointer group">
                            <span className="text-[10px] font-bold text-gray-300 w-4 text-center shrink-0">{idx + 1}</span>
                            <span className="text-[10px] font-semibold text-gray-400 w-14 shrink-0 hidden sm:block">
                              {new Date(patient.appointmentDate || patient.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center text-teal-600 font-bold text-[9px] border border-teal-100 shrink-0 group-hover:from-teal-500 group-hover:to-cyan-500 group-hover:text-white transition-all">
                                {(patient.patientName || 'UP').substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-gray-900 leading-tight truncate">{patient.patientName}</p>
                                <p className="text-[9px] text-gray-400 truncate">{patient.reason || 'General'} - {patient.tokenNumber}</p>
                              </div>
                            </div>
                            <span className={`shrink-0 px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider hidden md:block ${
                              patient.status === 'In-Consultation' ? 'bg-green-50 text-green-600 border border-green-100' :
                              patient.currentStage === 'Lab-Pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                              patient.currentStage === 'Lab-Completed' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                              patient.status === 'Waiting' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                              patient.status === 'Completed' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-50 text-gray-400'
                            }`}>
                              {patient.currentStage === 'Lab-Pending' ? 'At Lab' : patient.currentStage === 'Lab-Completed' ? 'Lab Done' : patient.status}
                            </span>
                            <div className="shrink-0">
                              {patient.status === 'Waiting' ? (
                                patient.currentStage === 'Lab-Pending' ? (
                                  <span className="px-2 py-1 bg-gray-50 text-gray-400 border border-gray-200 rounded-lg text-[8px] font-bold">At Lab</span>
                                ) : (
                                  <button onClick={(e) => { e.stopPropagation(); handleStartConsultation(patient); }}
                                    className={`px-3 py-1 text-white rounded-lg text-[8px] font-bold shadow-sm transition-all active:scale-95 ${patient.currentStage === 'Lab-Completed' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-teal-600 hover:bg-teal-700'}`}>
                                    {patient.currentStage === 'Lab-Completed' ? 'Resume' : 'Start'}
                                  </button>
                                )
                              ) : patient.status === 'In-Consultation' ? (
                                <button onClick={(e) => { e.stopPropagation(); setActivePatient(patient); setIsConsultationMode(true); }}
                                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[8px] font-bold shadow-sm transition-all active:scale-95 animate-pulse">Resume</button>
                              ) : patient.status === 'Pending-Approval' ? (
                                <span className="px-2 py-1 bg-gray-50 text-gray-400 border border-gray-200 rounded-lg text-[8px] font-bold">Pending</span>
                              ) : (
                                <span className="text-[9px] text-gray-300">{patient.status}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <span className="text-[9px] font-bold text-gray-400">{queue.length} in queue</span>
                    <span className="text-[9px] font-bold text-gray-400">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-3 flex flex-col">
                  <div className="hidden lg:block bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400 rounded-full blur-3xl opacity-10" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2.5">
                        <div>
                          <h3 className="text-xs font-bold">Take a Break</h3>
                          <p className="text-[8px] text-white/40 mt-0.5">Short breaks improve focus</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-bold text-white/30 uppercase tracking-wider">Working</p>
                          <p className="text-sm font-bold text-teal-400">{elapsedWorkTime}</p>
                        </div>
                      </div>
                      <button onClick={handleToggleBreak}
                        className={`w-full py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all active:scale-[0.98] ${isOnBreak ? 'bg-teal-500 hover:bg-teal-400 text-white shadow-md shadow-teal-500/30' : 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/10'}`}>
                        {isOnBreak ? 'Resume Work' : 'Start Break'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 flex-1 flex flex-col" style={{ minHeight: '180px' }}>
                    <div className="flex justify-between items-center mb-2.5">
                      <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <Bell size={13} className="text-orange-400" /> Reminders
                      </h3>
                      <button onClick={() => navigate('/doctor/appointments')} className="text-[9px] font-bold text-teal-600">View All</button>
                    </div>
                    <div className="space-y-1.5 flex-grow overflow-y-auto">
                      {reminders.map((rem) => (
                        <div key={rem._id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer">
                          <div className={`p-1.5 rounded-md shrink-0 ${rem.type === 'lab' ? 'bg-red-50 text-red-500' : rem.type === 'followup' ? 'bg-orange-50 text-orange-500' : rem.type === 'prescription' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                            {rem.type === 'lab' ? <FlaskConical size={12} /> : rem.type === 'followup' ? <Calendar size={12} /> : rem.type === 'prescription' ? <FileText size={12} /> : <Bell size={12} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-gray-800 truncate">{rem.title}</p>
                            <p className="text-[8px] text-gray-400 truncate">{rem.patientName}</p>
                          </div>
                        </div>
                      ))}
                      {reminders.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center py-5">
                          <Bell className="text-gray-200 mb-1.5" size={18} />
                          <p className="text-[9px] font-bold text-gray-300">No reminders</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Timeline */}
              {queue.filter(a => a.visitType === 'Appointment').length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Calendar size={14} className="text-teal-600" /> Scheduled Appointments
                    </h2>
                    <button onClick={() => navigate('/doctor/appointments')} className="text-[10px] font-bold text-teal-600 flex items-center gap-1">Calendar <ArrowRight size={10} /></button>
                  </div>
                  <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
                    {queue.filter(app => app.visitType === 'Appointment').map((app, idx, arr) => (
                      <div key={app._id} className="flex-shrink-0 flex items-start gap-2.5 relative min-w-[160px]">
                        {idx !== arr.length - 1 && <div className="absolute left-[8px] top-[18px] w-[calc(100%+24px)] h-[2px] bg-gray-100 -z-10" />}
                        <div className={`w-4 h-4 rounded-full border-[3px] border-white shadow-md z-10 mt-0.5 shrink-0 ${
                          app.status === 'In-Consultation' ? 'bg-green-500' : app.status === 'Waiting' ? 'bg-orange-400' : app.status === 'Completed' ? 'bg-blue-500' : 'bg-gray-300'
                        }`} />
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{new Date(app.appointmentDate || app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-xs font-semibold text-gray-900 leading-tight">{app.patientName}</p>
                          <p className="text-[9px] text-gray-400 mb-1.5">{app.reason || 'Consultation'}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider ${
                            app.status === 'In-Consultation' ? 'bg-green-50 text-green-600' : app.status === 'Waiting' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                          }`}>{app.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </main>


        {/* Floating Quick Actions Button */}
        <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[90]">
          {showQuickActions && (
            <div className="absolute bottom-20 right-0 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 w-[calc(100vw-2rem)] sm:w-[320px] max-w-[320px] animate-in slide-in-from-bottom-4 fade-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                <button onClick={() => setShowQuickActions(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <QuickActionTile icon={<Plus size={20} />} label="New Appointment" color="bg-green-50 text-green-600" onClick={() => { setShowAppointmentModal(true); setShowQuickActions(false); }} />
                <QuickActionTile icon={<UserPlus size={20} />} label="Add Patient" color="bg-teal-50 text-teal-600" onClick={() => { setShowPatientModal(true); setShowQuickActions(false); }} />
                <QuickActionTile icon={<Search size={20} />} label="Patient Search" color="bg-blue-50 text-blue-600" onClick={() => { navigate('/doctor/locker-search'); setShowQuickActions(false); }} />
                <QuickActionTile icon={<div className="text-lg font-bold">Rx</div>} label="Add Prescription" color="bg-purple-50 text-purple-600" onClick={() => { navigate('/doctor/prescriptions'); setShowQuickActions(false); }} />
                <QuickActionTile icon={<FlaskConical size={20} />} label="Order Lab Test" color="bg-orange-50 text-orange-600" onClick={() => { navigate('/doctor/reports'); setShowQuickActions(false); }} />
                <QuickActionTile icon={<Layout size={20} />} label="Templates" color="bg-indigo-50 text-indigo-600" onClick={() => { setShowTemplatesModal(true); setShowQuickActions(false); }} />

                {/* Take a Break (Mobile Quick Action) */}
                <div className="lg:hidden col-span-2 mt-2">
                  <button
                    onClick={() => { handleToggleBreak(); setShowQuickActions(false); }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-amber-50 text-amber-600 font-bold hover:bg-amber-100 transition-all active:scale-95 border border-amber-100"
                  >
                    <Coffee size={20} />
                    {isOnBreak ? 'Resume Work' : 'Take a Break ☕'}
                  </button>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="w-14 h-14 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-teal-600/30 hover:bg-teal-700 hover:scale-105 transition-all focus:outline-none ml-auto"
          >
            {showQuickActions ? <X size={24} /> : <Plus size={24} />}
          </button>
        </div>

        {showAppointmentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">New Appointment</h3>
                <button onClick={() => setShowAppointmentModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateAppointment} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Patient Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    placeholder="e.g. John Doe"
                    value={newAppointment.patientName}
                    onChange={(e) => setNewAppointment({ ...newAppointment, patientName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input
                    required
                    type="tel"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    placeholder="10-digit number"
                    value={newAppointment.patientPhone}
                    onChange={(e) => setNewAppointment({ ...newAppointment, patientPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Visit Type</label>
                  <select
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all appearance-none"
                    value={newAppointment.visitType}
                    onChange={(e) => setNewAppointment({ ...newAppointment, visitType: e.target.value })}
                  >
                    <option value="Appointment">Scheduled Appointment</option>
                    <option value="Walk-in">Walk-in Visit</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-5 bg-teal-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-100 hover:bg-teal-700 hover:shadow-teal-200 transition-all active:scale-95">
                  Schedule Appointment
                </button>
              </form>
            </div>
          </div>
        )}

        {showTemplatesModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Templates</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pre-defined prescription protocols</p>
                </div>
                <button onClick={() => setShowTemplatesModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search templates (e.g. Fever)..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {templates.filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase())).map((template) => (
                  <div key={template.id} className="p-6 rounded-3xl border border-slate-100 hover:border-indigo-100 bg-white hover:bg-indigo-50/20 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-base font-black text-slate-900">{template.name}</h4>
                      <div className="flex items-center gap-2">
                        {isConsultationMode && (
                          <button
                            onClick={() => {
                              setDiagnosis(template.name);
                              // Convert drugs string to medicines array
                              const drugList = template.drugs.split(',').map(d => {
                                const trimmed = d.trim();
                                // Match standard dosages like 500mg, 5ml, 10mg, 1g, 10mcg
                                const dosageMatch = trimmed.match(/(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|tab|caps|tabs))\b/i);
                                let name = trimmed;
                                let amount = '';
                                if (dosageMatch) {
                                  amount = dosageMatch[1];
                                  name = trimmed.replace(dosageMatch[1], '').trim();
                                }
                                return {
                                  name: name,
                                  time: template.instruction,
                                  amount: amount,
                                  total: ''
                                };
                              });
                              setMedicines(drugList);
                              setShowTemplatesModal(false);
                              Swal.fire({
                                toast: true,
                                position: 'top-end',
                                icon: 'success',
                                title: 'Template Applied',
                                showConfirmButton: false,
                                timer: 2000
                              });
                            }}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-indigo-700 transition-all"
                          >
                            Apply to Prescription
                          </button>
                        )}
                        <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><FileText size={16} /></button>
                        <button
                          onClick={() => setTemplates(templates.filter(t => t.id !== template.id))}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed mb-2">{template.drugs}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                        {template.instruction}
                      </span>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <Layout size={32} />
                    </div>
                    <p className="text-slate-400 font-bold">No templates found.</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  Swal.fire({
                    title: 'New Template',
                    html: `
                      <input id="t-name" class="swal2-input" placeholder="Template Name">
                      <input id="t-drugs" class="swal2-input" placeholder="Drugs/Medicines">
                      <input id="t-instr" class="swal2-input" placeholder="Instructions">
                    `,
                    focusConfirm: false,
                    preConfirm: () => {
                      const name = document.getElementById('t-name').value;
                      const drugs = document.getElementById('t-drugs').value;
                      const instr = document.getElementById('t-instr').value;
                      if (!name) return Swal.showValidationMessage('Name is required');
                      return { name, drugs, instruction: instr };
                    }
                  }).then((result) => {
                    if (result.isConfirmed) {
                      setTemplates([...templates, { id: Date.now(), ...result.value }]);
                    }
                  });
                }}
                className="mt-8 w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Create New Template
              </button>
            </div>
          </div>
        )}

        {showPatientModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Register Patient</h3>
                <button onClick={() => setShowPatientModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreatePatient} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      placeholder="Full name"
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Gender</label>
                    <select
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all appearance-none"
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Age</label>
                    <input
                      required
                      type="number"
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      placeholder="Age"
                      value={newPatient.age}
                      onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input
                    required
                    type="tel"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    placeholder="10-digit number"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-teal-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-100 hover:bg-teal-700 hover:shadow-teal-200 transition-all active:scale-95">
                  Register & Save
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {showProfile && activePatient && <PatientQuickView phone={activePatient.patientPhone} onClose={() => setShowProfile(false)} />}
      {showHistoryLocker && activePatient && <PatientQuickView phone={activePatient.patientPhone} onClose={() => setShowHistoryLocker(false)} />}
    </div>
  );
};

export default DoctorDashboard;
