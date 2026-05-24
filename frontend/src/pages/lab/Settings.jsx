import React, { useState, useEffect } from 'react';
import {
  Save, User, Building2, Clock, Phone, LogOut,
  FlaskConical, PenTool, FileDigit, CheckCircle2,
  AlertCircle, ChevronRight, RefreshCcw, Shield,
  MapPin, Microscope, Star
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const InputField = ({ label, icon: Icon, children, note }) => (
  <div>
    <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
      {Icon && <Icon size={9} className="text-teal-500" />}
      {label}
    </label>
    {children}
    {note && <p className="text-[9px] text-slate-400 font-bold mt-1">{note}</p>}
  </div>
);

const inputClass = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-normal shadow-sm";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem('token');

  const [clinicData, setClinicData] = useState({
    name: '',
    address: '',
    contactPhone: '',
    openingTime: '09:00',
    closingTime: '18:00'
  });

  const [userData, setUserData] = useState({
    name: '',
    phoneNumber: '',
    bio: '',
    authorizedSignatory: '',
    digitalReportEnabled: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [clinicRes, userRes] = await Promise.all([
        axios.get(`${API_URL}/api/clinic/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (clinicRes.data.success) {
        const d = clinicRes.data.data;
        setClinicData({
          name: d.name || '',
          address: d.address || '',
          contactPhone: d.contactPhone || '',
          openingTime: d.openingTime || '09:00',
          closingTime: d.closingTime || '18:00'
        });
        localStorage.setItem('clinicName', d.name);
      }

      if (userRes.data.success) {
        const u = userRes.data.data;
        setUserData({
          name: u.name || '',
          phoneNumber: u.phoneNumber || '',
          bio: u.bio || '',
          authorizedSignatory: u.authorizedSignatory || '',
          digitalReportEnabled: u.digitalReportEnabled !== false
        });
        localStorage.setItem('userName', u.name);
        localStorage.setItem('defaultDoctorName', u.authorizedSignatory || '');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        axios.patch(`${API_URL}/api/clinic/settings`, clinicData, { headers: { Authorization: `Bearer ${token}` } }),
        axios.patch(`${API_URL}/api/auth/update-profile`, userData, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      localStorage.setItem('clinicName', clinicData.name);
      localStorage.setItem('userName', userData.name);
      localStorage.setItem('defaultDoctorName', userData.authorizedSignatory || '');

      Swal.fire({
        icon: 'success',
        title: 'Settings Saved',
        text: 'Your laboratory preferences have been updated.',
        confirmButtonColor: '#14B8A6',
        background: '#fff',
        customClass: { popup: 'rounded-2xl' }
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Sign Out?',
      text: 'Are you sure you want to securely exit the portal?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#14B8A6',
      cancelButtonColor: '#f43f5e',
      confirmButtonText: 'Yes, Sign Out',
      background: '#FFFFFF',
      customClass: { popup: 'rounded-2xl border border-gray-100' }
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        window.location.href = '/login';
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-body">
      <Sidebar role="lab" />

      <div className="flex-grow overflow-y-auto h-screen pb-32 lg:pb-0">
        {/* Hero Header */}
        <div className="bg-slate-900 px-4 lg:px-8 pt-6 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <Microscope size={300} className="absolute -bottom-10 -right-10 rotate-12" />
          </div>
          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-teal-600 rounded-lg">
                    <FlaskConical size={13} className="text-white" />
                  </div>
                  <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest">Lab Settings</span>
                </div>
                <h1 className="text-xl font-black text-white tracking-tight">Configure your laboratory preferences</h1>
                <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-wider">Manage lab identity, staff profile, and report settings</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-300 border border-white/10 hover:border-red-500/30 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all active:scale-95"
                >
                  <LogOut size={12} /> Sign Out
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-teal-500/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCcw size={12} className="animate-spin" />
                  ) : (
                    <Save size={12} />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="px-4 lg:px-8 py-5 max-w-5xl mx-auto w-full space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <RefreshCcw size={28} className="text-teal-500 animate-spin" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading settings...</p>
            </div>
          ) : (
            <>
              {/* --- Two-Column Layout for Desktop --- */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* --- Laboratory Details Card --- */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden h-full">
                <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                    <Building2 size={14} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Laboratory Details</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Identity & hours of operation</p>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Lab Name" icon={FlaskConical}>
                    <input
                      type="text"
                      value={clinicData.name}
                      onChange={(e) => setClinicData({ ...clinicData, name: e.target.value })}
                      className={inputClass}
                      placeholder="Enter lab name..."
                    />
                  </InputField>

                  <InputField label="Contact Phone" icon={Phone}>
                    <div className="relative">
                      <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={clinicData.contactPhone}
                        onChange={(e) => setClinicData({ ...clinicData, contactPhone: e.target.value })}
                        className={`${inputClass} pl-8`}
                        placeholder="Enter contact number..."
                      />
                    </div>
                  </InputField>

                  <div className="md:col-span-2">
                    <InputField label="Lab Address" icon={MapPin}>
                      <textarea
                        rows="2"
                        value={clinicData.address}
                        onChange={(e) => setClinicData({ ...clinicData, address: e.target.value })}
                        className={`${inputClass} resize-none`}
                        placeholder="Enter full address..."
                      />
                    </InputField>
                  </div>

                  <InputField label="Opening Time" icon={Clock}>
                    <div className="relative">
                      <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="time"
                        value={clinicData.openingTime}
                        onChange={(e) => setClinicData({ ...clinicData, openingTime: e.target.value })}
                        className={`${inputClass} pl-8`}
                      />
                    </div>
                  </InputField>

                  <InputField label="Closing Time" icon={Clock}>
                    <div className="relative">
                      <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="time"
                        value={clinicData.closingTime}
                        onChange={(e) => setClinicData({ ...clinicData, closingTime: e.target.value })}
                        className={`${inputClass} pl-8`}
                      />
                    </div>
                  </InputField>
                </div>
              </div>

              {/* --- Technician Profile Card --- */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden h-full">
                <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <User size={14} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Technician Profile</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Staff identity & credentials</p>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Technician Name" icon={User}>
                    <input
                      type="text"
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      className={inputClass}
                      placeholder="Full name..."
                    />
                  </InputField>

                  <InputField label="Personal Phone" icon={Phone}>
                    <div className="relative">
                      <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={userData.phoneNumber}
                        onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                        className={`${inputClass} pl-8`}
                        placeholder="Enter phone number..."
                      />
                    </div>
                  </InputField>

                  <div className="md:col-span-2">
                    <InputField label="Bio / Specialization" icon={Star} note="This appears on digital lab reports issued to patients.">
                      <textarea
                        rows="2"
                        value={userData.bio}
                        onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                        className={`${inputClass} resize-none`}
                        placeholder="E.g., Senior Pathologist, 5 years experience..."
                      />
                    </InputField>
                  </div>

                  <div className="md:col-span-2">
                    <InputField label="Authorized Signatory" icon={PenTool} note="Name printed as the authorized signatory on every digital lab report.">
                      <div className="relative">
                        <PenTool size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={userData.authorizedSignatory}
                          onChange={(e) => setUserData({ ...userData, authorizedSignatory: e.target.value })}
                          className={`${inputClass} pl-8`}
                          placeholder="Dr. / Mr. / Ms. Full Name..."
                        />
                      </div>
                    </InputField>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Digital Lab Report Card --- */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mt-4">
                <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
                    <FileDigit size={14} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Digital Lab Report</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Report generation & delivery preferences</p>
                  </div>
                </div>

                <div className="p-4">
                  <div
                    onClick={() => setUserData({ ...userData, digitalReportEnabled: !userData.digitalReportEnabled })}
                    className={`cursor-pointer flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 ${
                      userData.digitalReportEnabled
                        ? 'bg-teal-50 border-teal-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-2 rounded-lg transition-all ${userData.digitalReportEnabled ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-500'}`}>
                        <FileDigit size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">Fill Digital Lab Report</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                          Digitally type test values and observations — generates a structured PDF report for the patient.
                        </p>
                        {userData.digitalReportEnabled && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <CheckCircle2 size={10} className="text-teal-600" />
                            <span className="text-[9px] font-black text-teal-600 uppercase tracking-wider">Active — reports will be generated digitally</span>
                          </div>
                        )}
                        {!userData.digitalReportEnabled && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <AlertCircle size={10} className="text-slate-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Disabled — upload scanned reports manually</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${userData.digitalReportEnabled ? 'bg-teal-500' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${userData.digitalReportEnabled ? 'left-7' : 'left-1'}`} />
                    </div>
                  </div>

                  {/* Info note */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                    <Shield size={12} className="text-teal-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                      When enabled, lab staff can fill in test parameters directly in the portal. The system auto-generates a printable/shareable PDF with the lab's branding and the Authorized Signatory's name.
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Row */}
              <div className="flex justify-end gap-3 pb-6">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-100 text-red-500 hover:bg-red-50 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all active:scale-95"
                >
                  <LogOut size={11} /> Sign Out
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-teal-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? <RefreshCcw size={11} className="animate-spin" /> : <Save size={11} />}
                  {saving ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;
