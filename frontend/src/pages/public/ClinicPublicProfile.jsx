import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import SeoHead from '../../components/SeoHead';
import { API_URL } from '../../config/runtime';
import { 
  Building2, MapPin, Phone, Clock, Star, ShieldCheck, 
  Stethoscope, Microscope, Calendar, ChevronRight, Share2, CheckCircle2, AlertCircle
} from 'lucide-react';

const ClinicPublicProfile = () => {
  const { identifier } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/public/seo/clinic/${identifier}`);
        if (res.data.success) {
          setData(res.data.data);
        } else {
          setError(res.data.message || 'Clinic profile not found.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load clinic public profile.');
      } finally {
        setLoading(false);
      }
    };

    if (identifier) fetchClinic();
  }, [identifier]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: data?.clinic?.name || 'Clinic Profile',
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
          <p className="text-sm font-bold text-teak">Loading Clinic Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
        <div className="max-w-md bg-white border border-stone-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <AlertCircle className="mx-auto text-amber-500" size={48} />
          <h2 className="text-xl font-bold text-slate-800">Clinic Profile Not Found</h2>
          <p className="text-sm text-slate-600">{error || 'The requested clinic profile is inactive or unavailable.'}</p>
          <Link to="/" className="inline-block bg-teak text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { clinic, doctors, connectedLabs, jsonLd, meta } = data;

  return (
    <div className="min-h-screen bg-parchment text-teak font-body pb-12">
      <SeoHead 
        title={meta.title} 
        description={meta.description} 
        canonicalUrl={meta.canonicalUrl} 
        ogImage={meta.ogImage} 
        jsonLd={jsonLd} 
      />

      {/* --- Top Header Navigation --- */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-stone-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              AP
            </div>
            <span className="font-heading font-black text-lg tracking-tight text-slate-900">Appointory</span>
          </Link>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-2 rounded-xl transition"
            >
              <Share2 size={14} />
              {copied ? 'Copied!' : 'Share'}
            </button>
            <Link 
              to="/patient/checkin" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition"
            >
              Check Queue
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-8">
        {/* --- Hero Section --- */}
        <section className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                  Verified Healthcare Provider
                </span>
                <div className="flex items-center text-amber-500 text-xs font-bold gap-1">
                  <Star size={14} fill="currentColor" />
                  <span>{clinic.rating?.score || 4.8}</span>
                  <span className="text-stone-400">({clinic.rating?.count || 15} reviews)</span>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-heading font-black text-slate-900 tracking-tight">
                {clinic.name}
              </h1>

              <div className="flex flex-wrap gap-4 text-xs font-medium text-stone-600">
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-emerald-600" />
                  {clinic.address}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone size={15} className="text-emerald-600" />
                  {clinic.contactPhone}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} className="text-emerald-600" />
                  {clinic.openingTime || '09:00'} - {clinic.closingTime || '17:00'}
                </span>
              </div>

              {clinic.bio && (
                <p className="text-sm text-stone-700 leading-relaxed pt-2">
                  {clinic.bio}
                </p>
              )}
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              <Link
                to={`/patient/book-appointment?clinicId=${clinic._id}`}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3.5 rounded-2xl text-center shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Calendar size={18} />
                Book Consultation (₹{clinic.feeConsult || 500})
              </Link>
            </div>
          </div>
        </section>

        {/* --- Doctors Directory Section --- */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="text-emerald-600" size={24} />
              Specialist Doctors
            </h2>
            <span className="text-xs font-semibold text-stone-500">{doctors.length} Doctors Available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map(doc => (
              <div key={doc._id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-3">
                <div className="flex items-center gap-4">
                  <img 
                    src={doc.profileImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'} 
                    alt={doc.name} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-100"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{doc.name}</h3>
                    <p className="text-xs font-medium text-emerald-700">{doc.specialization || 'General Physician'}</p>
                    <p className="text-xs text-stone-500">{doc.experience || 5}+ years experience</p>
                  </div>
                </div>

                {doc.bio && (
                  <p className="text-xs text-stone-600 line-clamp-2">{doc.bio}</p>
                )}

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Fee: ₹{doc.consultationFee || clinic.feeConsult || 500}</span>
                  <Link 
                    to={`/d/${doc.slug || doc._id}`} 
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    View Doctor Profile <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- Connected Diagnostic Labs --- */}
        {connectedLabs.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-heading font-bold text-slate-900 flex items-center gap-2">
              <Microscope className="text-emerald-600" size={24} />
              Connected Diagnostic Labs Network
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {connectedLabs.map(lab => (
                <div key={lab._id} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center gap-3">
                    <Building2 className="text-emerald-600 shrink-0" size={20} />
                    <h4 className="font-bold text-sm text-slate-900 truncate">{lab.labName}</h4>
                  </div>
                  <p className="text-xs text-stone-500 truncate">{lab.address}</p>
                  <Link 
                    to={`/l/${lab.slug || lab._id}`}
                    className="inline-block text-xs font-bold text-emerald-700 hover:underline pt-1"
                  >
                    View Test Catalog & Details &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ClinicPublicProfile;
