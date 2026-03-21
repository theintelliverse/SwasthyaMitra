import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-parchment font-body text-teak">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto border-b border-sandstone/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-marigold rounded-xl flex items-center justify-center shadow-lg shadow-marigold/20">
            <span className="text-white font-heading text-2xl">A</span>
          </div>
          <h1 className="font-heading text-2xl tracking-tight hidden sm:block">
            Appointory
          </h1>
        </div>

        <div className="flex items-center gap-6">
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
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-saffron/15 rounded-full border border-saffron/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-marigold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-marigold"></span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-teak/80">
              Transforming Healthcare across Bharat
            </span>
          </div>

          <h2 className="text-5xl lg:text-7xl font-heading leading-tight italic">
            Care without the <br />
            <span className="text-marigold not-italic">
              Waiting Room.
            </span>
          </h2>

          <p className="text-lg text-khaki max-w-lg leading-relaxed font-medium">
            Automated queues, WhatsApp status alerts, and your own
            <span className="text-teak font-bold"> Secure Health Locker</span>.
            Digital healthcare that respects your time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {/* REMOVED: Join Queue Button */}

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

          <p className="text-sm font-medium text-khaki">
            Are you a clinic owner?{' '}
            <button
              onClick={() => navigate('/register-clinic')}
              className="text-marigold font-bold hover:underline underline-offset-4"
            >
              Create Admin Account
            </button>
          </p>
          <div className="text-sm font-medium text-khaki">
              New to Appointory?{' '}
              <button
                onClick={() => navigate('/patient/register')}
                className="font-bold text-marigold hover:underline underline-offset-4"
              >
                Create Account
              </button>
          </div>

          <div className="flex items-center gap-4 pt-4 grayscale opacity-70">
            <p className="text-[9px] font-black uppercase tracking-widest">
              Powered by
            </p>
            <div className="h-px w-8 bg-sandstone"></div>
            <span className="font-heading text-sm">Twilio</span>
            <span className="font-heading text-sm">MERN Stack</span>
            <span className="font-heading text-sm">Appointory</span>
          </div>
        </div>

        {/* Dashboard Simulation Mockup */}
        <div className="relative">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-saffron/20 rounded-full blur-3xl"></div>

          <div className="relative bg-white border border-sandstone p-8 rounded-[3rem] shadow-2xl">
            <div className="flex justify-between items-center mb-8 px-2">
              <div>
                <h3 className="font-heading text-xl">Current Queue</h3>
                <p className="text-[10px] text-khaki font-black uppercase tracking-widest">
                  City Care Clinic
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-heading text-marigold">#08</p>
                <p className="text-[9px] font-black text-khaki uppercase tracking-widest">
                  Active Token
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Rahul Sharma', time: 'Seeing Doctor', active: true },
                { name: 'Anita Gupta', time: 'Next in line', active: false },
                { name: 'Mohit Kumar', time: '~ 15m wait', active: false },
              ].map((p, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-3xl border transition-all ${p.active
                    ? 'bg-parchment border-marigold'
                    : 'bg-white border-sandstone opacity-60'
                    } flex justify-between items-center`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${p.active ? 'bg-marigold animate-pulse' : 'bg-sandstone'
                        }`}
                    ></div>
                    <p className={`font-bold ${p.active ? 'text-teak' : 'text-khaki'}`}>
                      {p.name}
                    </p>
                  </div>

                  <span className="text-[9px] font-black uppercase tracking-widest bg-sandstone/20 px-3 py-1 rounded-lg">
                    {p.time}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-teak rounded-3xl text-parchment flex justify-between items-center shadow-lg">
              <div>
                <p className="text-[9px] font-black uppercase text-parchment/60 tracking-widest mb-1">
                  Queue Efficiency
                </p>
                <p className="font-heading text-lg">
                  98% On-Time Care
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Section */}
      <section className="bg-white border-y border-sandstone py-24" id="features">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-parchment rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-inner">
              📸
            </div>
            <h4 className="font-heading text-xl">QR-Based Check-in</h4>
            <p className="text-sm text-khaki leading-relaxed font-medium">
              Patients scan a unique QR code at the clinic to instantly join the queue.
              Secure, contactless, and incredibly fast.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-20 h-20 bg-parchment rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-inner">
              🔐
            </div>
            <h4 className="font-heading text-xl">Digital Health Locker</h4>
            <p className="text-sm text-khaki leading-relaxed font-medium">
              Access prescriptions, lab reports, and your history anytime with
              secure OTP-based login directly from this portal.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-20 h-20 bg-parchment rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-inner">
              🩺
            </div>
            <h4 className="font-heading text-xl">Unified Dashboard</h4>
            <p className="text-sm text-khaki leading-relaxed font-medium">
              A single platform for Doctors, Receptionists, and Lab staff to
              collaborate and provide seamless patient care.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-marigold rounded flex items-center justify-center text-white font-heading text-xs">A</div>
          <p className="text-[10px] font-black text-khaki uppercase tracking-widest">
            © 2026 Appointory — Built for Bharat
          </p>
        </div>
        <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-teak">
          <a href="/privacy" className="hover:text-marigold transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-marigold transition-colors">Terms</a>
          <a href="/contact" className="hover:text-marigold transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;