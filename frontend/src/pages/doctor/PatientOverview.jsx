import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ChevronLeft, 
  Search, 
  Bell, 
  MoreVertical, 
  Edit3, 
  Lock, 
  Plus, 
  FileText, 
  Download, 
  ExternalLink,
  Activity,
  Droplets,
  Zap,
  Wind,
  Weight,
  Thermometer,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const PatientOverview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const token = localStorage.getItem('token');
        // Assuming we have an endpoint for full patient profile by ID or phone
        const res = await axios.get(`${API_URL}/api/staff/patient-full-profile/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatient(res.data.data);
      } catch (err) {
        console.error("Failed to fetch patient details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar role="doctor" />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Mock data for demonstration if patient not found or for missing fields
  const displayPatient = patient || {
    name: 'Rahul Sharma',
    patientId: 'P00124',
    age: 32,
    gender: 'Male',
    dob: '15 Jan 1992',
    phone: '98765 43210',
    email: 'rahul.sharma@gmail.com',
    location: 'New Delhi, India',
    bloodGroup: 'B+',
    allergies: 'Dust, Pollen',
    occupation: 'Software Engineer',
    registeredOn: '15 Jan 2024',
    lastVisit: '22 May 2025',
    status: 'In Consultation'
  };

  const vitals = [
    { label: 'BP', value: '128/82', unit: 'mmHg', icon: <Activity size={18} className="text-teal-500" />, color: 'bg-teal-50' },
    { label: 'Sugar (Fasting)', value: '110', unit: 'mg/dL', icon: <Droplets size={18} className="text-purple-500" />, color: 'bg-purple-50' },
    { label: 'Pulse', value: '78', unit: 'bpm', icon: <Zap size={18} className="text-red-400" />, color: 'bg-red-50' },
    { label: 'SpO2', value: '98', unit: '%', icon: <Wind size={18} className="text-blue-500" />, color: 'bg-blue-50' },
    { label: 'Weight', value: '72', unit: 'kg', icon: <Weight size={18} className="text-orange-400" />, color: 'bg-orange-50' },
    { label: 'Temp', value: '98.4', unit: '°F', icon: <Thermometer size={18} className="text-red-500" />, color: 'bg-red-50' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-800">
      <Sidebar role="doctor" />
      
      <main className="flex-grow flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <ChevronLeft size={20} className="text-slate-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient Overview</h1>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                <span>Dashboard</span>
                <span className="text-slate-300">›</span>
                <span>Patients</span>
                <span className="text-slate-300">›</span>
                <span className="text-teal-600">{displayPatient.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search patient, ID, phone..." 
                className="w-80 pl-12 pr-4 py-2.5 bg-slate-50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/10 transition-all outline-none"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-400">⌘ K</div>
            </div>

            <div className="flex items-center gap-3 border-l border-slate-100 pl-6">
              <button className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="flex items-center gap-3 ml-2">
                <img 
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100" 
                  alt="Doctor" 
                  className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm"
                />
                <div className="hidden lg:block">
                  <p className="text-sm font-bold text-slate-900 leading-tight">Dr. Ananya Sharma</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chief Physician</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-grow p-8 overflow-y-auto space-y-8 max-w-[1600px] mx-auto w-full">
          
          {/* Patient Profile Header Card */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-10 items-start">
              {/* Avatar Section */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayPatient.name}`} 
                    alt="Patient" 
                    className="w-full h-full object-cover bg-slate-50"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Edit3 size={16} className="text-teal-600" />
                </div>
              </div>

              {/* Main Info Section */}
              <div className="flex-grow space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{displayPatient.name}</h2>
                    <span className="px-3 py-1 bg-teal-50 text-teal-600 text-[10px] font-black uppercase rounded-full tracking-widest border border-teal-100 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                      {displayPatient.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center gap-2">
                      <Edit3 size={14} /> Edit Patient
                    </button>
                    <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                      More Actions <ChevronLeft size={14} className="-rotate-90" />
                    </button>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-y-6 gap-x-4">
                  {[
                    { label: 'Patient ID', value: displayPatient.patientId },
                    { label: 'Age', value: `${displayPatient.age} yrs` },
                    { label: 'Gender', value: displayPatient.gender },
                    { label: 'DOB', value: displayPatient.dob },
                    { label: 'Phone', value: displayPatient.phone },
                    { label: 'Email', value: displayPatient.email },
                    { label: 'Location', value: displayPatient.location },
                  ].map((item, i) => (
                    <div key={i}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{item.label}</p>
                      <p className="text-sm font-bold text-slate-900 tracking-tight">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-slate-50 w-full"></div>

                {/* Additional Info Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                   {[
                    { label: 'Blood Group', value: displayPatient.bloodGroup },
                    { label: 'Allergies', value: displayPatient.allergies },
                    { label: 'Occupation', value: displayPatient.occupation },
                    { label: 'Registered On', value: displayPatient.registeredOn },
                    { label: 'Last Visit', value: displayPatient.lastVisit },
                  ].map((item, i) => (
                    <div key={i}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{item.label}</p>
                      <p className="text-sm font-bold text-slate-900 tracking-tight">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="flex gap-10 border-b border-slate-100">
            {['Overview', 'History'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 text-sm font-bold transition-all relative flex items-center gap-2 ${
                  activeTab === tab ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'Overview' ? <Activity size={18} /> : <History size={18} />}
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-teal-600 rounded-t-full shadow-[0_-2px_10px_rgba(13,148,136,0.2)]"></div>
                )}
              </button>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (Span 8) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Doctor's Private Notes */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">Doctor's Private Notes</h3>
                  <button className="text-xs font-bold text-teal-600 flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                    <Edit3 size={14} /> Edit Notes
                  </button>
                </div>
                <div className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100/50 relative overflow-hidden group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                      <Lock size={18} />
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-orange-600/60 uppercase tracking-widest">These notes are only visible to you.</p>
                      <div className="space-y-1 text-sm text-slate-700 leading-relaxed font-medium italic">
                        <p>Patient has recurring headaches and elevated BP.</p>
                        <p>Advised lifestyle changes. Monitor BP closely.</p>
                        <p>Follow up in 2 weeks and review sugar levels.</p>
                        <p>Possible stress-related symptoms.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Prescription */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">Current Prescription</h3>
                  <button className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-teal-700 transition-all">
                    <Plus size={14} /> New Medicine
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                        <th className="pb-4">Medicine Name</th>
                        <th className="pb-4">Strength</th>
                        <th className="pb-4">When to Take</th>
                        <th className="pb-4">Before / After</th>
                        <th className="pb-4">Duration</th>
                        <th className="pb-4">Instructions</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {[
                        { name: 'Telmisartan', strength: '40 mg', when: 'Morning', timing: 'After Breakfast', duration: '30 Days', instr: 'For BP control' },
                        { name: 'Metformin', strength: '500 mg', when: 'Morning, Evening', timing: 'After Lunch, After Dinner', duration: '30 Days', instr: 'For sugar control' },
                        { name: 'Atorvastatin', strength: '10 mg', when: 'Night', timing: 'After Dinner', duration: '30 Days', instr: 'For cholesterol' },
                        { name: 'Vitamin D3', strength: '60K', when: 'Weekly (Sunday)', timing: 'After Meal', duration: '8 Weeks', instr: 'Once a week' },
                      ].map((med, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0 group hover:bg-slate-50/50 transition-colors">
                          <td className="py-5 font-bold text-teal-600">{med.name}</td>
                          <td className="py-5 font-medium text-slate-600">{med.strength}</td>
                          <td className="py-5 font-medium text-slate-600">{med.when}</td>
                          <td className="py-5 font-medium text-slate-600">{med.timing}</td>
                          <td className="py-5 font-medium text-slate-600">{med.duration}</td>
                          <td className="py-5 font-medium text-slate-600">{med.instr}</td>
                          <td className="py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 text-slate-400 hover:text-teal-600"><Edit3 size={16} /></button>
                              <button className="p-2 text-slate-400 hover:text-red-500"><Plus className="rotate-45" size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lab Tests */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Lab Tests</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tests Sent Earlier</p>
                  </div>
                  <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                    <Plus size={14} /> New Test
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                        <th className="pb-4">Test Name</th>
                        <th className="pb-4">Lab Name</th>
                        <th className="pb-4">Date</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4 text-right">Send</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {[
                        { name: 'Complete Blood Count (CBC)', lab: 'Health Plus Lab', date: '20 May 2025', status: 'Completed' },
                        { name: 'Lipid Profile', lab: 'Health Plus Lab', date: '20 May 2025', status: 'Completed' },
                        { name: 'HbA1c', lab: 'Health Plus Lab', date: '20 May 2025', status: 'Completed' },
                      ].map((test, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0 group hover:bg-slate-50/50 transition-colors">
                          <td className="py-5 font-bold text-slate-800">{test.name}</td>
                          <td className="py-5 font-medium text-slate-500">{test.lab}</td>
                          <td className="py-5 font-medium text-slate-500">{test.date}</td>
                          <td className="py-5">
                            <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-full tracking-widest">
                              {test.status}
                            </span>
                          </td>
                          <td className="py-5 text-right">
                            <button className="px-4 py-1.5 border border-slate-200 text-teal-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-teal-50 transition-colors">Send</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column (Span 4) */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Vitals (Latest) */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">Vitals (Latest)</h3>
                  <button className="text-xs font-bold text-teal-600 hover:underline">View All</button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {vitals.map((vital, i) => (
                    <div key={i} className={`p-5 rounded-3xl border border-slate-50 transition-all hover:shadow-lg hover:shadow-slate-200/20 group cursor-default relative overflow-hidden`}>
                      <div className={`absolute top-0 right-0 w-12 h-12 ${vital.color} rounded-bl-3xl flex items-center justify-center opacity-60`}>
                        {vital.icon}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{vital.label}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">{vital.value}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{vital.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center pt-2">
                   <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Last updated: 22 May 2025, 10:15 AM</p>
                </div>
              </div>

              {/* Follow Up */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">Follow Up</h3>
                  <button className="text-xs font-bold text-teal-600 hover:underline">Schedule Follow Up</button>
                </div>
                <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-teal-500/20 transition-all cursor-pointer">
                  <div className="w-16 h-20 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm border border-slate-100 shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-2xl font-black text-slate-900 leading-none">05</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Jun</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-bold text-slate-900 leading-tight">Thursday, 05 June 2025</p>
                    <div className="flex items-center gap-2 mt-2">
                       <Clock size={12} className="text-slate-300" />
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">10:30 AM - 10:45 AM</p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="px-3 py-1 bg-teal-50 text-teal-600 text-[10px] font-black uppercase rounded-full tracking-widest">Confirmed</span>
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-teal-600 shadow-sm">
                        <Calendar size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lab Reports */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
                <h3 className="text-lg font-bold text-slate-900">Lab Reports</h3>
                <div className="space-y-4">
                  {[
                    { name: 'CBC Report', date: '20 May 2025', status: 'Completed' },
                    { name: 'Lipid Profile', date: '20 May 2025', status: 'Completed' },
                    { name: 'HbA1c Report', date: '20 May 2025', status: 'Completed' },
                  ].map((report, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-teal-600 shadow-sm">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{report.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{report.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-green-600 uppercase tracking-widest mr-2">{report.status}</span>
                        <button className="p-2 bg-white rounded-lg border border-slate-200 text-teal-600 shadow-sm hover:bg-teal-50 transition-colors"><Download size={14} /></button>
                        <button className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 shadow-sm hover:bg-slate-50 transition-colors"><ExternalLink size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full py-4 text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-teal-50 rounded-2xl transition-all border border-transparent hover:border-teal-100 group">
                  View All Reports <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientOverview;
