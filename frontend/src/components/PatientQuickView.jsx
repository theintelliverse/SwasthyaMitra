import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  FileText,
  Activity,
  History,
  Eye,
  Database,
  Calendar,
  Weight
} from 'lucide-react';
import ReportViewer from './ReportViewer';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const PatientQuickView = ({ phone, onClose }) => {
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReportIndex, setSelectedReportIndex] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/staff/patient-full-profile/${phone}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatientData(res.data.data);
      } catch (err) {
        console.error("Locker fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (phone) fetchFullProfile();
  }, [phone, token]);

  if (loading) return (
    <div className="fixed inset-0 bg-teak/40 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-4">
        <Database className="animate-bounce text-marigold" size={40} />
        <p className="font-heading text-xl text-teak">Decrypting Locker...</p>
      </div>
    </div>
  );

  if (!patientData) return null;

  // 🔑 Find the latest vital record with complete weight/BMI data
  const latestCompleteVital = patientData.vitals?.find(v => v.weight && v.bmi) || patientData.vitals?.[0] || {};

  return (
    <>
      <div className="fixed inset-0 bg-teak/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-10">
        <div className="bg-parchment w-full max-w-5xl max-h-[90vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border border-sandstone">

          {/* --- Header --- */}
          <div className="p-8 md:px-12 border-b border-sandstone flex justify-between items-center bg-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-marigold rounded-2xl flex items-center justify-center text-white shadow-lg shadow-marigold/20">
                <History size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-heading text-teak">{patientData.name}</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-khaki">Digital Health Locker • {phone}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all text-khaki"
            >
              <X size={28} />
            </button>
          </div>

          <div className="flex-grow p-8 md:p-12 overflow-y-auto space-y-12">

            {/* --- Vitals Summary Row --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard label="Latest BP" val={patientData.vitals[0]?.bloodPressure || '--'} unit="mmHg" icon={<Activity size={14} />} />
              <SummaryCard label="Pulse" val={patientData.vitals[0]?.pulseRate || '--'} unit="bpm" icon={<Activity size={14} />} />
              <SummaryCard label="Weight" val={latestCompleteVital?.weight || '--'} unit="kg" icon={<Weight size={14} />} />
              <SummaryCard label="BMI" val={latestCompleteVital?.bmi || '--'} unit="Score" icon={<Activity size={14} />} color="text-marigold" />
            </div>

            {/* --- Reports Section --- */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <FileText className="text-marigold" size={20} />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-khaki">Clinical Reports & Imaging</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {patientData.documents && patientData.documents.length > 0 ? (
                  patientData.documents.map((doc, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedReportIndex(i)}
                      className="bg-white p-6 rounded-[2rem] border border-sandstone hover:border-marigold hover:shadow-xl transition-all group flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-parchment rounded-xl flex items-center justify-center text-marigold border border-sandstone group-hover:scale-110 transition-transform flex-shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="max-w-[140px]">
                          <p className="text-sm font-bold text-teak truncate">{doc.title}</p>
                          <p className="text-[8px] font-black text-khaki uppercase">{doc.fileType}</p>
                        </div>
                      </div>
                      <Eye size={16} className="text-marigold group-hover:scale-125 transition-transform flex-shrink-0" />
                    </button>
                  ))
                ) : (
                  <div className="col-span-full py-10 bg-white/50 border-2 border-dashed border-sandstone rounded-[2rem] text-center italic text-khaki text-sm">
                    No medical documents found in this locker.
                  </div>
                )}
              </div>
            </section>

            {/* --- Detailed Vitals Table --- */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="text-marigold" size={20} />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-khaki">Vitals History Logs</h3>
              </div>
              <div className="bg-white border border-sandstone rounded-[2.5rem] overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-parchment border-b border-sandstone">
                    <tr className="text-[9px] font-black uppercase tracking-widest text-khaki">
                      <th className="p-6">Captured Date</th>
                      <th className="p-6">BP (Syst/Diast)</th>
                      <th className="p-6">Pulse</th>
                      <th className="p-6">Weight & BMI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#AFC4D8]/50">
                    {patientData.vitals.map((v, i) => (
                      <tr key={i} className="hover:bg-parchment/50 transition-colors">
                        <td className="p-6 text-sm font-bold text-teak">{new Date(v.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="p-6 text-sm text-teak">{v.bloodPressure} <span className="text-[10px] text-khaki">mmHg</span></td>
                        <td className="p-6 text-sm text-teak">{v.pulseRate} <span className="text-[10px] text-khaki">bpm</span></td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-teak">{v.weight} kg</span>
                            <span className="px-2 py-0.5 bg-marigold/10 text-marigold text-[10px] font-black rounded-lg">BMI: {v.bmi}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* --- Footer Note --- */}
          <div className="p-6 bg-teak text-parchment/60 text-[10px] font-medium text-center uppercase tracking-widest">
            Authorized Clinical Access Only • All interactions are logged
          </div>
        </div>
      </div>

      {/* 🔑 Report Viewer Modal */}
      {selectedReportIndex !== null && (
        <ReportViewer
          documents={patientData.documents}
          initialIndex={selectedReportIndex}
          onClose={() => setSelectedReportIndex(null)}
        />
      )}
    </>
  );
};

// Internal Helper Component
const SummaryCard = ({ label, val, unit, icon, color = "text-teak" }) => (
  <div className="bg-white p-5 rounded-3xl border border-sandstone shadow-sm">
    <div className="flex items-center gap-2 mb-2">
      <div className="text-marigold opacity-50">{icon}</div>
      <p className="text-[8px] font-black uppercase tracking-widest text-khaki">{label}</p>
    </div>
    <p className={`text-xl font-heading ${color}`}>{val} <span className="text-[9px] font-bold text-khaki">{unit}</span></p>
  </div>
);

export default PatientQuickView;