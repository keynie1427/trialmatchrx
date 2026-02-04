'use client';

import Link from 'next/link';

export default function HowItWorksPage() {
  const steps = [
    {
      number: '1',
      title: 'Create Your Profile',
      description: 'Tell us about your diagnosis, including cancer type, stage, biomarkers, and treatment history. This helps us find the most relevant trials for you.',
      icon: '👤',
    },
    {
      number: '2',
      title: 'Search for Trials',
      description: 'Use our smart search to find clinical trials matching your profile. Filter by location, phase, and status to narrow down your options.',
      icon: '🔍',
    },
    {
      number: '3',
      title: 'Get AI-Powered Insights',
      description: 'Our AI explains complex trial information in plain English, helps you understand eligibility, and provides personalized pros and cons.',
      icon: '🤖',
    },
    {
      number: '4',
      title: 'Compare & Save',
      description: 'Save trials you\'re interested in and compare them side-by-side. Get AI-generated insights to help you make informed decisions.',
      icon: '📊',
    },
    {
      number: '5',
      title: 'Talk to Your Doctor',
      description: 'Share your findings with your healthcare team. Our summaries and comparisons make it easier to have informed conversations.',
      icon: '👨‍⚕️',
    },
  ];

  const features = [
    {
      title: 'AI Trial Summarizer',
      description: 'Complex trial documents translated into easy-to-understand summaries.',
      icon: '📝',
    },
    {
      title: 'Eligibility Chat',
      description: 'Ask questions about trial requirements and get instant, personalized answers.',
      icon: '💬',
    },
    {
      title: 'Treatment Timeline',
      description: 'Visualize what participation in a trial might look like over time.',
      icon: '📅',
    },
    {
      title: 'Smart Matching',
      description: 'Our AI suggests trials based on your specific cancer profile and biomarkers.',
      icon: '🎯',
    },
    {
      title: 'Trial Comparison',
      description: 'Compare multiple trials side-by-side with AI-generated pros and cons.',
      icon: '⚖️',
    },
    {
      title: 'Email Alerts',
      description: 'Get notified when new trials match your profile with AI-summarized digests.',
      icon: '🔔',
    },
  ];

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">How MyTrialMatchRX Works</h1>
          <p className="text-xl opacity-90">
            Finding the right clinical trial shouldn't be overwhelming. We use AI to simplify the process.
          </p>
        </div>
      </div>

      {/* Steps Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-surface-900 dark:text-white mb-12">
          Your Journey to Finding a Trial
        </h2>
        
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className="flex gap-6 items-start bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm border border-surface-200 dark:border-surface-700"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {step.number}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{step.icon}</span>
                  <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
                    {step.title}
                  </h3>
                </div>
                <p className="text-surface-600 dark:text-surface-400">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white dark:bg-surface-800 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-surface-900 dark:text-white mb-4">
            AI-Powered Features
          </h2>
          <p className="text-center text-surface-600 dark:text-surface-400 mb-12">
            Tools designed to help you understand and navigate clinical trials
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="bg-surface-50 dark:bg-surface-700 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <h3 className="font-semibold text-surface-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-surface-600 dark:text-surface-400 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
          Ready to Find Your Trial?
        </h2>
        <p className="text-surface-600 dark:text-surface-400 mb-8">
          Create your free profile and start searching for clinical trials today.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/search"
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all"
          >
            Search Trials
          </Link>
          <Link
            href="/profile"
            className="px-6 py-3 bg-surface-200 dark:bg-surface-700 text-surface-900 dark:text-white font-medium rounded-lg hover:bg-surface-300 dark:hover:bg-surface-600 transition-all"
          >
            Create Profile
          </Link>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-surface-100 dark:bg-surface-800 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-sm text-surface-500 dark:text-surface-400">
            <strong>Disclaimer:</strong> MyTrialMatchRX is an informational tool only. 
            It does not provide medical advice, diagnosis, or treatment recommendations. 
            Always consult with your oncologist or healthcare provider before making any decisions about clinical trial participation.
          </p>
        </div>
      </div>
    </div>
  );
}
