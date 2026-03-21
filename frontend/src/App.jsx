import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import RegisterClinic from './pages/auth/RegisterClinic';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminStaffManagement from './pages/admin/AdminStaffManagement';
import Unauthorized from './pages/auth/Unauthorized';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClinicAnalytics from './pages/admin/ClinicAnalytics';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import ReceptionDashboard from './pages/receptionist/ReceptionDashboard';
import LabDashboard from './pages/lab/LabDashboard';
import ClinicSettings from './pages/admin/ClinicSettings';
import ProfilePage from './pages/shared/ProfilePage';
import ClinicTVDisplay from './pages/shared/ClinicTVDisplay';
import AdminReports from './pages/admin/AdminReports';
// Patient Pages
import PatientCheckIn from './pages/patient/PatientCheckIn';
import PatientStatus from './pages/patient/PatientStatus';
import PatientLogin from './pages/patient/PatientLogin';
import PatientRegister from './pages/patient/PatientRegister';
import PatientForgotPassword from './pages/patient/PatientForgotPassword';
import BookAppointment from './pages/patient/BookAppointment';
import HealthLocker from './pages/patient/HealthLocker';
import PatientDashboard from './pages/patient/PatientDashboard';
import LockerSearch from './pages/doctor/LockerSearch';
// Shared Pages
import MedicalHistory from './pages/shared/MedicalHistory';
import Privacy from './pages/shared/Privacy';
import Terms from './pages/shared/Terms';
import Contact from './pages/shared/Contact';

// Import Security Guard
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-parchment font-body text-teak selection:bg-marigold selection:text-white">
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
            path="/Patient/HealthLocker"
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
            path="/Admin/reports"
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

          {/* Receptionist Lane */}
          <Route
            path="/receptionist/dashboard"
            element={
              <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                <ReceptionDashboard />
              </ProtectedRoute>
            }
          />

          {/* Shared Profile Page */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'lab']}>
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
      </div>
    </Router>
  );
};

export default App;