import React from 'react';

const SkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-parchment font-body text-teak animate-pulse">
      {/* Navigation Bar Skeleton (Matches LandingPage Navbar exactly) */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 max-w-7xl mx-auto border-b border-sandstone/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 bg-marigold/25 rounded-xl"></div>
          <div className="h-5 w-24 sm:w-32 bg-teak/80 rounded-md"></div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-4 w-20 bg-sandstone/60 rounded hidden md:block"></div>
          <div className="h-8 w-24 bg-blue-100/60 rounded-full hidden sm:block"></div>
          <div className="h-8 w-28 sm:w-32 bg-teak/80 rounded-full"></div>
        </div>
      </nav>

      {/* Main Hero Section Skeleton (Matches LandingPage responsive grid) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 sm:pt-6 pb-12 sm:pb-20 grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        {/* Left Column Skeleton */}
        <div className="space-y-5 sm:space-y-7">
          {/* Badge Skeleton */}
          <div className="h-6 w-52 sm:w-64 bg-saffron/15 rounded-full border border-saffron/30"></div>

          {/* Heading Skeleton */}
          <div className="space-y-2">
            <div className="h-8 sm:h-12 lg:h-16 w-4/5 bg-teak/80 rounded-xl"></div>
            <div className="h-8 sm:h-12 lg:h-16 w-3/5 bg-marigold/40 rounded-xl"></div>
          </div>

          {/* Subtitle Skeleton */}
          <div className="space-y-2 max-w-md">
            <div className="h-3.5 w-full bg-khaki/30 rounded"></div>
            <div className="h-3.5 w-4/5 bg-khaki/30 rounded"></div>
          </div>

          {/* Primary & Secondary CTA Buttons Skeleton */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <div className="h-12 w-full sm:w-44 bg-marigold/40 rounded-2xl"></div>
            <div className="h-12 w-full sm:w-48 bg-white border-2 border-sandstone rounded-2xl"></div>
          </div>

          {/* 3 Role Action Cards Skeleton */}
          <div className="grid sm:grid-cols-3 gap-2.5 pt-2 max-w-xl">
            <div className="bg-white/60 border border-sandstone/30 p-3 rounded-[1.25rem] space-y-2">
              <div className="h-3 w-16 bg-marigold/30 rounded"></div>
              <div className="h-2.5 w-full bg-sandstone/50 rounded"></div>
              <div className="h-2.5 w-3/4 bg-sandstone/40 rounded"></div>
            </div>
            <div className="bg-white/60 border border-sandstone/30 p-3 rounded-[1.25rem] space-y-2">
              <div className="h-3 w-16 bg-marigold/30 rounded"></div>
              <div className="h-2.5 w-full bg-sandstone/50 rounded"></div>
              <div className="h-2.5 w-3/4 bg-sandstone/40 rounded"></div>
            </div>
            <div className="bg-blue-50/60 border border-blue-100/50 p-3 rounded-[1.25rem] space-y-2">
              <div className="h-3 w-16 bg-blue-400/30 rounded"></div>
              <div className="h-2.5 w-full bg-sandstone/50 rounded"></div>
              <div className="h-2.5 w-3/4 bg-sandstone/40 rounded"></div>
            </div>
          </div>

          {/* Powered by Footer Line Skeleton */}
          <div className="flex items-center gap-2.5 pt-1">
            <div className="h-3 w-20 bg-sandstone/60 rounded"></div>
            <div className="h-px w-6 bg-sandstone"></div>
            <div className="h-3 w-28 bg-sandstone/40 rounded"></div>
          </div>
        </div>

        {/* Right Dashboard Mockup Skeleton */}
        <div className="relative">
          <div className="bg-white border border-sandstone p-4 sm:p-6 rounded-[1.75rem] sm:rounded-[2.25rem] shadow-xl space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center px-1">
              <div className="space-y-1.5">
                <div className="h-4 w-36 bg-teak/70 rounded-md"></div>
                <div className="h-3 w-24 bg-khaki/30 rounded"></div>
              </div>
              <div className="space-y-1 text-right">
                <div className="h-7 w-12 bg-marigold/40 rounded-lg ml-auto"></div>
                <div className="h-2.5 w-20 bg-khaki/30 rounded ml-auto"></div>
              </div>
            </div>

            {/* Live Facility Cards Skeleton */}
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-sandstone bg-parchment flex justify-between items-center">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2.5 h-2.5 bg-marigold/60 rounded-full"></div>
                    <div className="space-y-1">
                      <div className="h-3.5 w-28 sm:w-36 bg-teak/60 rounded"></div>
                      <div className="h-2.5 w-20 bg-khaki/30 rounded"></div>
                    </div>
                  </div>
                  <div className="h-5 w-16 bg-sandstone/60 rounded"></div>
                </div>
              ))}
            </div>

            {/* Footer Efficiency Bar */}
            <div className="p-3 sm:p-4 bg-teak rounded-xl sm:rounded-2xl flex justify-between items-center">
              <div className="space-y-1">
                <div className="h-2.5 w-24 bg-parchment/40 rounded"></div>
                <div className="h-4 w-32 bg-parchment/80 rounded"></div>
              </div>
              <div className="w-8.5 h-8.5 rounded-lg bg-white/10"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SkeletonLoader;
