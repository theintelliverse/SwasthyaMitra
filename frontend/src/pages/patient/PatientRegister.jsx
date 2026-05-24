import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
    User, Phone, Heart, Users, ArrowRight, ArrowLeft, RefreshCw, 
    Eye, EyeOff, Lock, CheckCircle, Activity, ShieldCheck, Zap
} from 'lucide-react';
import SEO from '../../components/SEO';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const PatientRegister = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Password, 4: Personal Info, 5: Review
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        otp: '',
        password: '',
        confirmPassword: '',
        name: '',
        age: '',
        gender: '',
        bloodGroup: ''
    });

    // Step 1: Request OTP
    const handleSendOTP = async (e) => {
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

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/patient/send-otp`, {
                phone: formData.phone,
                isRegistration: true
            });
            if (res.data.success) {
                setStep(2);
                const devOtp = res.data.debugOtp ? ` (Dev OTP: ${res.data.debugOtp})` : '';
                Swal.fire({
                    icon: 'success',
                    title: 'OTP Sent! 📱',
                    html: `<p>${res.data.message}</p><p style="font-size: 10px; color: #64748b; margin-top: 10px; font-weight: 800; text-transform: uppercase;">${devOtp}</p>`,
                    confirmButtonText: 'Enter OTP',
                    background: '#F8FAFC',
                    color: '#0F172A',
                    confirmButtonColor: '#0D9488'
                });
            }
        } catch (err) {
            const isDuplicate = err.response?.data?.isDuplicate;
            const errorMessage = err.response?.data?.message || 'Failed to send OTP';

            if (isDuplicate) {
                Swal.fire({
                    icon: 'error',
                    title: 'Phone Already Registered',
                    text: errorMessage,
                    confirmButtonText: 'Go to Login',
                    confirmButtonColor: '#0D9488',
                    showCancelButton: true,
                    cancelButtonText: 'Try Different Number'
                }).then((result) => {
                    if (result.isConfirmed) navigate('/patient/login');
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMessage,
                    confirmButtonColor: '#0D9488'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const cleanOtp = formData.otp.replace(/\D/g, '');
        if (!cleanOtp || cleanOtp.length !== 6) {
            Swal.fire({ icon: 'error', title: 'Invalid OTP', text: 'Enter 6-digit OTP', confirmButtonColor: '#0D9488' });
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/patient/verify-otp`, {
                phone: formData.phone,
                otp: formData.otp
            });

            if (res.data.success) {
                setStep(3);
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Invalid OTP', confirmButtonColor: '#0D9488' });
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Create Password
    const handleCreatePassword = (e) => {
        e.preventDefault();
        if (formData.password.length < 6) {
            Swal.fire({ icon: 'error', title: 'Weak Password', text: 'Min 6 characters required', confirmButtonColor: '#0D9488' });
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            Swal.fire({ icon: 'error', title: 'Mismatch', text: 'Passwords do not match', confirmButtonColor: '#0D9488' });
            return;
        }
        setStep(4);
    };

    // Step 4: Personal Info
    const handlePersonalInfo = (e) => {
        e.preventDefault();
        if (!formData.name) {
            Swal.fire({ icon: 'error', title: 'Missing Info', text: 'Name is required', confirmButtonColor: '#0D9488' });
            return;
        }
        setStep(5);
    };

    // Step 5: Final Submit
    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/patient/register-with-otp-password`, {
                phone: formData.phone,
                otp: formData.otp,
                password: formData.password,
                name: formData.name,
                age: formData.age ? parseInt(formData.age) : null,
                gender: formData.gender || null,
                bloodGroup: formData.bloodGroup || null
            });

            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('role', 'patient');
                localStorage.setItem('patientName', res.data.patient.name);

                Swal.fire({
                    icon: 'success',
                    title: '🎉 Welcome!',
                    text: `Account created for ${res.data.patient.name}`,
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#F8FAFC'
                }).then(() => navigate('/patient/dashboard'));
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Registration Failed', text: err.response?.data?.message || 'Error', confirmButtonColor: '#0D9488' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-6 font-body">
            <SEO 
                title="Patient Registration" 
                description="Sign up for a secure SwasthyaMitra patient account. Track queues, view appointments, and manage your health records." 
                url="/patient/register" 
            />
            <div className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                {/* Left Side - Info Panel */}
                <div className="w-full md:w-5/12 bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Activity size={120} /></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-teal-500/20">
                            <ShieldCheck size={24} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight leading-tight mb-4">Patient <br />Registration <span className="text-teal-500">.</span></h2>
                        <p className="text-slate-400 text-sm font-bold leading-relaxed">Join thousands of patients managing their health journey digitally.</p>
                    </div>

                    <div className="relative z-10 mt-12 md:mt-0">
                        <div className="flex flex-col gap-4">
                            <FeatureItem icon={<CheckCircle size={14} />} text="Digital Health Records" />
                            <FeatureItem icon={<CheckCircle size={14} />} text="Instant Appointment Booking" />
                            <FeatureItem icon={<CheckCircle size={14} />} text="Real-time Queue Status" />
                        </div>
                    </div>
                </div>

                {/* Right Side - Form Panel */}
                <div className="w-full md:w-7/12 p-10 md:p-12">
                    <header className="mb-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[14px] font-black uppercase tracking-widest border border-teal-100">
                                Step {step} of 5
                            </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                            {step === 1 && "Start Registration"}
                            {step === 2 && "Verify OTP"}
                            {step === 3 && "Secure Account"}
                            {step === 4 && "About You"}
                            {step === 5 && "Review & Confirm"}
                        </h3>
                    </header>

                    {/* Step 1: Phone */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-[14px] font-black uppercase text-slate-400 ml-4 tracking-widest">Mobile Number</label>
                                <div className="relative group">
                                    <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                    <input
                                        type="tel" required placeholder="10-digit number"
                                        className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-slate-900 shadow-sm transition-all"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit" disabled={loading}
                                className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-xl shadow-teal-600/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={18} /> : <>Next Step <ArrowRight size={18} /></>}
                            </button>
                            <p className="text-[14px] text-slate-400 font-bold uppercase tracking-widest text-center mt-6">
                                Already registered? <button type="button" onClick={() => navigate('/patient/login')} className="text-teal-600 hover:underline">Log in</button>
                            </p>
                        </form>
                    )}

                    {/* Step 2: OTP */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 text-center mb-6">
                                <p className="text-[14px] font-black text-teal-600 uppercase tracking-widest">Verification Sent to</p>
                                <p className="text-sm font-black text-slate-900">{formData.phone}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[14px] font-black uppercase text-slate-400 block text-center tracking-widest">6-Digit Code</label>
                                <input
                                    type="text" required maxLength="6" placeholder="000000"
                                    className="w-full py-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-teal-500 font-black text-center text-3xl tracking-[0.3em] text-slate-900 shadow-inner"
                                    value={formData.otp}
                                    onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                            <button
                                type="submit" disabled={loading}
                                className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-xl shadow-teal-600/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Verify Code'}
                            </button>
                            <button type="button" onClick={() => setStep(1)} className="w-full text-[14px] text-slate-400 font-black uppercase tracking-widest hover:text-teal-600 transition-colors">
                                ← Change Phone Number
                            </button>
                        </form>
                    )}

                    {/* Step 3: Password */}
                    {step === 3 && (
                        <form onSubmit={handleCreatePassword} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-[14px] font-black uppercase text-slate-400 ml-4 tracking-widest">Create Password</label>
                                <div className="relative group">
                                    <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'} required placeholder="Min 6 characters"
                                        className="w-full pl-16 pr-14 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-slate-900 shadow-sm transition-all"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[14px] font-black uppercase text-slate-400 ml-4 tracking-widest">Confirm Password</label>
                                <div className="relative group">
                                    <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'} required placeholder="Repeat password"
                                        className="w-full pl-16 pr-14 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-slate-900 shadow-sm transition-all"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600">
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-xl shadow-teal-600/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                            >
                                Continue <ArrowRight size={18} />
                            </button>
                        </form>
                    )}

                    {/* Step 4: Personal Info */}
                    {step === 4 && (
                        <form onSubmit={handlePersonalInfo} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <label className="text-[14px] font-black uppercase text-slate-400 ml-4 tracking-widest">Full Name</label>
                                <div className="relative group">
                                    <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                                    <input
                                        type="text" required placeholder="Enter your full name"
                                        className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-slate-900"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[14px] font-black uppercase text-slate-400 ml-4 tracking-widest">Age</label>
                                    <input
                                        type="number" placeholder="Years"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-slate-900"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[14px] font-black uppercase text-slate-400 ml-4 tracking-widest">Gender</label>
                                    <select
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-slate-900 appearance-none cursor-pointer"
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[14px] font-black uppercase text-slate-400 ml-4 tracking-widest">Blood Group</label>
                                <select
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold text-slate-900 appearance-none cursor-pointer"
                                    value={formData.bloodGroup}
                                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                >
                                    <option value="">Select Blood Group</option>
                                    <option value="A+">A+</option><option value="A-">A-</option>
                                    <option value="B+">B+</option><option value="B-">B-</option>
                                    <option value="O+">O+</option><option value="O-">O-</option>
                                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-xl shadow-teal-600/20 flex items-center justify-center gap-3 transition-all active:scale-95">
                                Review Profile <ArrowRight size={18} />
                            </button>
                        </form>
                    )}

                    {/* Step 5: Review */}
                    {step === 5 && (
                        <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                <ReviewRow label="Identity" value={formData.name} />
                                <ReviewRow label="Contact" value={formData.phone} />
                                <ReviewRow label="Vitals" value={`${formData.age || '?'}y | ${formData.gender || '?'} | ${formData.bloodGroup || '?'}`} />
                            </div>
                            <button
                                type="submit" disabled={loading}
                                className="w-full py-6 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-[14px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={18} /> : <>Create Secure Account <CheckCircle size={18} /></>}
                            </button>
                            <button type="button" onClick={() => setStep(4)} className="w-full text-[14px] text-slate-400 font-black uppercase tracking-widest hover:text-teal-600 transition-colors">
                                ← Edit Information
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const FeatureItem = ({ icon, text }) => (
    <div className="flex items-center gap-3 text-[14px] font-bold text-slate-400">
        <span className="text-teal-500">{icon}</span>
        {text}
    </div>
);

const ReviewRow = ({ label, value }) => (
    <div>
        <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-black text-slate-900">{value}</p>
    </div>
);

export default PatientRegister;
