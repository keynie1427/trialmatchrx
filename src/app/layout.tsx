import type { Metadata } from 'next';
import FeedbackWidget from '@/components/FeedbackWidget';
import './globals.css';

export const metadata: Metadata = {
  title: 'TrialMatchRX | AI-Powered Clinical Trial Matching',
  description: 'Find cancer clinical trials matched to your specific diagnosis, biomarkers, and treatment history using AI-powered precision matching.',
  keywords: ['clinical trials', 'cancer', 'oncology', 'biomarkers', 'trial matching', 'cancer research'],
  authors: [{ name: 'TrialMatchRX' }],
  openGraph: {
    title: 'TrialMatchRX | AI-Powered Clinical Trial Matching',
    description: 'Find cancer clinical trials matched to your specific diagnosis, biomarkers, and treatment history.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrialMatchRX | AI-Powered Clinical Trial Matching',
    description: 'Find cancer clinical trials matched to your specific diagnosis, biomarkers, and treatment history.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#05c8ae" />
      </head>
      <body className="min-h-screen bg-mesh bg-fixed">
        <div className="relative min-h-screen bg-noise">
          {children}
          <FeedbackWidget />
        </div>
      </body>
    </html>
  );
}
