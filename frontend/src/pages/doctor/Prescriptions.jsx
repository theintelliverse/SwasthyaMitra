import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FileText,
  Search,
  Plus,
  Calendar,
  Clock,
  Printer,
  RefreshCw,
  ExternalLink,
  Stethoscope,
  Edit3,
  Pill,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import Swal from 'sweetalert2';

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')).replace(/\/$/, '');

const emptyMed = () => ({ name: '', time: '', amount: '', total: '' });

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = create new
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState([emptyMed()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
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

  const openCreateModal = () => {
    setEditingId(null);
    setPatientName('');
    setPatientPhone('');
    setDiagnosis('');
    setNotes('');
    setMedicines([emptyMed()]);
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setEditingId(p._id);
    setPatientName(p.patientName || '');
    setPatientPhone(p.patientPhone || '');
    setDiagnosis(p.diagnosis || '');
    setNotes(p.notes || '');
    setMedicines(p.medicines && p.medicines.length > 0 ? p.medicines.map(m => ({ name: m.name || '', time: m.time || '', amount: m.amount || '', total: m.total || '' })) : [emptyMed()]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      Swal.fire('Error', 'Patient Name and Phone are required.', 'error');
      return;
    }
    if (!diagnosis.trim()) {
      Swal.fire('Error', 'Please enter the diagnosis / illness name (bimari nu naam).', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientName,
        patientPhone,
        diagnosis,
        notes,
        medicines: medicines.filter(m => m.name.trim() !== '')
      };

      let res;
      if (editingId) {
        // Update existing prescription
        res = await axios.put(`${API_URL}/api/staff/update-prescription/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create new prescription
        res = await axios.post(`${API_URL}/api/staff/create-prescription`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: editingId ? 'Prescription Updated!' : 'Prescription Created!',
          timer: 1500,
          showConfirmButton: false
        });
        closeModal();
        fetchPrescriptions();
      }
    } catch (err) {
      console.error(err);
      // If update endpoint doesn't exist yet, show a helpful message
      const msg = err.response?.status === 404 && editingId
        ? 'Update endpoint not found. Please ensure backend supports PUT /api/staff/update-prescription/:id'
        : err.response?.data?.message || 'Operation failed. Please try again.';
      Swal.fire('Error', msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter by diagnosis OR phone
  const filteredPrescriptions = (prescriptions || []).filter(p => {
    if (!p) return false;
    const diag = p.diagnosis || '';
    const phone = p.patientPhone || '';
    const name = p.patientName || '';
    return (
      diag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm) ||
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
                <Stethoscope size={16} className="text-teal-500" />
                Manage clinical prescriptions by illness / diagnosis
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by illness or phone..."
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
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-2xl text-[14px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all active:scale-95 shadow-lg shadow-teal-600/20 whitespace-nowrap"
              >
                <Plus size={16} /> Add New Record
              </button>
            </div>
          </div>

          {/* Prescriptions List */}
          <div className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-56 bg-white border border-slate-100 rounded-[2rem] animate-pulse"></div>
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
                  onClick={openCreateModal}
                  className="mt-8 px-8 py-3 bg-teal-600 text-white rounded-2xl text-[14px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all active:scale-95 shadow-lg shadow-teal-600/20"
                >
                  Add New Prescription
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrescriptions.map((p) => (
                  <div key={p._id} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
                    <div>
                      {/* Top: Icon + Print */}
                      <div className="flex justify-between items-start mb-5">
                        <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                          <Stethoscope size={22} />
                        </div>
                        <button
                          onClick={() => window.print()}
                          className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-teal-600 hover:bg-teal-50 transition-all"
                          title="Print"
                        >
                          <Printer size={16} />
                        </button>
                      </div>

                      {/* Diagnosis / Illness Name - Primary */}
                      <div className="mb-4">
                        <span className="text-[14px] font-black text-teal-600 uppercase tracking-[0.2em] flex items-center gap-1.5 mb-1">
                          <AlertCircle size={10} /> Illness / Bimari
                        </span>
                        <h4 className="text-xl font-black text-slate-900 leading-tight tracking-tight">
                          {p.diagnosis || <span className="text-slate-300 font-bold italic">No diagnosis recorded</span>}
                        </h4>
                      </div>

                      {/* Notes if any */}
                      {p.notes && (
                        <p className="text-[14px] text-slate-400 font-medium mb-4 line-clamp-2 leading-relaxed border-l-2 border-slate-100 pl-3">
                          {p.notes}
                        </p>
                      )}

                      {/* Date / Time */}
                      <div className="flex items-center justify-between text-[14px] font-bold py-2.5 px-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar size={12} className="text-teal-500" />
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock size={12} className="text-teal-500" />
                          {p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </div>
                      </div>

                      {/* Medicines preview */}
                      {p.medicines && p.medicines.length > 0 && (
                        <div className="mb-4 space-y-1.5">
                          <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Pill size={10} /> Medicines ({p.medicines.length})</p>
                          <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-100/80 space-y-1">
                            {p.medicines.slice(0, 3).map((m, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[14px] font-bold text-slate-700">
                                <span className="truncate">{m.name}</span>
                                <span className="text-[14px] bg-white border border-slate-100 px-2 py-0.5 rounded-lg text-teal-600 whitespace-nowrap ml-2">{m.amount}{m.time ? ` | ${m.time}` : ''}</span>
                              </div>
                            ))}
                            {p.medicines.length > 3 && (
                              <p className="text-[14px] text-slate-400 font-bold text-center pt-1">+{p.medicines.length - 3} more medicines</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-2 pt-4 border-t border-slate-50">
                      {/* Update Button */}
                      <button
                        onClick={() => openEditModal(p)}
                        className="flex-1 py-3 bg-teal-50 border-2 border-teal-100 rounded-2xl text-[14px] font-black text-teal-700 uppercase tracking-widest hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Edit3 size={12} /> Update
                      </button>
                      {/* View Patient */}
                      <button
                        onClick={() => navigate(`/doctor/records?phone=${p.patientPhone}`)}
                        className="flex-1 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[14px] font-black text-slate-600 uppercase tracking-widest hover:border-slate-300 hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink size={12} /> Patient File
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Floating Add Button */}
          <button
            onClick={openCreateModal}
            className="fixed bottom-8 right-8 w-14 h-14 bg-teal-600 text-white rounded-2xl shadow-2xl shadow-teal-600/40 flex items-center justify-center hover:bg-teal-700 transition-all active:scale-90 z-50 border-4 border-white"
            title="Add New Prescription"
          >
            <Plus size={24} />
          </button>

        </main>
        <Footer />
      </div>

      {/* Create / Update Prescription Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] border border-slate-100 shadow-2xl p-6 md:p-8 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200 flex flex-col">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingId ? 'bg-orange-50 text-orange-600' : 'bg-teal-50 text-teal-600'}`}>
                  {editingId ? <Edit3 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {editingId ? 'Update Prescription' : 'New Prescription Record'}
                  </h2>
                  <p className="text-[14px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    {editingId ? 'Edit illness, medicines and notes' : 'Issue new clinical medication order'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 flex-grow">

              {/* ---- ILLNESS / BIMARI FIELD - TOP PRIORITY ---- */}
              <div className="p-5 bg-teal-50 border-2 border-teal-100 rounded-2xl">
                <label className="block text-[14px] font-black text-teal-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Stethoscope size={12} /> Illness / Bimari Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Viral Fever, Hypertension, Diabetes..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full bg-white border-2 border-teal-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-teal-500 transition-all text-slate-800 placeholder:text-slate-300"
                />
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-black text-slate-500 uppercase tracking-widest mb-2">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-black text-slate-500 uppercase tracking-widest mb-2">Patient Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[14px] font-black text-slate-500 uppercase tracking-widest mb-2">Observational Notes</label>
                <textarea
                  placeholder="Additional clinical notes about the patient's condition..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-sm outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800 resize-none"
                />
              </div>

              {/* Prescribed Medicines */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[14px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5"><Pill size={12} /> Prescribed Medicines</label>
                  <button
                    type="button"
                    onClick={() => setMedicines([...medicines, emptyMed()])}
                    className="text-[14px] font-black text-teal-600 hover:text-teal-700 flex items-center gap-1 uppercase tracking-widest"
                  >
                    <Plus size={14} /> Add Medicine
                  </button>
                </div>

                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {medicines.map((m, idx) => (
                    <div key={idx} className="flex gap-2 items-center group">
                      <input
                        type="text"
                        placeholder="Medicine name"
                        value={m.name}
                        onChange={(e) => {
                          const updated = [...medicines];
                          updated[idx].name = e.target.value;
                          setMedicines(updated);
                        }}
                        className="flex-grow bg-slate-50 border-2 border-transparent rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Dosage"
                        value={m.amount}
                        onChange={(e) => {
                          const updated = [...medicines];
                          updated[idx].amount = e.target.value;
                          setMedicines(updated);
                        }}
                        className="w-28 bg-slate-50 border-2 border-transparent rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Timing"
                        value={m.time}
                        onChange={(e) => {
                          const updated = [...medicines];
                          updated[idx].time = e.target.value;
                          setMedicines(updated);
                        }}
                        className="w-28 bg-slate-50 border-2 border-transparent rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-800"
                      />
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setMedicines(medicines.filter((_, i) => i !== idx))}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-50 flex gap-3 shrink-0">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-4 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${editingId ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'}`}
                >
                  {isSubmitting ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Prescription' : 'Issue Prescription'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-[14px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
