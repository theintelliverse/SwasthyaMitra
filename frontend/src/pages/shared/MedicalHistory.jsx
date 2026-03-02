import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import PatientQuickView from '../../components/PatientQuickView';
import { Search, FileText, Calendar, Phone } from 'lucide-react';
const API_URL = import.meta.env.VITE_API_URL;
const MedicalHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientPhone, setSelectedPatientPhone] = useState(null);

  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const role = sessionStorage.getItem('role') || localStorage.getItem('role');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/queue/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecords(res.data.data);
        setLoading(false);
      } catch {
        console.error("History fetch failed");
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  const filteredRecords = records.filter(r =>
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.patientPhone.includes(searchTerm)
  );

  return (
    <div className="flex min-h-screen bg-parchment font-body text-teak">
      <Sidebar role={role} />

      <div className="flex-grow flex flex-col">
        {/* Header & Search Bar */}
        <nav className="bg-white border-b border-sandstone px-8 py-8 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="font-heading text-4xl mb-1 text-teak">Digital Archives</h1>
              <p className="text-khaki text-sm font-medium">
                {role === 'admin' ? "Full Clinic Audit Log" : "Your Consultation History"}
              </p>
            </div>

            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-khaki" size={18} />
              <input
                type="text"
                placeholder="Search name or mobile..."
                className="w-full pl-12 pr-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold transition-all font-medium"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </nav>

        <main className="flex-grow max-w-7xl w-full mx-auto p-6 lg:p-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-marigold border-t-transparent rounded-full animate-spin"></div>
              <p className="font-heading text-khaki">Decrypting Records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-sandstone shadow-inner">
              <div className="text-5xl mb-4 opacity-20">📜</div>
              <p className="font-heading text-2xl text-khaki">No consultations found</p>
              <p className="text-sm text-khaki/60 mt-2">Try searching with a different name or phone number.</p>
            </div>
          ) : (
            <div className="grid gap-8">
              {filteredRecords.map((record) => (
                <div key={record._id} className="bg-white border border-sandstone p-8 rounded-[3rem] shadow-sm hover:shadow-2xl hover:border-marigold/30 transition-all group overflow-hidden relative">

                  {/* Decorative corner icon */}
                  <div className="absolute -right-4 -top-4 text-8xl opacity-[0.03] group-hover:rotate-12 transition-transform">
                    <FileText size={120} />
                  </div>

                  <div className="flex flex-col lg:flex-row justify-between gap-8 relative z-10">
                    <div className="flex-grow">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white bg-teak px-4 py-1.5 rounded-full">
                          Token #{record.tokenNumber}
                        </span>
                        <div className="flex items-center gap-2 text-khaki">
                          <Calendar size={14} />
                          <span className="text-xs font-bold">
                            {new Date(record.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-3xl font-heading mb-2 text-teak group-hover:text-marigold transition-colors">{record.patientName}</h3>

                      <div className="flex items-center gap-6 mb-6">
                        <div className="flex items-center gap-2 text-khaki text-sm font-bold">
                          <Phone size={14} /> {record.patientPhone}
                        </div>
                        <div className="text-xs font-medium text-khaki/60">
                          Session: {record.duration || '--'} mins
                        </div>
                      </div>

                      <div className="bg-parchment p-6 rounded-3xl border border-sandstone/50 italic text-sm text-teak/80 relative">
                        <span className="text-3xl text-marigold/20 absolute top-2 left-2 font-serif">“</span>
                        <p className="pl-6">{record.notes || "No clinical notes provided for this session."}</p>
                      </div>

                      {/* Action Button: View Locker */}
                      <button
                        onClick={() => setSelectedPatientPhone(record.patientPhone)}
                        className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-marigold hover:text-teak transition-colors"
                      >
                        📂 Open Digital Health Locker →
                      </button>
                    </div>

                    {/* Doctor Info Sidebar on Card */}
                    <div className="lg:w-64 shrink-0 flex flex-col justify-center bg-parchment/50 p-6 rounded-[2rem] border border-sandstone/30">
                      <p className="text-[9px] font-black uppercase text-khaki tracking-widest mb-3">Physician In-Charge</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-marigold rounded-xl flex items-center justify-center text-white font-heading">
                          {record.doctorId?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-teak leading-tight">Dr. {record.doctorId?.name}</p>
                          <p className="text-[10px] text-khaki font-medium mt-0.5">{record.doctorId?.specialization}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>

      {/* Patient Locker Modal Integration */}
      {selectedPatientPhone && (
        <PatientQuickView
          phone={selectedPatientPhone}
          onClose={() => setSelectedPatientPhone(null)}
        />
      )}
    </div>
  );
};

export default MedicalHistory;