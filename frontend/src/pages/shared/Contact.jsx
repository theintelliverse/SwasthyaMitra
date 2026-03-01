import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Footer from '../../components/Footer';

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
            const response = await axios.post('http://localhost:5000/api/contact', formData);

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

            <main className="max-w-4xl mx-auto w-full px-6 py-12 flex-1">
                <div className="bg-white border border-sandstone rounded-3xl p-8 md:p-10 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-khaki mb-2">Support</p>
                    <h2 className="font-heading text-4xl mb-2">Contact Us</h2>
                    <p className="text-khaki font-medium mb-8">
                        Send your query and our team will get back to you on email.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-khaki">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-sandstone rounded-xl px-4 py-3 outline-none focus:border-marigold bg-parchment/40"
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-khaki">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-sandstone rounded-xl px-4 py-3 outline-none focus:border-marigold bg-parchment/40"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-khaki">Subject</label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                className="w-full border border-sandstone rounded-xl px-4 py-3 outline-none focus:border-marigold bg-parchment/40"
                                placeholder="Enter the subject"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-khaki">Message</label>
                            <textarea
                                name="message"
                                rows="6"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                className="w-full border border-sandstone rounded-xl px-4 py-3 outline-none focus:border-marigold bg-parchment/40 resize-none"
                                placeholder="Write your message"
                            />
                        </div>

                        {feedback.text && (
                            <div
                                className={`rounded-xl px-4 py-3 text-sm font-semibold ${feedback.type === 'success' ? 'bg-teak/10 text-teak' : 'bg-red-50 text-red-700'
                                    }`}
                            >
                                {feedback.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-marigold text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-teak transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Contact;
