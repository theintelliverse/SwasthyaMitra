import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/auth/Login'));
const RegisterClinic = lazy(() => import('./pages/auth/RegisterClinic'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const AdminStaffManagement = lazy(() => import('./pages/admin/AdminStaffManagement'));
const Unauthorized = lazy(() => import('./pages/auth/Unauthorized'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ClinicAnalytics = lazy(() => import('./pages/admin/ClinicAnalytics'));
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard'));
const DoctorAppointments = lazy(() => import('./pages/doctor/Appointments'));
const DoctorPrescriptions = lazy(() => import('./pages/doctor/Prescriptions'));
const DoctorReports = lazy(() => import('./pages/doctor/Reports'));
const DoctorAllReports = lazy(() => import('./pages/doctor/AllReports'));
const DoctorTemplates = lazy(() => import('./pages/doctor/Templates'));
const ReceptionDashboard = lazy(() => import('./pages/receptionist/ReceptionDashboard'));
const AddPatient = lazy(() => import('./pages/receptionist/AddPatient'));
const LabDashboard = lazy(() => import('./pages/lab/LabDashboard'));
const LabTestRequests = lazy(() => import('./pages/lab/TestRequests'));
const LabSamples = lazy(() => import('./pages/lab/Samples'));
const LabReports = lazy(() => import('./pages/lab/Reports'));
const LabAnalytics = lazy(() => import('./pages/lab/Analytics'));
const LabSettings = lazy(() => import('./pages/lab/Settings'));
const ClinicSettings = lazy(() => import('./pages/admin/ClinicSettings'));
const ProfilePage = lazy(() => import('./pages/shared/ProfilePage'));
const ClinicTVDisplay = lazy(() => import('./pages/shared/ClinicTVDisplay'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const PatientCheckIn = lazy(() => import('./pages/patient/PatientCheckIn'));
const PatientStatus = lazy(() => import('./pages/patient/PatientStatus'));
const PatientLogin = lazy(() => import('./pages/patient/PatientLogin'));
const PatientRegister = lazy(() => import('./pages/patient/PatientRegister'));
const PatientForgotPassword = lazy(() => import('./pages/patient/PatientForgotPassword'));
const BookAppointment = lazy(() => import('./pages/patient/BookAppointment'));
const HealthLocker = lazy(() => import('./pages/patient/HealthLocker'));
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard'));
const LockerSearch = lazy(() => import('./pages/doctor/LockerSearch'));
const MedicalHistory = lazy(() => import('./pages/shared/MedicalHistory'));
const Privacy = lazy(() => import('./pages/shared/Privacy'));
const Terms = lazy(() => import('./pages/shared/Terms'));
const Contact = lazy(() => import('./pages/shared/Contact'));

// Independent Lab Portal
const LabLogin = lazy(() => import('./pages/auth/LabLogin'));
const LabRegister = lazy(() => import('./pages/auth/LabRegister'));
const LabForgotPassword = lazy(() => import('./pages/auth/LabForgotPassword'));
const LabResetPassword = lazy(() => import('./pages/auth/LabResetPassword'));
const LabPortalDashboard = lazy(() => import('./pages/lab-portal/LabPortalDashboard'));
const LabPortalConnections = lazy(() => import('./pages/lab-portal/LabPortalConnections'));
const LabPortalReports = lazy(() => import('./pages/lab-portal/LabPortalReports'));
const LabPortalAnalytics = lazy(() => import('./pages/lab-portal/LabPortalAnalytics'));

// Public SEO & Profile Pages
const ClinicPublicProfile = lazy(() => import('./pages/public/ClinicPublicProfile'));
const DoctorPublicProfile = lazy(() => import('./pages/public/DoctorPublicProfile'));
const LabPublicProfile = lazy(() => import('./pages/public/LabPublicProfile'));

// Super Admin & Subscriptions
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const SubscriptionCheckout = lazy(() => import('./pages/shared/SubscriptionCheckout'));
const MaintenanceMode = lazy(() => import('./pages/shared/MaintenanceMode'));
const SubscriptionDetails = lazy(() => import('./pages/shared/SubscriptionDetails'));
const PendingApprovalPage = lazy(() => import('./pages/shared/PendingApprovalPage'));

import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { API_URL } from './config/runtime';

// Import Security Guard & Loaders
import ProtectedRoute from './components/ProtectedRoute';
import SkeletonLoader from './components/SkeletonLoader';

const routeFallback = <SkeletonLoader />;

const PlatformGuard = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const checkPlatformState = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/superadmin/config/public`);
        if (!res.data.success) {
          setChecking(false);
          return;
        }

        const role = localStorage.getItem('role') || localStorage.getItem('labRole');
        const token = localStorage.getItem('token') || localStorage.getItem('labToken');

        // 1. Maintenance Mode check
        if (res.data.isMaintenanceMode && role !== 'superadmin' && window.location.pathname !== '/maintenance') {
          setIsMaintenance(true);
          setChecking(false);
          return;
        }

        // 2. Subscription Enforced check
        if (res.data.isSubscriptionEnforced && token && role !== 'superadmin' && window.location.pathname !== '/subscription-checkout' && window.location.pathname !== '/maintenance') {
          const isLab = localStorage.getItem('labRole') === 'independent_lab';
          const authToken = isLab ? (localStorage.getItem('labToken') || token) : token;
          const profileUrl = isLab ? `${API_URL}/api/auth/lab/me` : `${API_URL}/api/auth/me`;
          
          const profileRes = await axios.get(profileUrl, {
            headers: { Authorization: `Bearer ${authToken}` }
          });

          if (profileRes.data.success) {
            let expiresAt;
            if (isLab) {
              expiresAt = profileRes.data.data.subscriptionExpiresAt;
            } else {
              const user = profileRes.data.data;
              const clinicRes = await axios.get(`${API_URL}/api/clinic/public/${user.clinicId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              expiresAt = clinicRes.data.data.subscriptionExpiresAt;
            }

            if (!expiresAt || new Date(expiresAt) < new Date()) {
              setIsExpired(true);
            }
          }
        }
      } catch (err) {
        console.error('Platform guard state error:', err);
      } finally {
        setChecking(false);
      }
    };

    checkPlatformState();
  }, []);

  if (checking) {
    return <SkeletonLoader />;
  }

  if (isMaintenance && window.location.pathname !== '/maintenance') {
    window.location.href = '/maintenance';
    return null;
  }

  if (isExpired && window.location.pathname !== '/subscription-checkout') {
    window.location.href = '/subscription-checkout';
    return null;
  }

  return <div className="animate-fade-in">{children}</div>;
};

const App = () => {
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 402) {
          if (window.location.pathname !== '/subscription-checkout') {
            window.location.href = '/subscription-checkout';
          }
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-parchment font-body text-teak selection:bg-marigold selection:text-white">
        <PlatformGuard>
          <Suspense fallback={routeFallback}>
            <Routes>
              {/* --- 🌍 Public Routes --- */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register-clinic" element={<RegisterClinic />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/maintenance" element={<MaintenanceMode />} />
              <Route path="/subscription-checkout" element={<SubscriptionCheckout />} />
              <Route 
                path="/pending-approval" 
                element={
                  <PendingApprovalPage 
                    facility={JSON.parse(localStorage.getItem('pendingFacility') || '{}')} 
                    onLogout={() => { 
                      localStorage.removeItem('pendingFacility'); 
                      window.location.href = '/login'; 
                    }} 
                  />
                } 
              />


              {/* --- 🌐 Public SEO & Entity Profile Pages --- */}
              <Route path="/c/:identifier" element={<ClinicPublicProfile />} />
              <Route path="/clinic/profile/:identifier" element={<ClinicPublicProfile />} />
              <Route path="/d/:identifier" element={<DoctorPublicProfile />} />
              <Route path="/doctor/profile/:identifier" element={<DoctorPublicProfile />} />
              <Route path="/l/:identifier" element={<LabPublicProfile />} />
              <Route path="/lab/profile/:identifier" element={<LabPublicProfile />} />

              {/* --- 👑 Super Admin Dashboard Route --- */}
              <Route
                path="/superadmin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* --- 🔬 Independent Lab Portal Routes --- */}
              <Route path="/lab/login" element={<LabLogin />} />
              <Route path="/lab/register" element={<LabRegister />} />
              <Route path="/lab/forgot-password" element={<LabForgotPassword />} />
              <Route path="/lab/reset-password" element={<LabResetPassword />} />
              <Route
                path="/lab/portal/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['independent_lab']}>
                    <LabPortalDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab/portal/connections"
                element={
                  <ProtectedRoute allowedRoles={['independent_lab']}>
                    <LabPortalConnections />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab/portal/reports"
                element={
                  <ProtectedRoute allowedRoles={['independent_lab', 'lab', 'doctor', 'admin']}>
                    <LabPortalReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab/portal/analytics"
                element={
                  <ProtectedRoute allowedRoles={['independent_lab']}>
                    <LabPortalAnalytics />
                  </ProtectedRoute>
                }
              />

              {/* --- 📱 Patient Routes (QR & OTP) --- */}
              <Route path="/patient/checkin" element={<PatientCheckIn />} />
              <Route path="/patient/status" element={<PatientStatus />} />
              <Route path="/patient/login" element={<PatientLogin />} />
              <Route path="/patient/register" element={<PatientRegister />} />
              <Route path="/patient/forgot-password" element={<PatientForgotPassword />} />
              <Route
                path="/patient/book-appointment"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <BookAppointment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />

              {/* --- 🔐 Protected Staff Routes --- */}

              {/* Doctor Lane */}
              <Route
                path="/doctor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/appointments"
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorAppointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/prescriptions"
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorPrescriptions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/reports"
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/all-reports"
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorAllReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/templates"
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorTemplates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/locker"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <HealthLocker />
                  </ProtectedRoute>
                }
              />
              {/* New: Sidebar search for health lockers */}


              <Route
                path="/doctor/locker-search"
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <LockerSearch />
                  </ProtectedRoute>
                }
              />
              <Route path="/display/:clinicCode" element={<ClinicTVDisplay />} />
              <Route
                path="/doctor/records"
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <MedicalHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminReports />
                  </ProtectedRoute>
                }
              />

              {/* Lab Lane (Staff B) */}
              <Route
                path="/lab/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['lab']}>
                    <LabDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab/requests"
                element={
                  <ProtectedRoute allowedRoles={['lab']}>
                    <LabTestRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab/samples"
                element={
                  <ProtectedRoute allowedRoles={['lab']}>
                    <LabSamples />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab/reports"
                element={
                  <ProtectedRoute allowedRoles={['lab']}>
                    <LabReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab/analytics"
                element={
                  <ProtectedRoute allowedRoles={['lab']}>
                    <LabAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab/settings"
                element={
                  <ProtectedRoute allowedRoles={['lab']}>
                    <LabSettings />
                  </ProtectedRoute>
                }
              />

              {/* Receptionist Lane */}
              <Route
                path="/receptionist/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                    <ReceptionDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/receptionist/add"
                element={
                  <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                    <AddPatient />
                  </ProtectedRoute>
                }
              />

              {/* Shared Profile Page */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'lab', 'patient']}>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Shared Subscription Details Pages */}
              <Route
                path="/admin/subscription"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SubscriptionDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/subscription"
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <SubscriptionDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/receptionist/subscription"
                element={
                  <ProtectedRoute allowedRoles={['receptionist']}>
                    <SubscriptionDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab/subscription"
                element={
                  <ProtectedRoute allowedRoles={['lab']}>
                    <SubscriptionDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab/portal/subscription"
                element={
                  <ProtectedRoute allowedRoles={['independent_lab']}>
                    <SubscriptionDetails />
                  </ProtectedRoute>
                }
              />

              {/* --- 🔐 Protected Admin Routes --- */}
              {/* Auto-redirect for /admin to /admin/dashboard */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ClinicAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/staff-management"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminStaffManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/history"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <MedicalHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ClinicSettings />
                  </ProtectedRoute>
                }
              />

              {/* --- 🚫 Error & Catch-all Routes --- */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </PlatformGuard>
      </div>
    </Router>
  );
};

export default App;