import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import SeoHead from '../../components/SeoHead';
import { API_URL } from '../../config/runtime';
import { 
  Stethoscope, MapPin, Phone, Award, Star, ShieldCheck, 
  Calendar, Clock, Share2, CheckCircle2, AlertCircle, Building2
} from 'lucide-react';

const DoctorPublicProfile = () => {
  const { identifier } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/public/seo/doctor/${identifier}`);
        if (res.data.success) {
          setData(res.data.data);
        } else {
          setError(res.data.message || 'Doctor profile not found.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load doctor profile.');
      } finally {
        setLoading(false);
      }
    };

    if (identifier) fetchDoctor();
  }, [identifier]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: data?.doctor?.name || 'Doctor Profile',
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
          <p className="text-sm font-bold text-teak">Loading Doctor Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
        <div className="max-w-md bg-white border border-stone-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <AlertCircle className="mx-auto text-amber-500" size={48} />
          <h2 className="text-xl font-bold text-slate-800">Doctor Profile Not Found</h2>
          <p className="text-sm text-slate-600">{error || 'The requested doctor profile is inactive or unavailable.'}</p>
          <Link to="/" className="inline-block bg-teak text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { doctor, clinic, jsonLd, meta } = data;

  return (
    <div className="min-h-screen bg-parchment text-teak font-body pb-12">
      <SeoHead 
        title={meta.title} 
        description={meta.description} 
        canonicalUrl={meta.canonicalUrl} 
        ogImage={meta.ogImage} 
        jsonLd={jsonLd} 
      />

      {/* --- Top Header --- */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-stone-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
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
            {copied ? 'Copied!' : 'Share Profile'}
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-8">
        {/* --- Main Doctor Hero Card --- */}
        <section className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <img 
              src={doctor.profileImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300'} 
              alt={doctor.name} 
              className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-emerald-100 shadow-sm shrink-0"
            />

            <div className="space-y-3 text-center md:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck size={14} /> Verified Doctor
                </span>
                {doctor.medicalLicenseNumber && (
                  <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
                    License: {doctor.medicalLicenseNumber}
                  </span>
                )}
                <div className="flex items-center text-amber-500 text-xs font-bold gap-1">
                  <Star size={14} fill="currentColor" />
                  <span>{doctor.rating?.score || 4.9}</span>
                  <span className="text-stone-400">({doctor.rating?.count || 22} ratings)</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-heading font-black text-slate-900 tracking-tight">
                {doctor.name}
              </h1>

              <p className="text-base font-bold text-emerald-700">
                {doctor.specialization || 'Consultant Physician'}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-stone-600 font-medium pt-1">
                <span className="flex items-center gap-1">
                  <Award size={14} className="text-emerald-600" />
                  {doctor.experience || 5}+ Years Experience
                </span>
                {doctor.education && (
                  <span className="flex items-center gap-1">
                    <Stethoscope size={14} className="text-emerald-600" />
                    {doctor.education}
                  </span>
                )}
              </div>

              {doctor.bio && (
                <p className="text-sm text-stone-700 leading-relaxed pt-2">
                  {doctor.bio}
                </p>
              )}
            </div>

            <div className="w-full md:w-auto bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4 text-center">
              <div>
                <span className="text-xs text-stone-500 font-medium">Consultation Fee</span>
                <p className="text-2xl font-black text-slate-900">₹{doctor.consultationFee || 500}</p>
              </div>

              <Link
                to={`/patient/book-appointment?doctorId=${doctor._id}`}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl block shadow-sm transition"
              >
                Book Appointment
              </Link>
            </div>
          </div>
        </section>

        {/* --- Associated Clinic Details --- */}
        {clinic && (
          <section className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-heading font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="text-emerald-600" size={22} />
              Practicing Clinic
            </h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{clinic.name}</h3>
                <p className="text-xs text-stone-600 flex items-center gap-1 mt-1">
                  <MapPin size={14} className="text-emerald-600 shrink-0" />
                  {clinic.address}
                </p>
              </div>

              <Link 
                to={`/c/${clinic.slug || clinic._id}`} 
                className="bg-white text-emerald-700 border border-emerald-300 font-bold text-xs px-4 py-2 rounded-xl hover:bg-emerald-50 transition"
              >
                View Clinic & Queue &rarr;
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default DoctorPublicProfile;
