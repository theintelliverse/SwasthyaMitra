import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Save,
  MapPin,
  Phone,
  ShieldAlert,
  Building,
  QrCode,
  AlertCircle,
  Settings as SettingsIcon
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import ClinicQR from '../../components/ClinicQR';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const ClinicSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    clinicCode: '',
    contactNumber: '',
    address: ''
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchClinicData = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/clinic/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          const { name, clinicCode, contactNumber, address } = res.data.data;
          setFormData({
            name: name || '',
            clinicCode: clinicCode || '',
            contactNumber: contactNumber || '',
            address: address || ''
          });
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching clinic data", err);
        setLoading(false);
      }
    };
    fetchClinicData();
  }, [token]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.patch(`${API_URL}/api/clinic/settings`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        localStorage.setItem('clinicName', formData.name);
        localStorage.setItem('clinicCode', formData.clinicCode.toUpperCase());

        Swal.fire({
          icon: 'success',
          title: 'Profile Updated',
          text: 'Clinic settings have been synced successfully.',
          confirmButtonColor: '#0F766E',
          background: '#EEF6FA'
        });
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Update failed', 'error');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <div className="animate-pulse font-heading text-xl text-khaki">Opening Clinic Vault...</div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-parchment font-body text-teak">
      {/* --- Sidebar Integrated --- */}
      <Sidebar role="admin" />

      <div className="flex-grow flex flex-col h-screen overflow-y-auto">
        {/* --- Header Section --- */}
        <header className="bg-white border-b border-sandstone px-8 py-6 sticky top-0 z-30 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <div className="w-12 h-12 bg-teak rounded-2xl flex items-center justify-center text-white shadow-lg">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h1 className="font-heading text-3xl leading-none">Clinic Profile</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-khaki mt-1">Configure Global Facility Settings</p>
            </div>
          </div>
        </header>

        <main className="flex-grow max-w-6xl w-full mx-auto p-6 md:p-10">
          <div className="grid lg:grid-cols-3 gap-10">

            {/* --- Main Settings Form --- */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white border border-sandstone rounded-[3.5rem] p-8 md:p-12 shadow-sm">
                <form onSubmit={handleUpdate} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Clinic Name */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-khaki ml-2">Clinic Display Name</label>
                      <div className="relative">
                        <Building size={16} className="absolute left-5 top-4.5 text-sandstone" />
                        <input
                          type="text" required
                          className="w-full pl-12 pr-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Clinic Code */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-khaki ml-2">Unique Gateway Code</label>
                      <div className="relative">
                        <QrCode size={16} className="absolute left-5 top-4.5 text-sandstone" />
                        <input
                          type="text" required
                          className="w-full pl-12 pr-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-black uppercase text-marigold transition-all"
                          value={formData.clinicCode}
                          onChange={(e) => setFormData({ ...formData, clinicCode: e.target.value })}
                        />
                      </div>
                      <p className="text-[9px] text-khaki ml-2 flex items-center gap-1 italic">
                        <AlertCircle size={10} /> Affects your public check-in URL.
                      </p>
                    </div>
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-khaki ml-2">Verified Contact Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-5 top-4.5 text-sandstone" />
                      <input
                        type="text"
                        placeholder="+91 00000 00000"
                        className="w-full pl-12 pr-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium text-teak"
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Physical Address */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-khaki ml-2">Clinic Address</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-5 top-4.5 text-sandstone" />
                      <textarea
                        placeholder="Street, Landmark, City, Pincode..."
                        className="w-full pl-12 pr-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium h-32 resize-none transition-all"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      ></textarea>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      className="w-full md:w-auto px-12 py-5 bg-marigold text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest hover:bg-teak transition-all shadow-xl shadow-marigold/20 active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Save size={18} /> Update Facility Details
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* --- Right Sidebar: QR Live Preview & Danger Zone --- */}
            <div className="space-y-8">
              <div className="bg-white border border-sandstone p-8 rounded-[3rem] shadow-sm">
                <h3 className="font-heading text-xl mb-6 border-b border-sandstone pb-4">Live QR Preview</h3>
                <div className="transform scale-95 origin-top">
                  <ClinicQR clinicCode={formData.clinicCode} clinicName={formData.name} />
                </div>
                <p className="mt-6 text-[10px] text-khaki leading-relaxed text-center px-4 font-medium italic">
                  This QR code allows patients to join your queue instantly from their mobile devices.
                </p>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-8">
                <div className="flex items-center gap-2 mb-4 text-red-800">
                  <ShieldAlert size={20} />
                  <h4 className="font-heading text-lg">Danger Zone</h4>
                </div>
                <p className="text-red-600/70 text-[10px] mb-6 font-bold uppercase tracking-tight">
                  Deactivation will freeze all active queues and staff access.
                </p>
                <button
                  type="button"
                  className="w-full py-4 bg-white border border-red-200 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
                  onClick={() => Swal.fire('Security Protocol', 'Facility deactivation requires administrative override. Please contact support.', 'info')}
                >
                  Request Termination
                </button>
              </div>
            </div>

          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default ClinicSettings;