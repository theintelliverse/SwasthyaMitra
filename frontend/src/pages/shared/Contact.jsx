import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
    Mail, MapPin, Clock, ShieldCheck, Send, CheckCircle2, 
    AlertCircle, ArrowLeft, RefreshCw, Building2, PhoneCall 
} from 'lucide-react';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { API_URL } from '../../config/runtime';

const initialForm = {
    name: '',
    email: '',
    subject: '',
    message: '',
    consent: false
};

const Contact = () => {
    const [formData, setFormData] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', text: '' });

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.consent) {
            setFeedback({
                type: 'error',
                text: 'Please acknowledge and agree to the privacy consent checkbox to submit your message.'
            });
            return;
        }

        setLoading(true);
        setFeedback({ type: '', text: '' });

        try {
            const response = await axios.post(`${API_URL}/api/contact`, formData);

            if (response.data?.success) {
                setFeedback({
                    type: 'success',
                    text: response.data.message || 'Your message has been received successfully. Our support desk will respond shortly.'
                });
                setFormData(initialForm);
            } else {
                setFeedback({
                    type: 'error',
                    text: response.data?.message || 'Unable to send your message. Please try again or email us directly.'
                });
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                'Unable to send your message right now. Please email us directly at theintelliverse@gmail.com.';
            setFeedback({ type: 'error', text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7FAF9] font-body text-[#1A3C34] flex flex-col">
            <SEO
                title="Contact Support & Grievance Desk"
                description="Get in touch with the Appointory team. Access our customer care, facility onboarding support, and designated DPDP Act Grievance Redressal Officer."
                url="/contact"
            />

            {/* Navigation Bar */}
            <header className="bg-white border-b border-[#D4E4DF]/60 sticky top-0 z-30 shadow-xs">
                <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full" aria-label="Main Navigation">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#1F7A56] rounded-xl p-1">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shadow-[#2D9B6F]/10 overflow-hidden border border-[#D4E4DF]">
                                <img src="/Appointory_logo.jpg" alt="Appointory Logo" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <span className="font-heading text-xl font-black tracking-tight text-[#1A3C34] block">
                                    Appointory<span className="text-[#2D9B6F]">.</span>
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C7C74]">Healthcare OS</span>
                            </div>
                        </Link>
                    </div>

                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A3C34] text-[#F7FAF9] rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#2D9B6F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1F7A56] transition-all"
                    >
                        <ArrowLeft size={16} />
                        Back to Home
                    </Link>
                </nav>
            </header>

            <main className="max-w-6xl mx-auto w-full px-6 py-12 flex-1 space-y-12">
                {/* Hero Header */}
                <div className="text-center max-w-2xl mx-auto space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-50 text-[#1F7A56] border border-emerald-200">
                        <Mail size={14} />
                        Always Here to Help
                    </div>
                    <h1 className="font-heading text-3xl md:text-5xl font-black text-[#1A3C34] tracking-tight leading-tight">
                        Support & <span className="text-[#2D9B6F]">Grievance Hub</span>
                    </h1>
                    <p className="text-base text-[#5C7C74] font-medium leading-relaxed">
                        Have a question regarding clinical onboarding, diagnostic lab syncing, or your patient health locker? Reach our technical desk or designated DPDP Grievance Officer.
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Official Business Details */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white border border-[#D4E4DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
                            <h2 className="font-heading text-xl font-bold text-[#1A3C34] pb-3 border-b border-[#D4E4DF]/60">
                                Corporate Details
                            </h2>

                            <div className="space-y-5 text-sm">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#F7FAF9] border border-[#D4E4DF] text-[#1F7A56] flex items-center justify-center shrink-0 mt-0.5">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-[#5C7C74]">Legal Business Entity</p>
                                        <p className="font-bold text-[#1A3C34] text-base mt-0.5">The Intelliverse</p>
                                        <p className="text-xs text-[#5C7C74] mt-0.5">Operating Appointory Healthcare OS</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#F7FAF9] border border-[#D4E4DF] text-[#1F7A56] flex items-center justify-center shrink-0 mt-0.5">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-[#5C7C74]">General & Support Email</p>
                                        <a href="mailto:theintelliverse@gmail.com" className="font-bold text-[#1F7A56] hover:underline block mt-0.5">
                                            theintelliverse@gmail.com
                                        </a>
                                        <p className="text-xs text-[#5C7C74] mt-0.5">SLA: 24–48 Business Hours</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-[#1F7A56] flex items-center justify-center shrink-0 mt-0.5">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-[#1F7A56]">DPDP Grievance Officer</p>
                                        <a href="mailto:grievance@appointory.in" className="font-bold text-[#1A3C34] hover:underline block mt-0.5">
                                            grievance@appointory.in
                                        </a>
                                        <p className="text-xs text-[#5C7C74] mt-0.5">Statutory Response: 48h acknowledgment</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#F7FAF9] border border-[#D4E4DF] text-[#1F7A56] flex items-center justify-center shrink-0 mt-0.5">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-[#5C7C74]">Operating Territory</p>
                                        <p className="font-bold text-[#1A3C34] mt-0.5">Republic of India</p>
                                        <p className="text-xs text-[#5C7C74] mt-0.5">National Deployment across Clinics & Diagnostic Centers</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#F7FAF9] border border-[#D4E4DF] text-[#1F7A56] flex items-center justify-center shrink-0 mt-0.5">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-[#5C7C74]">Support Desk Hours</p>
                                        <p className="font-bold text-[#1A3C34] mt-0.5">Monday to Saturday</p>
                                        <p className="text-xs text-[#5C7C74] mt-0.5">09:00 AM – 06:00 PM IST (Excluding Public Holidays)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Trust Badge */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-emerald-950 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-sm text-[#1F7A56]">
                                <ShieldCheck size={18} />
                                <span>Zero Spam Guarantee</span>
                            </div>
                            <p className="text-xs text-[#5C7C74] leading-relaxed">
                                Your contact credentials are used solely to reply to your specific inquiry in strict compliance with the Digital Personal Data Protection Act, 2023.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Accessible Contact Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-white border border-[#D4E4DF] rounded-3xl p-6 md:p-10 shadow-sm space-y-6">
                            <div>
                                <h2 className="font-heading text-2xl font-bold text-[#1A3C34]">
                                    Send us a Message
                                </h2>
                                <p className="text-xs md:text-sm text-[#5C7C74] mt-1 font-medium">
                                    Fill in your details below and our team will get back to you by email.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
                                <div className="grid sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label htmlFor="contact-name" className="block text-xs font-bold uppercase tracking-wider text-[#1A3C34]">
                                            Full Name <span className="text-rose-600" aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="contact-name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            aria-required="true"
                                            className="w-full border border-[#D4E4DF] bg-[#F7FAF9] text-[#1A3C34] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#1F7A56] focus:ring-2 focus:ring-[#1F7A56]/20 transition-all placeholder:text-[#5C7C74]/50"
                                            placeholder="Dr. Anita Gupta or Rajesh Kumar"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="contact-email" className="block text-xs font-bold uppercase tracking-wider text-[#1A3C34]">
                                            Email Address <span className="text-rose-600" aria-hidden="true">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            id="contact-email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            aria-required="true"
                                            className="w-full border border-[#D4E4DF] bg-[#F7FAF9] text-[#1A3C34] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#1F7A56] focus:ring-2 focus:ring-[#1F7A56]/20 transition-all placeholder:text-[#5C7C74]/50"
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="contact-subject" className="block text-xs font-bold uppercase tracking-wider text-[#1A3C34]">
                                        Subject / Topic <span className="text-rose-600" aria-hidden="true">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="contact-subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        aria-required="true"
                                        className="w-full border border-[#D4E4DF] bg-[#F7FAF9] text-[#1A3C34] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#1F7A56] focus:ring-2 focus:ring-[#1F7A56]/20 transition-all placeholder:text-[#5C7C74]/50"
                                        placeholder="Clinic Onboarding / Technical Assistance / Grievance"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="contact-message" className="block text-xs font-bold uppercase tracking-wider text-[#1A3C34]">
                                        Message <span className="text-rose-600" aria-hidden="true">*</span>
                                    </label>
                                    <textarea
                                        id="contact-message"
                                        name="message"
                                        rows="5"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        aria-required="true"
                                        className="w-full border border-[#D4E4DF] bg-[#F7FAF9] text-[#1A3C34] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#1F7A56] focus:ring-2 focus:ring-[#1F7A56]/20 transition-all placeholder:text-[#5C7C74]/50 resize-y"
                                        placeholder="Please describe how we can assist you..."
                                    />
                                </div>

                                {/* Form Consent Checkbox (DPDP Act Section 6) */}
                                <div className="p-4 bg-[#F7FAF9] border border-[#D4E4DF] rounded-2xl">
                                    <label className="flex items-start gap-3 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            id="contact-consent"
                                            name="consent"
                                            checked={formData.consent}
                                            onChange={handleChange}
                                            required
                                            aria-required="true"
                                            className="mt-1 w-4 h-4 rounded border-[#D4E4DF] text-[#1F7A56] focus:ring-2 focus:ring-[#1F7A56] focus:ring-offset-1 accent-[#1F7A56]"
                                        />
                                        <span className="text-xs text-[#5C7C74] font-medium leading-relaxed">
                                            I consent to Appointory collecting and processing my name and email address in accordance with the{' '}
                                            <Link to="/privacy" className="text-[#1F7A56] font-bold underline hover:text-[#2D9B6F]" target="_blank" rel="noopener noreferrer">
                                                Privacy Policy
                                            </Link>{' '}
                                            solely for the purpose of answering my support inquiry.
                                        </span>
                                    </label>
                                </div>

                                {/* Alert Feedback Messages */}
                                {feedback.text && (
                                    <div
                                        role="alert"
                                        className={`rounded-2xl p-4 flex items-start gap-3 text-sm font-semibold border ${
                                            feedback.type === 'success'
                                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                                : 'bg-rose-50 text-rose-900 border-rose-300'
                                        }`}
                                    >
                                        {feedback.type === 'success' ? (
                                            <CheckCircle2 size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                                        ) : (
                                            <AlertCircle size={18} className="text-rose-700 shrink-0 mt-0.5" />
                                        )}
                                        <span>{feedback.text}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !formData.consent}
                                    className="w-full py-3.5 px-6 bg-[#1A3C34] hover:bg-[#1F7A56] disabled:bg-slate-300 text-white rounded-2xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-[#1A3C34]/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1F7A56]"
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw className="animate-spin" size={18} />
                                            <span>Transmitting Inquiry...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            <span>Send Support Message</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Contact;
