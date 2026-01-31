'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  MapPin,
  Clock,
  Building2,
  Users,
  Calendar,
  Phone,
  Mail,
  Share2,
  Printer,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info,
  Dna,
  FileText
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrialAISummary from '@/components/TrialAISummary';
import TrialEligibilityChat from '@/components/TrialEligibilityChat';
import TrialTimeline from '@/components/TrialTimeline';
import TrialSimilar from '@/components/TrialSimilar';
import { useSavedTrials, useAuth } from '@/hooks';
import type { Trial, TrialPhase } from '@/types';

// Fetch trial from ClinicalTrials.gov API
async function fetchTrialFromCTG(nctId: string): Promise<Trial | null> {
  try {
    const response = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch trial');
    }
    
    const study = await response.json();
    const protocol = study.protocolSection || {};
    const id = protocol.identificationModule || {};
    const status = protocol.statusModule || {};
    const design = protocol.designModule || {};
    const conditions = protocol.conditionsModule || {};
    const eligibility = protocol.eligibilityModule || {};
    const contacts = protocol.contactsLocationsModule || {};
    const sponsors = protocol.sponsorCollaboratorsModule || {};
    const arms = protocol.armsInterventionsModule || {};
    const description = protocol.descriptionModule || {};
    
    const eligibilityText = eligibility.eligibilityCriteria || '';
    const biomarkers = extractBiomarkers(eligibilityText);
    const stages = extractStages(eligibilityText, conditions.conditions || []);
    const { inclusionCriteria, exclusionCriteria } = parseEligibility(eligibilityText);
    
    return {
      nctId: id.nctId,
      title: id.briefTitle,
      briefTitle: id.briefTitle,
      officialTitle: id.officialTitle,
      status: mapStatus(status.overallStatus),
      statusVerifiedDate: status.statusVerifiedDate,
      lastUpdateDate: status.lastUpdateSubmitDate || new Date().toISOString(),
      phase: mapPhase(design.phases?.[0]),
      studyType: design.studyType === 'OBSERVATIONAL' ? 'Observational' : 'Interventional',
      conditions: conditions.conditions || [],
      conditionsNormalized: normalizeConditions(conditions.conditions || []),
      interventions: (arms.interventions || []).map((i: any) => ({
        type: mapInterventionType(i.type),
        name: i.name,
        description: i.description,
      })),
      biomarkers,
      biomarkersRequired: biomarkers,
      biomarkersExcluded: [],
      stages,
      priorTherapies: [],
      treatmentNaive: eligibilityText.toLowerCase().includes('treatment-naïve') || eligibilityText.toLowerCase().includes('no prior'),
      eligibilityCriteria: eligibilityText,
      eligibilityParsed: {
        minAge: parseAge(eligibility.minimumAge),
        maxAge: parseAge(eligibility.maximumAge),
        sex: eligibility.sex === 'MALE' ? 'Male' : eligibility.sex === 'FEMALE' ? 'Female' : 'All',
        healthyVolunteers: eligibility.healthyVolunteers === 'Yes',
        ecogMax: extractEcog(eligibilityText),
        inclusionCriteria,
        exclusionCriteria,
        keyInclusions: inclusionCriteria.slice(0, 5),
        keyExclusions: exclusionCriteria.slice(0, 5),
      },
      locations: (contacts.locations || []).map((loc: any) => ({
        facility: loc.facility || 'Unknown Facility',
        city: loc.city || '',
        state: loc.state || '',
        country: loc.country || 'United States',
        zip: loc.zip,
        status: loc.status === 'RECRUITING' ? 'Recruiting' : loc.status,
        contact: loc.contacts?.[0] ? {
          name: loc.contacts[0].name,
          phone: loc.contacts[0].phone,
          email: loc.contacts[0].email,
        } : undefined,
      })),
      locationCount: contacts.locations?.length || 0,
      overallContact: contacts.centralContacts?.[0] ? {
        name: contacts.centralContacts[0].name,
        phone: contacts.centralContacts[0].phone,
        email: contacts.centralContacts[0].email,
      } : undefined,
      contacts: [],
      sponsor: sponsors.leadSponsor?.name || 'Unknown',
      collaborators: (sponsors.collaborators || []).map((c: any) => c.name),
      startDate: status.startDateStruct?.date,
      primaryCompletionDate: status.primaryCompletionDateStruct?.date,
      completionDate: status.completionDateStruct?.date,
      summary: description.briefSummary,
      searchText: '',
      updatedAt: new Date(),
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error fetching trial:', error);
    return null;
  }
}

// Helper functions
function mapStatus(status: string): string {
  const map: Record<string, string> = {
    RECRUITING: 'Recruiting',
    NOT_YET_RECRUITING: 'Not yet recruiting',
    ACTIVE_NOT_RECRUITING: 'Active, not recruiting',
    COMPLETED: 'Completed',
    SUSPENDED: 'Suspended',
    TERMINATED: 'Terminated',
    WITHDRAWN: 'Withdrawn',
  };
  return map[status] || status || 'Unknown';
}

function mapPhase(phase?: string): TrialPhase {
  if (!phase) return 'Not Applicable';
  const map: Record<string, TrialPhase> = {
    EARLY_PHASE1: 'Early Phase 1',
    PHASE1: 'Phase 1',
    PHASE1_PHASE2: 'Phase 1/Phase 2',
    PHASE2: 'Phase 2',
    PHASE2_PHASE3: 'Phase 2/Phase 3',
    PHASE3: 'Phase 3',
    PHASE4: 'Phase 4',
  };
  return map[phase] || 'Not Applicable';
}

function mapInterventionType(type: string): 'Drug' | 'Biological' | 'Procedure' | 'Radiation' | 'Device' | 'Combination' | 'Other' {
  const map: Record<string, 'Drug' | 'Biological' | 'Procedure' | 'Radiation' | 'Device' | 'Combination' | 'Other'> = {
    DRUG: 'Drug',
    BIOLOGICAL: 'Biological',
    PROCEDURE: 'Procedure',
    RADIATION: 'Radiation',
    DEVICE: 'Device',
    COMBINATION_PRODUCT: 'Combination',
  };
  return map[type] || 'Other';
}

function parseAge(ageStr?: string): number | undefined {
  if (!ageStr) return undefined;
  const match = ageStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

function extractBiomarkers(text: string): string[] {
  const found = new Set<string>();
  const patterns = ['EGFR', 'ALK', 'ROS1', 'KRAS', 'BRAF', 'HER2', 'PD-L1', 'BRCA1', 'BRCA2', 'MSI-H', 'NTRK', 'RET', 'MET', 'PIK3CA'];
  const upper = text.toUpperCase();
  patterns.forEach(p => { if (upper.includes(p)) found.add(p); });
  return Array.from(found);
}

function extractStages(text: string, conditions: string[]): string[] {
  const stages = new Set<string>();
  const combined = `${text} ${conditions.join(' ')}`.toLowerCase();
  if (combined.includes('stage i') || combined.includes('stage 1')) stages.add('Stage I');
  if (combined.includes('stage ii') || combined.includes('stage 2')) stages.add('Stage II');
  if (combined.includes('stage iii') || combined.includes('stage 3')) stages.add('Stage III');
  if (combined.includes('stage iv') || combined.includes('stage 4')) stages.add('Stage IV');
  if (combined.includes('metastatic')) stages.add('Metastatic');
  if (combined.includes('locally advanced')) stages.add('Locally Advanced');
  if (combined.includes('recurrent')) stages.add('Recurrent');
  return Array.from(stages);
}

function extractEcog(text: string): number | undefined {
  const match = text.match(/ECOG[^0-9]*([0-2])/i);
  return match ? parseInt(match[1], 10) : undefined;
}

function normalizeConditions(conditions: string[]): string[] {
  const normalized = new Set<string>();
  const mappings: Record<string, string[]> = {
    'Breast Cancer': ['breast cancer', 'breast carcinoma'],
    'Non-Small Cell Lung Cancer': ['non-small cell lung cancer', 'nsclc'],
    'Lung Cancer': ['lung cancer', 'lung carcinoma'],
    'Prostate Cancer': ['prostate cancer'],
    'Colorectal Cancer': ['colorectal cancer', 'colon cancer'],
    'Melanoma': ['melanoma'],
    'Leukemia': ['leukemia'],
    'Lymphoma': ['lymphoma'],
  };
  for (const condition of conditions) {
    const lower = condition.toLowerCase();
    for (const [standard, keywords] of Object.entries(mappings)) {
      if (keywords.some(k => lower.includes(k))) normalized.add(standard);
    }
  }
  return Array.from(normalized);
}

function parseEligibility(text: string): { inclusionCriteria: string[]; exclusionCriteria: string[] } {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 10);
  const inclusionCriteria: string[] = [];
  const exclusionCriteria: string[] = [];
  
  let mode: 'none' | 'inclusion' | 'exclusion' = 'none';
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('inclusion criteria') || lower.includes('inclusion:')) {
      mode = 'inclusion';
      continue;
    }
    if (lower.includes('exclusion criteria') || lower.includes('exclusion:')) {
      mode = 'exclusion';
      continue;
    }
    
    // Clean up bullet points
    const cleanLine = line.replace(/^[\s•\-\*\d\.]+/, '').trim();
    if (cleanLine.length < 10) continue;
    
    if (mode === 'inclusion') inclusionCriteria.push(cleanLine);
    else if (mode === 'exclusion') exclusionCriteria.push(cleanLine);
  }
  
  return { inclusionCriteria, exclusionCriteria };
}

export default function TrialDetailPage() {
  const params = useParams();
  const nctId = params.nctId as string;
  const { isSaved, toggleSaved } = useSavedTrials();
  const { profile } = useAuth();
  
  const [trial, setTrial] = useState<Trial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    eligibility: true,
    locations: true,
  });
  const [aiAnalysis, setAiAnalysis] = useState<{
    score: number;
    summary: string;
    matchReasons: string[];
    concerns: string[];
  } | null>(null);

  const saved = trial ? isSaved(trial.nctId) : false;

  useEffect(() => {
    async function loadTrial() {
      setIsLoading(true);
      const trialData = await fetchTrialFromCTG(nctId);
      setTrial(trialData);
      setIsLoading(false);
    }
    
    if (nctId) {
      loadTrial();
    }
  }, [nctId]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: trial?.briefTitle,
        text: `Check out this clinical trial: ${trial?.briefTitle}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="animate-pulse space-y-6">
            <div className="skeleton h-8 w-32 rounded" />
            <div className="skeleton h-10 w-3/4 rounded" />
            <div className="skeleton h-6 w-1/2 rounded" />
            <div className="card p-6 space-y-4">
              <div className="skeleton h-6 w-full rounded" />
              <div className="skeleton h-6 w-full rounded" />
              <div className="skeleton h-6 w-3/4 rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!trial) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold mb-4">Trial Not Found</h1>
            <p className="text-surface-600 dark:text-surface-400 mb-6">
              The trial you're looking for could not be found.
            </p>
            <Link href="/search" className="btn-primary">
              Back to Search
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link 
            href="/search"
            className="inline-flex items-center gap-2 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="badge-success">{trial.status}</span>
              <span className="badge-primary">{trial.phase}</span>
              <span className="badge bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                {trial.studyType}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-3">
              {trial.briefTitle}
            </h1>

            {/* NCT ID & Sponsor */}
            <div className="flex flex-wrap items-center gap-4 text-surface-600 dark:text-surface-400 mb-6">
              <span className="font-mono text-sm">{trial.nctId}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {trial.sponsor}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => toggleSaved(trial.nctId)}
                className={saved ? 'btn-primary' : 'btn-secondary'}
              >
                {saved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    Save Trial
                  </>
                )}
              </button>
              
              <a
                href={`https://clinicaltrials.gov/study/${trial.nctId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <ExternalLink className="w-4 h-4" />
                ClinicalTrials.gov
              </a>
              
              <button onClick={handleShare} className="btn-ghost">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              
              <button onClick={() => window.print()} className="btn-ghost">
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </motion.header>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Summary */}
              {trial.summary && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="card p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary-500" />
                    <h2 className="font-display font-semibold text-lg">Plain-English Summary</h2>
                  </div>
                  <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                    {trial.summary}
                  </p>
                </motion.section>
              )}

              {/* AI-Powered Trial Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                <TrialAISummary trial={trial} />
              </motion.div>

              {/* Am I Eligible? Chat */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
              >
                <TrialEligibilityChat trial={trial} patientProfile={profile} />
              </motion.div>

              {/* Treatment Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
              >
                <TrialTimeline trial={trial} />
              </motion.div>

              {/* Trials Like This */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <TrialSimilar trial={trial} patientProfile={profile} />
              </motion.div>

              {/* Official Title */}
              {trial.officialTitle && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="card p-6"
                >
                  <h2 className="font-display font-semibold text-lg mb-3">Official Title</h2>
                  <p className="text-surface-600 dark:text-surface-400 text-sm">
                    {trial.officialTitle}
                  </p>
                </motion.section>
              )}

              {/* Interventions */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card p-6"
              >
                <h2 className="font-display font-semibold text-lg mb-4">Treatments Being Studied</h2>
                <div className="space-y-4">
                  {trial.interventions.map((intervention, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{intervention.name}</span>
                          <span className="badge text-xs bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400">
                            {intervention.type}
                          </span>
                        </div>
                        {intervention.description && (
                          <p className="text-sm text-surface-600 dark:text-surface-400">
                            {intervention.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>

              {/* Eligibility */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="card overflow-hidden"
              >
                <button
                  onClick={() => toggleSection('eligibility')}
                  className="w-full flex items-center justify-between p-6 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                >
                  <h2 className="font-display font-semibold text-lg">Eligibility Criteria</h2>
                  {expandedSections.eligibility ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                
                {expandedSections.eligibility && (
                  <div className="px-6 pb-6 space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                        <div className="font-semibold text-lg">
                          {trial.eligibilityParsed.minAge || 18}+
                        </div>
                        <div className="text-xs text-surface-500">Min Age</div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                        <div className="font-semibold text-lg">
                          {trial.eligibilityParsed.sex}
                        </div>
                        <div className="text-xs text-surface-500">Sex</div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                        <div className="font-semibold text-lg">
                          0-{trial.eligibilityParsed.ecogMax || 2}
                        </div>
                        <div className="text-xs text-surface-500">ECOG</div>
                      </div>
                    </div>

                    {/* Inclusion */}
                    <div>
                      <h3 className="font-medium flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        Inclusion Criteria
                      </h3>
                      <ul className="space-y-2">
                        {trial.eligibilityParsed.inclusionCriteria.map((criteria, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                            {criteria}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Exclusion */}
                    <div>
                      <h3 className="font-medium flex items-center gap-2 mb-3">
                        <XCircle className="w-5 h-5 text-red-500" />
                        Exclusion Criteria
                      </h3>
                      <ul className="space-y-2">
                        {trial.eligibilityParsed.exclusionCriteria.map((criteria, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                            {criteria}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </motion.section>

              {/* Locations */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card overflow-hidden"
              >
                <button
                  onClick={() => toggleSection('locations')}
                  className="w-full flex items-center justify-between p-6 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                >
                  <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Locations ({trial.locationCount})
                  </h2>
                  {expandedSections.locations ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                
                {expandedSections.locations && (
                  <div className="px-6 pb-6 space-y-4">
                    {trial.locations.map((location, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-xl border border-surface-200 dark:border-surface-700"
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h4 className="font-medium">{location.facility}</h4>
                            <p className="text-sm text-surface-500">
                              {location.city}, {location.state} {location.zip}
                            </p>
                          </div>
                          {location.status && (
                            <span className={`badge text-xs ${
                              location.status === 'Recruiting' ? 'badge-success' : 'badge'
                            }`}>
                              {location.status}
                            </span>
                          )}
                        </div>
                        
                        {location.contact && (
                          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 text-sm">
                            {location.contact.name && (
                              <span className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
                                <Users className="w-4 h-4" />
                                {location.contact.name}
                              </span>
                            )}
                            {location.contact.phone && (
                              <a 
                                href={`tel:${location.contact.phone}`}
                                className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 hover:underline"
                              >
                                <Phone className="w-4 h-4" />
                                {location.contact.phone}
                              </a>
                            )}
                            {location.contact.email && (
                              <a 
                                href={`mailto:${location.contact.email}`}
                                className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 hover:underline"
                              >
                                <Mail className="w-4 h-4" />
                                Email
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="card p-6 sticky top-24"
              >
                <h3 className="font-display font-semibold mb-4">Trial Information</h3>
                
                <div className="space-y-4">
                  {/* Biomarkers */}
                  {trial.biomarkers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-surface-500 mb-2">
                        <Dna className="w-4 h-4" />
                        Biomarkers
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {trial.biomarkers.map((biomarker) => (
                          <span 
                            key={biomarker}
                            className="px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-medium"
                          >
                            {biomarker}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stages */}
                  {trial.stages.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-surface-500 mb-2">
                        <Info className="w-4 h-4" />
                        Cancer Stages
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {trial.stages.map((stage) => (
                          <span 
                            key={stage}
                            className="px-2 py-1 rounded-md bg-surface-100 dark:bg-surface-800 text-xs font-medium"
                          >
                            {stage}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="pt-4 border-t border-surface-200 dark:border-surface-700 space-y-3">
                    {trial.startDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-surface-500">Start Date</span>
                        <span>{new Date(trial.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {trial.primaryCompletionDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-surface-500">Est. Completion</span>
                        <span>{new Date(trial.primaryCompletionDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-500">Last Updated</span>
                      <span>{new Date(trial.lastUpdateDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Contact */}
                  {trial.overallContact && (
                    <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
                      <div className="text-sm font-medium mb-3">Contact Information</div>
                      {trial.overallContact.phone && (
                        <a 
                          href={`tel:${trial.overallContact.phone}`}
                          className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline mb-2"
                        >
                          <Phone className="w-4 h-4" />
                          {trial.overallContact.phone}
                        </a>
                      )}
                      {trial.overallContact.email && (
                        <a 
                          href={`mailto:${trial.overallContact.email}`}
                          className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          <Mail className="w-4 h-4" />
                          {trial.overallContact.email}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
