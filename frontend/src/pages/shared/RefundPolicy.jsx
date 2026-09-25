import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCcw, ShieldCheck, Clock, CreditCard, AlertCircle, CheckCircle2, ArrowLeft, Mail, FileText } from 'lucide-react';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';

const RefundPolicy = () => {
    const lastUpdated = 'September 2026';

    const policySections = [
        {
            id: 'saas-subscriptions',
            title: '1. SaaS Subscriptions (Clinics & Diagnostic Labs)',
            icon: CreditCard,
            content: [
                'Appointory provides tiered cloud software subscriptions for outpatient clinics, polyclinics, and independent diagnostic laboratories to manage queues, digital prescriptions, lab sync, and patient communication.',
                '7-Day Satisfaction Guarantee: For first-time clinic or lab software subscriptions, you may request a full refund within seven (7) calendar days of initial subscription activation if our platform fails to meet your operational requirements.',
                'Subscription Renewals: Monthly and annual recurring subscriptions can be canceled at any time prior to the scheduled renewal billing date via your Clinic or Lab Settings panel. Cancellation prevents future billing cycles from being charged. Once a renewal cycle is billed, existing active periods are generally non-refundable.',
                'Platform Outage & SLA Credits: In the unlikely event of verified, unscheduled platform downtime exceeding 99.0% during any monthly billing cycle, affected facilities may request prorated service credits or subscription extensions by contacting billing support within 14 days of the incident.'
            ]
        },
        {
            id: 'patient-consultations',
            title: '2. Patient Clinic Visits & Consultation Fees',
            icon: Clock,
            content: [
                'Intermediary Model: Appointory is a digital technology platform and electronic health record intermediary. Medical consultation fees are determined, set, and received by independent clinics and registered medical practitioners.',
                'Clinic-Initiated Cancellation: If a clinic or doctor cancels an appointment or is unexpectedly unavailable on the scheduled date, the patient is entitled to either an immediate free rescheduling or a 100% refund of any prepaid consultation fee, processed via the original payment channel.',
                'Patient-Initiated Cancellation: Patients may cancel or reschedule their appointment without penalty up to two (2) hours prior to the scheduled consultation window or before an active OPD queue token has been generated. Once a patient checks in and an active queue token has been called by the clinical cabin, consultation fees become non-refundable.',
                'No-Show Policy: Failure to arrive at the clinic without prior notification during the operating window may result in forfeiture of prepaid booking charges as determined by the respective clinic establishment.'
            ]
        },
        {
            id: 'diagnostic-tests',
            title: '3. Diagnostic Lab Orders & Investigation Fees',
            icon: FileText,
            content: [
                'Pre-Collection Cancellation: If a diagnostic test order is canceled prior to biological sample collection or home sample phlebotomy dispatch, a full refund will be granted minus any nominal payment gateway processing charges.',
                'Post-Collection Processing: Once a biological sample (blood, urine, swab, tissue) has been collected by the phlebotomist or specimen processing has commenced inside the laboratory, fees are strictly non-refundable due to consumable costs, reagent consumption, and specialized pathologist time.',
                'Inconclusive or Erroneous Reports: If a diagnostic investigation cannot be completed due to lab technical errors, sample contamination, or hemolyzed specimens, the connected lab is obligated to provide a complimentary re-test or issue a full refund at the patient\'s discretion.'
            ]
        },
        {
            id: 'refund-timeline',
            title: '4. Refund Processing Timeframes & Methods',
            icon: RefreshCcw,
            content: [
                'Authorized Payment Gateway: All online payments and automated refunds on Appointory are processed securely via Reserve Bank of India (RBI) authorized payment aggregators (including Razorpay Software Private Limited) adhering to PCI-DSS Level 1 compliance.',
                'Standard Timelines: Once approved by our billing team, refunds are initiated immediately. The funds typically reflect in the customer\'s original funding source within five (5) to seven (7) banking business days, depending on the issuing bank and payment rail (UPI, Net Banking, or Credit/Debit Card).',
                'Duplicate or Erroneous Charges: In cases of accidental duplicate payments, network timeouts resulting in double debits, or system processing errors, our automated reconciliation service will reverse the excess debit within 48 to 72 business hours.'
            ]
        },
        {
            id: 'disputes-chargebacks',
            title: '5. Chargebacks & Fair Dispute Resolution',
            icon: AlertCircle,
            content: [
                'Direct Resolution Protocol: We encourage all users (clinics, labs, and patients) to contact our dedicated Billing Support team before raising a formal chargeback or dispute with their card-issuing bank.',
                'Most billing questions, refund requests, or payment discrepancies can be resolved amicably within 24 to 48 hours without administrative banking delays.',
                'Fraudulent chargebacks or disputes initiated in bad faith may result in temporary suspension of facility dashboard access pending investigation.'
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#F7FAF9] font-body text-[#1A3C34] flex flex-col">
            <SEO
                title="Cancellation & Refund Policy"
                description="Review the Cancellation and Refund Policy of Appointory. Transparent terms for clinical SaaS subscriptions, patient consultation cancellations, and diagnostic lab orders."
                url="/refund-policy"
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
                        <RefreshCcw size={14} />
                        Financial Transparency
                    </div>

                    <h1 className="font-heading text-3xl md:text-5xl font-black text-[#1A3C34] tracking-tight leading-tight mb-4">
                        Cancellation & <span className="text-[#2D9B6F]">Refund Policy</span>
                    </h1>

                    <p className="text-base text-[#5C7C74] font-medium leading-relaxed max-w-3xl">
                        At Appointory (operated by The Intelliverse), we are dedicated to providing seamless, transparent, and fair payment experiences for healthcare providers, clinical facilities, diagnostic laboratories, and patients alike. This policy outlines clear guidelines on cancellations, refunds, and chargebacks.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-[#D4E4DF]/60 text-xs font-bold uppercase tracking-wider text-[#5C7C74]">
                        <span className="bg-[#F7FAF9] border border-[#D4E4DF] px-3 py-1.5 rounded-full">
                            Last Updated: {lastUpdated}
                        </span>
                        <span className="bg-[#F7FAF9] border border-[#D4E4DF] px-3 py-1.5 rounded-full">
                            Entity: The Intelliverse (Appointory)
                        </span>
                    </div>
                </div>

                {/* Key Summary Cards */}
                <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-[#D4E4DF] p-5 rounded-2xl shadow-xs">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1F7A56] flex items-center justify-center mb-3">
                            <CheckCircle2 size={20} />
                        </div>
                        <h2 className="text-sm font-bold text-[#1A3C34] mb-1">7-Day SaaS Guarantee</h2>
                        <p className="text-xs text-[#5C7C74] leading-relaxed">
                            Try our clinical management platform with confidence. Full refund within 7 days of initial subscription setup.
                        </p>
                    </div>

                    <div className="bg-white border border-[#D4E4DF] p-5 rounded-2xl shadow-xs">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#1A3C34] flex items-center justify-center mb-3">
                            <Clock size={20} />
                        </div>
                        <h2 className="text-sm font-bold text-[#1A3C34] mb-1">5-7 Business Days</h2>
                        <p className="text-xs text-[#5C7C74] leading-relaxed">
                            Approved refunds are credited directly back to the original source account (UPI, Card, or Bank) via Razorpay.
                        </p>
                    </div>

                    <div className="bg-white border border-[#D4E4DF] p-5 rounded-2xl shadow-xs">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                            <ShieldCheck size={20} />
                        </div>
                        <h2 className="text-sm font-bold text-[#1A3C34] mb-1">Transparent Redressal</h2>
                        <p className="text-xs text-[#5C7C74] leading-relaxed">
                            Dedicated billing assistance team responsive within 24 to 48 hours to handle any duplicate debits or disputes.
                        </p>
                    </div>
                </div>

                {/* Detailed Sections */}
                <div className="space-y-6">
                    {policySections.map((section) => {
                        const IconComponent = section.icon;
                        return (
                            <section
                                key={section.id}
                                id={section.id}
                                className="bg-white border border-[#D4E4DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-4 hover:border-[#2D9B6F]/50 transition-colors"
                            >
                                <div className="flex items-center gap-3 pb-3 border-b border-[#D4E4DF]/60">
                                    <div className="w-10 h-10 rounded-xl bg-[#F7FAF9] border border-[#D4E4DF] text-[#1F7A56] flex items-center justify-center">
                                        <IconComponent size={20} />
                                    </div>
                                    <h2 className="font-heading text-xl md:text-2xl font-bold text-[#1A3C34]">
                                        {section.title}
                                    </h2>
                                </div>

                                <div className="space-y-3">
                                    {section.content.map((paragraph, idx) => (
                                        <p key={idx} className="text-sm md:text-base text-[#5C7C74] font-medium leading-relaxed">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* Billing Support Contact Box */}
                <section className="bg-white border border-[#D4E4DF] rounded-3xl p-6 md:p-8 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1F7A56] flex items-center justify-center">
                            <Mail size={20} />
                        </div>
                        <div>
                            <h2 className="font-heading text-2xl font-bold text-[#1A3C34]">Billing & Refund Support</h2>
                            <p className="text-xs text-[#5C7C74] font-semibold uppercase tracking-wider">Fast-Track Resolution Window</p>
                        </div>
                    </div>

                    <p className="text-sm text-[#5C7C74] font-medium leading-relaxed">
                        To request a refund, report an incorrect billing charge, or inquire regarding subscription cancellation, please write to our billing desk with your Transaction ID, Registered Facility / Mobile Number, and Payment Receipt:
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 rounded-2xl bg-[#F7FAF9] border border-[#D4E4DF]">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#5C7C74]">Billing Support Email</p>
                            <a href="mailto:theintelliverse@gmail.com" className="text-base font-bold text-[#1F7A56] hover:underline mt-1 block">
                                theintelliverse@gmail.com
                            </a>
                            <p className="text-xs text-[#5C7C74] mt-1">Resolution time: 24–48 hours</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#F7FAF9] border border-[#D4E4DF]">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#5C7C74]">Corporate Entity</p>
                            <p className="text-base font-bold text-[#1A3C34] mt-1">The Intelliverse</p>
                            <p className="text-xs text-[#5C7C74] mt-1">Operating Appointory Healthcare OS • India</p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default RefundPolicy;
