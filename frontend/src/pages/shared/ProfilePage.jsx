import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
    ArrowLeft, User, Mail, Award, Clock, BookOpen, Save, 
    ShieldCheck, Activity, Phone, Briefcase, GraduationCap, 
    Calendar, Check, Edit3, X, Loader, CheckCircle, MapPin, 
    Droplet, UserCircle, Hash
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
            
            if (user.avgWaitTime) localStorage.setItem('avgWaitTime', user.avgWaitTime);
            
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
            
            <div className="flex-grow p-6 lg:p-10 overflow-y-auto h-screen custom-scrollbar max-w-6xl mx-auto w-full">
                {/* Top Navigation */}
                <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
                                {role === 'patient' ? 'Wellness Member' : 'Clinical Associate'}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            {role === 'patient' ? 'My Health Profile' : 'Professional Identity'} <span className="text-teal-600">.</span>
                        </h1>
                        <p className="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-[0.2em]">
                            {role === 'patient' ? 'Manage your medical baseline & preferences.' : 'Update your clinical credentials & bio.'}
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isEditing ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-white text-teal-600 border border-teal-100 shadow-sm shadow-teal-600/5 hover:border-teal-300'}`}
                        >
                            {isEditing ? <><X size={14} /> Cancel</> : <><Edit3 size={14} /> Edit Profile</>}
                        </button>
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        
                        {/* Visual Banner */}
                        <div className={`h-56 ${role === 'patient' ? 'bg-gradient-to-br from-teal-900 via-slate-900 to-indigo-900' : 'bg-slate-900'} relative overflow-hidden`}>
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 p-20 rotate-12"><Activity size={180} /></div>
                                <div className="absolute bottom-0 left-0 p-10 -rotate-12"><ShieldCheck size={140} /></div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-900 to-transparent" />
                            
                            <div className="absolute -bottom-14 left-12">
                                <div className="w-36 h-36 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-[3rem] flex items-center justify-center text-6xl text-white shadow-2xl border-[10px] border-white font-black">
                                    {user.name?.charAt(0)}
                                </div>
                                <div className="absolute bottom-2 right-2 w-10 h-10 bg-teal-500 border-4 border-white rounded-full flex items-center justify-center text-white">
                                    <Check size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-24 px-12 pb-12">
                            <header className="mb-12 border-b border-slate-50 pb-12">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-teal-100">
                                        {role.toUpperCase()} VERIFIED
                                    </span>
                                    <CheckCircle size={14} className="text-teal-500" />
                                </div>
                                <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">{user.name}</h1>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-3">
                                    <MapPin size={14} className="text-teal-500" /> 
                                    {role === 'patient' 
                                        ? `Verified Member since ${new Date(user.createdAt || Date.now()).getFullYear()}` 
                                        : (user.specialization || "Clinical Portal Associate")} 
                                    {user.clinicCode ? ` • Hub: ${user.clinicCode}` : ''}
                                </p>
                            </header>

                            <form onSubmit={handleUpdate} className="space-y-16">
                                <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
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
                                            <div className="space-y-3 group">
                                                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Gender Identity</label>
                                                <div className="relative">
                                                    <div className={`absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 transition-colors ${isEditing && 'group-focus-within:text-teal-600'}`}>
                                                        <UserCircle size={18} />
                                                    </div>
                                                    <select 
                                                        disabled={!isEditing}
                                                        className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:border-teal-500 font-bold text-slate-900 shadow-sm appearance-none disabled:opacity-60"
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

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em] flex items-center gap-2">
                                        <BookOpen size={14} className="text-teal-500" /> 
                                        {role === 'patient' ? 'Personal Health Bio' : 'Professional Biography'}
                                    </label>
                                    <textarea 
                                        disabled={!isEditing}
                                        maxLength="500"
                                        placeholder={role === 'patient' ? "Briefly share your health history or fitness goals..." : "Share your professional journey and clinical expertise..."}
                                        className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] outline-none focus:border-teal-500 h-48 resize-none font-bold text-slate-900 transition-all disabled:opacity-50 shadow-inner"
                                        value={user.bio || ''}
                                        onChange={(e) => setUser({...user, bio: e.target.value})}
                                    />
                                </div>

                                {isEditing && (
                                    <button 
                                        type="submit" 
                                        disabled={saveLoading}
                                        className="w-full py-8 bg-teal-600 hover:bg-teal-700 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-teal-600/30 flex items-center justify-center gap-5 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {saveLoading ? <Loader className="animate-spin" size={24} /> : <><Save size={24} /> Save Clinical Changes</>}
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Meta Section */}
                    <div className="mt-12 grid md:grid-cols-2 gap-8">
                        <div className="p-8 bg-white rounded-[3rem] border border-slate-100 flex items-center gap-8 shadow-sm group hover:border-teal-200 transition-all">
                            <div className="w-20 h-20 bg-teal-50 rounded-[2rem] flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
                                <ShieldCheck size={36} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tight">Privacy Center</h4>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Manage data sharing & encryption.</p>
                            </div>
                        </div>
                        <div className="p-8 bg-white rounded-[3rem] border border-slate-100 flex items-center gap-8 shadow-sm group hover:border-teal-200 transition-all">
                            <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <Clock size={36} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tight">Access Logs</h4>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Review account security events.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfileInput = ({ icon, label, value, disabled, onChange, placeholder, type = "text" }) => (
    <div className="space-y-3 group">
        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">{label}</label>
        <div className="relative">
            <div className={`absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 transition-colors ${!disabled && 'group-focus-within:text-teal-600'}`}>
                {icon}
            </div>
            <input 
                type={type}
                disabled={disabled}
                placeholder={placeholder}
                className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:border-teal-500 font-bold text-slate-900 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed group-focus-within:bg-white group-focus-within:shadow-lg group-focus-within:shadow-teal-500/5"
                value={value || ''}
                onChange={(e) => onChange && onChange(e.target.value)}
            />
        </div>
    </div>
);

export default ProfilePage;