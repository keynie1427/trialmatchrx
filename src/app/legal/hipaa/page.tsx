'use client';

import React from 'react';

const EFFECTIVE_DATE = 'January 30, 2026';
const APP_NAME = 'TrialMatchRX';
const CONTACT_EMAIL = 'trialmatchrx@ijelany.com';

export default function HipaaNoticePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">HIPAA Notice</h1>
          <p className="text-sm text-gray-500 mb-8">Effective Date: {EFFECTIVE_DATE}</p>

          <Section title="1. HIPAA Applicability Statement">
            <p className="mb-4">
              This notice is provided for transparency regarding the Health Insurance Portability and
              Accountability Act of 1996 (&quot;HIPAA&quot;) and its relationship to {APP_NAME}.
            </p>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r">
              <p className="text-green-800 font-semibold">
                IMPORTANT: {APP_NAME} is NOT a Covered Entity or Business Associate as defined under
                HIPAA. As a clinical trial search and informational tool, {APP_NAME} does not provide
                healthcare services, process health insurance claims, serve as a healthcare
                clearinghouse, or access, store, or transmit Protected Health Information (PHI) as
                defined under HIPAA.
              </p>
            </div>
          </Section>

          <Section title="2. What is HIPAA?">
            <p>
              HIPAA is a federal law that establishes national standards for the protection of certain
              health information known as Protected Health Information (PHI). HIPAA applies to
              &quot;Covered Entities&quot; (health plans, healthcare clearinghouses, and healthcare
              providers who transmit health information electronically) and their &quot;Business
              Associates.&quot;
            </p>
          </Section>

          <Section title="3. Why We Are Not a HIPAA Covered Entity">
            <p className="mb-2">{APP_NAME} is an informational technology platform that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provides search and comparison tools for publicly available clinical trial data</li>
              <li>Does not provide medical treatment, diagnosis, or healthcare services</li>
              <li>Does not process health insurance claims or transactions</li>
              <li>Does not access your medical records or health plan information</li>
              <li>Does not receive PHI from healthcare providers or health plans</li>
              <li>Does not operate as a healthcare clearinghouse</li>
            </ul>
          </Section>

          <Section title="4. Information You Provide">
            <p>
              While we are not subject to HIPAA, we take the privacy of all user information seriously.
              Any information you voluntarily provide to the Service (such as search criteria, health
              conditions of interest, or profile information) is handled in accordance with our Privacy
              Policy, treated with commercially reasonable security measures, not shared with third
              parties except as described in our Privacy Policy, and not considered PHI under HIPAA as
              it is voluntarily provided to a non-covered entity.
            </p>
          </Section>

          <Section title="5. Your Responsibility">
            <p className="mb-2">Please be aware of the following:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Any health-related information you enter into the Service (such as medical conditions
                or search filters) is provided voluntarily and at your own discretion.
              </li>
              <li>
                We recommend that you do not enter highly sensitive personal health information (such
                as Social Security numbers, insurance ID numbers, or detailed medical records) into the
                Service.
              </li>
              <li>
                If you choose to contact a clinical trial site or healthcare provider through links in
                the Service, your interaction with that entity may be subject to HIPAA protections.
              </li>
            </ul>
          </Section>

          <Section title="6. Our Privacy Commitment">
            <p>
              Although HIPAA does not apply to our Service, we are committed to protecting your
              information through industry-standard encryption and security measures, transparent data
              collection and usage practices as outlined in our Privacy Policy, strict internal access
              controls and data handling procedures, regular security assessments, and prompt
              notification in the event of any data breach affecting your information.
            </p>
          </Section>

          <Section title="7. Clinical Trial Sites and Healthcare Providers">
            <p>
              If you use the Service to identify and subsequently contact clinical trial sites or
              healthcare providers, please note that those entities ARE likely HIPAA Covered Entities.
              Any information you provide directly to clinical trial sites or healthcare providers is
              subject to their own privacy practices and HIPAA obligations. We encourage you to review
              their Notice of Privacy Practices before sharing personal health information.
            </p>
          </Section>

          <Section title="8. State Privacy Laws">
            <p>
              In addition to federal regulations, various state laws may provide additional privacy
              protections for health-related information. We comply with applicable state privacy laws,
              including but not limited to the Louisiana Database Security Breach Notification Law and
              other applicable state consumer protection laws.
            </p>
          </Section>

          <Section title="9. Changes to This Notice">
            <p>
              We may update this HIPAA Notice from time to time to reflect changes in law, our
              practices, or the nature of our Service. We will notify you of material changes by
              posting the updated notice on the Service.
            </p>
          </Section>

          <Section title="10. Questions">
            <p>
              If you have questions about HIPAA as it relates to {APP_NAME} or our privacy practices,
              please contact us at: {CONTACT_EMAIL}
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
