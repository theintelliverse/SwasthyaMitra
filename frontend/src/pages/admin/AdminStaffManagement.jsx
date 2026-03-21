import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client'; // 🔑 Added Socket Client
import { SOCKET_URL } from '../../config/runtime'; // Importing runtime socket URL
import {
  Archive, RefreshCw, UserPlus, Search, Users,
  ShieldCheck, Activity, UserCheck, History, AlertCircle
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
// Initialize socket
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const AdminStaffManagement = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeView, setActiveView] = useState('active'); // 'active' or 'archived'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'doctor',
    specialization: ''
  });

  const token = localStorage.getItem('token');
  const clinicId = localStorage.getItem('clinicId');

  const fetchStaff = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/staff/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaffList(res.data.staff || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // 🔌 WebSocket Lifecycle
  useEffect(() => {
    fetchStaff();

    if (clinicId) {
      socket.emit('joinClinic', clinicId);

      // 📢 Listen for staff changes (Add, Delete, Archive)
      socket.on('staffListUpdated', () => {
        console.log("♻️ Staff Roster updated via Socket");
        fetchStaff(false); // Silent refresh to avoid loading spinner flicker
      });

      // 📢 Listen for doctor availability changes (On Break/Duty)
      socket.on('doctorStatusChanged', () => {
        fetchStaff(false);
      });
    }

    return () => {
      socket.off('staffListUpdated');
      socket.off('doctorStatusChanged');
    };
  }, [token, clinicId]);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/api/staff/add`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Staff Registered',
          text: `Credentials for ${formData.name} are ready.`,
          confirmButtonColor: '#1F6FB2',
          background: '#EEF6FA'
        });
        setShowAddForm(false);
        // fetchStaff() is now handled by the socket emit from backend
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: err.response?.data?.message || 'Error creating staff profile.',
        confirmButtonColor: '#0F766E'
      });
    } finally { setIsSubmitting(false); }
  };

  const handleArchive = async (id, name) => {
    Swal.fire({
      title: 'Archive Member?',
      text: `Access for ${name} will be revoked, but historical records will be preserved for audits.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0F766E',
      cancelButtonColor: '#AFC4D8',
      confirmButtonText: 'Confirm Archive',
      background: '#EEF6FA'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_URL}/api/staff/delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          Swal.fire('Archived!', 'Staff access has been restricted.', 'success');
          // fetchStaff() is now handled by socket
        } catch (err) {
          Swal.fire('Error', 'Action failed.', 'error');
        }
      }
    });
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeView === 'active' ? s.isActive !== false : s.isActive === false;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-parchment font-body text-teak">
      <Sidebar role="admin" />

      <div className="flex-grow flex flex-col h-screen overflow-y-auto">
        <main className="p-8 lg:p-12 max-w-7xl mx-auto w-full flex-grow">

          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-5xl font-heading mb-2">Staff Roster</h1>
              <div className="flex gap-4 mt-4">
                <button onClick={() => setActiveView('active')} className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${activeView === 'active' ? 'bg-teak text-white shadow-lg' : 'bg-white border border-sandstone text-khaki'}`}>Current Team</button>
                <button onClick={() => setActiveView('archived')} className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${activeView === 'archived' ? 'bg-teak text-white shadow-lg' : 'bg-white border border-sandstone text-khaki'}`}>Past Staff</button>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-8 py-4 bg-marigold text-white rounded-2xl font-bold shadow-xl hover:bg-teak transition-all"
            >
              {showAddForm ? 'Close Portal' : <><UserPlus size={18} /> Add New Professional</>}
            </button>
          </header>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <StatBox icon={<Users size={16} />} label="Total Registered" val={staffList.length} />
            <StatBox icon={<UserCheck size={16} />} label="Currently Live" val={staffList.filter(s => s.isActive !== false).length} />
            <StatBox icon={<Activity size={16} />} label="Doctors" val={staffList.filter(s => s.role === 'doctor' && s.isActive !== false).length} />
            <StatBox icon={<ShieldCheck size={16} />} label="Auth Status" val="Secure" />
          </div>

          {showAddForm && (
            <div className="bg-white border border-sandstone p-10 rounded-[3rem] shadow-2xl mb-12 animate-in fade-in slide-in-from-top-4">
              <h2 className="font-heading text-2xl mb-8">Clinical Credentialing</h2>
              <form onSubmit={handleAddStaff} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputGroup label="Full Name" type="text" placeholder="Dr. Sameer Khan" onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <InputGroup label="Work Email" type="email" placeholder="name@clinic.com" onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                <InputGroup label="Access Token" type="password" placeholder="Temporary Password" onChange={(e) => setFormData({ ...formData, password: e.target.value })} />

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-khaki ml-2">Assigned Role</label>
                  <select
                    className="px-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-bold text-teak"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="doctor">Medical Practitioner</option>
                    <option value="receptionist">Front Desk Staff</option>
                    <option value="lab">Lab Technician</option>
                  </select>
                </div>

                {formData.role === 'doctor' && (
                  <InputGroup label="Clinical Specialization" type="text" placeholder="e.g. Pediatrics" onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} />
                )}

                <div className="flex items-end">
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-teak text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-marigold transition-all disabled:opacity-50">
                    {isSubmitting ? 'Syncing...' : 'Authorize Access'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-khaki" size={18} />
            <input
              type="text" placeholder="Filter by name or specialty..."
              className="w-full pl-14 pr-6 py-4 bg-white border border-sandstone rounded-2xl outline-none focus:border-marigold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
            {loading ? (
              <div className="col-span-full py-20 text-center animate-pulse opacity-40">
                <RefreshCw className="mx-auto mb-4 animate-spin" size={40} />
                <p className="font-heading text-xl">Refreshing Roster...</p>
              </div>
            ) : filteredStaff.length > 0 ? (
              filteredStaff.map((member) => (
                <div key={member._id} className={`bg-white border border-sandstone p-8 rounded-[3rem] shadow-sm group relative transition-all hover:border-marigold ${activeView === 'archived' ? 'grayscale opacity-80' : ''}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-parchment border border-sandstone">
                      {member.role === 'doctor' ? '🩺' : member.role === 'lab' ? '🔬' : '👤'}
                    </div>
                    {member.isActive !== false ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-lg">
                        <div className={`w-1.5 h-1.5 rounded-full ${member.isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></div>
                        <span className="text-[8px] font-black uppercase text-green-700">{member.isAvailable ? 'Live' : 'On Break'}</span>
                      </div>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[8px] font-black uppercase">Archived</span>
                    )}
                  </div>

                  <h3 className="text-2xl font-heading text-teak mb-1">{member.name}</h3>
                  <p className="text-[10px] font-black text-marigold uppercase tracking-widest mb-6">
                    {member.role === 'doctor' ? member.specialization : member.role === 'lab' ? 'Diagnostics' : 'Reception'}
                  </p>

                  <div className="pt-6 border-t border-sandstone/50 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-khaki truncate max-w-[120px]">{member.email}</span>
                    <div className="flex gap-1">
                      {activeView === 'active' && (
                        <button onClick={() => handleArchive(member._id, member.name)} className="p-2.5 text-khaki hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                          <Archive size={16} />
                        </button>
                      )}
                      <button className="p-2.5 text-khaki hover:text-marigold hover:bg-parchment rounded-xl transition-all">
                        <History size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-24 text-center bg-white rounded-[3.5rem] border border-dashed border-sandstone flex flex-col items-center">
                <AlertCircle size={32} className="text-sandstone mb-4" />
                <p className="text-khaki font-medium italic">No personnel records found in this section.</p>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

// StatBox and InputGroup components remain unchanged...
const StatBox = ({ icon, label, val }) => (
  <div className="bg-white border border-sandstone p-5 rounded-2xl flex items-center gap-4">
    <div className="w-10 h-10 bg-parchment rounded-xl flex items-center justify-center text-marigold shadow-sm">
      {icon}
    </div>
    <div>
      <p className="text-[8px] font-black uppercase tracking-widest text-khaki">{label}</p>
      <p className="text-xl font-heading text-teak">{val}</p>
    </div>
  </div>
);

const InputGroup = ({ label, type, placeholder, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-khaki ml-2">{label}</label>
    <input
      type={type} placeholder={placeholder} required
      className="px-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all placeholder:text-sandstone placeholder:font-normal text-sm"
      onChange={onChange}
    />
  </div>
);

export default AdminStaffManagement;