"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/search", label: "Search Trials" },
    { href: "/favorites", label: "Favorites" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "bg-blue-800/90 shadow-lg border-b border-blue-600/50"
          : "bg-blue-700/70 border-b border-blue-500/30"
      }`}
    >
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-3">
        {/* Logo / Title */}
        <Link
          href="/"
          className={`text-xl font-bold tracking-wide transition ${
            scrolled
              ? "text-white hover:text-blue-100 drop-shadow-sm"
              : "text-blue-50 hover:text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]"
          }`}
        >
          TrialMatchRX
        </Link>

        {/* Navigation */}
        <nav className="flex gap-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition ${
                pathname === item.href
                  ? "text-white font-semibold underline underline-offset-4"
                  : scrolled
                  ? "text-blue-100 hover:text-white"
                  : "text-blue-50 hover:text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.5)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}