'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  Target,
  Bell,
  Shield,
  ArrowRight,
  MapPin,
  Users,
  CheckCircle2,
  Database,
  Stethoscope,
  Lock,
  HeartHandshake,
  FileText,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchForm from '@/components/SearchForm';
import { useT, type TranslationKey } from '@/lib/i18n';
import { CANCER_TYPE_PAGES } from '@/lib/cancerTypes';

const features: { icon: any; title: TranslationKey; desc: TranslationKey }[] = [
  { icon: FileText, title: 'f1.title', desc: 'f1.desc' },
  { icon: Target, title: 'f2.title', desc: 'f2.desc' },
  { icon: MapPin, title: 'f3.title', desc: 'f3.desc' },
  { icon: Bell, title: 'f4.title', desc: 'f4.desc' },
];

const steps: { number: string; title: TranslationKey; desc: TranslationKey; icon: any }[] = [
  { number: '01', title: 'how.s1.title', desc: 'how.s1.desc', icon: Users },
  { number: '02', title: 'how.s2.title', desc: 'how.s2.desc', icon: Sparkles },
  { number: '03', title: 'how.s3.title', desc: 'how.s3.desc', icon: CheckCircle2 },
];

interface LiveStats {
  recruitingWorld: number | null;
  recruitingUS: number | null;
  newLast30Days: number | null;
  cancerTypes: number;
  asOf: string;
}

function fmt(n: number | null | undefined) {
  return typeof n === 'number' ? n.toLocaleString() : '—';
}

export default function HomePage() {
  const { t, lang } = useT();
  const [stats, setStats] = useState<LiveStats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d))
      .catch(() => {});
  }, []);

  const statItems: { value: string; label: TranslationKey }[] = [
    { value: fmt(stats?.recruitingWorld), label: 'stats.recruitingWorld' },
    { value: fmt(stats?.recruitingUS), label: 'stats.recruitingUS' },
    { value: fmt(stats?.newLast30Days), label: 'stats.new30' },
    { value: stats ? String(stats.cancerTypes) : '—', label: 'stats.cancerTypes' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-400/20 rounded-full blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  {t('hero.badge')}
                </div>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  {t('hero.title1')} <span className="text-gradient">{t('hero.title2')}</span>
                </h1>

                <p className="text-lg text-surface-600 dark:text-surface-400 mb-8 max-w-lg">{t('hero.subtitle')}</p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/search" className="btn-primary text-lg px-8 py-4">
                    <Search className="w-5 h-5" />
                    {t('hero.cta')}
                  </Link>
                  <Link href="#how-it-works" className="btn-secondary text-lg px-8 py-4">
                    {t('hero.learn')}
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-surface-500">
                  <Link href="/legal/hipaa" className="flex items-center gap-2 hover:text-primary-600 underline-offset-4 hover:underline">
                    <Shield className="w-4 h-4" />
                    {t('hero.privacy')}
                  </Link>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {t('hero.free')}
                  </div>
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4" />
                    {t('hero.caregiver')}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="card p-6 lg:p-8 shadow-xl"
              >
                <h2 className="font-display text-xl font-semibold mb-6">{t('hero.startSearch')}</h2>
                <SearchForm compact />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Live Stats */}
        <section className="py-12 bg-surface-100 dark:bg-surface-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {statItems.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="font-display text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2 tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-sm text-surface-600 dark:text-surface-400">{t(stat.label)}</div>
                </motion.div>
              ))}
            </div>
            <p className="mt-8 text-center text-xs text-surface-500 flex items-center justify-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              {t('stats.source')}
              {stats?.asOf && (
                <>
                  {' · '}
                  {t('stats.updated')}{' '}
                  {new Date(stats.asOf).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </>
              )}
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">{t('features.title')}</h2>
              <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">{t('features.subtitle')}</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{t(feature.title)}</h3>
                  <p className="text-surface-600 dark:text-surface-400 text-sm">{t(feature.desc)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-surface-100 dark:bg-surface-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">{t('how.title')}</h2>
              <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">{t('how.subtitle')}</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-500 to-transparent" />
                  )}
                  <div className="card p-8 text-center relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/25">
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-sm font-mono text-primary-600 dark:text-primary-400 mb-2">
                      {t('how.step')} {step.number}
                    </div>
                    <h3 className="font-display font-semibold text-xl mb-3">{t(step.title)}</h3>
                    <p className="text-surface-600 dark:text-surface-400">{t(step.desc)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-8 text-center">{t('trust.title')}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card p-5 flex gap-4">
                <Database className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-surface-700 dark:text-surface-300">{t('trust.source')}</p>
              </div>
              <div className="card p-5 flex gap-4">
                <Stethoscope className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-surface-700 dark:text-surface-300">
                  {t('trust.doctor')}{' '}
                  <Link href="/legal/disclaimer" className="text-primary-600 hover:underline">→</Link>
                </p>
              </div>
              <Link href="/legal/hipaa" className="card p-5 flex gap-4 hover:shadow-lg transition-shadow">
                <Lock className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-surface-700 dark:text-surface-300">{t('trust.privacy')}</p>
              </Link>
              <Link href="/about" className="card p-5 flex gap-4 hover:shadow-lg transition-shadow">
                <Users className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-surface-700 dark:text-surface-300">{t('trust.team')} →</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Browse by cancer type */}
        <section className="pb-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-2xl font-bold mb-6">{t('nav.cancerTypes')}</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {CANCER_TYPE_PAGES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/trials/${c.slug}`}
                  className="px-3 py-1.5 rounded-full text-sm bg-surface-100 dark:bg-surface-800 hover:bg-primary-100 dark:hover:bg-primary-900/40 hover:text-primary-700 transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="card p-8 lg:p-12 text-center bg-gradient-to-br from-primary-600 to-primary-800 text-white overflow-hidden relative"
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              </div>
              <div className="relative">
                <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">{t('cta.title')}</h2>
                <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">{t('cta.desc')}</p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-primary-700 font-semibold text-lg hover:bg-primary-50 transition-colors shadow-lg"
                >
                  {t('cta.button')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
