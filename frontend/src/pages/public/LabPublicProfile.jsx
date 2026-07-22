import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import SeoHead from '../../components/SeoHead';
import { API_URL } from '../../config/runtime';
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

  const { lab, connectedClinics, jsonLd, meta } = data;

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
                <div className="flex items-center text-amber-500 text-xs font-bold gap-1">
                  <Star size={14} fill="currentColor" />
                  <span>{lab.rating?.score || 4.9}</span>
                  <span className="text-stone-400">({lab.rating?.count || 28} reviews)</span>
                </div>
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

              {lab.bio && (
                <p className="text-sm text-stone-700 leading-relaxed pt-2">
                  {lab.bio}
                </p>
              )}
            </div>

            <div className="w-full md:w-auto bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
              <Microscope className="mx-auto text-emerald-600" size={32} />
              <span className="text-xs font-bold text-emerald-900 block">Home Sample Collection & Walk-ins</span>
              <p className="text-xs text-emerald-700">Call {lab.phone}</p>
            </div>
          </div>
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
      </main>
    </div>
  );
};

export default LabPublicProfile;
