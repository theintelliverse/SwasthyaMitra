import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
    Smartphone, ArrowRight, RefreshCw, ArrowLeft, 
    ShieldCheck, Lock, Eye, EyeOff, Activity, CheckCircle
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const PatientForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: New Password
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [formData, setFormData] = useState({
        phone: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });

    const checkPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        return strength;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (name === 'newPassword') setPasswordStrength(checkPasswordStrength(value));
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length !== 10) {
            Swal.fire({ icon: 'error', title: 'Invalid Phone', text: 'Enter 10-digit number', confirmButtonColor: '#0D9488' });
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/patient/forgot-password`, { phone: formData.phone });
            if (res.data.success) {
                setStep(2);
                Swal.fire({ icon: 'success', title: 'OTP Sent! 📱', text: res.data.message, background: '#F8FAFC', confirmButtonColor: '#0D9488' });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to send OTP', confirmButtonColor: '#0D9488' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = (e) => {
        e.preventDefault();
        const cleanOtp = formData.otp.replace(/\D/g, '');
        if (!cleanOtp || cleanOtp.length !== 6) {
            Swal.fire({ icon: 'error', title: 'Invalid OTP', text: 'Enter 6-digit code', confirmButtonColor: '#0D9488' });
            return;
        }
        setStep(3);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (formData.newPassword.length < 6) {
            Swal.fire({ icon: 'error', title: 'Weak Password', text: 'Min 6 characters required', confirmButtonColor: '#0D9488' });
            return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
            Swal.fire({ icon: 'error', title: 'Mismatch', text: 'Passwords do not match', confirmButtonColor: '#0D9488' });
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/patient/change-password-with-otp`, {
                phone: formData.phone,
                otp: formData.otp,
                newPassword: formData.newPassword
            });

            if (res.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Password Reset! 🔐',
                    text: 'Your account is now secure.',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#F8FAFC'
                }).then(() => navigate('/patient/login'));
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.message || 'Reset failed', confirmButtonColor: '#0D9488' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-6 font-body">
            <div className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                {/* Left Side - Security Panel */}
                <div className="w-full md:w-5/12 bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><ShieldCheck size={120} /></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-teal-500/20">
                            <Activity size={24} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight leading-tight mb-4">Account <br />Recovery <span className="text-teal-500">.</span></h2>
                        <p className="text-slate-400 text-sm font-bold leading-relaxed">Securely reset your master password using OTP verification.</p>
                    </div>

                    <div className="relative z-10">
                        <div className="flex flex-col gap-4">
                            <FeatureItem icon={<Lock size={14} />} text="End-to-end Encryption" />
                            <FeatureItem icon={<Smartphone size={14} />} text="SMS Verification" />
                        </div>
                    </div>
                </div>

                {/* Right Side - Form Panel */}
                <div className="w-full md:w-7/12 p-10 md:p-12">
                    <header className="mb-12">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
                                Step {step} of 3
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                            {step === 1 && "Identity Check"}
                            {step === 2 && "Verification"}
                            {step === 3 && "New Credentials"}
                        </h3>
                    </header>

                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Linked Mobile Number</label>
                                <div className="relative group">
                                    <Smartphone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                    <input
                                        type="tel" name="phone" required placeholder="91XXXXXXXXXX"
                                        className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-slate-900 shadow-sm transition-all"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit" disabled={loading}
                                className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-600/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={18} /> : <>Send Verification Code <ArrowRight size={18} /></>}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 text-center">
                                <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest">Code Sent to</p>
                                <p className="text-sm font-black text-slate-900">{formData.phone}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 block text-center tracking-widest">6-Digit Code</label>
                                <input
                                    type="text" name="otp" required maxLength="6" placeholder="000000"
                                    className="w-full py-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-teal-500 font-black text-center text-3xl tracking-[0.3em] text-slate-900 shadow-inner"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-600/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                            >
                                Verify & Continue <ArrowRight size={18} />
                            </button>
                            <button type="button" onClick={() => setStep(1)} className="w-full text-[9px] text-slate-400 font-black uppercase tracking-widest hover:text-teal-600">← Back</button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">New Master Password</label>
                                <div className="relative group">
                                    <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'} name="newPassword" required placeholder="Min 6 characters"
                                        className="w-full pl-16 pr-14 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-slate-900 shadow-sm transition-all"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Confirm Password</label>
                                <div className="relative group">
                                    <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required placeholder="Repeat password"
                                        className="w-full pl-16 pr-14 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-slate-900 shadow-sm transition-all"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600">
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit" disabled={loading}
                                className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-600/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={18} /> : <>Reset Master Password <CheckCircle size={18} /></>}
                            </button>
                        </form>
                    )}

                    <div className="mt-12 text-center">
                        <button onClick={() => navigate('/patient/login')} className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-teal-600 flex items-center justify-center gap-2 mx-auto">
                            <ArrowLeft size={14} /> Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FeatureItem = ({ icon, text }) => (
    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
        <span className="text-teal-500">{icon}</span>
        {text}
    </div>
);

export default PatientForgotPassword;
