import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cookie, Sliders, Database, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';

const CookiePolicy = () => {
    const lastUpdated = 'September 2026';

    const cookieCategories = [
        {
            title: '1. Strictly Necessary Cookies & Storage (Always Active)',
            icon: ShieldCheck,
            badge: 'Required for Operation',
            badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            description: 'These cookies and local storage identifiers are technically essential for the core functionality, security, and authentication of the Appointory platform. The service cannot function properly without these items.',
            items: [
                {
                    name: 'token / labToken',
                    provider: 'Appointory',
                    purpose: 'Secure JSON Web Token (JWT) used to authenticate staff, doctors, clinic admins, labs, and patients across sessions.',
                    duration: 'Session / 30 days',
                    type: 'Local Storage'
                },
                {
                    name: 'role / labRole',
                    provider: 'Appointory',
                    purpose: 'Maintains authenticated role authorization (doctor, receptionist, admin, lab, patient) to enforce strict access control.',
                    duration: 'Session / 30 days',
                    type: 'Local Storage'
                },
                {
                    name: 'appointory_cookie_consent',
                    provider: 'Appointory',
                    purpose: 'Records your explicit cookie consent choices and preferences so the banner is not displayed on every page load.',
                    duration: '1 Year',
                    type: 'Local Storage'
                }
            ]
        },
        {
            title: '2. Analytics & Performance Cookies (Consent Required)',
            icon: Sliders,
            badge: 'Optional / Opt-In',
            badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
            description: 'These cookies allow us to aggregate anonymous usage statistics, detect technical errors, and optimize site speed. Under our Google Consent Mode v2 implementation, these cookies are DENIED by default and only activated if you click "Accept All" or enable analytics.',
            items: [
                {
                    name: '_ga',
                    provider: 'Google Analytics (Google LLC)',
                    purpose: 'Used to distinguish unique anonymous visitors and calculate visitor, session, and campaign data for site analytics.',
                    duration: '2 Years',
                    type: 'HTTP Cookie'
                },
                {
                    name: '_ga_<container-id>',
                    provider: 'Google Analytics (Google LLC)',
                    purpose: 'Maintains session state and telemetry to identify pageview counts and navigation flow anonymously.',
                    duration: '2 Years',
                    type: 'HTTP Cookie'
                }
            ]
        },
        {
            title: '3. Third-Party Payment & Security Processing',
            icon: Database,
            badge: 'Transactional / Security',
            badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
            description: 'When completing subscription checkout or paying consultation fees online, our authorized PCI-DSS Level 1 compliant payment gateway (Razorpay) may set necessary session cookies to prevent payment fraud and handle secure 3D Secure / OTP verification.',
            items: [
                {
                    name: 'rzp_checkout_anon_id / session',
                    provider: 'Razorpay Software Private Limited',
                    purpose: 'Detects and mitigates payment fraud, verifies payment authorization, and maintains payment session continuity.',
                    duration: 'Session',
                    type: 'Third-Party Cookie'
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#F7FAF9] font-body text-[#1A3C34] flex flex-col">
            <SEO
                title="Cookie Policy"
                description="Read the Cookie Policy of Appointory. Learn how we use strictly necessary and analytical cookies, local storage tokens, and Google Consent Mode v2."
                url="/cookie-policy"
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

            <main className="max-w-5xl mx-auto w-full px-6 py-12 flex-1 space-y-10">
                {/* Hero Header */}
                <div className="bg-white border border-[#D4E4DF] rounded-3xl p-8 md:p-10 shadow-sm relative overflow-hidden">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-50 text-[#1F7A56] border border-emerald-200 mb-4">
                        <Cookie size={14} />
                        Transparency & Consent
                    </div>

                    <h1 className="font-heading text-3xl md:text-5xl font-black text-[#1A3C34] tracking-tight leading-tight mb-4">
                        Cookie & Tracking <span className="text-[#2D9B6F]">Policy</span>
                    </h1>

                    <p className="text-base text-[#5C7C74] font-medium leading-relaxed max-w-3xl">
                        Appointory (operated by The Intelliverse) is committed to protecting your privacy. This Cookie Policy explains what cookies and browser storage technologies are used when you interact with our website and application, their purpose, and how you retain full control over non-essential tracking.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-[#D4E4DF]/60 text-xs font-bold uppercase tracking-wider text-[#5C7C74]">
                        <span className="bg-[#F7FAF9] border border-[#D4E4DF] px-3 py-1.5 rounded-full">
                            Last Updated: {lastUpdated}
                        </span>
                        <span className="bg-[#F7FAF9] border border-[#D4E4DF] px-3 py-1.5 rounded-full">
                            Framework: DPDP Act 2023 & Consent Mode v2
                        </span>
                    </div>
                </div>

                {/* Key Summary Cards */}
                <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-[#D4E4DF] p-5 rounded-2xl shadow-xs">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1F7A56] flex items-center justify-center mb-3">
                            <CheckCircle2 size={20} />
                        </div>
                        <h2 className="text-sm font-bold text-[#1A3C34] mb-1">Consent Mode v2 Active</h2>
                        <p className="text-xs text-[#5C7C74] leading-relaxed">
                            Analytical cookies are denied by default until you provide explicit opt-in consent via our cookie banner.
                        </p>
                    </div>

                    <div className="bg-white border border-[#D4E4DF] p-5 rounded-2xl shadow-xs">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#1A3C34] flex items-center justify-center mb-3">
                            <EyeOff size={20} />
                        </div>
                        <h2 className="text-sm font-bold text-[#1A3C34] mb-1">Zero Advertising Trackers</h2>
                        <p className="text-xs text-[#5C7C74] leading-relaxed">
                            We never use third-party marketing pixels, advertising networks, or cross-site tracking brokers.
                        </p>
                    </div>

                    <div className="bg-white border border-[#D4E4DF] p-5 rounded-2xl shadow-xs">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                            <Sliders size={20} />
                        </div>
                        <h2 className="text-sm font-bold text-[#1A3C34] mb-1">Revocable Any Time</h2>
                        <p className="text-xs text-[#5C7C74] leading-relaxed">
                            You can easily change or withdraw your consent at any time via your browser settings or privacy preferences.
                        </p>
                    </div>
                </div>

                {/* Detailed Cookie Categories */}
                <div className="space-y-8">
                    {cookieCategories.map((category) => {
                        const IconComponent = category.icon;
                        return (
                            <section
                                key={category.title}
                                className="bg-white border border-[#D4E4DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-5"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4E4DF]/60">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#F7FAF9] border border-[#D4E4DF] text-[#1F7A56] flex items-center justify-center">
                                            <IconComponent size={20} />
                                        </div>
                                        <h2 className="font-heading text-xl font-bold text-[#1A3C34]">
                                            {category.title}
                                        </h2>
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${category.badgeColor}`}>
                                        {category.badge}
                                    </span>
                                </div>

                                <p className="text-sm text-[#5C7C74] font-medium leading-relaxed">
                                    {category.description}
                                </p>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-[#F7FAF9] text-[#1A3C34] uppercase font-bold tracking-wider border-b border-[#D4E4DF]">
                                                <th className="p-3">Identifier</th>
                                                <th className="p-3">Provider</th>
                                                <th className="p-3">Purpose</th>
                                                <th className="p-3">Duration</th>
                                                <th className="p-3">Category</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#D4E4DF]/60 text-[#1A3C34]">
                                            {category.items.map((item) => (
                                                <tr key={item.name} className="hover:bg-[#F7FAF9]/50 transition-colors">
                                                    <td className="p-3 font-mono font-bold text-[#1F7A56]">{item.name}</td>
                                                    <td className="p-3 font-semibold">{item.provider}</td>
                                                    <td className="p-3 text-[#5C7C74] max-w-xs">{item.purpose}</td>
                                                    <td className="p-3 font-medium">{item.duration}</td>
                                                    <td className="p-3">
                                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold">
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* How to Control Cookies */}
                <section className="bg-white border border-[#D4E4DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-4">
                    <h2 className="font-heading text-2xl font-bold text-[#1A3C34]">
                        How to Manage or Clear Cookies in Your Browser
                    </h2>
                    <p className="text-sm text-[#5C7C74] font-medium leading-relaxed">
                        Most modern web browsers allow you to manage your cookie preferences through their settings. You can set your browser to refuse all cookies, notify you when a cookie is being sent, or delete existing cookies. Please note that disabling Strictly Necessary cookies will prevent you from logging in, accessing your patient health locker, or managing your clinic dashboard.
                    </p>
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs font-bold text-[#1A3C34]">
                        <div className="p-3 bg-[#F7FAF9] rounded-xl border border-[#D4E4DF]">
                            <p className="font-bold text-[#1F7A56]">Google Chrome</p>
                            <p className="text-[#5C7C74] font-normal mt-1">Settings → Privacy and Security → Cookies and other site data</p>
                        </div>
                        <div className="p-3 bg-[#F7FAF9] rounded-xl border border-[#D4E4DF]">
                            <p className="font-bold text-[#1F7A56]">Mozilla Firefox</p>
                            <p className="text-[#5C7C74] font-normal mt-1">Settings → Privacy & Security → Enhanced Tracking Protection</p>
                        </div>
                        <div className="p-3 bg-[#F7FAF9] rounded-xl border border-[#D4E4DF]">
                            <p className="font-bold text-[#1F7A56]">Apple Safari</p>
                            <p className="text-[#5C7C74] font-normal mt-1">Preferences → Privacy → Block all cookies</p>
                        </div>
                        <div className="p-3 bg-[#F7FAF9] rounded-xl border border-[#D4E4DF]">
                            <p className="font-bold text-[#1F7A56]">Microsoft Edge</p>
                            <p className="text-[#5C7C74] font-normal mt-1">Settings → Cookies and site permissions → Manage cookies</p>
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section className="bg-white border border-[#D4E4DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-3">
                    <h2 className="font-heading text-2xl font-bold text-[#1A3C34]">Questions About Cookie Practices?</h2>
                    <p className="text-sm text-[#5C7C74] font-medium leading-relaxed">
                        If you have questions regarding our use of cookies, tracking technologies, or data protection practices under India's Digital Personal Data Protection Act, please contact our designated Grievance Officer at{' '}
                        <a href="mailto:grievance@appointory.in" className="text-[#1F7A56] font-bold underline hover:text-[#2D9B6F]">
                            grievance@appointory.in
                        </a>{' '}
                        or visit our{' '}
                        <Link to="/contact" className="text-[#1F7A56] font-bold underline hover:text-[#2D9B6F]">
                            Support Hub
                        </Link>.
                    </p>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default CookiePolicy;
