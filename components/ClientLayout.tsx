"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      {/* ✅ Add top padding so the fixed header never overlaps content */}
      <main className="flex-grow pt-28 sm:pt-32">{children}</main>

      <BackToTop />
      <Footer />
    </div>
  );
}