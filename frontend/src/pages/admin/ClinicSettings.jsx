import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Save,
  MapPin,
  Phone,
  ShieldAlert,
  Building,
  QrCode,
  AlertCircle,
  Settings as SettingsIcon,
  FlaskConical,
  Search,
  Link2,
  X,
  RefreshCw
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import ClinicQR from '../../components/ClinicQR';
import { API_URL } from '../../config/runtime';
const ClinicSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile'); // 'profile' or 'labs'
  const [formData, setFormData] = useState({
    name: '',
    clinicCode: '',
    contactNumber: '',
    address: '',
    openingTime: '09:00',
    closingTime: '17:00',
    breakStartTime: '12:00',
    breakEndTime: '14:00',
    slotDurationMinutes: 30,
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  });
  
  // Lab Connection States
  const [labSearchQuery, setLabSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [myConnections, setMyConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  const weekdayOptions = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchClinicData = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/clinic/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          const { name, clinicCode, contactNumber, contactPhone, address, openingTime, closingTime, breakStartTime, breakEndTime, slotDurationMinutes, workingDays } = res.data.data;
          setFormData({
            name: name || '',
            clinicCode: clinicCode || '',
            contactNumber: contactNumber || contactPhone || '',
            address: address || '',
            openingTime: openingTime || '09:00',
            closingTime: closingTime || '17:00',
            breakStartTime: breakStartTime || '12:00',
            breakEndTime: breakEndTime || '14:00',
            slotDurationMinutes: slotDurationMinutes || 30,
            workingDays: workingDays && workingDays.length ? workingDays : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          });
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching clinic data", err);
        setLoading(false);
      }
    };
    fetchClinicData();
  }, [token]);

  const fetchClinicConnections = async () => {
    setLoadingConnections(true);
    try {
      const res = await axios.get(`${API_URL}/api/lab-connect/clinic`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMyConnections(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching connections:", err);
    } finally {
      setLoadingConnections(false);
    }
  };

  useEffect(() => {
    if (activeSettingsTab === 'labs') {
      fetchClinicConnections();
    }
  }, [activeSettingsTab]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.patch(`${API_URL}/api/clinic/settings`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        localStorage.setItem('clinicName', formData.name);
        localStorage.setItem('clinicCode', formData.clinicCode.toUpperCase());

        Swal.fire({
          icon: 'success',
          title: 'Profile Updated',
          text: 'Clinic settings have been synced successfully.',
          confirmButtonColor: '#0F766E',
          background: '#EEF6FA'
        });
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Update failed', 'error');
    }
  };

  const handleSearchLabs = async (e) => {
    e.preventDefault();
    if (!labSearchQuery.trim() || labSearchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await axios.get(`${API_URL}/api/lab-connect/search?q=${encodeURIComponent(labSearchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSearchResults(res.data.data || []);
      }
    } catch (err) {
      console.error("Error searching labs:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleLinkLab = async (labId) => {
    try {
      const res = await axios.post(`${API_URL}/api/lab-connect/request`, { labId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Request Sent',
          text: res.data.message || 'Connection request successfully sent to the lab.',
          confirmButtonColor: '#0F766E'
        });
        fetchClinicConnections();
        setSearchResults([]);
        setLabSearchQuery('');
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to send request', 'error');
    }
  };

  const handleDisconnectLab = async (connId) => {
    try {
      const result = await Swal.fire({
        title: 'Disconnect Lab?',
        text: 'Are you sure you want to remove this lab partner? Diagnostic tests cannot be sent to this lab unless re-linked.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, Disconnect'
      });
      if (!result.isConfirmed) return;

      const res = await axios.delete(`${API_URL}/api/lab-connect/${connId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        Swal.fire('Disconnected', 'Lab connection has been removed.', 'success');
        fetchClinicConnections();
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to disconnect', 'error');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <div className="animate-pulse font-heading text-xl text-khaki">Opening Clinic Vault...</div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-parchment font-body text-teak">
      {/* --- Sidebar Integrated --- */}
      <Sidebar role="admin" />

      <div className="flex-grow flex flex-col h-screen overflow-y-auto pb-32 lg:pb-0">
        {/* --- Header Section --- */}
        <header className="bg-white border-b border-sandstone px-8 py-6 sticky top-0 z-30 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <div className="w-12 h-12 bg-teak rounded-2xl flex items-center justify-center text-white shadow-lg">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h1 className="font-heading text-2xl leading-none">Clinic Settings</h1>
              <p className="text-[14px] font-black uppercase tracking-widest text-khaki mt-1">Configure Global Facility & Integrations</p>
            </div>
          </div>
        </header>

        {/* --- Tab Navigation --- */}
        <div className="bg-white border-b border-sandstone px-8 flex gap-4">
          <button
            onClick={() => setActiveSettingsTab('profile')}
            className={`py-3 px-4 font-bold text-sm uppercase tracking-wider relative transition-all ${activeSettingsTab === 'profile' ? 'text-teak font-black' : 'text-khaki hover:text-teak'}`}
          >
            Clinic Profile
            {activeSettingsTab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-teak rounded-t" />}
          </button>
          <button
            onClick={() => setActiveSettingsTab('labs')}
            className={`py-3 px-4 font-bold text-sm uppercase tracking-wider relative transition-all ${activeSettingsTab === 'labs' ? 'text-teak font-black' : 'text-khaki hover:text-teak'}`}
          >
            Lab Partners
            {activeSettingsTab === 'labs' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-teak rounded-t" />}
          </button>
        </div>

        <main className="flex-grow max-w-6xl w-full mx-auto p-4 md:p-6">
          {activeSettingsTab === 'profile' ? (
            <div className="grid lg:grid-cols-3 gap-6">

              {/* --- Main Settings Form --- */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-sandstone rounded-3xl p-6 md:p-8 shadow-sm">
                  <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Clinic Name */}
                      <div className="space-y-2">
                        <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Clinic Display Name</label>
                        <div className="relative">
                          <Building size={16} className="absolute left-5 top-4.5 text-sandstone" />
                          <input
                            type="text" required
                            className="w-full pl-12 pr-6 py-3 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all text-sm"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Clinic Code */}
                      <div className="space-y-2">
                        <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Unique Gateway Code</label>
                        <div className="relative">
                          <QrCode size={16} className="absolute left-5 top-4.5 text-sandstone" />
                          <input
                            type="text" required
                            className="w-full pl-12 pr-6 py-3 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-black uppercase text-marigold transition-all text-sm"
                            value={formData.clinicCode}
                            onChange={(e) => setFormData({ ...formData, clinicCode: e.target.value })}
                          />
                        </div>
                        <p className="text-[14px] text-khaki ml-2 flex items-center gap-1 italic">
                          <AlertCircle size={10} /> Affects your public check-in URL.
                        </p>
                      </div>
                    </div>

                    {/* Contact Number */}
                    <div className="space-y-2">
                      <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Verified Contact Number</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-5 top-4.5 text-sandstone" />
                        <input
                          type="text"
                          placeholder="+91 00000 00000"
                          className="w-full pl-12 pr-6 py-3 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium text-teak text-sm"
                          value={formData.contactNumber}
                          onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Physical Address */}
                    <div className="space-y-2">
                      <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Clinic Address</label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-5 top-4.5 text-sandstone" />
                        <textarea
                          placeholder="Street, Landmark, City, Pincode..."
                          className="w-full pl-12 pr-6 py-3 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium h-24 resize-none transition-all text-sm"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        ></textarea>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Opening Time</label>
                        <input
                          type="time"
                          className="w-full px-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium text-teak"
                          value={formData.openingTime}
                          onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Closing Time</label>
                        <input
                          type="time"
                          className="w-full px-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium text-teak"
                          value={formData.closingTime}
                          onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Break Start</label>
                        <input
                          type="time"
                          className="w-full px-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium text-teak"
                          value={formData.breakStartTime}
                          onChange={(e) => setFormData({ ...formData, breakStartTime: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Break End</label>
                        <input
                          type="time"
                          className="w-full px-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium text-teak"
                          value={formData.breakEndTime}
                          onChange={(e) => setFormData({ ...formData, breakEndTime: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Slot (Minutes)</label>
                        <input
                          type="number"
                          min="10"
                          max="120"
                          className="w-full px-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium text-teak"
                          value={formData.slotDurationMinutes}
                          onChange={(e) => setFormData({ ...formData, slotDurationMinutes: Number(e.target.value) || 30 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Working Days</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {weekdayOptions.map((day) => {
                          const selected = formData.workingDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const nextDays = selected
                                  ? formData.workingDays.filter((d) => d !== day)
                                  : [...formData.workingDays, day];
                                setFormData({ ...formData, workingDays: nextDays });
                              }}
                              className={`px-4 py-3 rounded-xl border text-[14px] font-black uppercase tracking-widest transition-all ${selected ? 'bg-teak text-white border-teak' : 'bg-parchment text-khaki border-sandstone hover:border-marigold'}`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[14px] text-khaki italic ml-2">Quick Slots will be shown only on selected days.</p>
                    </div>

                    <div className="pt-6">
                      <button
                        type="submit"
                        className="w-full md:w-auto px-12 py-5 bg-marigold text-white rounded-2xl font-bold uppercase text-[14px] tracking-widest hover:bg-teak transition-all shadow-xl shadow-marigold/20 active:scale-95 flex items-center justify-center gap-3"
                      >
                        <Save size={18} /> Update Facility Details
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* --- Right Sidebar: QR Live Preview & Danger Zone --- */}
              <div className="space-y-6">
                <div className="bg-white border border-sandstone p-6 md:p-8 rounded-3xl shadow-sm">
                  <h3 className="font-heading text-lg mb-4 border-b border-sandstone pb-3">Live QR Preview</h3>
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-xs origin-top md:scale-90 lg:scale-100">
                      <ClinicQR clinicCode={formData.clinicCode} clinicName={formData.name} />
                    </div>
                  </div>
                  <p className="mt-4 text-[14px] text-khaki leading-relaxed text-center px-4 font-medium italic">
                    This QR code allows patients to join your queue instantly from their mobile devices.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-8">
                  <div className="flex items-center gap-2 mb-4 text-red-800">
                    <ShieldAlert size={20} />
                    <h4 className="font-heading text-lg">Danger Zone</h4>
                  </div>
                  <p className="text-red-600/70 text-[14px] mb-6 font-bold uppercase tracking-tight">
                    Deactivation will freeze all active queues and staff access.
                  </p>
                  <button
                    type="button"
                    className="w-full py-4 bg-white border border-red-200 text-red-600 rounded-xl text-[14px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    onClick={() => Swal.fire('Security Protocol', 'Facility deactivation requires administrative override. Please contact support.', 'info')}
                  >
                    Request Termination
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* --- LAB PARTNERS TAB --- */
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Search & Link labs panel */}
                <div className="md:col-span-1 bg-white border border-sandstone rounded-3xl p-6 shadow-sm h-fit">
                  <h3 className="font-heading text-lg mb-4 flex items-center gap-2">
                    <Search size={18} className="text-marigold" /> Link Lab Partner
                  </h3>
                  <form onSubmit={handleSearchLabs} className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by Lab Name or Code..."
                        className="w-full px-4 py-3 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium text-teak text-sm"
                        value={labSearchQuery}
                        onChange={(e) => setLabSearchQuery(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={searching}
                      className="w-full py-3 bg-marigold hover:bg-teak text-white font-bold rounded-2xl text-[13px] uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {searching ? 'Searching...' : 'Search Labs'}
                    </button>
                  </form>

                  {/* Search Results */}
                  <div className="mt-6 space-y-3">
                    {searchResults.length > 0 && (
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-khaki">Found Labs ({searchResults.length})</h4>
                    )}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {searchResults.map((lab) => (
                        <div key={lab._id} className="p-3 bg-parchment border border-sandstone rounded-2xl flex flex-col gap-2">
                          <div>
                            <p className="font-bold text-sm text-teak leading-tight">{lab.labName}</p>
                            <p className="text-[11px] font-black text-khaki uppercase tracking-widest mt-0.5">{lab.labCode}</p>
                            <p className="text-[12px] text-teak/70 mt-1 line-clamp-1">{lab.address}</p>
                          </div>
                          <button
                            onClick={() => handleLinkLab(lab._id)}
                            className="py-1.5 bg-teak hover:bg-marigold text-white text-[12px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <Link2 size={12} /> Send Request
                          </button>
                        </div>
                      ))}
                      {searchResults.length === 0 && labSearchQuery.trim().length >= 2 && !searching && (
                        <p className="text-[13px] text-khaki text-center italic py-4">No labs found matching your query.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connections List */}
                <div className="md:col-span-2 bg-white border border-sandstone rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-heading text-lg flex items-center gap-2">
                      <FlaskConical size={18} className="text-teak" /> Linked Diagnostics
                    </h3>
                    <button
                      onClick={fetchClinicConnections}
                      className="p-2 text-khaki hover:text-teak rounded-xl hover:bg-parchment transition-all"
                      title="Reload connections"
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>

                  {loadingConnections ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teak mb-2" />
                      <p className="text-[13px] font-black text-khaki uppercase tracking-wider">Syncing connections...</p>
                    </div>
                  ) : myConnections.length === 0 ? (
                    <div className="text-center py-16">
                      <FlaskConical className="mx-auto text-khaki mb-3 animate-pulse" size={32} />
                      <p className="font-bold text-teak">No Lab Connections yet</p>
                      <p className="text-[13px] text-khaki mt-1">Search and link independent laboratories on the left to start sending tests.</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {myConnections.map((conn) => {
                        const lab = conn.labId || {};
                        return (
                          <div key={conn._id} className="p-4 border border-sandstone rounded-2xl bg-parchment/30 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-bold text-sm text-teak truncate" title={lab.labName}>{lab.labName}</h4>
                                <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                  conn.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                  conn.status === 'pending' ? 'bg-yellow-100 text-yellow-700 animate-pulse' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {conn.status}
                                </span>
                              </div>
                              <p className="text-[11px] font-black text-khaki uppercase tracking-widest">{lab.labCode}</p>
                              <p className="text-[12px] text-teak/70 mt-2 line-clamp-1">{lab.address}</p>
                              {lab.phone && <p className="text-[12px] text-teak/70 mt-1">📞 {lab.phone}</p>}
                            </div>

                            <div className="mt-4 pt-3 border-t border-sandstone/40 flex items-center justify-between">
                              <span className="text-[11px] text-khaki">
                                {conn.status === 'accepted' ? 'Active Partner' : 'Requested'}
                              </span>
                              <button
                                onClick={() => handleDisconnectLab(conn._id)}
                                className="p-1.5 bg-white hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg border border-sandstone/50 hover:border-red-200 transition-all"
                                title="Disconnect Partnership"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default ClinicSettings;