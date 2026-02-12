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
  // ADD trackEvent to the object
  trackEvent: (eventName: string, params?: Record<string, any>) => trackEvent(eventName, params),

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

  trialView: (params: { trialId: string }) =>
    trackEvent('trial_view', params),

  trialSave: (params: { trialId: string }) =>
    trackEvent('trial_save', params),

  trialCompare: (params: { trialIds: string[] }) =>
    trackEvent('trial_compare', params),

  alertCreated: (params: { cancerType?: string; keywords?: string }) =>
    trackEvent('alert_created', params),

  feedbackSubmitted: (params: { rating: number; hasComment: boolean }) =>
    trackEvent('feedback_submitted', params),

  signUp: () => trackEvent('sign_up', {}),

  signIn: () => trackEvent('login', {}),
};