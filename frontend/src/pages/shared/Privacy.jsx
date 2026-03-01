import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer';

const Privacy = () => {
    const privacyImages = useMemo(
        () => [
            {
                title: 'Secure Digital Health',
                caption: 'Secure care starts with secure data handling',
                alt: 'Doctor reviewing digital healthcare information',
                src: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=80'
            },
            {
                title: 'Protected Patient Data',
                caption: 'Role-based access keeps records visible only to authorized teams',
                alt: 'Healthcare professional using tablet with patient data',
                src: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1600&q=80'
            },
            {
                title: 'Reliable Infrastructure',
                caption: 'Strong systems help maintain trust and continuity of care',
                alt: 'Hospital corridor with modern digital systems',
                src: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1600&q=80'
            },
            {
                title: 'Compliance Focused',
                caption: 'Compliance-first workflows reduce data exposure risks',
                alt: 'Team reviewing compliance and privacy checklist',
                src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80'
            },
            {
                title: 'Patient Trust',
                caption: 'Transparent privacy practices build long-term patient trust',
                alt: 'Patient consulting with doctor in modern clinic',
                src: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=1600&q=80'
            }
        ],
        []
    );
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const activeImage = privacyImages[activeImageIndex];

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
                                Privacy First
                            </span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                            <div>
                                <p className="text-white font-heading text-2xl md:text-3xl drop-shadow-lg">{activeImage.title}</p>
                                <p className="text-white/90 text-xs md:text-sm font-semibold mt-1">Safe and responsible health data management</p>
                            </div>
                        </div>
                        <p className="absolute bottom-4 left-4 right-4 text-white text-xs md:text-sm font-black uppercase tracking-widest">
                            {activeImage.caption}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {privacyImages.map((image, index) => (
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
