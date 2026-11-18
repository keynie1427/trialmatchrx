'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, Users, RefreshCw, BadgeCheck, Send, Loader2, FlaskConical } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { analytics_events } from '@/lib/analytics';

const BENEFITS = [
  {
    icon: BadgeCheck,
    title: 'Claim your listing',
    text: 'Confirm you are a contact for the trial so we can add the plain-language details patients actually read: parking, visit schedules, travel support.',
  },
  {
    icon: RefreshCw,
    title: 'Keep status current',
    text: 'Tell us when a site opens, pauses or fills a cohort, and we\u2019ll reflect it on TrialMatchRX so patients stop calling about closed arms.',
  },
  {
    icon: Users,
    title: 'Receive patient inquiries',
    text: 'Opt in to hear from patients whose self-reported profile fits your key criteria, such as cancer type, stage, biomarkers, age and distance.',
  },
  {
    icon: FlaskConical,
    title: 'Trial Matcher for your team',
    text: 'Our quantum-classical Trial Matcher screens your own patient list against your trials, with IRB-ready screening logs and sponsor-safe de-identified reports.',
  },
];

const ROLES = ['Clinical research coordinator', 'Principal investigator', 'Research nurse', 'Site manager / director', 'Sponsor / CRO', 'Other'];

export default function ForResearchSitesPage() {
  const [form, setForm] = useState({
    name: '', email: '', role: ROLES[0], institution: '', phone: '', nctIds: '', requestType: 'claim', message: '', website: '',
  });
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/site-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setState('done');
      analytics_events.siteClaimSubmitted({
        requestType: form.requestType,
        trialCount: (form.nctIds.match(/NCT\d{8}/gi) || []).length,
      });
    } catch (err: any) {
      setError(err.message);
      setState('error');
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 lg:py-20 bg-gradient-to-br from-primary-50 to-white dark:from-surface-900 dark:to-surface-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" /> For Research Sites &amp; Sponsors
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">Reach the patients your trials are looking for</h1>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              Patients and caregivers use TrialMatchRX to find recruiting cancer trials near them. Claim your listing so they
              see accurate details, and so the right patients reach your coordinators.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="card p-6 flex gap-4">
                <b.icon className="w-7 h-7 text-primary-600 flex-shrink-0" />
                <div>
                  <h2 className="font-display text-lg font-semibold mb-1">{b.title}</h2>
                  <p className="text-sm text-surface-600 dark:text-surface-400">{b.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-20" id="claim">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card p-6 sm:p-8">
              <h2 className="font-display text-2xl font-bold mb-2">Get started</h2>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-6">
                We verify every request against the contacts listed on ClinicalTrials.gov before anything changes. Please
                use your institutional email.
              </p>

              {state === 'done' ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-lg">Request received</h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                    Thank you. We&apos;ll verify your site and follow up at {form.email} within two business days.
                  </p>
                  <Link href="/" className="btn-secondary mt-6 inline-flex">Back to home</Link>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">I&apos;d like to…</label>
                    <select value={form.requestType} onChange={set('requestType')} className="select">
                      <option value="claim">Claim and verify our trial listing(s)</option>
                      <option value="status">Update recruiting status for a site</option>
                      <option value="referrals">Receive pre-screened patient inquiries</option>
                    </select>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" htmlFor="rs-name">Full name *</label>
                      <input id="rs-name" required value={form.name} onChange={set('name')} className="input" autoComplete="name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" htmlFor="rs-email">Work email *</label>
                      <input id="rs-email" required type="email" value={form.email} onChange={set('email')} className="input" autoComplete="email" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" htmlFor="rs-role">Role</label>
                      <select id="rs-role" value={form.role} onChange={set('role')} className="select">
                        {ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" htmlFor="rs-phone">Phone</label>
                      <input id="rs-phone" value={form.phone} onChange={set('phone')} className="input" autoComplete="tel" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" htmlFor="rs-inst">Institution / site *</label>
                    <input id="rs-inst" required value={form.institution} onChange={set('institution')} className="input" placeholder="e.g. Regional Cancer Center" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" htmlFor="rs-nct">NCT number(s) *</label>
                    <input id="rs-nct" required value={form.nctIds} onChange={set('nctIds')} className="input font-mono" placeholder="NCT01234567, NCT07654321" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" htmlFor="rs-msg">Anything else?</label>
                    <textarea id="rs-msg" rows={4} value={form.message} onChange={set('message')} className="input" placeholder="Status change, cohorts that are full, details patients should know…" />
                  </div>
                  {/* honeypot */}
                  <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} className="hidden" aria-hidden="true" />
                  {state === 'error' && <p className="text-sm text-red-600">{error}</p>}
                  <button type="submit" disabled={state === 'sending'} className="btn-primary w-full py-3">
                    {state === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit request
                  </button>
                  <p className="text-xs text-surface-500">
                    Questions? Email <a className="underline" href="mailto:trialmatchrx@ijelany.com">trialmatchrx@ijelany.com</a>.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
