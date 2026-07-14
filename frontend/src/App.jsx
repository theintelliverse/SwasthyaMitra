import React, { Suspense, lazy } from 'react';
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
const LabPortalDashboard = lazy(() => import('./pages/lab-portal/LabPortalDashboard'));
const LabPortalConnections = lazy(() => import('./pages/lab-portal/LabPortalConnections'));
const LabPortalAnalytics = lazy(() => import('./pages/lab-portal/LabPortalAnalytics'));

// Import Security Guard
import ProtectedRoute from './components/ProtectedRoute';

const routeFallback = (
  <div className="flex min-h-[40vh] items-center justify-center text-sm text-sandstone">
    Loading...
  </div>
);

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-parchment font-body text-teak selection:bg-marigold selection:text-white">
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

            {/* --- 🔬 Independent Lab Portal Routes --- */}
            <Route path="/lab/login" element={<LabLogin />} />
            <Route path="/lab/register" element={<LabRegister />} />
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
      </div>
    </Router>
  );
};

export default App;