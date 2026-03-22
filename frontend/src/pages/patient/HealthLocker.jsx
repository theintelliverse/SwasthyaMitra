import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import ReportViewer from '../../components/ReportViewer';
import {
  User, FileText, Activity, History, Download, Calendar, Eye,
  ShieldCheck, TrendingUp, ArrowLeft, RefreshCw, Smartphone, Hash,
  Droplet, Heart, Weight, Pill
} from 'lucide-react';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const HealthLocker = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('vitals');
  const [selectedReportIndex, setSelectedReportIndex] = useState(null);

  const fetchHealthData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsSyncing(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/auth/patient/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 🔑 Updated to use res.data.data from our new Controller
      setData(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Locker fetch error", err);
      if (err.response?.status === 401) navigate('/patient/login');
      setLoading(false);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  }, [navigate]);

  useEffect(() => {
    fetchHealthData();

    const userPhone = localStorage.getItem('userPhone')?.replace(/\D/g, '').slice(-10);

    if (userPhone) {
      socket.emit('joinClinic', userPhone);
      socket.on('queueUpdate', () => {
        console.log("♻️ Vault Refresh Triggered");
        fetchHealthData(true);
      });
    }

    return () => {
      socket.off('queueUpdate');
    };
  }, [fetchHealthData]);

  if (loading) return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center gap-4">
      <RefreshCw size={32} className="text-marigold animate-spin" />
      <div className="font-heading text-xl text-teak">Unlocking Swasthya Vault...</div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center p-10">
      <p className="font-heading text-xl text-khaki mb-6">No records found for this account.</p>
      <button onClick={() => navigate(-1)} className="px-8 py-3 bg-teak text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Go Back</button>
    </div>
  );

  // 🔑 Get latest vitals
  const latestVitals = data.vitals?.[0];

  return (
    <div className="min-h-screen bg-parchment font-body text-teak p-6 pb-20">
      <div className="max-w-6xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-khaki hover:text-teak transition-colors"
          >
            <ArrowLeft size={14} /> Close Vault
          </button>
          {isSyncing && (
            <div className="flex items-center gap-2 text-marigold animate-pulse">
              <RefreshCw size={12} className="animate-spin" />
              <span className="text-[8px] font-black uppercase tracking-widest">Live Sync Active</span>
            </div>
          )}
        </div>

        {/* --- Header --- */}
        <div className="bg-teak rounded-[3rem] p-8 md:p-12 shadow-xl mb-10 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <ShieldCheck size={120} />
          </div>

          <div className="w-24 h-24 bg-marigold rounded-[2rem] flex items-center justify-center text-white text-4xl font-heading shadow-lg z-10">
            {data.name?.charAt(0) || 'P'}
          </div>

          <div className="text-center md:text-left z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-saffron mb-1">Authenticated Identity</p>
            <h1 className="text-4xl font-heading">{data.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
              <p className="text-white/60 text-[10px] font-bold flex items-center gap-2"><Smartphone size={12} /> {data.phone}</p>
              <p className="text-white/60 text-[10px] font-bold flex items-center gap-2"><Hash size={12} /> {data.medicalHistory?.length || 0} Consultations</p>
            </div>
          </div>
        </div>

        {/* --- Latest Vitals Dashboard --- */}
        {latestVitals && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            <VitalCard icon={<Droplet size={20} />} label="Blood Pressure" value={latestVitals.bloodPressure || '-- mmHg'} color="from-red-500" />
            <VitalCard icon={<Heart size={20} />} label="Pulse Rate" value={latestVitals.pulseRate || '-- bpm'} color="from-pink-500" />
            <VitalCard icon={<Weight size={20} />} label="Weight" value={latestVitals.weight ? `${latestVitals.weight} kg` : '-- kg'} color="from-blue-500" />
            <VitalCard icon={<TrendingUp size={20} />} label="BMI" value={latestVitals.bmi ? latestVitals.bmi.toFixed(2) : '-- Score'} color="from-green-500" />
          </div>
        )}

        {/* --- Navigation Tabs --- */}
        <div className="flex gap-4 mb-8 bg-sandstone/20 p-2 rounded-2xl w-fit overflow-x-auto no-scrollbar">
          <TabButton active={activeTab === 'vitals'} onClick={() => setActiveTab('vitals')} icon={<Heart size={16} />} label="Vitals" />
          <TabButton active={activeTab === 'medicine'} onClick={() => setActiveTab('medicine')} icon={<Pill size={16} />} label="Medicine" />
          <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<FileText size={16} />} label="Reports" />
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={16} />} label="History" />
        </div>

        {/* --- Dynamic Content Area --- */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Vitals History Tab */}
          {activeTab === 'vitals' && (
            <div className="space-y-6">
              <h2 className="font-heading text-2xl text-teak mb-6">Vitals History Logs</h2>
              {data.vitals?.length > 0 ? (
                <div className="overflow-x-auto rounded-[2.5rem] border border-sandstone bg-white">
                  <table className="w-full">
                    <thead className="bg-teak text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold">Captured Date</th>
                        <th className="px-6 py-4 text-left text-sm font-bold">BP (Systolic/Diastolic)</th>
                        <th className="px-6 py-4 text-left text-sm font-bold">Pulse Rate</th>
                        <th className="px-6 py-4 text-left text-sm font-bold">Temperature</th>
                        <th className="px-6 py-4 text-left text-sm font-bold">Weight & BMI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sandstone">
                      {data.vitals.map((vital, i) => (
                        <tr key={i} className="hover:bg-parchment transition-colors">
                          <td className="px-6 py-4 text-sm font-medium">
                            {new Date(vital.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 text-sm">{vital.bloodPressure || '-- mmHg'}</td>
                          <td className="px-6 py-4 text-sm">{vital.pulseRate || '-- bpm'}</td>
                          <td className="px-6 py-4 text-sm">{vital.temperature || '-- °C'}</td>
                          <td className="px-6 py-4 text-sm">
                            <div>{vital.weight ? `${vital.weight} kg` : '-- kg'}</div>
                            <div className="text-khaki font-bold">BMI: {vital.bmi ? vital.bmi.toFixed(2) : '--'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState message="No vitals records found." />}
            </div>
          )}

          {/* Medicine/Prescription Tab */}
          {activeTab === 'medicine' && (
            <div className="space-y-6">
              <h2 className="font-heading text-2xl text-teak mb-6">Medicine & Prescriptions</h2>
              {data.medicalHistory?.length > 0 ? (
                <div className="space-y-6">
                  {data.medicalHistory.map((record, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-sandstone shadow-sm hover:border-marigold transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="font-heading text-xl text-teak flex items-center gap-2">
                            <Pill size={20} className="text-marigold" />
                            Prescription
                          </h3>
                          <p className="text-[10px] font-black text-khaki uppercase tracking-widest mt-1">{record.clinicName}</p>
                        </div>
                        <span className="text-[10px] font-bold text-marigold bg-marigold/10 px-4 py-1.5 rounded-full flex items-center gap-2">
                          <Calendar size={12} /> {new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </span>
                      </div>

                      {/* Prescription Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="p-4 bg-parchment rounded-2xl border border-sandstone/50">
                          <p className="text-[10px] font-black text-khaki uppercase tracking-widest mb-2">Doctor</p>
                          <p className="font-bold text-teak">Dr. {record.doctorName}</p>
                        </div>
                        <div className="p-4 bg-parchment rounded-2xl border border-sandstone/50">
                          <p className="text-[10px] font-black text-khaki uppercase tracking-widest mb-2">Diagnosis</p>
                          <p className="font-bold text-teak">{record.diagnosis || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Symptoms */}
                      {record.symptoms && (
                        <div className="mb-6 p-4 bg-parchment rounded-2xl border border-sandstone/50">
                          <p className="text-[10px] font-black text-khaki uppercase tracking-widest mb-2">Symptoms</p>
                          <p className="text-sm text-teak leading-relaxed whitespace-pre-wrap">{record.symptoms}</p>
                        </div>
                      )}

                      {/* Prescription Details */}
                      {record.prescription && (
                        <div className="p-6 bg-yellow-50 rounded-2xl border-2 border-yellow-200">
                          <h4 className="font-heading text-lg text-teak mb-4 flex items-center gap-2">
                            <Pill size={18} className="text-marigold" />
                            Medicine Details (Kyare kai Vastu & Ketla Amount)
                          </h4>
                          <div className="text-sm text-teak whitespace-pre-wrap leading-relaxed font-medium">
                            {record.prescription}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="No prescriptions found." />}
            </div>
          )}

          {/* Clinical Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h2 className="font-heading text-2xl text-teak mb-6">Clinical Reports & Imaging</h2>
              {data.documents?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.documents.map((doc, i) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedReportIndex(i)}
                      className="bg-white p-6 rounded-[2.5rem] border border-sandstone shadow-sm hover:border-marigold hover:shadow-xl transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-heading text-lg text-teak mb-1 group-hover:text-marigold transition-colors">{doc.title}</h4>
                          <p className="text-[9px] font-black text-khaki uppercase tracking-widest">
                            {doc.fileType} • {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-marigold/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-marigold group-hover:text-white transition-all">
                          <Eye size={24} className="text-marigold group-hover:text-white" />
                        </div>
                      </div>
                      
                      {/* Display image preview if available */}
                      {doc.fileUrl && (
                        <ImagePreview imageUrl={doc.fileUrl} title={doc.title} />
                      )}

                      <div className="mt-4 flex gap-2">
                        <div className="flex-1 py-3 bg-teak/10 text-teak rounded-xl font-bold text-[10px] uppercase tracking-widest text-center group-hover:bg-teak group-hover:text-white transition-all">
                          👁️ View Report
                        </div>
                        {doc.fileUrl && (
                          <a 
                            href={doc.fileUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            onClick={(e) => e.stopPropagation()}
                            className="px-4 py-3 bg-marigold hover:bg-marigold/80 text-white rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest shadow-md"
                            title="Download Report"
                          >
                            <Download size={16} />
                          </a>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : <EmptyState message="No clinical reports found." />}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="font-heading text-2xl text-teak mb-6">Consultation History</h2>
              {data.medicalHistory?.length > 0 ? (
                data.medicalHistory.map((record, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-sandstone shadow-sm hover:border-marigold transition-all animate-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-heading text-xl text-teak">Dr. {record.doctorName}</h3>
                        <p className="text-[10px] font-black text-khaki uppercase tracking-widest">{record.clinicName}</p>
                      </div>
                      <span className="text-[10px] font-bold text-marigold bg-marigold/10 px-4 py-1.5 rounded-full flex items-center gap-2">
                        <Calendar size={12} /> {new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {record.symptoms && (
                        <div className="p-4 bg-parchment rounded-2xl border border-sandstone/50">
                          <p className="text-[10px] font-black text-khaki uppercase tracking-widest mb-2">Symptoms</p>
                          <p className="text-sm text-teak">{record.symptoms}</p>
                        </div>
                      )}
                      {record.diagnosis && (
                        <div className="p-4 bg-parchment rounded-2xl border border-sandstone/50">
                          <p className="text-[10px] font-black text-khaki uppercase tracking-widest mb-2">Diagnosis</p>
                          <p className="text-sm text-teak">{record.diagnosis}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : <EmptyState message="No consultation history found." />}
            </div>
          )}
        </div>
      </div>

      {/* 🔑 Report Viewer Modal */}
      {selectedReportIndex !== null && (
        <ReportViewer
          documents={data.documents}
          initialIndex={selectedReportIndex}
          onClose={() => setSelectedReportIndex(null)}
        />
      )}
    </div>
  );
};

// UI Components
const VitalCard = ({ icon, label, value, color }) => (
  <div className={`bg-gradient-to-br ${color} to-opacity-20 p-6 rounded-[2rem] shadow-lg border border-white/20`}>
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-white/20 rounded-lg text-white">
        {icon}
      </div>
      <p className="text-xs font-black text-white uppercase tracking-widest">{label}</p>
    </div>
    <p className="font-heading text-3xl text-white font-bold">{value}</p>
  </div>
);

// Image Preview Component with Better Error Handling
const ImagePreview = ({ imageUrl, title }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <div className="mb-4 rounded-xl overflow-hidden border border-sandstone/50 h-48 bg-gray-100 relative flex items-center justify-center">
      {!imageError ? (
        <>
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <RefreshCw size={28} className="text-marigold animate-spin" />
            </div>
          )}
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              console.error("Image failed to load:", imageUrl);
              setImageError(true);
              setImageLoading(false);
            }}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full bg-parchment">
          <FileText size={40} className="text-sandstone mb-2" />
          <p className="text-[10px] font-black text-khaki uppercase text-center px-4">
            Report Image Not Available
          </p>
          <p className="text-[8px] text-khaki/60 mt-1">Click "Open Full Report" to view</p>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${active ? 'bg-marigold text-white shadow-lg' : 'bg-white text-khaki border border-sandstone hover:border-teak'}`}
  >
    {icon} {label}
  </button>
);

const EmptyState = ({ message }) => (
  <div className="bg-white border-2 border-dashed border-sandstone p-24 rounded-[4rem] text-center text-khaki w-full flex flex-col items-center">
    <div className="w-16 h-16 bg-parchment rounded-full flex items-center justify-center mb-6 border border-sandstone">
      <Activity size={32} className="opacity-20" />
    </div>
    <p className="font-heading text-xl opacity-60 italic">{message}</p>
  </div>
);

export default HealthLocker;