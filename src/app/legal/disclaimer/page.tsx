'use client';

import React from 'react';

const EFFECTIVE_DATE = 'January 30, 2026';
const APP_NAME = 'TrialMatchRX';
const CONTACT_EMAIL = '[CONTACT_EMAIL]';

export default function MedicalDisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Disclaimer</h1>
          <p className="text-sm text-gray-500 mb-6">Effective Date: {EFFECTIVE_DATE}</p>

          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8 rounded-r">
            <p className="text-amber-800 font-semibold">
              IMPORTANT: PLEASE READ THIS DISCLAIMER CAREFULLY BEFORE USING THE SERVICE.
            </p>
          </div>

          <Section title="1. No Medical Advice">
            <p>
              {APP_NAME} provides clinical trial information for general informational and educational
              purposes only. The Service is NOT a medical device, healthcare provider, or medical
              advisory service. Nothing contained in or provided through the Service is intended to be
              or should be construed as medical advice, diagnosis, treatment, or a recommendation for
              any specific medical course of action.
            </p>
          </Section>

          <Section title="2. Not a Substitute for Professional Medical Advice">
            <p>
              The information provided through the Service should NEVER be used as a substitute for the
              advice of a qualified healthcare professional. You should always consult with your
              physician, specialist, or other qualified healthcare provider before making any decisions
              about participating in a clinical trial, changing any medication or treatment plan,
              relying on any information obtained through the Service, or making any healthcare
              decisions.
            </p>
          </Section>

          <Section title="3. Clinical Trial Information Accuracy">
            <p className="mb-4">
              While we strive to present accurate and up-to-date clinical trial information, we make no
              representations or warranties regarding the accuracy, completeness, reliability,
              suitability, or availability of any clinical trial information displayed through the
              Service. Clinical trial information is sourced from public registries and third-party
              databases, may not reflect the most current status of any trial, may contain errors,
              omissions, or outdated information, and is subject to change without notice.
            </p>
            <p>
              Trial eligibility criteria, study locations, contact information, and enrollment status
              may differ from what is displayed. Always verify trial details directly with the
              sponsoring organization or study site.
            </p>
          </Section>

          <Section title="4. No Doctor-Patient Relationship">
            <p>
              Use of the Service does not create a doctor-patient, therapist-patient, or any other
              healthcare provider-patient relationship between you and {APP_NAME}, its employees,
              contractors, or affiliates. {APP_NAME} is not a healthcare provider and does not practice
              medicine.
            </p>
          </Section>

          <Section title="5. AI-Generated Content">
            <p>
              Where the Service utilizes artificial intelligence or machine learning features (including
              but not limited to trial matching, analysis, or recommendations), such content is
              generated algorithmically and is provided for informational purposes only. AI-generated
              content may contain inaccuracies or errors, should not be relied upon for medical
              decision-making, does not reflect the opinion of any healthcare professional, and is not
              reviewed by medical professionals before display.
            </p>
          </Section>

          <Section title="6. Emergency Situations">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
              <p className="text-red-800 font-bold">
                {APP_NAME.toUpperCase()} IS NOT AN EMERGENCY SERVICE. IF YOU ARE EXPERIENCING A
                MEDICAL EMERGENCY, CALL 911 OR YOUR LOCAL EMERGENCY NUMBER IMMEDIATELY. DO NOT USE
                THIS SERVICE TO SEEK EMERGENCY MEDICAL HELP.
              </p>
            </div>
          </Section>

          <Section title="7. Assumption of Risk">
            <p>
              By using the Service, you acknowledge and agree that any reliance on information provided
              through the Service is strictly at your own risk, you are solely responsible for any
              decisions you make based on information obtained through the Service, and neither the
              Service nor any information provided therein should be relied upon in making medical
              decisions without independent verification and professional medical consultation.
            </p>
          </Section>

          <Section title="8. No Endorsement">
            <p>
              The inclusion of any clinical trial, research institution, pharmaceutical company,
              medical device, treatment, or healthcare provider in the Service does not constitute an
              endorsement, recommendation, or approval by {APP_NAME}. We do not recommend or endorse
              any specific clinical trial, treatment, product, procedure, physician, or opinion
              referenced through the Service.
            </p>
          </Section>

          <Section title="9. Limitation of Liability for Medical Decisions">
            <p className="font-semibold text-gray-900">
              TO THE FULLEST EXTENT PERMITTED BY LAW, {APP_NAME.toUpperCase()} SHALL NOT BE LIABLE FOR
              ANY INJURY, ILLNESS, ADVERSE REACTION, DEATH, OR OTHER DAMAGES OR LOSSES ARISING FROM OR
              RELATED TO ANY MEDICAL DECISIONS MADE BASED ON INFORMATION PROVIDED THROUGH THE SERVICE,
              YOUR PARTICIPATION OR NON-PARTICIPATION IN ANY CLINICAL TRIAL, ANY DELAY IN SEEKING
              MEDICAL TREATMENT DUE TO USE OF THE SERVICE, OR YOUR RELIANCE ON ANY INFORMATION
              PROVIDED THROUGH THE SERVICE.
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
