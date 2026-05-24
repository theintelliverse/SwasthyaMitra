import React, { useState, useEffect } from 'react';
import { TestTubes, Search, Filter, Beaker, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const Samples = () => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/lab/dashboard/stats?filter=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const labSamples = res.data.data.queueData.filter(item => 
          ['Lab-Pending', 'Lab-Completed'].includes(item.currentStage)
        );
        setSamples(labSamples);
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch samples', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredSamples = samples.filter(s => 
    s.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.patientPhone.includes(searchTerm)
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex-col md:flex-row">
      <Sidebar role="lab" />
      <div className="flex-grow flex flex-col min-h-screen">
        <main className="px-4 md:px-6 lg:px-8 py-6 flex-grow max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 mb-1 tracking-tight">Recent Samples (All Time)</h1>
              <p className="text-slate-500 flex items-center gap-2 text-[14px] md:text-[14px] font-bold">
                <TestTubes size={14} className="text-teal-500" />
                Track and manage all collected specimens
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
               <div className="relative flex-grow sm:flex-grow-0">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input
                   type="text"
                   placeholder="Search samples..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-teal-500 text-[14px] font-bold w-full sm:w-56 shadow-sm transition-all"
                 />
               </div>
               <button onClick={fetchSamples} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[14px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-colors shrink-0">
                 Refresh
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm animate-pulse h-32"></div>
              ))
            ) : filteredSamples.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white rounded-xl border border-slate-100 shadow-sm">
                <Beaker size={32} className="mx-auto text-slate-300 mb-3" />
                <h3 className="text-sm font-black text-slate-900">No samples found</h3>
                <p className="text-[14px] font-bold text-slate-500 mt-1">History of collected samples will appear here.</p>
              </div>
            ) : (
              filteredSamples.map((sample) => (
                <div key={sample._id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow transition-all relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    sample.currentStage === 'Lab-Completed' ? 'bg-emerald-500' : 'bg-teal-500'
                  }`}></div>
                  
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 pr-2">
                      <h3 className="font-black text-[14px] text-slate-900 truncate">{sample.patientName}</h3>
                      <p className="text-[14px] font-bold text-slate-400 mt-0.5">{sample.patientPhone}</p>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[14px] font-black uppercase tracking-widest shrink-0 ${
                      sample.currentStage === 'Lab-Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-teal-50 text-teal-600 border border-teal-100'
                    }`}>
                      {sample.currentStage === 'Lab-Completed' ? 'Completed' : 'Pending'}
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-[14px] font-bold text-slate-600">
                      <Beaker size={12} className="text-teal-500" />
                      <span className="truncate">{sample.requiredTest || 'General Diagnostic'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[14px] font-bold text-slate-500">
                      <Clock size={12} className="text-slate-400" />
                      <span>Collected: {new Date(sample.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[14px] font-black uppercase tracking-widest text-slate-400">ID: #{sample.tokenNumber || sample._id.substring(18)}</span>
                    <button className="text-teal-600 text-[14px] font-black hover:text-teal-700 transition-colors">Details</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Samples;
