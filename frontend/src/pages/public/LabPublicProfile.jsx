import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import SeoHead from '../../components/SeoHead';
import { API_URL } from '../../config/runtime';
import RatingModal from '../../components/patient/RatingModal';
import ReviewList from '../../components/patient/ReviewList';
import { 
  Microscope, MapPin, Phone, ShieldCheck, Search, Star, 
  Clock, Share2, AlertCircle, Building2, FileText
} from 'lucide-react';

const LabPublicProfile = () => {
  const { identifier } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    const fetchLab = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/public/seo/lab/${identifier}`);
        if (res.data.success) {
          setData(res.data.data);
        } else {
          setError(res.data.message || 'Lab profile not found.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load lab profile.');
      } finally {
        setLoading(false);
      }
    };

    if (identifier) fetchLab();
  }, [identifier]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: data?.lab?.labName || 'Lab Profile',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-marigold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-teak">Loading Lab Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
        <div className="max-w-md bg-white border border-stone-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <AlertCircle className="mx-auto text-amber-500" size={48} />
          <h2 className="text-xl font-bold text-slate-800">Lab Profile Not Found</h2>
          <p className="text-sm text-slate-600">{error || 'The requested diagnostic lab profile is inactive or unavailable.'}</p>
          <Link to="/" className="inline-block bg-teak text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { 
    lab, 
    connectedClinics = [], 
    scheduleStatus, 
    workingDays = [], 
    holidays = [], 
    jsonLd, 
    meta 
  } = data;

  const filteredTests = (lab.availableTests || []).filter(t => 
    t.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-parchment text-teak font-body pb-12">
      <SeoHead 
        title={meta.title} 
        description={meta.description} 
        canonicalUrl={meta.canonicalUrl} 
        ogImage={meta.ogImage} 
        jsonLd={jsonLd} 
      />

      {/* --- Top Nav --- */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-stone-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              AP
            </div>
            <span className="font-heading font-black text-lg tracking-tight text-slate-900">Appointory</span>
          </Link>
          <button 
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-2 rounded-xl transition"
          >
            <Share2 size={14} />
            {copied ? 'Copied!' : 'Share Lab'}
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-8">
        {/* --- Hero --- */}
        <section className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck size={14} /> Verified Independent Lab
                </span>
                {lab.rating?.count > 0 ? (
                  <div className="flex items-center text-amber-500 text-xs font-bold gap-1">
                    <Star size={14} fill="currentColor" />
                    <span>{lab.rating.score}</span>
                    <span className="text-stone-400">({lab.rating.count} reviews)</span>
                  </div>
                ) : (
                  <span className="bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
                    Accredited Diagnostic Facility
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-heading font-black text-slate-900 tracking-tight">
                {lab.labName}
              </h1>

              <div className="flex flex-wrap gap-4 text-xs font-medium text-stone-600">
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-emerald-600" />
                  {lab.address}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone size={15} className="text-emerald-600" />
                  {lab.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} className="text-emerald-600" />
                  {lab.openingTime || '08:00'} - {lab.closingTime || '20:00'}
                </span>
              </div>

              {/* Real-time Status Badge */}
              {scheduleStatus && (
                <div className="pt-1">
                  {scheduleStatus.isOnHolidayToday ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
                      <AlertCircle size={15} className="text-amber-600" />
                      <span>Closed Today for Holiday: <strong>{scheduleStatus.todayHoliday?.title}</strong></span>
                    </div>
                  ) : scheduleStatus.isWeeklyOffToday ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold">
                      <Clock size={15} className="text-slate-500" />
                      <span>Closed Today (Weekly Off)</span>
                    </div>
                  ) : scheduleStatus.isLivePaused ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold">
                      <AlertCircle size={15} className="text-rose-600" />
                      <span>Temporarily Paused / Service Maintenance</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Open Today ({lab.openingTime || '08:00'} - {lab.closingTime || '20:00'})</span>
                    </div>
                  )}
                </div>
              )}

              {/* Working Days Chips */}
              {workingDays && workingDays.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">Weekly Working Days</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((dayAbbr, idx) => {
                      const fullDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                      const isWorking = workingDays.map(d => d.toLowerCase()).includes(fullDays[idx]);
                      return (
                        <span
                          key={dayAbbr}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            isWorking 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-stone-100 text-stone-400 border-stone-200 line-through'
                          }`}
                        >
                          {dayAbbr}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {lab.bio && (
                <p className="text-sm text-stone-700 leading-relaxed pt-2">
                  {lab.bio}
                </p>
              )}
            </div>

            <div className="w-full md:w-auto bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-3">
              <Microscope className="mx-auto text-emerald-600" size={32} />
              <span className="text-xs font-bold text-emerald-900 block">Home Sample Collection & Walk-ins</span>
              <p className="text-xs text-emerald-700">Call {lab.phone}</p>
              <button
                type="button"
                onClick={() => setShowRatingModal(true)}
                className="w-full bg-white hover:bg-amber-50/80 text-slate-800 border border-slate-200 hover:border-amber-300 font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Star size={14} className="text-amber-500 fill-amber-500" />
                Rate Diagnostic Lab
              </button>
            </div>
          </div>

          {/* Upcoming Holidays Banner */}
          {holidays && holidays.length > 0 && (
            <div className="mt-4 pt-4 border-t border-stone-100 bg-amber-50/40 rounded-2xl p-4 border border-amber-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-2">
                <AlertCircle size={14} className="text-amber-600" />
                Upcoming Planned Holidays & Closures
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {holidays.map(h => {
                  const s = new Date(h.startDate);
                  const e = new Date(h.endDate);
                  const isSingleDay = s.toDateString() === e.toDateString();
                  return (
                    <div key={h._id} className="bg-white p-2.5 rounded-xl border border-amber-200/80 text-xs">
                      <span className="font-bold text-slate-800 block truncate">{h.title}</span>
                      <span className="text-[11px] text-amber-800 font-semibold block">
                        📅 {s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {!isSingleDay && ` - ${e.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                      </span>
                      {h.reason && <span className="text-[10px] text-stone-500 block italic truncate">{h.reason}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* --- Test Catalog Section --- */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-2xl font-heading font-bold text-slate-900 flex items-center gap-2">
              <FileText className="text-emerald-600" size={24} />
              Diagnostic Test Catalog
            </h2>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input 
                type="text" 
                placeholder="Search blood test, lipid, thyroid..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {filteredTests.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-stone-500 text-sm">
              No diagnostic tests match your search query.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTests.map((test, idx) => (
                <div key={idx} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {test.category || 'General'}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-1">{test.testName}</h3>
                    </div>
                    <span className="text-lg font-black text-slate-900">₹{test.price}</span>
                  </div>

                  <div className="text-xs text-stone-600 space-y-1">
                    <p>Sample: <strong className="text-slate-800">{test.sampleType || 'Blood'}</strong></p>
                    <p>Fasting Required: <strong className="text-slate-800">{test.fastingRequired ? 'Yes (8-12 hrs)' : 'No'}</strong></p>
                    <p>Report Turnaround: <strong className="text-slate-800">{test.turnAroundHours || 24} hours</strong></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* --- Connected Partner Clinics --- */}
        {connectedClinics && connectedClinics.length > 0 && (
          <section className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldCheck className="text-emerald-600" size={18} />
              Connected Partner Clinics & Doctors ({connectedClinics.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {connectedClinics.map((c, i) => (
                <div key={c._id || i} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 font-black flex items-center justify-center text-sm shrink-0">
                    🏥
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xs truncate">{c.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{c.address || 'Clinic Partner'}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- Patient Ratings & Reviews Section --- */}
        <ReviewList
          targetType="lab"
          targetId={lab._id}
          targetName={lab.labName}
          onOpenRating={() => setShowRatingModal(true)}
        />
      </main>

      {/* Patient Rating Modal */}
      {showRatingModal && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          targetType="lab"
          targetId={lab._id}
          targetName={lab.labName}
          onSuccess={(updatedRating) => {
            if (updatedRating) {
              setData(prev => prev ? {
                ...prev,
                lab: { ...prev.lab, rating: updatedRating }
              } : prev);
            }
          }}
        />
      )}
    </div>
  );
};

export default LabPublicProfile;
