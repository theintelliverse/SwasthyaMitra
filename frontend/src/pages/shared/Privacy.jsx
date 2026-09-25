import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, FileText, UserCheck, AlertTriangle, HelpCircle, Eye, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';

const Privacy = () => {
    const lastUpdated = 'September 2026';

    const dpdpPrinciples = [
        {
            title: 'Lawful & Transparent Processing',
            desc: 'Personal and sensitive health data is processed solely with explicit consent or under lawful grounds defined by Section 6 & 7 of India’s DPDP Act, 2023.'
        },
        {
            title: 'Strict Purpose Limitation',
            desc: 'Data is collected only to facilitate outpatient clinic queues, digital prescriptions, lab report delivery, and patient health locker access.'
        },
        {
            title: 'Data Minimization',
            desc: 'We never collect unnecessary biometric, financial, or behavioral tracking information beyond what clinical care delivery strictly requires.'
        },
        {
            title: 'Statutory Retention Integrity',
            desc: 'Clinical OPD records and digital prescriptions are preserved for statutory minimum periods (e.g. 3 years under NMC regulations) before secure archival or purging.'
        }
    ];

    const sections = [
        {
            id: 'identity',
            title: '1. Identity of the Data Fiduciary',
            content: (
                <div className="space-y-3">
                    <p>
                        This Privacy Policy is issued by <strong>The Intelliverse</strong> ("Appointory", "we", "us", or "our"), operating the Appointory digital clinical management system and patient health vault at <a href="https://appointory.in" className="text-[#1F7A56] underline font-bold">https://appointory.in</a>.
                    </p>
                    <p>
                        Under the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act, 2023)</strong> and the <strong>Information Technology Act, 2000</strong> read with the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI Rules), The Intelliverse functions as a <strong>Data Fiduciary</strong> in respect of platform account records and as a technical service provider facilitating data processing between patients (Data Principals), healthcare providers (clinics, doctors, staff), and independent diagnostic laboratories.
                    </p>
                </div>
            )
        },
        {
            id: 'data-collected',
            title: '2. Personal and Health Data We Collect',
            content: (
                <div className="space-y-3">
                    <p>
                        We strictly adhere to the principle of <strong>Data Minimization</strong>. We collect and process only the minimum information necessary to provide clinical management services:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-[#5C7C74]">
                        <li>
                            <strong className="text-[#1A3C34]">Patient Information:</strong> Full name, mobile phone number (for OTP authentication and real-time queue SMS telemetry), age, gender, optional blood group, and emergency contact details if voluntarily provided.
                        </li>
                        <li>
                            <strong className="text-[#1A3C34]">Clinical & Diagnostic Data:</strong> Outpatient consultation notes, chief complaints, digital prescriptions (Rx) created by treating physicians, vital signs recorded at reception, and diagnostic laboratory investigation requests/reports uploaded by accredited pathology centers.
                        </li>
                        <li>
                            <strong className="text-[#1A3C34]">Healthcare Practitioner & Facility Records:</strong> Doctor full name, qualifications, State Medical Council / National Medical Commission (NMC) registration license number, clinic operational address, staff login credentials, and clinic tax identification (GSTIN) for billing invoices.
                        </li>
                        <li>
                            <strong className="text-[#1A3C34]">Technical & Security Audit Logs:</strong> IP address, browser type, device information, timestamp of login/OTP requests, and audit trail of token progression to ensure forensic accountability and prevent unauthorized access.
                        </li>
                    </ul>
                </div>
            )
        },
        {
            id: 'lawful-grounds',
            title: '3. Lawful Basis for Processing (DPDP Act 2023)',
            content: (
                <div className="space-y-3">
                    <p>
                        Under the DPDP Act 2023, personal data is processed strictly on the following lawful grounds:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-[#5C7C74]">
                        <li>
                            <strong className="text-[#1A3C34]">Explicit Consent (Section 6):</strong> Freely given, specific, informed, unconditional, and unambiguous consent obtained prior to account creation, appointment check-in, or health locker access. You have the right to withdraw consent at any time.
                        </li>
                        <li>
                            <strong className="text-[#1A3C34]">Legitimate Uses (Section 7):</strong> Processing necessary for medical emergencies, disease outbreaks, responding to legal compliance mandates, or enforcing system security against data theft.
                        </li>
                    </ul>
                </div>
            )
        },
        {
            id: 'purpose-limitation',
            title: '4. Purpose Limitation & Strict Non-Monetization',
            content: (
                <div className="space-y-3">
                    <p>
                        Your health and personal data is used solely to power clinical operations, predict OPD waiting room times, coordinate connected diagnostic lab requests, and provide you with a lifetime digital health locker.
                    </p>
                    <div className="p-4 bg-emerald-50 border-l-4 border-[#2D9B6F] rounded-r-xl">
                        <p className="font-bold text-[#1A3C34] text-sm">
                            🛡️ Our Absolute Commitment: We Never Sell or Monetize Health Data
                        </p>
                        <p className="text-xs text-[#5C7C74] mt-1">
                            Appointory has NEVER sold, rented, leased, or disclosed, and will NEVER sell, rent, lease, or disclose patient medical records, contact information, or diagnostic reports to insurance companies, pharmaceutical marketers, advertising networks, or data brokers.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'data-principal-rights',
            title: '5. Data Principal Rights under India’s DPDP Act',
            content: (
                <div className="space-y-3">
                    <p>
                        As a Data Principal, you enjoy statutory rights guaranteed under Chapter III of the DPDP Act 2023:
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-[#F7FAF9] rounded-xl border border-[#D4E4DF]">
                            <p className="font-bold text-[#1F7A56] text-sm">Right to Access (Sec. 11)</p>
                            <p className="text-xs text-[#5C7C74] mt-1">Request a complete summary of your personal data processed by Appointory and the identities of all clinics or labs with whom it has been shared.</p>
                        </div>
                        <div className="p-3 bg-[#F7FAF9] rounded-xl border border-[#D4E4DF]">
                            <p className="font-bold text-[#1F7A56] text-sm">Right to Correction (Sec. 12)</p>
                            <p className="text-xs text-[#5C7C74] mt-1">Correct, complete, or update any inaccurate, outdated, or misleading demographic or contact information.</p>
                        </div>
                        <div className="p-3 bg-[#F7FAF9] rounded-xl border border-[#D4E4DF]">
                            <p className="font-bold text-[#1F7A56] text-sm">Right to Erasure (Sec. 12)</p>
                            <p className="text-xs text-[#5C7C74] mt-1">Request deletion of non-statutory personal data when purpose is fulfilled, subject to mandatory medical record retention laws.</p>
                        </div>
                        <div className="p-3 bg-[#F7FAF9] rounded-xl border border-[#D4E4DF]">
                            <p className="font-bold text-[#1F7A56] text-sm">Right of Grievance Redressal (Sec. 13)</p>
                            <p className="text-xs text-[#5C7C74] mt-1">Access an expedited grievance redressal mechanism with statutory resolution timelines.</p>
                        </div>
                        <div className="p-3 bg-[#F7FAF9] rounded-xl border border-[#D4E4DF]">
                            <p className="font-bold text-[#1F7A56] text-sm">Right to Nominate (Sec. 14)</p>
                            <p className="text-xs text-[#5C7C74] mt-1">Nominate any individual who shall, in the event of your death or incapacity, exercise your Data Principal rights.</p>
                        </div>
                        <div className="p-3 bg-[#F7FAF9] rounded-xl border border-[#D4E4DF]">
                            <p className="font-bold text-[#1F7A56] text-sm">Right to Withdraw Consent (Sec. 6)</p>
                            <p className="text-xs text-[#5C7C74] mt-1">Withdraw consent previously granted as easily as it was given, with immediate cessation of non-statutory data processing.</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'retention',
            title: '6. Retention of Clinical and Health Records',
            content: (
                <div className="space-y-3">
                    <p>
                        Under regulations issued by the <strong>National Medical Commission (NMC)</strong>, the <strong>Medical Council of India (MCI) Code of Medical Ethics</strong>, and the <strong>Clinical Establishments (Registration and Regulation) Act</strong>, medical practitioners and clinics are statutorily required to maintain patient medical consultation records and prescriptions for a minimum period of <strong>three (3) years</strong> from the date of consultation.
                    </p>
                    <p>
                        Accordingly, while account credentials and marketing preferences can be deleted immediately upon request, clinical consultation records and digital prescriptions are archived in an encrypted, read-only audit vault until the statutory retention threshold expires, following which they are securely wiped.
                    </p>
                </div>
            )
        },
        {
            id: 'children',
            title: '7. Processing Data of Children (Section 9 DPDP Act)',
            content: (
                <div className="space-y-3">
                    <p>
                        In strict compliance with <strong>Section 9 of the DPDP Act 2023</strong>:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-[#5C7C74]">
                        <li>
                            Any processing of personal data relating to a child (an individual below eighteen years of age) requires <strong>verifiable consent</strong> of the parent or lawful guardian.
                        </li>
                        <li>
                            We never undertake tracking or behavioral monitoring of children, nor do we serve targeted advertisements directed at minors.
                        </li>
                        <li>
                            Parents or legal guardians may access, verify, or request the correction/deletion of their child’s records by contacting our Grievance Officer.
                        </li>
                    </ul>
                </div>
            )
        },
        {
            id: 'security-measures',
            title: '8. Technical and Organizational Security Safeguards',
            content: (
                <div className="space-y-3">
                    <p>
                        Under <strong>Section 8(5) of the DPDP Act 2023</strong>, we implement reasonable security safeguards to prevent personal data breaches:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-[#5C7C74]">
                        <li>
                            <strong className="text-[#1A3C34]">Military-Grade Encryption:</strong> Patient health vault records and diagnostic attachments are protected using AES-256 GCM encryption at rest and TLS 1.3 encryption in transit.
                        </li>
                        <li>
                            <strong className="text-[#1A3C34]">Two-Factor OTP Security:</strong> Sensitive patient health records cannot be opened without dynamic one-time password (OTP) authorization dispatched to the registered mobile number.
                        </li>
                        <li>
                            <strong className="text-[#1A3C34]">Role-Based Access Control (RBAC):</strong> Clinic receptionists cannot view private doctor clinical consultation notes; doctors can only access records of patients registered under their consultation cabin; independent labs can only access test orders matched through secure 6-digit handshake codes.
                        </li>
                        <li>
                            <strong className="text-[#1A3C34]">Data Breach Notification:</strong> In the event of an identified personal data breach, Appointory will promptly notify the <strong>Data Protection Board of India (DPBI)</strong> and all affected Data Principals in the prescribed manner and format.
                        </li>
                    </ul>
                </div>
            )
        },
        {
            id: 'grievance',
            title: '9. Grievance Redressal Mechanism & Officer',
            content: (
                <div className="space-y-4">
                    <p>
                        In accordance with <strong>Section 13 of the DPDP Act 2023</strong> and the <strong>Information Technology Rules</strong>, Appointory has appointed a designated Grievance Redressal Officer.
                    </p>
                    <div className="bg-[#F7FAF9] border border-[#D4E4DF] rounded-2xl p-5 space-y-3">
                        <div className="grid sm:grid-cols-2 gap-4 text-xs font-semibold text-[#1A3C34]">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#5C7C74]">Designated Grievance Officer</p>
                                <p className="text-sm font-bold text-[#1A3C34] mt-0.5">Grievance & Privacy Officer</p>
                                <p className="text-[#5C7C74] font-normal mt-0.5">The Intelliverse (Appointory Healthcare OS)</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#5C7C74]">Grievance Contact Email</p>
                                <a href="mailto:grievance@appointory.in" className="text-sm font-bold text-[#1F7A56] hover:underline mt-0.5 block">
                                    grievance@appointory.in
                                </a>
                                <p className="text-[#5C7C74] font-normal mt-0.5">Alternate: theintelliverse@gmail.com</p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-[#D4E4DF] text-xs text-[#5C7C74] space-y-1">
                            <p><strong>Statutory Timelines:</strong> Acknowledgment within <strong>48 hours</strong>; substantive resolution within <strong>30 calendar days</strong>.</p>
                            <p><strong>Appeals & Escalation:</strong> If your grievance is not resolved to your satisfaction within 30 days, you have the statutory right to file a complaint before the <strong>Data Protection Board of India (DPBI)</strong>.</p>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-[#F7FAF9] font-body text-[#1A3C34] flex flex-col">
            <SEO
                title="Privacy Policy"
                description="Read the comprehensive Privacy Policy of Appointory. Fully compliant with India's Digital Personal Data Protection Act, 2023 (DPDP Act) and healthcare data security norms."
                url="/privacy"
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
                        <ShieldCheck size={14} />
                        DPDP Act 2023 Compliant
                    </div>

                    <h1 className="font-heading text-3xl md:text-5xl font-black text-[#1A3C34] tracking-tight leading-tight mb-4">
                        Privacy <span className="text-[#2D9B6F]">Policy</span>
                    </h1>

                    <p className="text-base text-[#5C7C74] font-medium leading-relaxed max-w-3xl">
                        At Appointory, your health information is treated with the utmost dignity, confidentiality, and technical protection. This Privacy Policy details our practices under India’s Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology Act, 2000.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-[#D4E4DF]/60 text-xs font-bold uppercase tracking-wider text-[#5C7C74]">
                        <span className="bg-[#F7FAF9] border border-[#D4E4DF] px-3 py-1.5 rounded-full">
                            Last Updated: {lastUpdated}
                        </span>
                        <span className="bg-[#F7FAF9] border border-[#D4E4DF] px-3 py-1.5 rounded-full">
                            Data Fiduciary: The Intelliverse
                        </span>
                        <span className="bg-[#F7FAF9] border border-[#D4E4DF] px-3 py-1.5 rounded-full">
                            Jurisdiction: Republic of India
                        </span>
                    </div>
                </div>

                {/* Core Principles Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {dpdpPrinciples.map((item) => (
                        <div key={item.title} className="bg-white border border-[#D4E4DF] p-5 rounded-2xl shadow-xs">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1F7A56] flex items-center justify-center mb-3">
                                <CheckCircle2 size={18} />
                            </div>
                            <h2 className="text-sm font-bold text-[#1A3C34] mb-1">{item.title}</h2>
                            <p className="text-xs text-[#5C7C74] leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Policy Sections */}
                <div className="space-y-6">
                    {sections.map((section) => (
                        <section
                            key={section.id}
                            id={`privacy-${section.id}`}
                            className="bg-white border border-[#D4E4DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-4 hover:border-[#2D9B6F]/50 transition-colors"
                        >
                            <h2 className="font-heading text-xl md:text-2xl font-bold text-[#1A3C34] pb-3 border-b border-[#D4E4DF]/60">
                                {section.title}
                            </h2>
                            <div className="text-sm md:text-base leading-relaxed text-[#5C7C74]">
                                {section.content}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Grievance Action Card */}
                <section className="bg-white border border-[#D4E4DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-3">
                    <h2 className="font-heading text-2xl font-bold text-[#1A3C34]">Exercise Your Data Rights</h2>
                    <p className="text-sm text-[#5C7C74] font-medium leading-relaxed">
                        To submit a data access request, correct your records, withdraw consent, or file a privacy inquiry, please email our Grievance Officer at{' '}
                        <a href="mailto:grievance@appointory.in" className="text-[#1F7A56] font-bold underline hover:text-[#2D9B6F]">
                            grievance@appointory.in
                        </a>{' '}
                        or use our{' '}
                        <Link to="/contact" className="text-[#1F7A56] font-bold underline hover:text-[#2D9B6F]">
                            Direct Support Form
                        </Link>.
                    </p>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Privacy;
