import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ClipboardList,
  Search,
  FlaskConical,
  Activity,
  RefreshCw,
  FileCheck,
  Calendar,
  ArrowLeft,
  Filter
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import PatientQuickView from '../../components/PatientQuickView';
import { API_URL } from '../../config/runtime';

const AllReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activePatient, setActivePatient] = useState(null);

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/lab/reports/recent?limit=200&filter=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error('Fetch all reports error:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = (reports || []).filter(r => {
    if (!r) return false;
    const name = (r.patientName || 'Unknown').toLowerCase();
    const test = (r.requiredTest || 'Test').toLowerCase();
    const rawPhone = (r.patientPhone || '').toLowerCase();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const rawTerm = searchTerm.toLowerCase();
    const cleanTerm = rawTerm.replace(/\D/g, '');

    return name.includes(rawTerm) ||
      test.includes(rawTerm) ||
      rawPhone.includes(rawTerm) ||
      (cleanTerm.length > 0 && cleanPhone.includes(cleanTerm));
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex-col md:flex-row">
      <Sidebar role="doctor" />
      <div className="flex-grow flex flex-col min-h-screen">
        <main className="px-4 md:px-8 py-8 flex-grow max-w-7xl mx-auto w-full space-y-8">

          {/* ══════════════════════════════════════════════
              HEADER & NAV BACK
          ══════════════════════════════════════════════ */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/doctor/reports')}
                className="w-11 h-11 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 shrink-0"
                title="Back to Reports Dashboard"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">
                  All Diagnostic Reports Archive
                </h1>
                <p className="text-slate-500 flex items-center gap-2 font-medium text-sm">
                  <FlaskConical size={16} className="text-teal-500" />
                  Historical log of all completed patient lab results
                </p>
              </div>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search name, phone, or test..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-teal-500 text-sm w-full md:w-72 shadow-sm transition-all font-medium"
                />
              </div>
              <button
                onClick={fetchAllReports}
                className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                title="Refresh List"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-bold">
                <ClipboardList size={22} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Reports</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{reports.length}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                <Filter size={22} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Filtered Results</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{filteredReports.length}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                <FileCheck size={22} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Status</p>
                <p className="text-sm font-black text-emerald-600 uppercase tracking-wider mt-1">100% Published</p>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              FULL REPORTS TABLE
          ══════════════════════════════════════════════ */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-20 text-center">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400 font-bold text-sm">Loading historical diagnostic reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <ClipboardList size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Reports Found</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm">
                  {searchTerm ? "No reports match your search criteria." : "Completed diagnostic reports will appear here."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/60 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[14px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                      <th className="px-6 py-4 text-[14px] font-black text-slate-400 uppercase tracking-widest">Test Information</th>
                      <th className="px-6 py-4 text-[14px] font-black text-slate-400 uppercase tracking-widest">Completion Date</th>
                      <th className="px-6 py-4 text-[14px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[14px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredReports.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[14px] group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                              {(r.patientName || 'UP').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{r.patientName || 'Unknown Patient'}</p>
                              <p className="text-[14px] font-bold text-slate-400 tracking-wider mt-0.5">{r.patientPhone || 'No Phone'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                              <Activity size={13} />
                            </div>
                            <div>
                              <p className="text-[14px] font-black text-slate-700 uppercase tracking-wide">{r.requiredTest}</p>
                              <p className="text-[14px] font-bold text-slate-400 uppercase mt-0.5">Laboratory Diagnostic</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                            <Calendar size={14} className="text-slate-400" />
                            {new Date(r.updatedAt || r.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                            <span className="text-[14px] font-black text-green-600 uppercase tracking-widest">Published</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => {
                              if (r.patientPhone) {
                                const clean = r.patientPhone.replace(/\D/g, '').slice(-10);
                                setActivePatient(clean);
                              } else {
                                navigate(`/doctor/records`);
                              }
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[14px] font-black text-slate-700 uppercase tracking-widest hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all shadow-sm active:scale-95"
                          >
                            <FileCheck size={13} /> View Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Patient Quick View Digital Locker Modal */}
      {activePatient && (
        <PatientQuickView
          phone={activePatient}
          onClose={() => setActivePatient(null)}
        />
      )}
    </div>
  );
};

export default AllReports;
