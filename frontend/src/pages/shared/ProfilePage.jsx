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
        <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-body">
            <Sidebar role={role} />
            
            <div className="flex-grow p-4 md:p-6 lg:p-10 overflow-y-auto h-screen custom-scrollbar max-w-6xl mx-auto w-full pb-24 md:pb-10">
                {/* Top Navigation */}
                <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-4 py-1.5 bg-gradient-to-r from-teal-50 to-indigo-50 text-teal-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100/50 shadow-sm">
                                {role === 'patient' ? 'Wellness Member' : 'Clinical Associate'}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-3">
                            {role === 'patient' ? 'My Health Profile' : 'Professional Identity'} 
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-600">.</span>
                        </h1>
                        <p className="text-slate-500 font-bold text-xs md:text-sm leading-relaxed border-l-4 border-teal-200 pl-4 rounded-sm">
                            {role === 'patient' ? 'Manage your medical baseline & preferences.' : 'Update your clinical credentials & bio.'}
                        </p>
                    </div>

                    <div className="hidden"></div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-start">
                        {/* LEFT COLUMN: Identity Card */}
                        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
                            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden text-center">
                                {/* Visual Banner */}
                                <div className={`h-32 ${role === 'patient' ? 'bg-gradient-to-br from-teal-900 via-slate-900 to-indigo-900' : 'bg-slate-900'} relative overflow-hidden`}>
                                    <div className="absolute inset-0 opacity-10">
                                        <div className="absolute top-0 right-0 p-10 rotate-12"><Activity size={100} /></div>
                                        <div className="absolute bottom-0 left-0 p-5 -rotate-12"><ShieldCheck size={80} /></div>
                                    </div>
                                </div>
                                <div className="px-6 pb-8 pt-16 relative flex flex-col items-center">
                                    <div className="absolute -top-14">
                                        <div className="w-28 h-28 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-5xl text-white shadow-xl border-[6px] border-white font-black ring-4 ring-slate-50/50">
                                            {user.name?.charAt(0)}
                                        </div>
                                        <div className="absolute bottom-1 right-1 w-8 h-8 bg-teal-500 border-4 border-white rounded-full flex items-center justify-center text-white shadow-md">
                                            <Check size={16} />
                                        </div>
                                    </div>
                                    
                                    <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-teal-100 mb-3">
                                        {role.toUpperCase()} VERIFIED
                                    </span>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter mb-1">{user.name}</h1>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.1em] flex items-center justify-center gap-2">
                                        <MapPin size={12} className="text-teal-500" /> 
                                        {role === 'patient' ? `Member since ${new Date(user.createdAt || Date.now()).getFullYear()}` : (user.specialization || "Clinical Associate")}
                                    </p>

                                    <div className="w-full h-[1px] bg-slate-100 my-6"></div>

                                    <div className="flex flex-col w-full gap-3">
                                        <button 
                                            onClick={() => setIsEditing(!isEditing)} 
                                            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border flex justify-center items-center gap-2 ${isEditing ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100'}`}
                                        >
                                            {isEditing ? <><X size={14} /> Cancel Editing</> : <><Edit3 size={14} /> Edit Profile</>}
                                        </button>
                                        <button 
                                            onClick={handleLogout} 
                                            className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all bg-slate-50 text-slate-500 border border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 flex justify-center items-center gap-2"
                                        >
                                            <LogOut size={14} /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Meta Cards stacked on mobile & desktop left-column */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                                <div className="p-5 md:p-6 bg-white rounded-[2rem] border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer">
                                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 tracking-tight">Privacy Center</h4>
                                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">Manage data</p>
                                    </div>
                                </div>
                                <div className="p-5 md:p-6 bg-white rounded-[2rem] border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 tracking-tight">Access Logs</h4>
                                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">Security events</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Form Details */}
                        <div className="lg:col-span-8">
                            <form onSubmit={handleUpdate} className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/40 border border-slate-100 relative">
                                <div className="mb-8 pb-8 border-b border-slate-50 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-black text-slate-900">Profile Details</h3>
                                        <p className="text-xs font-medium text-slate-400 mt-1">Update your information</p>
                                    </div>
                                    {isEditing && (
                                        <button type="submit" disabled={saveLoading} className="hidden sm:flex px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-600/30 transition-all items-center gap-2 active:scale-95 disabled:opacity-50">
                                            {saveLoading ? <Loader size={14} className="animate-spin" /> : <Save size={14} />} Save
                                        </button>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-x-8 gap-y-8">
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
                                            <div className="space-y-2 md:space-y-3 group">
                                                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-3 md:ml-4 tracking-[0.2em]">Gender Identity</label>
                                                <div className="relative">
                                                    <div className={`absolute left-5 md:left-7 top-1/2 -translate-y-1/2 text-slate-300 transition-colors ${isEditing && 'group-focus-within:text-teal-600'}`}>
                                                        <UserCircle size={18} />
                                                    </div>
                                                    <select 
                                                        disabled={!isEditing}
                                                        className="w-full pl-12 md:pl-16 pr-6 md:pr-8 py-4 md:py-6 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-[2rem] outline-none focus:border-teal-500 font-bold text-slate-900 shadow-sm appearance-none disabled:opacity-60 transition-all"
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

                                <div className="mt-8 space-y-2 md:space-y-3 group">
                                    <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-3 md:ml-4 tracking-[0.2em] flex items-center gap-2">
                                        <BookOpen size={14} className="text-teal-500" /> 
                                        {role === 'patient' ? 'Personal Health Bio' : 'Professional Biography'}
                                    </label>
                                    <textarea 
                                        disabled={!isEditing}
                                        maxLength="500"
                                        placeholder={role === 'patient' ? "Briefly share your health history or fitness goals..." : "Share your professional journey and clinical expertise..."}
                                        className="w-full p-6 md:p-8 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-[2.5rem] outline-none focus:border-teal-500 h-32 md:h-48 resize-none font-bold text-slate-900 transition-all disabled:opacity-50 shadow-inner"
                                        value={user.bio || ''}
                                        onChange={(e) => setUser({...user, bio: e.target.value})}
                                    />
                                </div>

                                {isEditing && (
                                    <button 
                                        type="submit" 
                                        disabled={saveLoading}
                                        className="w-full mt-10 py-5 md:py-8 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl md:rounded-[2.5rem] font-black text-[10px] md:text-xs uppercase tracking-[0.3em] shadow-2xl shadow-teal-600/30 flex items-center justify-center gap-4 md:gap-5 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {saveLoading ? <Loader className="animate-spin" size={24} /> : <><Save size={24} /> Save Clinical Changes</>}
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
    <div className="space-y-2 md:space-y-3 group">
        <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-3 md:ml-4 tracking-[0.2em]">{label}</label>
        <div className="relative">
            <div className={`absolute left-5 md:left-7 top-1/2 -translate-y-1/2 text-slate-300 transition-colors ${!disabled && 'group-focus-within:text-teal-600'}`}>
                {icon}
            </div>
            <input 
                type={type}
                disabled={disabled}
                placeholder={placeholder}
                className="w-full pl-12 md:pl-16 pr-6 md:pr-8 py-4 md:py-6 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-[2rem] outline-none focus:border-teal-500 font-bold text-slate-900 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed group-focus-within:bg-white group-focus-within:shadow-lg group-focus-within:shadow-teal-500/5"
                value={value || ''}
                onChange={(e) => onChange && onChange(e.target.value)}
            />
        </div>
    </div>
);

export default ProfilePage;