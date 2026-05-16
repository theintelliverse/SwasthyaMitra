import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ClipboardList, 
  Search, 
  Download, 
  Eye, 
  User, 
  FlaskConical,
  Activity,
  ChevronRight,
  Filter,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import Swal from 'sweetalert2';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch lab reports for doctor's patients
      const res = await axios.get(`${API_URL}/api/staff/all-reports`, {
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

  const filteredReports = (reports || []).filter(r => {
    if (!r) return false;
    const name = r.patientName || 'Unknown';
    const test = r.requiredTest || 'Test';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           test.toLowerCase().includes(searchTerm.toLowerCase())
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex-col md:flex-row">
      <Sidebar role="doctor" />
      <div className="flex-grow flex flex-col min-h-screen">
        <main className="px-4 md:px-8 py-8 flex-grow max-w-7xl mx-auto w-full space-y-8">
          
          {/* Clinical Vault Search Section */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Search size={160} />
             </div>
             <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2.5 bg-teal-500 rounded-xl">
                      <Search size={24} className="text-white" />
                   </div>
                   <h2 className="text-2xl font-black tracking-tight">Clinical Vault Search</h2>
                </div>
                <p className="text-slate-300 font-medium text-lg leading-relaxed mb-8">
                   Retrieve encrypted patient history, vitals trends, and diagnostic files using a verified mobile number.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                   <div className="relative flex-grow">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="tel" 
                        placeholder="Enter Patient Mobile Number..."
                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white/20 focus:border-teal-400 text-white font-bold placeholder:text-slate-500 transition-all"
                      />
                   </div>
                   <button onClick={() => navigate('/doctor/locker-search')} className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-teal-500/20 active:scale-95 whitespace-nowrap">
                      Verify & Access
                   </button>
                </div>
             </div>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Diagnostic Results</h1>
              <p className="text-slate-500 flex items-center gap-2 font-medium">
                <FlaskConical size={16} className="text-teal-500" />
                Monitor and review laboratory test results for your patients
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Patient or test name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-teal-500 text-sm w-full md:w-64 shadow-sm transition-all"
                />
              </div>
              <button 
                onClick={fetchReports}
                className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
             {loading ? (
                <div className="p-20 text-center">
                  <div className="w-12 h-12 border-4 border-slate-100 border-t-teal-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-500 font-bold">Scanning laboratory results...</p>
                </div>
             ) : filteredReports.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <ClipboardList size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Reports Available</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">Completed diagnostic reports from the lab will appear here automatically.</p>
                </div>
             ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Information</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredReports.map((r) => (
                        <tr key={r._id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                                {(r.patientName || 'UP').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">{r.patientName || 'Unknown Patient'}</p>
                                <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-0.5">{r.patientPhone || 'No Phone'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                  <Activity size={14} />
                               </div>
                               <div>
                                  <p className="text-xs font-black text-slate-700 uppercase tracking-wide">{r.requiredTest}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Laboratory Diagnostic</p>
                               </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                               <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Published</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button 
                                onClick={() => navigate(`/doctor/records?phone=${r.patientPhone}`)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 uppercase tracking-widest hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all shadow-sm active:scale-95"
                             >
                                <FileCheck size={14} />
                                View Report
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
    </div>
  );
};

export default Reports;
