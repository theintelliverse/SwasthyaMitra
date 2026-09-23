import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  User, Phone, Mail, Shield, Bell, HelpCircle, LogOut, 
  ChevronRight, CheckCircle2, Edit3, X, Loader2, Heart,
  Calendar, FolderHeart, Stethoscope, MapPin, AlertCircle, FileText
} from 'lucide-react';
import SEO from '../../components/SEO';
import { API_URL } from '../../config/runtime';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = ['Male', 'Female', 'Other'];

const PatientProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(() => {
    return localStorage.getItem('patient_sms_alerts') !== 'false';
  });

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    bloodGroup: '',
    address: '',
    allergies: ''
  });

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/patient/login');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/auth/patient/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setProfile(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          age: data.age ? String(data.age) : '',
          gender: data.gender || '',
          bloodGroup: data.bloodGroup || '',
          address: data.address || '',
          allergies: data.allergies || ''
        });

        if (data.name) {
          localStorage.setItem('patientName', data.name);
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      // Fallback from localStorage
      const cachedName = localStorage.getItem('patientName') || 'Valued Patient';
      const cachedPhone = localStorage.getItem('userPhone') || '';
      setProfile({
        name: cachedName,
        phone: cachedPhone,
        email: '',
        age: null,
        gender: null,
        bloodGroup: null,
        address: '',
        allergies: '',
        documents: [],
        medicalHistory: []
      });
      setFormData(prev => ({
        ...prev,
        name: cachedName
      }));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleOpenEdit = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        age: profile.age ? String(profile.age) : '',
        gender: profile.gender || '',
        bloodGroup: profile.bloodGroup || '',
        address: profile.address || '',
        allergies: profile.allergies || ''
      });
    }
    setIsEditing(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/patient/login');
      return;
    }

    if (!formData.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Name Required',
        text: 'Please enter your full name.',
        confirmButtonColor: '#0D9488'
      });
      return;
    }

    try {
      setSaving(true);
      const res = await axios.patch(
        `${API_URL}/api/auth/patient/update-profile`,
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          age: formData.age ? parseInt(formData.age, 10) : null,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
          address: formData.address.trim(),
          allergies: formData.allergies.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        localStorage.setItem('patientName', formData.name.trim());
        setProfile(prev => ({
          ...prev,
          name: formData.name.trim(),
          email: formData.email.trim(),
          age: formData.age ? parseInt(formData.age, 10) : null,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
          address: formData.address.trim(),
          allergies: formData.allergies.trim()
        }));

        setIsEditing(false);
        Swal.fire({
          icon: 'success',
          title: 'Profile Updated',
          text: 'Your personal information has been saved successfully.',
          timer: 1800,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.response?.data?.message || 'Could not save profile changes. Please try again.',
        confirmButtonColor: '#0D9488'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleSmsAlerts = () => {
    const newState = !smsAlerts;
    setSmsAlerts(newState);
    localStorage.setItem('patient_sms_alerts', String(newState));
  };

  const handleSupportModal = () => {
    Swal.fire({
      title: 'Appointory Support',
      html: `
        <div class="text-left space-y-3 text-sm text-slate-600">
          <p>We are here to assist you with appointments, digital records, and health inquiries.</p>
          <div class="p-3 bg-teal-50 rounded-xl border border-teal-100 space-y-1">
            <p class="font-bold text-teal-900">Patient Helpline:</p>
            <p class="text-teal-700 font-semibold">+91 1800-200-8899</p>
            <p class="text-xs text-slate-500">Available Mon-Sat (9:00 AM - 8:00 PM)</p>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <p class="font-bold text-slate-800">Support Email:</p>
            <p class="text-slate-600 font-semibold">care@appointory.in</p>
          </div>
        </div>
      `,
      confirmButtonText: 'Call Support',
      showCancelButton: true,
      cancelButtonText: 'Close',
      confirmButtonColor: '#0D9488'
    }).then((res) => {
      if (res.isConfirmed) {
        window.location.href = 'tel:18002008899';
      }
    });
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout Account?',
      text: 'Are you sure you want to log out of your patient portal?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0D9488',
      cancelButtonColor: '#94A3B8',
      confirmButtonText: 'Yes, Logout'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate('/patient/login');
      }
    });
  };

  const name = profile?.name || localStorage.getItem('patientName') || 'Valued Patient';
  const phone = profile?.phone || localStorage.getItem('userPhone') || '—';
  const email = profile?.email || 'Not provided';
  const bloodGroup = profile?.bloodGroup || '—';
  const recordsCount = profile?.documents?.length || 0;
  const visitsCount = (profile?.medicalHistory?.length || profile?.visitHistory?.length) || 0;

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-slate-400">
        <Loader2 size={32} className="animate-spin text-teal-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="w-full text-slate-800 font-body">
      <SEO title="My Profile - Appointory" />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-teal-600/10 overflow-hidden border border-teal-500/20 shrink-0">
              <img src="/Appointory_logo.jpg" alt="Appointory Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">Patient Profile</h1>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Account & Health Identity</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Verified
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {/* User Card */}
        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 truncate leading-snug">{name}</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span>{phone}</span>
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5 truncate flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{email}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenEdit}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-xs rounded-xl border border-teal-200/70 transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>
          </div>

          {/* Quick Info Badges */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Blood Group</p>
              <p className="text-sm font-bold text-rose-600 mt-0.5">{bloodGroup}</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Age / Gender</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {profile?.age ? `${profile.age}y` : '—'} {profile?.gender ? `• ${profile.gender.charAt(0)}` : ''}
              </p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">Active</p>
            </div>
          </div>
        </div>

        {/* Quick Health Hub Links */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/patient/health-locker')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl shadow-sm text-left transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
                <FolderHeart size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">Health Locker</p>
                <p className="text-[11px] text-slate-400 font-medium">{recordsCount} Records</p>
              </div>
            </div>
            <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => navigate('/patient/dashboard?tab=appointments')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl shadow-sm text-left transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                <Calendar size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">Consultations</p>
                <p className="text-[11px] text-slate-400 font-medium">{visitsCount} Visits</p>
              </div>
            </div>
            <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Account Details Group */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Personal Details</p>
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
            <button 
              onClick={handleOpenEdit}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <User size={18} className="text-teal-600" />
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">Personal Information</span>
                  <span className="text-xs text-slate-400 font-normal">Name, age, blood group &amp; address</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            <button 
              onClick={() => navigate('/patient/book-appointment')}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Stethoscope size={18} className="text-teal-600" />
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">Book New Consultation</span>
                  <span className="text-xs text-slate-400 font-normal">Search clinics &amp; doctors near you</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-teal-600" />
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">Residential Address</span>
                  <span className="text-xs text-slate-500 font-normal">
                    {profile?.address || 'No address added yet'}
                  </span>
                </div>
              </div>
              <button 
                onClick={handleOpenEdit}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700"
              >
                Change
              </button>
            </div>

            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={18} className="text-teal-600" />
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">Allergies / Conditions</span>
                  <span className="text-xs text-slate-500 font-normal">
                    {profile?.allergies || 'None reported'}
                  </span>
                </div>
              </div>
              <button 
                onClick={handleOpenEdit}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Alerts &amp; Support</p>
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-teal-600" />
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">SMS &amp; Digital Queue Alerts</span>
                  <span className="text-xs text-slate-400 font-normal">Queue live tokens &amp; appointment reminders</span>
                </div>
              </div>
              <button
                onClick={toggleSmsAlerts}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  smsAlerts ? 'bg-teal-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    smsAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <button 
              onClick={handleSupportModal}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={18} className="text-teal-600" />
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">Help &amp; Support Hotline</span>
                  <span className="text-xs text-slate-400 font-normal">24x7 Customer assistance &amp; clinical support</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Logout Section */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 font-semibold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.99] shadow-sm"
          >
            <LogOut size={17} />
            <span>Logout Account</span>
          </button>
        </div>
      </main>

      {/* Edit Profile Modal Sheet */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
          <div 
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Edit Personal Information</h3>
                <p className="text-xs text-slate-400 font-medium">Keep your healthcare records up to date</p>
              </div>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              {/* Phone (Read-Only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Phone (Linked to OTP)</label>
                <input
                  type="text"
                  disabled
                  value={phone}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="patient@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="e.g. 28"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  >
                    <option value="">Select Gender</option>
                    {GENDERS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Blood Group</label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map(bg => (
                    <button
                      type="button"
                      key={bg}
                      onClick={() => setFormData(prev => ({ ...prev, bloodGroup: bg }))}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        formData.bloodGroup === bg
                          ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street, Area, City, Pin Code"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              {/* Allergies / Medical Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Known Allergies / Health Notes</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                  placeholder="e.g. Penicillin, Pollen, Asthmatic"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              {/* Save & Cancel Buttons */}
              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
