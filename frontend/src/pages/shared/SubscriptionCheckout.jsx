import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  CreditCard, ShieldCheck, Ticket, Calendar, ArrowRight,
  TrendingDown, CheckCircle2, ChevronRight, HelpCircle, Loader2
} from 'lucide-react';
import SEO from '../../components/SEO';
import { API_URL } from '../../config/runtime';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const SubscriptionCheckout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);
  
  // User/Facility details
  const [facilityType, setFacilityType] = useState('clinic'); // 'clinic' or 'lab'
  const [facilityInfo, setFacilityInfo] = useState(null);
  
  // Plans configuration
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);

  // Fetch current profile and subscription status
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const isLab = localStorage.getItem('labRole') === 'independent_lab';
      
      // Fetch dynamic active plans first
      let activePlans = [];
      try {
        const plansRes = await axios.get(`${API_URL}/api/superadmin/plans/public`);
        if (plansRes.data.success) {
          activePlans = plansRes.data.data || [];
          setPlans(activePlans);
        }
      } catch (plansErr) {
        console.error("Failed to fetch public plans:", plansErr);
      }

      if (isLab) {
        setFacilityType('lab');
        const token = localStorage.getItem('labToken');
        const res = await axios.get(`${API_URL}/api/auth/lab/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setFacilityInfo(res.data.data);
          const matched = activePlans.filter(p => p.facilityType === 'lab' || p.facilityType === 'both');
          setSelectedPlan(matched[0]?.key || 'independent-lab');
        }

        // Fetch lab billing history
        try {
          const historyRes = await axios.get(`${API_URL}/api/superadmin/subscription/lab-history`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (historyRes.data.success) {
            setBillingHistory(historyRes.data.data || []);
          }
        } catch (historyErr) {
          console.error("Failed to fetch billing history:", historyErr);
        }
      } else {
        setFacilityType('clinic');
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const user = res.data.data;
          // Fetch clinic details
          const clinicRes = await axios.get(`${API_URL}/api/clinic/public/${user.clinicId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setFacilityInfo(clinicRes.data.data);
          const matched = activePlans.filter(p => p.facilityType === 'clinic' || p.facilityType === 'both');
          setSelectedPlan(matched[0]?.key || 'clinic-only');
        }

        // Fetch clinic billing history
        try {
          const historyRes = await axios.get(`${API_URL}/api/superadmin/subscription/history`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (historyRes.data.success) {
            setBillingHistory(historyRes.data.data || []);
          }
        } catch (historyErr) {
          console.error("Failed to fetch billing history:", historyErr);
        }
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to retrieve profile and subscription state.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Compute pricing dynamically before generating Razorpay order
  const handlePreviewCheckout = async (planId) => {
    setProcessing(true);
    try {
      const token = facilityType === 'lab' ? localStorage.getItem('labToken') : localStorage.getItem('token');
      const checkoutUrl = facilityType === 'lab' 
        ? `${API_URL}/api/superadmin/subscription/lab-checkout`
        : `${API_URL}/api/superadmin/subscription/checkout`;

      const res = await axios.post(checkoutUrl, {
        plan: planId || selectedPlan,
        promoCode: promoCode || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setCheckoutData(res.data);
        if (promoCode && !appliedPromo) {
          setAppliedPromo(promoCode.toUpperCase());
          Swal.fire({
            icon: 'success',
            title: 'Promo Applied!',
            text: `Discount code applied successfully.`,
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      }
    } catch (err) {
      setPromoCode('');
      setAppliedPromo(null);
      Swal.fire('Pricing Error', err.response?.data?.message || 'Could not fetch pricing options.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (selectedPlan && facilityInfo) {
      handlePreviewCheckout(selectedPlan);
    }
  }, [selectedPlan, facilityInfo]);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    handlePreviewCheckout(selectedPlan);
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setAppliedPromo(null);
    // Re-evaluate pricing without promo
    setTimeout(() => {
      handlePreviewCheckout(selectedPlan);
    }, 100);
  };

  const handlePayment = async () => {
    if (!checkoutData) return;
    setProcessing(true);

    const token = facilityType === 'lab' ? localStorage.getItem('labToken') : localStorage.getItem('token');
    const verifyUrl = facilityType === 'lab'
      ? `${API_URL}/api/superadmin/subscription/lab-verify`
      : `${API_URL}/api/superadmin/subscription/verify`;

    // 1. Check if mock checkout (for dev/test or when Razorpay key is mock)
    if (checkoutData.orderId.startsWith('order_mock_') || checkoutData.keyId === 'mock_key') {
      Swal.fire({
        title: 'Processing Payment...',
        html: '<p style="font-size: 13px; color: #1B6CA8;">[Sandbox] Verifying transaction on secure ledger...</p>',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        const res = await axios.post(verifyUrl, {
          razorpayOrderId: checkoutData.orderId,
          razorpayPaymentId: `pay_mock_${Math.random().toString(36).substring(2, 10)}`,
          razorpaySignature: 'mock_signature'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Payment Successful!',
            text: 'Your Appointory premium subscription is now active!',
            confirmButtonColor: '#1B6CA8'
          }).then(() => {
            if (facilityType === 'lab') {
              navigate('/lab/portal/dashboard');
            } else {
              navigate('/admin/dashboard');
            }
          });
        }
      } catch (err) {
        Swal.fire('Payment Failed', err.response?.data?.message || 'Verification failed.', 'error');
      } finally {
        setProcessing(false);
      }
      return;
    }

    // 2. Real Razorpay checkout flow
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setProcessing(false);
      return Swal.fire('Error', 'Failed to load Razorpay payment SDK. Check network connection.', 'error');
    }

    const options = {
      key: checkoutData.keyId,
      amount: checkoutData.amountPaise,
      currency: 'INR',
      name: 'Appointory',
      description: `Premium Subscription: ${selectedPlan}`,
      order_id: checkoutData.orderId,
      handler: async function (response) {
        Swal.fire({
          title: 'Verifying Signature...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        try {
          const res = await axios.post(verifyUrl, {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Subscription Active!',
              text: 'Your Appointory subscription has been updated.',
              confirmButtonColor: '#1B6CA8'
            }).then(() => {
              if (facilityType === 'lab') {
                navigate('/lab/portal/dashboard');
              } else {
                navigate('/admin/dashboard');
              }
            });
          }
        } catch (err) {
          Swal.fire('Verification Failed', err.response?.data?.message || 'Verification failed.', 'error');
        } finally {
          setProcessing(false);
        }
      },
      prefill: {
        name: facilityInfo?.name || facilityInfo?.labName || '',
        email: facilityInfo?.email || '',
        contact: facilityInfo?.contactPhone || facilityInfo?.phone || ''
      },
      theme: {
        color: '#1B6CA8'
      },
      modal: {
        ondismiss: function () {
          setProcessing(false);
          Swal.fire({
            icon: 'info',
            title: 'Payment Cancelled',
            text: 'You have cancelled the subscription payment process. Your facility was not charged.',
            confirmButtonColor: '#1B6CA8'
          });
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleSupportTicket = () => {
    Swal.fire({
      title: 'Contact Support Room',
      html: `
        <div style="text-align: left; font-size: 13px;">
          <label style="font-weight: bold; color: #4b5563;">Subject</label>
          <input id="swal-subject" class="swal2-input" style="font-size: 12px; margin: 8px 0 16px 0; width: 90%;" placeholder="e.g., Payment Issue">
          
          <label style="font-weight: bold; color: #4b5563;">Detailed Message</label>
          <textarea id="swal-message" class="swal2-textarea" style="font-size: 12px; margin: 8px 0; width: 90%;" rows="3" placeholder="Provide issues details..."></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Submit Request',
      confirmButtonColor: '#1B6CA8',
      preConfirm: () => {
        const subject = document.getElementById('swal-subject').value;
        const message = document.getElementById('swal-message').value;
        if (!subject || !message) {
          Swal.showValidationMessage('Please enter both subject and message.');
        }
        return { subject, message };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.post(`${API_URL}/api/superadmin/tickets/create`, {
            senderName: facilityInfo?.name || facilityInfo?.labName || 'Clinic/Lab Admin',
            senderEmail: facilityInfo?.email || 'facility@appointory.com',
            facilityType: facilityType,
            facilityName: facilityInfo?.name || facilityInfo?.labName || 'Unknown',
            subject: result.value.subject,
            message: result.value.message
          });
          Swal.fire('Ticket Submitted', 'Our super admin team will investigate and respond soon.', 'success');
        } catch (err) {
          Swal.fire('Error', 'Failed to file support ticket.', 'error');
        }
      }
    });
  };

  const userRole = localStorage.getItem('role') || localStorage.getItem('labRole');

  if (userRole === 'doctor' || userRole === 'receptionist') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans px-4 text-center" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 50%, #f0f9ff 100%)' }}>
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 max-w-md shadow-lg space-y-6">
          <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck size={32} className="text-rose-600" />
          </div>
          <div className="space-y-2">
            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[10px] font-black uppercase tracking-wider">
              Subscription Expired
            </span>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Access Locked</h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Your clinic's premium subscription has expired. Access to clinical tasks (appointments, prescriptions, reception hub) is currently locked.
            </p>
            <p className="text-xs text-rose-600 font-bold bg-rose-50/50 p-3 rounded-xl border border-rose-100/50 mt-4">
              Please contact your Clinic Administrator to renew the subscription.
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
            className="w-full py-3.5 bg-slate-800 text-white hover:bg-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition cursor-pointer border-0"
          >
            Go Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={36} />
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  // Check if active subscription
  const isActive = facilityInfo?.subscriptionExpiresAt && new Date(facilityInfo.subscriptionExpiresAt) > new Date();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 50%, #f0f9ff 100%)' }}>
      <SEO title="Premium Billing Checkout" noindex={true} />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2.5">
          <span className="px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest border border-blue-200">
            Billing Portal
          </span>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Appointory Account Upgrade</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Choose a subscription plan to unlock full platform operations and secure digital queues.
          </p>
        </div>

        {/* Expiration Notice if Expired */}
        {!isActive && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 flex items-start gap-4">
            <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-2xl shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-rose-800 text-sm">Subscription Required / Trial Period Expired</h4>
              <p className="text-xs text-rose-700 mt-1">
                Your standard subscription has expired. Standard operations (patient check-ins, prescriptions, lab uploads) are currently locked until subscription renewal.
              </p>
            </div>
          </div>
        )}

        {/* Content Split: Left (Plans) & Right (Summary) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
          {/* Plan Selector (Left 3/5) */}
          <div className="md:col-span-3 space-y-6">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500">Available Subscription Plans</h3>

            {plans.filter(p => facilityType === 'lab' ? p.facilityType === 'lab' || p.facilityType === 'both' : p.facilityType === 'clinic' || p.facilityType === 'both').length > 0 ? (
              <div className="space-y-4">
                {plans
                  .filter(p => facilityType === 'lab' ? p.facilityType === 'lab' || p.facilityType === 'both' : p.facilityType === 'clinic' || p.facilityType === 'both')
                  .map(plan => (
                    <div
                      key={plan._id}
                      onClick={() => setSelectedPlan(plan.key)}
                      className={`p-5 rounded-3xl border cursor-pointer transition flex justify-between items-center bg-white ${selectedPlan === plan.key ? 'border-blue-600 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className="space-y-1">
                        <h4 className="font-black text-slate-800 text-base">{plan.name}</h4>
                        <p className="text-xs text-slate-500">{plan.durationDays} Days Duration</p>
                        
                        {plan.features?.length > 0 && (
                          <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest pt-1 flex flex-wrap gap-x-3 gap-y-1">
                            {plan.features.map((feat, idx) => (
                              <span key={idx}>✓ {feat}</span>
                            ))}
                          </div>
                        )}

                        {plan.trafficLimits && (plan.trafficLimits.maxStaff > 0 || plan.trafficLimits.maxPatients > 0 || plan.trafficLimits.maxQueues > 0) && (
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest pt-1 flex gap-2">
                            {plan.trafficLimits.maxStaff > 0 && <span>Max Staff: {plan.trafficLimits.maxStaff}</span>}
                            {plan.trafficLimits.maxPatients > 0 && <span>Max Patients: {plan.trafficLimits.maxPatients}</span>}
                            {plan.trafficLimits.maxQueues > 0 && <span>Max Queues: {plan.trafficLimits.maxQueues}</span>}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-extrabold text-blue-600">₹{plan.price.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">/ plan term</div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : facilityType === 'clinic' ? (
              <div className="space-y-4">
                {/* Clinic Plan 1 */}
                <div
                  onClick={() => setSelectedPlan('clinic-only')}
                  className={`p-5 rounded-3xl border cursor-pointer transition flex justify-between items-center bg-white ${selectedPlan === 'clinic-only' ? 'border-blue-600 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-800 text-base">Clinic Only Desk</h4>
                    <p className="text-xs text-slate-500">Ideal for clinics without internal labs</p>
                    <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest pt-1 flex gap-2">
                      <span>✓ Patient Check-ins</span>
                      <span>✓ Smart Queues</span>
                      <span>✓ Prescription desk</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-blue-600">₹1,000</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">/ month</div>
                  </div>
                </div>

                {/* Clinic Plan 2 */}
                <div
                  onClick={() => setSelectedPlan('clinic-lab-combined')}
                  className={`p-5 rounded-3xl border cursor-pointer transition flex justify-between items-center bg-white ${selectedPlan === 'clinic-lab-combined' ? 'border-blue-600 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-800 text-base">Combined Clinic + Lab</h4>
                    <p className="text-xs text-slate-500">For clinics carrying internal pathology diagnostics</p>
                    <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest pt-1 flex gap-2">
                      <span>✓ All Clinic Desk</span>
                      <span>✓ Report uploads</span>
                      <span>✓ Diagnostics queue</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-blue-600">₹1,800</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">/ month</div>
                  </div>
                </div>
              </div>
            ) : (
              /* Independent Lab Plan */
              <div
                onClick={() => setSelectedPlan('independent-lab')}
                className={`p-5 rounded-3xl border cursor-pointer transition flex justify-between items-center bg-white border-blue-600 shadow-md`}
              >
                <div className="space-y-1">
                  <h4 className="font-black text-slate-800 text-base">Diagnostics Lab Premium</h4>
                  <p className="text-xs text-slate-500">For standalone laboratories servicing clinics</p>
                  <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest pt-1 flex gap-2">
                    <span>✓ Multi-clinic routing</span>
                    <span>✓ Digital reports PDF creator</span>
                    <span>✓ Locker syncing</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-blue-600">₹1,200</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">/ month</div>
                </div>
              </div>
            )}

            {/* Help Button */}
            <div className="flex justify-between items-center bg-white/60 px-5 py-4 rounded-3xl border border-slate-200/60 shadow-sm text-xs">
              <span className="font-bold text-slate-600">Need a customized subscription plan?</span>
              <button
                onClick={handleSupportTicket}
                className="px-3.5 py-1.5 bg-slate-800 text-white rounded-xl font-black uppercase tracking-wider text-[10px] hover:bg-slate-700 transition cursor-pointer border-0"
              >
                Ask Support
              </button>
            </div>
          </div>

          {/* Checkout Breakdown & Pay (Right 2/5) */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500">Order Summary</h3>

            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-6">
              {processing && !checkoutData ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2.5">
                  <Loader2 className="animate-spin text-blue-600" size={24} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Calculating dues...</p>
                </div>
              ) : checkoutData ? (
                <>
                  {/* Summary Rows */}
                  <div className="space-y-4 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span>Base Plan ({selectedPlan})</span>
                      <span className="text-slate-800">₹{checkoutData.amount + (checkoutData.discountDetails?.reduce((a, b) => a + b.amount, 0) || 0)}</span>
                    </div>

                    {/* Discounts list */}
                    {checkoutData.discountDetails && checkoutData.discountDetails.map((disc, idx) => (
                      <div key={idx} className="flex justify-between text-emerald-600">
                        <span className="flex items-center gap-1">
                          <TrendingDown size={13} /> {disc.name}
                        </span>
                        <span>- ₹{disc.amount.toFixed(0)}</span>
                      </div>
                    ))}

                    <hr className="border-slate-100" />

                    <div className="flex justify-between text-base font-extrabold text-slate-800">
                      <span>Total Amount</span>
                      <span className="text-blue-600">₹{checkoutData.amount}</span>
                    </div>
                  </div>

                  {/* Promo Form */}
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <div className="relative flex-grow">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        placeholder="PROMO CODE"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        disabled={appliedPromo !== null}
                        className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-xs w-full transition font-black uppercase text-slate-700"
                      />
                    </div>
                    {appliedPromo ? (
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition cursor-pointer border-0"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={processing || !promoCode.trim()}
                        className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition disabled:opacity-50 cursor-pointer border-0"
                      >
                        Apply
                      </button>
                    )}
                  </form>

                  {/* Complete Button */}
                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border-0"
                  >
                    {processing ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <>
                        <CreditCard size={15} /> Complete Renewal
                      </>
                    )}
                  </button>

                  <div className="text-[10px] text-slate-400 text-center font-bold flex items-center justify-center gap-1">
                    <ShieldCheck className="text-emerald-500" size={13} /> Secured by Razorpay Payments SDK
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-xs text-slate-500 font-bold">
                  Select a subscription plan first
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Billing History Section */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-slate-800">Billing & Subscription History</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Your current and past subscription transactions</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Order ID</th>
                  <th className="py-3 px-2">Billing Date</th>
                  <th className="py-3 px-2">Plan</th>
                  <th className="py-3 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {(() => {
                  const finalHistory = billingHistory.filter(h => h.status !== 'created');
                  if (finalHistory.length === 0) {
                    return (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-slate-400 font-bold uppercase tracking-widest">
                          No transaction history found
                        </td>
                      </tr>
                    );
                  }
                  return finalHistory.map((p) => {
                    const isMock = p.razorpayOrderId && p.razorpayOrderId.startsWith('order_mock_');
                    return (
                      <tr key={p._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-2 font-mono text-slate-500 flex items-center gap-1.5 flex-wrap">
                          <span>{p.razorpayOrderId}</span>
                          {isMock && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-200/40 tracking-wider">
                              Test Mode
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2">{new Date(p.billingDate).toLocaleString()}</td>
                        <td className="py-3 px-2 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                            {p.plan}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            p.status === 'captured' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {p.status === 'captured' ? 'Completed' : 'Cancelled'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right text-emerald-600 font-extrabold font-mono">₹{p.amount.toLocaleString()}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckout;
