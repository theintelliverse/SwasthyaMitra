import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
  X, Star, Stethoscope, Building2, Microscope, Search, 
  ShieldCheck, Loader2, ArrowRight, HeartHandshake, CheckCircle2,
  Edit3, MessageSquare, Trash2, Calendar
} from 'lucide-react';
import Swal from 'sweetalert2';
import { API_URL } from '../../config/runtime';
import RatingModal from './RatingModal';

const PatientRatingHubModal = ({ 
  isOpen, 
  onClose, 
  appointments = [], 
  visitedClinics = [],
  defaultTab = 'my-reviews'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'my-reviews' | 'recent' | 'doctor' | 'clinic' | 'lab'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [editingReview, setEditingReview] = useState(null);

  const [myReviews, setMyReviews] = useState([]);
  const [loadingMyReviews, setLoadingMyReviews] = useState(false);

  // Fetch patient's past submitted reviews
  const fetchMyReviews = useCallback(async () => {
    setLoadingMyReviews(true);
    try {
      const token = localStorage.getItem('token');
      const rawPhone = localStorage.getItem('userPhone') || '';
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_URL}/api/ratings/my-reviews`, {
        params: { phone: rawPhone },
        headers
      });
      if (res.data?.success) {
        setMyReviews(res.data.reviews || []);
      }
    } catch (err) {
      console.error('Error fetching patient reviews:', err);
    } finally {
      setLoadingMyReviews(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMyReviews();
    }
  }, [isOpen, fetchMyReviews]);

  // Extract unique past doctors and clinics from appointments
  const recentDoctors = useMemo(() => {
    const map = new Map();
    appointments.forEach(apt => {
      const docId = apt.doctorId?._id || apt.doctorId;
      const docName = apt.doctorId?.name || apt.doctorName;
      if (docId && docName && !map.has(docId.toString())) {
        map.set(docId.toString(), {
          id: docId.toString(),
          name: docName,
          type: 'doctor',
          subtitle: apt.doctorId?.specialization || 'Consultant Specialist',
          rating: apt.doctorId?.rating || { score: 0, count: 0 },
          clinicName: apt.clinicName || apt.clinicId?.name
        });
      }
    });
    return Array.from(map.values());
  }, [appointments]);

  const recentClinics = useMemo(() => {
    const map = new Map();
    appointments.forEach(apt => {
      const cId = apt.clinicId?._id || apt.clinicId;
      const cName = apt.clinicId?.name || apt.clinicName;
      if (cId && cName && !map.has(cId.toString())) {
        map.set(cId.toString(), {
          id: cId.toString(),
          name: cName,
          type: 'clinic',
          subtitle: apt.clinicId?.address || 'Visited Clinic Facility',
          rating: apt.clinicId?.rating || { score: 0, count: 0 }
        });
      }
    });

    // Also include any clinics in visitedClinics
    (visitedClinics || []).forEach(clinic => {
      const cId = clinic?._id || clinic?.id;
      const cName = clinic?.name || clinic?.clinicName;
      if (cId && cName && !map.has(cId.toString())) {
        map.set(cId.toString(), {
          id: cId.toString(),
          name: cName,
          type: 'clinic',
          subtitle: clinic?.address || 'Visited Clinic Facility',
          rating: clinic?.rating || { score: 0, count: 0 }
        });
      }
    });

    return Array.from(map.values());
  }, [appointments, visitedClinics]);

  // Search when activeTab is a directory or when typing query
  useEffect(() => {
    if (activeTab === 'my-reviews') return;

    let active = true;
    const fetchTargets = async () => {
      setSearching(true);
      try {
        const typeParam = activeTab === 'recent' ? 'all' : activeTab;
        const res = await axios.get(`${API_URL}/api/ratings/search`, {
          params: {
            q: searchQuery.trim(),
            type: typeParam
          }
        });
        if (active && res.data?.success) {
          setSearchResults(res.data.results || []);
        }
      } catch (err) {
        console.error('Error fetching rating targets:', err);
      } finally {
        if (active) setSearching(false);
      }
    };

    const timer = setTimeout(fetchTargets, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [activeTab, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (target) => {
    // Check if patient already reviewed this target
    const existing = myReviews.find(r => 
      r.targetType === target.type && 
      r.targetId?.toString() === target.id?.toString()
    );

    if (existing) {
      setEditingReview(existing);
    } else {
      setSelectedTarget({
        targetType: target.type,
        targetId: target.id,
        targetName: target.name
      });
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const result = await Swal.fire({
      title: 'Remove Review?',
      text: 'Are you sure you want to delete this rating and review?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E11D48',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, Delete'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.delete(`${API_URL}/api/ratings/${reviewId}`, { headers });
        if (res.data?.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: 'Your review has been removed.',
            timer: 2000,
            showConfirmButton: false
          });
          fetchMyReviews();
        }
      } catch (err) {
        console.error('Error deleting review:', err);
        Swal.fire('Error', 'Failed to delete review.', 'error');
      }
    }
  };

  return (
    <>
      <div 
        role="dialog" 
        aria-modal="true" 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      >
        <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-teal-50/50 via-white to-amber-50/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Star size={18} className="fill-amber-500 text-amber-500" />
                </div>
                <h2 className="text-xl font-heading font-black text-slate-900 tracking-tight">
                  Healthcare Ratings &amp; Reviews
                </h2>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-full">
                  Verified Patient
                </span>
              </div>
              <p className="text-xs text-slate-500">
                View &amp; edit your submitted reviews, or rate doctor, clinic and laboratory visits.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 pt-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex flex-wrap gap-2 pb-3">
              <button
                type="button"
                onClick={() => { setActiveTab('my-reviews'); setSearchQuery(''); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'my-reviews'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Edit3 size={14} className={activeTab === 'my-reviews' ? 'text-amber-400' : 'text-slate-400'} />
                <span>My Past Reviews ({myReviews.length})</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('recent'); setSearchQuery(''); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'recent'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <HeartHandshake size={14} className={activeTab === 'recent' ? 'text-white' : 'text-teal-600'} />
                <span>Recent Consultations</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('doctor')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'doctor'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Stethoscope size={14} className={activeTab === 'doctor' ? 'text-white' : 'text-teal-600'} />
                <span>All Doctors</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('clinic')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'clinic'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Building2 size={14} className={activeTab === 'clinic' ? 'text-white' : 'text-teal-600'} />
                <span>All Clinics</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('lab')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'lab'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Microscope size={14} className={activeTab === 'lab' ? 'text-white' : 'text-teal-600'} />
                <span>Diagnostic Labs</span>
              </button>
            </div>

            {/* Search Box (Active for directories) */}
            {activeTab !== 'my-reviews' && (
              <div className="pb-3 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'doctor' ? "Search doctor by name or specialization..." :
                    activeTab === 'clinic' ? "Search clinic by name or location..." :
                    activeTab === 'lab' ? "Search diagnostic lab..." :
                    "Search any doctor, clinic, or diagnostic lab..."
                  }
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* 1. MY PAST REVIEWS (VIEW & EDIT) */}
            {activeTab === 'my-reviews' ? (
              loadingMyReviews ? (
                <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 text-sm">
                  <Loader2 className="animate-spin text-teal-600" size={20} />
                  <span>Loading your submitted reviews...</span>
                </div>
              ) : myReviews.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
                  <MessageSquare size={36} className="text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">No Reviews Submitted Yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You haven't submitted any healthcare ratings yet. Click on "Recent Consultations" to rate your doctors or clinics.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('recent')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition"
                  >
                    <Star size={13} className="fill-white" />
                    Rate Past Visits
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                    <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Your Privacy is Protected</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                        These are your past reviews. You can edit your ratings and feedback anytime. On public profile pages, your personal identity is masked as <strong>"Verified Patient"</strong>.
                      </p>
                    </div>
                  </div>

                  {myReviews.map(r => (
                    <div 
                      key={r._id} 
                      className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-2xs space-y-3 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            r.targetType === 'doctor' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            r.targetType === 'clinic' ? 'bg-teal-50 text-teal-600 border border-teal-100' :
                            'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {r.targetType === 'doctor' && <Stethoscope size={18} />}
                            {r.targetType === 'clinic' && <Building2 size={18} />}
                            {r.targetType === 'lab' && <Microscope size={18} />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm">{r.targetName}</h4>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                {r.targetType}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{r.targetSubtitle}</p>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl">
                          <Star size={14} className="fill-amber-400 text-amber-400" />
                          <span className="font-bold text-xs text-amber-800">{r.score}.0</span>
                        </div>
                      </div>

                      {/* Review Comment Text */}
                      {r.review ? (
                        <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed italic">
                          "{r.review}"
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No written comment provided.</p>
                      )}

                      {/* Actions Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(r.updatedAt || r.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(r._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Review"
                          >
                            <Trash2 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingReview(r)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl border border-teal-200 transition shadow-2xs"
                          >
                            <Edit3 size={13} />
                            <span>Edit Review</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === 'recent' && !searchQuery ? (
              /* 2. RECENT CONSULTATIONS */
              <div className="space-y-5">
                {/* Recent Doctors */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <Stethoscope size={14} className="text-teal-600" />
                    Doctors You Consulted ({recentDoctors.length})
                  </h3>
                  {recentDoctors.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {recentDoctors.map(doc => {
                        const existing = myReviews.find(r => r.targetType === 'doctor' && r.targetId?.toString() === doc.id?.toString());
                        return (
                          <div 
                            key={doc.id} 
                            onClick={() => handleSelect(doc)}
                            className="p-3.5 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 rounded-2xl cursor-pointer transition shadow-2xs group flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <h4 className="font-bold text-slate-900 text-sm truncate">Dr. {doc.name}</h4>
                              <p className="text-xs text-slate-500 truncate">{doc.subtitle}</p>
                              {doc.clinicName && <p className="text-[11px] text-teal-700 truncate">{doc.clinicName}</p>}
                            </div>
                            <button 
                              type="button" 
                              className={`px-3 py-1.5 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 shadow-2xs ${
                                existing ? 'bg-teal-600 hover:bg-teal-700' : 'bg-amber-500 group-hover:bg-amber-600'
                              }`}
                            >
                              {existing ? <Edit3 size={12} /> : <Star size={12} className="fill-white" />}
                              <span>{existing ? 'Edit' : 'Rate'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                      No doctor consultations on record yet.
                    </div>
                  )}
                </div>

                {/* Recent Clinics */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <Building2 size={14} className="text-teal-600" />
                    Clinics You Visited ({recentClinics.length})
                  </h3>
                  {recentClinics.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {recentClinics.map(clinic => {
                        const existing = myReviews.find(r => r.targetType === 'clinic' && r.targetId?.toString() === clinic.id?.toString());
                        return (
                          <div 
                            key={clinic.id} 
                            onClick={() => handleSelect(clinic)}
                            className="p-3.5 bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/20 rounded-2xl cursor-pointer transition shadow-2xs group flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <h4 className="font-bold text-slate-900 text-sm truncate">{clinic.name}</h4>
                              <p className="text-xs text-slate-500 truncate">{clinic.subtitle}</p>
                            </div>
                            <button 
                              type="button" 
                              className={`px-3 py-1.5 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 shadow-2xs ${
                                existing ? 'bg-teal-600 hover:bg-teal-700' : 'bg-amber-500 group-hover:bg-amber-600'
                              }`}
                            >
                              {existing ? <Edit3 size={12} /> : <Star size={12} className="fill-white" />}
                              <span>{existing ? 'Edit' : 'Rate'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                      No clinic visits on record yet.
                    </div>
                  )}
                </div>
              </div>
            ) : searching ? (
              <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 text-sm">
                <Loader2 className="animate-spin text-teal-600" size={20} />
                <span>Searching healthcare providers...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                <Search size={32} className="text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No Providers Found</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search query or switch tabs to find the doctor, clinic, or lab you wish to rate.
                </p>
              </div>
            ) : (
              /* 3. SEARCH RESULTS */
              <div className="grid sm:grid-cols-2 gap-3">
                {searchResults.map(target => {
                  const existing = myReviews.find(r => 
                    r.targetType === target.type && 
                    r.targetId?.toString() === target.id?.toString()
                  );

                  return (
                    <div
                      key={`${target.type}-${target.id}`}
                      onClick={() => handleSelect(target)}
                      className="p-4 bg-white border border-slate-200 hover:border-teal-500 hover:shadow-md rounded-2xl cursor-pointer transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          target.type === 'doctor' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          target.type === 'clinic' ? 'bg-teal-50 text-teal-600 border border-teal-100' :
                          'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {target.type === 'doctor' && <Stethoscope size={18} />}
                          {target.type === 'clinic' && <Building2 size={18} />}
                          {target.type === 'lab' && <Microscope size={18} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-900 text-sm truncate">
                              {target.type === 'doctor' ? `Dr. ${target.name}` : target.name}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{target.subtitle}</p>
                          {target.rating?.count > 0 && (
                            <div className="flex items-center gap-1 text-amber-500 text-[11px] font-bold mt-0.5">
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                              <span>{target.rating.score.toFixed(1)}</span>
                              <span className="text-slate-400 font-normal">({target.rating.count})</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button 
                        type="button"
                        className={`px-3 py-1.5 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 transition ${
                          existing ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-900 group-hover:bg-teal-600'
                        }`}
                      >
                        {existing ? <Edit3 size={12} /> : <Star size={12} className="fill-amber-400 text-amber-400" />}
                        <span>{existing ? 'Edit' : 'Rate'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Rating Modal */}
      {selectedTarget && (
        <RatingModal
          isOpen={!!selectedTarget}
          onClose={() => setSelectedTarget(null)}
          targetType={selectedTarget.targetType}
          targetId={selectedTarget.targetId}
          targetName={selectedTarget.targetName}
          onSuccess={() => {
            setSelectedTarget(null);
            fetchMyReviews();
          }}
        />
      )}

      {/* Edit Existing Review Modal */}
      {editingReview && (
        <RatingModal
          isOpen={!!editingReview}
          onClose={() => setEditingReview(null)}
          existingReview={editingReview}
          targetType={editingReview.targetType}
          targetId={editingReview.targetId}
          targetName={editingReview.targetName}
          onSuccess={() => {
            setEditingReview(null);
            fetchMyReviews();
          }}
        />
      )}
    </>
  );
};

export default PatientRatingHubModal;
