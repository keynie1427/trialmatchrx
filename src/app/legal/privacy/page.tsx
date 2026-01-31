'use client';

import React from 'react';

const EFFECTIVE_DATE = 'January 30, 2026';
const APP_NAME = 'TrialMatchRX';
const CONTACT_EMAIL = '[CONTACT_EMAIL]';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Effective Date: {EFFECTIVE_DATE}</p>

          <p className="text-gray-700 mb-6">
            {APP_NAME} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting
            your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you use our Service.
          </p>

          <Section title="1. Information We Collect">
            <h3 className="font-semibold text-gray-800 mt-4 mb-2">
              a. Information You Provide Directly
            </h3>
            <p className="mb-2">When you create an account or use the Service, you may provide:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Name and email address</li>
              <li>Account credentials (password, authentication tokens)</li>
              <li>Search criteria and preferences (conditions, locations, trial filters)</li>
              <li>Saved/bookmarked clinical trial identifiers</li>
              <li>Profile information and preferences</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">
              b. Information Collected Automatically
            </h3>
            <p className="mb-2">When you access the Service, we may automatically collect:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Device information (browser type, operating system, device type)</li>
              <li>Usage data (pages visited, features used, search queries)</li>
              <li>IP address and approximate location</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Log data and analytics information</li>
            </ul>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">
              c. Information from Third-Party Services
            </h3>
            <p>
              If you sign in using a third-party provider (e.g., Google), we may receive your name,
              email, and profile picture as permitted by that provider.
            </p>
          </Section>

          <Section title="2. How We Use Your Information">
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process and manage your account</li>
              <li>Personalize your experience and deliver relevant search results</li>
              <li>Communicate with you about the Service, updates, and support</li>
              <li>Monitor and analyze usage trends and preferences</li>
              <li>Protect against unauthorized access and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="3. Data Storage and Security">
            <p>
              We use industry-standard security measures to protect your information, including
              encryption in transit (TLS/SSL) and at rest. Your data is stored using Firebase/Google
              Cloud Platform infrastructure with enterprise-grade security controls. However, no method
              of electronic storage or transmission is 100% secure, and we cannot guarantee absolute
              security.
            </p>
          </Section>

          <Section title="4. Data Sharing and Disclosure">
            <p className="mb-2">
              We do not sell, rent, or trade your personal information. We may share your information
              only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                With service providers who assist in operating the Service (e.g., hosting, analytics)
                under strict confidentiality obligations
              </li>
              <li>To comply with applicable laws, regulations, or legal processes</li>
              <li>
                To protect the rights, property, or safety of the Service, our users, or the public
              </li>
              <li>In connection with a merger, acquisition, or sale of assets (with prior notice)</li>
            </ul>
          </Section>

          <Section title="5. Cookies and Tracking">
            <p>
              We use cookies and similar technologies to maintain your session, remember your
              preferences, and analyze Service usage. You can control cookie settings through your
              browser preferences. Disabling cookies may affect Service functionality.
            </p>
          </Section>

          <Section title="6. Data Retention">
            <p>
              We retain your personal information for as long as your account is active or as needed to
              provide the Service. You may request deletion of your account and associated data at any
              time by contacting us. Certain information may be retained as required by law or for
              legitimate business purposes.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p className="mb-2">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete personal data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict certain processing of your data</li>
              <li>Data portability (receive your data in a structured, machine-readable format)</li>
              <li>Withdraw consent at any time (where processing is based on consent)</li>
            </ul>
          </Section>

          <Section title="8. Children's Privacy">
            <p>
              The Service is not intended for individuals under the age of 18. We do not knowingly
              collect personal information from children. If we become aware that we have collected
              personal information from a child under 18, we will take steps to delete such information
              promptly.
            </p>
          </Section>

          <Section title="9. Changes to This Privacy Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material
              changes by posting the new Privacy Policy on the Service and updating the effective date.
              Your continued use of the Service after any changes constitutes acceptance of the updated
              policy.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>
              For questions or concerns about this Privacy Policy, or to exercise your rights regarding
              your personal data, please contact us at: {CONTACT_EMAIL}
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}
