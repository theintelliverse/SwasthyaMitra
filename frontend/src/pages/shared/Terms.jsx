import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, AlertOctagon, Stethoscope, Scale, FileText, Lock, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';

const Terms = () => {
    const lastUpdated = 'September 2026';

    const termsSections = [
        {
            id: 'intermediary-disclaimer',
            title: '1. Platform Nature & Intermediary Status (Section 79 IT Act)',
            icon: Scale,
            content: (
                <div className="space-y-3">
                    <p>
                        Appointory is an advanced clinical management operating system and digital health locker developed and operated by <strong>The Intelliverse</strong> ("Appointory", "we", "us", or "our").
                    </p>
                    <p>
                        Appointory functions solely as an <strong>"Intermediary"</strong> as defined under <strong>Section 2(1)(w) of the Information Technology Act, 2000</strong>. Appointory provides technology infrastructure enabling outpatient clinics, registered medical practitioners, diagnostic pathology laboratories, and patients to streamline queues, share digital prescriptions, manage diagnostic referrals, and access encrypted electronic health vaults.
                    </p>
                    <div className="p-4 bg-amber-50 border-l-4 border-amber-600 rounded-r-xl text-[#1A3C34] text-sm">
                        <strong className="block text-amber-900 font-bold mb-1">CRITICAL MEDICAL DISCLAIMER: NOT A HEALTHCARE PROVIDER</strong>
                        Appointory is NOT a hospital, clinic, nursing home, pharmacy, or diagnostic laboratory. Appointory does not practice medicine, provide medical advice, dispense clinical diagnoses, prescribe medications, or deliver treatment. No communication through Appointory shall be construed as the provision of medical advice by Appointory.
                    </div>
                </div>
            )
        },
        {
            id: 'emergency-warning',
            title: '2. Emergency Medical Disclaimer — Do Not Use in Emergencies',
            icon: AlertOctagon,
            content: (
                <div className="space-y-3">
                    <div className="p-5 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-950 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-base text-rose-800">
                            <AlertOctagon size={20} />
                            <span>DO NOT USE APPOINTORY FOR MEDICAL EMERGENCIES</span>
                        </div>
                        <p className="text-sm leading-relaxed">
                            Appointory is designed for scheduled outpatient visits and queue tracking. It is <strong>NOT</strong> an emergency medical dispatch or emergency response system.
                        </p>
                        <p className="text-sm font-semibold">
                            If you or someone under your care is experiencing a medical emergency, severe chest pain, shortness of breath, sudden numbness, uncontrolled bleeding, severe trauma, or any life-threatening symptoms, immediately dial <strong className="text-rose-700 font-black">112 or 108 (National Emergency Helpline India)</strong> or proceed immediately to the nearest hospital emergency room.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'doctor-patient-relationship',
            title: '3. Independent Doctor-Patient Relationship & Clinical Liability',
            icon: Stethoscope,
            content: (
                <div className="space-y-3">
                    <p>
                        Any clinical consultation, physical examination, diagnostic assessment, advice, or prescription generated through Appointory establishes a direct, independent relationship solely between the treating <strong>Registered Medical Practitioner (RMP) / Clinical Establishment</strong> and the <strong>Patient</strong>.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-[#5C7C74]">
                        <li>
                            <strong className="text-[#1A3C34]">No Endorsement:</strong> The listing of any doctor, clinic, or diagnostic laboratory on Appointory does not constitute an endorsement, recommendation, or warranty of medical competence by Appointory.
                        </li>
                        <li>
                            <strong className="text-[#1A3C34]">Doctor Obligations:</strong> Practitioners utilizing the platform represent and warrant that they hold valid registration with the National Medical Commission (NMC) or relevant State Medical Council, and that their practice complies with the <em>Telemedicine Practice Guidelines, 2020</em> and the <em>NMC Code of Medical Ethics</em>.
                        </li>
                        <li>
                            <strong className="text-[#1A3C34]">Limitation of Clinical Liability:</strong> Under no circumstances shall Appointory or The Intelliverse be liable for any misdiagnosis, medical error, clinical negligence, adverse drug reactions, treatment outcomes, or failure to render timely medical attention by any treating clinician or healthcare facility.
                        </li>
                    </ul>
                </div>
            )
        },
        {
            id: 'diagnostic-labs',
            title: '4. Independent Diagnostic Laboratories',
            icon: FileText,
            content: (
                <div className="space-y-3">
                    <p>
                        Pathology laboratories linked via Appointory's 6-digit connection codes are independent diagnostic entities.
                    </p>
                    <p>
                        Each laboratory is solely responsible for biological specimen collection protocols, laboratory safety standards, calibration of diagnostic analyzers, and the professional interpretation and sign-off of pathology reports. Appointory acts purely as an encrypted transit conduit for laboratory requisitions and digital report PDFs.
                    </p>
                </div>
            )
        },
        {
            id: 'account-security',
            title: '5. Account Responsibilities & Health Locker Security',
            icon: Lock,
            content: (
                <div className="space-y-3">
                    <p>
                        Access to patient health lockers and clinical administrative dashboards is governed by authenticated credentials and dynamic One-Time Passwords (OTPs):
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-[#5C7C74]">
                        <li>
                            Users are strictly responsible for maintaining the confidentiality of their passwords and mobile OTPs.
                        </li>
                        <li>
                            Appointory personnel will <strong>NEVER</strong> call or message you asking for your account password or health locker OTP. Any such request is fraudulent and should be reported to our Grievance Officer immediately.
                        </li>
                        <li>
                            You agree to immediately notify Appointory if you detect or suspect any unauthorized access to your account or patient records.
                        </li>
                    </ul>
                </div>
            )
        },
        {
            id: 'prohibited-activities',
            title: '6. Prohibited Activities & Account Termination',
            content: (
                <div className="space-y-3">
                    <p>Users shall not engage in any of the following activities on the platform:</p>
                    <ul className="list-disc pl-5 space-y-2 text-[#5C7C74]">
                        <li>Submitting fabricated, forged, or altered medical licenses, prescriptions, or patient identity documents.</li>
                        <li>Attempting unauthorized access to patient health lockers, clinic queues, or administrative dashboards.</li>
                        <li>Reverse engineering, decompiling, or scraping patient registries, doctor lists, or system APIs.</li>
                        <li>Introducing viruses, malicious scripts, or denial-of-service vectors into platform infrastructure.</li>
                    </ul>
                    <p>
                        Appointory reserves the right to immediately suspend or permanently terminate accounts violating these standards and report serious violations to competent law enforcement agencies.
                    </p>
                </div>
            )
        },
        {
            id: 'subscriptions-billing',
            title: '7. Subscriptions, Fees, and Commercial Terms',
            content: (
                <div className="space-y-3">
                    <p>
                        Healthcare establishments (clinics and diagnostic labs) subscribe to software access tiers under agreed subscription terms. All subscription fees are quoted in Indian Rupees (INR) and are subject to applicable Goods and Services Tax (GST).
                    </p>
                    <p>
                        Payment handling, billing cycles, cancellations, and refund qualifications are governed by our separate{' '}
                        <Link to="/refund-policy" className="text-[#1F7A56] font-bold underline hover:text-[#2D9B6F]">
                            Cancellation & Refund Policy
                        </Link>, which forms an integral part of these Terms.
                    </p>
                </div>
            )
        },
        {
            id: 'intellectual-property',
            title: '8. Intellectual Property Rights',
            content: (
                <div className="space-y-3">
                    <p>
                        All software source code, AI prediction models, queue velocity algorithms, user interface designs, logos, graphics, and trade dress associated with Appointory are the exclusive intellectual property of <strong>The Intelliverse</strong> and are protected under Indian Copyright and Trademark laws.
                    </p>
                    <p>
                        Patients retain full ownership of their underlying personal health records and diagnostic reports. Healthcare facilities retain ownership of their proprietary clinic branding.
                    </p>
                </div>
            )
        },
        {
            id: 'liability-indemnity',
            title: '9. Limitation of Liability & Indemnification',
            content: (
                <div className="space-y-3">
                    <p>
                        To the maximum extent permitted under applicable law, in no event shall The Intelliverse, its founders, directors, employees, or contractors be liable for any indirect, incidental, special, punitive, or consequential damages, including loss of profits, data loss, or healthcare complications arising from the use or inability to use the platform.
                    </p>
                    <p>
                        Users agree to defend, indemnify, and hold harmless The Intelliverse from any third-party claims, liabilities, damages, or costs (including legal fees) arising from the user's clinical malpractice, violation of these Terms, or infringement of patient privacy rights.
                    </p>
                </div>
            )
        },
        {
            id: 'governing-law',
            title: '10. Governing Law & Dispute Resolution',
            content: (
                <div className="space-y-3">
                    <p>
                        These Terms and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the laws of the <strong>Republic of India</strong>, without regard to conflict of law principles.
                    </p>
                    <p>
                        Any legal action, suit, or proceeding arising out of these Terms shall be instituted exclusively in the competent courts situated in India.
                    </p>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-[#F7FAF9] font-body text-[#1A3C34] flex flex-col">
            <SEO
                title="Terms of Service"
                description="Terms of Service and User Agreement for Appointory. Details intermediary legal status under Section 79 of IT Act, emergency disclaimers, and healthcare SaaS guidelines."
                url="/terms"
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
                        <Scale size={14} />
                        Legal Agreement & Terms
                    </div>

                    <h1 className="font-heading text-3xl md:text-5xl font-black text-[#1A3C34] tracking-tight leading-tight mb-4">
                        Terms of <span className="text-[#2D9B6F]">Service</span>
                    </h1>

                    <p className="text-base text-[#5C7C74] font-medium leading-relaxed max-w-3xl">
                        Please review these Terms of Service carefully before utilizing Appointory. By accessing or using our platform, clinics, practitioners, laboratories, and patients agree to be bound by these legally enforceable terms and disclaimers.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-[#D4E4DF]/60 text-xs font-bold uppercase tracking-wider text-[#5C7C74]">
                        <span className="bg-[#F7FAF9] border border-[#D4E4DF] px-3 py-1.5 rounded-full">
                            Last Updated: {lastUpdated}
                        </span>
                        <span className="bg-[#F7FAF9] border border-[#D4E4DF] px-3 py-1.5 rounded-full">
                            Platform: The Intelliverse (Appointory)
                        </span>
                        <span className="bg-[#F7FAF9] border border-[#D4E4DF] px-3 py-1.5 rounded-full">
                            Intermediary Status: Section 79 IT Act, 2000
                        </span>
                    </div>
                </div>

                {/* Emergency Alert Banner */}
                <div className="p-5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-4 text-rose-950">
                    <AlertOctagon size={24} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-rose-900">
                            Emergency Notice for All Patients
                        </h2>
                        <p className="text-xs md:text-sm text-rose-900/90 leading-relaxed font-medium">
                            Appointory is strictly for scheduled outpatient visits and medical records storage. In case of acute chest pain, trauma, difficulty breathing, or any critical emergency, call <strong>112 / 108</strong> immediately or proceed directly to an emergency department.
                        </p>
                    </div>
                </div>

                {/* Terms Sections */}
                <div className="space-y-6">
                    {termsSections.map((section) => (
                        <section
                            key={section.id}
                            id={`terms-${section.id}`}
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

                {/* Questions / Contact Box */}
                <section className="bg-white border border-[#D4E4DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-3">
                    <h2 className="font-heading text-2xl font-bold text-[#1A3C34]">Questions Regarding Our Terms?</h2>
                    <p className="text-sm text-[#5C7C74] font-medium leading-relaxed">
                        For legal clarifications, provider agreements, or terms inquiries, please contact our legal desk at{' '}
                        <a href="mailto:theintelliverse@gmail.com" className="text-[#1F7A56] font-bold underline hover:text-[#2D9B6F]">
                            theintelliverse@gmail.com
                        </a>{' '}
                        or write to us through our{' '}
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

export default Terms;
