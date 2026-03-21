import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Smartphone, ArrowRight, RefreshCw, ArrowLeft, ShieldCheck } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const PatientForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        otp: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.phone) {
                Swal.fire('Error', 'Phone number is required', 'error');
                setLoading(false);
                return;
            }

            const res = await axios.post(`${API_URL}/api/auth/patient/forgot-password`, {
                phone: formData.phone
            });

            if (res.data.success) {
                setStep(2);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'OTP Sent',
                    text: 'Check your phone for the verification code',
                    showConfirmButton: false,
                    timer: 3000,
                    background: '#EEF6FA',
                    color: '#0F766E'
                });
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to send OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.otp) {
                Swal.fire('Error', 'OTP is required', 'error');
                setLoading(false);
                return;
            }

            const res = await axios.post(`${API_URL}/api/auth/patient/reset-password`, {
                phone: formData.phone,
                otp: formData.otp
            });

            if (res.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Verified!',
                    text: 'Your phone has been verified. You can now login with your OTP.',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#EEF6FA',
                    color: '#0F766E'
                }).then(() => {
                    navigate('/patient/login');
                });
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Invalid OTP', 'error');
            setFormData({ ...formData, otp: '' });
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
                    <div className="w-16 h-16 bg-marigold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-marigold/20 text-white">
                        <ShieldCheck size={28} />
                    </div>
                    <h1 className="text-2xl font-heading text-teak">Recover Access</h1>
                    <p className="text-khaki text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Patient Security Verification
                    </p>
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
                                />
                            </div>
                            <p className="text-xs text-khaki mt-1 ml-2">
                                Enter the phone number linked to your account
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-marigold text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-saffron transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-8"
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
                            <p className="text-xs text-khaki">Verification code sent to:</p>
                            <p className="font-bold text-teak">{formData.phone}</p>
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
                                placeholder="0 0 0 0 0 0"
                                maxLength="6"
                                className="w-full py-6 bg-parchment border-2 border-sandstone rounded-[2rem] outline-none focus:border-marigold font-heading text-4xl text-center tracking-[0.3em] text-teak"
                                value={formData.otp}
                                onChange={handleChange}
                                autoFocus
                            />
                            <p className="text-xs text-khaki mt-1 ml-2">Code expires in 5 minutes</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-green-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Verify & Login
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
