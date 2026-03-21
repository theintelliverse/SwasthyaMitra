import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Mail, LockKeyhole, Hash, ArrowRight, RefreshCw, ArrowLeft } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        clinicCode: '',
        email: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.clinicCode || !formData.email) {
                Swal.fire('Error', 'Clinic code and email are required', 'error');
                setLoading(false);
                return;
            }

            const res = await axios.post(`${API_URL}/api/auth/forgot-password`, {
                clinicCode: formData.clinicCode,
                email: formData.email
            });

            if (res.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Check Your Email',
                    text: 'Password reset link has been sent to your email. Valid for 1 hour.',
                    timer: 3000,
                    showConfirmButton: false,
                    background: '#EEF6FA',
                    color: '#0F766E'
                }).then(() => {
                    navigate('/login');
                });
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to send reset link', 'error');
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
                    <div className="w-16 h-16 bg-marigold/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl text-marigold">
                        <LockKeyhole size={28} />
                    </div>
                    <h1 className="text-2xl font-heading text-teak">Reset Password</h1>
                    <p className="text-khaki text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Staff Account Recovery
                    </p>
                </header>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

                    {/* Clinic Code */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">
                            Clinic Code *
                        </label>
                        <div className="relative">
                            <Hash size={18} className="absolute left-5 top-4 text-khaki" />
                            <input
                                type="text"
                                name="clinicCode"
                                required
                                placeholder="E.g., CLINIC001"
                                className="w-full pl-14 pr-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all uppercase"
                                value={formData.clinicCode}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">
                            Email Address *
                        </label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-5 top-4 text-khaki" />
                            <input
                                type="email"
                                name="email"
                                required
                                placeholder="your.email@clinic.com"
                                className="w-full pl-14 pr-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <p className="text-xs text-khaki mt-2 ml-2">
                            We'll send a password reset link to this email.
                        </p>
                    </div>

                    {/* Submit Button */}
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
                                Send Reset Link
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    {/* Back to Login */}
                    <div className="text-center mt-6">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="flex items-center justify-center gap-2 text-sm font-bold text-khaki hover:text-teak transition-colors mx-auto"
                        >
                            <ArrowLeft size={16} />
                            Back to Login
                        </button>
                    </div>
                </form>

                {/* Help Text */}
                <div className="mt-8 pt-6 border-t border-sandstone/50 text-center">
                    <p className="text-[9px] text-khaki font-black uppercase tracking-tighter">
                        Reset link expires in 1 hour
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
