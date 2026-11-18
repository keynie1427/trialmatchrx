// src/lib/analytics.ts
//
// One place for product analytics. Every event goes to:
//   • Umami (cookieless, self-hosted) — always; this is where conversions are tracked
//   • Google Analytics for Firebase — ONLY after the visitor clicks "Accept All"
//     on the cookie banner (localStorage 'cookie-consent' === 'accepted')
//
// Privacy rule: never send names, emails, free-text queries or other health
// details. sanitize() drops free-text keys and anything that isn't a short
// string / number / boolean before it leaves the browser.

import type { Analytics } from 'firebase/analytics';

let analytics: Analytics | null = null;
let initStarted = false;

function hasConsent() {
  try {
    return typeof window !== 'undefined' && localStorage.getItem('cookie-consent') === 'accepted';
  } catch {
    return false;
  }
}

async function initFirebaseAnalytics() {
  if (initStarted || typeof window === 'undefined' || !hasConsent()) return;
  initStarted = true;
  try {
    const [{ getAnalytics, isSupported }, { default: app }] = await Promise.all([
      import('firebase/analytics'),
      import('./firebase'),
    ]);
    if (await isSupported()) analytics = getAnalytics(app);
  } catch {
    /* analytics is optional */
  }
}

if (typeof window !== 'undefined') {
  initFirebaseAnalytics();
  window.addEventListener('cookie-consent-accepted', () => initFirebaseAnalytics());
}

// Keys that can carry free text typed by the user (possible health details)
const BLOCKED_KEYS = new Set(['aiQuery', 'query', 'q', 'message', 'email', 'name', 'keywords', 'comment', 'notes']);

function sanitize(params?: Record<string, any>): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (BLOCKED_KEYS.has(k) || v === undefined || v === null) continue;
    if (typeof v === 'number' || typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'string') out[k] = v.slice(0, 60);
    else if (Array.isArray(v)) out[k] = v.length; // send counts, not contents
  }
  return Object.keys(out).length ? out : undefined;
}

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window === 'undefined') return;
  const clean = sanitize(params);
  try {
    const umami = (window as any).umami;
    if (umami?.track) clean ? umami.track(eventName, clean) : umami.track(eventName);
  } catch {
    /* never break the UI for analytics */
  }
  if (analytics) {
    import('firebase/analytics').then(({ logEvent }) => analytics && logEvent(analytics, eventName, clean)).catch(() => {});
  }
};

export const identifyUser = (userId: string) => {
  if (!analytics) return;
  import('firebase/analytics').then(({ setUserId }) => analytics && setUserId(analytics, userId)).catch(() => {});
};

export const setUserProps = (properties: Record<string, any>) => {
  if (!analytics) return;
  const clean = sanitize(properties);
  if (!clean) return;
  import('firebase/analytics').then(({ setUserProperties }) => analytics && setUserProperties(analytics, clean)).catch(() => {});
};

// ─── Event catalogue ────────────────────────────────────────────────────────
// ★ = conversion (set these up as Goals in Umami → Settings → Goals)
export const analytics_events = {
  trackEvent: (eventName: string, params?: Record<string, any>) => trackEvent(eventName, params),

  // Search
  trialSearch: (params: {
    searchType?: string;
    cancerType?: string;
    stage?: string;
    biomarkerCount?: number;
    phaseCount?: number;
    hasPriorTreatment?: boolean;
    hasLocation?: boolean;
    hasAge?: boolean;
    sex?: string;
    distance?: number;
    aiQuery?: string; // dropped by sanitize()
    queryLength?: number;
    audience?: string;
    lang?: string;
  }) => trackEvent('trial_search', params), // ★ search_submitted

  // Trial engagement
  trialView: (params: { trialId: string; cancerType?: string; phase?: string; status?: string }) =>
    trackEvent('trial_view', params),
  trialSave: (params: { trialId: string; cancerType?: string; phase?: string; source?: string }) =>
    trackEvent('trial_save', params), // ★
  trialUnsave: (params: { trialId: string }) => trackEvent('trial_unsave', params),
  trialShare: (params: { trialId: string; method?: string }) => trackEvent('trial_share', params),
  trialPrint: (params: { trialId: string }) => trackEvent('trial_print', params),
  trialContactClick: (params: { trialId: string; contactType: 'phone' | 'email'; location?: string }) =>
    trackEvent('trial_contact_click', params), // ★ highest-value conversion
  trialCtgovVisit: (params: { trialId: string }) => trackEvent('trial_ctgov_visit', params), // ★
  trialCompare: (params: { trialIds: string[] }) => trackEvent('trial_compare', params),
  aiSummaryGenerated: (params: { trialId: string; lang?: string; audience?: string }) =>
    trackEvent('ai_summary_generated', params),

  // Doctor visit sheet
  visitPrepOpened: (params: { trialCount: number }) => trackEvent('visit_prep_opened', params),
  visitPrepPrinted: (params: { trialCount: number; lang?: string }) => trackEvent('visit_prep_printed', params), // ★

  // Alerts
  alertCreated: (params: { cancerType?: string; keywords?: string }) => trackEvent('alert_created', params), // ★
  alertUpdated: (params: { alertId: string }) => trackEvent('alert_updated', params),
  alertDeleted: (params: { alertId: string }) => trackEvent('alert_deleted', params),

  // Accounts & requests
  accessRequested: () => trackEvent('access_requested'), // ★
  signUp: () => trackEvent('sign_up', {}),
  signIn: (params?: { method?: string }) => trackEvent('login', params),
  signOut: () => trackEvent('logout', {}),
  siteClaimSubmitted: (params: { requestType: string; trialCount: number }) =>
    trackEvent('site_claim_submitted', params), // ★ B2B lead

  // Preferences
  languageChanged: (params: { lang: string }) => trackEvent('language_changed', params),
  audienceSelected: (params: { audience: string }) => trackEvent('audience_selected', params),

  // Feedback
  feedbackSubmitted: (params: { rating: number; hasComment: boolean }) => trackEvent('feedback_submitted', params),
};
