import React, { useState } from 'react';
import axios from 'axios';
import { Search, ShieldCheck, User, Phone, FileText, ArrowRight, RefreshCw } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import PatientQuickView from '../../components/PatientQuickView';
import { API_BASE_URL } from '../../config/runtime';

const API_URL = API_BASE_URL;
const LockerSearch = () => {
  const [phone, setPhone] = useState('');
  const [activePatient, setActivePatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      // Normalize to last 10 digits
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);

      const res = await axios.get(`${API_URL}/api/staff/patient-full-profile/${cleanPhone}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setActivePatient(cleanPhone);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Locker not found. Ensure the patient has checked in at least once.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#EEF6FA] font-body text-[#0F766E]">
      <Sidebar role="doctor" />

      <div className="flex-grow flex flex-col h-screen overflow-y-auto">
        <main className="p-8 lg:p-20 max-w-4xl mx-auto w-full flex flex-col items-center justify-center min-h-full">

          {/* Top Icon with Morning Glow */}
          <div className="w-24 h-24 bg-[#1F6FB2]/10 rounded-[2.5rem] flex items-center justify-center text-[#1F6FB2] mb-8 shadow-inner relative group">
            <ShieldCheck size={48} className="transition-transform group-hover:scale-110 duration-500" />
            <div className="absolute inset-0 bg-[#1F6FB2] rounded-[2.5rem] animate-ping opacity-5"></div>
          </div>

          <header className="text-center mb-12">
            <h1 className="text-5xl font-heading mb-4 text-[#0F766E]">Clinical Vault Search</h1>
            <p className="text-[#3FA28C] font-medium max-w-md mx-auto leading-relaxed">
              Retrieve encrypted patient history, vitals trends, and diagnostic files using a verified mobile number.
            </p>
          </header>

          <form onSubmit={handleSearch} className="w-full relative">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#3FA28C]" size={24} />
              <input
                type="tel"
                placeholder="Ex: 9876543210"
                className="w-full pl-16 pr-44 py-8 bg-white border-2 border-[#AFC4D8] rounded-[3rem] outline-none focus:border-[#1F6FB2] shadow-2xl shadow-teak/5 font-heading text-3xl tracking-[0.1em] placeholder:text-[#AFC4D8] transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-4 top-4 bottom-4 px-10 bg-[#0F766E] text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-[#1F6FB2] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <>Access <ArrowRight size={18} /></>}
              </button>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <p className="text-red-600 text-xs font-bold text-center">
                  ⚠️ {error}
                </p>
              </div>
            )}
          </form>

          {/* Quick Info Tags */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full opacity-60">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-white border border-[#AFC4D8] rounded-2xl text-[#3FA28C]"><User size={20} /></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F766E]">Historical Vitals</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-white border border-[#AFC4D8] rounded-2xl text-[#3FA28C]"><FileText size={20} /></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F766E]">Digital Reports</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-white border border-[#AFC4D8] rounded-2xl text-[#3FA28C]"><Phone size={20} /></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F766E]">Secure Decryption</span>
            </div>
          </div>
        </main>

        {/* --- MODAL VIEW --- */}
        {/* Note: PatientQuickView internally handles its own Socket.io connection */}
        {activePatient && (
          <PatientQuickView
            phone={activePatient}
            onClose={() => setActivePatient(null)}
          />
        )}
      </div>
    </div>
  );
};

export default LockerSearch;