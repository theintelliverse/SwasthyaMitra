import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer';

const Terms = () => {
    const termsImages = useMemo(
        () => [
            {
                title: 'Transparency First',
                caption: 'Clear terms help everyone use the platform responsibly',
                alt: 'Reading terms and agreement documents',
                src: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80'
            },
            {
                title: 'Responsible Access',
                caption: 'Account responsibilities protect clinics and patients equally',
                alt: 'Healthcare admin reviewing policy checklist',
                src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80'
            },
            {
                title: 'Reliable Service',
                caption: 'Planned updates and uptime care support safe daily operations',
                alt: 'Team discussing operational service standards',
                src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80'
            },
            {
                title: 'Clear Agreements',
                caption: 'Well-defined policies make usage expectations easy to follow',
                alt: 'Close-up of agreement pages and signatures',
                src: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1600&q=80'
            },
            {
                title: 'Ethical Operations',
                caption: 'Responsible conduct keeps healthcare collaboration trustworthy',
                alt: 'Healthcare professionals discussing operations',
                src: 'https://images.unsplash.com/photo-1571772996211-2f02c9727629?auto=format&fit=crop&w=1600&q=80'
            }
        ],
        []
    );
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const activeImage = termsImages[activeImageIndex];

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

                    <div className="relative overflow-hidden rounded-2xl border border-sandstone/70 h-56 md:h-72">
                        <img
                            src={activeImage.src}
                            alt={activeImage.alt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-teak/80 via-teak/35 to-transparent"></div>
                        <div className="absolute top-4 left-4">
                            <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                Terms Overview
                            </span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                            <div>
                                <p className="text-white font-heading text-2xl md:text-3xl drop-shadow-lg">{activeImage.title}</p>
                                <p className="text-white/90 text-xs md:text-sm font-semibold mt-1">Guidelines for safe and fair platform use</p>
                            </div>
                        </div>
                        <p className="absolute bottom-4 left-4 right-4 text-white text-xs md:text-sm font-black uppercase tracking-widest">
                            {activeImage.caption}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {termsImages.map((image, index) => (
                            <button
                                key={image.title}
                                type="button"
                                onClick={() => setActiveImageIndex(index)}
                                className={`text-left rounded-2xl border p-3 transition-all ${activeImageIndex === index
                                    ? 'border-marigold bg-marigold/10'
                                    : 'border-sandstone/70 bg-parchment/50 hover:border-marigold/60'
                                    }`}
                            >
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="w-full h-16 object-cover rounded-xl mb-2"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                />
                                <p className="text-[10px] font-black uppercase tracking-widest text-teak">{image.title}</p>
                            </button>
                        ))}
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
