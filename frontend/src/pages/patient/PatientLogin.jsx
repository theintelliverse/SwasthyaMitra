import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
    ShieldCheck, Lock, Smartphone, ArrowRight, RefreshCw, 
    Eye, EyeOff, Activity, CheckCircle, Zap
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const PatientLogin = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Phone, 2: Password
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        password: ''
    });

    const handlePhoneSubmit = (e) => {
        e.preventDefault();
        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length !== 10) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Phone',
                text: 'Please enter a valid 10-digit phone number',
                confirmButtonColor: '#0D9488',
                background: '#F8FAFC'
            });
            return;
        }
        setStep(2);
    };

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        if (!formData.password || formData.password.length < 6) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Password',
                text: 'Password must be at least 6 characters',
                confirmButtonColor: '#0D9488',
                background: '#F8FAFC'
            });
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/patient/login-with-password`, {
                phone: formData.phone,
                password: formData.password
            });

            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('role', 'patient');
                localStorage.setItem('patientName', res.data.patient?.name || 'Valued Patient');

                Swal.fire({
                    icon: 'success',
                    title: 'Welcome Back! 🔐',
                    text: `Hello, ${res.data.patient?.name}`,
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#F8FAFC'
                }).then(() => navigate('/patient/dashboard'));
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: err.response?.data?.message || 'Invalid credentials',
                confirmButtonColor: '#0D9488'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-6 font-body">
            <div className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                {/* Left Side - Visual Panel */}
                <div className="w-full md:w-5/12 bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><ShieldCheck size={120} /></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-teal-500/20">
                            <Lock size={24} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight leading-tight mb-4">Patient <br />Portal <span className="text-teal-500">.</span></h2>
                        <p className="text-slate-400 text-sm font-bold leading-relaxed">Securely access your clinical records, vitals, and appointment history.</p>
                    </div>

                    <div className="relative z-10 mt-12 md:mt-0">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Security Active</span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">Your health data is encrypted using clinical-grade protocols.</p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form Panel */}
                <div className="w-full md:w-7/12 p-10 md:p-12">
                    <header className="mb-12">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
                                {step === 1 ? 'Step 1: Identity' : 'Step 2: Access'}
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                            {step === 1 ? "Sign In" : "Unlock Vault"}
                        </h3>
                        <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-wider">Access your clinical health locker.</p>
                    </header>

                    {step === 1 ? (
                        <form onSubmit={handlePhoneSubmit} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Mobile Number</label>
                                <div className="relative group">
                                    <Smartphone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                    <input
                                        type="tel" required placeholder="91XXXXXXXXXX"
                                        className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-slate-900 shadow-sm transition-all"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-600/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                            >
                                Continue <ArrowRight size={18} />
                            </button>
                            <div className="pt-6 border-t border-slate-50 text-center">
                                <button type="button" onClick={() => navigate('/patient/forgot-password')} className="text-[9px] text-slate-400 font-black uppercase tracking-widest hover:text-teal-600 transition-colors">
                                    Lost access to your account?
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordLogin} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Signing in as</p>
                                    <p className="text-sm font-black text-slate-900">{formData.phone}</p>
                                </div>
                                <button type="button" onClick={() => setStep(1)} className="text-[9px] font-black text-teal-600 uppercase tracking-widest hover:underline">Change</button>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Master Password</label>
                                <div className="relative group">
                                    <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'} required placeholder="Enter password"
                                        className="w-full pl-16 pr-14 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-slate-900 shadow-sm transition-all"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        disabled={loading}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit" disabled={loading}
                                className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={18} /> : <>Verify & Open Locker <ShieldCheck size={18} /></>}
                            </button>
                        </form>
                    )}

                    <div className="mt-12 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            New to SwasthyaMitra? <button onClick={() => navigate('/patient/register')} className="text-teal-600 hover:underline">Create Account</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientLogin;