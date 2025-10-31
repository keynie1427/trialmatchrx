"use client";

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm">
        <p className="mb-2">
          &copy; {new Date().getFullYear()} <strong>TrialMatchRX</strong>. All rights reserved.
        </p>
        <p className="text-blue-200">
          Built with ❤️ to help patients find the right clinical trials.
        </p>
      </div>
    </footer>
  );
}