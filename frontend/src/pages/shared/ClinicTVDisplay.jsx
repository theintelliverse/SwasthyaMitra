import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import {
  Users, Stethoscope, ChevronRight, Siren,
  ArrowLeft, Monitor, Clock, RefreshCw, Zap,
  Activity, ShieldCheck, Volume2, Info, Wifi, Signal
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const ClinicTVDisplay = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clinicName, setClinicName] = useState("Swasthya-Mitra Clinic");
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const joinedRoomRef = useRef(null);
  const clinicCode = window.location.pathname.split('/').pop() || 'CITY01';

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/staff/public/doctors/${clinicCode}`);
      setDoctors(res.data.doctors);
      setClinicName(res.data.clinicName);

      if (res.data.doctors && res.data.doctors.length > 0) {
        let actualClinicId = res.data.doctors[0].clinicId;
        if (actualClinicId && typeof actualClinicId === 'object') {
          actualClinicId = actualClinicId._id;
        }
        if (actualClinicId && joinedRoomRef.current !== actualClinicId) {
          if (socketRef.current) socketRef.current.emit('joinClinic', actualClinicId);
          joinedRoomRef.current = actualClinicId;
        }
      }
      setLoading(false);
    } catch (err) {
      setError("Syncing...");
      setLoading(false);
    }
  };

  const fetchQueue = async (docId) => {
    try {
      const res = await axios.get(`${API_URL}/api/queue/public/doctor-display/${docId}`);
      setQueue(res.data.data || []);
    } catch (err) { }
  };

  const socketRef = useRef(null);

  useEffect(() => {
    if (!SOCKET_URL) return;
    const newSocket = io(SOCKET_URL, { reconnection: true });
    socketRef.current = newSocket;

    const handleReconnect = () => {
      if (joinedRoomRef.current) {
        newSocket.emit('joinClinic', joinedRoomRef.current);
      }
    };
    newSocket.on('connect', handleReconnect);

    return () => {
      newSocket.off('connect', handleReconnect);
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;
    const handleUpdate = () => {
      fetchDoctors();
      if (selectedDoc) {
        fetchQueue(selectedDoc._id);
      }
    };

    socketRef.current.on('queueUpdate', handleUpdate);
    socketRef.current.on('doctorStatusChanged', handleUpdate);

    return () => {
      socketRef.current.off('queueUpdate', handleUpdate);
      socketRef.current.off('doctorStatusChanged', handleUpdate);
    };
  }, [selectedDoc]);

  useEffect(() => {
    if (selectedDoc) {
      fetchQueue(selectedDoc._id);
    }
  }, [selectedDoc]);

  if (loading && !error) return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-transparent to-purple-500/10 blur-[100px]" />
      <div className="relative z-10">
        <div className="w-24 h-24 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mb-8" />
        <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Healthcare OS</h1>
        <p className="text-teal-500 font-black uppercase tracking-[0.3em] text-xs">Initializing Neural Link</p>
      </div>
    </div>
  );

  if (!selectedDoc) {
    return (
      <div className="min-h-screen bg-[#0F172A] p-12 font-body text-white selection:bg-teal-500 relative overflow-hidden flex flex-col">
        {/* Cinematic Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-500/10 blur-[160px] rounded-full -mr-96 -mt-96 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[160px] rounded-full -ml-48 -mb-48" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
        </div>

        <header className="relative z-10 mb-20 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-teal-600 to-teal-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-500/20 group">
              <ShieldCheck size={32} className="text-white group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tighter leading-none">{clinicName}</h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-teal-500 font-black uppercase tracking-[0.5em] text-[10px]">Digital Waiting Room Control</p>
                <div className="w-1 h-1 bg-white/10 rounded-full" />
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                  <Users size={12} className="text-teal-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">
                    Queue Dashboard: {doctors.reduce((acc, doc) => acc + (doc.queueCount || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="text-4xl font-black tracking-tighter tabular-nums mb-1">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
              <Wifi size={14} className="text-green-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Secure Sync Active</span>
            </div>
          </div>
        </header>

        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {doctors.map(doc => (
            <button
              key={doc._id}
              onClick={() => setSelectedDoc(doc)}
              className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-10 rounded-[3rem] text-left hover:bg-white/[0.08] hover:border-teal-500/50 transition-all duration-500 group relative overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />

              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-all duration-500">
                  <Stethoscope size={24} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${doc.isAvailable ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${doc.isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                    {doc.isAvailable ? 'Online' : 'Away'}
                  </div>
                  {doc.isAvailable && (
                    <div className="bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-xl flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-teal-500/60">Queue</span>
                      <span className="text-sm font-black text-teal-400">{doc.queueCount || 0}</span>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-3xl font-black tracking-tight mb-1 group-hover:text-teal-400 transition-colors">Dr. {doc.name}</h3>
              <p className="text-white/40 font-bold text-xs uppercase tracking-[0.2em] mb-12">{doc.specialization}</p>

              <div className="mt-auto flex justify-between items-center pt-8 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Availability</span>
                  <span className="text-sm font-black text-white/80">{doc.isAvailable ? 'Consulting Now' : 'Duty Concluded'}</span>
                </div>
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-teal-500/20 group-hover:translate-x-2 transition-all">
                  <ChevronRight size={20} className="text-white/20 group-hover:text-teal-500" />
                </div>
              </div>
            </button>
          ))}
        </div>

        <footer className="mt-auto pt-10 text-center opacity-20 relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.5em]">Powered by Appointory • v2.0 Cinematic Edition</p>
        </footer>
      </div>
    );
  }

  const activePatient = queue.find(p => p.status === 'In-Consultation');
  const waitingPatients = queue.filter(p => p.status === 'Waiting');

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col font-body overflow-hidden relative">
      {/* Dynamic Aura Background */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${activePatient?.isEmergency ? 'bg-red-950/40' : 'bg-[#0F172A]'}`} />
      <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-600/10 via-transparent to-indigo-600/10 pointer-events-none transition-opacity duration-1000 ${activePatient?.isEmergency ? 'opacity-0' : 'opacity-100'}`} />

      {/* TV Header */}
      <nav className="relative z-10 bg-black/40 backdrop-blur-2xl p-10 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-10">
          <button
            onClick={() => setSelectedDoc(null)}
            className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-white/20 hover:text-white transition-all shadow-xl"
          >
            <ArrowLeft size={28} />
          </button>
          <div className="flex items-center gap-6 border-l border-white/10 pl-10">
            <div className="w-16 h-16 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-500">
              <Stethoscope size={32} />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tighter leading-none mb-1">Dr. {selectedDoc.name}</h1>
              <p className="text-teal-500 font-black uppercase tracking-[0.4em] text-xs">Clinical Specialist • {selectedDoc.specialization}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-right">
            <p className="text-5xl font-black tracking-tighter tabular-nums leading-none mb-1">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="flex items-center justify-end gap-2 text-teal-500/40 font-black uppercase text-[10px] tracking-widest">
              <Signal size={12} className="text-green-500" />
              Live Transmission
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="relative z-10 flex-grow flex flex-col lg:flex-row overflow-hidden">

        {/* Left Side: Active Status */}
        <div className="w-full lg:w-3/5 p-16 flex flex-col justify-center items-center lg:border-r border-white/10">
          <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 mb-12 animate-pulse">
            <Activity size={20} className="text-teal-400" />
            <p className="text-xl font-black uppercase tracking-[0.5em] text-white/60">Currently Consulting</p>
          </div>

          {activePatient ? (
            <div className="text-center w-full max-w-2xl animate-in zoom-in-95 duration-1000">
              <div className={`mx-auto w-56 h-56 lg:w-[320px] lg:h-[320px] rounded-[3rem] lg:rounded-[4rem] flex flex-col items-center justify-center border-[12px] shadow-[0_0_80px_rgba(20,184,166,0.15)] mb-8 relative group transition-all duration-1000 ${activePatient.isEmergency ? 'border-red-600 bg-red-950/60 shadow-red-600/40 pulse-ring' : 'border-teal-500 bg-teal-500/10 shadow-teal-500/20'}`}>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-[inherit] opacity-30" />
                <span className="text-sm lg:text-xl font-black uppercase tracking-[0.3em] text-white/40 mb-2">Token Number</span>
                <span className="text-7xl lg:text-[7rem] font-black leading-none tabular-nums tracking-tighter">{activePatient.tokenNumber}</span>
              </div>
              <h2 className="text-4xl lg:text-6xl font-black tracking-tighter truncate max-w-full px-8">{activePatient.patientName}</h2>
              {activePatient.isEmergency && (
                <div className="mt-8 inline-flex items-center gap-4 px-8 py-3 bg-red-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] animate-pulse shadow-2xl shadow-red-600/50">
                  <Siren size={24} />
                  Critical Priority
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-8 opacity-20">
              <div className="w-48 h-48 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <Clock size={80} strokeWidth={1} />
              </div>
              <div>
                <p className="text-5xl font-black tracking-tighter uppercase mb-2">Cabin Idle</p>
                <p className="text-xl font-bold tracking-widest text-teal-400">Waiting for next patient assignment</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Waiting List */}
        <div className="w-full lg:w-2/5 flex flex-col bg-black/30 backdrop-blur-3xl overflow-hidden shadow-2xl">
          <div className="p-10 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-500/10 text-teal-500 rounded-xl">
                <Users size={28} />
              </div>
              <h3 className="text-3xl font-black tracking-tighter">Queue Dashboard</h3>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-teal-500 tabular-nums leading-none">{waitingPatients.length}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Lounge Queue</span>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-10 space-y-8 custom-scrollbar">
            {waitingPatients.length > 0 ? (
              waitingPatients.map((p, idx) => (
                <div key={p._id} className={`group p-8 rounded-[3rem] flex justify-between items-center border transition-all duration-500 animate-in slide-in-from-right-10 ${p.isEmergency ? 'bg-red-600/20 border-red-500/30' : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:translate-x-2'}`}>
                  <div className="flex items-center gap-8">
                    <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center font-black text-4xl shadow-2xl ${p.isEmergency ? 'bg-red-600 shadow-red-600/20' : 'bg-teal-500/20 text-teal-400 shadow-teal-500/10'}`}>
                      {p.tokenNumber}
                    </div>
                    <div>
                      <p className="text-3xl font-black tracking-tighter truncate max-w-[280px] group-hover:text-teal-400 transition-colors">{p.patientName}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${p.isEmergency ? 'text-red-400' : 'text-white/20'}`}>
                          {p.isEmergency ? 'High Priority' : 'Regular Consultation'}
                        </span>
                        <div className="w-1 h-1 bg-white/10 rounded-full" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Token Auth Verified</span>
                        {p.estimatedWait > 0 && (
                          <>
                            <div className="w-1 h-1 bg-white/10 rounded-full" />
                            <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Est. Wait: {p.estimatedWait} Mins</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-6">
                <Info size={80} strokeWidth={1} />
                <p className="text-3xl font-black tracking-tighter uppercase">Lounge is vacant</p>
              </div>
            )}
          </div>

          {/* Ticker Tape */}
          <div className="p-6 bg-teal-600 text-white overflow-hidden relative border-t border-teal-500">
            <div className="absolute top-0 left-0 bottom-0 w-40 bg-gradient-to-r from-teal-600 to-transparent z-10" />
            <div className="absolute top-0 right-0 bottom-0 w-40 bg-gradient-to-l from-teal-600 to-transparent z-10" />
            <p className="text-xs font-black uppercase tracking-[0.4em] animate-marquee whitespace-nowrap inline-block pr-[100%]">
              Verify your patient ID at reception • Keep your Digital Locker QR code ready • Results synced automatically to your profile • Maintain clinical silence
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulse-ring {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
          70% { transform: scale(1.02); box-shadow: 0 0 0 50px rgba(220, 38, 38, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
        .pulse-ring { animation: pulse-ring 3s infinite; }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}} />
    </div>
  );
};

export default ClinicTVDisplay;