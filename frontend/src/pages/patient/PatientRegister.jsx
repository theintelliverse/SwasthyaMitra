import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { User, Phone, Heart, Users, ArrowRight, ArrowLeft, RefreshCw, Eye, EyeOff, Lock } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const PatientRegister = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Password, 4: Personal Info, 5: Submit
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
                confirmButtonColor: '#FF6B6B',
                background: '#FFF5F5',
                color: '#C92A2A'
            });
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/patient/send-otp`, {
                phone: formData.phone,
                isRegistration: true  // Flag to check for duplicates
            });
            if (res.data.success) {
                setStep(2);
                const devOtp = res.data.debugOtp ? ` (Dev OTP: ${res.data.debugOtp})` : '';
                Swal.fire({
                    icon: 'success',
                    title: '📱 OTP Sent!',
                    html: `<p>${res.data.message}</p><p style="font-size: 12px; color: #666; margin-top: 10px;">${devOtp}</p>`,
                    confirmButtonText: 'OK',
                    background: '#EEF6FA',
                    color: '#0F766E',
                    confirmButtonColor: '#FFA800'
                });
            }
        } catch (err) {
            const isDuplicate = err.response?.data?.isDuplicate;
            const errorMessage = err.response?.data?.message || 'Failed to send OTP';
            
            if (isDuplicate) {
                // Handle duplicate phone number
                Swal.fire({
                    icon: 'error',
                    title: '📱 Phone Already Registered',
                    html: `<p>${errorMessage}</p><p style="font-size: 12px; color: #666; margin-top: 10px;">This phone number has an existing account.</p>`,
                    confirmButtonText: 'Go to Login',
                    confirmButtonColor: '#FF6B6B',
                    background: '#FFF5F5',
                    color: '#C92A2A',
                    showCancelButton: true,
                    cancelButtonText: 'Try Different Number'
                }).then((result) => {
                    if (result.isConfirmed) {
                        navigate('/patient/login');
                    }
                    // If cancelled, user stays on registration page
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error Sending OTP',
                    text: errorMessage,
                    confirmButtonColor: '#FF6B6B',
                    background: '#FFF5F5',
                    color: '#C92A2A'
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
            Swal.fire({
                icon: 'error',
                title: 'Invalid OTP',
                text: 'Please enter a valid 6-digit OTP',
                confirmButtonColor: '#FF6B6B',
                background: '#FFF5F5',
                color: '#C92A2A'
            });
            return;
        }

        setLoading(true);
        try {
            // Just verify the OTP without creating the account
            const testRes = await axios.post(`${API_URL}/api/auth/patient/verify-otp`, {
                phone: formData.phone,
                otp: formData.otp
            });

            if (testRes.data.success) {
                setStep(3); // Move to password creation
                Swal.fire({
                    icon: 'success',
                    title: '✅ Phone Verified',
                    text: 'Now create a secure password',
                    confirmButtonText: 'OK',
                    background: '#EEF6FA',
                    color: '#0F766E',
                    confirmButtonColor: '#FFA800'
                });
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Invalid OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Create Password then move to personal info
    const handleCreatePassword = async (e) => {
        e.preventDefault();

        if (formData.password.length < 6) {
            Swal.fire('Error', 'Password must be at least 6 characters', 'error');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            Swal.fire('Error', 'Passwords do not match', 'error');
            return;
        }

        // Move to personal info step
        setStep(4);
        Swal.fire({
            icon: 'success',
            title: '🔐 Password Set',
            text: 'Now tell us about yourself',
            confirmButtonText: 'OK',
            background: '#EEF6FA',
            color: '#0F766E',
            confirmButtonColor: '#FFA800'
        });
    };

    // Step 4: Personal Info Inputs - then Step 5 will submit
    const handlePersonalInfo = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            Swal.fire('Error', 'Name is required', 'error');
            return;
        }

        setStep(5); // Move to confirmation
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
                    html: `<p>Account created successfully, <strong>${res.data.patient.name}</strong>!</p>`,
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#EEF6FA',
                    color: '#0F766E'
                }).then(() => {
                    navigate('/patient/dashboard');
                });
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-parchment text-teak flex flex-col items-center justify-center p-6 font-body">
            <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl p-10 border border-sandstone/50 relative overflow-hidden">

                {/* Decorative Accent */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-marigold/5 rounded-full"></div>

                {/* Header */}
                <header className="text-center mb-10 relative z-10">
                    <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl text-marigold">
                        <User size={28} />
                    </div>
                    <h1 className="text-2xl font-heading text-teak">Create Account</h1>
                    <p className="text-khaki text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Join SwasthyaMitra
                    </p>
                    <div className="mt-4 text-[9px] text-khaki font-bold tracking-widest">
                        Step {step} of 5
                    </div>
                </header>

                {/* Step 1: Phone */}
                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-5 relative z-10 animate-in fade-in">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">Mobile Number *</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-5 top-4 text-khaki" />
                                <input
                                    type="tel"
                                    required
                                    placeholder="91XXXXXXXXXX"
                                    className="w-full pl-14 pr-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-marigold text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-saffron transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw size={18} className="animate-spin" /> : <>Send OTP <ArrowRight size={18} /></>}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-5 relative z-10 animate-in slide-in-from-right-8">
                        <div className="text-center mb-4">
                            <p className="text-xs text-khaki">OTP sent to</p>
                            <p className="font-bold text-teak">{formData.phone}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-khaki block text-center tracking-widest">6-Digit OTP</label>
                            <input
                                type="text"
                                required
                                placeholder="000000"
                                maxLength="6"
                                className="w-full py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-center text-2xl tracking-[0.2em] text-teak"
                                value={formData.otp}
                                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-marigold text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-saffron transition-all disabled:opacity-50"
                        >
                            {loading ? <RefreshCw size={18} className="animate-spin" /> : 'Verify OTP'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-[10px] text-khaki hover:text-marigold font-bold uppercase w-full text-center"
                        >
                            ← Back
                        </button>
                    </form>
                )}

                {/* Step 3: Password */}
                {step === 3 && (
                    <form onSubmit={handleCreatePassword} className="space-y-5 relative z-10 animate-in slide-in-from-right-8">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">Create Password *</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-5 top-4.5 text-khaki" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Min 6 characters"
                                    className="w-full pl-14 pr-14 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-4.5 text-khaki hover:text-marigold"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">Confirm Password *</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-5 top-4.5 text-khaki" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Re-enter password"
                                    className="w-full pl-14 pr-14 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-5 top-4.5 text-khaki hover:text-marigold"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-marigold text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-saffron transition-all disabled:opacity-50"
                        >
                            {loading ? <RefreshCw size={18} className="animate-spin" /> : 'Continue'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="text-[10px] text-khaki hover:text-marigold font-bold uppercase w-full text-center"
                        >
                            ← Back
                        </button>
                    </form>
                )}

                {/* Step 4: Personal Information */}
                {step === 4 && (
                    <form onSubmit={handlePersonalInfo} className="space-y-4 relative z-10 animate-in slide-in-from-right-8">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">Full Name *</label>
                            <div className="relative">
                                <User size={18} className="absolute left-5 top-4 text-khaki" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Your Full Name"
                                    className="w-full pl-14 pr-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">Age</label>
                            <input
                                type="number"
                                placeholder="Your Age"
                                className="w-full px-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">Gender</label>
                            <select
                                className="w-full px-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">Blood Group</label>
                            <select
                                className="w-full px-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                                value={formData.bloodGroup}
                                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                            >
                                <option value="">Select Blood Group</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-5 bg-marigold text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-saffron transition-all"
                        >
                            Review & Continue → 
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(3)}
                            className="text-[10px] text-khaki hover:text-marigold font-bold uppercase w-full text-center"
                        >
                            ← Back
                        </button>
                    </form>
                )}

                {/* Step 5: Review & Submit */}
                {step === 5 && (
                    <form onSubmit={handleFinalSubmit} className="space-y-4 relative z-10 animate-in slide-in-from-right-8">
                        <div className="text-center mb-4 p-4 bg-parchment rounded-2xl">
                            <p className="text-[10px] font-black uppercase text-khaki mb-3">Review Your Information</p>
                            <div className="space-y-2 text-left text-sm">
                                <p><strong>Phone:</strong> {formData.phone}</p>
                                <p><strong>Name:</strong> {formData.name}</p>
                                {formData.age && <p><strong>Age:</strong> {formData.age}</p>}
                                {formData.gender && <p><strong>Gender:</strong> {formData.gender}</p>}
                                {formData.bloodGroup && <p><strong>Blood:</strong> {formData.bloodGroup}</p>}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-saffron text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-marigold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw size={18} className="animate-spin" /> : <>Create My Account <ArrowRight size={18} /></>}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(4)}
                            className="text-[10px] text-khaki hover:text-marigold font-bold uppercase w-full text-center"
                        >
                            ← Edit Information
                        </button>
                    </form>
                )}

                {/* Footer Links */}
                {step === 1 && (
                    <div className="mt-8 text-center space-y-2">
                        <p className="text-[9px] text-khaki">Already have an account?</p>
                        <button
                            type="button"
                            onClick={() => navigate('/patient/login')}
                            className="text-sm font-bold text-marigold hover:text-saffron flex items-center justify-center gap-1 mx-auto"
                        >
                            <ArrowLeft size={16} />
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientRegister;
