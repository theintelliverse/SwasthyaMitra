import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';

/**
 * Unified Native App Shell Layout for Patient Panel
 * - On Mobile (< 1024px): Behaves like a true native mobile app.
 *   The screen container fills 100dvh with zero root scrolling, the main content scrolls inside,
 *   and the bottom navigation bar is permanently docked at the bottom of the device viewport.
 * - On Desktop (>= 1024px): Standard desktop panel layout with sticky sidebar on the left.
 */
const PatientLayout = () => {
  return (
    <div className="flex flex-col lg:flex-row h-screen h-[100dvh] max-h-screen max-h-[100dvh] lg:h-auto lg:max-h-none lg:min-h-screen w-full bg-[#F8FAFC] text-slate-800 font-body antialiased overflow-hidden lg:overflow-visible patient-mobile-shell">
      {/* Unified Navigation: Desktop Sidebar & Mobile Sticky Bottom Nav */}
      <Sidebar role="patient" />

      {/* Main Content Area - Native App Scroll Container */}
      <main className="flex-1 min-w-0 w-full overflow-y-auto overflow-x-hidden overscroll-y-contain pb-[calc(76px+env(safe-area-inset-bottom,12px))] lg:pb-10 lg:overflow-visible">
        <Outlet />
      </main>
    </div>
  );
};

export default PatientLayout;

