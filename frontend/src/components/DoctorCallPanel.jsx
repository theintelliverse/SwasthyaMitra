import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Phone, MessageCircle, Loader } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const DoctorCallPanel = ({ patientPhone, patientName, clinicName }) => {
    const [loading, setLoading] = useState(false);
    const [reminderTimings, setReminderTimings] = useState([5, 10, 15]);
    const [customNotes, setCustomNotes] = useState('');

    const handleTimingToggle = (minutes) => {
        setReminderTimings(prev =>
            prev.includes(minutes)
                ? prev.filter(m => m !== minutes)
                : [...prev, minutes].sort((a, b) => a - b)
        );
    };

    const handleInitiateCall = async () => {
        if (!patientPhone) {
            Swal.fire('Error', 'Patient phone number is required', 'error');
            return;
        }

        if (reminderTimings.length === 0) {
            Swal.fire('Error', 'Select at least one reminder timing', 'error');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/call/initiate-call`,
                {
                    patientPhone,
                    patientName,
                    reminderTimings: reminderTimings.sort((a, b) => a - b),
                    notes: customNotes || null
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Call Notification Sent!',
                    html: `
                        <div style="text-align: left; font-size: 14px;">
                            <p><strong>Patient:</strong> ${patientName}</p>
                            <p><strong>Phone:</strong> ${patientPhone}</p>
                            <p><strong>Reminders at:</strong> ${reminderTimings.join(', ')} minutes</p>
                            <p style="color: #666; margin-top: 10px;">
                                WhatsApp message sent successfully. You'll receive notifications when the patient responds.
                            </p>
                        </div>
                    `,
                    confirmButtonText: 'OK',
                    background: '#EEF6FA',
                    color: '#0F766E'
                });

                // Reset form
                setCustomNotes('');
                setReminderTimings([5, 10, 15]);
            } else {
                Swal.fire('Error', response.data.message || 'Failed to send call notification', 'error');
            }
        } catch (error) {
            console.error('Call initiation error:', error);
            Swal.fire(
                'Error',
                error.response?.data?.message || 'Failed to initiate call',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            background: '#F8F9FA',
            border: '1px solid #E8DDCB',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <Phone size={24} style={{ color: '#FFA800' }} />
                <h3 style={{ margin: 0, color: '#422D0B' }}>Initiate Patient Call</h3>
            </div>

            {/* Patient Info Display */}
            <div style={{
                background: 'white',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '15px',
                borderLeft: '4px solid #FFA800'
            }}>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Patient:</strong> {patientName || 'Unknown'}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Phone:</strong> {patientPhone || 'Not provided'}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Clinic:</strong> {clinicName || 'Default'}
                </p>
            </div>

            {/* Reminder Timing Selection */}
            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#422D0B' }}>
                    Reminder Timings (Minutes)
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[5, 10, 15].map(minutes => (
                        <button
                            key={minutes}
                            onClick={() => handleTimingToggle(minutes)}
                            style={{
                                padding: '8px 15px',
                                border: reminderTimings.includes(minutes) ? '2px solid #FFA800' : '2px solid #DDD',
                                background: reminderTimings.includes(minutes) ? '#FFA80020' : 'white',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: reminderTimings.includes(minutes) ? '#FFA800' : '#666',
                                fontWeight: reminderTimings.includes(minutes) ? 'bold' : 'normal',
                                fontSize: '14px',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {minutes} min
                        </button>
                    ))}
                </div>
                <small style={{ color: '#967A53', marginTop: '8px', display: 'block' }}>
                    Select when to send reminders. Patient will receive WhatsApp notifications at these intervals.
                </small>
            </div>

            {/* Custom Notes */}
            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#422D0B' }}>
                    Additional Notes (Optional)
                </label>
                <textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="e.g., 'Mandatory for prescription collection' or 'For lab report review'"
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #E8DDCB',
                        fontFamily: 'sans-serif',
                        fontSize: '14px',
                        minHeight: '60px',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* Call Initiation Button */}
            <button
                onClick={handleInitiateCall}
                disabled={loading || !patientPhone}
                className={loading ? 'doctor-call-btn-loading' : 'doctor-call-btn'}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: loading ? '#CCC' : '#FFA800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'background 0.3s ease'
                }}
            >
                {loading ? (
                    <>
                        <Loader size={18} className="spinner-icon" />
                        Sending...
                    </>
                ) : (
                    <>
                        <MessageCircle size={18} />
                        Send WhatsApp & Reminders
                    </>
                )}
            </button>

            <style>{`
                .spinner-icon {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .doctor-call-btn:hover:not(:disabled) {
                    background: #FF9500 !important;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(255, 168, 0, 0.3);
                }
            `}</style>
        </div>
    );
};

export default DoctorCallPanel;
