import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';

/**
 * Unified Layout for Patient Panel
 * Matches other panels (Doctor, Admin, Receptionist, Lab):
 * - Sticky Desktop Sidebar on screens >= 1024px
 * - Sticky Native Mobile App Bottom Navigation Bar permanently pinned at bottom of screen on < 1024px
 * - Single source of navigation: eliminates duplicate navbar issues across clinic and records views.
 */
const PatientLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 font-body antialiased">
      {/* Unified Navigation: Desktop Sidebar & Mobile Sticky Bottom Nav */}
      <Sidebar role="patient" />

      {/* Main Content Area with safe bottom spacing for mobile bottom bar */}
      <main className="flex-1 min-w-0 w-full pb-28 lg:pb-10 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default PatientLayout;

