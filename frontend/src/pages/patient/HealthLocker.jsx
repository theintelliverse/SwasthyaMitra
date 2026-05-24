import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import ReportViewer from '../../components/ReportViewer';
import {
  User, FileText, Activity, History, Download, Calendar, Eye,
  ShieldCheck, TrendingUp, ArrowLeft, RefreshCcw, Smartphone, Hash,
  Droplet, Heart, Weight, Pill, Zap, Thermometer, Droplets, ArrowUpRight, Search, Database
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';

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
      socket.on('queueUpdate', () => fetchHealthData(true));
    }
    return () => {
      socket.off('queueUpdate');
    };
  }, [fetchHealthData]);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
      <RefreshCcw size={40} className="text-teal-600 animate-spin" />
      <p className="font-black text-slate-900 text-xl tracking-tight">Unlocking Digital Vault...</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-10">
      <Database size={48} className="text-slate-200 mb-6" />
      <p className="text-xl font-black text-slate-900 tracking-tight mb-6">No records found for this account.</p>
      <button onClick={() => navigate(-1)} className="px-8 py-3 bg-teal-600 text-white rounded-2xl font-black uppercase text-[14px] tracking-widest shadow-xl shadow-teal-600/20">Go Back</button>
    </div>
  );

  const latestVitals = data.vitals?.[0];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-body">
      <Sidebar role="patient" />
      
      <div className="flex-grow p-3 pb-32 lg:p-4 lg:pb-4 overflow-y-auto h-screen custom-scrollbar max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-6">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="px-2 py-0.5 bg-teal-50 text-teal-600 rounded-full text-[14px] font-black uppercase tracking-widest border border-teal-100">
                Health Locker
              </span>
              {isSyncing && <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping"></div>}
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Medical Vault <span className="text-teal-600">.</span>
            </h1>
            <p className="text-slate-400 font-bold text-[14px] mt-0.5 uppercase tracking-wider">Authenticated clinical records & wellness logs.</p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => fetchHealthData(true)}
              className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-teal-600 hover:border-teal-100 transition-all shadow-sm active:scale-95"
            >
              <RefreshCcw size={13} className={isSyncing ? 'animate-spin text-teal-500' : ''} />
            </button>
          </div>
        </header>

        {/* --- Identity Summary Card --- */}
        <div className="bg-slate-900 rounded-2xl p-4 mb-4 relative overflow-hidden text-white shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck size={80} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-4">
            <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-teal-600/30">
              {data.name?.charAt(0) || 'P'}
            </div>

            <div className="text-center md:text-left flex-1">
              <p className="text-[14px] font-black uppercase tracking-[0.3em] text-teal-400 mb-1">Verified Identity</p>
              <h2 className="text-xl font-black tracking-tight mb-2">{data.name}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[14px]">
                  <Smartphone size={12} className="text-teal-500" /> {data.phone}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[14px]">
                  <Hash size={12} className="text-teal-500" /> {data.medicalHistory?.length || 0} Consultations
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[14px]">
                  <FileText size={12} className="text-teal-500" /> {data.documents?.length || 0} Reports
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Navigation Tabs --- */}
        <div className="flex bg-white border border-slate-100 p-1 rounded-xl shadow-sm mb-4 md:mb-5 overflow-x-auto hide-scrollbar whitespace-nowrap snap-x snap-mandatory shrink-0 w-full">
          <TabBtn active={activeTab === 'vitals'} onClick={() => setActiveTab('vitals')} icon={<Heart size={11} />} label="Vitals" />
          <TabBtn active={activeTab === 'medicine'} onClick={() => setActiveTab('medicine')} icon={<Pill size={11} />} label="Prescriptions" />
          <TabBtn active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<FileText size={11} />} label="Records" />
          <TabBtn active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={11} />} label="Timeline" />
        </div>

        {/* --- Dynamic Content --- */}
        <div className="animate-in fade-in duration-500">
          {activeTab === 'vitals' && (
            <div className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                <VitalCard icon={<Droplets size={12} />} label="BP" val={latestVitals?.bloodPressure || '--'} unit="mmHg" color="rose" />
                <VitalCard icon={<Zap size={12} />} label="Pulse" val={latestVitals?.pulseRate || '--'} unit="bpm" color="teal" />
                <VitalCard icon={<Weight size={12} />} label="Weight" val={latestVitals?.weight || '--'} unit="kg" color="blue" />
                <VitalCard icon={<TrendingUp size={12} />} label="BMI" val={latestVitals?.bmi ? latestVitals.bmi.toFixed(1) : '--'} unit="Score" color="indigo" />
              </div>

              <div className="bg-white border border-slate-100 rounded-xl md:rounded-2xl shadow-sm overflow-hidden">
                <div className="p-3 md:p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-black text-sm md:text-base text-slate-900 tracking-tight">Vitals Historical Logs</h3>
                  <div className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 shadow-sm"><Activity size={13} /></div>
                </div>
                <div className="p-3 md:p-4">
                  {data.vitals?.length > 0 ? (
                    <>
                      {/* Desktop View Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-2">
                          <thead>
                            <tr className="text-[14px] font-black uppercase tracking-widest text-slate-400">
                              <th className="px-3 py-2">Captured Date</th>
                              <th className="px-3 py-2">Blood Pressure</th>
                              <th className="px-3 py-2">Pulse Rate</th>
                              <th className="px-3 py-2">Temperature</th>
                              <th className="px-3 py-2 text-right">Weight / BMI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.vitals.map((vital, i) => (
                              <tr key={i} className="group hover:scale-[1.002] transition-all duration-300">
                                <td className="px-3 py-3 bg-slate-50/50 rounded-l-xl border-y border-l border-transparent group-hover:border-teal-100 group-hover:bg-teal-50/30">
                                  <span className="text-[14px] font-black text-slate-900">{new Date(vital.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </td>
                                <td className="px-3 py-3 bg-slate-50/50 border-y border-transparent group-hover:border-teal-100 group-hover:bg-teal-50/30">
                                  <span className="text-[14px] font-bold text-slate-600">{vital.bloodPressure || '--'}</span>
                                </td>
                                <td className="px-3 py-3 bg-slate-50/50 border-y border-transparent group-hover:border-teal-100 group-hover:bg-teal-50/30">
                                  <span className="text-[14px] font-bold text-slate-600">{vital.pulseRate || '--'} bpm</span>
                                </td>
                                <td className="px-3 py-3 bg-slate-50/50 border-y border-transparent group-hover:border-teal-100 group-hover:bg-teal-50/30">
                                  <span className="text-[14px] font-bold text-slate-600">{vital.temperature || '--'} °C</span>
                                </td>
                                <td className="px-3 py-3 bg-slate-50/50 rounded-r-xl border-y border-r border-transparent group-hover:border-teal-100 group-hover:bg-teal-50/30 text-right">
                                  <div className="flex flex-col">
                                    <span className="text-[14px] font-black text-teal-600">{vital.weight ? `${vital.weight} kg` : '--'}</span>
                                    <span className="text-[14px] font-bold text-slate-400 uppercase">BMI: {vital.bmi ? vital.bmi.toFixed(1) : '--'}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile View Stacked List */}
                      <div className="block md:hidden space-y-3">
                        {data.vitals.map((vital, i) => (
                          <div key={i} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/50 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <span className="text-[14px] font-black text-slate-950">
                                {new Date(vital.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-[14px] font-black text-teal-600 uppercase bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                                BMI: {vital.bmi ? vital.bmi.toFixed(1) : '--'}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-white p-2 rounded-lg border border-slate-100/30">
                                <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest">BP</p>
                                <p className="text-[14px] font-black text-slate-800 mt-0.5">{vital.bloodPressure || '--'}</p>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-slate-100/30">
                                <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Pulse</p>
                                <p className="text-[14px] font-black text-slate-800 mt-0.5">{vital.pulseRate ? `${vital.pulseRate} bpm` : '--'}</p>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-slate-100/30">
                                <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Weight</p>
                                <p className="text-[14px] font-black text-slate-800 mt-0.5">{vital.weight ? `${vital.weight} kg` : '--'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <EmptyState message="No vitals records found." />}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'medicine' && (
            <div className="space-y-4 md:space-y-5">
              {data.medicalHistory?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {data.medicalHistory.map((record, i) => (
                    <div key={i} className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm hover:border-teal-500/50 transition-all group">
                      <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="px-2 py-0.5 bg-teal-50 text-teal-600 rounded-full text-[14px] font-black uppercase tracking-widest border border-teal-100">
                              Prescription
                            </span>
                          </div>
                          <h4 className="text-sm md:text-base font-black text-slate-900 tracking-tight">Dr. {record.doctorName}</h4>
                          <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{record.clinicName}</p>
                        </div>
                        <div className="p-2 md:p-2.5 bg-slate-50 rounded-lg md:rounded-xl text-slate-400 group-hover:text-teal-600 group-hover:bg-teal-50 transition-all">
                          <Calendar size={14} />
                        </div>
                      </div>

                      <div className="p-3 md:p-4 bg-slate-900 rounded-lg md:rounded-xl text-white mb-3 md:mb-4">
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="p-1.5 bg-white/10 rounded-lg text-teal-400"><Pill size={12} /></div>
                          <span className="text-[14px] font-black uppercase tracking-widest text-teal-200">Medicine Course</span>
                        </div>
                        <div className="space-y-2 md:space-y-2.5">
                          {record.medicines?.map((med, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1.5 md:py-2 border-b border-white/5 last:border-0">
                              <div>
                                <p className="font-black text-[14px] md:text-[14px]">{med.name}</p>
                                <p className="text-[14px] md:text-[14px] font-bold text-slate-400 uppercase">{med.time}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-teal-400 text-[14px] md:text-[14px]">{med.amount}</p>
                                <p className="text-[14px] md:text-[14px] font-bold text-slate-500 uppercase">Total: {med.total}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 md:space-y-2.5">
                        <div className="p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl border border-slate-100">
                          <p className="text-[14px] font-black text-teal-600 uppercase tracking-widest mb-0.5">Diagnosis</p>
                          <p className="text-[14px] md:text-[14px] font-bold text-slate-700 leading-relaxed">{record.diagnosis || 'N/A'}</p>
                        </div>
                        {record.notes && (
                          <div className="p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl border border-slate-100">
                            <p className="text-[14px] font-black text-teal-600 uppercase tracking-widest mb-0.5">Instructions</p>
                            <p className="text-[14px] md:text-[14px] font-bold text-slate-700 leading-relaxed italic">"{record.notes}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="No prescriptions found." />}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4 md:space-y-5">
              {data.documents?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {data.documents.map((doc, i) => (
                    <div key={i} className="bg-white border border-slate-100 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm hover:border-teal-500/50 hover:shadow-lg transition-all group flex flex-col">
                      <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-teal-50 rounded-lg md:rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                          <FileText size={14} className="md:hidden" />
                          <FileText size={18} className="hidden md:block" />
                        </div>
                        <div className="text-right">
                          <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                            {doc.fileType}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm md:text-base font-black text-slate-900 tracking-tight mb-0.5 md:mb-1 group-hover:text-teal-600 transition-colors">{doc.title}</h4>
                      <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-3 md:mb-4">
                        {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>

                      {doc.fileUrl && (
                        <div className="mb-3 md:mb-4 rounded-xl overflow-hidden border border-slate-100 h-24 md:h-32 bg-slate-50 flex items-center justify-center relative group/img">
                          <img 
                            src={doc.fileUrl} 
                            alt={doc.title} 
                            className="w-full h-full object-cover opacity-60 group-hover/img:opacity-100 transition-opacity" 
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye size={18} className="text-white" />
                          </div>
                        </div>
                      )}

                      <div className="mt-auto flex gap-2">
                        <button 
                          onClick={() => setSelectedReportIndex(i)}
                          className="flex-1 py-2 md:py-2.5 bg-slate-900 text-white rounded-lg md:rounded-xl font-black text-[14px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <Eye size={11} /> Open
                        </button>
                        <a 
                          href={doc.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 md:p-2.5 bg-teal-50 text-teal-600 rounded-lg md:rounded-xl border border-teal-100 hover:bg-teal-600 hover:text-white transition-all active:scale-95"
                        >
                          <Download size={11} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="No clinical reports found." />}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 md:space-y-5">
              {data.medicalHistory?.length > 0 ? (
                <div className="relative space-y-4 md:space-y-5">
                  <div className="absolute left-[27px] top-4 bottom-4 w-px bg-slate-100 hidden md:block" />
                  {data.medicalHistory.map((record, i) => (
                    <div key={i} className="group relative flex gap-3 md:gap-5 items-start">
                      <div className="hidden md:flex flex-col items-center">
                        <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center shadow-sm group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                          <span className="text-[14px] font-black uppercase tracking-tighter opacity-60">{new Date(record.date || record.visitDate).toLocaleDateString('en-IN', { month: 'short' })}</span>
                          <span className="text-lg font-black leading-none">{new Date(record.date || record.visitDate).getDate()}</span>
                        </div>
                      </div>

                      <div className="flex-grow bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-teal-100 transition-all duration-300">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-2.5 md:mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="px-2 py-0.5 bg-teal-50 text-teal-600 rounded-full text-[14px] font-black uppercase tracking-widest border border-teal-100">Consultation Session</span>
                              <span className="md:hidden px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded text-[14px] font-bold">
                                {new Date(record.date || record.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                            <h4 className="text-sm md:text-base font-black text-slate-900 tracking-tight">Dr. {record.doctorName}</h4>
                            <p className="text-[14px] md:text-[14px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{record.clinicName}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-100">
                            <Activity size={11} />
                            <span className="text-[14px] md:text-[14px] font-black uppercase tracking-widest">Verified</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                          <div className="p-2.5 md:p-3 bg-slate-50/50 rounded-lg md:rounded-xl border border-slate-100">
                            <p className="text-[14px] font-black text-teal-600 uppercase tracking-widest mb-1">Diagnostic Analysis</p>
                            <p className="text-[14px] md:text-[14px] font-bold text-slate-700 leading-relaxed">{record.diagnosis || 'General follow-up consultation'}</p>
                          </div>
                          <div className="p-2.5 md:p-3 bg-slate-50/50 rounded-lg md:rounded-xl border border-slate-100">
                            <p className="text-[14px] font-black text-teal-600 uppercase tracking-widest mb-1">Reported Symptoms</p>
                            <p className="text-[14px] md:text-[14px] font-bold text-slate-700 leading-relaxed italic">"{record.symptoms || 'None reported'}"</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="No consultation history found." />}
            </div>
          )}
        </div>
      </div>

      {/* Report Viewer Overlay */}
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
const TabBtn = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`px-3 md:px-5 py-2 rounded-lg text-[14px] md:text-[14px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 shrink-0 snap-start ${active ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
  >
    {icon} {label}
  </button>
);

const VitalCard = ({ icon, label, val, unit, color }) => {
  const colors = {
    teal: "bg-teal-50 text-teal-600 border-teal-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };
  
  return (
    <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl border ${colors[color]} shadow-sm transition-all hover:scale-[1.03] duration-300`}>
      <div className="flex items-center gap-1.5 mb-1.5 md:mb-2">
        <div className={`p-1.5 rounded-md md:rounded-lg bg-white/50 shadow-sm`}>{icon}</div>
        <span className="text-[14px] md:text-[14px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg md:text-2xl font-black tracking-tighter">{val}</span>
        <span className="text-[14px] md:text-[14px] font-bold opacity-60 uppercase">{unit}</span>
      </div>
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-100 rounded-2xl shadow-sm">
    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
      <Database size={28} className="text-slate-200" />
    </div>
    <p className="text-sm font-black text-slate-900 tracking-tight mb-1">{message}</p>
    <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">No active records in this section</p>
  </div>
);

export default HealthLocker;