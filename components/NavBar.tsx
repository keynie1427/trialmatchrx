"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react"; // ✅ Uses lucide-react icons (included in shadcn/ui stack)

export default function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (path: string) =>
    `block px-4 py-2 rounded-md transition ${
      pathname === path
        ? "bg-blue-700 text-white"
        : "text-blue-700 hover:bg-blue-100"
    }`;

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-3 md:py-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-blue-700">
          TrialMatchRX
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-2">
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>
          <Link href="/search" className={linkClass("/search")}>
            Search
          </Link>
          <Link href="/about" className={linkClass("/about")}>
            About
          </Link>
          <Link href="/admin" className={linkClass("/admin")}>
            Admin
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-blue-700 hover:text-blue-900"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-blue-50 border-t border-blue-100">
          <Link
            href="/"
            className={linkClass("/")}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/search"
            className={linkClass("/search")}
            onClick={() => setMenuOpen(false)}
          >
            Search
          </Link>
          <Link
            href="/about"
            className={linkClass("/about")}
            onClick={() => setMenuOpen(false)}
          >
            About
          </Link>
          <Link
            href="/admin"
            className={linkClass("/admin")}
            onClick={() => setMenuOpen(false)}
          >
            Admin
          </Link>
        </div>
      )}
    </nav>
  );
}