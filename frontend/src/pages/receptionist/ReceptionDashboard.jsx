import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import {
  User, Phone, Stethoscope, AlertCircle, Clipboard,
  Beaker, Activity, UserCheck, XCircle, Coffee,
  CheckCircle2, Users, LayoutDashboard, Search, Siren, RefreshCw, Copy, Link
} from 'lucide-react';
import Footer from '../../components/Footer';
import Sidebar from '../../components/Sidebar';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const ReceptionDashboard = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [scheduledAppointments, setScheduledAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastQueueUpdate, setLastQueueUpdate] = useState(Date.now());

  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    doctorId: '',
    visitType: 'Walk-in',
    isEmergency: false
  });

  const token = localStorage.getItem('token');
  const clinicId = localStorage.getItem('clinicId');

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [queueRes, staffRes, pendingRes, scheduledRes] = await Promise.all([
        axios.get(`${API_URL}/api/queue/live`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/staff/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/queue/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/queue/scheduled/next-7-days`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setQueue(queueRes.data.data);
      setDoctors(staffRes.data.staff.filter(s => s.role === 'doctor'));
      setPendingRequests(pendingRes.data.data);
      setScheduledAppointments(scheduledRes.data.data);
      setLastQueueUpdate(Date.now()); // 🔴 Update timestamp for live indicator
      setLoading(false);
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
      setLoading(false);
    }
  };

  // 🔌 WebSocket Lifecycle with Debugging
  useEffect(() => {
    fetchDashboardData();

    if (clinicId) {
      console.log("🔌 Attempting to join Socket Room:", clinicId);
      socket.emit('joinClinic', clinicId);

      socket.on('connect', () => {
        console.log("✅ Socket Connected to Server. ID:", socket.id);
      });

      socket.on('queueUpdate', () => {
        console.log("♻️ Socket Event: queueUpdate received");
        fetchDashboardData(true);
      });

      socket.on('doctorStatusChanged', (data) => {
        console.log("🩺 Socket Event: doctorStatusChanged received", data);
        fetchDashboardData(true);
      });

      socket.on('newCheckInRequest', (data) => {
        console.log("🆕 Socket Event: newCheckInRequest received");
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: data.message,
          showConfirmButton: false,
          timer: 3000
        });
        fetchDashboardData(true);
      });
    } else {
      console.warn("⚠️ clinicId missing from LocalStorage. Socket Room not joined.");
    }

    // 🔄 Live Queue Polling - Refresh every 5 seconds to ensure real-time updates
    const pollInterval = setInterval(() => {
      fetchDashboardData(true);
    }, 5000);

    return () => {
      socket.off('queueUpdate');
      socket.off('doctorStatusChanged');
      socket.off('newCheckInRequest');
      socket.off('connect');
      clearInterval(pollInterval);
    };
  }, [token, clinicId]);

  // --- 🛠️ OPERATION: ADD VITALS ---
  const handleAddVitals = async (patientPhone) => {
    const { value: formValues } = await Swal.fire({
      title: 'Update Patient Vitals',
      background: '#EEF6FA',
      html:
        `<input id="swal-bp" class="swal2-input" placeholder="Blood Pressure (e.g. 120/80)">` +
        `<input id="swal-pulse" class="swal2-input" placeholder="Pulse Rate (bpm)">` +
        `<input id="swal-temp" class="swal2-input" placeholder="Temperature (°F)">` +
        `<input id="swal-sugar" class="swal2-input" placeholder="Sugar Level (mg/dL)">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#1F6FB2',
      preConfirm: () => {
        return {
          bloodPressure: document.getElementById('swal-bp').value,
          pulseRate: document.getElementById('swal-pulse').value,
          temperature: document.getElementById('swal-temp').value,
          sugarLevel: document.getElementById('swal-sugar').value
        }
      }
    });

    if (formValues) {
      try {
        // Validate that at least one field is filled
        const hasData = Object.values(formValues).some(v => v && v.trim() !== '');
        if (!hasData) {
          Swal.fire('Warning', 'Please enter at least one vital sign', 'warning');
          return;
        }

        console.log('📤 Sent vitals to API:', {
          phone: patientPhone,
          vitals: formValues
        });

        const res = await axios.patch(`${API_URL}/api/staff/update-patient-vitals/${patientPhone}`,
          { vitals: formValues },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('✅ Vitals saved successfully:', res.data);

        Swal.fire({
          icon: 'success',
          title: 'Vitals Synced',
          text: 'Patient vitals have been updated successfully',
          timer: 1500,
          showConfirmButton: false,
          background: '#EEF6FA'
        });
      } catch (err) {
        console.error('❌ Error updating vitals:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          phone: patientPhone
        });

        const errorMsg = err.response?.data?.message || err.message || 'Failed to update vitals';

        Swal.fire({
          icon: 'error',
          title: 'Failed to Update Vitals',
          html: `
            <div style="text-align: left; font-size: 14px;">
              <p><strong>Error:</strong> ${errorMsg}</p>
              <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 12px;">
                <p style="margin: 0 0 8px 0; font-weight: bold;">Troubleshooting:</p>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Check your internet connection</li>
                  <li>Verify the patient exists in the system</li>
                  <li>Ensure your authentication is valid</li>
                  <li>Try again or contact support</li>
                </ul>
              </div>
            </div>
          `,
          background: '#EEF6FA',
          confirmButtonColor: '#FF6B6B'
        });
      }
    }
  };

  // --- 🛠️ OPERATION: COPY TRACKING LINK ---
  const handleCopyTracker = (queueId) => {
    const trackingLink = `${window.location.origin}/patient/status?id=${queueId}`;
    navigator.clipboard.writeText(trackingLink);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Tracking Link Copied',
      showConfirmButton: false,
      timer: 2000
    });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await axios.post(`${API_URL}/api/queue/add`, formData, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        Swal.fire({ icon: formData.isEmergency ? 'warning' : 'success', title: formData.isEmergency ? 'Emergency Token Issued' : 'Token Generated', text: `${formData.patientName} is now in queue.`, timer: 2000, showConfirmButton: false, background: '#EEF6FA' });
        setFormData({ patientName: '', patientPhone: '', doctorId: '', visitType: 'Walk-in', isEmergency: false });
        await fetchDashboardData(true);
      }
    } catch (err) { Swal.fire('Error', 'Registration failed', 'error'); } finally { setIsProcessing(false); }
  };

  const handleApprove = async (id) => {
    if (isProcessing) return;
    const { value: emergencyStatus } = await Swal.fire({ title: 'Assign Priority?', text: "Is this a critical emergency case?", icon: 'question', showCancelButton: true, confirmButtonText: '🚨 Yes, Emergency', cancelButtonText: 'Standard Visit', confirmButtonColor: '#d33', cancelButtonColor: '#1F6FB2', background: '#EEF6FA' });
    const isEmergency = emergencyStatus === true;
    setIsProcessing(true);
    try {
      const res = await axios.patch(`${API_URL}/api/queue/approve/${id}`, { isEmergency }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        await fetchDashboardData(true);
        if (activeTab === 'pending' && pendingRequests.length <= 1) setActiveTab('live');
      }
    } catch (err) { Swal.fire('Error', 'Approval failed', 'error'); } finally { setIsProcessing(false); }
  };

  const getDoctorLiveStatus = (docId) => {
    const doc = doctors.find(d => d._id === docId);
    const activePatient = queue.find(p => p.doctorId?._id === docId && p.status === 'In-Consultation');
    const waitingCount = queue.filter(p => p.doctorId?._id === docId && p.status === 'Waiting').length;
    if (doc && !doc.isAvailable) return { label: 'On Break', color: 'text-red-500', bg: 'bg-red-50', icon: <Coffee size={14} /> };
    if (activePatient) return { label: `Treating: ${activePatient.patientName}`, color: 'text-marigold', bg: 'bg-marigold/10', icon: <Activity size={14} />, waiting: waitingCount };
    return { label: 'Available', color: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle2 size={14} /> };
  };

  return (
    <div className="flex min-h-screen bg-parchment font-body text-teak flex-col md:flex-row">
      <Sidebar role="receptionist" />
      <div className="flex-grow flex flex-col min-h-screen overflow-hidden">
        <nav className="bg-white border-b border-sandstone px-4 md:px-8 py-3 md:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 shadow-sm z-20">
          <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
            <div className="w-9 md:w-10 h-9 md:h-10 bg-teak rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0"><LayoutDashboard size={18} /></div>
            <h1 className="font-heading text-base md:text-xl">Reception</h1>
          </div>
          <div className="flex bg-parchment p-1 rounded-xl md:rounded-2xl border border-sandstone w-full sm:w-auto overflow-x-auto">
            <button onClick={() => setActiveTab('live')} className={`px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 ${activeTab === 'live' ? 'bg-marigold text-white shadow-md' : 'text-khaki'}`}>Active</button>
            <button onClick={() => setActiveTab('pending')} className={`px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex-shrink-0 ${activeTab === 'pending' ? 'bg-marigold text-white shadow-md' : 'text-khaki'}`}>
              Requests
              {pendingRequests.length > 0 && <span className="absolute -top-1 -right-1 w-4 md:w-5 h-4 md:h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[7px] md:text-[9px] border-2 border-white animate-bounce">{pendingRequests.length}</span>}
            </button>
            <button onClick={() => setActiveTab('scheduled')} className={`px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex-shrink-0 ${activeTab === 'scheduled' ? 'bg-marigold text-white shadow-md' : 'text-khaki'}`}>
              📅 Next
              {scheduledAppointments.length > 0 && <span className="absolute -top-1 -right-1 w-4 md:w-5 h-4 md:h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[7px] md:text-[9px] border-2 border-white">{scheduledAppointments.length}</span>}
            </button>
          </div>
        </nav>

        <main className="px-4 md:px-6 lg:px-8 py-4 md:py-6 grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 flex-grow overflow-y-auto">
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <div className="bg-white border border-sandstone p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-sm">
              <h2 className="font-heading text-base md:text-lg mb-3 md:mb-6 flex items-center gap-2"><Stethoscope size={16} className="text-marigold flex-shrink-0" /> <span className="truncate">Doctor Status</span></h2>
              <div className="space-y-3 md:space-y-4 max-h-96 overflow-y-auto">
                {doctors.map(doc => {
                  const status = getDoctorLiveStatus(doc._id);
                  return (
                    <div key={doc._id} className="p-3 md:p-4 rounded-2xl md:rounded-3xl border border-sandstone bg-parchment group hover:border-marigold transition-all">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <p className="font-bold text-xs md:text-sm truncate">Dr. {doc.name}</p>
                        <span className={`px-2 py-1 rounded-lg text-[7px] md:text-[8px] font-black uppercase flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${status.bg} ${status.color}`}>{status.icon} <span className="hidden md:inline">{status.label}</span></span>
                      </div>
                      <p className="text-[8px] md:text-[10px] text-khaki font-medium italic truncate">{doc.specialization}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={`p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl lg:rounded-[3rem] shadow-xl transition-all duration-500 ${formData.isEmergency ? 'bg-red-600 ring-4 ring-red-200' : 'bg-teak'}`}>
              <div className="flex justify-between items-center gap-2 mb-3 md:mb-6">
                <h3 className="font-heading text-base md:text-xl text-white truncate">{formData.isEmergency ? '🚨 Emergency' : 'Walk-in Entry'}</h3>
                {formData.isEmergency && <Siren size={20} className="text-white animate-bounce flex-shrink-0" />}
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-2 md:space-y-4">
                <input type="text" required placeholder="Patient Name" className="w-full bg-white/10 border border-white/10 rounded-xl md:rounded-2xl px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-white outline-none focus:border-marigold placeholder:text-white/40" value={formData.patientName} onChange={(e) => setFormData({ ...formData, patientName: e.target.value })} />
                <input type="tel" required placeholder="Phone" className="w-full bg-white/10 border border-white/10 rounded-xl md:rounded-2xl px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-white outline-none focus:border-marigold placeholder:text-white/40" value={formData.patientPhone} onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })} />
                <select required className="w-full bg-white/10 border border-white/10 rounded-xl md:rounded-2xl px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-white outline-none focus:border-marigold" value={formData.doctorId} onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}>
                  <option value="" className="text-black">Assign Doctor</option>
                  {doctors.map(d => <option key={d._id} value={d._id} className="text-black">Dr. {d.name} {!d.isAvailable ? '(Break)' : ''}</option>)}
                </select>
                <div className="flex items-center justify-between p-2 md:p-3 bg-white/5 rounded-xl md:rounded-2xl border border-white/10">
                  <span className="text-[8px] md:text-[10px] font-black uppercase text-white tracking-widest truncate">Emergency?</span>
                  <button type="button" onClick={() => setFormData({ ...formData, isEmergency: !formData.isEmergency })} className={`w-10 md:w-12 h-5 md:h-6 rounded-full relative transition-all flex-shrink-0 ${formData.isEmergency ? 'bg-red-500' : 'bg-white/20'}`}><div className={`absolute top-0.5 md:top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isEmergency ? 'left-5 md:left-7' : 'left-0.5 md:left-1'}`}></div></button>
                </div>
                <button disabled={isProcessing} className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all ${formData.isEmergency ? 'bg-white text-red-600' : 'bg-marigold text-white'} disabled:opacity-50`}>{isProcessing ? 'Processing...' : formData.isEmergency ? '🚨 Process' : 'Token'}</button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-3 md:space-y-6">
            <div className="bg-white border border-sandstone rounded-2xl md:rounded-3xl lg:rounded-[3.5rem] overflow-hidden shadow-sm flex flex-col h-full min-h-96">
              <div className="px-4 md:px-6 lg:px-10 py-4 md:py-6 lg:py-8 border-b border-sandstone flex flex-col gap-3 md:gap-0 md:flex-row justify-between md:items-center bg-parchment/30">
                <div className="flex items-center justify-between gap-2 md:gap-4">
                  <h3 className="font-heading text-base md:text-2xl text-teak truncate">{activeTab === 'live' ? 'Live' : activeTab === 'pending' ? 'Requests' : 'Next 7 Days'}</h3>
                  {activeTab === 'live' && (
                    <div className="flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-green-50 rounded-full border border-green-200 flex-shrink-0">
                      <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[7px] md:text-[8px] font-black text-green-600 uppercase tracking-widest">LIVE</span>
                    </div>
                  )}
                </div>
                <div className="relative w-full md:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-khaki flex-shrink-0" />
                  <input type="text" placeholder="Search..." className="pl-9 md:pl-11 pr-3 md:pr-4 py-2 md:py-3 bg-white border border-sandstone rounded-lg md:rounded-2xl text-[8px] md:text-xs outline-none focus:border-marigold w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="overflow-x-auto flex-grow">
                <table className="w-full text-left text-[8px] md:text-xs">
                  <thead className="bg-parchment border-b border-sandstone text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] text-khaki sticky top-0">
                    <tr>
                      <th className="px-3 md:px-10 py-3 md:py-5">Token</th>
                      <th className="px-3 md:px-10 py-3 md:py-5 hidden md:table-cell">Patient</th>
                      <th className="px-3 md:px-10 py-3 md:py-5 text-center hidden lg:table-cell">Status</th>
                      <th className="px-3 md:px-10 py-3 md:py-5 text-right">Ops</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#AFC4D8]/30">
                    {activeTab === 'live' ? (
                      queue.filter(p => p.patientName.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => a.isEmergency === b.isEmergency ? 0 : a.isEmergency ? -1 : 1).map((p) => (
                        <tr key={p._id} className={`${p.isEmergency ? 'bg-red-50/50' : ''} hover:bg-parchment/50 transition-colors animate-in duration-300`}>
                          <td className="px-3 md:px-10 py-3 md:py-6">
                            <div className={`w-10 md:w-14 h-10 md:h-14 rounded-lg md:rounded-2xl flex flex-col items-center justify-center border shadow-sm text-[7px] md:text-[8px] ${p.isEmergency ? 'border-red-600 bg-red-600 text-white' : 'border-sandstone bg-white'}`}><span className={`font-black uppercase ${p.isEmergency ? 'text-white' : 'text-khaki'}`}>TK</span><span className="font-heading text-lg md:text-xl">{p.tokenNumber}</span></div>
                          </td>
                          <td className="px-3 md:px-10 py-3 md:py-6 hidden md:table-cell">
                            <div>
                              <p className={`font-bold text-xs md:text-sm truncate ${p.isEmergency ? 'text-red-700' : 'text-teak'}`}>{p.patientName}</p>
                              <p className="text-[8px] md:text-[10px] text-khaki font-bold truncate">Dr. {p.doctorId?.name}</p>
                            </div>
                          </td>
                          <td className="px-3 md:px-10 py-3 md:py-6 text-center hidden lg:table-cell"><span className={`px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-tighter border inline-block ${p.status === 'In-Consultation' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-parchment text-khaki border-sandstone'}`}>{p.status === 'In-Consultation' ? 'Active' : p.status}</span></td>
                          <td className="px-3 md:px-10 py-3 md:py-6 text-right">
                            <div className="flex justify-end gap-1 md:gap-2">
                              <button onClick={() => handleAddVitals(p.patientPhone)} className="p-1.5 md:p-3 bg-white border border-sandstone rounded-lg md:rounded-xl text-khaki hover:text-marigold transition-all shadow-sm flex-shrink-0" title="Add Vitals"><Activity size={14} /></button>
                              <button onClick={() => handleCopyTracker(p._id)} className="p-1.5 md:p-3 bg-teak rounded-lg md:rounded-xl text-white hover:bg-marigold transition-all shadow-lg flex-shrink-0" title="Copy Link"><UserCheck size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : activeTab === 'pending' ? (
                      pendingRequests.map((req) => (
                        <tr key={req._id} className="hover:bg-parchment/50 animate-in fade-in">
                          <td className="px-3 md:px-10 py-4 md:py-8">
                            <p className="font-bold text-xs md:text-lg text-teak truncate">{req.patientName}</p>
                            <span className={`text-[7px] md:text-[8px] font-black uppercase px-2 py-0.5 rounded inline-block mt-1 ${req.visitType === 'Appointment' ? 'bg-blue-100 text-blue-700' : 'bg-teak text-white'}`}>
                              {req.visitType === 'Appointment' ? '📅' : 'Walk-in'}
                            </span>
                          </td>
                          <td className="px-3 md:px-10 py-4 md:py-8 text-[8px] md:text-xs text-khaki font-bold hidden md:table-cell">
                            <p className="truncate">{req.patientPhone}</p>
                            {req.visitType === 'Appointment' && req.appointmentDate && (
                              <p className="text-[7px] md:text-[10px] text-marigold font-black mt-1">
                                {new Date(req.appointmentDate).toLocaleDateString('en-IN')}
                              </p>
                            )}
                          </td>
                          <td className="px-3 md:px-10 py-4 md:py-8 text-center hidden lg:table-cell">
                            <span className="text-[7px] md:text-[10px] font-black text-marigold uppercase tracking-widest block">Verify</span>
                          </td>
                          <td className="px-3 md:px-10 py-4 md:py-8 text-right flex justify-end gap-1 md:gap-3">
                            <button disabled={isProcessing} onClick={() => handleApprove(req._id)} className="flex items-center gap-1 md:gap-2 px-2 md:px-6 py-2 md:py-3 bg-marigold text-white rounded-lg md:rounded-2xl text-[7px] md:text-[9px] font-black uppercase shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex-shrink-0 whitespace-nowrap">{isProcessing ? <RefreshCw size={12} className="animate-spin" /> : <UserCheck size={12} />} <span className="hidden md:inline">Approve</span></button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      scheduledAppointments.filter(apt => apt.patientName.toLowerCase().includes(searchTerm.toLowerCase())).map((apt) => (
                        <tr key={apt._id} className="hover:bg-blue-50/30 transition-colors animate-in">
                          <td className="px-3 md:px-10 py-3 md:py-6">
                            <div className="w-10 md:w-14 h-10 md:h-14 rounded-lg md:rounded-2xl flex flex-col items-center justify-center border border-blue-200 shadow-sm bg-blue-50 text-[8px] md:text-base">
                              <span className="font-heading text-blue-600">{apt.appointmentDate ? new Date(apt.appointmentDate).getDate() : '-'}</span>
                            </div>
                          </td>
                          <td className="px-3 md:px-10 py-3 md:py-6 hidden md:table-cell">
                            <p className="font-bold text-xs md:text-sm text-teak truncate">{apt.patientName}</p>
                            <p className="text-[8px] md:text-[10px] text-khaki font-bold">{apt.patientPhone}</p>
                          </td>
                          <td className="px-3 md:px-10 py-3 md:py-6 hidden lg:table-cell">
                            <p className="text-xs md:text-sm font-bold text-teak truncate">Dr. {apt.doctorId?.name}</p>
                            <p className="text-[8px] md:text-[10px] text-blue-600 font-black mt-1 uppercase">{apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString('en-IN') : 'N/A'}</p>
                          </td>
                          <td className="px-3 md:px-10 py-3 md:py-6 text-center">
                            <span className={`px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-tighter border inline-block ${apt.status === 'Waiting' ? 'bg-blue-100 text-blue-700 border-blue-200' : apt.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                              {apt.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {activeTab === 'live' && (
                <div className="px-4 md:px-10 py-2 md:py-4 border-t border-sandstone bg-parchment/20 text-center text-[8px] md:text-xs text-khaki opacity-60">
                  Last updated: {new Date(lastQueueUpdate).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default ReceptionDashboard;