'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { auth } from '@/lib/firebase';

interface AlertPreferences {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'biweekly';
  criteria: {
    cancerType?: string;
    biomarkers?: string[];
    phases?: string[];
    radius?: number;
  };
  email?: string;
}

interface TrialAlertSetupProps {
  compact?: boolean;
}

export default function TrialAlertSetup({ compact = false }: TrialAlertSetupProps) {
  const { user, profile } = useAuth();
  const [preferences, setPreferences] = useState<AlertPreferences>({
    enabled: false,
    frequency: 'weekly',
    criteria: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const response = await fetch('/api/alerts/preferences', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        } else if (profile) {
          setPreferences(prev => ({
            ...prev,
            criteria: {
              cancerType: profile.cancerType,
              biomarkers: profile.biomarkers,
            },
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/alerts/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error('Failed to save');

      setMessage({ type: 'success', text: 'Alert preferences saved!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleAlerts = async () => {
    const newEnabled = !preferences.enabled;
    setPreferences(prev => ({ ...prev, enabled: newEnabled }));
    
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      await fetch('/api/alerts/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...preferences, enabled: newEnabled }),
      });

      setMessage({ type: 'success', text: newEnabled ? 'Alerts enabled!' : 'Alerts disabled' });
    } catch (error) {
      setPreferences(prev => ({ ...prev, enabled: !newEnabled }));
      setMessage({ type: 'error', text: 'Failed to update. Please try again.' });
    }
  };

  if (!user) {
    return (
      <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-6 text-center">
        <p className="text-surface-600 dark:text-surface-400">Sign in to set up trial alerts</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-200 dark:bg-surface-700 rounded w-1/3"></div>
          <div className="h-10 bg-surface-200 dark:bg-surface-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">Trial Alerts</h3>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                {preferences.enabled ? `${preferences.frequency} digest enabled` : 'Get notified of new trials'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleAlerts}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.enabled ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {message && (
          <p className={`text-sm mt-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🔔</span>
        <div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">Trial Alerts</h2>
          <p className="text-surface-600 dark:text-surface-400">Get AI-summarized digests of new matching trials</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-lg">
          <div>
            <h3 className="font-medium text-surface-900 dark:text-white">Enable Alerts</h3>
            <p className="text-sm text-surface-600 dark:text-surface-400">Receive email notifications</p>
          </div>
          <button
            onClick={toggleAlerts}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              preferences.enabled ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                preferences.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {preferences.enabled && (
          <>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['daily', 'weekly', 'biweekly'] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setPreferences(prev => ({ ...prev, frequency: freq }))}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      preferences.frequency === freq
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                    }`}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Cancer Type
              </label>
              <input
                type="text"
                value={preferences.criteria.cancerType || ''}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  criteria: { ...prev.criteria, cancerType: e.target.value }
                }))}
                placeholder="e.g., Non-Small Cell Lung Cancer"
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Biomarkers (comma-separated)
              </label>
              <input
                type="text"
                value={preferences.criteria.biomarkers?.join(', ') || ''}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  criteria: { ...prev.criteria, biomarkers: e.target.value.split(',').map(b => b.trim()).filter(Boolean) }
                }))}
                placeholder="e.g., EGFR, ALK, KRAS"
                className="w-full px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
              />
            </div>

            <button
              onClick={savePreferences}
              disabled={saving}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-lg hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </>
        )}

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
