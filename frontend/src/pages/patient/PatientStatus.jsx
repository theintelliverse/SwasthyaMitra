import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import { 
    Clock, ShieldCheck, Lock, XCircle, ArrowRight, UserCheck, 
    RefreshCw, RefreshCcw, Activity, CheckCircle, Zap, AlertCircle
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
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

    const fetchStatus = async (silent = false) => {
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
        } catch (err) {
            console.error("Status fetch failed:", err);
        } finally {
            setLoading(false);
            setTimeout(() => setIsSyncing(false), 1000);
        }
    };

    useEffect(() => {
        if (queueId) fetchStatus();

        socket.on('queueUpdate', () => fetchStatus(true));
        socket.on('doctorStatusChanged', () => fetchStatus(true));

        return () => {
            socket.off('queueUpdate');
            socket.off('doctorStatusChanged');
        };
    }, [queueId]);

    useEffect(() => {
        if (queueId) socket.emit('joinClinic', queueId.toString());
        if (clinicId) socket.emit('joinClinic', clinicId);
    }, [queueId, clinicId]);

    const handleCancel = () => {
        Swal.fire({
            title: 'Cancel Entry?',
            text: "This will remove you from the live queue.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0D9488',
            cancelButtonColor: '#94A3B8',
            confirmButtonText: 'Yes, Cancel',
            background: '#F8FAFC',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`${API_URL}/api/queue/public/cancel/${queueId}`);
                    navigate('/');
                } catch (err) {
                    Swal.fire('Error', 'Could not cancel request.', 'error');
                }
            }
        });
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4 font-body">
            <RefreshCw size={32} className="text-teal-600 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Live Lounge Status...</p>
        </div>
    );

    if (isPending) return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-body text-slate-900">
            <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck size={100} /></div>
                <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <UserCheck size={40} className="animate-pulse" />
                </div>
                <h1 className="text-2xl font-black tracking-tight mb-4">Request Sent</h1>
                <p className="text-slate-500 text-xs font-bold leading-relaxed uppercase tracking-wider mb-10">
                    The clinical desk has received your request. Stay on this screen—your token will be issued automatically.
                </p>
                <div className="flex flex-col gap-4">
                    <button onClick={() => fetchStatus(true)} className="flex items-center justify-center gap-3 w-full py-4 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-600/20 active:scale-95 transition-all">
                        <RefreshCcw size={14} className={isSyncing ? 'animate-spin' : ''} /> Manual Sync
                    </button>
                    <button onClick={handleCancel} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors">
                        Cancel Request ✕
                    </button>
                </div>
            </div>
        </div>
    );

    if (isCompleted || (!status && !loading)) return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-body text-slate-900">
            <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5"><Activity size={120} /></div>
                <div className="text-6xl mb-8">🏥</div>
                <h1 className="text-3xl font-black tracking-tighter mb-4">Visit Complete</h1>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider leading-relaxed mb-10">
                    Consultation finished. You can now access your prescriptions and lab reports in the Health Locker.
                </p>
                <button onClick={() => navigate('/patient/login')} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95">
                    Open Health Locker <Lock size={16} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex flex-col items-center">
            <div className="w-full max-w-lg px-6 py-12 flex flex-col items-center">
                
                {/* Real-time Status Header */}
                <header className="w-full mb-10">
                    <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${isSyncing ? 'bg-teal-500 animate-ping' : 'bg-green-500 shadow-lg shadow-green-500/20'}`}></div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Connected To</span>
                                <span className="text-[10px] font-black uppercase text-slate-900 tracking-wider">{status.clinicName}</span>
                            </div>
                        </div>
                        <button onClick={() => fetchStatus(true)} className="p-2 hover:bg-slate-50 rounded-xl transition-all group">
                            <RefreshCcw size={18} className={`text-slate-400 group-hover:text-teal-600 ${isSyncing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900">Live Lounge</h1>
                        <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-teal-100">Active</span>
                    </div>
                </header>

                {status.isDoctorOnBreak && (
                    <div className="w-full bg-rose-50 border border-rose-100 p-4 rounded-2xl mb-8 flex items-center justify-center gap-3 animate-in slide-in-from-top-4 duration-500">
                        <AlertCircle size={16} className="text-rose-600" />
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.15em] animate-pulse">Doctor is on a temporary break</p>
                    </div>
                )}

                {/* Main Token Card */}
                <div className={`w-full bg-white border-2 rounded-[4rem] p-12 shadow-2xl mb-10 relative transition-all duration-700 overflow-hidden ${status.status === 'In-Consultation' ? 'border-teal-500 ring-8 ring-teal-50 shadow-teal-500/10' : status.isEmergency ? 'border-rose-500' : 'border-slate-100'}`}>
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12"><Zap size={200} /></div>
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Current Token</span>
                            <span className="text-xs font-black text-slate-900 uppercase mt-1">Lounge Access</span>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${status.status === 'In-Consultation' ? 'bg-teal-50 border-teal-100 text-teal-600' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${status.status === 'In-Consultation' ? 'bg-teal-500 animate-ping' : 'bg-slate-400'}`}></div>
                            <span className="text-[9px] font-black uppercase tracking-widest">{status.status === 'In-Consultation' ? 'Live In Cabin' : 'Waiting'}</span>
                        </div>
                    </div>

                    <div className="text-center relative z-10">
                        <p className={`text-[9rem] font-black leading-none mb-6 tracking-tighter transition-colors duration-500 ${status.status === 'In-Consultation' ? 'text-teal-600' : status.isEmergency ? 'text-rose-600' : 'text-slate-900'}`}>
                            {status.tokenNumber}
                        </p>
                        <p className="text-xl font-black text-slate-900 tracking-tight">Namaste, {status.patientName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Clinical ID: {queueId.slice(-6).toUpperCase()}</p>
                    </div>

                    <div className="mt-12 pt-10 border-t border-slate-50 flex justify-between relative z-10">
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Patients Ahead</p>
                            <p className="text-2xl font-black text-slate-900">{status.status === 'In-Consultation' ? '0' : status.peopleAhead}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Est. Wait Time</p>
                            <p className="text-2xl font-black text-slate-900">~{status.status === 'In-Consultation' ? '0' : status.estimatedWait} <span className="text-xs uppercase">Min</span></p>
                        </div>
                    </div>
                </div>

                {/* Digital Locker Promotion */}
                <div className="w-full p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl mb-12 flex items-center justify-between group cursor-pointer hover:bg-black transition-all overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <ShieldCheck size={12} /> Personal Health Hub
                        </p>
                        <h4 className="text-xl font-black tracking-tight">Open Health Locker</h4>
                    </div>
                    <button onClick={() => navigate('/patient/login')} className="p-4 bg-white/10 group-hover:bg-teal-600 rounded-2xl transition-all relative z-10 shadow-lg">
                        <ArrowRight size={20} />
                    </button>
                </div>

                <button onClick={handleCancel} className="text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-all flex items-center gap-2 tracking-widest">
                    <XCircle size={14} /> Cancel Visit Request
                </button>
            </div>

            {/* Mobile Sticky Sync */}
            <button
                onClick={() => fetchStatus(true)}
                className="fixed bottom-10 right-8 w-14 h-14 bg-teal-600 text-white rounded-2xl shadow-2xl shadow-teal-600/30 flex items-center justify-center animate-bounce md:hidden active:scale-90 transition-all z-50 border-4 border-white"
            >
                <RefreshCcw size={24} className={isSyncing ? 'animate-spin' : ''} />
            </button>
        </div>
    );
};

export default PatientStatus;