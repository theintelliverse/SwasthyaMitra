import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
    ArrowLeft, User, Mail, Award, Clock, BookOpen, Save, 
    ShieldCheck, Activity, Phone, Briefcase, GraduationCap, 
    Calendar, Check, Edit3, X, Loader, CheckCircle, MapPin, 
    Droplet, UserCircle, Hash, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')).replace(/\/$/, '');

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const token = localStorage.getItem('token');
    const role = (localStorage.getItem('role') || 'staff').toLowerCase();

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        try {
            // Role-based endpoint selection
            const endpoint = role === 'patient' 
                ? `${API_URL}/api/auth/patient/profile` 
                : `${API_URL}/api/auth/me`;

            const res = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data.data);
        } catch (err) {
            console.error("Failed to load profile:", err);
            Swal.fire({ icon: 'error', title: 'Session Expired', text: 'Please login again.', confirmButtonColor: '#0D9488' });
            navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [role, token, navigate]);

    const handleLogout = async () => {
        try {
            const sessionId = localStorage.getItem('sessionId');
            if (sessionId && token) {
                await axios.post(`${API_URL}/api/auth/logout`, { sessionId }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (err) {
            console.error("Logout tracking failed", err);
        } finally {
            localStorage.clear();
            navigate('/login');
        }
    };

    useEffect(() => {
        if (token) fetchProfile();
        else navigate('/login');
    }, [token, fetchProfile, navigate]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaveLoading(true);
        try {
            const endpoint = role === 'patient'
                ? `${API_URL}/api/auth/patient/update-profile`
                : `${API_URL}/api/auth/update-profile`;

            const res = await axios.patch(endpoint, user, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.data) {
                if (res.data.data.avgWaitTime) localStorage.setItem('avgWaitTime', res.data.data.avgWaitTime);
                if (res.data.data.name) localStorage.setItem('userName', res.data.data.name);
                if (res.data.data.specialization) localStorage.setItem('specialization', res.data.data.specialization);
                if (res.data.data.education) localStorage.setItem('education', res.data.data.education);
                if (res.data.data.clinicLocation) localStorage.setItem('clinicLocation', res.data.data.clinicLocation);
                if (res.data.data.clinicContact) localStorage.setItem('clinicContact', res.data.data.clinicContact);
            }
            
            Swal.fire({
                icon: 'success',
                title: role === 'patient' ? 'Health Profile Updated! 🥗' : 'Identity Verified! ✨',
                timer: 1500,
                showConfirmButton: false,
                background: '#F8FAFC'
            });
            setIsEditing(false);
            setUser(res.data.data); // Update local state with fresh data from server
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Update Failed', text: err.response?.data?.message || 'Something went wrong.', confirmButtonColor: '#0D9488' });
        } finally {
            setSaveLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
            <Loader size={32} className="text-teal-600 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Secure Vault...</p>
        </div>
    );

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-[#F0F4F8] text-slate-900 font-body relative overflow-hidden selection:bg-teal-200 selection:text-teal-900">
            {/* Ultra-Premium Aurora Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-teal-400/20 mix-blend-multiply filter blur-[100px] opacity-70 animate-[blob_7s_infinite] pointer-events-none"></div>
            <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-400/20 mix-blend-multiply filter blur-[100px] opacity-70 animate-[blob_7s_infinite_2s] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-blue-400/20 mix-blend-multiply filter blur-[100px] opacity-70 animate-[blob_7s_infinite_4s] pointer-events-none"></div>
            
            <Sidebar role={role} />
            
            <div className="flex-grow p-4 md:p-6 lg:p-10 overflow-y-auto h-screen custom-scrollbar max-w-7xl mx-auto w-full pb-24 md:pb-10 relative z-10">
                {/* Top Navigation */}
                <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-3 mb-4 animate-in fade-in slide-in-from-left-8 duration-700">
                            <div className="px-4 py-1.5 bg-white/60 backdrop-blur-xl border border-white text-teal-700 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-2 hover:bg-white hover:shadow-md transition-all">
                                <div className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                                </div>
                                {role === 'patient' ? 'Wellness Member' : 'Clinical Associate'}
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter flex items-center gap-2 mb-3 animate-in fade-in slide-in-from-left-10 duration-1000">
                            {role === 'patient' ? 'My Health Profile' : 'Professional Identity'} 
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-600 animate-pulse">.</span>
                        </h1>
                        <p className="text-slate-500 font-bold text-[11px] md:text-xs leading-relaxed border-l-2 border-teal-400 pl-4 py-0.5 animate-in fade-in slide-in-from-left-12 duration-1000 delay-150 uppercase tracking-widest">
                            {role === 'patient' ? 'Manage your medical baseline & preferences' : 'Update your clinical credentials & bio'}
                        </p>
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                    <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-start">
                        {/* LEFT COLUMN: Identity Card */}
                        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-10">
                            <div className="bg-slate-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(15,23,42,0.3)] border border-slate-800 overflow-hidden text-center relative group isolate">
                                {/* Visual Banner */}
                                <div className="absolute inset-0 bg-gradient-to-b from-teal-500/10 via-transparent to-slate-900 opacity-50 group-hover:opacity-100 transition-opacity duration-700 -z-10"></div>
                                
                                <div className={`h-32 ${role === 'patient' ? 'bg-gradient-to-br from-teal-900 to-slate-900' : 'bg-gradient-to-r from-slate-800 to-slate-900'} relative overflow-hidden border-b border-white/5`}>
                                    <div className="absolute inset-0 opacity-[0.15]">
                                        <div className="absolute -top-8 -right-8 p-6 rotate-12 transition-transform duration-1000 group-hover:rotate-45 group-hover:scale-125"><Activity size={120} className="text-teal-400" /></div>
                                        <div className="absolute -bottom-8 -left-8 p-3 -rotate-12 transition-transform duration-1000 group-hover:-rotate-45 group-hover:scale-125"><ShieldCheck size={100} className="text-indigo-400" /></div>
                                    </div>
                                </div>
                                <div className="px-6 pb-10 pt-16 relative flex flex-col items-center">
                                    <div className="absolute -top-14 group-hover:-translate-y-2 transition-transform duration-500">
                                        <div className="w-28 h-28 bg-gradient-to-br from-teal-400 via-teal-500 to-indigo-600 rounded-3xl flex items-center justify-center text-5xl text-white shadow-[0_0_40px_rgba(45,212,191,0.4)] border-[4px] border-slate-900 font-black ring-1 ring-white/10 group-hover:shadow-[0_0_60px_rgba(45,212,191,0.6)] transition-all duration-500">
                                            {user.name?.charAt(0)}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center border border-white/10">
                                            <div className="w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(20,184,166,0.8)]">
                                                <Check size={16} strokeWidth={3} />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <span className="px-4 py-1.5 bg-white/5 text-teal-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-white/10 mb-4 backdrop-blur-md shadow-inner">
                                        {role.toUpperCase()} VERIFIED
                                    </span>
                                    <h1 className="text-2xl font-black text-white tracking-tighter mb-1.5">{user.name}</h1>
                                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.15em] flex items-center justify-center gap-2">
                                        <MapPin size={12} className="text-teal-400" /> 
                                        {role === 'patient' ? `Member since ${new Date(user.createdAt || Date.now()).getFullYear()}` : (user.specialization || "Clinical Associate")}
                                    </p>

                                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8"></div>

                                    <div className="flex flex-col w-full gap-3 relative z-10">
                                        <button 
                                            onClick={() => setIsEditing(!isEditing)} 
                                            className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border flex justify-center items-center gap-2.5 overflow-hidden relative group/btn ${isEditing ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                                        >
                                            <div className="absolute inset-0 bg-white/5 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                            <span className="relative z-10 flex items-center gap-2.5">
                                                {isEditing ? <><X size={16} /> Cancel Edit</> : <><Edit3 size={16} /> Edit Profile</>}
                                            </span>
                                        </button>
                                        <button 
                                            onClick={handleLogout} 
                                            className="w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all bg-transparent text-slate-500 border border-transparent hover:bg-white/5 hover:text-white flex justify-center items-center gap-2.5"
                                        >
                                            <LogOut size={16} /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Meta Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                                <div className="p-5 bg-white/70 backdrop-blur-2xl rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(20,184,166,0.1)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-teal-50 to-teal-100/50 group-hover:from-teal-100 group-hover:to-teal-200/50 rounded-2xl flex items-center justify-center text-teal-600 shrink-0 transition-colors shadow-inner border border-teal-100/50">
                                            <ShieldCheck size={22} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900 tracking-tight">Privacy Center</h4>
                                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.15em] mt-1">Manage data</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 bg-white/70 backdrop-blur-2xl rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.1)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-indigo-100/50 group-hover:from-indigo-100 group-hover:to-indigo-200/50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 transition-colors shadow-inner border border-indigo-100/50">
                                            <Clock size={22} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900 tracking-tight">Access Logs</h4>
                                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.15em] mt-1">Security events</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Form Details */}
                        <div className="lg:col-span-8">
                            <form onSubmit={handleUpdate} className="bg-white/80 backdrop-blur-2xl rounded-[3rem] p-8 md:p-12 shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white relative overflow-hidden group/form">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-100/40 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none opacity-50 group-hover/form:opacity-100 transition-opacity duration-1000"></div>
                                
                                <div className="mb-10 pb-8 border-b border-slate-100/50 flex items-center justify-between relative z-10">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Profile Details</h3>
                                        <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">Update your information</p>
                                    </div>
                                    {isEditing && (
                                        <button type="submit" disabled={saveLoading} className="hidden sm:flex px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 transition-all items-center gap-2.5 active:scale-95 disabled:opacity-50">
                                            {saveLoading ? <Loader size={16} className="animate-spin text-teal-400" /> : <Save size={16} className="text-teal-400" />} Save Changes
                                        </button>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-x-8 gap-y-8 relative z-10">
                                    <ProfileInput 
                                        icon={<User size={18} />} 
                                        label="Full Identity" 
                                        value={user.name} 
                                        disabled={!isEditing} 
                                        onChange={(val) => setUser({...user, name: val})} 
                                    />
                                    <ProfileInput 
                                        icon={<Mail size={18} />} 
                                        label="System Email" 
                                        value={user.email || "N/A (OTP Linked)"} 
                                        disabled={true} 
                                    />
                                    <ProfileInput 
                                        icon={<Phone size={18} />} 
                                        label="Secure Contact" 
                                        value={user.phone || user.phoneNumber || user.contactPhone || 'Not provided'} 
                                        disabled={true} 
                                    />

                                    {role === 'patient' ? (
                                        <>
                                            <ProfileInput 
                                                icon={<Hash size={18} />} 
                                                label="Current Age" 
                                                value={user.age} 
                                                type="number"
                                                disabled={!isEditing} 
                                                onChange={(val) => setUser({...user, age: val})} 
                                            />
                                            <div className="space-y-2 group">
                                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em] group-focus-within:text-teal-600 transition-colors">Gender Identity</label>
                                                <div className="relative">
                                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors ${isEditing && 'group-focus-within:text-teal-600'}`}>
                                                        <UserCircle size={18} />
                                                    </div>
                                                    <select 
                                                        disabled={!isEditing}
                                                        className="w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200/60 rounded-2xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:bg-white font-black text-sm text-slate-900 shadow-sm appearance-none disabled:opacity-60 disabled:bg-slate-50 transition-all duration-300"
                                                        value={user.gender || ''}
                                                        onChange={(e) => setUser({...user, gender: e.target.value})}
                                                    >
                                                        <option value="">Select Gender</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <ProfileInput 
                                                icon={<Droplet size={18} />} 
                                                label="Blood Group" 
                                                value={user.bloodGroup} 
                                                disabled={!isEditing} 
                                                onChange={(val) => setUser({...user, bloodGroup: val})} 
                                                placeholder="e.g. O+ve"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <ProfileInput 
                                                icon={<MapPin size={18} />} 
                                                label="Clinic Location" 
                                                value={user.clinicLocation} 
                                                disabled={!isEditing} 
                                                onChange={(val) => setUser({...user, clinicLocation: val})} 
                                                placeholder="e.g. Main Street, New Delhi"
                                            />
                                            <ProfileInput 
                                                icon={<Phone size={18} />} 
                                                label="Clinic Contact" 
                                                value={user.clinicContact} 
                                                disabled={!isEditing} 
                                                onChange={(val) => setUser({...user, clinicContact: val})} 
                                                placeholder="e.g. +91 98765 43210"
                                            />
                                            <ProfileInput 
                                                icon={<GraduationCap size={18} />} 
                                                label="Clinical Credentials" 
                                                value={user.education} 
                                                disabled={!isEditing} 
                                                onChange={(val) => setUser({...user, education: val})} 
                                                placeholder="e.g. MBBS, MD"
                                            />
                                            <ProfileInput 
                                                icon={<Briefcase size={18} />} 
                                                label="Years of Experience" 
                                                value={user.experience} 
                                                type="number"
                                                disabled={!isEditing} 
                                                onChange={(val) => setUser({...user, experience: val})} 
                                            />
                                            {role === 'doctor' && (
                                                <ProfileInput 
                                                    icon={<Clock size={18} />} 
                                                    label="Session Avg (Mins)" 
                                                    value={user.avgWaitTime} 
                                                    disabled={!isEditing} 
                                                    onChange={(val) => setUser({...user, avgWaitTime: val})} 
                                                />
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="mt-10 space-y-3 group relative z-10">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em] flex items-center gap-2 group-focus-within:text-teal-600 transition-colors">
                                        <BookOpen size={16} className="text-teal-500" /> 
                                        {role === 'patient' ? 'Personal Health Bio' : 'Professional Biography'}
                                    </label>
                                    <textarea 
                                        disabled={!isEditing}
                                        maxLength="500"
                                        placeholder={role === 'patient' ? "Briefly share your health history or fitness goals..." : "Share your professional journey and clinical expertise..."}
                                        className="w-full p-6 bg-white/50 border border-slate-200/60 rounded-3xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:bg-white h-36 md:h-48 resize-none font-black text-sm text-slate-900 transition-all duration-300 disabled:opacity-60 disabled:bg-slate-50 shadow-inner custom-scrollbar"
                                        value={user.bio || ''}
                                        onChange={(e) => setUser({...user, bio: e.target.value})}
                                    />
                                </div>

                                {isEditing && (
                                    <button 
                                        type="submit" 
                                        disabled={saveLoading}
                                        className="w-full mt-10 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] shadow-[0_15px_30px_rgba(15,23,42,0.2)] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 relative z-10 overflow-hidden group/btn"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-teal-500/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                                        {saveLoading ? <Loader className="animate-spin text-teal-400" size={20} /> : <><Save size={20} className="text-teal-400" /> Save Clinical Changes</>}
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfileInput = ({ icon, label, value, disabled, onChange, placeholder, type = "text" }) => (
    <div className="space-y-2 group relative">
        <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em] group-focus-within:text-teal-600 transition-colors">{label}</label>
        <div className="relative">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors ${!disabled && 'group-focus-within:text-teal-600'}`}>
                {icon}
            </div>
            <input 
                type={type}
                disabled={disabled}
                placeholder={placeholder}
                className="w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200/60 rounded-2xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:bg-white font-black text-sm text-slate-900 shadow-sm transition-all duration-300 disabled:opacity-60 disabled:bg-slate-50 disabled:cursor-not-allowed"
                value={value || ''}
                onChange={(e) => onChange && onChange(e.target.value)}
            />
        </div>
    </div>
);

export default ProfilePage;