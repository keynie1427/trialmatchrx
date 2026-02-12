'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Search, 
  Sparkles, 
  Target, 
  Bell, 
  Shield,
  ArrowRight,
  Dna,
  MapPin,
  Clock,
  Users,
  CheckCircle2
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchForm from '@/components/SearchForm';


const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Matching',
    description: 'Our AI analyzes eligibility criteria and matches trials to your specific cancer profile, biomarkers, and treatment history.',
  },
  {
    icon: Target,
    title: 'Precision Scoring',
    description: 'Each trial receives a match score based on how well it fits your profile, helping you prioritize the best options.',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Get notified when new trials matching your criteria become available. Never miss an opportunity.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your health information stays private. We never share your data with third parties.',
  },
];

const stats = [
  { value: '10,000+', label: 'Active Cancer Trials' },
  { value: '200+', label: 'Cancer Types Covered' },
  { value: '50+', label: 'Biomarkers Tracked' },
  { value: '5,000+', label: 'Research Sites' },
];

const steps = [
  {
    number: '01',
    title: 'Enter Your Profile',
    description: 'Tell us about your cancer type, stage, biomarkers, and treatment history.',
    icon: Users,
  },
  {
    number: '02',
    title: 'AI Matches Trials',
    description: 'Our AI engine analyzes thousands of trials and ranks them by relevance to your profile.',
    icon: Sparkles,
  },
  {
    number: '03',
    title: 'Review & Connect',
    description: 'Explore matched trials, save favorites, and contact research coordinators directly.',
    icon: CheckCircle2,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-400/20 rounded-full blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Clinical Trial Matching
                </div>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  Find Clinical Trials{' '}
                  <span className="text-gradient">Designed for You</span>
                </h1>

                <p className="text-lg text-surface-600 dark:text-surface-400 mb-8 max-w-lg">
                  Precision matching for cancer trials — personalized by your cancer type, 
                  stage, biomarkers, and treatment history. Let AI help you find the right trial.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/search" className="btn-primary text-lg px-8 py-4">
                    <Search className="w-5 h-5" />
                    Search Trials Now
                  </Link>
                  <Link href="#how-it-works" className="btn-secondary text-lg px-8 py-4">
                    Learn How It Works
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="mt-12 flex items-center gap-6 text-sm text-surface-500">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    HIPAA Compliant
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Free to Use
                  </div>
                </div>
              </motion.div>

              {/* Right: Search Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="card p-6 lg:p-8 shadow-xl"
              >
                <h2 className="font-display text-xl font-semibold mb-6">
                  Start Your Search
                </h2>
                <SearchForm compact />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-surface-100 dark:bg-surface-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="font-display text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-surface-600 dark:text-surface-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Why TrialMatchRX?
              </h2>
              <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
                We combine the latest in AI technology with comprehensive clinical trial data 
                to help you find the most relevant trials for your situation.
              </p>
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
                  <h3 className="font-display font-semibold text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400 text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-surface-100 dark:bg-surface-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
                Finding the right clinical trial is simple with our three-step process.
              </p>
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
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-500 to-transparent" />
                  )}

                  <div className="card p-8 text-center relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/25">
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-sm font-mono text-primary-600 dark:text-primary-400 mb-2">
                      Step {step.number}
                    </div>
                    <h3 className="font-display font-semibold text-xl mb-3">
                      {step.title}
                    </h3>
                    <p className="text-surface-600 dark:text-surface-400">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="card p-8 lg:p-12 text-center bg-gradient-to-br from-primary-600 to-primary-800 text-white overflow-hidden relative"
            >
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              </div>

              <div className="relative">
                <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                  Ready to Find Your Match?
                </h2>
                <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
                  Start your search today and discover clinical trials specifically matched 
                  to your cancer diagnosis and treatment history.
                </p>
                <Link 
                  href="/search" 
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-primary-700 font-semibold text-lg hover:bg-primary-50 transition-colors shadow-lg"
                >
                  Start Searching
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
