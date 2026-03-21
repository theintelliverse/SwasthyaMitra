import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import {
  Beaker, Upload, Smartphone, Hash, FileCheck,
  RefreshCw, Activity, Search
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const LabDashboard = () => {
  const [labQueue, setLabQueue] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const token = localStorage.getItem('token');
  const clinicId = localStorage.getItem('clinicId');

  const fetchLabQueue = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsSyncing(true);
    try {
      const res = await axios.get(`${API_URL}/api/queue/live`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter for patients waiting for lab work
      const pendingLab = res.data.data.filter(p => p.currentStage === 'Lab-Pending');
      setLabQueue(pendingLab);
      setLoading(false);
    } catch (err) {
      console.error("Lab Fetch Error:", err);
      setLoading(false);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  useEffect(() => {
    fetchLabQueue();

    if (clinicId) {
      socket.emit('joinClinic', clinicId);
      console.log("🧪 Lab joined Clinic Room:", clinicId);

      socket.on('queueUpdate', () => {
        console.log("♻️ Lab Feed Syncing...");
        fetchLabQueue(true);
      });
    }

    return () => {
      socket.off('queueUpdate');
    };
  }, [token, clinicId]);

  const handleFileUpload = async (patientPhone, queueId, file) => {
    if (!file) return;

    // 🔍 Pre-upload validation
    if (file.size > 5 * 1024 * 1024) { // 5MB Limit
      return Swal.fire('File Too Large', 'Please upload a file smaller than 5MB', 'warning');
    }

    const cleanPhone = patientPhone.replace(/\D/g, '').slice(-10);

    const formData = new FormData();
    // 🔑 IMPORTANT: Ensure this key ('file') matches upload.single('file') in your backend route
    formData.append('file', file);
    formData.append('title', 'Diagnostic Report');
    formData.append('fileType', file.type.includes('pdf') ? 'PDF' : 'Image');

    Swal.fire({
      title: 'Syncing to Locker...',
      html: '<p style="font-size: 12px; color: #3FA28C;">Encrypting and notifying doctor...</p>',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: '#EEF6FA'
    });

    try {
      console.log(`📤 Sending upload request for ${cleanPhone}...`);
      const res = await axios.post(`${API_URL}/api/staff/lab/upload/${cleanPhone}/${queueId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Results Published',
          text: 'Patient locker updated successfully.',
          timer: 2000,
          showConfirmButton: false,
          background: '#EEF6FA'
        });

        // Manually trigger a refresh to remove the patient from the list immediately
        fetchLabQueue(true);
      }
    } catch (err) {
      console.error("Upload Error Details:", err.response?.data);
      Swal.fire({
        icon: 'error',
        title: 'Sync Failed',
        text: err.response?.data?.message || 'Check your connection or file format.',
        confirmButtonColor: '#0F766E',
        background: '#EEF6FA'
      });
    }
  };

  const filteredQueue = labQueue.filter(p =>
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientPhone.includes(searchTerm)
  );

  return (
    <div className="flex min-h-screen bg-parchment font-body text-teak">
      <Sidebar role="lab" />

      <div className="flex-grow flex flex-col h-screen overflow-y-auto">
        {/* Navigation - Marigold Style */}
        <nav className="bg-white border-b border-sandstone px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-marigold rounded-xl flex items-center justify-center text-white shadow-lg">
              <Beaker size={20} />
            </div>
            <div>
              <h1 className="font-heading text-xl">Diagnostics Station</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-marigold animate-ping' : 'bg-green-500'}`}></div>
                <p className="text-[9px] font-black uppercase tracking-widest text-khaki">Node: {clinicId?.slice(-6).toUpperCase()}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-khaki" size={14} />
              <input
                type="text"
                placeholder="Find Patient..."
                className="pl-10 pr-4 py-2 bg-parchment border border-sandstone rounded-xl outline-none focus:border-marigold text-xs font-bold w-64 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => fetchLabQueue(false)}
              className={`p-2 text-khaki hover:text-marigold transition-colors ${isSyncing ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </nav>

        <main className="p-8 lg:p-12 max-w-6xl mx-auto w-full flex-grow">
          {/* Header Section */}
          <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h2 className="text-5xl font-heading mb-2 text-teak">Diagnostic Feed</h2>
              <p className="text-khaki font-medium flex items-center gap-2 text-sm">
                <Activity size={16} className="text-marigold" />
                Waiting for report uploads to sync with Digital Lockers.
              </p>
            </div>
            <div className="bg-white border border-sandstone px-6 py-4 rounded-3xl flex items-center gap-4 shadow-sm">
              <p className="text-[10px] font-black uppercase text-khaki tracking-widest">Active Samples</p>
              <div className="w-10 h-10 bg-marigold/10 rounded-xl flex items-center justify-center text-2xl font-heading text-marigold">
                {labQueue.length}
              </div>
            </div>
          </div>

          <div className="grid gap-6 pb-12">
            {loading ? (
              <div className="py-24 text-center animate-pulse">
                <Beaker size={48} className="mx-auto text-sandstone mb-4" />
                <p className="text-khaki font-heading text-xl">Linking to Sample Pipeline...</p>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="bg-white p-24 rounded-[4rem] text-center border-2 border-dashed border-sandstone shadow-inner">
                <FileCheck size={48} className="mx-auto text-sandstone mb-6" />
                <p className="text-khaki font-heading text-2xl italic">Queue is currently clear.</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-khaki mt-3 opacity-60">Ready for incoming referrals</p>
              </div>
            ) : (
              filteredQueue.map(p => (
                <div key={p._id} className="bg-white p-8 rounded-[3.5rem] border border-sandstone shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 group hover:border-marigold transition-all relative overflow-hidden">
                  {p.isEmergency && <div className="absolute top-0 left-0 w-2 h-full bg-red-500 animate-pulse"></div>}

                  <div className="flex items-center gap-8 w-full md:w-auto">
                    <div className="w-20 h-20 bg-parchment rounded-[2.5rem] border-2 border-sandstone group-hover:border-marigold/30 flex flex-col items-center justify-center transition-colors">
                      <p className="text-[8px] font-black text-khaki uppercase mb-0.5">Token</p>
                      <p className="text-3xl font-heading text-teak">{p.tokenNumber}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${p.isEmergency ? 'bg-red-50 text-red-600 border-red-100' : 'bg-marigold/10 text-marigold border-marigold/20'
                          }`}>
                          {p.requiredTest || 'General Diagnostic'}
                        </span>
                        {p.isEmergency && <span className="text-[8px] font-black text-red-600 animate-pulse uppercase tracking-tighter">🚨 Immediate Priority</span>}
                      </div>
                      <h3 className="text-3xl font-heading text-teak">{p.patientName}</h3>
                      <div className="flex gap-6 mt-3">
                        <p className="text-[10px] font-bold text-khaki flex items-center gap-2"><Smartphone size={12} /> {p.patientPhone}</p>
                        <p className="text-[10px] font-bold text-khaki flex items-center gap-2"><Hash size={12} /> {p._id.slice(-6).toUpperCase()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto">
                    <label className="flex items-center justify-center gap-4 bg-teak text-parchment px-12 py-5 rounded-2xl cursor-pointer hover:bg-marigold transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-xl group-hover:scale-[1.02] active:scale-95">
                      <Upload size={18} />
                      <span>Sync Digital Report</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(p.patientPhone, p._id, e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default LabDashboard;