import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import { Clock, ShieldCheck, Lock, XCircle, ArrowRight, UserCheck, RefreshCw, RefreshCcw } from 'lucide-react';
import Footer from '../../components/Footer';
const API_URL = import.meta.env.VITE_API_URL;
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const PatientStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queueId = searchParams.get('id');
  const [status, setStatus] = useState(null);
  const [clinicId, setClinicId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsSyncing(true);

    try {
      const res = await axios.get(`${API_URL}/api/queue/public/status/${queueId}`);

      if (res.data.isCompleted) {
        setIsCompleted(true);
      } else if (res.data.isPendingApproval) {
        setIsPending(true);
      } else {
        setIsPending(false);
        setStatus(res.data.data);

        const incomingClinicId = res.data.data.clinicId?._id || res.data.data.clinicId;
        if (incomingClinicId && incomingClinicId !== clinicId) {
          setClinicId(incomingClinicId.toString());
        }
      }
      setLoading(false);
    } catch {
      setLoading(false);
    } finally {
      setTimeout(() => setIsSyncing(false), 1000);
    }
  }, [queueId, clinicId]);

  // 🔌 WebSocket Lifecycle: Listeners
  useEffect(() => {
    fetchStatus();

    socket.on('queueUpdate', () => {
      fetchStatus(true);
    });

    socket.on('doctorStatusChanged', () => {
      fetchStatus(true);
    });

    return () => {
      socket.off('queueUpdate');
      socket.off('doctorStatusChanged');
    };
  }, [fetchStatus]);

  // 🔌 WebSocket Lifecycle: Room Joining
  useEffect(() => {
    if (queueId) {
      socket.emit('joinClinic', queueId.toString());
    }

    if (clinicId) {
      socket.emit('joinClinic', clinicId);
    }
  }, [queueId, clinicId]);

  const handleCancel = () => {
    Swal.fire({
      title: 'Cancel Request?',
      text: "This will remove your check-in request.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0F766E',
      cancelButtonColor: '#AFC4D8',
      confirmButtonText: 'Yes, Cancel',
      background: '#EEF6FA',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_URL}/api/queue/public/cancel/${queueId}`);
          navigate('/');
        } catch {
          Swal.fire('Error', 'Could not cancel.', 'error');
        }
      }
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center gap-4">
      <RefreshCw size={32} className="text-marigold animate-spin" />
      <div className="font-heading text-xl text-teak">Syncing with Clinic...</div>
    </div>
  );

  if (isPending) return (
    <div className="min-h-screen bg-parchment font-body text-teak flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white border-2 border-sandstone p-10 rounded-[3.5rem] shadow-2xl max-w-sm w-full relative overflow-hidden">
        <div className="w-20 h-20 bg-marigold/10 text-marigold rounded-3xl flex items-center justify-center mx-auto mb-6">
          <UserCheck size={40} className="animate-bounce" />
        </div>
        <h1 className="text-2xl font-heading mb-3">Verification Done</h1>
        <p className="text-khaki text-xs font-medium mb-8 leading-relaxed">
          Your request is with the receptionist. Stay on this page—your token number will appear here automatically.
        </p>
        <button onClick={() => fetchStatus(true)} className="flex items-center justify-center gap-2 mx-auto mb-4 px-4 py-2 bg-parchment border border-sandstone rounded-full text-[10px] font-black uppercase tracking-widest text-marigold">
          <RefreshCcw size={14} className={isSyncing ? 'animate-spin' : ''} /> Manual Sync
        </button>
        <button onClick={handleCancel} className="mt-10 text-[9px] font-black uppercase text-khaki/40 hover:text-red-500 transition-colors">
          Cancel Request ✕
        </button>
      </div>
    </div>
  );

  if (isCompleted || (!status && !loading)) return (
    <div className="min-h-screen bg-parchment font-body text-teak flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white border-4 border-marigold p-10 rounded-[3.5rem] shadow-2xl max-w-sm w-full">
        <div className="text-6xl mb-6">🏥</div>
        <h1 className="text-3xl font-heading mb-4">Visit Complete</h1>
        <p className="text-khaki text-sm font-medium mb-8">Consultation finished. Access prescriptions and reports in your locker.</p>
        <button onClick={() => navigate('/patient/login')} className="w-full py-5 bg-teak text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-marigold transition-all">
          Unlock Health Locker <Lock size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-parchment font-body text-teak flex flex-col items-center">
      <div className="flex-grow w-full max-w-md px-6 py-12 flex flex-col items-center text-center">

        {/* Sync Indicator Header */}
        <header className="mb-8 w-full">
          <div className="flex items-center justify-between bg-white/50 border border-sandstone px-6 py-3 rounded-full mb-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-marigold animate-ping' : 'bg-green-500'}`}></div>
              <p className="text-[9px] font-black uppercase tracking-widest text-khaki">{status.clinicName}</p>
            </div>
            <button onClick={() => fetchStatus(true)} className="p-2 hover:bg-parchment rounded-full transition-colors group">
              <RefreshCcw size={16} className={`text-khaki group-hover:text-marigold ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <h1 className="text-3xl font-heading">Live Lounge Tracker</h1>
        </header>

        {status.isDoctorOnBreak && (
          <div className="w-full bg-red-50 border border-red-100 p-4 rounded-2xl mb-6 text-center animate-in slide-in-from-top">
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest animate-pulse">Doctor is on a short break</p>
          </div>
        )}

        <div className={`w-full bg-white border-2 rounded-[3.5rem] p-10 shadow-2xl mb-8 relative transition-all duration-700 ${status.status === 'In-Consultation' ? 'border-green-500 ring-8 ring-green-50' : status.isEmergency ? 'border-red-500' : 'border-sandstone'}`}>
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black text-khaki uppercase tracking-widest">My Current Token</span>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-teak/5 rounded-full">
              <div className={`w-2 h-2 rounded-full ${status.status === 'In-Consultation' ? 'bg-green-500 animate-ping' : 'bg-marigold'}`}></div>
              <span className="text-[9px] font-black uppercase">{status.status === 'In-Consultation' ? 'Now In Cabin' : 'In Lounge'}</span>
            </div>
          </div>

          <p className={`text-8xl font-heading mb-4 transition-colors duration-500 ${status.status === 'In-Consultation' ? 'text-green-600' : status.isEmergency ? 'text-red-600' : 'text-marigold'}`}>
            {status.tokenNumber}
          </p>
          <p className="text-lg font-bold">Namaste, {status.patientName}</p>

          <div className="mt-10 pt-8 border-t border-sandstone flex justify-between">
            <div className="text-left">
              <p className="text-[9px] font-black text-khaki uppercase mb-1">Queue Status</p>
              <p className="text-lg font-heading text-teak">{status.status === 'In-Consultation' ? '0' : status.peopleAhead} <span className="text-[10px]">Ahead</span></p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-khaki uppercase mb-1">Est. Wait</p>
              <p className="text-lg font-heading text-teak">~{status.status === 'In-Consultation' ? '0' : status.estimatedWait} <span className="text-[10px]">Min</span></p>
            </div>
          </div>
        </div>

        <div className="w-full p-8 bg-teak text-white rounded-[2.5rem] shadow-xl mb-10 flex items-center justify-between group">
          <div className="text-left">
            <p className="text-[10px] font-black text-marigold uppercase tracking-widest mb-1">Health Records</p>
            <h4 className="text-lg font-heading">Locker Access</h4>
          </div>
          <button onClick={() => navigate('/patient/login')} className="p-4 bg-white/10 hover:bg-marigold rounded-2xl transition-all">
            <ArrowRight size={20} />
          </button>
        </div>

        <button onClick={handleCancel} className="mb-10 text-[9px] font-black uppercase text-khaki/40 hover:text-red-500 transition-all flex items-center gap-2">
          <XCircle size={12} /> Cancel My Appointment
        </button>
      </div>

      {/* Floating Action Button for easy access on mobile */}
      <button
        onClick={() => fetchStatus(true)}
        className="fixed bottom-24 right-6 w-12 h-12 bg-marigold text-white rounded-full shadow-2xl flex items-center justify-center animate-bounce hover:scale-110 active:scale-95 transition-all z-50 md:hidden"
      >
        <RefreshCcw size={20} className={isSyncing ? 'animate-spin' : ''} />
      </button>

      <Footer />
    </div>
  );
};

export default PatientStatus;