import React, { useState } from 'react';
import { Clock, ShieldCheck, Mail, Send, CheckCircle, HelpCircle, LogOut, Phone, MapPin, Building, AlertCircle } from 'lucide-react';
import SEO from '../../components/SEO';

const PendingApprovalPage = ({ facility, onLogout }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendTicket = async (e) => {
    e.preventDefault();
    if (!subject || !message) {
      setErrorMsg('Please fill in both subject and message.');
      return;
    }

    setSending(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/superadmin/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: facility?.name || facility?.labName || 'Facility Admin',
          senderEmail: facility?.email || 'admin@facility.com',
          facilityType: facility?.type || 'clinic',
          facilityName: facility?.name || facility?.labName || 'Unapproved Facility',
          subject: `[Pending Approval Inquiry] ${subject}`,
          message
        })
      });

      const data = await res.json();
      if (data.success) {
        setTicketSent(true);
        setSubject('');
        setMessage('');
      } else {
        setErrorMsg(data.message || 'Failed to submit support request.');
      }
    } catch (err) {
      setErrorMsg('Network error. Failed to send support ticket.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white flex flex-col justify-between font-body p-4 sm:p-6">
      <SEO title="Registration Pending Approval | Appointory" noindex={true} />

      {/* Header Bar */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-4 border-b border-teal-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-teal-950 font-black flex items-center justify-center text-lg shadow-lg">
            AP
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-tight text-white">Appointory Healthcare</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Onboarding & Compliance Portal</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer"
        >
          <LogOut size={14} /> Return to Login
        </button>
      </header>

      {/* Main Status & Support Container */}
      <main className="max-w-4xl mx-auto w-full my-8 space-y-8">
        
        {/* Status Card Banner */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0 animate-pulse">
              <Clock size={32} />
            </div>
            
            <div className="space-y-2 flex-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/30">
                ⌛ Status: Pending Super Admin Approval
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Registration Under Review
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Your registration request for <strong className="text-amber-300">{facility?.name || facility?.labName || 'your facility'}</strong> has been successfully received. Full access to the operational dashboard is granted upon Super Admin verification.
              </p>
            </div>
          </div>

          {/* Registration Details Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-white/10 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Facility Code</span>
              <div className="font-mono font-black text-amber-400 text-sm">{facility?.code || facility?.clinicCode || facility?.labCode || 'GENERATED'}</div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Facility Type</span>
              <div className="font-bold text-white uppercase">{facility?.type || 'Clinic / Lab'}</div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Contact Email</span>
              <div className="font-bold text-slate-200 truncate">{facility?.email || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Support Mailer & Dynamic SMTP Settings Section */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between gap-4 flex-wrap border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Support Mailer & Contact Super Admin</h3>
                <p className="text-xs text-slate-300">Need urgent approval or have documentation updates?</p>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-teal-900/50 text-teal-300 border border-teal-400/30 text-[10px] font-bold uppercase flex items-center gap-1.5">
              <ShieldCheck size={12} /> Support Mailer & Dynamic SMTP Active
            </div>
          </div>

          {ticketSent ? (
            <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle className="text-emerald-400 mx-auto" size={36} />
              <h4 className="text-lg font-bold text-white">Support Message Sent Successfully!</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Your message has been delivered directly to the Super Admin team using our dynamic SMTP Mailer. You will receive a response at <strong>{facility?.email}</strong>.
              </p>
              <button
                onClick={() => setTicketSent(false)}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendTicket} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Subject / Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Requesting expedited approval for clinic launch..."
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Message / Details for Super Admin
                </label>
                <textarea
                  rows="4"
                  placeholder="Describe your inquiry, emergency requests, or additional verification details..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                <div className="text-[11px] text-slate-400">
                  ⚡ Emails dispatched via custom dynamic SMTP credentials.
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-teal-950 font-black text-xs shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {sending ? <Clock className="animate-spin" size={16} /> : <Send size={16} />}
                  {sending ? 'Sending Ticket...' : 'Submit Support Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center py-4 border-t border-teal-800/40 text-[11px] text-slate-400">
        Appointory Healthcare Infrastructure • Powered by Dynamic SMTP Mailer & Compliance Engine
      </footer>
    </div>
  );
};

export default PendingApprovalPage;
