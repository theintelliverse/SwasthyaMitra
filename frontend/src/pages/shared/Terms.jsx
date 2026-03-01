import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer';

const Terms = () => {
    const sections = [
        {
            title: 'Platform Usage',
            content:
                'Swasthya-Mitra is provided to support clinic operations and patient access to records. Users must provide accurate details and use the platform only for lawful healthcare-related purposes.'
        },
        {
            title: 'Account Responsibility',
            content:
                'Staff and patient users are responsible for maintaining account security, including OTP privacy and password confidentiality. Unauthorized usage, misuse, or impersonation is strictly prohibited.'
        },
        {
            title: 'Service Availability',
            content:
                'We aim for reliable uptime but may occasionally perform maintenance, updates, or emergency changes. Temporary interruptions may occur without prior notice when needed to protect platform integrity.'
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
                        <h2 className="font-heading text-4xl md:text-5xl mb-3">Terms of Service</h2>
                        <p className="text-sm md:text-base text-khaki font-medium leading-relaxed max-w-3xl">
                            These terms define expected usage, responsibilities, and service behavior for all platform users.
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
                        <h3 className="font-heading text-2xl text-teak mb-2">Support and Questions</h3>
                        <p className="text-sm md:text-base leading-relaxed text-khaki font-medium">
                            If you have any questions about these terms, reach out through the
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

export default Terms;
