import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const DOCS = [
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/legal/terms', label: 'Terms of Use' },
  { href: '/legal/disclaimer', label: 'Medical Disclaimer' },
  { href: '/legal/hipaa', label: 'HIPAA Notice' },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 dark:bg-surface-950">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <nav aria-label="Legal documents" className="flex flex-wrap gap-2 mb-6">
            {DOCS.map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className="px-3 py-1.5 rounded-full text-sm bg-white border border-gray-200 text-gray-700 hover:border-primary-400 hover:text-primary-700"
              >
                {d.label}
              </Link>
            ))}
          </nav>
          <article className="bg-white text-gray-900 shadow-sm rounded-lg p-8 sm:p-12">{children}</article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
