import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client'; // 🔑 Added Socket Client
import { X, FileText, Activity, Download, Calendar, User, History, RefreshCw } from 'lucide-react';
import { SOCKET_URL } from '../../config/runtime';
const API_URL = import.meta.env.VITE_API_URL;
// Initialize socket
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const PatientQuickView = ({ phone, onClose }) => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('vitals');
  const token = localStorage.getItem('token');

  const fetchFullProfile = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsSyncing(true);

    try {
      const res = await axios.get(`http://localhost:5000/api/staff/patient-full-profile/${phone}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatient(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching locker:", err);
      setLoading(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // 🔌 WebSocket Lifecycle
  useEffect(() => {
    fetchFullProfile();

    // Doctors join a room based on the patient's ID to receive instant updates 
    // if vitals are updated by the receptionist in real-time.
    if (patient?._id) {
      socket.emit('joinClinic', patient._id);

      socket.on('patientProfileUpdated', (updatedData) => {
        console.log("♻️ Patient Vitals/Profile updated by another node");
        setPatient(updatedData);
      });
    }

    return () => {
      socket.off('patientProfileUpdated');
    };
  }, [phone, token, patient?._id]);

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#422D0B]/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-[#E8DDCB]">

        {/* Header */}
        <div className="px-8 py-6 bg-[#FFFBF5] border-b border-[#E8DDCB] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FFA800] rounded-2xl flex items-center justify-center text-white text-xl relative">
              <User size={24} />
              {isSyncing && <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFA800] border-2 border-white rounded-full animate-ping"></div>}
            </div>
            <div>
              <h2 className="text-2xl font-heading text-[#422D0B]">{patient?.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#967A53]">
                {patient?.age || '??'} yrs • {patient?.gender || 'N/A'} • {patient?.bloodGroup || 'O+'}
                {isSyncing && <span className="ml-3 text-[#FFA800] animate-pulse">● Syncing Live</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#E8DDCB] rounded-full transition-colors group">
            <X size={24} className="text-[#967A53] group-hover:text-[#422D0B]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E8DDCB] bg-white">
          <TabButton
            active={activeTab === 'vitals'}
            onClick={() => setActiveTab('vitals')}
            icon={<Activity size={14} />}
            label="Vitals History"
          />
          <TabButton
            active={activeTab === 'notes'}
            onClick={() => setActiveTab('notes')}
            icon={<History size={14} />}
            label="Visit Notes"
          />
          <TabButton
            active={activeTab === 'documents'}
            onClick={() => setActiveTab('documents')}
            icon={<FileText size={14} />}
            label="Medical Locker"
          />
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto p-8 bg-[#FFFBF5]/30">

          {activeTab === 'vitals' && (
            <div className="space-y-4">
              {patient?.vitals?.length > 0 ? (
                [...patient.vitals].reverse().map((v, i) => (
                  <div key={i} className="bg-white border border-[#E8DDCB] p-6 rounded-[2rem] shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 relative transition-all hover:border-[#FFA800] animate-in slide-in-from-bottom-2">
                    <div className="absolute top-4 right-6 flex items-center gap-1 text-[8px] font-black text-[#967A53] uppercase">
                      <Calendar size={10} /> {new Date(v.recordedAt).toLocaleDateString()}
                    </div>
                    <VitalItem label="Blood Pressure" val={v.bloodPressure} unit="mmHg" />
                    <VitalItem label="Pulse Rate" val={v.pulseRate} unit="bpm" />
                    <VitalItem label="Temperature" val={v.temperature} unit="°F" />
                    <VitalItem label="Sugar Level" val={v.sugarLevel} unit="mg/dL" />
                  </div>
                ))
              ) : (
                <EmptyState icon={<Activity size={40} />} text="No health trends recorded yet." />
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-6">
              {patient?.medicalHistory?.length > 0 ? (
                [...patient.medicalHistory].reverse().map((record, i) => (
                  <div key={i} className="bg-white border-l-4 border-[#FFA800] p-6 rounded-r-3xl shadow-sm border-y border-r border-[#E8DDCB] animate-in slide-in-from-right-2">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-heading text-lg text-[#422D0B]">Dr. {record.doctorName}</h4>
                        <p className="text-[9px] font-black text-[#967A53] uppercase tracking-widest">{record.clinicName}</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#FFA800] bg-[#FFA800]/10 px-3 py-1 rounded-full">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#422D0B] leading-relaxed whitespace-pre-wrap italic bg-[#FFFBF5] p-4 rounded-xl border border-[#E8DDCB]/50">
                      "{record.diagnosis || 'No clinical notes provided.'}"
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState icon={<History size={40} />} text="No previous consultation notes." />
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patient?.documents?.length > 0 ? (
                patient.documents.map((doc, i) => (
                  <div key={i} className="bg-white border border-[#E8DDCB] p-5 rounded-3xl flex items-center justify-between hover:border-[#FFA800] transition-all group animate-in zoom-in-95">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#FFFBF5] rounded-xl flex items-center justify-center text-[#FFA800] group-hover:scale-110 transition-transform">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#422D0B]">{doc.title}</h4>
                        <p className="text-[9px] font-black text-[#967A53] uppercase">{doc.fileType} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-3 bg-[#FFFBF5] hover:bg-[#FFA800] hover:text-white rounded-xl text-[#967A53] transition-all">
                      <Download size={18} />
                    </a>
                  </div>
                ))
              ) : (
                <div className="col-span-2">
                  <EmptyState icon={<FileText size={40} />} text="Medical locker is empty." />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-8 py-4 bg-white border-t border-[#E8DDCB] text-center">
          <p className="text-[9px] font-black text-[#967A53] uppercase tracking-widest">
            🔒 Data secured via Swasthya-Mitra Clinical Vault
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${active ? 'text-[#FFA800] border-b-2 border-[#FFA800] bg-[#FFA800]/5' : 'text-[#967A53] hover:text-[#422D0B]'}`}
  >
    {icon} {label}
  </button>
);

const VitalItem = ({ label, val, unit }) => (
  <div>
    <p className="text-[8px] font-black text-[#967A53] uppercase mb-1">{label}</p>
    <p className="font-bold text-[#422D0B] text-sm">{val || '--'} <span className="text-[8px] opacity-40 font-bold">{unit}</span></p>
  </div>
);

const EmptyState = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center py-20 text-[#967A53] opacity-40">
    <div className="mb-4">{icon}</div>
    <p className="font-heading text-lg">{text}</p>
  </div>
);

export default PatientQuickView;