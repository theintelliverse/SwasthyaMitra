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
  ShieldCheck,
  User,
  FileText,
  Phone,
  ArrowRight,
  X,
  AlertCircle
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import PatientQuickView from '../../components/PatientQuickView';
import Swal from 'sweetalert2';

import { API_URL } from '../../config/runtime';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Locker Search State (embedded from LockerSearch page)
  const [lockerPhone, setLockerPhone] = useState('');
  const [lockerLoading, setLockerLoading] = useState(false);
  const [lockerError, setLockerError] = useState('');
  const [activePatient, setActivePatient] = useState(null);

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/lab/reports/recent?limit=50&filter=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLockerSearch = async (e) => {
    e.preventDefault();
    setLockerError('');
    setLockerLoading(true);
    try {
      const cleanPhone = lockerPhone.replace(/\D/g, '').slice(-10);
      const res = await axios.get(`${API_URL}/api/staff/patient-full-profile/${cleanPhone}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setActivePatient(cleanPhone);
      }
    } catch (err) {
      setLockerError(err.response?.data?.message || 'Locker not found. Ensure the patient has checked in at least once.');
    } finally {
      setLockerLoading(false);
    }
  };

  const filteredReports = (reports || []).filter(r => {
    if (!r) return false;
    const name = r.patientName || 'Unknown';
    const test = r.requiredTest || 'Test';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex-col md:flex-row">
      <Sidebar role="doctor" />
      <div className="flex-grow flex flex-col min-h-screen">
        <main className="px-4 md:px-8 py-8 flex-grow max-w-7xl mx-auto w-full space-y-8">

          {/* ══════════════════════════════════════════════
              CLINICAL VAULT SEARCH — Embedded from /doctor/locker-search
          ══════════════════════════════════════════════ */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-900/20">

            {/* Background decoration */}
            <div className="absolute inset-0 opacity-5">
              <ShieldCheck size={400} className="absolute -bottom-20 -right-20 rotate-12" />
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full blur-3xl opacity-10" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400 rounded-full blur-3xl opacity-10" />

            <div className="relative z-10 p-8 md:p-10">

              {/* Header */}
              <div className="flex items-center gap-4 mb-7">
                <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0">
                  <ShieldCheck size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Clinical Vault Search</h2>
                  <p className="text-slate-400 text-sm font-medium mt-0.5">
                    Retrieve encrypted patient history, vitals & diagnostic files
                  </p>
                </div>
              </div>

              {/* Search Form */}
              <form onSubmit={handleLockerSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="tel"
                    placeholder="Enter patient mobile number (e.g. 9876543210)"
                    value={lockerPhone}
                    onChange={(e) => setLockerPhone(e.target.value)}
                    required
                    className="w-full pl-12 pr-5 py-4 bg-white/10 border border-white/15 rounded-2xl outline-none focus:bg-white/20 focus:border-teal-400 text-white font-bold placeholder:text-slate-500 transition-all text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={lockerLoading}
                  className="flex items-center justify-center gap-2.5 px-8 py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest transition-all shadow-lg shadow-teal-500/20 active:scale-95 whitespace-nowrap"
                >
                  {lockerLoading
                    ? <RefreshCw size={16} className="animate-spin" />
                    : <><Search size={16} /> Verify &amp; Access</>
                  }
                </button>
              </form>

              {/* Error */}
              {lockerError && (
                <div className="mt-4 flex items-start gap-3 p-4 bg-red-500/10 border border-red-400/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-red-300 text-[14px] font-bold leading-relaxed">{lockerError}</p>
                  <button onClick={() => setLockerError('')} className="ml-auto text-red-400/60 hover:text-red-300">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Feature Tags */}
              <div className="mt-7 flex flex-wrap gap-3">
                {[
                  { icon: <User size={13} />, label: 'Historical Vitals' },
                  { icon: <FileText size={13} />, label: 'Digital Reports' },
                  { icon: <ShieldCheck size={13} />, label: 'Secure Encrypted Access' },
                  { icon: <Activity size={13} />, label: 'Consultation History' },
                ].map((tag) => (
                  <div key={tag.label} className="flex items-center gap-2 px-3.5 py-2 bg-white/8 border border-white/10 rounded-xl">
                    <span className="text-teal-400">{tag.icon}</span>
                    <span className="text-[14px] font-black text-slate-300 uppercase tracking-widest">{tag.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              DIAGNOSTIC RESULTS TABLE
          ══════════════════════════════════════════════ */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Diagnostic Results</h1>
              <p className="text-slate-500 flex items-center gap-2 font-medium text-sm">
                <FlaskConical size={15} className="text-teal-500" />
                Monitor and review laboratory test results for your patients
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Patient or test name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-teal-500 text-sm w-full md:w-60 shadow-sm transition-all"
                />
              </div>
              <button
                onClick={fetchReports}
                className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-20 text-center">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400 font-bold text-sm">Scanning laboratory results...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <ClipboardList size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Reports Available</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm">Completed diagnostic reports from the lab will appear here automatically.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/60 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[14px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                      <th className="px-6 py-4 text-[14px] font-black text-slate-400 uppercase tracking-widest">Test Information</th>
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
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                            <span className="text-[14px] font-black text-green-600 uppercase tracking-widest">Published</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => navigate(`/doctor/records?phone=${r.patientPhone}`)}
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

      {/* Patient Quick View Modal */}
      {activePatient && (
        <PatientQuickView
          phone={activePatient}
          onClose={() => setActivePatient(null)}
        />
      )}
    </div>
  );
};

export default Reports;
