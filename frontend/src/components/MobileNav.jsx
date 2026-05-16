import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  BarChart3,
  Users,
  Settings,
  Beaker,
  Calendar,
  Pill,
  Bell,
  User
} from 'lucide-react';

const MobileNav = ({ role = 'lab' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define navigation items based on role
  const getNavItems = () => {
    const roleNavItems = {
      lab: [
        { icon: Home, label: 'Dashboard', path: '/lab/dashboard' },
        { icon: FileText, label: 'Tests', path: '/lab/test-requests' },
        { icon: Beaker, label: 'Samples', path: '/lab/samples' },
        { icon: BarChart3, label: 'Reports', path: '/lab/reports' },
        { icon: User, label: 'Profile', path: '/lab/profile' }
      ],
      doctor: [
        { icon: Home, label: 'Dashboard', path: '/doctor/dashboard' },
        { icon: Calendar, label: 'Appointments', path: '/doctor/appointments' },
        { icon: Users, label: 'Patients', path: '/doctor/patients' },
        { icon: Pill, label: 'Prescriptions', path: '/doctor/prescriptions' },
        { icon: User, label: 'Profile', path: '/doctor/profile' }
      ],
      admin: [
        { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Users, label: 'Staff', path: '/admin/staff' },
        { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
        { icon: User, label: 'Profile', path: '/admin/profile' }
      ],
      receptionist: [
        { icon: Home, label: 'Dashboard', path: '/receptionist/dashboard' },
        { icon: Calendar, label: 'Queue', path: '/receptionist/queue' },
        { icon: Users, label: 'Patients', path: '/receptionist/patients' },
        { icon: Bell, label: 'Notifications', path: '/receptionist/notifications' },
        { icon: User, label: 'Profile', path: '/receptionist/profile' }
      ],
      patient: [
        { icon: Home, label: 'Dashboard', path: '/patient/dashboard' },
        { icon: FileText, label: 'Appointments', path: '/patient/appointments' },
        { icon: Pill, label: 'Health', path: '/patient/health-locker' },
        { icon: BarChart3, label: 'Reports', path: '/patient/reports' },
        { icon: User, label: 'Profile', path: '/patient/profile' }
      ]
    };

    return roleNavItems[role] || roleNavItems.lab;
  };

  const navItems = getNavItems();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full px-2 transition-all ${
                active
                  ? 'text-teal-600'
                  : 'text-gray-600 hover:text-teal-500'
              }`}
            >
              <Icon
                size={20}
                className={`${active ? 'stroke-[2.5]' : 'stroke-2'}`}
              />
              <span className={`text-[10px] font-semibold whitespace-nowrap ${
                active ? 'text-teal-600' : 'text-gray-600'
              }`}>
                {item.label}
              </span>
              {active && (
                <div className="w-1 h-1 bg-teal-600 rounded-full -mt-1"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
