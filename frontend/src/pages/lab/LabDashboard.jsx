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
    <div className="flex min-h-screen bg-parchment font-body text-teak flex-col md:flex-row">
      <Sidebar role="lab" />

      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto">
        {/* Navigation - Marigold Style */}
        <nav className="bg-white border-b border-sandstone px-4 md:px-8 py-3 md:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
            <div className="w-9 md:w-10 h-9 md:h-10 bg-marigold rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
              <Beaker size={18} />
            </div>
            <div>
              <h1 className="font-heading text-base md:text-xl">Diagnostics</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-marigold animate-ping' : 'bg-green-500'}`}></div>
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-khaki">{clinicId?.slice(-6).toUpperCase()}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-khaki flex-shrink-0" size={14} />
              <input
                type="text"
                placeholder="Find..."
                className="pl-10 pr-3 md:pr-4 py-2 bg-parchment border border-sandstone rounded-lg md:rounded-xl outline-none focus:border-marigold text-[8px] md:text-xs font-bold w-full sm:w-48 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => fetchLabQueue(false)}
              className={`p-2 text-khaki hover:text-marigold transition-colors flex-shrink-0 ${isSyncing ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </nav>

        <main className="px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12 max-w-6xl mx-auto w-full flex-grow">
          {/* Header Section */}
          <div className="mb-8 md:mb-12 flex flex-col gap-4 md:gap-0 md:flex-row justify-between md:items-end">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading mb-2 text-teak">Diagnostic Feed</h2>
              <p className="text-khaki font-medium flex items-center gap-2 text-xs md:text-sm">
                <Activity size={14} className="text-marigold flex-shrink-0" />
                Waiting for report uploads
              </p>
            </div>
            <div className="bg-white border border-sandstone px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl flex items-center gap-4 shadow-sm w-full sm:w-auto justify-between sm:justify-start">
              <p className="text-[8px] md:text-[10px] font-black uppercase text-khaki tracking-widest whitespace-nowrap">Active Samples</p>
              <div className="w-9 md:w-10 h-9 md:h-10 bg-marigold/10 rounded-lg md:rounded-xl flex items-center justify-center text-xl md:text-2xl font-heading text-marigold flex-shrink-0">
                {labQueue.length}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:gap-6 pb-8 md:pb-12">
            {loading ? (
              <div className="py-16 md:py-24 text-center animate-pulse">
                <Beaker size={40} className="mx-auto text-sandstone mb-4" />
                <p className="text-khaki font-heading text-lg md:text-xl">Linking to Pipeline...</p>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="bg-white p-12 md:p-20 lg:p-24 rounded-3xl md:rounded-4xl lg:rounded-[4rem] text-center border-2 border-dashed border-sandstone shadow-inner">
                <FileCheck size={40} className="mx-auto text-sandstone mb-4 md:mb-6" />
                <p className="text-khaki font-heading text-xl md:text-2xl italic">Queue is clear.</p>
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-khaki mt-2 md:mt-3 opacity-60">Ready for incoming referrals</p>
              </div>
            ) : (
              filteredQueue.map(p => (
                <div key={p._id} className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl lg:rounded-[3.5rem] border border-sandstone shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 md:gap-6 lg:gap-8 group hover:border-marigold transition-all relative overflow-hidden">
                  {p.isEmergency && <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 animate-pulse"></div>}

                  <div className="flex items-center gap-4 md:gap-6 lg:gap-8 w-full md:w-auto">
                    <div className="w-14 md:w-16 lg:w-20 h-14 md:h-16 lg:h-20 bg-parchment rounded-xl md:rounded-2xl lg:rounded-[2.5rem] border-2 border-sandstone group-hover:border-marigold/30 flex flex-col items-center justify-center transition-colors flex-shrink-0">
                      <p className="text-[7px] md:text-[8px] font-black text-khaki uppercase mb-0.5">Token</p>
                      <p className="text-2xl md:text-3xl lg:text-3xl font-heading text-teak">{p.tokenNumber}</p>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2 flex-wrap">
                        <span className={`px-2 md:px-3 py-1 rounded-lg text-[7px] md:text-[9px] font-black uppercase tracking-widest border flex-shrink-0 ${p.isEmergency ? 'bg-red-50 text-red-600 border-red-100' : 'bg-marigold/10 text-marigold border-marigold/20'}`}>
                          {p.requiredTest || 'Diagnostic'}
                        </span>
                        {p.isEmergency && <span className="text-[7px] md:text-[8px] font-black text-red-600 animate-pulse uppercase tracking-tighter flex-shrink-0">🚨 PRIORITY</span>}
                      </div>
                      <h3 className="text-2xl md:text-3xl lg:text-3xl font-heading text-teak truncate">{p.patientName}</h3>
                      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 lg:gap-6 mt-2 md:mt-3 text-[8px] md:text-[10px] font-bold text-khaki">
                        <p className="flex items-center gap-2 truncate"><Smartphone size={12} className="flex-shrink-0" /> {p.patientPhone}</p>
                        <p className="flex items-center gap-2 truncate"><Hash size={12} className="flex-shrink-0" /> {p._id.slice(-6).toUpperCase()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto">
                    <label className="flex items-center justify-center gap-2 md:gap-3 lg:gap-4 bg-teak text-parchment px-4 md:px-8 lg:px-12 py-3 md:py-4 lg:py-5 rounded-lg md:rounded-xl lg:rounded-2xl cursor-pointer hover:bg-marigold transition-all font-black text-[8px] md:text-[9px] lg:text-[10px] uppercase tracking-[0.2em] shadow-xl group-hover:scale-[1.02] active:scale-95 whitespace-nowrap">
                      <Upload size={16} className="flex-shrink-0" />
                      <span className="hidden md:inline">Sync Report</span>
                      <span className="md:hidden">Upload</span>
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