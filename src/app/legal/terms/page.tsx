'use client';

import React from 'react';

const EFFECTIVE_DATE = 'January 30, 2026';
const APP_NAME = 'TrialMatchRX';
const CONTACT_EMAIL = 'trialmatchrx@ijelany.com';

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Use</h1>
          <p className="text-sm text-gray-500 mb-8">Effective Date: {EFFECTIVE_DATE}</p>

          <p className="text-gray-700 mb-6">
            Welcome to {APP_NAME}. By accessing or using our website, mobile application, or any
            services provided by {APP_NAME} (collectively, the &quot;Service&quot;), you agree to be
            bound by these Terms of Use (&quot;Terms&quot;). If you do not agree to these Terms, you
            must not access or use the Service.
          </p>

          <Section title="1. Acceptance of Terms">
            <p>
              By creating an account, accessing, or using the Service, you acknowledge that you have
              read, understood, and agree to be bound by these Terms, our Privacy Policy, Medical
              Disclaimer, and HIPAA Notice. These Terms constitute a legally binding agreement between
              you and {APP_NAME}.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p className="mb-4">
              {APP_NAME} is a clinical trial search and matching platform that provides informational
              tools to help users discover and compare clinical trials listed on ClinicalTrials.gov
              and other public registries. The Service may include features such as:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Searching and filtering clinical trials based on user-specified criteria</li>
              <li>Saving and bookmarking clinical trials for later review</li>
              <li>Side-by-side comparison of clinical trial details</li>
              <li>User account management and personalization features</li>
              <li>AI-powered trial matching and analysis (where available)</li>
            </ul>
          </Section>

          <Section title="3. Not Medical Advice">
            <p className="font-semibold text-gray-900">
              THE SERVICE IS FOR INFORMATIONAL PURPOSES ONLY. {APP_NAME.toUpperCase()} DOES NOT
              PROVIDE MEDICAL ADVICE, DIAGNOSIS, OR TREATMENT. The information provided through the
              Service should not be used as a substitute for professional medical advice, diagnosis,
              or treatment. Always seek the advice of your physician or other qualified health provider
              with any questions you may have regarding a medical condition or clinical trial
              participation.
            </p>
          </Section>

          <Section title="4. User Accounts">
            <p>
              To access certain features of the Service, you may be required to create an account. You
              agree to provide accurate, current, and complete information during registration and to
              update such information as necessary. You are solely responsible for maintaining the
              confidentiality of your account credentials and for all activities that occur under your
              account.
            </p>
          </Section>

          <Section title="5. Acceptable Use">
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Attempt to gain unauthorized access to any portion of the Service</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Scrape, harvest, or collect data through automated means without consent</li>
              <li>Impersonate any person or entity</li>
              <li>Use the Service to provide medical advice to third parties</li>
              <li>Upload or transmit viruses, malware, or other malicious code</li>
            </ul>
          </Section>

          <Section title="6. Intellectual Property">
            <p>
              All content, features, and functionality of the Service, including but not limited to
              text, graphics, logos, icons, software, and the compilation thereof, are the exclusive
              property of {APP_NAME} or its licensors and are protected by intellectual property laws.
              Clinical trial data sourced from public registries remains in the public domain.
            </p>
          </Section>

          <Section title="7. Third-Party Data and Services">
            <p>
              The Service aggregates clinical trial information from public sources including
              ClinicalTrials.gov, maintained by the National Library of Medicine (NLM). We do not
              guarantee the accuracy, completeness, or timeliness of any third-party data. Links to
              third-party websites or services are provided for convenience only and do not constitute
              endorsement.
            </p>
          </Section>

          <Section title="8. Disclaimer of Warranties">
            <p className="font-semibold text-gray-900">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
              OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES
              OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR ACCURACY.
              {APP_NAME.toUpperCase()} DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
              ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p className="font-semibold text-gray-900">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL{' '}
              {APP_NAME.toUpperCase()}, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
              INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE
              LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE
              SERVICE, ANY MEDICAL DECISIONS MADE BASED ON INFORMATION PROVIDED BY THE SERVICE, ANY
              UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR DATA, OR ANY OTHER MATTER RELATING TO THE
              SERVICE.
            </p>
          </Section>

          <Section title="10. Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless {APP_NAME}, its officers, directors,
              employees, agents, and affiliates from and against any and all claims, liabilities,
              damages, losses, costs, or expenses (including reasonable attorney fees) arising out of
              or in connection with your use of the Service, your violation of these Terms, your
              violation of any third-party rights, or any medical decisions made based on information
              obtained through the Service.
            </p>
          </Section>

          <Section title="11. Modifications to Terms">
            <p>
              {APP_NAME} reserves the right to modify these Terms at any time. Changes will be
              effective immediately upon posting the revised Terms on the Service. Your continued use
              of the Service after any changes constitutes your acceptance of the new Terms.
            </p>
          </Section>

          <Section title="12. Termination">
            <p>
              We may terminate or suspend your access to the Service immediately, without prior notice
              or liability, for any reason whatsoever, including without limitation if you breach these
              Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </Section>

          <Section title="13. Governing Law">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State
              of Louisiana, without regard to its conflict of law provisions. Any disputes arising
              under or in connection with these Terms shall be subject to the exclusive jurisdiction of
              the courts located in the State of Louisiana.
            </p>
          </Section>

          <Section title="14. Severability">
            <p>
              If any provision of these Terms is held to be unenforceable or invalid, such provision
              will be changed and interpreted to accomplish the objectives of such provision to the
              greatest extent possible under applicable law, and the remaining provisions will continue
              in full force and effect.
            </p>
          </Section>

          <Section title="15. Contact Information">
            <p>
              If you have questions about these Terms, please contact us at: {CONTACT_EMAIL}
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

