import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Filter, Clock, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const TestRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Use ?filter=all to get historical data for this page
      const res = await axios.get(`${API_URL}/api/lab/dashboard/stats?filter=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setRequests(res.data.data.queueData);
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch test requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => 
    req.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.patientPhone.includes(searchTerm)
  );

  return (
    <div className="flex min-h-screen bg-gray-50 font-body text-gray-900 flex-col md:flex-row">
      <Sidebar role="lab" />
      <div className="flex-grow flex flex-col min-h-screen">
        <main className="px-4 md:px-8 py-6 flex-grow max-w-7xl mx-auto w-full space-y-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Test Requests (All Time)</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <ClipboardList size={16} className="text-teal-500" />
                Comprehensive history of all diagnostic requests
              </p>
            </div>
            <div className="flex gap-3">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input
                   type="text"
                   placeholder="Search requests..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-teal-500 text-sm w-64 shadow-sm"
                 />
               </div>
               <button onClick={fetchRequests} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                 Refresh
               </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin"></div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No requests found</h3>
                <p className="text-gray-500">Try adjusting your search or check back later.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Required Test</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{req.patientName}</div>
                          <div className="text-xs text-gray-500">{req.patientPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {req.requiredTest || 'General Diagnostic'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-2 text-xs font-bold ${
                            req.currentStage === 'Lab-Completed' ? 'text-green-600' : 
                            req.currentStage === 'Lab-Pending' ? 'text-blue-600' : 'text-amber-600'
                          }`}>
                            {req.currentStage === 'Lab-Completed' ? <CheckCircle size={14} /> : 
                             req.currentStage === 'Lab-Pending' ? <Clock size={14} /> : <AlertCircle size={14} />}
                            {req.currentStage}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all">
                            <Eye size={18} />
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

export default TestRequests;

