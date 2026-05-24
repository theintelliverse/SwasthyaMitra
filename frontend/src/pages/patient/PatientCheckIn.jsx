import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
    Phone, User, Stethoscope, ShieldCheck, ArrowRight, 
    RefreshCw, Activity, CheckCircle, MapPin, Search
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const PatientCheckIn = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const clinicCode = searchParams.get('code') || '';

    const [doctors, setDoctors] = useState([]);
    const [clinicName, setClinicName] = useState('Clinic');
    const [loading, setLoading] = useState(true);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        patientName: '',
        patientPhone: '',
        doctorId: ''
    });

    useEffect(() => {
        const fetchClinicDoctors = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/staff/public/doctors/${clinicCode}`);
                setDoctors(res.data.doctors);
                setClinicName(res.data.clinicName);
                setLoading(false);
            } catch (err) {
                console.error("Could not load doctors");
                setLoading(false);
                Swal.fire({
                    icon: 'error',
                    title: 'Clinic Not Found',
                    text: 'Invalid clinic code or network error.',
                    confirmButtonColor: '#0D9488'
                });
            }
        };
        if (clinicCode) fetchClinicDoctors();
        else {
            setLoading(false);
            // If no code, maybe show a search or error
        }
    }, [clinicCode]);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(`${API_URL}/api/auth/patient/send-otp`, {
                phone: formData.patientPhone
            });
            setOtpSent(true);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Verification Code Sent',
                showConfirmButton: false,
                timer: 3000,
                background: '#F8FAFC'
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Dispatch Failed',
                text: 'Could not send OTP. Please verify your phone number.',
                confirmButtonColor: '#0D9488'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyAndCheckin = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // 1. Verify OTP
            await axios.post(`${API_URL}/api/auth/patient/verify-otp`, {
                phone: formData.patientPhone,
                otp
            });

            // 2. Submit Check-in
            const res = await axios.post(`${API_URL}/api/queue/public/checkin`, {
                patientName: formData.patientName,
                patientPhone: formData.patientPhone,
                doctorId: formData.doctorId,
                clinicCode: clinicCode.toUpperCase()
            });

            if (res.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Check-in Successful! 🎉',
                    text: 'The receptionist has been notified. Please watch the display screen.',
                    confirmButtonColor: '#0D9488',
                    background: '#F8FAFC'
                }).then(() => {
                    navigate(`/patient/status?id=${res.data.id}`);
                });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Check-in Failed',
                text: err.response?.data?.message || 'Invalid code or system error.',
                confirmButtonColor: '#0D9488'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4 font-body">
            <RefreshCw size={32} className="text-teal-600 animate-spin" />
            <p className="text-[14px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing with Clinical Network...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-6 font-body">
            <div className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                
                {/* Left Panel - Clinic Info */}
                <div className="w-full md:w-5/12 bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Activity size={120} /></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-teal-500/20">
                            <MapPin size={24} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight leading-tight mb-2">{clinicName}</h2>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="px-2 py-0.5 bg-white/10 rounded text-[14px] font-black uppercase tracking-widest text-teal-400 border border-white/10">
                                {clinicCode}
                            </span>
                            <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">Verified Facility</span>
                        </div>
                        <p className="text-slate-400 text-[14px] font-bold leading-relaxed uppercase tracking-wider">Welcome to our self-service check-in portal. Please provide your details to join the queue.</p>
                    </div>

                    <div className="relative z-10 mt-12 md:mt-0">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-[14px] font-black uppercase tracking-widest text-teal-400">Live Queue Active</span>
                            </div>
                            <p className="text-[14px] font-bold text-slate-500 leading-relaxed uppercase tracking-tighter">Your position in the queue will be updated in real-time on the clinic displays.</p>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="w-full md:w-7/12 p-10 md:p-12">
                    <header className="mb-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[14px] font-black uppercase tracking-widest border border-teal-100">
                                {otpSent ? 'Verification' : 'Self Check-in'}
                            </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                            {otpSent ? "Verify Identity" : "Check-in Details"}
                        </h3>
                    </header>

                    {!otpSent ? (
                        <form onSubmit={handleSendOTP} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-[14px] font-black uppercase text-slate-400 ml-4 tracking-widest">Full Name</label>
                                <div className="relative group">
                                    <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                    <input
                                        type="text" required placeholder="Enter your name"
                                        className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-slate-900 shadow-sm transition-all"
                                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[14px] font-black uppercase text-slate-400 ml-4 tracking-widest">Mobile Number</label>
                                <div className="relative group">
                                    <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                    <input
                                        type="tel" required placeholder="10-digit number"
                                        className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-slate-900 shadow-sm transition-all"
                                        onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[14px] font-black uppercase text-slate-400 ml-4 tracking-widest">Specialist</label>
                                <div className="relative group">
                                    <Stethoscope size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors z-10" />
                                    <select
                                        required
                                        className="w-full max-w-full truncate pl-16 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-slate-900 appearance-none cursor-pointer relative z-0 transition-all shadow-sm"
                                        onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                                    >
                                        <option value="">Choose Doctor</option>
                                        {doctors.map(doc => (
                                            <option key={doc._id} value={doc._id}>
                                                Dr. {doc.name} ({doc.specialization})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-teal-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" disabled={submitting}
                                className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-xl shadow-teal-600/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {submitting ? <RefreshCw className="animate-spin" size={18} /> : <>Generate Secure OTP <ArrowRight size={18} /></>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyAndCheckin} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 text-center">
                                <p className="text-[14px] font-black text-teal-600 uppercase tracking-widest">Sent Verification to</p>
                                <p className="text-sm font-black text-slate-900">{formData.patientPhone}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[14px] font-black uppercase text-slate-400 block text-center tracking-widest">6-Digit Code</label>
                                <input
                                    type="text" required maxLength="6" placeholder="000000"
                                    className="w-full py-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-teal-500 font-black text-center text-3xl tracking-[0.3em] text-slate-900 shadow-inner"
                                    value={otp} onChange={(e) => setOtp(e.target.value)}
                                />
                            </div>

                            <div className="space-y-4">
                                <button 
                                    type="submit" disabled={submitting}
                                    className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? <RefreshCw className="animate-spin" size={18} /> : <>Confirm & Request Entry <CheckCircle size={18} /></>}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setOtpSent(false)} 
                                    className="w-full text-[14px] text-slate-400 font-black uppercase tracking-widest hover:text-teal-600 transition-colors"
                                >
                                    ← Edit Check-in Info
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-12 text-center pt-8 border-t border-slate-50">
                        <button onClick={() => navigate('/patient/login')} className="text-[14px] text-slate-400 font-black uppercase tracking-widest hover:text-teal-600 transition-colors flex items-center justify-center gap-2 mx-auto">
                            Already have an account? <span className="text-teal-600">Login</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientCheckIn;