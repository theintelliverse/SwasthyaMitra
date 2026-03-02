import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Footer from '../../components/Footer';
const API_URL = import.meta.env.VITE_API_URL;

const initialForm = {
    name: '',
    email: '',
    subject: '',
    message: ''
};

const Contact = () => {
    const [formData, setFormData] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', text: '' });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setFeedback({ type: '', text: '' });

        try {
            const response = await axios.post(`${API_URL}/api/contact`, formData);

            if (response.data?.success) {
                setFeedback({ type: 'success', text: 'Your message has been sent successfully.' });
                setFormData(initialForm);
            } else {
                setFeedback({ type: 'error', text: 'Unable to send your message. Please try again.' });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Unable to send your message. Please try again.';
            setFeedback({ type: 'error', text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-parchment font-body text-teak flex flex-col">
            <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full border-b border-sandstone/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-marigold rounded-xl flex items-center justify-center shadow-lg shadow-marigold/20">
                        <span className="text-white font-heading text-2xl">A</span>
                    </div>
                    <h1 className="font-heading text-2xl tracking-tight hidden sm:block">Appointory</h1>
                </div>
                <Link
                    to="/"
                    className="px-6 py-2.5 bg-teak text-parchment rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-marigold transition-all"
                >
                    Back to Home
                </Link>
            </nav>

            <main className="max-w-5xl mx-auto w-full px-6 py-12 flex-1">
                <div
                    className="relative overflow-hidden rounded-3xl border border-sandstone/50 shadow-sm p-8 md:p-10"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1600&q=80')", backgroundSize: 'cover', backgroundPosition: 'center 30%' }}
                >
                    <div className="absolute inset-0 bg-teak/55"></div>

                    <div className="relative bg-transparent border border-parchment/90 rounded-3xl p-6 md:p-8 backdrop-blur-lg shadow-2xl shadow-teak/40">
                        <p className="text-[10px] font-black uppercase tracking-widest text-parchment mb-2">Support</p>
                        <h2 className="font-heading text-4xl leading-tight italic mb-2 text-parchment drop-shadow-sm">
                            Contact <span className="text-marigold not-italic">Us</span>
                        </h2>
                        <p className="text-parchment font-medium mb-8">
                            Send your query and our team will get back to you on email.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-parchment/95">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-parchment/90 rounded-xl px-4 py-3 outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30 bg-transparent text-parchment placeholder:text-sandstone"
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-parchment/95">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-parchment/90 rounded-xl px-4 py-3 outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30 bg-transparent text-parchment placeholder:text-sandstone"
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-parchment/95">Subject</label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-parchment/90 rounded-xl px-4 py-3 outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30 bg-transparent text-parchment placeholder:text-sandstone"
                                    placeholder="Enter the subject"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-parchment/95">Message</label>
                                <textarea
                                    name="message"
                                    rows="6"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-parchment/90 rounded-xl px-4 py-3 outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30 bg-transparent text-parchment placeholder:text-sandstone resize-none"
                                    placeholder="Write your message"
                                />
                            </div>

                            {feedback.text && (
                                <div
                                    className={`rounded-xl px-4 py-3 text-sm font-semibold ${feedback.type === 'success' ? 'bg-transparent text-parchment border border-marigold/80' : 'bg-transparent text-red-100 border border-red-300/90'
                                        }`}
                                >
                                    {feedback.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="min-w-44 px-8 py-3 bg-teak border border-parchment/40 text-parchment rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-saffron hover:border-parchment/60 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                            >
                                {loading ? (
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full border-2 border-parchment/90 border-t-transparent animate-spin"></span>
                                        Sending...
                                    </span>
                                ) : (
                                    'Send Message'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Contact;
