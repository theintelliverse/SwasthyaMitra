import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, User, Building, Clock, Phone, LogOut } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem('token');
  
  const [clinicData, setClinicData] = useState({
    name: '',
    address: '',
    contactPhone: '',
    openingTime: '09:00',
    closingTime: '17:00'
  });
  
  const [userData, setUserData] = useState({
    name: '',
    phoneNumber: '',
    bio: ''
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
        setClinicData({
          name: clinicRes.data.data.name || '',
          address: clinicRes.data.data.address || '',
          contactPhone: clinicRes.data.data.contactPhone || '',
          openingTime: clinicRes.data.data.openingTime || '09:00',
          closingTime: clinicRes.data.data.closingTime || '17:00'
        });
        localStorage.setItem('clinicName', clinicRes.data.data.name);
      }
      
      if (userRes.data.success) {
        setUserData({
          name: userRes.data.data.name || '',
          phoneNumber: userRes.data.data.phoneNumber || '',
          bio: userRes.data.data.bio || ''
        });
        localStorage.setItem('userName', userRes.data.data.name);
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
      
      Swal.fire({
        icon: 'success',
        title: 'Settings Saved',
        text: 'Your laboratory preferences have been updated.',
        confirmButtonColor: '#14B8A6'
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
      text: "Are you sure you want to securely exit the portal?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#14B8A6',
      cancelButtonColor: '#f43f5e',
      confirmButtonText: 'Yes, Sign Out',
      background: '#FFFFFF',
      customClass: {
        popup: 'rounded-[2rem] border border-gray-100'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        window.location.href = '/login';
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-body text-gray-900 flex-col md:flex-row">
      <Sidebar role="lab" />
      <div className="flex-grow flex flex-col min-h-screen">
        <main className="px-4 md:px-8 py-6 flex-grow max-w-5xl mx-auto w-full space-y-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Lab Settings</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <SettingsIcon size={16} className="text-teal-500" />
                Configure your laboratory preferences
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-600 border border-red-100 font-bold rounded-lg shadow-sm hover:bg-red-100 hover:border-red-200 transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
              <button 
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white font-bold rounded-lg shadow-sm hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
                {saving ? 'Saving...' : <span className="hidden sm:inline">Save Changes</span>}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Lab Profile Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center">
                    <Building size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Laboratory Details</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lab Name</label>
                    <input 
                      type="text" 
                      value={clinicData.name}
                      onChange={(e) => setClinicData({...clinicData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="tel" 
                        value={clinicData.contactPhone}
                        onChange={(e) => setClinicData({...clinicData, contactPhone: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white transition-colors text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lab Address</label>
                    <textarea 
                      rows="3"
                      value={clinicData.address}
                      onChange={(e) => setClinicData({...clinicData, address: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white transition-colors text-sm resize-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Opening Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          type="time" 
                          value={clinicData.openingTime}
                          onChange={(e) => setClinicData({...clinicData, openingTime: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white transition-colors text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Closing Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          type="time" 
                          value={clinicData.closingTime}
                          onChange={(e) => setClinicData({...clinicData, closingTime: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white transition-colors text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technician Profile Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Technician Profile</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Technician Name</label>
                    <input 
                      type="text" 
                      value={userData.name}
                      onChange={(e) => setUserData({...userData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Personal Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="tel" 
                        value={userData.phoneNumber}
                        onChange={(e) => setUserData({...userData, phoneNumber: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white transition-colors text-sm"
                        placeholder="Enter phone number..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Bio / Specialization</label>
                    <textarea 
                      rows="4"
                      value={userData.bio}
                      onChange={(e) => setUserData({...userData, bio: e.target.value})}
                      placeholder="E.g., Senior Pathologist, 5 years experience..."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white transition-colors text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Settings;
