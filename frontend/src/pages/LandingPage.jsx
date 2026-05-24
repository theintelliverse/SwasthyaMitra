import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../components/Footer';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const MOCK_CLINICS = [
  {
    id: 'mock-1',
    name: 'City Care Clinic',
    clinicCode: 'CCC01',
    activeToken: 'T-08',
    efficiency: '98% On-Time Care',
    patients: [
      { name: 'Rahul Sharma', time: 'Seeing Doctor', active: true },
      { name: 'Anita Gupta', time: 'Next in line', active: false },
      { name: 'Mohit Kumar', time: '~ 15m wait', active: false },
    ]
  },
  {
    id: 'mock-2',
    name: 'Metro Wellness Center',
    clinicCode: 'MWC02',
    activeToken: 'T-04',
    efficiency: '96% On-Time Care',
    patients: [
      { name: 'Priya Patel', time: 'Seeing Doctor', active: true },
      { name: 'Aarav Mehta', time: 'Next in line', active: false },
      { name: 'Sneha Reddy', time: '~ 12m wait', active: false },
    ]
  },
  {
    id: 'mock-3',
    name: 'Apex Pediatrics',
    clinicCode: 'APX03',
    activeToken: 'T-11',
    efficiency: '99% On-Time Care',
    patients: [
      { name: 'Kabir Singh', time: 'Seeing Doctor', active: true },
      { name: 'Vihaan Sharma', time: 'Next in line', active: false },
      { name: 'Ananya Rao', time: '~ 10m wait', active: false },
    ]
  },
  {
    id: 'mock-4',
    name: 'LifeLine Cardiology',
    clinicCode: 'LLC04',
    activeToken: 'T-02',
    efficiency: '95% On-Time Care',
    patients: [
      { name: 'Ramesh Patel', time: 'Seeing Doctor', active: true },
      { name: 'Savita Devi', time: 'Next in line', active: false },
      { name: 'Karan Malhotra', time: '~ 20m wait', active: false },
    ]
  },
  {
    id: 'mock-5',
    name: 'Narmada Family Clinic',
    clinicCode: 'NFC05',
    activeToken: 'T-06',
    efficiency: '97% On-Time Care',
    patients: [
      { name: 'Amit Kumar', time: 'Seeing Doctor', active: true },
      { name: 'Ritu Verma', time: 'Next in line', active: false },
      { name: 'Deepak Sen', time: '~ 14m wait', active: false },
    ]
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [clinicsQueues, setClinicsQueues] = useState(MOCK_CLINICS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Fetch live queues from backend
  useEffect(() => {
    const fetchLiveQueues = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/clinic/public/queues-live`);
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          const dbClinics = res.data.data;
          
          // Format DB clinics
          const processedDbClinics = dbClinics.map(clinic => {
            if (!clinic.patients || clinic.patients.length === 0) {
              return {
                ...clinic,
                patients: [
                  { name: 'Walk-ins Welcome', time: 'Ready', active: false }
                ]
              };
            }
            return clinic;
          });

          // Merge DB clinics with mocks to ensure at least 5 clinics for sliding
          if (processedDbClinics.length < 5) {
            const neededMockCount = 5 - processedDbClinics.length;
            const dbNames = new Set(processedDbClinics.map(c => c.name.toLowerCase()));
            const filteredMocks = MOCK_CLINICS.filter(m => !dbNames.has(m.name.toLowerCase()));
            setClinicsQueues([...processedDbClinics, ...filteredMocks.slice(0, neededMockCount)]);
          } else {
            setClinicsQueues(processedDbClinics);
          }
        }
      } catch (error) {
        console.warn("⚠️ Failed to fetch live queues, using fallback mocks:", error.message);
      }
    };

    fetchLiveQueues();
    const pollInterval = setInterval(fetchLiveQueues, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  // Memoize extended list for seamless infinite scroll (always visibleCount = 3)
  const extendedClinics = useMemo(() => {
    if (clinicsQueues.length === 0) return [];
    return [...clinicsQueues, ...clinicsQueues.slice(0, 3)];
  }, [clinicsQueues]);

  // Set up auto-scroll interval (vertically scrolling)
  useEffect(() => {
    if (clinicsQueues.length <= 3) return;
    const scrollTimer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(scrollTimer);
  }, [clinicsQueues.length]);

  // Handle resetting index seamlessly at end of slide
  const handleTransitionEnd = () => {
    if (currentIndex >= clinicsQueues.length) {
      setIsTransitioning(false);
      setCurrentIndex(0);
    }
  };

  return (
    <div className="min-h-screen bg-parchment font-body text-teak">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 max-w-7xl mx-auto border-b border-sandstone/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-marigold rounded-xl flex items-center justify-center shadow-lg shadow-marigold/20">
            <span className="text-white font-heading text-2xl">A</span>
          </div>
          <h1 className="font-heading text-lg sm:text-2xl tracking-tight font-black text-teak">
            Appointory
          </h1>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href="#features"
            className="text-[10px] font-black uppercase tracking-widest hover:text-marigold transition-colors hidden md:block"
          >
            How it works
          </a>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-teak text-parchment rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-marigold transition-all shadow-md active:scale-95"
          >
            Staff Portal
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-24 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="space-y-6 sm:space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-saffron/15 rounded-full border border-saffron/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-marigold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-marigold"></span>
            </span>
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-teak/80">
              Transforming Healthcare across Bharat
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-7xl font-heading leading-tight italic tracking-tight">
            Care without the <br />
            <span className="text-marigold not-italic font-black">
              Waiting Room.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-khaki max-w-lg leading-relaxed font-medium">
            Automated queues, WhatsApp status alerts, and your own
            <span className="text-teak font-bold"> Secure Health Locker</span>.
            Digital healthcare that respects your time.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {/* PRIMARY CTA: STAFF LOGIN */}
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-marigold text-white rounded-2xl font-bold text-lg shadow-xl shadow-marigold/30 hover:-translate-y-1 transition-all active:scale-95"
            >
              Staff Dashboard
            </button>

            {/* SECONDARY CTA: PATIENT HISTORY LOCKER */}
            <button
              onClick={() => navigate('/patient/login')}
              className="px-8 py-4 bg-white border-2 border-sandstone rounded-2xl font-bold text-lg hover:border-marigold transition-all"
            >
              View My Health Records
            </button>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
            <p className="text-xs sm:text-sm font-medium text-khaki">
              Are you a clinic owner?{' '}
              <button
                onClick={() => navigate('/register-clinic')}
                className="text-marigold font-black hover:underline underline-offset-4"
              >
                Create Admin Account
              </button>
            </p>
            <p className="text-xs sm:text-sm font-medium text-khaki">
              New to Appointory?{' '}
              <button
                onClick={() => navigate('/patient/register')}
                className="font-black text-marigold hover:underline underline-offset-4"
              >
                Create Account
              </button>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 grayscale opacity-70">
            <p className="text-[9px] font-black uppercase tracking-widest">
              Powered by
            </p>
            <div className="h-px w-8 bg-sandstone"></div>
            <span className="font-heading text-xs sm:text-sm">Twilio</span>
            <span className="font-heading text-xs sm:text-sm">MERN Stack</span>
            <span className="font-heading text-xs sm:text-sm">Appointory</span>
          </div>
        </div>

        {/* Dashboard Simulation Mockup */}
        <div className="relative">
          <div className="absolute -top-6 -right-6 sm:-top-10 sm:-right-10 w-48 sm:w-64 h-48 sm:h-64 bg-saffron/20 rounded-full blur-3xl"></div>

          <div className="relative bg-white border border-sandstone p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] shadow-2xl">
            <div className="flex justify-between items-center mb-6 sm:mb-8 px-1 sm:px-2">
              <div>
                <h3 className="font-heading text-lg sm:text-xl font-black">Appointory Network</h3>
                <p className="text-[9px] sm:text-[10px] text-khaki font-black uppercase tracking-widest mt-0.5">
                  Live Clinic Status
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl sm:text-3xl font-heading font-black text-marigold">
                  #{String(clinicsQueues.filter(c => c.isReal).length || 4).padStart(2, '0')}
                </p>
                <p className="text-[8px] sm:text-[9px] font-black text-khaki uppercase tracking-widest mt-0.5">
                  Active Facilities
                </p>
              </div>
            </div>

            {/* Vertical Scroll List Container */}
            <div className="relative overflow-hidden h-[240px] sm:h-[320px] w-full px-1">
              <div 
                className={`flex flex-col gap-3 sm:gap-4 h-full ${isTransitioning ? 'transition-transform duration-1000 ease-in-out' : ''}`}
                style={{ 
                  transform: `translateY(calc(-${currentIndex} * (${100 / 3}% + ${12 / 3}px)))` 
                }}
                onTransitionEnd={handleTransitionEnd}
              >
                {extendedClinics.map((clinic, index) => {
                  const hasActiveToken = clinic.activeToken !== '#00' && clinic.activeToken !== 'T-00';
                  
                  return (
                    <div
                      key={`${clinic.id}-${index}`}
                      style={{
                        height: `calc(${100 / 3}% - 8px)`
                      }}
                      className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all ${
                        hasActiveToken
                          ? 'bg-parchment border-marigold'
                          : 'bg-white border-sandstone opacity-60'
                      } flex justify-between items-center flex-shrink-0`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            hasActiveToken ? 'bg-marigold animate-pulse' : 'bg-sandstone'
                          }`}
                        ></div>
                        <div className="min-w-0">
                          <p className={`text-sm sm:text-base font-bold truncate ${
                            hasActiveToken ? 'text-teak' : 'text-khaki'
                          }`}>
                            {clinic.name}
                          </p>
                          <p className="text-[8px] sm:text-[9px] text-khaki font-medium">
                            Code: {clinic.clinicCode}
                          </p>
                        </div>
                      </div>

                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-sandstone/20 px-2 sm:px-3 py-1 rounded-lg flex-shrink-0">
                        {hasActiveToken ? `Token ${clinic.activeToken}` : 'Ready'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-teak rounded-2xl sm:rounded-3xl text-parchment flex justify-between items-center shadow-lg">
              <div>
                <p className="text-[8px] sm:text-[9px] font-black uppercase text-parchment/60 tracking-widest mb-1">
                  Queue Efficiency
                </p>
                <p className="font-heading text-base sm:text-lg font-black">
                  98% On-Time Care
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <span className="text-lg sm:text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature / How It Works Section */}
      <section className="bg-white border-y border-sandstone py-16 sm:py-24 relative overflow-hidden" id="features">
        {/* Soft background decor */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-marigold/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-96 h-96 bg-saffron/5 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-marigold/10 text-marigold rounded-full border border-marigold/20">
              <span className="text-[9px] font-black uppercase tracking-widest">HOW IT WORKS</span>
            </div>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-heading leading-tight italic text-teak">
              A Seamless Digital Journey for <br className="hidden sm:inline" />
              <span className="text-marigold not-italic font-black">Clinics & Patients</span>
            </h3>
            <p className="text-sm sm:text-base text-khaki font-medium leading-relaxed">
              SwasthyaMitra connects every touchpoint of your clinic consult in real-time,
              giving patients full control of their health record history.
            </p>
          </div>

          {/* Workflow Step Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                step: "01",
                icon: "📸",
                title: "Contactless QR Desk Check-in",
                desc: "Scan the clinic's QR code on entry. Automatically fill your demographics or link your secure digital locker using your mobile number.",
                accent: "bg-teal-50 text-teal-600 border-teal-100/50"
              },
              {
                step: "02",
                icon: "⏳",
                title: "Live Token Queue Tracking",
                desc: "Receive an instant live queue status link. Monitor your wait segment directly on your phone or on TV cabinet displays with WhatsApp alerts.",
                accent: "bg-indigo-50 text-indigo-600 border-indigo-100/50"
              },
              {
                step: "03",
                icon: "🩺",
                title: "Real-time Medical Consultation",
                desc: "Consult with doctors who write cloud prescriptions, while clinic staff captures vitals and uploads lab reports seamlessly in the background.",
                accent: "bg-emerald-50 text-emerald-600 border-emerald-100/50"
              },
              {
                step: "04",
                icon: "🔐",
                title: "Secure Lifetime Health Locker",
                desc: "Access your clinical history, medical prescriptions, and diagnostic documents securely via OTP-based vault access anywhere, anytime.",
                accent: "bg-rose-50 text-rose-600 border-rose-100/50"
              }
            ].map((s, idx) => (
              <div
                key={idx}
                className="group bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-sandstone hover:border-marigold hover:shadow-[0_15px_40px_rgba(45,155,111,0.08)] transition-all duration-300 relative flex flex-col justify-between"
              >
                <div className="absolute top-6 right-8 text-5xl font-black text-sandstone/30 group-hover:text-marigold/10 transition-colors select-none">
                  {s.step}
                </div>

                <div>
                  <div className={`w-14 h-14 rounded-2xl ${s.accent} border flex items-center justify-center text-2xl shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {s.icon}
                  </div>

                  <h4 className="font-heading text-lg text-teak font-black tracking-tight mb-3">
                    {s.title}
                  </h4>

                  <p className="text-sm text-khaki leading-relaxed font-medium">
                    {s.desc}
                  </p>
                </div>

                {idx < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-parchment border border-sandstone/60 flex items-center justify-center text-xs text-khaki font-black z-10 select-none">
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;