import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Plus, 
  User, 
  Calendar,
  Clock,
  Printer,
  Share2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import Swal from 'sweetalert2';

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')).replace(/\/$/, '');

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      // Fetch prescriptions for this doctor
      // For now, we'll fetch from the locker history or a dedicated endpoint if available
      const res = await axios.get(`${API_URL}/api/staff/all-prescriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPrescriptions(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = (prescriptions || []).filter(p => {
    if (!p) return false;
    const name = p.patientName || 'Unknown';
    const phone = p.patientPhone || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           phone.includes(searchTerm);
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex-col md:flex-row">
      <Sidebar role="doctor" />
      <div className="flex-grow flex flex-col min-h-screen">
        <main className="px-4 md:px-8 py-8 flex-grow max-w-7xl mx-auto w-full space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Prescription Records</h1>
              <p className="text-slate-500 flex items-center gap-2 font-medium">
                <FileText size={16} className="text-teal-500" />
                Review and manage your clinical prescriptions and medication orders
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Patient name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-teal-500 text-sm w-full md:w-64 shadow-sm transition-all"
                />
              </div>
              <button 
                onClick={fetchPrescriptions}
                className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Prescriptions List */}
          <div className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 bg-white border border-slate-100 rounded-[2rem] animate-pulse"></div>
                ))}
              </div>
            ) : filteredPrescriptions.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-slate-200 p-20 text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <FileText size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Prescriptions Yet</h3>
                <p className="text-slate-500 max-w-xs mx-auto">History of issued prescriptions will be listed here for quick access and reprinting.</p>
                <button 
                  onClick={() => navigate('/doctor/dashboard')}
                  className="mt-8 px-8 py-3 bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 transition-all active:scale-95 shadow-lg shadow-teal-600/20"
                >
                  Create New Prescription
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredPrescriptions.map((p) => (
                    <div key={p._id} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group">
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                             <FileText size={24} />
                          </div>
                          <div className="flex gap-2">
                             <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-teal-600 hover:bg-teal-50 transition-all">
                                <Download size={16} />
                             </button>
                             <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-teal-600 hover:bg-teal-50 transition-all">
                                <Printer size={16} />
                             </button>
                          </div>
                       </div>
                       
                       <div className="mb-6">
                          <h4 className="text-lg font-black text-slate-900 mb-1">{p.patientName || 'Unknown Patient'}</h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.patientPhone || 'No Phone'}</p>
                       </div>

                       <div className="flex items-center justify-between text-xs font-bold py-3 px-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                          <div className="flex items-center gap-2 text-slate-600">
                             <Calendar size={14} className="text-teal-500" />
                             {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                             <Clock size={14} className="text-teal-500" />
                             {p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </div>
                       </div>

                       <button 
                        onClick={() => navigate(`/doctor/records?phone=${p.patientPhone}`)}
                        className="w-full py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black text-slate-700 uppercase tracking-widest hover:border-teal-600 hover:text-teal-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                       >
                          View Patient Profile
                          <ExternalLink size={12} />
                       </button>
                    </div>
                 ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Prescriptions;
