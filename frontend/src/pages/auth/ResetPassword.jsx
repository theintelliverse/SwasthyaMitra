import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { LockKeyhole, Eye, EyeOff, ArrowRight, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const clinicCode = searchParams.get('clinicCode');

    useEffect(() => {
        if (!token || !email || !clinicCode) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Link',
                text: 'Password reset link is invalid or expired.',
                confirmButtonText: 'Back to Login'
            }).then(() => navigate('/login'));
        }
    }, [token, email, clinicCode, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.newPassword || !formData.confirmPassword) {
                Swal.fire('Error', 'All fields are required', 'error');
                setLoading(false);
                return;
            }

            if (formData.newPassword.length < 6) {
                Swal.fire('Error', 'Password must be at least 6 characters', 'error');
                setLoading(false);
                return;
            }

            if (formData.newPassword !== formData.confirmPassword) {
                Swal.fire('Error', 'Passwords do not match', 'error');
                setLoading(false);
                return;
            }

            const res = await axios.post(`${API_URL}/api/auth/reset-password`, {
                email,
                clinicCode,
                token,
                newPassword: formData.newPassword
            });

            if (res.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Password Reset!',
                    text: 'Your password has been reset successfully. Logging you in...',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#EEF6FA',
                    color: '#0F766E'
                }).then(() => {
                    navigate('/login');
                });
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to reset password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-parchment text-teak flex flex-col items-center justify-center p-6 font-body">
            <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl p-10 border border-sandstone/50 relative overflow-hidden">

                {/* Decorative Accent */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-100/30 rounded-full"></div>

                {/* Header */}
                <header className="text-center mb-10 relative z-10">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl text-green-600">
                        <CheckCircle size={28} />
                    </div>
                    <h1 className="text-2xl font-heading text-teak">Create New Password</h1>
                    <p className="text-khaki text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        Secure Your Account
                    </p>
                </header>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

                    {/* New Password */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">
                            New Password *
                        </label>
                        <div className="relative">
                            <LockKeyhole size={18} className="absolute left-5 top-4 text-khaki" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="newPassword"
                                required
                                placeholder="Enter new password"
                                className="w-full pl-14 pr-14 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                                value={formData.newPassword}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-4 text-khaki hover:text-marigold"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="text-xs text-khaki mt-1 ml-2">Minimum 6 characters</p>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">
                            Confirm Password *
                        </label>
                        <div className="relative">
                            <LockKeyhole size={18} className="absolute left-5 top-4 text-khaki" />
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                name="confirmPassword"
                                required
                                placeholder="Re-enter password"
                                className="w-full pl-14 pr-14 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-5 top-4 text-khaki hover:text-marigold"
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-green-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-8"
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
            </div>
        </div>
    );
};

export default ResetPassword;
