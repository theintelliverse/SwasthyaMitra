import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import {
    Clock, ShieldCheck, Lock, XCircle, ArrowRight, UserCheck,
    RefreshCcw, Activity, Zap, AlertCircle, Heart, Wifi, WifiOff,
    CheckCircle2, Stethoscope, Timer, Users, Sparkles, Hospital
} from 'lucide-react';
import SEO from '../../components/SEO';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const socket = SOCKET_URL ? io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true
}) : { on: () => { }, off: () => { }, emit: () => { } };

/* ── animated background blobs ── */
const Blob = ({ className }) => (
    <div className={`absolute rounded-full blur-3xl opacity-20 animate-pulse ${className}`} />
);

/* ── pulsing ring around token number when In-Consultation ── */
const PulseRing = () => (
    <span className="absolute inset-0 rounded-full border-4 border-teal-400 animate-ping opacity-30" />
);

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
    const [lastUpdated, setLastUpdated] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);
    const tickRef = useRef(null);

    /* ── live clock tick every minute ── */
    useEffect(() => {
        tickRef.current = setInterval(() => setLastUpdated(d => d), 60000);
        return () => clearInterval(tickRef.current);
    }, []);

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
                setLastUpdated(new Date());

                const incomingClinicId = res.data.data.clinicId?._id || res.data.data.clinicId;
                if (incomingClinicId && incomingClinicId !== clinicId) {
                    setClinicId(incomingClinicId.toString());
                }
            }
        } catch (err) {
            console.error('Status fetch failed:', err);
        } finally {
            setLoading(false);
            setTimeout(() => setIsSyncing(false), 1200);
        }
    };

    useEffect(() => {
        if (queueId) fetchStatus();

        socket.on('connect', () => setSocketConnected(true));
        socket.on('disconnect', () => setSocketConnected(false));
        socket.on('queueUpdate', () => fetchStatus(true));
        socket.on('doctorStatusChanged', () => fetchStatus(true));

        return () => {
            socket.off('connect');
            socket.off('disconnect');
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
            title: 'Leave Queue?',
            text: 'This will permanently remove you from the live queue.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Yes, Remove Me',
            cancelButtonText: 'Stay in Queue',
            background: '#fff',
            customClass: { popup: 'rounded-3xl' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`${API_URL}/api/queue/public/cancel/${queueId}`);
                    navigate('/');
                } catch {
                    Swal.fire('Error', 'Could not cancel request.', 'error');
                }
            }
        });
    };

    const isInConsultation = status?.status === 'In-Consultation';
    const isEmergency = status?.isEmergency;

    /* ═══════════════════════════════════════════
       LOADING SCREEN
    ═══════════════════════════════════════════ */
    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 flex flex-col items-center justify-center gap-6 font-sans relative overflow-hidden">
            <Blob className="w-96 h-96 bg-teal-500 -top-20 -left-20" />
            <Blob className="w-80 h-80 bg-cyan-400 bottom-0 right-0" />
            <div className="relative z-10 text-center">
                <div className="w-20 h-20 border-4 border-white/10 border-t-teal-400 rounded-full animate-spin mx-auto mb-6" />
                <p className="text-white/80 text-sm font-semibold tracking-widest uppercase">Connecting to live queue...</p>
            </div>
        </div>
    );

    /* ═══════════════════════════════════════════
       PENDING APPROVAL SCREEN
    ═══════════════════════════════════════════ */
    if (isPending) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 flex items-center justify-center p-5 font-sans">
            <SEO 
                title="Pending Check-in Approval" 
                description="Your check-in request is being processed. Live queue tracking will start shortly." 
                url={`/patient/status?id=${queueId}`} 
            />
            <div className="w-full max-w-sm">
                {/* Card */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100/80 p-10 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-3xl flex items-center justify-center shadow-xl shadow-teal-400/30">
                            <UserCheck size={40} className="text-white" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                            <Timer size={12} className="text-white" />
                        </span>
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Request Received</h1>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8">
                        The reception desk has your check-in request. Your queue token will be issued shortly — stay on this page.
                    </p>

                    {/* Animated waiting dots */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {[0, 1, 2, 3].map(i => (
                            <div
                                key={i}
                                className="w-2 h-2 rounded-full bg-teal-400"
                                style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => fetchStatus(true)}
                        className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-lg shadow-teal-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 mb-4"
                    >
                        <RefreshCcw size={14} className={isSyncing ? 'animate-spin' : ''} /> Refresh Status
                    </button>
                    <button
                        onClick={handleCancel}
                        className="text-[14px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                        Cancel Request
                    </button>
                </div>

                <p className="text-center text-[14px] text-slate-400 mt-6">Live updates via SwasthyaMitra</p>
            </div>

            <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-12px)} }`}</style>
        </div>
    );

    /* ═══════════════════════════════════════════
       COMPLETED / NOT FOUND SCREEN
    ═══════════════════════════════════════════ */
    if (isCompleted || (!status && !loading)) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 flex items-center justify-center p-5 font-sans relative overflow-hidden">
            <SEO 
                title="Consultation Completed" 
                description="Your clinic consultation has been completed. View prescriptions and reports in your Health Locker." 
                url={`/patient/status?id=${queueId}`} 
            />
            <Blob className="w-96 h-96 bg-teal-500/40 -top-20 -right-20" />
            <Blob className="w-80 h-80 bg-cyan-400/30 bottom-10 left-0" />

            <div className="relative z-10 w-full max-w-sm bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-10 text-center text-white">
                <div className="text-7xl mb-6 animate-bounce">🎉</div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-400/20 border border-green-400/30 rounded-full mb-6">
                    <CheckCircle2 size={14} className="text-green-400" />
                    <span className="text-green-300 text-[14px] font-black uppercase tracking-widest">Visit Complete</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight mb-4">All Done!</h1>
                <p className="text-white/70 text-sm leading-relaxed mb-8">
                    Your consultation is finished. Access your prescriptions, lab reports and visit history in your personal Health Locker.
                </p>
                <button
                    onClick={() => navigate('/patient/login')}
                    className="w-full py-4 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-400/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <Lock size={18} /> Open Health Locker
                </button>
            </div>
        </div>
    );

    /* ═══════════════════════════════════════════
       MAIN LIVE QUEUE STATUS SCREEN
    ═══════════════════════════════════════════ */
    return (
        <div className="min-h-screen font-sans text-slate-900 relative overflow-hidden"
            style={{ background: isInConsultation ? 'linear-gradient(135deg,#f0fdf9,#ccfbf1,#f0fdfa)' : '#f8fafc' }}>
            <SEO 
                title={`Live Queue Status - Token ${status?.tokenNumber || ''}`} 
                description={`Track your live queue position in real-time at ${status?.clinicName || 'your local clinic'}. Estimated wait time: ${status?.estimatedWait || '0'} minutes.`} 
                url={`/patient/status?id=${queueId}`} 
            />

            {/* BG Blobs */}
            {isInConsultation && (
                <>
                    <Blob className="w-72 h-72 bg-teal-300 -top-10 -right-10" />
                    <Blob className="w-56 h-56 bg-cyan-300 bottom-20 -left-10" />
                </>
            )}
            {isEmergency && <Blob className="w-72 h-72 bg-red-300 -top-10 -right-10" />}

            <div className="relative z-10 w-full max-w-md mx-auto px-5 pt-8 pb-28 flex flex-col gap-5">

                {/* ── TOP BAR: Clinic + Connection ── */}
                <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm px-5 py-3.5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : socketConnected ? 'bg-green-500 shadow-md shadow-green-500/40' : 'bg-slate-300'}`} />
                        <div>
                            <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest leading-none">Connected</p>
                            <p className="text-[14px] font-black text-slate-900 leading-tight mt-0.5">{status.clinicName || 'Clinic'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isSyncing ? (
                            <span className="text-[14px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                <RefreshCcw size={10} className="animate-spin" /> Syncing
                            </span>
                        ) : (
                            <span className="text-[14px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1">
                                <Wifi size={10} /> Live
                            </span>
                        )}
                        <button
                            onClick={() => fetchStatus(true)}
                            className="w-8 h-8 bg-slate-50 hover:bg-teal-50 text-slate-400 hover:text-teal-600 rounded-xl flex items-center justify-center transition-all active:scale-90"
                        >
                            <RefreshCcw size={14} className={isSyncing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* ── DOCTOR ON BREAK ALERT ── */}
                {status.isDoctorOnBreak && (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 animate-in slide-in-from-top duration-500">
                        <AlertCircle size={18} className="text-amber-500 shrink-0" />
                        <div>
                            <p className="text-[14px] font-black text-amber-700 uppercase tracking-wider">Doctor on Break</p>
                            <p className="text-[14px] text-amber-600 font-medium mt-0.5">The doctor will resume shortly. Your position is held.</p>
                        </div>
                    </div>
                )}

                {/* ── MAIN TOKEN CARD ── */}
                <div className={`relative rounded-[2.5rem] overflow-hidden transition-all duration-700 ${isInConsultation
                    ? 'bg-gradient-to-br from-teal-500 to-cyan-600 shadow-2xl shadow-teal-400/40'
                    : isEmergency
                        ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-2xl shadow-red-400/40'
                        : 'bg-white shadow-xl shadow-slate-200/60 border border-slate-100'
                    }`}>

                    {/* Decorative background element */}
                    <div className={`absolute inset-0 opacity-[0.06] ${isInConsultation || isEmergency ? 'opacity-10' : ''}`}>
                        <Stethoscope size={300} className="absolute -bottom-10 -right-10" />
                    </div>

                    <div className="relative z-10 p-8">
                        {/* Status pill */}
                        <div className="flex items-center justify-between mb-6">
                            <div className={`flex items-center gap-2 text-[14px] font-black uppercase tracking-widest ${isInConsultation ? 'text-teal-100' : 'text-slate-400'}`}>
                                <Hospital size={12} />
                                My Queue Token
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[14px] font-black uppercase tracking-widest ${isInConsultation
                                ? 'bg-white/20 text-white'
                                : isEmergency
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-50 text-slate-500 border border-slate-100'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isInConsultation ? 'bg-teal-200 animate-ping' : isEmergency ? 'bg-rose-200 animate-ping' : 'bg-slate-300'}`} />
                                {isInConsultation ? 'In Cabin Now' : isEmergency ? 'Emergency' : 'Waiting'}
                            </div>
                        </div>

                        {/* Token Number — HUGE */}
                        <div className="text-center mb-6">
                            <div className="relative inline-block">
                                <span className={`text-[8rem] leading-none font-black tracking-tighter transition-colors duration-500 ${isInConsultation ? 'text-white' : isEmergency ? 'text-white' : 'text-slate-900'}`}>
                                    {status.tokenNumber}
                                </span>
                            </div>
                        </div>

                        {/* Patient name */}
                        <div className="text-center mb-6">
                            <p className={`text-lg font-black tracking-tight ${isInConsultation || isEmergency ? 'text-white' : 'text-slate-800'}`}>
                                Namaste, {status.patientName?.split(' ')[0]} 🙏
                            </p>
                            <p className={`text-[14px] font-bold uppercase tracking-widest mt-1 ${isInConsultation || isEmergency ? 'text-white/60' : 'text-slate-400'}`}>
                                Visit ID: {queueId?.slice(-8).toUpperCase()}
                            </p>
                        </div>

                        {/* Stats row */}
                        <div className={`grid grid-cols-2 gap-3 pt-6 ${isInConsultation || isEmergency ? 'border-t border-white/20' : 'border-t border-slate-50'}`}>
                            <div className={`rounded-2xl p-4 text-center ${isInConsultation || isEmergency ? 'bg-white/15' : 'bg-slate-50 border border-slate-100'}`}>
                                <div className={`flex items-center justify-center gap-1.5 mb-1 ${isInConsultation || isEmergency ? 'text-white/70' : 'text-slate-400'}`}>
                                    <Users size={12} />
                                    <span className="text-[14px] font-black uppercase tracking-widest">Ahead</span>
                                </div>
                                <p className={`text-3xl font-black ${isInConsultation || isEmergency ? 'text-white' : 'text-slate-900'}`}>
                                    {isInConsultation ? '0' : status.peopleAhead ?? '—'}
                                </p>
                            </div>
                            <div className={`rounded-2xl p-4 text-center ${isInConsultation || isEmergency ? 'bg-white/15' : 'bg-slate-50 border border-slate-100'}`}>
                                <div className={`flex items-center justify-center gap-1.5 mb-1 ${isInConsultation || isEmergency ? 'text-white/70' : 'text-slate-400'}`}>
                                    <Clock size={12} />
                                    <span className="text-[14px] font-black uppercase tracking-widest">Est. Wait</span>
                                </div>
                                <p className={`text-3xl font-black ${isInConsultation || isEmergency ? 'text-white' : 'text-slate-900'}`}>
                                    {isInConsultation ? '0' : status.estimatedWait ?? '—'}
                                    <span className={`text-sm font-bold ml-1 ${isInConsultation || isEmergency ? 'text-white/70' : 'text-slate-400'}`}>min</span>
                                </p>
                            </div>
                        </div>

                        {/* In-Consultation Banner */}
                        {isInConsultation && (
                            <div className="mt-4 py-3 bg-white/20 rounded-2xl flex items-center justify-center gap-2 animate-in slide-in-from-bottom duration-500">
                                <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                                <p className="text-white font-black text-[14px] uppercase tracking-widest">Please proceed to the doctor's cabin</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── PROGRESS INDICATOR ── */}
                {!isInConsultation && (
                    <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Queue Progress</p>
                            <p className="text-[14px] font-black text-teal-600 uppercase tracking-widest">
                                {status.peopleAhead === 0 ? "You're Next!" : `${status.peopleAhead} before you`}
                            </p>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-1000"
                                style={{
                                    width: status.peopleAhead === 0 ? '95%' : `${Math.max(10, 100 - (status.peopleAhead * 15))}%`
                                }}
                            />
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-[14px] text-slate-300 font-bold">Start</span>
                            <span className="text-[14px] text-slate-300 font-bold">Your Turn</span>
                        </div>
                    </div>
                )}

                {/* ── LAST UPDATED ── */}
                {lastUpdated && (
                    <p className="text-center text-[14px] text-slate-400 font-medium">
                        Last synced: {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}

                {/* ── HEALTH LOCKER CTA ── */}
                <div
                    onClick={() => navigate('/patient/login')}
                    className="bg-slate-900 text-white rounded-[1.5rem] p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800 active:scale-[0.98] transition-all group relative overflow-hidden shadow-xl shadow-slate-900/20"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <p className="text-[14px] font-black text-teal-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                            <ShieldCheck size={10} /> Personal Health Hub
                        </p>
                        <p className="text-base font-black tracking-tight">Health Locker</p>
                        <p className="text-[14px] text-white/50 font-medium mt-0.5">Access prescriptions & lab reports</p>
                    </div>
                    <div className="relative z-10 w-11 h-11 bg-white/10 group-hover:bg-teal-500 rounded-2xl flex items-center justify-center transition-all">
                        <ArrowRight size={18} />
                    </div>
                </div>



            </div>

            {/* ── FLOATING SYNC FAB (mobile) ── */}
            <button
                onClick={() => fetchStatus(true)}
                className={`fixed bottom-8 right-5 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all active:scale-90 z-50 border-4 border-white md:hidden ${isInConsultation ? 'bg-teal-500 shadow-teal-500/40' : 'bg-slate-900 shadow-slate-900/30'}`}
            >
                <RefreshCcw size={22} className={`text-white ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
            `}</style>
        </div>
    );
};

export default PatientStatus;