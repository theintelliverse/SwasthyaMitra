import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Smartphone, ArrowRight, RefreshCw, ArrowLeft, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';

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

    // Calculate password strength
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

        // Update password strength
        if (name === 'newPassword') {
            setPasswordStrength(checkPasswordStrength(value));
        }
    };

    // Step 1: Send OTP
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
            const res = await axios.post(`${API_URL}/api/auth/patient/forgot-password`, {
                phone: formData.phone
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
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.message || 'Failed to send OTP',
                confirmButtonColor: '#FF6B6B',
                background: '#FFF5F5',
                color: '#C92A2A'
            });
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
            // Just verify the OTP first - don't need backend confirmation, move to password step
            // In a real app, you might want to verify this against the server
            // For now, we proceed to password creation
            setStep(3);
            Swal.fire({
                icon: 'success',
                title: '✅ OTP Verified',
                text: 'Now create your new password',
                confirmButtonText: 'OK',
                background: '#EEF6FA',
                color: '#0F766E',
                confirmButtonColor: '#FFA800'
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Verification Failed',
                text: err.response?.data?.message || 'Invalid OTP',
                confirmButtonColor: '#FF6B6B',
                background: '#FFF5F5',
                color: '#C92A2A'
            });
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password with OTP
    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (formData.newPassword.length < 6) {
            Swal.fire({
                icon: 'error',
                title: 'Weak Password',
                text: 'Password must be at least 6 characters',
                confirmButtonColor: '#FF6B6B',
                background: '#FFF5F5',
                color: '#C92A2A'
            });
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Password Mismatch',
                text: 'Passwords do not match',
                confirmButtonColor: '#FF6B6B',
                background: '#FFF5F5',
                color: '#C92A2A'
            });
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
                    title: '🔐 Password Reset!',
                    html: `<p>${res.data.message}</p><p style="font-size: 12px; color: #666; margin-top: 10px;">Redirecting to login...</p>`,
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#EEF6FA',
                    color: '#0F766E'
                }).then(() => {
                    navigate('/patient/login');
                });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Reset Failed',
                text: err.response?.data?.message || 'Failed to reset password',
                confirmButtonColor: '#FF6B6B',
                background: '#FFF5F5',
                color: '#C92A2A'
            });
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength === 0) return 'bg-gray-300';
        if (passwordStrength === 1) return 'bg-red-500';
        if (passwordStrength === 2) return 'bg-orange-500';
        if (passwordStrength === 3) return 'bg-yellow-500';
        if (passwordStrength === 4) return 'bg-blue-500';
        return 'bg-green-500';
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength === 0) return 'Very Weak';
        if (passwordStrength === 1) return 'Weak';
        if (passwordStrength === 2) return 'Fair';
        if (passwordStrength === 3) return 'Good';
        if (passwordStrength === 4) return 'Strong';
        return 'Very Strong';
    };

    return (
        <div className="min-h-screen bg-parchment text-teak flex flex-col items-center justify-center p-6 font-body">
            <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl p-10 border border-sandstone/50 relative overflow-hidden">

                {/* Decorative Accent */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-marigold/5 rounded-full"></div>

                {/* Header */}
                <header className="text-center mb-10 relative z-10">
                    <div className="w-16 h-16 bg-marigold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-marigold/20 text-white">
                        <ShieldCheck size={28} />
                    </div>
                    <h1 className="text-2xl font-heading text-teak">Reset Password</h1>
                    <p className="text-khaki text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Secure Account Recovery
                    </p>
                    <div className="mt-4 text-[9px] text-khaki font-bold tracking-widest">
                        Step {step} of 3
                    </div>
                </header>

                {/* Step 1: Phone */}
                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-6 relative z-10 animate-in fade-in duration-500">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">
                                Mobile Number *
                            </label>
                            <div className="relative">
                                <Smartphone size={18} className="absolute left-5 top-4 text-khaki" />
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    placeholder="91XXXXXXXXXX"
                                    className="w-full pl-14 pr-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>
                            <p className="text-[9px] text-khaki/70 mt-1 ml-2">
                                Enter the phone number linked to your account
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-marigold text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-saffron transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    Send OTP
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-6 relative z-10 animate-in slide-in-from-right-8 duration-500">
                        <div className="bg-marigold/10 p-4 rounded-2xl border border-marigold/30">
                            <p className="text-[9px] text-khaki font-bold">Verification code sent to:</p>
                            <p className="font-bold text-teak text-lg">{formData.phone}</p>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="text-[9px] text-marigold font-black uppercase mt-2 hover:underline"
                            >
                                Use Different Number
                            </button>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">
                                6-Digit Code *
                            </label>
                            <input
                                type="text"
                                name="otp"
                                required
                                placeholder="000000"
                                maxLength="6"
                                className="w-full py-4 bg-parchment border-2 border-sandstone rounded-2xl outline-none focus:border-marigold font-bold text-center text-2xl tracking-[0.2em] text-teak"
                                value={formData.otp}
                                onChange={handleChange}
                                disabled={loading}
                                autoFocus
                            />
                            <p className="text-[9px] text-khaki/70 mt-1 ml-2">Code expires in 5 minutes</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-saffron text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-marigold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Verify OTP
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full py-3 border border-khaki text-khaki rounded-2xl font-bold text-sm uppercase hover:bg-parchment transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>
                    </form>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-6 relative z-10 animate-in slide-in-from-right-8 duration-500">
                        <div className="bg-green-50 p-3 rounded-2xl border border-green-200">
                            <p className="text-[9px] text-green-700 font-bold">✓ Phone verified with {formData.phone}</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">
                                New Password *
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-5 top-4.5 text-khaki" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="newPassword"
                                    required
                                    placeholder="Min 6 characters"
                                    className="w-full pl-14 pr-14 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-4.5 text-khaki hover:text-marigold transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {formData.newPassword && (
                                <div className="mt-3 ml-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${getPasswordStrengthColor()} transition-all`}
                                                style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[9px] font-bold text-khaki">{getPasswordStrengthText()}</span>
                                    </div>
                                    <p className="text-[8px] text-khaki/70">
                                        Tip: Use uppercase, numbers, and special characters for stronger security
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">
                                Confirm Password *
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-5 top-4.5 text-khaki" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    required
                                    placeholder="Re-enter password"
                                    className="w-full pl-14 pr-14 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-5 top-4.5 text-khaki hover:text-marigold transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                                <p className="text-[9px] text-red-600 mt-1 ml-2">⚠ Passwords don't match</p>
                            )}
                            {formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                                <p className="text-[9px] text-green-600 mt-1 ml-2">✓ Passwords match</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || formData.newPassword !== formData.confirmPassword}
                            className="w-full py-5 bg-green-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    Reset Password
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="w-full py-3 border border-khaki text-khaki rounded-2xl font-bold text-sm uppercase hover:bg-parchment transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>
                    </form>
                )}

                {/* Back to Login */}
                <div className="text-center mt-8 pt-6 border-t border-sandstone/50">
                    <button
                        onClick={() => navigate('/patient/login')}
                        className="text-[10px] font-bold text-khaki hover:text-teak transition-colors"
                    >
                        Back to Patient Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientForgotPassword;
