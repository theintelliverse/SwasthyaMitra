import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import {
  Users, Stethoscope, ChevronRight, Siren,
  ArrowLeft, Monitor, Clock, RefreshCw, Zap
} from 'lucide-react';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const ClinicTVDisplay = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clinicName, setClinicName] = useState("Swasthya-Mitra Clinic");
  const [error, setError] = useState(null);

  // Use a ref to track the room we joined to prevent repeated emits
  const joinedRoomRef = useRef(null);

  const clinicCode = window.location.pathname.split('/').pop() || 'CITY01';

  const fetchDoctors = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/staff/public/doctors/${clinicCode}`);
      setDoctors(res.data.doctors);
      setClinicName(res.data.clinicName);

      // 🔑 THE FIX: Handshake logic
      if (res.data.doctors && res.data.doctors.length > 0) {
        const actualClinicId = res.data.doctors[0].clinicId;

        if (actualClinicId && joinedRoomRef.current !== actualClinicId) {
          console.log("🏥 Joining Clinic Room:", actualClinicId);
          socket.emit('joinClinic', actualClinicId);
          joinedRoomRef.current = actualClinicId; // Mark as joined
        }
      }
      setLoading(false);
    } catch (err) {
      console.error("TV Fetch Error:", err);
      setError("Syncing...");
      setLoading(false);
    }
  };

  const fetchQueue = async (docId) => {
    try {
      const res = await axios.get(`${API_URL}/api/queue/public/doctor-display/${docId}`);
      setQueue(res.data.data || []);
    } catch (err) { /* Silent fail */ }
  };

  // 🔌 WebSocket Lifecycle: Register Listeners ONCE
  useEffect(() => {
    fetchDoctors();

    socket.on('queueUpdate', () => {
      console.log("♻️ [SOCKET] Queue update detected");
      // We use a functional update or closure-safe way to check selectedDoc
      // But for simplicity in TV, we'll re-trigger the fetch logic
      fetchDoctors();
    });

    socket.on('doctorStatusChanged', () => {
      console.log("🩺 [SOCKET] Doctor status change");
      fetchDoctors();
    });

    return () => {
      socket.off('queueUpdate');
      socket.off('doctorStatusChanged');
    };
  }, []); // Empty dependency array ensures listeners are only set once

  // Trigger queue fetch when a doctor is selected or doctors list updates
  useEffect(() => {
    if (selectedDoc) {
      fetchQueue(selectedDoc._id);
    }
  }, [selectedDoc, doctors]);

  if (loading && !error) return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center p-6 text-center">
      <RefreshCw size={40} className="text-marigold animate-spin mb-4" />
      <p className="font-heading text-xl text-teak">Initializing Digital Display...</p>
    </div>
  );

  if (!selectedDoc) {
    return (
      <div className="min-h-screen bg-parchment p-6 md:p-12 font-body text-teak animate-in fade-in duration-500">
        <header className="mb-12 md:mb-20 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-marigold rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl relative">
            <Monitor size={32} />
            <div className="absolute inset-0 bg-marigold rounded-3xl animate-ping opacity-10"></div>
          </div>
          <h1 className="text-4xl md:text-6xl font-heading mb-2">{clinicName}</h1>
          <p className="text-sm md:text-xl text-khaki font-black uppercase tracking-widest">Select Cabin to Monitor</p>
        </header>

        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {doctors.map(doc => (
            <button
              key={doc._id}
              onClick={() => setSelectedDoc(doc)}
              className="bg-white border border-sandstone p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] text-left hover:border-marigold hover:shadow-xl transition-all group relative overflow-hidden flex flex-col"
            >
              <div className={`absolute top-0 right-0 w-2 h-full ${doc.isAvailable ? 'bg-green-500' : 'bg-red-400 opacity-50'}`}></div>
              <h3 className="text-2xl md:text-4xl font-heading mb-1 leading-tight text-teak">Dr. {doc.name}</h3>
              <p className="text-khaki font-bold text-[10px] md:text-xs uppercase tracking-widest mb-6">{doc.specialization}</p>
              <div className="mt-auto flex justify-between items-center">
                <span className={`text-[9px] font-black uppercase flex items-center gap-1.5 ${doc.isAvailable ? 'text-green-600' : 'text-red-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${doc.isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></div>
                  {doc.isAvailable ? 'Cabin Active' : 'Away'}
                </span>
                <ChevronRight size={18} className="text-sandstone group-hover:text-marigold" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const activePatient = queue.find(p => p.status === 'In-Consultation');
  const waitingPatients = queue.filter(p => p.status === 'Waiting');

  return (
    <div className="min-h-screen bg-teak text-parchment flex flex-col font-body overflow-x-hidden animate-in zoom-in-95 duration-500">
      <nav className="bg-black/20 backdrop-blur-xl p-6 md:p-10 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-4 md:gap-8">
          <button onClick={() => setSelectedDoc(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl md:text-5xl font-heading leading-none">Dr. {selectedDoc.name}</h1>
            <p className="text-[10px] md:text-sm text-marigold font-black uppercase tracking-widest mt-1">{selectedDoc.specialization}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-2xl md:text-4xl font-heading tabular-nums">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <div className="flex items-center gap-2 opacity-60">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${selectedDoc.isAvailable ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{selectedDoc.isAvailable ? 'Link Stable' : 'Offline'}</span>
          </div>
        </div>
      </nav>

      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        <div className="w-full lg:w-3/5 p-8 md:p-16 flex flex-col justify-center items-center lg:border-r border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
          <div className="flex items-center gap-3 opacity-40 mb-6 md:mb-10">
            <Zap size={16} className="text-marigold" />
            <p className="text-xs md:text-xl font-black uppercase tracking-[0.4em]">Now Consulting</p>
          </div>

          {activePatient ? (
            <div className="text-center w-full px-4 animate-in zoom-in duration-700">
              <div className={`mx-auto w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-[3rem] md:rounded-[4rem] lg:rounded-[6rem] flex flex-col items-center justify-center border-[8px] md:border-[12px] shadow-2xl mb-6 md:mb-10 transition-all ${activePatient.isEmergency ? 'border-red-600 bg-red-600 pulse-ring' : 'border-marigold bg-marigold'}`}>
                <span className="text-xs md:text-xl font-black uppercase opacity-60">Token No.</span>
                <span className="text-6xl md:text-9xl lg:text-[14rem] font-heading leading-none tabular-nums">{activePatient.tokenNumber}</span>
              </div>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading truncate">{activePatient.patientName}</h2>
              {activePatient.isEmergency && (
                <p className="text-sm md:text-2xl font-black uppercase tracking-widest text-red-500 mt-4 animate-pulse">Priority Emergency</p>
              )}
            </div>
          ) : (
            <div className="text-center opacity-20">
              <Clock size={64} className="mx-auto mb-6" />
              <p className="text-2xl md:text-4xl font-heading italic">Waiting for Doctor...</p>
            </div>
          )}
        </div>

        <div className="w-full lg:w-2/5 flex flex-col bg-black/10 border-t lg:border-t-0 border-white/5">
          <div className="p-6 md:p-10 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={24} className="text-marigold" />
              <h3 className="text-xl md:text-3xl font-heading">Queue List</h3>
            </div>
            <span className="bg-marigold text-teak px-4 py-1 rounded-xl font-black text-xs md:text-sm">{waitingPatients.length} Waiting</span>
          </div>

          <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 max-h-[40vh] lg:max-h-none">
            {waitingPatients.length > 0 ? (
              waitingPatients.map((p, idx) => (
                <div key={p._id} className={`p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] flex justify-between items-center border transition-all animate-in slide-in-from-right duration-300 ${p.isEmergency ? 'bg-red-600/20 border-red-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                  <div className="flex items-center gap-4 md:gap-8">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-heading text-xl md:text-3xl shadow-lg ${p.isEmergency ? 'bg-red-600' : 'bg-white/10 text-white'}`}>{p.tokenNumber}</div>
                    <div>
                      <p className="text-lg md:text-2xl font-heading truncate max-w-[200px]">{p.patientName}</p>
                      {p.isEmergency && <span className="text-[8px] font-black text-red-400 uppercase flex items-center gap-1"><Siren size={10} /> Priority</span>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-10 py-10">
                <p className="text-sm md:text-xl font-heading">Lounge is clear</p>
              </div>
            )}
          </div>
          <div className="p-4 md:p-6 bg-marigold text-teak overflow-hidden whitespace-nowrap">
            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest animate-marquee inline-block pr-[100%]">
              Carry your Digital Locker ID • Results will be synced automatically • Maintain silence in lounge area
            </p>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulse-ring {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
          70% { transform: scale(1.02); box-shadow: 0 0 0 30px rgba(220, 38, 38, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .pulse-ring { animation: pulse-ring 2.5s infinite; }
        .animate-marquee { animation: marquee 20s linear infinite; }
      `}} />
    </div>
  );
};

export default ClinicTVDisplay;