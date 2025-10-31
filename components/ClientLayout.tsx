"use client";

import Header from "./Header";
import Footer from "./Footer";
import BackToTop from "./BackToTop";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 🌟 Global Header */}
      <Header />

      {/* ✅ Add top padding so fixed header doesn’t overlap content */}
      <main className="flex-grow pt-28 sm:pt-32 px-4 md:px-8">{children}</main>

      {/* 🔼 Quick Scroll Helper */}
      <BackToTop />

      {/* 🌍 Global Footer */}
      <Footer />
    </div>
  );
}