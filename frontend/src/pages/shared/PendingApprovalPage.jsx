import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, ShieldCheck, Mail, Send, CheckCircle, HelpCircle, LogOut, Phone, MapPin, Building, AlertCircle, Activity } from 'lucide-react';
import SEO from '../../components/SEO';
import Footer from '../../components/Footer';
import { API_URL } from '../../config/runtime';

const PendingApprovalPage = ({ facility, onLogout }) => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(
    facility?.email || localStorage.getItem('userEmail') || localStorage.getItem('labEmail') || 'help.appointory@gmail.com'
  );
  const [sending, setSending] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendTicket = async (e) => {
    e.preventDefault();
    if (!subject || !message || !contactEmail) {
      setErrorMsg('Please fill in email, subject, and message.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setSending(true);
    setErrorMsg('');

    try {
      const res = await axios.post(`${API_URL}/api/superadmin/tickets/create`, {
        senderName: facility?.name || facility?.labName || 'Facility Admin',
        senderEmail: contactEmail.trim(),
        facilityType: facility?.type || 'clinic',
        facilityName: facility?.name || facility?.labName || 'Unapproved Facility',
        subject: `[Pending Approval Inquiry] ${subject}`,
        message
      });

      if (res.data.success) {
        setTicketSent(true);
        setSubject('');
        setMessage('');
      } else {
        setErrorMsg(res.data.message || 'Failed to submit support request.');
      }
    } catch (err) {
      console.error('Support ticket submission error:', err);
      setErrorMsg(err.response?.data?.message || 'Network error. Failed to send support ticket.');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('pendingFacility');
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-parchment font-body text-teak flex flex-col relative overflow-hidden">
      <SEO title="Registration Pending Approval | Appointory" noindex={true} />

      {/* Decorative Glows */}
      <div className="absolute top-[-10%] -left-[10%] w-[40%] h-[40%] bg-marigold/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] -right-[10%] w-[40%] h-[40%] bg-saffron/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col items-center px-4 sm:px-6 py-6 sm:py-10 relative z-10">

        {/* Brand Header */}
        <header className="max-w-4xl w-full flex items-center justify-between mb-8 pb-4 border-b border-sandstone/30">
          <div 
            className="flex items-center gap-3.5 cursor-pointer group transition-all duration-300"
            onClick={() => navigate('/')}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-marigold/20 overflow-hidden group-hover:rotate-6 transition-transform">
              <img src="/Appointory_logo.jpg" alt="Appointory Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-teak">Appointory</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-khaki">Onboarding & Compliance Portal</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-teak text-parchment text-xs font-bold uppercase tracking-wider hover:bg-marigold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <LogOut size={14} /> Return to Login
          </button>
        </header>

        {/* Status & Support Container */}
        <main className="max-w-4xl w-full space-y-8">
          
          {/* Status Card Banner */}
          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_32px_64px_-12px_rgba(26,60,52,0.08)] relative overflow-hidden group space-y-6">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-marigold to-saffron" />

            <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-300/40 flex items-center justify-center shrink-0 animate-pulse">
                <Clock size={32} />
              </div>
              
              <div className="space-y-2 flex-1">
                <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
                  ⌛ Status: Pending Super Admin Approval
                </span>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-teak tracking-tight">
                  Registration Under Review
                </h2>
                <p className="text-sm text-khaki font-medium leading-relaxed">
                  Your registration request for <strong className="text-teak font-bold">{facility?.name || facility?.labName || 'your facility'}</strong> has been successfully received. Full access to the operational dashboard will be granted upon Super Admin verification.
                </p>
              </div>
            </div>

            {/* Registration Details Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-parchment/60 p-4 sm:p-5 rounded-2xl border border-sandstone/60 text-xs">
              <div className="space-y-1">
                <span className="text-khaki/70 font-black uppercase tracking-wider text-[10px]">Facility Code</span>
                <div className="font-mono font-black text-marigold text-base">
                  {facility?.code || facility?.clinicCode || facility?.labCode || 'GENERATED'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-khaki/70 font-black uppercase tracking-wider text-[10px]">Facility Type</span>
                <div className="font-bold text-teak uppercase">
                  {facility?.type || 'Clinic / Lab'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-khaki/70 font-black uppercase tracking-wider text-[10px]">Contact Email</span>
                <div className="font-bold text-teak truncate">
                  {facility?.email || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Support Mailer Section */}
          <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_32px_64px_-12px_rgba(26,60,52,0.08)] relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-600" />

            <div className="flex items-center justify-between gap-4 flex-wrap border-b border-sandstone/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center justify-center">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold text-teak">Support Mailer & Contact Super Admin</h3>
                  <p className="text-xs text-khaki font-medium">Need urgent approval or have documentation updates?</p>
                </div>
              </div>

              <div className="px-3.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} /> Support Mailer Active
              </div>
            </div>

            {ticketSent ? (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <CheckCircle className="text-emerald-600 mx-auto" size={40} />
                <h4 className="text-lg font-heading font-bold text-teak">Support Message Sent Successfully!</h4>
                <p className="text-xs text-khaki font-medium max-w-md mx-auto leading-relaxed">
                  Your message has been delivered directly to the Super Admin team using our dynamic SMTP Mailer. You will receive a response at <strong className="text-teak">{facility?.email}</strong>.
                </p>
                <button
                  onClick={() => setTicketSent(false)}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendTicket} className="space-y-4">
                {errorMsg && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={18} className="shrink-0 text-rose-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-khaki uppercase tracking-widest ml-2">
                    Contact Email (For Replies)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. admin@yourclinic.com"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    className="w-full bg-parchment/50 border border-sandstone focus:border-marigold focus:ring-4 focus:ring-marigold/5 rounded-2xl px-4 py-3 text-xs text-teak font-medium placeholder:text-khaki/40 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-khaki uppercase tracking-widest ml-2">
                    Subject / Topic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Requesting expedited approval for clinic launch..."
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-parchment/50 border border-sandstone focus:border-marigold focus:ring-4 focus:ring-marigold/5 rounded-2xl px-4 py-3 text-xs text-teak font-medium placeholder:text-khaki/40 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-khaki uppercase tracking-widest ml-2">
                    Message / Details for Super Admin
                  </label>
                  <textarea
                    rows="4"
                    placeholder="Describe your inquiry, emergency requests, or additional verification details..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full bg-parchment/50 border border-sandstone focus:border-marigold focus:ring-4 focus:ring-marigold/5 rounded-2xl px-4 py-3 text-xs text-teak font-medium placeholder:text-khaki/40 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                  <div className="text-[11px] font-semibold text-khaki/80 flex items-center gap-1.5">
                    ⚡ Emails dispatched directly via custom dynamic SMTP credentials.
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="px-7 py-3 rounded-2xl bg-gradient-to-r from-marigold to-saffron hover:from-marigold/90 hover:to-saffron/90 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-marigold/20 hover:shadow-marigold/30 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {sending ? <Clock className="animate-spin" size={16} /> : <Send size={16} />}
                    {sending ? 'Sending Ticket...' : 'Submit Support Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PendingApprovalPage;

