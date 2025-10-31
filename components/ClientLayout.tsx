"use client";

import dynamic from "next/dynamic";
import React from "react";

// 🧩 Try to dynamically import optional components
const Header = dynamic(() => import("@/components/Header").catch(() => () => null), { ssr: false });
const Footer = dynamic(() => import("@/components/Footer").catch(() => () => null), { ssr: false });
const BackToTop = dynamic(() => import("@/components/BackToTop").catch(() => () => null), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 🧭 Header — safely loaded if available */}
      <Header />

      {/* ✅ Add top padding so the fixed header never overlaps content */}
      <main className="flex-grow pt-28 sm:pt-32">{children}</main>

      {/* ⬆️ Scroll helper (auto-ignored if missing) */}
      <BackToTop />

      {/* 🦶 Footer — safely loaded if available */}
      <Footer />
    </div>
  );
}