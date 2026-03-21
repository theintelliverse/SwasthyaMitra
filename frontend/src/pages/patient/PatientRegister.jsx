import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { User, Phone, Heart, Users, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const PatientRegister = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        name: '',
        age: '',
        gender: '',
        bloodGroup: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate required fields
            if (!formData.phone || !formData.name) {
                Swal.fire('Error', 'Phone and Name are required', 'error');
                setLoading(false);
                return;
            }

            const res = await axios.post(`${API_URL}/api/auth/patient/register`, {
                phone: formData.phone,
                name: formData.name,
                age: formData.age ? parseInt(formData.age) : null,
                gender: formData.gender || null,
                bloodGroup: formData.bloodGroup || null
            });

            if (res.data.success) {
                // Save token to localStorage
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('role', 'patient');
                localStorage.setItem('patientName', res.data.patient.name);

                Swal.fire({
                    icon: 'success',
                    title: 'Welcome!',
                    text: `Registration successful, ${res.data.patient.name}`,
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
                </header>

                {/* Form */}
                <form onSubmit={handleRegister} className="space-y-5 relative z-10">

                    {/* Phone Number */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">
                            Mobile Number *
                        </label>
                        <div className="relative">
                            <Phone size={18} className="absolute left-5 top-4 text-khaki" />
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
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">
                            Full Name *
                        </label>
                        <div className="relative">
                            <User size={18} className="absolute left-5 top-4 text-khaki" />
                            <input
                                type="text"
                                name="name"
                                required
                                placeholder="Your Full Name"
                                className="w-full pl-14 pr-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Age */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">
                            Age (Optional)
                        </label>
                        <input
                            type="number"
                            name="age"
                            placeholder="Your Age"
                            className="w-full px-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                            value={formData.age}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Gender */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">
                            Gender (Optional)
                        </label>
                        <div className="relative">
                            <Users size={18} className="absolute left-5 top-4 text-khaki pointer-events-none" />
                            <select
                                name="gender"
                                className="w-full pl-14 pr-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all appearance-none cursor-pointer"
                                value={formData.gender}
                                onChange={handleChange}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Blood Group */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">
                            Blood Group (Optional)
                        </label>
                        <div className="relative">
                            <Heart size={18} className="absolute left-5 top-4 text-khaki pointer-events-none" />
                            <select
                                name="bloodGroup"
                                className="w-full pl-14 pr-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all appearance-none cursor-pointer"
                                value={formData.bloodGroup}
                                onChange={handleChange}
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
                                Creating...
                            </>
                        ) : (
                            <>
                                Create Account
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    {/* Login Link */}
                    <div className="text-center mt-6">
                        <p className="text-xs text-khaki">Already have an account?</p>
                        <button
                            type="button"
                            onClick={() => navigate('/patient/login')}
                            className="text-sm font-bold text-marigold hover:text-saffron transition-colors flex items-center justify-center gap-1 mx-auto mt-2"
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

export default PatientRegister;
