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
        <nav className="bg-white px-4 md:px-6 py-3.5 flex justify-between items-center sticky top-0 z-30 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
              Good Morning, {(() => {
                const name = localStorage.getItem('userName') || 'Ananya';
                return name.toLowerCase().startsWith('dr') ? name : `Dr. ${name}`;
              })()} 👋
            </h1>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest">
              Here's what's happening in your clinic today.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div
              onClick={() => Swal.fire({
                title: localStorage.getItem('clinicName') || 'Health Plus Clinic',
                text: `Location: ${localStorage.getItem('clinicLocation') || 'Main Street, New Delhi'} | Contact: ${localStorage.getItem('clinicContact') || '+91 98765 43210'}`,
                icon: 'info',
                confirmButtonColor: '#0d9488'
              })}
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-100 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
                <FlaskConical size={16} />
              </div>
              <span className="text-xs font-bold text-gray-700">{localStorage.getItem('clinicName') || 'Health Plus Clinic'}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>

            <div className="flex items-center gap-3 border-l border-gray-100 pl-4 relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-all relative"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full border-2 border-white flex items-center justify-center">{reminders.length || 3}</span>
              </button>

              {showNotifications && (
                <div className="absolute top-14 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Recent Alerts</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-[10px] font-bold text-teal-600">Clear All</button>
                  </div>
                  <div className="space-y-3">
                    {reminders.slice(0, 3).map((rem, i) => (
                      <div key={i} className="flex gap-3 p-2.5 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                          <Bell size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{rem.title}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{rem.patientName}</p>
                        </div>
                      </div>
                    ))}
                    {reminders.length === 0 && <p className="text-center py-3 text-[10px] font-bold text-gray-400 uppercase">No new alerts</p>}
                  </div>
                  <button onClick={() => navigate('/doctor/appointments')} className="w-full mt-4 py-2.5 bg-gray-50 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-all">View All Reminders</button>
                </div>
              )}

              <div
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-xl transition-all group"
              >
                {localStorage.getItem('userImage') ? (
                  <img
                    src={localStorage.getItem('userImage')}
                    alt="Doctor"
                    className="w-10 h-10 rounded-xl border border-white shadow-sm object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl border border-white shadow-sm bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                    {(localStorage.getItem('userName') || 'D').substring(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="hidden md:block">
                  <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-0">Doctor</p>
                  <p className="text-xs font-black text-gray-900 leading-tight">
                    {(() => {
                      const name = localStorage.getItem('userName') || 'Ananya';
                      return name.toLowerCase().startsWith('dr') ? name : `Dr. ${name}`;
                    })()}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0 leading-tight">
                    {localStorage.getItem('specialization') || 'Chief Physician'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-grow p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {isConsultationMode ? (
            <div className="space-y-4 md:space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <button onClick={() => setIsConsultationMode(false)} className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 transition-all">
                  <ArrowRight className="rotate-180" size={14} /> Back to Dashboard
                </button>
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 bg-teal-50 text-teal-600 border border-teal-100 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">In Consultation</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Time: {new Date(activePatient.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-1 space-y-6">
                  {/* High Density Patient Card */}
                  <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4">
                      <button onClick={() => setShowProfile(true)} className="text-gray-400 hover:text-teal-600 transition-colors"><Layout size={20} /></button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
                      <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner flex-shrink-0">
                        {activePatient.patientName.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-center sm:text-left min-w-0">
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 truncate">{activePatient.patientName}</h2>
                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1">Patient Token: #{activePatient.tokenNumber}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Blood Pressure</p>
                        <p className="font-bold text-xs text-gray-900">{patientData?.vitals?.[0]?.bloodPressure || '120/80'}</p>
                      </div>
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Temperature</p>
                        <p className="font-bold text-xs text-gray-900">{patientData?.vitals?.[0]?.temperature || '98.6'}°F</p>
                      </div>
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Pulse Rate</p>
                        <p className="font-bold text-xs text-gray-900">{patientData?.vitals?.[0]?.pulseRate || '72'} bpm</p>
                      </div>
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Sugar Level</p>
                        <p className="font-bold text-xs text-gray-900">{patientData?.vitals?.[0]?.sugarLevel || '96'} mg/dL</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center justify-between">
                      Quick Actions
                      <MoreHorizontal size={18} className="text-gray-400" />
                    </h3>
                    <div className="space-y-3">
                      <button onClick={() => navigate('/doctor/reports')} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-black uppercase tracking-wider text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-all">
                        <FlaskConical size={18} /> Order Lab Test
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowHistoryLocker(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-black uppercase tracking-wider text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-all"
                      >
                        <History size={18} /> Medical History
                      </button>
                      <button onClick={() => navigate('/doctor/appointments')} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-black uppercase tracking-wider text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-all">
                        <Calendar size={18} /> Schedule Follow-up
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <form onSubmit={handleCompleteVisit} className="bg-white p-5 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-xs font-black text-gray-700 uppercase tracking-widest">Clinical Diagnosis</label>
                        {/* Voice Dictation Trigger */}
                        {('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
                          <button
                            type="button"
                            onClick={handleStartDictation}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              isDictating 
                                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/20' 
                                : 'bg-teal-50 text-teal-600 border border-teal-100 hover:bg-teal-100'
                            }`}
                          >
                            <Mic size={12} className={isDictating ? 'animate-bounce' : ''} />
                            {isDictating ? 'Listening...' : 'Dictate'}
                          </button>
                        )}
                      </div>

                      {/* Quick Symptom Preset Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {['Fever', 'Dry Cough', 'Acute Headache', 'Hypertension', 'Body Ache', 'Chest Pain', 'Nausea', 'Fatigue', 'Cold & Flu'].map((symptom) => (
                          <button
                            key={symptom}
                            type="button"
                            onClick={() => {
                              setDiagnosis(prev => prev ? `${prev}, ${symptom}` : symptom);
                            }}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-100 hover:border-teal-300 hover:bg-teal-50 text-slate-600 hover:text-teal-700 rounded-lg text-[9px] font-bold uppercase transition-all"
                          >
                            + {symptom}
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="Type or dictate symptoms, diagnostic codes, or observations..."
                        className="w-full h-28 bg-gray-50 border-2 border-transparent rounded-2xl p-4 text-xs sm:text-sm outline-none focus:border-teal-500 focus:bg-white transition-all text-gray-800 font-medium"
                      />
                    </div>

                    <div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                        <label className="text-xs font-black text-gray-700 uppercase tracking-widest">Prescribed Medicines</label>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setShowTemplatesModal(true)}
                            className="flex-1 sm:flex-none text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1 bg-indigo-50 px-3 py-2 rounded-xl transition-all"
                          >
                            <Layout size={14} /> Templates
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setMedicines([...medicines, { name: '', time: '', amount: '', total: '' }])} 
                            className="flex-1 sm:flex-none text-[9px] font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 flex items-center justify-center gap-1 bg-teal-50 px-3 py-2 rounded-xl transition-all"
                          >
                            <Plus size={14} /> Add Drug
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {medicines.map((m, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row gap-2.5 items-center group w-full bg-gray-50/50 sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-gray-100 sm:border-none">
                            <div className="flex gap-2 w-full flex-grow">
                              <input
                                type="text"
                                placeholder="Medicine name"
                                value={m.name}
                                onChange={(e) => {
                                  const updated = [...medicines];
                                  updated[idx].name = e.target.value;
                                  setMedicines(updated);
                                }}
                                className="flex-1 bg-gray-50 border-2 border-transparent rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800 font-bold"
                              />
                              <input
                                type="text"
                                placeholder="Dosage (e.g. 500mg)"
                                value={m.amount}
                                onChange={(e) => {
                                  const updated = [...medicines];
                                  updated[idx].amount = e.target.value;
                                  setMedicines(updated);
                                }}
                                className="w-24 sm:w-36 bg-gray-50 border-2 border-transparent rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800 font-bold"
                              />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto items-center">
                              <input
                                type="text"
                                placeholder="Timing (e.g. 1-0-1)"
                                value={m.time || ''}
                                onChange={(e) => {
                                  const updated = [...medicines];
                                  updated[idx].time = e.target.value;
                                  setMedicines(updated);
                                }}
                                className="flex-1 sm:w-32 bg-gray-50 border-2 border-transparent rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800 font-bold"
                              />
                              <button 
                                type="button" 
                                onClick={() => setMedicines(medicines.filter((_, i) => i !== idx))} 
                                className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex flex-wrap sm:flex-nowrap gap-4">
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50 active:scale-95"
                      >
                        {isProcessing ? 'Saving...' : 'Complete Consultation'}
                      </button>
                      <button
                        type="button"
                        onClick={handleReferToLab}
                        disabled={isProcessing}
                        className="px-6 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-95"
                      >
                        Go for Lab
                      </button>
                      <button type="button" onClick={handleSaveDraft} className="px-6 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95">
                        Save Draft
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-5">
              {/* Metrics Row */}
              <div className="grid grid-cols-4 gap-2 md:gap-6">
                <MetricCard
                  title="Scheduled Appointments"
                  value={stats.scheduled}
                  icon={<Calendar className="w-4 h-4 md:w-6 md:h-6" />}
                  color="teal"
                />
                <MetricCard
                  title="In Consultation"
                  value={stats.inConsultation}
                  icon={<Stethoscope className="w-4 h-4 md:w-6 md:h-6" />}
                  color="blue"
                />
                <MetricCard
                  title="Avg. Wait Time"
                  value={stats.avgWaitTime}
                  icon={<Clock className="w-4 h-4 md:w-6 md:h-6" />}
                  color="purple"
                />
                <MetricCard
                  title="Pending Follow Ups"
                  value={stats.pendingFollowUps}
                  icon={<Calendar className="w-4 h-4 md:w-6 md:h-6" />}
                  color="orange"
                />
              </div>

              {/* Main Content Grid - 2 Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                {/* Left: Queue Table (Span 8) */}
                <div className="lg:col-span-8 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:h-[360px]">
                  <div className="p-3 md:p-3.5 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                      <h2 className="text-base font-bold text-gray-900 tracking-tight">Today's Clinic Queue</h2>
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[8px] font-black uppercase rounded-full tracking-widest border border-green-100 flex items-center gap-1">
                        <div className={`w-1 h-1 rounded-full ${isSyncing ? 'bg-teal-500 animate-ping' : 'bg-green-500 animate-pulse'}`}></div>
                        {isSyncing ? 'Syncing...' : 'Live'}
                      </span>
                    </div>
                    <button onClick={() => navigate('/doctor/appointments')} className="text-xs font-bold text-teal-600 hover:text-teal-700 whitespace-nowrap">
                      View Full Schedule
                    </button>
                  </div>

                  <div className="p-3 md:p-3.5 pb-0">
                    <div className="flex gap-4 border-b border-gray-100">
                      {[
                        { id: 'All', label: 'All', count: queue.length },
                        { id: 'Waiting', label: 'Waiting', count: queue.filter(p => p.status === 'Waiting').length },
                        { id: 'In', label: 'In Consultation', count: queue.filter(p => p.status === 'In-Consultation').length },
                        { id: 'Completed', label: 'Completed', count: queue.filter(p => p.status === 'Completed').length }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`pb-2 text-xs font-bold transition-all relative flex items-center gap-2 ${(activeTab === tab.id)
                            ? 'text-teal-600'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                          {tab.label}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                            {tab.count}
                          </span>
                          {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-teal-600 rounded-t-full shadow-[0_-2px_10px_rgba(13,148,136,0.3)]"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 overflow-y-auto flex-grow">
                    <table className="w-full text-left border-separate border-spacing-y-1.5">
                      <tbody>
                        {filteredQueue.map((patient, idx) => (
                          <tr 
                            key={patient._id} 
                            onClick={() => {
                              if (patient.status === 'Waiting') {
                                handleStartConsultation(patient);
                              } else if (patient.status === 'In-Consultation') {
                                setActivePatient(patient);
                                setIsConsultationMode(true);
                              }
                            }}
                            className="group hover:bg-teal-50/30 transition-all cursor-pointer"
                          >
                            <td className="py-1.5 pl-3 pr-1 text-[10px] font-black text-gray-400 border-l-4 border-transparent group-hover:border-teal-600 transition-all rounded-l-xl">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-2.5">
                              <span className="text-[11px] font-bold text-gray-900 whitespace-nowrap">
                                {new Date(patient.appointmentDate || patient.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="py-1.5 px-2.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-black text-[10px] border border-teal-100">
                                  {(patient.patientName || 'UP').substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-900 leading-tight">{patient.patientName}</p>
                                  <p className="text-[9px] font-medium text-gray-400 mt-0">{patient.reason || 'General Consultation'}</p>
                                  <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none">{patient.tokenNumber}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-1.5 px-2.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${patient.status === 'In-Consultation' ? 'bg-green-50 text-green-600' :
                                  patient.status === 'Waiting' ? 'bg-orange-50 text-orange-600' :
                                    patient.status === 'Completed' ? 'bg-blue-50 text-blue-600' :
                                      'bg-gray-50 text-gray-400'
                                  }`}>
                                  {patient.status}
                                </span>
                              </div>
                            </td>
                            <td className="py-1.5 px-2.5 text-right pr-3 rounded-r-xl">
                              {patient.status === 'Waiting' ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartConsultation(patient);
                                  }}
                                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95 inline-flex"
                                >
                                  Start
                                </button>
                              ) : patient.status === 'In-Consultation' ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActivePatient(patient);
                                    setIsConsultationMode(true);
                                  }}
                                  className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95 inline-flex animate-pulse"
                                >
                                  Resume
                                </button>
                              ) : (
                                <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">
                                  Completed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 border-t border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{queue.length} Patients in queue</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Clinic ends at: 02:00 PM</span>
                  </div>
                </div>

                {/* Right Column: Break & Reminders (Span 4) */}
                <div className="lg:col-span-4 space-y-4 flex flex-col">
                  {/* Take a Break */}
                  <div className="hidden lg:flex bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden flex-col items-start md:h-[140px] justify-between">
                    <div className="relative z-10 flex flex-col justify-between h-full w-full">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 leading-tight">Take a Break ☕</h3>
                        <p className="text-[10px] font-medium text-gray-400 mt-0.5 leading-tight">Short breaks improve focus and patient care.</p>
                      </div>
                      <div className="flex justify-between items-center w-full mt-2">
                        <button
                           onClick={handleToggleBreak}
                           className="px-3.5 py-1.5 bg-teal-600 text-white rounded-lg font-bold text-xs shadow-md shadow-teal-600/10 hover:bg-teal-700 transition-all"
                        >
                          {isOnBreak ? 'Resume Work' : 'Start Break'}
                        </button>
                        <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-none">Working: {elapsedWorkTime}</p>
                      </div>
                    </div>
                    <div className="absolute bottom-1 right-1 w-12 h-12 opacity-30">
                      <img src="https://img.icons8.com/color/160/sofa.png" alt="break" className="w-full h-full object-contain" />
                    </div>
                  </div>

                  {/* Reminders */}
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:h-[204px]">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-base font-bold text-gray-900 leading-none">Reminders</h3>
                      <button onClick={() => navigate('/doctor/appointments')} className="text-xs font-bold text-teal-600 leading-none">View All</button>
                    </div>
                    <div className="space-y-1.5 flex-grow overflow-y-auto pr-0.5">
                      {reminders.map((rem) => (
                        <div key={rem._id} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-50 hover:border-teal-100 transition-all shadow-sm">
                          <div className={`p-1.5 rounded-md ${rem.type === 'lab' ? 'bg-red-50 text-red-500' :
                            rem.type === 'followup' ? 'bg-orange-50 text-orange-500' :
                              rem.type === 'prescription' ? 'bg-purple-50 text-purple-500' :
                                'bg-blue-50 text-blue-500'
                            }`}>
                            {rem.type === 'lab' ? <FlaskConical size={14} /> :
                              rem.type === 'followup' ? <Calendar size={14} /> :
                                rem.type === 'prescription' ? <FileText size={14} /> :
                                  <Bell size={14} />}
                          </div>
                          <div className="min-w-0 leading-tight">
                            <p className="text-[10px] font-bold text-gray-900 truncate">{rem.title}</p>
                            <p className="text-[8px] font-semibold text-gray-400 truncate">{rem.patientName}</p>
                          </div>
                        </div>
                      ))}
                      {reminders.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                          <Bell className="text-gray-200 mb-1" size={18} />
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">No reminders</p>
                        </div>
                      )}
                    </div>
                    <button onClick={() => navigate('/doctor/appointments')} className="mt-2 py-1.5 w-full text-[9px] font-black text-teal-600 uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-teal-50 rounded-md transition-all border border-transparent hover:border-teal-100">
                      View All Reminders <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Today's Scheduled Appointments (Timeline) */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Today's Scheduled Appointments</h2>
                  <button onClick={() => navigate('/doctor/appointments')} className="text-xs font-bold text-teal-600 flex items-center gap-1">
                    View Calendar
                  </button>
                </div>

                <div className="flex gap-12 overflow-x-auto pb-4 scrollbar-hide">
                  {queue.filter(app => app.visitType === 'Appointment').map((app, idx) => (
                    <div key={app._id} className="flex-shrink-0 flex items-start gap-4 relative min-w-[200px]">
                      {idx !== queue.filter(a => a.visitType === 'Appointment').length - 1 && (
                        <div className="absolute left-[10px] top-[24px] w-[calc(100%+48px)] h-[2px] bg-gray-100 -z-10"></div>
                      )}
                      <div className={`w-[22px] h-[22px] rounded-full border-4 border-white shadow-md z-10 mt-0.5 ${app.status === 'In-Consultation' ? 'bg-green-500' :
                        app.status === 'Waiting' ? 'bg-orange-500' :
                          'bg-blue-500'
                        }`}></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">
                          {new Date(app.appointmentDate || app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{app.patientName}</p>
                        <p className="text-[10px] font-medium text-gray-400 mb-3">{app.reason || 'General Consultation'}</p>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${app.status === 'In-Consultation' ? 'bg-green-50 text-green-600' :
                          app.status === 'Waiting' ? 'bg-orange-50 text-orange-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
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