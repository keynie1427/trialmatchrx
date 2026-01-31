'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  MapPin,
  Dna,
  Activity,
  Bell,
  Shield,
  Save,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Plus,
  X,
  Sparkles
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks';
import { CANCER_TYPES, BIOMARKERS, STAGES, PRIOR_TREATMENTS } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, saveProfile, signOut, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    cancerType: '',
    cancerSubtype: '',
    stage: '',
    biomarkers: [] as string[],
    priorTreatments: [] as string[],
    treatmentNaive: false,
    age: '',
    ecogStatus: '',
    zip: '',
    searchRadius: '50',
    alertsEnabled: false,
    alertFrequency: 'weekly',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showBiomarkerDropdown, setShowBiomarkerDropdown] = useState(false);
  const [showTreatmentDropdown, setShowTreatmentDropdown] = useState(false);

  // Load existing profile data
  useEffect(() => {
    if (user) { console.log("USER DATA:", user);
      setFormData(prev => ({
        ...prev,
        displayName: user.displayName || '',
        email: user.email || '',
      }));
    }
    if (profile) { console.log("PROFILE DATA:", profile);
      setFormData(prev => ({
        ...prev,
        email: user?.email || prev.email, displayName: profile.displayName || prev.displayName, cancerType: profile.cancerType || '',
        cancerSubtype: profile.cancerSubtype || '',
        stage: profile.stage || '',
        biomarkers: profile.biomarkers || [],
        priorTreatments: profile.priorTreatments?.map(t => t.treatment) || [],
        treatmentNaive: profile.treatmentNaive || false,
        age: profile.age?.toString() || '',
        ecogStatus: profile.ecogStatus?.toString() || '',
        zip: profile.zip || '',
        searchRadius: profile.searchRadius?.toString() || '50',
      }));
    }
  }, [user, profile]);

  const handleSave = async () => { console.log("SAVE STARTED");
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      console.log("CALLING SAVEPROFILE"); await saveProfile({ willingToTravel: true, preferredPhases: [], excludePhase1: false, displayName: formData.displayName,
        cancerType: formData.cancerType,
        cancerSubtype: formData.cancerSubtype,
        stage: formData.stage as any,
        biomarkers: formData.biomarkers,
        priorTreatments: formData.priorTreatments.map(t => ({ treatment: t, type: 'other', current: false })) as any,
        treatmentNaive: formData.treatmentNaive,
        age: formData.age ? parseInt(formData.age) : undefined,
        ecogStatus: formData.ecogStatus ? parseInt(formData.ecogStatus) : undefined,
        zip: formData.zip,
        searchRadius: parseInt(formData.searchRadius),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const addBiomarker = (biomarker: string) => {
    if (!formData.biomarkers.includes(biomarker)) {
      setFormData(prev => ({
        ...prev,
        biomarkers: [...prev.biomarkers, biomarker],
      }));
    }
    setShowBiomarkerDropdown(false);
  };

  const removeBiomarker = (biomarker: string) => {
    setFormData(prev => ({
      ...prev,
      biomarkers: prev.biomarkers.filter(b => b !== biomarker),
    }));
  };

  const addTreatment = (treatment: string) => {
    if (!formData.priorTreatments.includes(treatment)) {
      setFormData(prev => ({
        ...prev,
        priorTreatments: [...prev.priorTreatments, treatment],
        treatmentNaive: false,
      }));
    }
    setShowTreatmentDropdown(false);
  };

  const removeTreatment = (treatment: string) => {
    setFormData(prev => ({
      ...prev,
      priorTreatments: prev.priorTreatments.filter(t => t !== treatment),
    }));
  };

  // Redirect if not logged in
  if (!isLoading && !user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
              <User className="w-8 h-8 text-primary-500" />
              My Profile
            </h1>
            <p className="text-surface-600 dark:text-surface-400 mt-1">
              Manage your cancer profile for personalized trial matching
            </p>
          </div>

          {/* Success/Error Messages */}
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 mb-6"
            >
              <CheckCircle2 className="w-5 h-5" />
              Profile saved successfully!
            </motion.div>
          )}

          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 mb-6"
            >
              <AlertCircle className="w-5 h-5" />
              {saveError}
            </motion.div>
          )}

          <div className="space-y-6">
            {/* Account Info */}
            <section className="card p-6">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-primary-500" />
                Account Information
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="input"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="input bg-surface-50 dark:bg-surface-800 text-surface-500"
                  />
                </div>
              </div>
            </section>

            {/* Cancer Profile */}
            <section className="card p-6">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary-500" />
                Cancer Profile
              </h2>
              <p className="text-sm text-surface-500 mb-4">
                This information helps us find the most relevant trials for you.
              </p>

              <div className="space-y-4">
                {/* Cancer Type */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cancer Type</label>
                    <select
                      value={formData.cancerType}
                      onChange={(e) => setFormData(prev => ({ ...prev, cancerType: e.target.value }))}
                      className="select"
                    >
                      <option value="">Select cancer type</option>
                      {CANCER_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subtype (optional)</label>
                    <input
                      type="text"
                      value={formData.cancerSubtype}
                      onChange={(e) => setFormData(prev => ({ ...prev, cancerSubtype: e.target.value }))}
                      className="input"
                      placeholder="e.g., Adenocarcinoma"
                    />
                  </div>
                </div>

                {/* Stage */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Stage</label>
                    <select
                      value={formData.stage}
                      onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value }))}
                      className="select"
                    >
                      <option value="">Select stage</option>
                      {STAGES.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ECOG Status</label>
                    <select
                      value={formData.ecogStatus}
                      onChange={(e) => setFormData(prev => ({ ...prev, ecogStatus: e.target.value }))}
                      className="select"
                    >
                      <option value="">Select ECOG</option>
                      <option value="0">0 - Fully active</option>
                      <option value="1">1 - Restricted activity</option>
                      <option value="2">2 - Ambulatory, limited self-care</option>
                      <option value="3">3 - Limited self-care</option>
                      <option value="4">4 - Completely disabled</option>
                    </select>
                  </div>
                </div>

                {/* Age */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                      className="input"
                      placeholder="Your age"
                      min="18"
                      max="120"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Biomarkers */}
            <section className="card p-6">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
                <Dna className="w-5 h-5 text-primary-500" />
                Biomarkers
              </h2>
              <p className="text-sm text-surface-500 mb-4">
                Add any biomarkers from your genetic testing or tumor profiling.
              </p>

              {/* Selected Biomarkers */}
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.biomarkers.map(biomarker => (
                  <span
                    key={biomarker}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm"
                  >
                    {biomarker}
                    <button
                      onClick={() => removeBiomarker(biomarker)}
                      className="hover:text-primary-900 dark:hover:text-primary-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
                {formData.biomarkers.length === 0 && (
                  <span className="text-sm text-surface-500">No biomarkers added</span>
                )}
              </div>

              {/* Add Biomarker Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowBiomarkerDropdown(!showBiomarkerDropdown)}
                  className="btn-secondary"
                >
                  <Plus className="w-4 h-4" />
                  Add Biomarker
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showBiomarkerDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 max-h-64 overflow-y-auto bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700 z-10">
                    {BIOMARKERS.filter(b => !formData.biomarkers.includes(b)).map(biomarker => (
                      <button
                        key={biomarker}
                        onClick={() => addBiomarker(biomarker)}
                        className="w-full text-left px-4 py-2 hover:bg-surface-50 dark:hover:bg-surface-700 text-sm"
                      >
                        {biomarker}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Prior Treatments */}
            <section className="card p-6">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary-500" />
                Treatment History
              </h2>

              {/* Treatment Naive Toggle */}
              <label className="flex items-center gap-3 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.treatmentNaive}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    treatmentNaive: e.target.checked,
                    priorTreatments: e.target.checked ? [] : prev.priorTreatments,
                  }))}
                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">I have not received any prior cancer treatment (treatment-naïve)</span>
              </label>

              {!formData.treatmentNaive && (
                <>
                  {/* Selected Treatments */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.priorTreatments.map(treatment => (
                      <span
                        key={treatment}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm"
                      >
                        {treatment}
                        <button
                          onClick={() => removeTreatment(treatment)}
                          className="hover:text-amber-900 dark:hover:text-amber-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                    {formData.priorTreatments.length === 0 && (
                      <span className="text-sm text-surface-500">No treatments added</span>
                    )}
                  </div>

                  {/* Add Treatment Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowTreatmentDropdown(!showTreatmentDropdown)}
                      className="btn-secondary"
                    >
                      <Plus className="w-4 h-4" />
                      Add Treatment
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {showTreatmentDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-64 max-h-64 overflow-y-auto bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700 z-10">
                        {PRIOR_TREATMENTS.filter(t => !formData.priorTreatments.includes(t)).map(treatment => (
                          <button
                            key={treatment}
                            onClick={() => addTreatment(treatment)}
                            className="w-full text-left px-4 py-2 hover:bg-surface-50 dark:hover:bg-surface-700 text-sm"
                          >
                            {treatment}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>

            {/* Location Preferences */}
            <section className="card p-6">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary-500" />
                Location Preferences
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                    className="input"
                    placeholder="e.g., 71101"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Search Radius</label>
                  <select
                    value={formData.searchRadius}
                    onChange={(e) => setFormData(prev => ({ ...prev, searchRadius: e.target.value }))}
                    className="select"
                  >
                    <option value="25">Within 25 miles</option>
                    <option value="50">Within 50 miles</option>
                    <option value="100">Within 100 miles</option>
                    <option value="250">Within 250 miles</option>
                    <option value="500">Within 500 miles</option>
                    <option value="0">Any distance</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Notifications */}
            <section className="card p-6">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-primary-500" />
                Notifications
              </h2>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.alertsEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, alertsEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium">Email me about new matching trials</span>
                  <p className="text-xs text-surface-500">Get notified when new trials match your profile</p>
                </div>
              </label>

              {formData.alertsEnabled && (
                <div className="mt-4 ml-7">
                  <label className="block text-sm font-medium mb-2">Frequency</label>
                  <select
                    value={formData.alertFrequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, alertFrequency: e.target.value }))}
                    className="select w-48"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary flex-1 py-3"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Profile
                  </>
                )}
              </button>

              <button
                onClick={handleSignOut}
                className="btn-ghost text-red-600 dark:text-red-400"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
