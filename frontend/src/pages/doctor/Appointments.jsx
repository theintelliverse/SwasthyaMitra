import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  User, 
  Activity,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import Swal from 'sweetalert2';

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')).replace(/\/$/, '');

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Upcoming');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Reusing the queue stats for now as it contains scheduled appointments
      const res = await axios.get(`${API_URL}/api/queue/stats/doctor`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data) {
        // Filter for scheduled/waiting
        setAppointments(res.data.data.queue || []);
      }
    } catch (err) {
      console.error("Fetch Appointments Error:", err);
      const msg = err.response?.data?.message || 'Failed to load appointments. Please check your connection.';
      Swal.fire('Error', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (appointmentId) => {
    try {
      Swal.fire({
        title: 'Starting Session...',
        text: 'Notifying patient and entering cabin mode.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await axios.patch(`${API_URL}/api/queue/start/${appointmentId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Session Started!',
          text: 'The patient has been notified. Entering consultation mode.',
          timer: 1500,
          showConfirmButton: false
        });
        setTimeout(() => {
          navigate('/doctor/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to start session.', 'error');
    }
  };

  const filteredAppointments = (appointments || []).filter(app => {
    if (!app) return false;
    const name = app.patientName || 'Unknown Patient';
    const phone = app.patientPhone || '';

    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         phone.includes(searchTerm);
    const matchesTab = activeTab === 'All' || 
                       (activeTab === 'Upcoming' && (app.status === 'Waiting' || app.status === 'Scheduled')) ||
                       (activeTab === 'In Progress' && app.status === 'In-Consultation') ||
                       (activeTab === 'Completed' && app.status === 'Completed');
    return matchesSearch && matchesTab;
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex-col md:flex-row">
      <Sidebar role="doctor" />
      <div className="flex-grow flex flex-col min-h-screen">
        <main className="px-4 md:px-8 py-8 flex-grow max-w-7xl mx-auto w-full space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Appointment Schedule</h1>
              <p className="text-slate-500 flex items-center gap-2 font-medium">
                <CalendarIcon size={16} className="text-teal-500" />
                Manage your daily patient consultations and follow-ups
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-teal-500 text-sm w-full md:w-64 shadow-sm transition-all"
                />
              </div>
              <button 
                onClick={fetchAppointments}
                className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-[1.5rem] w-fit shadow-sm overflow-x-auto max-w-full">
            {['Upcoming', 'In Progress', 'Completed', 'All'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === tab 
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* List Area */}
          <div className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-white border border-slate-100 rounded-[2rem] animate-pulse"></div>
                ))}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-slate-200 p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <CalendarIcon size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Appointments Found</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Your schedule is currently clear for the selected criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAppointments.map((app) => (
                  <div 
                    key={app._id}
                    className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
                  >
                    {/* Status Badge */}
                    <div className="absolute top-0 right-0 p-4">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        app.status === 'In-Consultation' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                        app.status === 'Completed' ? 'bg-green-50 text-green-600 border border-green-100' :
                        app.isEmergency ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' :
                        'bg-teal-50 text-teal-600 border border-teal-100'
                      }`}>
                        {app.status}
                      </div>
                    </div>

                    <div className="flex items-start gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner ${
                        app.isEmergency ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {(app.patientName || 'UP').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-slate-900 truncate pr-16">{app.patientName || 'Unknown Patient'}</h3>
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Clock size={12} />
                          Scheduled: {app.createdAt ? new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                           <Activity size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Reason for Visit</p>
                          <p className="text-xs font-bold text-slate-700 truncate">{app.requiredTest || 'Routine Consultation'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                           <User size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Queue Token</p>
                          <p className="text-xs font-bold text-slate-700">#{app.tokenNumber}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-50">
                      {app.status === 'Completed' ? (
                        <button 
                          disabled
                          className="flex-1 py-3 bg-slate-100 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest cursor-not-allowed"
                        >
                          Completed
                        </button>
                      ) : app.status === 'In-Consultation' ? (
                        <button 
                          onClick={() => navigate('/doctor/dashboard')}
                          className="flex-1 py-3 bg-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-orange-600/20"
                        >
                          Resume Session
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleStartSession(app._id)}
                          className="flex-1 py-3 bg-teal-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 transition-all active:scale-95 shadow-lg shadow-teal-600/20"
                        >
                          Start Session
                        </button>
                      )}
                      <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all active:scale-95">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
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

export default Appointments;
