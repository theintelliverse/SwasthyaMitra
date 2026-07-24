import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  ShieldAlert, Settings, Users, CreditCard, Ticket, HelpCircle,
  ToggleLeft, ToggleRight, Gift, DollarSign, Search, CheckCircle,
  Plus, Trash2, LogOut, ArrowUpRight, BarChart3, Building, RefreshCw,
  LayoutDashboard, Activity, Layers, Edit
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SEO from '../../components/SEO';
import { API_URL } from '../../config/runtime';

import OverviewTab from './components/OverviewTab';
import ClinicsTab from './components/ClinicsTab';
import LabsTab from './components/LabsTab';
import PlansTab from './components/PlansTab';
import PaymentsTab from './components/PaymentsTab';
import PromosTab from './components/PromosTab';
import TicketsTab from './components/TicketsTab';
import ConfigTab from './components/ConfigTab';
import FacilityOverviewModal from './components/FacilityOverviewModal';

const superadminApi = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });
};

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'facilities' | 'payments' | 'promos' | 'tickets' | 'config'
  const [searchTerm, setSearchTerm] = useState('');

  // Metrics & Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeSubscribers, setActiveSubscribers] = useState(0);
  const [clinics, setClinics] = useState([]);
  const [labs, setLabs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [promos, setPromos] = useState([]);
  const [plans, setPlans] = useState([]);

  // System Configuration
  const [config, setConfig] = useState({
    isMaintenanceMode: false,
    maintenanceMessage: '',
    isSubscriptionEnforced: false
  });

  // Forms
  const [newPromo, setNewPromo] = useState({
    code: '',
    discountPercentage: '',
    expiryDate: ''
  });

  const [editingPlan, setEditingPlan] = useState(null);
  const [newPlan, setNewPlan] = useState({
    name: '',
    key: '',
    price: '',
    durationDays: '',
    facilityType: 'clinic',
    features: '',
    maxStaff: '0',
    maxPatients: '0',
    maxQueues: '0',
    isCustomPlan: false,
    isActive: true
  });

  const [savingConfig, setSavingConfig] = useState(false);

  // Facility Overview Modal State
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedFacilityType, setSelectedFacilityType] = useState('clinic');
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);

  const handleOpenOverview = (facility, type) => {
    setSelectedFacility(facility);
    setSelectedFacilityType(type);
    setIsOverviewOpen(true);
  };

  const handleApproveReject = async (id, type, status, reason = '') => {
    try {
      const res = await superadminApi().patch(`/api/superadmin/facility/${id}/approval`, {
        type,
        status,
        reason
      });
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: res.data.message,
          timer: 2000,
          toast: true,
          position: 'top-end',
          showConfirmButton: false
        });
        setIsOverviewOpen(false);
        fetchData();
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to process approval decision', 'error');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await superadminApi().get('/api/superadmin/facilities');
      if (res.data.success) {
        setClinics(res.data.clinics || []);
        setLabs(res.data.labs || []);
        setPayments(res.data.payments || []);
        setTotalRevenue(res.data.totalRevenue || 0);
        setActiveSubscribers(res.data.activeSubscribersCount || 0);
      }

      const configRes = await superadminApi().get('/api/superadmin/config');
      if (configRes.data.success) {
        setConfig(configRes.data.data);
      }

      const ticketsRes = await superadminApi().get('/api/superadmin/tickets');
      if (ticketsRes.data.success) {
        setTickets(ticketsRes.data.data || []);
      }

      const promosRes = await superadminApi().get('/api/superadmin/promo');
      if (promosRes.data.success) {
        setPromos(promosRes.data.data || []);
      }

      const plansRes = await superadminApi().get('/api/superadmin/plans');
      if (plansRes.data.success) {
        setPlans(plansRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    if (!token || role !== 'superadmin') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const handleUpdateConfig = async (updatedFields) => {
    setSavingConfig(true);
    try {
      const res = await superadminApi().patch('/api/superadmin/config', updatedFields);
      if (res.data.success) {
        setConfig(res.data.data);
        Swal.fire({
          icon: 'success',
          title: 'Configuration Updated',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to update configuration', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTogglePremium = async (id, type) => {
    try {
      const res = await superadminApi().patch(`/api/superadmin/facility/${id}/premium`, { type });
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to update premium status', err);
    }
  };

  const handleToggleNetwork = async (id, type) => {
    try {
      const res = await superadminApi().patch(`/api/superadmin/facility/${id}/network`, { type });
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to update network status', err);
    }
  };

  const handleToggleActive = async (id, type) => {
    try {
      const res = await superadminApi().patch(`/api/superadmin/facility/${id}/active`, { type });
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: res.data.message,
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        fetchData();
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to toggle status', err);
    }
  };

  const handleGiftSubscription = async (id, type) => {
    const { value: months } = await Swal.fire({
      title: 'Gift Free Extension',
      html: `
        <div style="text-align: left; font-size: 13px; font-family: inherit;">
          <label style="font-weight: bold; color: #422D0B; display: block; margin-bottom: 8px;">Select Gift Extension Duration</label>
          <select id="swal-gift-months" style="display: block; width: 100%; padding: 10px 14px; background: #FFFBF5; color: #422D0B; border: 1px solid #E8DDCB; border-radius: 12px; outline: none; font-weight: bold; font-size: 13px; font-family: inherit; cursor: pointer;">
            <option value="1">1 Month Free Extension</option>
            <option value="2">2 Months Free Extension</option>
            <option value="3">3 Months Free Extension</option>
            <option value="6">6 Months Free Extension</option>
            <option value="12">1 Year Free Extension</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Gift Extension',
      confirmButtonColor: '#FFA800',
      background: '#FFFBF5',
      color: '#422D0B',
      preConfirm: () => {
        return document.getElementById('swal-gift-months').value;
      }
    });

    if (months) {
      try {
        const res = await superadminApi().post(`/api/superadmin/facility/${id}/gift-subscription`, {
          type,
          months: parseInt(months)
        });
        if (res.data.success) {
          Swal.fire('Success', res.data.message, 'success');
          fetchData();
        }
      } catch (err) {
        Swal.fire('Error', 'Failed to gift subscription extension', err);
      }
    }
  };

  const handleEditSubscription = async (id, type, currentPlan, currentExpiry) => {
    const formattedDate = currentExpiry ? new Date(currentExpiry).toISOString().split('T')[0] : '';
    const planOptions = type === 'clinic' 
      ? `
        <option value="clinic-only">Clinic Only Desk (Standard)</option>
        <option value="clinic-lab-combined">Combined Clinic + Lab (Premium)</option>
        <option value="free">Free Trial / Sandbox Mode</option>
      `
      : `
        <option value="independent-lab">Diagnostics Lab Premium</option>
        <option value="free">Free Trial / Sandbox Mode</option>
      `;

    const { value: formValues } = await Swal.fire({
      title: 'Modify Subscription Details',
      html: `
        <div style="text-align: left; font-size: 13px; font-family: inherit; display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-weight: bold; color: #422D0B; display: block; margin-bottom: 6px;">Select Subscription Plan</label>
            <select id="swal-edit-plan" style="display: block; width: 100%; padding: 10px 14px; background: #FFFBF5; color: #422D0B; border: 1px solid #E8DDCB; border-radius: 12px; outline: none; font-weight: bold; font-size: 13px; font-family: inherit; cursor: pointer;">
              ${planOptions}
            </select>
          </div>
          <div>
            <label style="font-weight: bold; color: #422D0B; display: block; margin-bottom: 6px;">Set Expiration Date</label>
            <input type="date" id="swal-edit-expiry" value="${formattedDate}" style="display: block; width: 100%; padding: 10px 14px; background: #FFFBF5; color: #422D0B; border: 1px solid #E8DDCB; border-radius: 12px; outline: none; font-weight: bold; font-size: 13px; font-family: inherit; box-sizing: border-box;" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save Subscription',
      confirmButtonColor: '#FFA800',
      background: '#FFFBF5',
      color: '#422D0B',
      didOpen: () => {
        if (currentPlan) {
          document.getElementById('swal-edit-plan').value = currentPlan;
        }
      },
      preConfirm: () => {
        return {
          subscriptionPlan: document.getElementById('swal-edit-plan').value,
          subscriptionExpiresAt: document.getElementById('swal-edit-expiry').value || null
        };
      }
    });

    if (formValues) {
      try {
        const res = await superadminApi().patch(`/api/superadmin/facility/${id}/subscription`, {
          type,
          subscriptionPlan: formValues.subscriptionPlan,
          subscriptionExpiresAt: formValues.subscriptionExpiresAt
        });
        if (res.data.success) {
          Swal.fire('Success', res.data.message, 'success');
          fetchData();
        }
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Failed to update subscription details', 'error');
      }
    }
  };

  const handleEditCampaignModal = async () => {
    const formattedCutoff = config.legacyCutoffDate ? new Date(config.legacyCutoffDate).toISOString().split('T')[0] : '';
    const formattedStart = config.legacyDiscountStartDate ? new Date(config.legacyDiscountStartDate).toISOString().split('T')[0] : '';
    const formattedEnd = config.legacyDiscountEndDate ? new Date(config.legacyDiscountEndDate).toISOString().split('T')[0] : '';

    const { value: formValues } = await Swal.fire({
      title: 'Edit Campaign & Discount Settings',
      html: `
        <div style="text-align: left; font-size: 13px; font-family: inherit; display: flex; flex-direction: column; gap: 12px; max-height: 70vh; overflow-y: auto; padding: 4px;">
          <div>
            <label style="font-weight: bold; color: #422D0B; display: block; margin-bottom: 4px;">Campaign Label</label>
            <input type="text" id="swal-campaign-label" value="${config.legacyDiscountLabel ?? 'Legacy User Discount'}" style="display: block; width: 100%; padding: 8px 12px; background: #FFFBF5; color: #422D0B; border: 1px solid #E8DDCB; border-radius: 10px; font-size: 13px; font-weight: bold; font-family: inherit; box-sizing: border-box;" />
          </div>
          <div style="display: flex; gap: 12px;">
            <div style="flex: 1;">
              <label style="font-weight: bold; color: #422D0B; display: block; margin-bottom: 4px;">Discount Rate (%)</label>
              <input type="number" id="swal-campaign-pct" value="${config.legacyDiscountPercentage ?? 20}" style="display: block; width: 100%; padding: 8px 12px; background: #FFFBF5; color: #422D0B; border: 1px solid #E8DDCB; border-radius: 10px; font-size: 13px; font-weight: bold; font-family: inherit; box-sizing: border-box;" />
            </div>
            <div style="flex: 1;">
              <label style="font-weight: bold; color: #422D0B; display: block; margin-bottom: 4px;">Trial Period (Days)</label>
              <input type="number" id="swal-campaign-trial" value="${config.trialPeriodDays ?? 30}" style="display: block; width: 100%; padding: 8px 12px; background: #FFFBF5; color: #422D0B; border: 1px solid #E8DDCB; border-radius: 10px; font-size: 13px; font-weight: bold; font-family: inherit; box-sizing: border-box;" />
            </div>
          </div>
          <div>
            <label style="font-weight: bold; color: #422D0B; display: block; margin-bottom: 4px;">Legacy Cut-off Date (Registered Before)</label>
            <input type="date" id="swal-campaign-cutoff" value="${formattedCutoff}" style="display: block; width: 100%; padding: 8px 12px; background: #FFFBF5; color: #422D0B; border: 1px solid #E8DDCB; border-radius: 10px; font-size: 13px; font-weight: bold; font-family: inherit; box-sizing: border-box;" />
          </div>
          <div style="display: flex; gap: 12px;">
            <div style="flex: 1;">
              <label style="font-weight: bold; color: #422D0B; display: block; margin-bottom: 4px;">Campaign Start Date</label>
              <input type="date" id="swal-campaign-start" value="${formattedStart}" style="display: block; width: 100%; padding: 8px 12px; background: #FFFBF5; color: #422D0B; border: 1px solid #E8DDCB; border-radius: 10px; font-size: 13px; font-weight: bold; font-family: inherit; box-sizing: border-box;" />
            </div>
            <div style="flex: 1;">
              <label style="font-weight: bold; color: #422D0B; display: block; margin-bottom: 4px;">Campaign End Date</label>
              <input type="date" id="swal-campaign-end" value="${formattedEnd}" style="display: block; width: 100%; padding: 8px 12px; background: #FFFBF5; color: #422D0B; border: 1px solid #E8DDCB; border-radius: 10px; font-size: 13px; font-weight: bold; font-family: inherit; box-sizing: border-box;" />
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save Campaign Settings',
      confirmButtonColor: '#FFA800',
      background: '#FFFBF5',
      color: '#422D0B',
      preConfirm: () => {
        return {
          legacyDiscountLabel: document.getElementById('swal-campaign-label').value,
          legacyDiscountPercentage: parseInt(document.getElementById('swal-campaign-pct').value) || 0,
          trialPeriodDays: parseInt(document.getElementById('swal-campaign-trial').value) || 0,
          legacyCutoffDate: document.getElementById('swal-campaign-cutoff').value || null,
          legacyDiscountStartDate: document.getElementById('swal-campaign-start').value || null,
          legacyDiscountEndDate: document.getElementById('swal-campaign-end').value || null
        };
      }
    });

    if (formValues) {
      handleUpdateConfig(formValues);
    }
  };

  const handleSetCustomPrice = async (id, type, currentPrice) => {
    const { value: newPrice } = await Swal.fire({
      title: 'Custom Monthly Pricing',
      text: 'Set custom subscription price for this facility (leave empty to reset to default):',
      input: 'number',
      inputValue: currentPrice || '',
      inputPlaceholder: 'Amount in INR',
      showCancelButton: true,
      confirmButtonColor: '#FFA800'
    });

    if (newPrice !== undefined) {
      try {
        const res = await superadminApi().patch(`/api/superadmin/facility/${id}/subscription-price`, {
          type,
          customSubscriptionPrice: newPrice === '' ? null : parseFloat(newPrice)
        });
        if (res.data.success) {
          Swal.fire('Success', 'Custom price adjusted successfully!', 'success');
          fetchData();
        }
      } catch (err) {
        Swal.fire('Error', 'Failed to adjust subscription price', err);
      }
    }
  };

  const handleDeleteFacility = async (id, type) => {
    Swal.fire({
      title: 'Delete this facility?',
      text: 'This will PERMANENTLY delete the facility, its doctors, staff, diagnostics requests, connections, and all other related records from the system. This action is irreversible!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete Everything'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await superadminApi().delete(`/api/superadmin/facility/${id}?type=${type}`);
          if (res.data.success) {
            Swal.fire('Deleted!', res.data.message, 'success');
            fetchData();
          }
        } catch (err) {
          Swal.fire('Error', err.response?.data?.message || 'Failed to delete facility', 'error');
        }
      }
    });
  };

  const handleResolveTicket = async (id) => {
    const { value: resolutionText } = await Swal.fire({
      title: 'Resolve Support Ticket',
      input: 'textarea',
      inputLabel: 'Write a response message to the user:',
      inputPlaceholder: 'Enter resolution details or next steps...',
      inputAttributes: {
        'aria-label': 'Type your message here'
      },
      showCancelButton: true,
      confirmButtonText: 'Resolve & Email User',
      confirmButtonColor: '#0F766E',
      cancelButtonColor: '#ef4444',
      preConfirm: (value) => {
        if (!value || !value.trim()) {
          Swal.showValidationMessage('Resolution message is required.');
        }
        return value;
      }
    });

    if (resolutionText) {
      try {
        const res = await superadminApi().patch(`/api/superadmin/tickets/${id}/resolve`, { resolutionText });
        if (res.data.success) {
          Swal.fire('Success', 'Ticket marked as resolved and email sent to user.', 'success');
          fetchData();
        }
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Failed to resolve ticket', 'error');
      }
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!newPromo.code || !newPromo.discountPercentage || !newPromo.expiryDate) {
      return Swal.fire('Error', 'All promo code fields are required', 'warning');
    }
    try {
      const res = await superadminApi().post('/api/superadmin/promo', {
        code: newPromo.code,
        discountPercentage: parseFloat(newPromo.discountPercentage),
        expiryDate: new Date(newPromo.expiryDate)
      });
      if (res.data.success) {
        Swal.fire('Success', 'Promo Code Created!', 'success');
        setNewPromo({ code: '', discountPercentage: '', expiryDate: '' });
        fetchData();
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to create promo code', 'error');
    }
  };

  const handleDeletePromo = async (id) => {
    try {
      const res = await superadminApi().delete(`/api/superadmin/promo/${id}`);
      if (res.data.success) {
        Swal.fire('Deleted', 'Promo code removed successfully', 'success');
        fetchData();
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to delete promo code', err);
    }
  };

  const handleDeletePayment = async (id) => {
    Swal.fire({
      title: 'Delete transaction record?',
      text: 'Are you sure you want to delete this subscription transaction record? This will not affect the facility\'s active subscription expiration date.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete Record'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await superadminApi().delete(`/api/superadmin/subscription/payment/${id}`);
          if (res.data.success) {
            Swal.fire('Deleted!', res.data.message, 'success');
            fetchData();
          }
        } catch (err) {
          Swal.fire('Error', err.response?.data?.message || 'Failed to delete transaction record', 'error');
        }
      }
    });
  };

  const handleOpenCredentialsModal = () => {
    const currentEmail = localStorage.getItem('userEmail') || 'superadmin@appointory.com';
    Swal.fire({
      title: 'Update Super Admin Credentials',
      html: `
        <div style="text-align: left; font-size: 13px;">
          <label style="font-weight: bold; color: #422D0B; display: block; margin-bottom: 4px;">New Email (Login ID)</label>
          <input id="swal-email" class="swal2-input" style="font-size: 12px; margin: 0 0 16px 0; width: 90%; background: #FFFBF5; color: #422D0B; border: 1px solid #E8DDCB; border-radius: 8px; padding: 8px;" placeholder="Email address" value="${currentEmail}">
          
          <label style="font-weight: bold; color: #422D0B; display: block; margin-bottom: 4px;">New Password</label>
          <input type="password" id="swal-password" class="swal2-input" style="font-size: 12px; margin: 0; width: 90%; background: #FFFBF5; color: #422D0B; border: 1px solid #E8DDCB; border-radius: 8px; padding: 8px;" placeholder="Enter new password (optional)">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update Credentials',
      confirmButtonColor: '#FFA800',
      background: '#FFFBF5',
      color: '#422D0B',
      preConfirm: () => {
        const email = document.getElementById('swal-email').value;
        const password = document.getElementById('swal-password').value;
        if (!email) {
          Swal.showValidationMessage('Please enter a valid email address.');
        }
        return { email, password };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await superadminApi().patch('/api/superadmin/update-credentials', {
            email: result.value.email,
            password: result.value.password || undefined
          });
          if (res.data.success) {
            Swal.fire('Success', 'Credentials updated successfully! Logging out...', 'success').then(() => {
              handleLogout();
            });
          }
        } catch (err) {
          Swal.fire('Error', err.response?.data?.message || 'Failed to update credentials.', 'error');
        }
      }
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleSetCustomLimits = async (id, type, currentLimits) => {
    const { value: formValues } = await Swal.fire({
      title: 'Configure Custom Traffic Limits',
      html: `
        <div style="text-align: left; font-size: 13px; font-family: inherit;">
          <p style="font-size: 11px; color: #7F7668; margin-bottom: 12px;">Set custom limits for this facility. Enter 0 for unlimited, or leave empty to use plan defaults.</p>
          
          <label style="font-weight: bold; color: #422D0B; display: block; margin-bottom: 4px;">Max Staff Members</label>
          <input type="number" id="swal-limit-staff" class="swal2-input" style="font-size: 12px; margin: 0 0 12px 0; width: 90%; background: #FFFBF5; color: #422D0B; border: 1px solid #E8DDCB; border-radius: 8px; padding: 8px;" placeholder="Plan Default" value="${currentLimits?.maxStaff !== undefined && currentLimits?.maxStaff !== null ? currentLimits.maxStaff : ''}">
          
          <label style="font-weight: bold; color: #422D0B; display: block; margin-bottom: 4px;">Max Patients Registered</label>
          <input type="number" id="swal-limit-patients" class="swal2-input" style="font-size: 12px; margin: 0 0 12px 0; width: 90%; background: #FFFBF5; color: #422D0B; border: 1px solid #E8DDCB; border-radius: 8px; padding: 8px;" placeholder="Plan Default" value="${currentLimits?.maxPatients !== undefined && currentLimits?.maxPatients !== null ? currentLimits.maxPatients : ''}">
          
          <label style="font-weight: bold; color: #422D0B; display: block; margin-bottom: 4px;">Max Active Queues</label>
          <input type="number" id="swal-limit-queues" class="swal2-input" style="font-size: 12px; margin: 0; width: 90%; background: #FFFBF5; color: #422D0B; border: 1px solid #E8DDCB; border-radius: 8px; padding: 8px;" placeholder="Plan Default" value="${currentLimits?.maxQueues !== undefined && currentLimits?.maxQueues !== null ? currentLimits.maxQueues : ''}">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save Limits',
      confirmButtonColor: '#FFA800',
      background: '#FFFBF5',
      color: '#422D0B',
      preConfirm: () => {
        const maxStaff = document.getElementById('swal-limit-staff').value;
        const maxPatients = document.getElementById('swal-limit-patients').value;
        const maxQueues = document.getElementById('swal-limit-queues').value;
        return {
          maxStaff: maxStaff === '' ? null : parseInt(maxStaff),
          maxPatients: maxPatients === '' ? null : parseInt(maxPatients),
          maxQueues: maxQueues === '' ? null : parseInt(maxQueues)
        };
      }
    });

    if (formValues) {
      try {
        const res = await superadminApi().patch(`/api/superadmin/facility/${id}/custom-limits`, {
          type,
          customTrafficLimits: formValues
        });
        if (res.data.success) {
          Swal.fire('Success', 'Custom limits saved successfully!', 'success');
          fetchData();
        }
      } catch (err) {
        Swal.fire('Error', 'Failed to update custom limits', err);
      }
    }
  };

  const handleCreateOrUpdatePlan = async (e) => {
    e.preventDefault();
    if (!newPlan.name || !newPlan.key || !newPlan.price || !newPlan.durationDays) {
      return Swal.fire('Error', 'Required fields are missing', 'warning');
    }

    try {
      const payload = {
        name: newPlan.name,
        key: newPlan.key.toLowerCase().trim(),
        price: parseFloat(newPlan.price),
        durationDays: parseInt(newPlan.durationDays),
        facilityType: newPlan.facilityType,
        features: newPlan.features.split(',').map(f => f.trim()).filter(Boolean),
        trafficLimits: {
          maxStaff: parseInt(newPlan.maxStaff) || 0,
          maxPatients: parseInt(newPlan.maxPatients) || 0,
          maxQueues: parseInt(newPlan.maxQueues) || 0
        },
        isCustomPlan: newPlan.isCustomPlan,
        isActive: newPlan.isActive
      };

      let res;
      if (editingPlan) {
        res = await superadminApi().put(`/api/superadmin/plans/${editingPlan._id}`, payload);
      } else {
        res = await superadminApi().post('/api/superadmin/plans', payload);
      }

      if (res.data.success) {
        Swal.fire('Success', `Plan ${editingPlan ? 'updated' : 'created'} successfully!`, 'success');
        setEditingPlan(null);
        setNewPlan({
          name: '', key: '', price: '', durationDays: '', facilityType: 'clinic',
          features: '', maxStaff: '0', maxPatients: '0', maxQueues: '0',
          isCustomPlan: false, isActive: true
        });
        fetchData();
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save plan', 'error');
    }
  };

  const handleEditPlanClick = (plan) => {
    setEditingPlan(plan);
    setNewPlan({
      name: plan.name,
      key: plan.key,
      price: plan.price.toString(),
      durationDays: plan.durationDays.toString(),
      facilityType: plan.facilityType,
      features: plan.features.join(', '),
      maxStaff: (plan.trafficLimits?.maxStaff || 0).toString(),
      maxPatients: (plan.trafficLimits?.maxPatients || 0).toString(),
      maxQueues: (plan.trafficLimits?.maxQueues || 0).toString(),
      isCustomPlan: !!plan.isCustomPlan,
      isActive: !!plan.isActive
    });
  };

  const handleDeletePlan = async (id) => {
    Swal.fire({
      title: 'Delete this plan?',
      text: 'Are you sure you want to delete this subscription plan?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await superadminApi().delete(`/api/superadmin/plans/${id}`);
          if (res.data.success) {
            Swal.fire('Deleted!', res.data.message, 'success');
            fetchData();
          }
        } catch (err) {
          Swal.fire('Error', 'Failed to delete plan', 'error');
        }
      }
    });
  };

  const filteredClinics = clinics.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.clinicCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLabs = labs.filter(l =>
    l.labName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.labCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRevenueChartData = () => {
    const dailyPayments = {};
    payments.forEach(p => {
      const dateStr = new Date(p.billingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyPayments[dateStr] = (dailyPayments[dateStr] || 0) + p.amount;
    });

    return Object.keys(dailyPayments).map(date => ({
      date,
      revenue: dailyPayments[date]
    })).reverse();
  };

  const revenueData = getRevenueChartData();

  const menuItems = [
    { id: 'overview', name: 'Dashboard Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'clinics', name: 'Registered Clinics', icon: <Building size={20} /> },
    { id: 'labs', name: 'Registered Labs', icon: <Activity size={20} /> },
    { id: 'plans', name: 'Subscription Plans', icon: <Layers size={20} /> },
    { id: 'payments', name: 'Billing Transactions', icon: <CreditCard size={20} /> },
    { id: 'promos', name: 'Promo Discounts', icon: <Ticket size={20} /> },
    { id: 'tickets', name: 'Support Messages', icon: <HelpCircle size={20} /> },
    { id: 'config', name: 'System Controls', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-parchment font-body text-teak">
      <SEO title="System Super Admin Dashboard" noindex={true} />

      {/* Desktop Sidebar (Consistent with project layout style) */}
      <aside className="hidden lg:flex sticky top-0 left-0 h-screen z-40 w-72 bg-white border-r border-sandstone/30 flex-col shadow-sm">
        {/* Logo Section */}
        <div className="p-8">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-tr from-marigold to-saffron rounded-2xl flex items-center justify-center shadow-lg shadow-marigold/20">
              <ShieldAlert className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-1">
                AP<span className="text-marigold">.</span>Admin
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global OS</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-4 custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 group text-left cursor-pointer ${activeTab === item.id
                  ? 'bg-marigold/10 text-marigold shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <div className="transition-transform group-hover:scale-110 duration-200">
                {item.icon}
              </div>
              <span className="flex-1 text-xs uppercase tracking-wider">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="p-6 border-t border-sandstone/20 bg-gray-50/30">
          <div className="bg-white p-4 rounded-[1.5rem] border border-sandstone/25 shadow-sm mb-4 cursor-pointer hover:border-marigold transition-all group/card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-marigold/15 rounded-xl flex items-center justify-center text-marigold font-bold text-xs border border-marigold/10 group-hover/card:bg-marigold group-hover/card:text-white transition-colors">
                SA
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-marigold uppercase tracking-widest mb-0.5">
                  Super Admin
                </p>
                <p className="text-sm font-black text-gray-950 truncate tracking-tight leading-tight">
                  System Executive
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 transition-colors">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-marigold" />
                <span className="text-[11px] font-bold text-gray-500">Live Health</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-green-600 uppercase">Online</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenCredentialsModal}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-2 rounded-xl bg-white border border-sandstone/30 text-teak hover:bg-slate-50 transition font-black text-xs uppercase tracking-wider shadow-sm cursor-pointer"
          >
            <Settings size={14} className="text-marigold" /> Credentials
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-red-100 transition-all active:scale-95 cursor-pointer"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto">
        {/* Navigation Bar for Mobile */}
        <nav className="lg:hidden bg-white border-b border-sandstone/30 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={20} className="text-marigold" />
            <span className="font-heading font-black text-sm uppercase tracking-wider text-teak">Super Admin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleOpenCredentialsModal}
              className="p-2 rounded-xl bg-slate-50 border border-sandstone/35 text-teak"
              title="Credentials Settings"
            >
              <Settings size={15} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-100"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </nav>

        {/* Tab Selection Bar for Mobile view */}
        <div className="lg:hidden flex bg-white px-4 py-2 border-b border-sandstone/20 overflow-x-auto gap-2 scrollbar-none">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition ${activeTab === item.id ? 'bg-marigold text-white shadow-sm' : 'text-khaki hover:bg-parchment/60'
                }`}
            >
              {item.name.split(' ')[0]}
            </button>
          ))}
        </div>

        <main className="px-4 md:px-8 py-8 flex-grow max-w-7xl mx-auto w-full space-y-6">
          {/* Header Title Banner */}
          <header className="flex justify-between items-center mb-6">
            <div>
              <span className="px-2.5 py-1 bg-marigold/10 text-marigold rounded-full text-[10px] font-black uppercase tracking-widest border border-marigold/10">
                Global Administration
              </span>
              <h2 className="text-3xl font-black text-teak tracking-tight mt-1 capitalize">
                {menuItems.find(m => m.id === activeTab)?.name}
              </h2>
            </div>
            <button
              onClick={fetchData}
              className="p-2.5 rounded-2xl bg-white border border-sandstone/30 text-teak hover:bg-slate-50 transition shadow-sm cursor-pointer"
              title="Reload Data"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </header>

          {/* Pending Approval Banner Alert */}
          {((clinics.filter(c => c.approvalStatus === 'pending').length > 0) || (labs.filter(l => l.approvalStatus === 'pending').length > 0)) && (
            <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400/40 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-black flex items-center justify-center text-lg animate-pulse">
                  🚨
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-900">
                    Pending Registration Approval Requests
                  </h4>
                  <p className="text-xs text-amber-800 font-medium">
                    You have {clinics.filter(c => c.approvalStatus === 'pending').length} clinic(s) and {labs.filter(l => l.approvalStatus === 'pending').length} lab(s) waiting for Super Admin review.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('clinics')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-teal-950 font-black text-xs hover:bg-amber-400 transition cursor-pointer"
                >
                  Review Clinics
                </button>
                <button
                  onClick={() => setActiveTab('labs')}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-900 text-white font-black text-xs hover:bg-teal-800 transition cursor-pointer"
                >
                  Review Labs
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3 bg-white/40 border border-sandstone/25 rounded-3xl">
              <RefreshCw className="animate-spin text-marigold" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest text-khaki">Syncing global ledger...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewTab
                  totalRevenue={totalRevenue}
                  activeSubscribers={activeSubscribers}
                  clinics={clinics}
                  tickets={tickets}
                  payments={payments}
                  config={config}
                  handleEditCampaignModal={handleEditCampaignModal}
                />
              )}
              {activeTab === 'clinics' && (
                <ClinicsTab
                  filteredClinics={filteredClinics}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  handleSetCustomPrice={handleSetCustomPrice}
                  handleSetCustomLimits={handleSetCustomLimits}
                  handleToggleNetwork={handleToggleNetwork}
                  handleTogglePremium={handleTogglePremium}
                  handleEditSubscription={handleEditSubscription}
                  handleGiftSubscription={handleGiftSubscription}
                  handleToggleActive={handleToggleActive}
                  handleDeleteFacility={handleDeleteFacility}
                  onSelectFacility={handleOpenOverview}
                  handleApproveReject={handleApproveReject}
                />
              )}
              {activeTab === 'labs' && (
                <LabsTab
                  filteredLabs={filteredLabs}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  handleSetCustomPrice={handleSetCustomPrice}
                  handleToggleNetwork={handleToggleNetwork}
                  handleTogglePremium={handleTogglePremium}
                  handleEditSubscription={handleEditSubscription}
                  handleGiftSubscription={handleGiftSubscription}
                  handleToggleActive={handleToggleActive}
                  handleDeleteFacility={handleDeleteFacility}
                  onSelectFacility={handleOpenOverview}
                  handleApproveReject={handleApproveReject}
                />
              )}
              {activeTab === 'plans' && (
                <PlansTab
                  plans={plans}
                  editingPlan={editingPlan}
                  setEditingPlan={setEditingPlan}
                  newPlan={newPlan}
                  setNewPlan={setNewPlan}
                  handleCreateOrUpdatePlan={handleCreateOrUpdatePlan}
                  handleEditPlanClick={handleEditPlanClick}
                  handleDeletePlan={handleDeletePlan}
                />
              )}
              {activeTab === 'payments' && (
                <PaymentsTab
                  payments={payments}
                  handleDeletePayment={handleDeletePayment}
                />
              )}
              {activeTab === 'promos' && (
                <PromosTab
                  newPromo={newPromo}
                  setNewPromo={setNewPromo}
                  handleCreatePromo={handleCreatePromo}
                  promos={promos}
                  handleDeletePromo={handleDeletePromo}
                />
              )}
              {activeTab === 'tickets' && (
                <TicketsTab
                  tickets={tickets}
                  handleResolveTicket={handleResolveTicket}
                />
              )}
              {activeTab === 'config' && (
                <ConfigTab
                  config={config}
                  setConfig={setConfig}
                  savingConfig={savingConfig}
                  handleUpdateConfig={handleUpdateConfig}
                />
              )}
            </>
          )}

          {/* Facility Overview Modal */}
          <FacilityOverviewModal
            facility={selectedFacility}
            facilityType={selectedFacilityType}
            isOpen={isOverviewOpen}
            onClose={() => setIsOverviewOpen(false)}
            token={localStorage.getItem('token')}
            onRefreshData={fetchData}
            onApproveReject={handleApproveReject}
            onGiftSubscription={handleGiftSubscription}
            onToggleActive={handleToggleActive}
          />
        </main>

      </div>
    </div>
  );
};

export default SuperAdminDashboard;
