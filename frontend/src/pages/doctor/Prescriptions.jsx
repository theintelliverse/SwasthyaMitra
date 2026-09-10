import React, { useState, useEffect, useCallback } from 'react';
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

import { API_URL } from '../../config/runtime';

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

  const fetchPrescriptions = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchPrescriptions();
    });
    return () => { active = false; };
  }, [fetchPrescriptions]);

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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-2xl p-5 sm:p-8 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200 flex flex-col my-auto">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5 shrink-0 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${editingId ? 'bg-orange-50 text-orange-600' : 'bg-teal-50 text-teal-600'}`}>
                  {editingId ? <Edit3 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {editingId ? 'Update Prescription' : 'New Prescription Record'}
                  </h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {editingId ? 'Edit illness, medicines and notes' : 'Issue new clinical medication order'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 flex-grow">

              {/* ---- ILLNESS / BIMARI FIELD - TOP PRIORITY ---- */}
              <div className="p-4 sm:p-5 bg-teal-50/80 border-2 border-teal-100 rounded-2xl space-y-2">
                <label className="block text-xs font-black text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope size={15} className="text-teal-600" /> Illness / Bimari Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Viral Fever, Hypertension, Diabetes, Migraine..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full bg-white border border-teal-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all text-slate-800 placeholder:text-slate-300 shadow-xs"
                />
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-teal-600 focus:bg-white transition-all text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Patient Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-teal-600 focus:bg-white transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Observational Notes</label>
                <textarea
                  placeholder="Additional clinical notes about the patient's condition, allergies or advice..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm font-medium outline-none focus:border-teal-600 focus:bg-white transition-all text-slate-800 resize-none"
                />
              </div>

              {/* Prescribed Medicines */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill size={15} className="text-teal-600" /> Prescribed Medicines & Dosage Instructions
                  </label>
                  <button
                    type="button"
                    onClick={() => setMedicines([...medicines, emptyMed()])}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3.5 py-1.5 rounded-xl border border-teal-200/80 transition-all flex items-center gap-1.5 uppercase tracking-wider whitespace-nowrap self-start sm:self-auto shadow-xs"
                  >
                    <Plus size={14} /> Add Medicine
                  </button>
                </div>

                {/* Column Headers for Large Screens */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-1 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <span className="sm:col-span-5">Medicine Name & Strength</span>
                  <span className="sm:col-span-3">Dosage / Quantity</span>
                  <span className="sm:col-span-4">Timing & Clinical Instructions</span>
                </div>

                {/* Medicines Input Rows */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {medicines.map((m, idx) => (
                    <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 gap-2.5 sm:gap-3 items-center bg-slate-50/80 p-3 sm:p-2.5 rounded-2xl border border-slate-200/80 group transition-all hover:bg-white hover:border-teal-300 hover:shadow-xs">
                      
                      {/* Medicine Name */}
                      <div className="w-full sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-400 sm:hidden mb-1">Medicine Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Paracetamol 650mg"
                          value={m.name}
                          onChange={(e) => {
                            const updated = [...medicines];
                            updated[idx].name = e.target.value;
                            setMedicines(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none focus:border-teal-600 transition-all text-slate-800"
                        />
                      </div>

                      {/* Dosage */}
                      <div className="w-full sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-400 sm:hidden mb-1">Dosage</label>
                        <input
                          type="text"
                          placeholder="e.g. 1 Tab / 5ml"
                          value={m.amount}
                          onChange={(e) => {
                            const updated = [...medicines];
                            updated[idx].amount = e.target.value;
                            setMedicines(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none focus:border-teal-600 transition-all text-slate-800"
                        />
                      </div>

                      {/* Timing / Instructions */}
                      <div className="w-full sm:col-span-4 flex items-center gap-2">
                        <div className="flex-grow space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 sm:hidden mb-1">Timing & Instructions</label>
                          <select
                            value={['After Food (1-0-1)', 'Before Meals (1-0-0)', 'Morning & Night (1-0-1)', 'Once Daily (Morning)', 'At Bedtime (0-0-1)', 'After Meals (Post-food)', 'Before Meals (Pre-food)', 'As Needed (SOS)'].includes(m.time) ? m.time : (m.time ? 'CUSTOM' : '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = [...medicines];
                              if (val === 'CUSTOM') {
                                updated[idx].time = '';
                              } else {
                                updated[idx].time = val;
                              }
                              setMedicines(updated);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-teal-600 mb-1"
                          >
                            <option value="">-- Quick Select Timing --</option>
                            <option value="After Food (1-0-1)">After Food (1-0-1)</option>
                            <option value="Before Meals (1-0-0)">Before Meals (1-0-0)</option>
                            <option value="Morning & Night (1-0-1)">Morning & Night (1-0-1)</option>
                            <option value="Once Daily (Morning)">Once Daily (Morning)</option>
                            <option value="At Bedtime (0-0-1)">At Bedtime (0-0-1)</option>
                            <option value="After Meals (Post-food)">After Meals (Post-food)</option>
                            <option value="Before Meals (Pre-food)">Before Meals (Pre-food)</option>
                            <option value="As Needed (SOS)">As Needed (SOS)</option>
                            <option value="CUSTOM">✏️ Custom Text...</option>
                          </select>

                          <input
                            type="text"
                            placeholder="Or type custom timing..."
                            value={m.time}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[idx].time = e.target.value;
                              setMedicines(updated);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:border-teal-600 transition-all text-slate-800"
                          />
                        </div>
                        {medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setMedicines(medicines.filter((_, i) => i !== idx))}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shrink-0 mt-4 sm:mt-0"
                            title="Remove Medicine"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Preset Timing Suggestions */}
                <div className="pt-1 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Quick Timing Suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'After Food (1-0-1)',
                      'Before Meals (1-0-0)',
                      'Once Daily (Morning)',
                      'At Bedtime (0-0-1)',
                      'As Needed (SOS)',
                      'Twice Daily After Meals'
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          const updated = [...medicines];
                          const lastIdx = updated.length - 1;
                          if (lastIdx >= 0) {
                            updated[lastIdx].time = preset;
                            setMedicines(updated);
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-600 rounded-lg text-[11px] font-semibold border border-slate-200 transition-all"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
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
