import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | TrialMatchRX',
  description: 'How TrialMatchRX collects, uses and protects your information.',
};

const EFFECTIVE_DATE = 'November 18, 2026';
const APP_NAME = 'TrialMatchRX';
const CONTACT_EMAIL = 'trialmatchrx@ijelany.com';

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Effective Date: {EFFECTIVE_DATE}</p>

      <div className="mb-8 p-5 rounded-lg bg-blue-50 border border-blue-200 text-gray-800">
        <p className="font-semibold mb-2">The short version</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>You can search for trials without an account. We never sell your information.</li>
          <li>We only keep what you choose to save: a profile, saved trials, alerts or a request you submit.</li>
          <li>We use cookieless analytics (Umami, Vercel) to count visits and feature use. Google Analytics runs only if you accept cookies.</li>
          <li>When you use AI features, the trial details and anything you type are sent to Anthropic to generate the answer. They are not used to train AI models.</li>
          <li>Email {CONTACT_EMAIL} at any time to get a copy of your data or have it deleted.</li>
        </ul>
      </div>

      <p className="text-gray-700 mb-6">
        {APP_NAME} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a clinical trial search service operated by
        S-n-K Elite Development in Shreveport, Louisiana. This Privacy Policy explains what information we collect
        through mytrialmatchrx.com (the &quot;Service&quot;), how we use it, and the choices you have. {APP_NAME} is not
        a healthcare provider and is not a HIPAA Covered Entity or Business Associate; see our{' '}
        <a href="/legal/hipaa" className="text-blue-600 underline">HIPAA Notice</a>.
      </p>

      <Section title="1. Information We Collect">
        <h3 className="font-semibold text-gray-800 mt-2 mb-2">a. Information you choose to give us</h3>
        <ul className="list-disc pl-6 space-y-1 mb-4">
          <li>
            <strong>Search criteria</strong>: cancer type, stage, biomarkers, prior treatment, age, sex, ZIP code and
            travel distance. Searches you run without an account are not stored on our servers.
          </li>
          <li>
            <strong>Account and profile</strong> (optional): name, email, sign-in credentials managed by Google Firebase
            Authentication, and any health profile details you save to pre-fill searches.
          </li>
          <li>
            <strong>Saved trials and alert preferences</strong>: the trials you bookmark and the criteria and email
            frequency for trial alerts.
          </li>
          <li>
            <strong>Messages and requests</strong>: feedback you send, access requests, and research-site requests
            (name, work email, role, institution, phone, trial numbers and your message).
          </li>
          <li>
            <strong>AI questions</strong>: text you type into AI features such as AI Search or the eligibility chat.
          </li>
        </ul>

        <h3 className="font-semibold text-gray-800 mt-4 mb-2">b. Information stored only in your browser</h3>
        <p className="mb-4">
          Your language (English/Spanish), whether you are searching for yourself or someone you care for, your
          cookie choice and, if you are not signed in, your saved trials are kept in your browser&apos;s local storage.
          They are not sent to us unless you sign in.
        </p>

        <h3 className="font-semibold text-gray-800 mt-4 mb-2">c. Information collected automatically</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Pages visited, features used and conversion events (for example, &quot;search submitted&quot; or &quot;trial saved&quot;), recorded without your name, email or the health details you entered</li>
          <li>Browser type, device type, referring website and approximate country/region</li>
          <li>Standard server logs kept by our hosting provider (IP address, time, page requested)</li>
        </ul>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul className="list-disc pl-6 space-y-1">
          <li>To search ClinicalTrials.gov and rank trials against the criteria you enter</li>
          <li>To show plain-language AI summaries and answer eligibility questions</li>
          <li>To save your profile and trials, and to email you trial alerts you sign up for</li>
          <li>To review and respond to feedback, access requests and research-site requests</li>
          <li>To understand which features help people, fix problems and improve the Service</li>
          <li>To protect the Service against abuse and comply with legal obligations</li>
        </ul>
        <p className="mt-3">
          We do <strong>not</strong> sell or rent your information, use it for advertising, or share it with trial
          sponsors or research sites unless you explicitly ask us to contact them on your behalf.
        </p>
      </Section>

      <Section title="3. Service Providers We Use">
        <p className="mb-3">We share information only with providers that help run the Service, and only what each one needs:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Google Firebase</strong>: sign-in, database storage for accounts, profiles, saved trials and alerts.</li>
          <li><strong>Vercel</strong>: website hosting, plus cookieless, aggregate page-view analytics (Vercel Analytics).</li>
          <li><strong>Umami</strong> (self-hosted by us): cookieless analytics of page views and conversion events. It does not use cookies or build cross-site profiles.</li>
          <li><strong>Google Analytics for Firebase</strong>: usage analytics that use cookies. It only runs if you click &quot;Accept All&quot; on our cookie banner.</li>
          <li><strong>Anthropic</strong>: generates AI summaries, AI search and eligibility answers. It receives trial information and the text or profile details involved in that request. Anthropic does not use this data to train its models.</li>
          <li><strong>Resend</strong>: sends trial alert emails and notifies our team about feedback and research-site requests.</li>
          <li><strong>ClinicalTrials.gov</strong> (U.S. National Library of Medicine): the source of all trial data. Your search criteria, but never your name or email, are sent to it to find matching trials.</li>
          <li><strong>Zippopotam.us</strong>: converts the ZIP code you enter into map coordinates for distance search. Only the ZIP code is sent.</li>
        </ul>
        <p className="mt-3">
          We may also disclose information if required by law, to protect the safety of users or the public, or as
          part of a merger or acquisition (with notice to you).
        </p>
      </Section>

      <Section title="4. Cookies and Similar Technologies">
        <p className="mb-2">
          We use a small number of strictly necessary browser storage items to keep you signed in and remember your
          settings. Our Umami and Vercel analytics are cookieless.
        </p>
        <p>
          Google Analytics cookies are optional. They load only after you choose &quot;Accept All&quot; on the cookie
          banner. If you choose &quot;Decline,&quot; they stay off. You can change your mind by clearing this site&apos;s
          data in your browser, which shows the banner again.
        </p>
      </Section>

      <Section title="5. Data Security">
        <p>
          All traffic to the Service is encrypted with HTTPS/TLS. Account data is stored in Google Firebase, which
          encrypts data at rest, and our database rules allow only your signed-in account to read or change your
          profile, saved trials and alerts. No system is perfectly secure, but we work to protect your information and
          will notify you of a breach as required by law, including the Louisiana Database Security Breach Notification
          Law (La. R.S. 51:3071 et seq.).
        </p>
      </Section>

      <Section title="6. Data Retention">
        <ul className="list-disc pl-6 space-y-1">
          <li>Account, profile, saved trials and alert settings: kept until you delete them or ask us to delete your account.</li>
          <li>Feedback, access requests and research-site requests: kept for up to 2 years, then deleted.</li>
          <li>Analytics data: kept in aggregate form; it does not include your name, email or health details.</li>
        </ul>
        <p className="mt-2">We complete deletion requests within 30 days.</p>
      </Section>

      <Section title="7. Your Choices and Rights">
        <ul className="list-disc pl-6 space-y-1">
          <li>Search without an account, or leave any field blank</li>
          <li>Decline optional analytics cookies</li>
          <li>Unsubscribe from alert emails using the link in each email, or from your Alerts page</li>
          <li>Ask for a copy of your data, a correction, or deletion of your account and data</li>
        </ul>
        <p className="mt-2">
          Depending on where you live, you may have additional rights under state privacy laws. To use any of these
          rights, email {CONTACT_EMAIL}. We will not treat you differently for exercising them.
        </p>
      </Section>

      <Section title="8. Research Teams Using Trial Matcher">
        <p>
          Trial Matcher is a separate, invitation-only tool for authorized research staff. Patient information that a
          research team enters there is handled under that team&apos;s agreement with us and its institution&apos;s policies.
          It is never mixed with public search data, and sponsors only see de-identified reports.
        </p>
      </Section>

      <Section title="9. Children's Privacy">
        <p>
          The Service is intended for adults 18 and older, including parents and caregivers searching on behalf of a
          child. We do not knowingly collect personal information directly from children under 13. If you believe a
          child has given us personal information, contact us and we will delete it.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this policy as the Service changes. We will post the new version here with a new effective
          date and, for material changes, notify account holders by email.
        </p>
      </Section>

      <Section title="11. Contact Us">
        <p>
          Questions or requests: <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 underline">{CONTACT_EMAIL}</a>
          <br />S-n-K Elite Development, Shreveport, Louisiana, USA
        </p>
      </Section>
    </>
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
