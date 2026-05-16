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
      // Use ?filter=all to get historical data for this page
      const res = await axios.get(`${API_URL}/api/lab/dashboard/stats?filter=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        // We filter for items that actually had a sample action or are in lab stages
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
    <div className="flex min-h-screen bg-gray-50 font-body text-gray-900 flex-col md:flex-row">
      <Sidebar role="lab" />
      <div className="flex-grow flex flex-col min-h-screen">
        <main className="px-4 md:px-8 py-6 flex-grow max-w-7xl mx-auto w-full space-y-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Recent Samples (All Time)</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <TestTubes size={16} className="text-teal-500" />
                Track and manage all collected specimens
              </p>
            </div>
            <div className="flex gap-3">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input
                   type="text"
                   placeholder="Search samples..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-teal-500 text-sm w-64 shadow-sm"
                 />
               </div>
               <button onClick={fetchSamples} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                 Refresh
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse h-40"></div>
              ))
            ) : filteredSamples.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
                <Beaker size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No samples found</h3>
                <p className="text-gray-500">History of collected samples will appear here.</p>
              </div>
            ) : (
              filteredSamples.map((sample) => (
                <div key={sample._id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    sample.currentStage === 'Lab-Completed' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{sample.patientName}</h3>
                      <p className="text-xs text-gray-500">{sample.patientPhone}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      sample.currentStage === 'Lab-Completed' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                      {sample.currentStage}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Beaker size={14} className="text-teal-500" />
                      <span>{sample.requiredTest || 'General Diagnostic'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Clock size={14} className="text-gray-400" />
                      <span>Collected: {new Date(sample.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-400">ID: #{sample.tokenNumber || sample._id.substring(18)}</span>
                    <button className="text-teal-600 text-xs font-bold hover:underline">Details</button>
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
