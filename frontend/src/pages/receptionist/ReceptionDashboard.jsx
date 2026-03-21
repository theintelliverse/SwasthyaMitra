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
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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
      const [queueRes, staffRes, pendingRes] = await Promise.all([
        axios.get(`${API_URL}/api/queue/live`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/staff/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/queue/pending`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setQueue(queueRes.data.data);
      setDoctors(staffRes.data.staff.filter(s => s.role === 'doctor'));
      setPendingRequests(pendingRes.data.data);
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

    return () => {
      socket.off('queueUpdate');
      socket.off('doctorStatusChanged');
      socket.off('newCheckInRequest');
      socket.off('connect');
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
        await axios.patch(`${API_URL}/api/staff/update-patient-vitals/${patientPhone}`,
          { vitals: formValues },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({ icon: 'success', title: 'Vitals Synced', timer: 1500, showConfirmButton: false });
      } catch (err) {
        Swal.fire('Error', 'Failed to update vitals', 'error');
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
    <div className="flex min-h-screen bg-parchment font-body text-teak">
      <Sidebar role="receptionist" />
      <div className="flex-grow flex flex-col h-screen overflow-hidden">
        <nav className="bg-white border-b border-sandstone px-8 py-4 flex justify-between items-center shadow-sm z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teak rounded-xl flex items-center justify-center text-white shadow-lg"><LayoutDashboard size={20} /></div>
            <h1 className="font-heading text-xl">Reception Command</h1>
          </div>
          <div className="flex bg-parchment p-1 rounded-2xl border border-sandstone">
            <button onClick={() => setActiveTab('live')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'live' ? 'bg-marigold text-white shadow-md' : 'text-khaki'}`}>Active Hub</button>
            <button onClick={() => setActiveTab('pending')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'pending' ? 'bg-marigold text-white shadow-md' : 'text-khaki'}`}>
              Requests
              {pendingRequests.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] border-2 border-white animate-bounce">{pendingRequests.length}</span>}
            </button>
          </div>
        </nav>

        <main className="p-6 lg:p-8 grid lg:grid-cols-4 gap-8 flex-grow overflow-y-auto">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-sandstone p-6 rounded-[2.5rem] shadow-sm">
              <h2 className="font-heading text-lg mb-6 flex items-center gap-2"><Stethoscope size={18} className="text-marigold" /> Doctor Status</h2>
              <div className="space-y-4">
                {doctors.map(doc => {
                  const status = getDoctorLiveStatus(doc._id);
                  return (
                    <div key={doc._id} className="p-4 rounded-3xl border border-sandstone bg-parchment group hover:border-marigold transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-sm">Dr. {doc.name}</p>
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 ${status.bg} ${status.color}`}>{status.icon} {status.label}</span>
                      </div>
                      <p className="text-[10px] text-khaki font-medium italic">{doc.specialization}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={`p-8 rounded-[3rem] shadow-xl transition-all duration-500 ${formData.isEmergency ? 'bg-red-600 ring-4 ring-red-200' : 'bg-teak'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-heading text-xl text-white">{formData.isEmergency ? 'Emergency Entry' : 'Walk-in Entry'}</h3>
                {formData.isEmergency && <Siren size={24} className="text-white animate-bounce" />}
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <input type="text" required placeholder="Patient Name" className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-marigold placeholder:text-white/40" value={formData.patientName} onChange={(e) => setFormData({ ...formData, patientName: e.target.value })} />
                <input type="tel" required placeholder="Phone Number" className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-marigold placeholder:text-white/40" value={formData.patientPhone} onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })} />
                <select required className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-marigold" value={formData.doctorId} onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}>
                  <option value="" className="text-black">Assign Doctor</option>
                  {doctors.map(d => <option key={d._id} value={d._id} className="text-black">Dr. {d.name} {!d.isAvailable ? '(On Break)' : ''}</option>)}
                </select>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-black uppercase text-white tracking-widest">Mark Emergency?</span>
                  <button type="button" onClick={() => setFormData({ ...formData, isEmergency: !formData.isEmergency })} className={`w-12 h-6 rounded-full relative transition-all ${formData.isEmergency ? 'bg-red-500' : 'bg-white/20'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isEmergency ? 'left-7' : 'left-1'}`}></div></button>
                </div>
                <button disabled={isProcessing} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all ${formData.isEmergency ? 'bg-white text-red-600' : 'bg-marigold text-white'} disabled:opacity-50`}>{isProcessing ? 'Processing...' : formData.isEmergency ? '🚨 Process Immediate' : 'Generate Token'}</button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white border border-sandstone rounded-[3.5rem] overflow-hidden shadow-sm flex flex-col h-full">
              <div className="px-10 py-8 border-b border-sandstone flex flex-col md:flex-row justify-between md:items-center gap-4 bg-parchment/30">
                <h3 className="font-heading text-2xl text-teak">{activeTab === 'live' ? 'Live Flow' : 'External Requests'}</h3>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-khaki" />
                  <input type="text" placeholder="Search patients..." className="pl-11 pr-4 py-3 bg-white border border-sandstone rounded-2xl text-xs outline-none focus:border-marigold w-full md:w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-parchment border-b border-sandstone text-[9px] font-black uppercase tracking-[0.2em] text-khaki">
                    <tr>
                      <th className="px-10 py-5">TOKEN</th>
                      <th className="px-10 py-5">PATIENT INFO</th>
                      <th className="px-10 py-5 text-center">CURRENT STATUS</th>
                      <th className="px-10 py-5 text-right">OPERATIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#AFC4D8]/30">
                    {activeTab === 'live' ? (
                      queue.filter(p => p.patientName.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => a.isEmergency === b.isEmergency ? 0 : a.isEmergency ? -1 : 1).map((p) => (
                        <tr key={p._id} className={`${p.isEmergency ? 'bg-red-50/50' : ''} hover:bg-parchment/50 transition-colors`}>
                          <td className="px-10 py-6">
                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border shadow-sm ${p.isEmergency ? 'border-red-600 bg-red-600 text-white' : 'border-sandstone bg-white'}`}><span className={`text-[8px] font-black uppercase ${p.isEmergency ? 'text-white' : 'text-khaki'}`}>TK</span><span className="font-heading text-xl">{p.tokenNumber}</span></div>
                          </td>
                          <td className="px-10 py-6">
                            <p className={`font-bold ${p.isEmergency ? 'text-red-700' : 'text-teak'}`}>{p.patientName}</p>
                            <p className="text-[10px] text-khaki font-bold">Assigned: Dr. {p.doctorId?.name}</p>
                            {p.isEmergency && <span className="text-[8px] font-black text-red-600 animate-pulse block mt-1 uppercase tracking-tighter">🚨 High Priority</span>}
                          </td>
                          <td className="px-10 py-6 text-center"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${p.status === 'In-Consultation' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-parchment text-khaki border-sandstone'}`}>{p.status.replace('-', ' ')}</span></td>
                          <td className="px-10 py-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleAddVitals(p.patientPhone)} className="p-3 bg-white border border-sandstone rounded-xl text-khaki hover:text-marigold transition-all shadow-sm"><Activity size={16} /></button>
                              <button onClick={() => handleCopyTracker(p._id)} className="p-3 bg-teak rounded-xl text-white hover:bg-marigold transition-all shadow-lg"><UserCheck size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      pendingRequests.map((req) => (
                        <tr key={req._id} className="hover:bg-parchment/50 animate-in fade-in">
                          <td className="px-10 py-8"><p className="font-bold text-lg text-teak">{req.patientName}</p><span className="text-[8px] font-black uppercase bg-teak text-white px-2 py-0.5 rounded">Pending Approval</span></td>
                          <td className="px-10 py-8 text-xs text-khaki font-bold">{req.patientPhone}</td>
                          <td className="px-10 py-8 text-center"><span className="text-[10px] font-black text-marigold uppercase tracking-widest">Awaiting Verification</span></td>
                          <td className="px-10 py-8 text-right flex justify-end gap-3">
                            <button disabled={isProcessing} onClick={() => handleApprove(req._id)} className="flex items-center gap-2 px-6 py-3 bg-marigold text-white rounded-2xl text-[9px] font-black uppercase shadow-lg hover:scale-105 transition-all disabled:opacity-50">{isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <UserCheck size={14} />} Approve</button>
                            <button className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 transition-all"><XCircle size={18} /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default ReceptionDashboard;