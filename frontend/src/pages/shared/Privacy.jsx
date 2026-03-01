import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer';

const Privacy = () => {
    const sections = [
        {
            title: 'Information We Collect',
            content:
                'Swasthya-Mitra collects information required to provide clinic operations, queue updates, and health-record access. This may include your name, contact details, appointment details, and medical records uploaded by authorized clinic staff.'
        },
        {
            title: 'How We Use Information',
            content:
                'Data is used to manage patient flow, authenticate users, display health history securely, and communicate status updates via approved channels. We only process information that is necessary for care delivery and platform functionality.'
        },
        {
            title: 'Data Security',
            content:
                'We use role-based access controls and secured storage partners to protect sensitive information. Access is limited to authorized users such as patients and verified clinic staff based on account permissions.'
        }
    ];

    return (
        <div className="min-h-screen bg-parchment font-body text-teak flex flex-col">
            <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full border-b border-sandstone/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-marigold rounded-xl flex items-center justify-center shadow-lg shadow-marigold/20">
                        <span className="text-white font-heading text-2xl">S</span>
                    </div>
                    <h1 className="font-heading text-2xl tracking-tight hidden sm:block">Swasthya-Mitra</h1>
                </div>
                <Link
                    to="/"
                    className="px-6 py-2.5 bg-teak text-parchment rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-marigold transition-all"
                >
                    Back to Home
                </Link>
            </nav>

            <main className="max-w-5xl mx-auto w-full px-6 py-12 flex-1">
                <div className="bg-white border border-sandstone rounded-3xl p-8 md:p-10 shadow-sm space-y-8">
                    <div className="rounded-2xl bg-parchment border border-sandstone/70 p-6 md:p-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-khaki mb-2">Legal</p>
                        <h2 className="font-heading text-4xl md:text-5xl mb-3">Privacy Policy</h2>
                        <p className="text-sm md:text-base text-khaki font-medium leading-relaxed max-w-3xl">
                            Your data is handled with care to support secure, fast, and reliable healthcare workflows.
                        </p>
                    </div>

                    <div className="grid gap-4">
                        {sections.map((section) => (
                            <section
                                key={section.title}
                                className="rounded-2xl border border-sandstone/70 bg-parchment/50 p-5 md:p-6"
                            >
                                <h3 className="font-heading text-2xl text-teak mb-2">{section.title}</h3>
                                <p className="text-sm md:text-base leading-relaxed text-khaki font-medium">{section.content}</p>
                            </section>
                        ))}
                    </div>

                    <section className="rounded-2xl border border-sandstone/70 bg-white p-5 md:p-6">
                        <h3 className="font-heading text-2xl text-teak mb-2">Contact for Privacy Requests</h3>
                        <p className="text-sm md:text-base leading-relaxed text-khaki font-medium">
                            For data corrections, access requests, or privacy concerns, please use the
                            <Link to="/contact" className="text-marigold font-bold hover:underline underline-offset-4 ml-1">
                                Contact page
                            </Link>
                            .
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Privacy;
