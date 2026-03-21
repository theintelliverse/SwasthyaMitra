import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client'; // 🔑 Added Socket Client
import { X, FileText, Activity, Download, Calendar, User, History, RefreshCw } from 'lucide-react';
import { SOCKET_URL } from '../../config/runtime';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
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
      const res = await axios.get(`${API_URL}/api/staff/patient-full-profile/${phone}`, {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-teak/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-sandstone">

        {/* Header */}
        <div className="px-8 py-6 bg-parchment border-b border-sandstone flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-marigold rounded-2xl flex items-center justify-center text-white text-xl relative">
              <User size={24} />
              {isSyncing && <div className="absolute -top-1 -right-1 w-4 h-4 bg-marigold border-2 border-white rounded-full animate-ping"></div>}
            </div>
            <div>
              <h2 className="text-2xl font-heading text-teak">{patient?.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-khaki">
                {patient?.age || '??'} yrs • {patient?.gender || 'N/A'} • {patient?.bloodGroup || 'O+'}
                {isSyncing && <span className="ml-3 text-marigold animate-pulse">● Syncing Live</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-sandstone rounded-full transition-colors group">
            <X size={24} className="text-khaki group-hover:text-teak" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-sandstone bg-white">
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
        <div className="flex-grow overflow-y-auto p-8 bg-parchment/30">

          {activeTab === 'vitals' && (
            <div className="space-y-4">
              {patient?.vitals?.length > 0 ? (
                [...patient.vitals].reverse().map((v, i) => (
                  <div key={i} className="bg-white border border-sandstone p-6 rounded-[2rem] shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 relative transition-all hover:border-marigold animate-in slide-in-from-bottom-2">
                    <div className="absolute top-4 right-6 flex items-center gap-1 text-[8px] font-black text-khaki uppercase">
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
                  <div key={i} className="bg-white border-l-4 border-marigold p-6 rounded-r-3xl shadow-sm border-y border-r border-sandstone animate-in slide-in-from-right-2">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-heading text-lg text-teak">Dr. {record.doctorName}</h4>
                        <p className="text-[9px] font-black text-khaki uppercase tracking-widest">{record.clinicName}</p>
                      </div>
                      <span className="text-[10px] font-bold text-marigold bg-marigold/10 px-3 py-1 rounded-full">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-teak leading-relaxed whitespace-pre-wrap italic bg-parchment p-4 rounded-xl border border-sandstone/50">
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
                  <div key={i} className="bg-white border border-sandstone p-5 rounded-3xl flex items-center justify-between hover:border-marigold transition-all group animate-in zoom-in-95">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-parchment rounded-xl flex items-center justify-center text-marigold group-hover:scale-110 transition-transform">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-teak">{doc.title}</h4>
                        <p className="text-[9px] font-black text-khaki uppercase">{doc.fileType} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-3 bg-parchment hover:bg-marigold hover:text-white rounded-xl text-khaki transition-all">
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

        <div className="px-8 py-4 bg-white border-t border-sandstone text-center">
          <p className="text-[9px] font-black text-khaki uppercase tracking-widest">
            🔒 Data secured via Appointory Clinical Vault
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
    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${active ? 'text-marigold border-b-2 border-marigold bg-marigold/5' : 'text-khaki hover:text-teak'}`}
  >
    {icon} {label}
  </button>
);

const VitalItem = ({ label, val, unit }) => (
  <div>
    <p className="text-[8px] font-black text-khaki uppercase mb-1">{label}</p>
    <p className="font-bold text-teak text-sm">{val || '--'} <span className="text-[8px] opacity-40 font-bold">{unit}</span></p>
  </div>
);

const EmptyState = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center py-20 text-khaki opacity-40">
    <div className="mb-4">{icon}</div>
    <p className="font-heading text-lg">{text}</p>
  </div>
);

export default PatientQuickView;