import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  FileText,
  Activity,
  History,
  ExternalLink,
  Database,
  Calendar,
  Weight
} from 'lucide-react';
const API_URL = import.meta.env.VITE_API_URL;
const PatientQuickView = ({ phone, onClose }) => {
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
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
    <div className="fixed inset-0 bg-[#422D0B]/40 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-4">
        <Database className="animate-bounce text-[#FFA800]" size={40} />
        <p className="font-heading text-xl text-[#422D0B]">Decrypting Locker...</p>
      </div>
    </div>
  );

  if (!patientData) return null;

  return (
    <div className="fixed inset-0 bg-[#422D0B]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-10">
      <div className="bg-[#FFFBF5] w-full max-w-5xl max-h-[90vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border border-[#E8DDCB]">

        {/* --- Header --- */}
        <div className="p-8 md:px-12 border-b border-[#E8DDCB] flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FFA800] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-marigold/20">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-heading text-[#422D0B]">{patientData.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#967A53]">Digital Health Locker • {phone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all text-[#967A53]"
          >
            <X size={28} />
          </button>
        </div>

        <div className="flex-grow p-8 md:p-12 overflow-y-auto space-y-12">

          {/* --- Vitals Summary Row --- */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard label="Latest BP" val={patientData.vitals[0]?.bloodPressure || '--'} unit="mmHg" icon={<Activity size={14} />} />
            <SummaryCard label="Pulse" val={patientData.vitals[0]?.pulseRate || '--'} unit="bpm" icon={<Activity size={14} />} />
            <SummaryCard label="Weight" val={patientData.vitals[0]?.weight || '--'} unit="kg" icon={<Weight size={14} />} />
            <SummaryCard label="BMI" val={patientData.vitals[0]?.bmi || '--'} unit="Score" icon={<Activity size={14} />} color="text-[#FFA800]" />
          </div>

          {/* --- Reports Section --- */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <FileText className="text-[#FFA800]" size={20} />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#967A53]">Clinical Reports & Imaging</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {patientData.documents.map((doc, i) => (
                <a key={i} href={doc.fileUrl} target="_blank" rel="noreferrer"
                  className="bg-white p-6 rounded-[2rem] border border-[#E8DDCB] hover:border-[#FFA800] hover:shadow-xl transition-all group flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#FFFBF5] rounded-xl flex items-center justify-center text-[#FFA800] border border-[#E8DDCB]">
                      <FileText size={18} />
                    </div>
                    <div className="max-w-[140px]">
                      <p className="text-sm font-bold text-[#422D0B] truncate">{doc.title}</p>
                      <p className="text-[8px] font-black text-[#967A53] uppercase">{doc.fileType}</p>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-[#E8DDCB] group-hover:text-[#FFA800]" />
                </a>
              ))}
              {patientData.documents.length === 0 && (
                <div className="col-span-full py-10 bg-white/50 border-2 border-dashed border-[#E8DDCB] rounded-[2rem] text-center italic text-[#967A53] text-sm">
                  No medical documents found in this locker.
                </div>
              )}
            </div>
          </section>

          {/* --- Detailed Vitals Table --- */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-[#FFA800]" size={20} />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#967A53]">Vitals History Logs</h3>
            </div>
            <div className="bg-white border border-[#E8DDCB] rounded-[2.5rem] overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-[#FFFBF5] border-b border-[#E8DDCB]">
                  <tr className="text-[9px] font-black uppercase tracking-widest text-[#967A53]">
                    <th className="p-6">Captured Date</th>
                    <th className="p-6">BP (Syst/Diast)</th>
                    <th className="p-6">Pulse</th>
                    <th className="p-6">Weight & BMI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDCB]/50">
                  {patientData.vitals.map((v, i) => (
                    <tr key={i} className="hover:bg-[#FFFBF5]/50 transition-colors">
                      <td className="p-6 text-sm font-bold text-[#422D0B]">{new Date(v.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="p-6 text-sm text-[#422D0B]">{v.bloodPressure} <span className="text-[10px] text-[#967A53]">mmHg</span></td>
                      <td className="p-6 text-sm text-[#422D0B]">{v.pulseRate} <span className="text-[10px] text-[#967A53]">bpm</span></td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-[#422D0B]">{v.weight} kg</span>
                          <span className="px-2 py-0.5 bg-[#FFA800]/10 text-[#FFA800] text-[10px] font-black rounded-lg">BMI: {v.bmi}</span>
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
        <div className="p-6 bg-[#422D0B] text-[#FFFBF5]/60 text-[10px] font-medium text-center uppercase tracking-widest">
          Authorized Clinical Access Only • All interactions are logged
        </div>
      </div>
    </div>
  );
};

// Internal Helper Component
const SummaryCard = ({ label, val, unit, icon, color = "text-[#422D0B]" }) => (
  <div className="bg-white p-5 rounded-3xl border border-[#E8DDCB] shadow-sm">
    <div className="flex items-center gap-2 mb-2">
      <div className="text-[#FFA800] opacity-50">{icon}</div>
      <p className="text-[8px] font-black uppercase tracking-widest text-[#967A53]">{label}</p>
    </div>
    <p className={`text-xl font-heading ${color}`}>{val} <span className="text-[9px] font-bold text-[#967A53]">{unit}</span></p>
  </div>
);

export default PatientQuickView;