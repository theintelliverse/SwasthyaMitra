import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  FileText,
  Activity,
  History,
  Download,
  ExternalLink,
  Database,
  Calendar,
  Weight
} from 'lucide-react';
import { API_BASE_URL } from '../config/runtime';

const API_URL = API_BASE_URL;
const PatientQuickView = ({ phone, onClose }) => {
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  const vitals = Array.isArray(patientData?.vitals) ? patientData.vitals : [];
  const latestVitals = vitals.length > 0 ? vitals[vitals.length - 1] : null;
  const documentsSource = Array.isArray(patientData?.documents)
    ? patientData.documents
    : (Array.isArray(patientData?.digitalLocker) ? patientData.digitalLocker : []);

  const documents = documentsSource
    .filter((doc) => (doc?.fileUrl || doc?.url || doc?.secure_url || doc?.filePath));

  const getDocumentUrl = (doc) => doc?.fileUrl || doc?.url || doc?.secure_url || doc?.filePath || '';

  const getDocumentFileName = (doc) => {
    const safeTitle = (doc?.title || 'Clinical_Report').replace(/[^a-z0-9-_]/gi, '_');
    const type = (doc?.fileType || '').toLowerCase();
    if (type.includes('pdf')) return `${safeTitle}.pdf`;
    if (type.includes('image')) return `${safeTitle}.jpg`;

    const url = getDocumentUrl(doc);
    const lastSegment = url.split('?')[0].split('/').pop() || '';
    if (lastSegment.includes('.')) return lastSegment;

    return `${safeTitle}.pdf`;
  };

  const openDocument = (doc) => {
    const url = getDocumentUrl(doc);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadDocument = async (doc) => {
    const fileUrl = getDocumentUrl(doc);
    if (!fileUrl) return;

    try {
      const response = await fetch(fileUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = getDocumentFileName(doc);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      openDocument(doc);
    }
  };

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
    <div className="fixed inset-0 bg-[#0F766E]/40 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-4">
        <Database className="animate-bounce text-[#1F6FB2]" size={40} />
        <p className="font-heading text-xl text-[#0F766E]">Decrypting Locker...</p>
      </div>
    </div>
  );

  if (!patientData) return null;

  return (
    <div className="fixed inset-0 bg-[#0F766E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-10">
      <div className="bg-[#EEF6FA] w-full max-w-5xl max-h-[90vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border border-[#AFC4D8]">

        {/* --- Header --- */}
        <div className="p-8 md:px-12 border-b border-[#AFC4D8] flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1F6FB2] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-marigold/20">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-heading text-[#0F766E]">{patientData.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#3FA28C]">Digital Health Locker • {phone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all text-[#3FA28C]"
          >
            <X size={28} />
          </button>
        </div>

        <div className="flex-grow p-8 md:p-12 overflow-y-auto space-y-12">

          {/* --- Vitals Summary Row --- */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard label="Latest BP" val={latestVitals?.bloodPressure || '--'} unit="mmHg" icon={<Activity size={14} />} />
            <SummaryCard label="Pulse" val={latestVitals?.pulseRate || '--'} unit="bpm" icon={<Activity size={14} />} />
            <SummaryCard label="Weight" val={latestVitals?.weight || '--'} unit="kg" icon={<Weight size={14} />} />
            <SummaryCard label="BMI" val={latestVitals?.bmi || '--'} unit="Score" icon={<Activity size={14} />} color="text-[#1F6FB2]" />
          </div>

          {/* --- Reports Section --- */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <FileText className="text-[#1F6FB2]" size={20} />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3FA28C]">Clinical Reports & Imaging</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc, i) => {
                return (
                  <div key={i}
                    className="bg-white p-6 rounded-[2rem] border border-[#AFC4D8] hover:border-[#1F6FB2] hover:shadow-xl transition-all group flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#EEF6FA] rounded-xl flex items-center justify-center text-[#1F6FB2] border border-[#AFC4D8]">
                        <FileText size={18} />
                      </div>
                      <div className="max-w-[140px]">
                        <p className="text-sm font-bold text-[#0F766E] truncate">{doc.title || 'Clinical Document'}</p>
                        <p className="text-[8px] font-black text-[#3FA28C] uppercase">{doc.fileType || 'Report'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openDocument(doc)}
                        className="p-2.5 bg-[#EEF6FA] hover:bg-[#1F6FB2] hover:text-white rounded-xl text-[#1F6FB2] transition-all"
                        aria-label="Open document"
                      >
                        <ExternalLink size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadDocument(doc)}
                        className="p-2.5 bg-[#0F766E] hover:bg-[#1F6FB2] text-white rounded-xl transition-all"
                        aria-label="Download document"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
              {documents.length === 0 && (
                <div className="col-span-full py-10 bg-white/50 border-2 border-dashed border-[#AFC4D8] rounded-[2rem] text-center italic text-[#3FA28C] text-sm">
                  No medical documents found in this locker.
                </div>
              )}
            </div>
          </section>

          {/* --- Detailed Vitals Table --- */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-[#1F6FB2]" size={20} />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3FA28C]">Vitals History Logs</h3>
            </div>
            <div className="bg-white border border-[#AFC4D8] rounded-[2.5rem] overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-[#EEF6FA] border-b border-[#AFC4D8]">
                  <tr className="text-[9px] font-black uppercase tracking-widest text-[#3FA28C]">
                    <th className="p-6">Captured Date</th>
                    <th className="p-6">BP (Syst/Diast)</th>
                    <th className="p-6">Pulse</th>
                    <th className="p-6">Weight & BMI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#AFC4D8]/50">
                  {vitals.map((v, i) => (
                    <tr key={i} className="hover:bg-[#EEF6FA]/50 transition-colors">
                      <td className="p-6 text-sm font-bold text-[#0F766E]">{new Date(v.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="p-6 text-sm text-[#0F766E]">{v.bloodPressure} <span className="text-[10px] text-[#3FA28C]">mmHg</span></td>
                      <td className="p-6 text-sm text-[#0F766E]">{v.pulseRate} <span className="text-[10px] text-[#3FA28C]">bpm</span></td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-[#0F766E]">{v.weight} kg</span>
                          <span className="px-2 py-0.5 bg-[#1F6FB2]/10 text-[#1F6FB2] text-[10px] font-black rounded-lg">BMI: {v.bmi}</span>
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
        <div className="p-6 bg-[#0F766E] text-[#EEF6FA]/60 text-[10px] font-medium text-center uppercase tracking-widest">
          Authorized Clinical Access Only • All interactions are logged
        </div>
      </div>
    </div>
  );
};

// Internal Helper Component
const SummaryCard = ({ label, val, unit, icon, color = "text-[#0F766E]" }) => (
  <div className="bg-white p-5 rounded-3xl border border-[#AFC4D8] shadow-sm">
    <div className="flex items-center gap-2 mb-2">
      <div className="text-[#1F6FB2] opacity-50">{icon}</div>
      <p className="text-[8px] font-black uppercase tracking-widest text-[#3FA28C]">{label}</p>
    </div>
    <p className={`text-xl font-heading ${color}`}>{val} <span className="text-[9px] font-bold text-[#3FA28C]">{unit}</span></p>
  </div>
);

export default PatientQuickView;