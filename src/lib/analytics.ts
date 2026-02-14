import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import app from './firebase';

let analytics: ReturnType<typeof getAnalytics> | null = null;

if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
};

export const identifyUser = (userId: string) => {
  if (analytics) {
    setUserId(analytics, userId);
  }
};

export const setUserProps = (properties: Record<string, any>) => {
  if (analytics) {
    setUserProperties(analytics, properties);
  }
};

// Predefined events
export const analytics_events = {
  // Generic trackEvent
  trackEvent: (eventName: string, params?: Record<string, any>) => trackEvent(eventName, params),

  // Search events
  trialSearch: (params: {
    searchType?: string;
    cancerType?: string;
    stage?: string;
    biomarkerCount?: number;
    phaseCount?: number;
    hasPriorTreatment?: boolean;
    hasLocation?: boolean;
    distance?: number;
    aiQuery?: string;
    queryLength?: number;
  }) => trackEvent('trial_search', params),

  // Trial engagement events
  trialView: (params: {
    trialId: string;
    cancerType?: string;
    phase?: string;
    status?: string;
  }) => trackEvent('trial_view', params),

  trialSave: (params: {
    trialId: string;
    cancerType?: string;
    phase?: string;
  }) => trackEvent('trial_save', params),

  trialUnsave: (params: {
    trialId: string;
  }) => trackEvent('trial_unsave', params),

  trialShare: (params: {
    trialId: string;
    method?: string; // 'native' or 'clipboard'
  }) => trackEvent('trial_share', params),

  trialPrint: (params: {
    trialId: string;
  }) => trackEvent('trial_print', params),

  trialContactClick: (params: {
    trialId: string;
    contactType: 'phone' | 'email';
    location?: string;
  }) => trackEvent('trial_contact_click', params),

  trialCtgovVisit: (params: {
    trialId: string;
  }) => trackEvent('trial_ctgov_visit', params),

  trialCompare: (params: {
    trialIds: string[]
  }) => trackEvent('trial_compare', params),

  // Alert events
  alertCreated: (params: {
    cancerType?: string;
    keywords?: string;
  }) => trackEvent('alert_created', params),

  alertUpdated: (params: {
    alertId: string;
  }) => trackEvent('alert_updated', params),

  alertDeleted: (params: {
    alertId: string;
  }) => trackEvent('alert_deleted', params),

  // Feedback events
  feedbackSubmitted: (params: {
    rating: number;
    hasComment: boolean;
  }) => trackEvent('feedback_submitted', params),

  // Auth events
  signUp: () => trackEvent('sign_up', {}),

  signIn: () => trackEvent('login', {}),

  signOut: () => trackEvent('logout', {}),
};