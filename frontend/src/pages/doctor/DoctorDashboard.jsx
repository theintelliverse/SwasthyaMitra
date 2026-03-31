import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import { Activity, Beaker, FileText, Clock, Coffee, Play, CheckCircle, History, ShieldCheck, Circle, Siren, RefreshCw, FlaskConical } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import PatientQuickView from '../../components/PatientQuickView';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const DoctorDashboard = () => {
  const [myQueue, setMyQueue] = useState([]);
  const [scheduledAppointments, setScheduledAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('consultation');
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState([{ name: '', time: '', amount: '', total: '' }]);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditingVitals, setIsEditingVitals] = useState(false);
  const [lastQueueUpdate, setLastQueueUpdate] = useState(Date.now());
  const [editableVitals, setEditableVitals] = useState({
    bloodPressure: '',
    pulseRate: '',
    temperature: '',
    weight: '',
    bmi: ''
  });

  const token = localStorage.getItem('token');
  const clinicId = localStorage.getItem('clinicId');
  const navigate = useNavigate();

  const fetchMyStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsOnBreak(!res.data.data.isAvailable);
      // eslint-disable-next-line no-unused-vars
    } catch (_err) {
      // Status fetch failed, continue silently
    }
  }, [token]);

  const fetchMyQueue = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/queue/my-queue`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sortedQueue = res.data.data.sort((a, b) => {
        if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      setMyQueue(sortedQueue);
      setLastQueueUpdate(Date.now()); // 🔴 Update timestamp for live indicator
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    }
  }, [token, navigate]);

  const fetchScheduledAppointments = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/queue/my-scheduled`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('📅 Scheduled Appointments Fetched:', res.data.data);
      setScheduledAppointments(res.data.data);
    } catch (err) {
      console.error('Failed to fetch scheduled appointments', err);
    }
  }, [token]);

  useEffect(() => {
    fetchMyStatus();
    fetchMyQueue();
    fetchScheduledAppointments();

    if (clinicId) {
      socket.emit('joinClinic', clinicId);
      socket.on('queueUpdate', () => {
        console.log("♻️ [SOCKET] Queue update detected. Syncing...");
        fetchMyQueue();
        fetchScheduledAppointments();
      });
      socket.on('doctorStatusChanged', () => { fetchMyStatus(); });
    }

    // 🔄 Live Queue Polling - Refresh every 5 seconds to ensure real-time updates
    const pollInterval = setInterval(() => {
      fetchMyQueue();
      fetchScheduledAppointments();
    }, 5000);

    return () => {
      socket.off('queueUpdate');
      socket.off('doctorStatusChanged');
      clearInterval(pollInterval);
    };
  }, [token, clinicId, fetchMyQueue, fetchMyStatus, fetchScheduledAppointments]);

  const activePatient = myQueue.find(p => p.status === 'In-Consultation');

  // Helper function to check if appointment date is today
  const isToday = (date) => {
    if (!date) return false;
    const appointmentDate = new Date(date);
    const today = new Date();
    return appointmentDate.toDateString() === today.toDateString();
  };

  // Separating patients who are in the "Primary Waiting" vs "Lab Monitoring"
  // Only show patients with today's appointment date or walk-ins
  const primaryWaitingList = myQueue.filter(p =>
    p.status === 'Waiting' &&
    p.currentStage !== 'Lab-Pending' &&
    p.currentStage !== 'Lab-Completed' &&
    (isToday(p.appointmentDate) || p.visitType === 'Walk-in')
  );
  const labMonitoringList = myQueue.filter(p => p.currentStage === 'Lab-Pending' || p.currentStage === 'Lab-Completed');

  useEffect(() => {
    if (activePatient) {
      const fetchPatientDetails = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/staff/patient-full-profile/${activePatient.patientPhone}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setPatientData(res.data.data);
          // eslint-disable-next-line no-unused-vars
        } catch (_err) {
          // Patient fetch failed, continue silently
        }
      };
      fetchPatientDetails();
    } else { setPatientData(null); }
  }, [activePatient, token]);

  const handleStatusUpdate = async (id, action) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const endpoint = action === 'start' ? 'start' : 'complete';
      // Filter medicines to only include entries with at least name or amount
      const filteredMedicines = medicines.filter(m => (m.name && m.name.trim()) || (m.amount && m.amount.trim()));

      const payload = action === 'complete' ? {
        notes,
        diagnosis,
        medicines: filteredMedicines
      } : {};

      console.log('📤 Sending payload:', payload); // Debug log

      const res = await axios.patch(`${API_URL}/api/queue/${endpoint}/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        if (action === 'complete') {
          setNotes("");
          setDiagnosis("");
          setMedicines([{ name: '', time: '', amount: '', total: '' }]);
          setPatientData(null);
        }
        await fetchMyQueue();
      }
      // eslint-disable-next-line no-unused-vars
    } catch (_err) {
      Swal.fire('Error', 'Action failed', 'error');
    } finally { setIsProcessing(false); }
  };

  const handleReferToLab = async (id) => {
    const { value: testName } = await Swal.fire({
      title: 'Order Lab Diagnostics',
      input: 'text',
      inputPlaceholder: 'e.g., CBC, X-Ray',
      confirmButtonColor: '#1F6FB2',
      showCancelButton: true,
      background: '#EEF6FA'
    });
    if (testName) {
      try {
        await axios.patch(`${API_URL}/api/queue/refer/lab/${id}`, { testName }, { headers: { Authorization: `Bearer ${token}` } });
        fetchMyQueue();
        // eslint-disable-next-line no-unused-vars
      } catch (_err) { Swal.fire('Error', 'Referral failed', 'error'); }
    }
  };

  const handleToggleBreak = async () => {
    try {
      const res = await axios.patch(`${API_URL}/api/staff/toggle-status/me`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIsOnBreak(!res.data.isAvailable);
      // eslint-disable-next-line no-unused-vars
    } catch (_err) { Swal.fire('Error', 'Status toggle failed', 'error'); }
  };

  // Handle editing vitals
  const handleEditVitals = () => {
    if (latestVitals) {
      setEditableVitals({
        bloodPressure: latestVitals.bloodPressure || '',
        pulseRate: latestVitals.pulseRate || '',
        temperature: latestVitals.temperature || '',
        weight: latestVitals.weight || '',
        bmi: latestVitals.bmi || ''
      });
    }
    setIsEditingVitals(true);
  };

  // Save vitals to backend
  const handleSaveVitals = async () => {
    if (!activePatient) {
      Swal.fire('Error', 'No active patient selected', 'error');
      return;
    }

    try {
      // Validate that at least one vital is filled
      const hasData = Object.values(editableVitals).some(v => v && v.toString().trim() !== '');
      if (!hasData) {
        Swal.fire('Warning', 'Please enter at least one vital sign', 'warning');
        return;
      }

      console.log('📤 Saving vitals:', {
        queueId: activePatient._id,
        vitals: editableVitals
      });

      setIsProcessing(true);

      const res = await axios.post(`${API_URL}/api/queue/update-vitals/${activePatient._id}`, editableVitals, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Vitals saved:', res.data);

      Swal.fire({
        icon: 'success',
        title: 'Vitals Updated',
        text: 'Patient vitals have been saved successfully',
        confirmButtonColor: '#FFA800',
        background: '#EEF6FA'
      });

      setIsEditingVitals(false);

      // Refresh patient data
      if (activePatient) {
        const refreshRes = await axios.get(`${API_URL}/api/staff/patient-full-profile/${activePatient.patientPhone}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatientData(refreshRes.data.data);
      }
    } catch (err) {
      console.error('❌ Error saving vitals:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        activePatient: activePatient
      });

      const errorMsg = err.response?.data?.message || err.message || 'Failed to update vitals. Please try again.';

      Swal.fire({
        icon: 'error',
        title: 'Failed to Update Vitals',
        html: `
          <div style="text-align: left; font-size: 14px;">
            <p><strong>Error:</strong> ${errorMsg}</p>
            <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 12px;">
              <p style="margin: 0 0 8px 0; font-weight: bold;">Troubleshooting:</p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Ensure you are logged in as a doctor</li>
                <li>Make sure a patient is in consultation</li>
                <li>Check your internet connection</li>
                <li>Try again or contact support</li>
              </ul>
            </div>
          </div>
        `,
        confirmButtonColor: '#FF6B6B',
        background: '#EEF6FA'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVitalChange = (field, value) => {
    setEditableVitals(prev => ({ ...prev, [field]: value }));
  };

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', time: '', amount: '', total: '' }]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const latestVitals = patientData?.vitals?.[patientData.vitals.length - 1];

  return (
    <div className="flex min-h-screen bg-parchment font-body text-teak flex-col md:flex-row">
      <Sidebar role="doctor" />
      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto">
        <nav className="bg-white border-b border-sandstone px-4 md:px-8 py-3 md:py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-6 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-2 md:gap-6 border-r border-sandstone pr-2 md:pr-6 w-full md:w-auto overflow-x-auto">
            <button onClick={() => setActiveTab('consultation')} className={`px-3 md:px-4 py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 ${activeTab === 'consultation' ? 'bg-teak text-white shadow-lg' : 'text-khaki hover:bg-parchment'}`}>
              💊 Consultation
            </button>
            <button onClick={() => setActiveTab('scheduled')} className={`px-3 md:px-4 py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 md:gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'scheduled' ? 'bg-blue-600 text-white shadow-lg' : 'text-khaki hover:bg-parchment'}`}>
              📅
              <span className="hidden md:inline">Scheduled</span>
              {scheduledAppointments.length > 0 && <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-[7px] md:text-[8px] font-black">{scheduledAppointments.length}</span>}
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
            <button onClick={handleToggleBreak} className={`flex items-center gap-1 md:gap-2 px-3 md:px-5 py-2 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 ${isOnBreak ? 'bg-red-500 text-white shadow-lg' : 'bg-parchment text-khaki border border-sandstone hover:border-marigold'}`}>
              {isOnBreak ? <Play size={12} fill="currentColor" /> : <Coffee size={12} />} <span className="hidden md:inline">{isOnBreak ? 'Resume' : 'Break'}</span>
            </button>
            <p className="text-[8px] md:text-[10px] font-black uppercase text-marigold tracking-widest underline decoration-2 truncate">Dr. {localStorage.getItem('userName') || 'Physician'}</p>
          </div>
        </nav>

        {activeTab === 'consultation' ? (
          <main className="px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
            <div className="lg:col-span-3 space-y-6 md:space-y-8">
              <section>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 md:mb-5">
                  <div className="flex items-center gap-2 md:gap-3">
                    <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-khaki">Active Patient</h2>
                    {activePatient?.isEmergency && <span className="flex items-center gap-1 md:gap-1.5 bg-red-600 text-white px-2 md:px-3 py-1 rounded-full text-[7px] md:text-[8px] font-black uppercase animate-pulse flex-shrink-0"><Siren size={10} /> <span className="hidden md:inline">Emergency</span></span>}
                  </div>
                  {activePatient?.currentStage === 'Lab-Completed' && <span className="bg-green-100 text-green-700 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-black flex items-center gap-1 md:gap-2 border border-green-200 animate-bounce flex-shrink-0"><CheckCircle size={12} /> LAB READY</span>}
                </div>

                {activePatient ? (
                  <div className={`bg-white border p-6 md:p-8 lg:p-10 rounded-2xl md:rounded-3xl lg:rounded-[3.5rem] shadow-2xl relative overflow-hidden transition-all ${activePatient.isEmergency ? 'border-red-500 ring-4 ring-red-50' : 'border-sandstone'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
                      <div className="space-y-6 md:space-y-8">
                        <div><h3 className="text-3xl md:text-4xl lg:text-5xl font-heading mb-2 md:mb-3 text-teak truncate">{activePatient.patientName}</h3><p className="text-khaki font-medium flex items-center gap-3 text-sm md:text-base">Token <span className={`font-black px-3 py-1 rounded-lg text-base md:text-lg ${activePatient.isEmergency ? 'bg-red-600 text-white' : 'bg-marigold/10 text-marigold'}`}>#{activePatient.tokenNumber}</span></p></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                          {!isEditingVitals ? (
                            <>
                              <VitalBox label="BP" value={latestVitals?.bloodPressure} unit="mmHg" />
                              <VitalBox label="Pulse" value={latestVitals?.pulseRate} unit="bpm" />
                              <VitalBox label="Temp" value={latestVitals?.temperature} unit="°C" />
                              <VitalBox label="Weight" value={latestVitals?.weight} unit="kg" />
                              <VitalBox label="BMI" value={latestVitals?.bmi} unit="Score" />
                            </>
                          ) : (
                            <>
                              <div className="space-y-1">
                                <p className="text-[8px] font-black text-khaki uppercase mb-1">BP (mmHg)</p>
                                <input type="text" placeholder="120/80" value={editableVitals.bloodPressure} onChange={(e) => handleVitalChange('bloodPressure', e.target.value)} className="w-full px-2 md:px-3 py-2 border border-sandstone rounded-lg outline-none focus:border-marigold text-xs md:text-sm font-medium" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-[8px] font-black text-khaki uppercase mb-1">Pulse (bpm)</p>
                                <input type="number" min="0" placeholder="72" value={editableVitals.pulseRate} onChange={(e) => handleVitalChange('pulseRate', e.target.value)} className="w-full px-2 md:px-3 py-2 border border-sandstone rounded-lg outline-none focus:border-marigold text-xs md:text-sm font-medium" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-[8px] font-black text-khaki uppercase mb-1">Temp (°C)</p>
                                <input type="number" min="0" step="0.1" placeholder="98.6" value={editableVitals.temperature} onChange={(e) => handleVitalChange('temperature', e.target.value)} className="w-full px-2 md:px-3 py-2 border border-sandstone rounded-lg outline-none focus:border-marigold text-xs md:text-sm font-medium" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-[8px] font-black text-khaki uppercase mb-1">Weight (kg)</p>
                                <input type="number" min="0" step="0.1" placeholder="70" value={editableVitals.weight} onChange={(e) => handleVitalChange('weight', e.target.value)} className="w-full px-2 md:px-3 py-2 border border-sandstone rounded-lg outline-none focus:border-marigold text-xs md:text-sm font-medium" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-[8px] font-black text-khaki uppercase mb-1">BMI</p>
                                <input type="number" min="0" step="0.1" placeholder="24.5" value={editableVitals.bmi} onChange={(e) => handleVitalChange('bmi', e.target.value)} className="w-full px-2 md:px-3 py-2 border border-sandstone rounded-lg outline-none focus:border-marigold text-xs md:text-sm font-medium" />
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col gap-3 md:gap-4">
                          {!isEditingVitals ? (
                            <>
                              <button disabled={isProcessing} onClick={() => handleStatusUpdate(activePatient._id, 'complete')} className="w-full py-4 md:py-5 bg-teak text-white rounded-xl md:rounded-[1.5rem] font-bold text-sm uppercase tracking-widest hover:bg-marigold transition-all shadow-xl disabled:opacity-50">{isProcessing ? 'Processing...' : 'Complete Visit'}</button>
                              <button onClick={handleEditVitals} className="w-full py-2 md:py-3 bg-marigold/20 text-marigold rounded-lg md:rounded-xl font-bold text-xs md:text-sm uppercase tracking-widest border border-marigold/30 hover:bg-marigold/30 transition-all">✏️ Edit Vitals</button>
                              <div className="flex gap-2 md:gap-4"><button onClick={() => handleReferToLab(activePatient._id)} className="flex-1 py-3 md:py-4 bg-marigold/10 text-marigold border border-marigold/20 rounded-lg md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest">Refer to Lab</button><button onClick={() => setShowProfile(true)} className="flex-1 py-3 md:py-4 bg-parchment border border-sandstone text-teak rounded-lg md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest">Health Locker</button></div>
                            </>
                          ) : (
                            <>
                              <button onClick={handleSaveVitals} disabled={isProcessing} className="w-full py-4 md:py-5 bg-green-600 text-white rounded-xl md:rounded-[1.5rem] font-bold text-sm uppercase tracking-widest hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl flex items-center justify-center gap-2">
                                {isProcessing ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="hidden md:inline">Saving...</span>
                                  </>
                                ) : (
                                  <>💾 Save Vitals</>
                                )}
                              </button>
                              <button onClick={() => setIsEditingVitals(false)} className="w-full py-2 md:py-3 bg-gray-300 text-gray-700 rounded-lg md:rounded-xl font-bold text-xs md:text-sm uppercase tracking-widest hover:bg-gray-400 transition-all">Cancel</button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="bg-parchment p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-2xl lg:rounded-[3rem] border border-sandstone shadow-inner space-y-4 md:space-y-6">
                        {/* Diagnosis Box */}
                        <div>
                          <p className="text-[8px] md:text-[9px] font-black text-khaki uppercase mb-1 md:mb-2 tracking-widest">Diagnosis</p>
                          <textarea
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            placeholder="Enter diagnosis details..."
                            className="w-full h-20 md:h-24 bg-white border border-sandstone rounded-xl md:rounded-2xl p-3 md:p-4 outline-none focus:border-marigold text-xs md:text-sm font-medium"
                          />
                        </div>

                        {/* Medicine Details */}
                        <div>
                          <div className="flex justify-between items-center gap-2 mb-2 md:mb-3">
                            <p className="text-[8px] md:text-[9px] font-black text-khaki uppercase tracking-widest">Medicine Details</p>
                            <button
                              onClick={handleAddMedicine}
                              className="text-[8px] md:text-xs font-bold text-marigold hover:text-teak transition-colors px-2 md:px-3 py-1 rounded-lg bg-marigold/10 hover:bg-marigold/20 flex-shrink-0"
                            >
                              + Add
                            </button>
                          </div>
                          <div className="space-y-3 md:space-y-4 max-h-64 md:max-h-80 overflow-y-auto">
                            {medicines.map((medicine, idx) => (
                              <div key={idx} className="bg-gradient-to-br from-yellow-50 to-orange-50 p-3 md:p-4 rounded-lg md:rounded-xl border-2 border-yellow-200 space-y-2 md:space-y-3">
                                <div className="flex justify-between items-start gap-2 mb-1 md:mb-2">
                                  <p className="text-[7px] md:text-[8px] font-black text-marigold uppercase">Med #{idx + 1}</p>
                                  {medicines.length > 1 && (
                                    <button
                                      onClick={() => handleRemoveMedicine(idx)}
                                      className="px-2 py-1 bg-red-100 text-red-600 text-[7px] md:text-xs font-bold rounded-lg hover:bg-red-200 transition-colors flex-shrink-0"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>

                                {/* Medicine Name */}
                                <div>
                                  <label className="text-[7px] md:text-[8px] font-bold text-khaki uppercase block mb-1">Medicine Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g., Amoxicillin"
                                    value={medicine.name}
                                    onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-yellow-300 rounded-lg outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20 text-xs md:text-sm font-medium"
                                  />
                                </div>

                                {/* Time and Amount Grid */}
                                <div className="grid grid-cols-2 gap-2 md:gap-3">
                                  {/* Time */}
                                  <div>
                                    <label className="text-[7px] md:text-[8px] font-bold text-khaki uppercase block mb-1">When</label>
                                    <select
                                      value={medicine.time}
                                      onChange={(e) => handleMedicineChange(idx, 'time', e.target.value)}
                                      className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-yellow-300 rounded-lg outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20 text-xs md:text-sm font-medium bg-white"
                                    >
                                      <option value="">Select</option>
                                      <option value="Morning">Morning</option>
                                      <option value="Afternoon">Afternoon</option>
                                      <option value="Evening">Evening</option>
                                      <option value="Night">Night</option>
                                    </select>
                                  </div>

                                  {/* Per Dose Amount */}
                                  <div>
                                    <label className="text-[7px] md:text-[8px] font-bold text-khaki uppercase block mb-1">Dosage</label>
                                    <input
                                      type="text"
                                      placeholder="500mg"
                                      value={medicine.amount}
                                      onChange={(e) => handleMedicineChange(idx, 'amount', e.target.value)}
                                      className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-yellow-300 rounded-lg outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20 text-xs md:text-sm font-medium"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[8px] font-bold text-khaki uppercase block mb-1">📦 Total Ketli (Total Quantity to Purchase)</label>
                                  <input
                                    type="text"
                                    placeholder="e.g., 30 tablets, 60ml bottle"
                                    value={medicine.total}
                                    onChange={(e) => handleMedicineChange(idx, 'total', e.target.value)}
                                    className="w-full px-3 py-2 border border-yellow-300 rounded-lg outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20 text-sm font-medium"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Consultation Notes */}
                        <div>
                          <p className="text-[9px] font-black text-khaki uppercase mb-2 tracking-widest">Consultation Notes</p>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Consultation notes..."
                            className="w-full h-20 bg-white border border-sandstone rounded-2xl p-4 outline-none focus:border-marigold text-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-dashed border-sandstone p-24 rounded-[4rem] text-center"><p className="font-heading text-2xl text-khaki">{isOnBreak ? 'Duty Halted' : 'Lounge Empty'}</p></div>
                )}
              </section>

              {/* --- NEW SECTION: LAB MONITORING --- */}
              <section className="mt-12">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-khaki">Lab Monitoring Area</h2>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">LIVE</span>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {labMonitoringList.map(p => (
                    <div key={p._id} className={`p-6 rounded-[2.5rem] border bg-white transition-all animate-in duration-300 ${p.currentStage === 'Lab-Completed' ? 'border-green-200 ring-2 ring-green-50' : 'border-sandstone opacity-60'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${p.currentStage === 'Lab-Completed' ? 'bg-green-500 text-white animate-pulse' : 'bg-parchment text-khaki'}`}>
                          {p.currentStage === 'Lab-Completed' ? 'REPORT READY' : 'IN LAB'}
                        </span>
                        <span className="text-[10px] font-heading">#{p.tokenNumber}</span>
                      </div>
                      <p className="font-bold text-sm truncate">{p.patientName}</p>
                      <p className="text-[9px] text-khaki mt-1 italic">{p.requiredTest || 'Diagnostics'}</p>
                      {p.currentStage === 'Lab-Completed' && !activePatient && (
                        <button onClick={() => handleStatusUpdate(p._id, 'start')} className="w-full mt-4 py-2.5 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-teak transition-all">Recall Patient</button>
                      )}
                    </div>
                  ))}
                  {labMonitoringList.length === 0 && (
                    <div className="col-span-full py-8 text-center bg-parchment rounded-3xl border border-dashed border-sandstone">
                      <p className="text-[10px] font-black text-khaki uppercase tracking-widest">No patients currently in Lab</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-sandstone text-center">
                  <p className="text-[8px] text-khaki opacity-60">Last updated: {new Date(lastQueueUpdate).toLocaleTimeString()}</p>
                </div>
              </section>
            </div>

            {/* --- RIGHT SIDE: PRIMARY LIVE QUEUE --- */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-khaki">Waiting Lounge</h2>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">LIVE</span>
                </div>
              </div>
              <div className="space-y-4">
                {primaryWaitingList.map((patient, index) => (
                  <div key={patient._id} className={`p-6 rounded-[2.5rem] border transition-all animate-in duration-300 ${patient.isEmergency ? 'bg-red-50 border-red-600 ring-2 ring-red-200 animate-pulse' : 'bg-white border-sandstone'}`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1"><div className="flex items-center gap-2"><span className={`text-[10px] font-black px-2 py-0.5 rounded ${patient.isEmergency ? 'bg-red-600 text-white' : 'bg-marigold/10 text-marigold'}`}>#{patient.tokenNumber}</span> {patient.isEmergency && <Siren size={12} className="text-red-600" />}</div><p className="font-bold text-sm">{patient.patientName}</p></div>
                      {!activePatient && !isOnBreak && index === 0 && (
                        <button disabled={isProcessing} onClick={() => handleStatusUpdate(patient._id, 'start')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg transition-all ${patient.isEmergency ? 'bg-red-600 text-white' : 'bg-teak text-white hover:bg-marigold'}`}>{isProcessing ? '...' : 'Call'}</button>
                      )}
                    </div>
                  </div>
                ))}
                {primaryWaitingList.length === 0 && (
                  <div className="py-20 text-center opacity-30">
                    <Circle className="mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase">Lounge Empty</p>
                  </div>
                )}
                <div className="pt-4 border-t border-sandstone text-center">
                  <p className="text-[8px] text-khaki opacity-60">Last updated: {new Date(lastQueueUpdate).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          </main>
        ) : (
          <main className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
            {/* --- SCHEDULED APPOINTMENTS VIEW --- */}
            <section>
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-khaki">📅 Scheduled Appointments</h2>
                  <span className="bg-blue-500 text-white text-[8px] font-black px-3 py-1 rounded-full">{scheduledAppointments.length}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">NEXT 7 DAYS</span>
                </div>
              </div>

              <div className="bg-white border border-sandstone rounded-[2.5rem] overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-50 border-b border-blue-200">
                        <th className="px-6 py-4 text-left text-[9px] font-black text-blue-700 uppercase tracking-widest">Patient Name</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-blue-700 uppercase tracking-widest">Appointment Date</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-blue-700 uppercase tracking-widest">Reason</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-blue-700 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduledAppointments.length > 0 ? (
                        scheduledAppointments.map((apt, idx) => (
                          <tr key={apt._id} className={`border-b border-sandstone/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-parchment/20'} hover:bg-blue-50/50`}>
                            <td className="px-6 py-4 font-bold text-teak text-sm">{apt.patientName}</td>
                            <td className="px-6 py-4 text-[9px] text-khaki font-medium">
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-black">
                                  {new Date(apt.appointmentDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: '2-digit' })}
                                </span>
                                {new Date(apt.appointmentDate).toDateString() === new Date().toDateString() && (
                                  <span className="bg-green-100 text-green-700 px-2 py-1 text-[8px] font-black rounded uppercase">TODAY</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-khaki">
                              <span className="italic">{apt.reason || apt.consultationReason || '--'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${apt.isApproved
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                                }`}>
                                {apt.isApproved ? '✓ Confirmed' : '⏱ Pending'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center">
                            <p className="text-[10px] font-black text-khaki uppercase tracking-widest opacity-60">No scheduled appointments in next 7 days</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </main>
        )}
      </div>
      {showProfile && activePatient && <PatientQuickView phone={activePatient.patientPhone} onClose={() => setShowProfile(false)} />}
    </div>
  );
};

const VitalBox = ({ label, value, unit }) => (
  <div className="bg-parchment p-5 rounded-3xl border border-sandstone/50"><p className="text-[9px] font-black text-khaki uppercase mb-1">{label}</p><p className="font-bold text-sm text-teak">{value || '--'} <span className="text-[8px] opacity-50">{unit}</span></p></div>
);

export default DoctorDashboard;