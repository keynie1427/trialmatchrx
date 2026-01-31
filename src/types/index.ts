// =============================================================================
// CLINICAL TRIAL TYPES
// =============================================================================

export interface Trial {
  // Core identifiers
  nctId: string;
  title: string;
  briefTitle: string;
  officialTitle?: string;
  
  // Status
  status: TrialStatus;
  statusVerifiedDate?: string;
  lastUpdateDate: string;
  
  // Classification
  phase: TrialPhase;
  studyType: 'Interventional' | 'Observational' | 'Expanded Access';
  
  // Conditions & Interventions
  conditions: string[];
  conditionsNormalized: string[]; // Standardized cancer types
  interventions: Intervention[];
  
  // Biomarkers (parsed from eligibility)
  biomarkers: string[];
  biomarkersRequired: string[];
  biomarkersExcluded: string[];
  
  // Staging
  stages: CancerStage[];
  
  // Prior treatment requirements
  priorTherapies: PriorTherapyRequirement[];
  treatmentNaive: boolean;
  
  // Eligibility
  eligibilityCriteria: string;
  eligibilityParsed: ParsedEligibility;
  
  // Locations
  locations: TrialLocation[];
  locationCount: number;
  
  // Contacts
  overallContact?: Contact;
  contacts: Contact[];
  
  // Sponsor
  sponsor: string;
  collaborators: string[];
  
  // Dates
  startDate?: string;
  primaryCompletionDate?: string;
  completionDate?: string;
  
  // AI-generated content
  summary?: string;
  keyHighlights?: string[];
  matchReasons?: string[];
  
  // Search/matching metadata
  searchText: string; // Concatenated searchable text
  updatedAt: Date;
  createdAt: Date;
}

export type TrialStatus = 
  | 'Recruiting'
  | 'Not yet recruiting'
  | 'Active, not recruiting'
  | 'Completed'
  | 'Suspended'
  | 'Terminated'
  | 'Withdrawn'
  | 'Enrolling by invitation'
  | 'Unknown status';

export type TrialPhase = 
  | 'Early Phase 1'
  | 'Phase 1'
  | 'Phase 1/Phase 2'
  | 'Phase 2'
  | 'Phase 2/Phase 3'
  | 'Phase 3'
  | 'Phase 4'
  | 'Not Applicable';

export type CancerStage = 
  | 'Stage 0'
  | 'Stage I'
  | 'Stage II'
  | 'Stage III'
  | 'Stage IV'
  | 'Metastatic'
  | 'Locally Advanced'
  | 'Recurrent'
  | 'Refractory'
  | 'Unresectable';

export interface Intervention {
  type: 'Drug' | 'Biological' | 'Procedure' | 'Radiation' | 'Device' | 'Combination' | 'Other';
  name: string;
  description?: string;
}

export interface PriorTherapyRequirement {
  therapy: string;
  required: boolean; // true = must have had, false = must NOT have had
}

export interface ParsedEligibility {
  minAge?: number;
  maxAge?: number;
  sex: 'All' | 'Male' | 'Female';
  healthyVolunteers: boolean;
  ecogMin?: number;
  ecogMax?: number;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  keyInclusions: string[];
  keyExclusions: string[];
}

export interface TrialLocation {
  facility: string;
  city: string;
  state: string;
  country: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  status?: 'Recruiting' | 'Not yet recruiting' | 'Completed' | 'Withdrawn';
  contact?: Contact;
}

export interface Contact {
  name?: string;
  role?: string;
  phone?: string;
  email?: string;
}

// =============================================================================
// USER & PROFILE TYPES
// =============================================================================

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  profile?: PatientProfile;
  savedTrials: string[]; // NCT IDs
  savedSearches: SavedSearch[];
  alertsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientProfile {
  // Cancer information
  cancerType: string;
  cancerSubtype?: string;
  stage?: CancerStage;
  diagnosisDate?: string;
  
  // Biomarkers
  biomarkers: string[];
  biomarkersPending?: string[]; // Tests ordered but results pending
  
  // Treatment history
  priorTreatments: TreatmentHistory[];
  treatmentNaive: boolean;
  currentTreatment?: string;
  
  // Patient characteristics
  age?: number;
  sex?: 'Male' | 'Female' | 'Other';
  ecogStatus?: number; // 0-4
  
  // Location
  zip?: string;
  city?: string;
  state?: string;
  searchRadius: number; // miles
  willingToTravel: boolean;
  
  // Preferences
  preferredPhases: TrialPhase[];
  excludePhase1: boolean;
  
  // Notes
  notes?: string;
}

export interface TreatmentHistory {
  treatment: string;
  type: 'Chemotherapy' | 'Immunotherapy' | 'Targeted Therapy' | 'Radiation' | 'Surgery' | 'Hormone Therapy' | 'Other';
  startDate?: string;
  endDate?: string;
  response?: 'Complete Response' | 'Partial Response' | 'Stable Disease' | 'Progressive Disease' | 'Unknown';
  current: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  criteria: SearchCriteria;
  resultCount?: number;
  createdAt: Date;
  lastRun?: Date;
}

// =============================================================================
// SEARCH & MATCHING TYPES
// =============================================================================

export interface SearchCriteria {
  // Required
  cancerType?: string;
  
  // Filtering
  stage?: CancerStage;
  biomarkers?: string[];
  phase?: TrialPhase[];
  priorTreatment?: string;
  treatmentNaive?: boolean;
  
  // Location
  zip?: string;
  distance?: number; // miles
  
  // Status
  status?: TrialStatus[];
  
  // Text search
  query?: string;
  
  // Pagination
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  trial: Trial;
  matchScore: number;
  matchReasons: MatchReason[];
  distance?: number; // miles from search location
}

export interface MatchReason {
  factor: string;
  weight: number;
  matched: boolean;
  details?: string;
}

export interface MatchScoreBreakdown {
  overall: number; // 0-100
  cancerTypeMatch: number;
  stageMatch: number;
  biomarkerMatch: number;
  treatmentHistoryMatch: number;
  locationScore: number;
  phasePreference: number;
  aiRelevance?: number;
}

// =============================================================================
// ALERT TYPES
// =============================================================================

export interface Alert {
  id: string;
  userId: string;
  searchCriteria: SearchCriteria;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  lastSent?: Date;
  lastMatchCount?: number;
  newTrialsSinceLastAlert?: string[]; // NCT IDs
  createdAt: Date;
}

// =============================================================================
// API TYPES
// =============================================================================

export interface SearchRequest {
  criteria: SearchCriteria;
  profile?: PatientProfile;
  useAI?: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  facets: SearchFacets;
  aiSummary?: string;
  searchId?: string;
}

export interface SearchFacets {
  phases: { value: string; count: number }[];
  statuses: { value: string; count: number }[];
  biomarkers: { value: string; count: number }[];
  states: { value: string; count: number }[];
}

export interface AIMatchRequest {
  trial: Trial;
  profile: PatientProfile;
  query?: string;
}

export interface AIMatchResponse {
  score: number;
  summary: string;
  matchReasons: string[];
  concerns: string[];
  questions: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const CANCER_TYPES = [
  'Breast Cancer',
  'Lung Cancer',
  'Non-Small Cell Lung Cancer',
  'Small Cell Lung Cancer',
  'Prostate Cancer',
  'Colorectal Cancer',
  'Colon Cancer',
  'Pancreatic Cancer',
  'Ovarian Cancer',
  'Melanoma',
  'Leukemia',
  'Acute Myeloid Leukemia',
  'Chronic Lymphocytic Leukemia',
  'Lymphoma',
  'Non-Hodgkin Lymphoma',
  'Hodgkin Lymphoma',
  'Multiple Myeloma',
  'Bladder Cancer',
  'Kidney Cancer',
  'Renal Cell Carcinoma',
  'Liver Cancer',
  'Hepatocellular Carcinoma',
  'Brain Cancer',
  'Glioblastoma',
  'Head and Neck Cancer',
  'Thyroid Cancer',
  'Gastric Cancer',
  'Stomach Cancer',
  'Esophageal Cancer',
  'Uterine Cancer',
  'Endometrial Cancer',
  'Cervical Cancer',
  'Testicular Cancer',
  'Sarcoma',
  'Mesothelioma',
] as const;

export const BIOMARKERS = [
  // Lung cancer
  'EGFR',
  'EGFR T790M',
  'EGFR Exon 19 deletion',
  'EGFR L858R',
  'ALK',
  'ROS1',
  'KRAS',
  'KRAS G12C',
  'BRAF',
  'BRAF V600E',
  'MET',
  'MET Exon 14',
  'RET',
  'NTRK',
  'HER2',
  
  // Breast cancer
  'ER+',
  'ER-',
  'PR+',
  'PR-',
  'HER2+',
  'HER2-',
  'Triple Negative',
  'BRCA1',
  'BRCA2',
  'PIK3CA',
  
  // General
  'PD-L1',
  'PD-L1 High (≥50%)',
  'PD-L1 Low (1-49%)',
  'PD-L1 Negative',
  'MSI-H',
  'MSS',
  'dMMR',
  'pMMR',
  'TMB-H',
  
  // Colorectal
  'KRAS Wild Type',
  'NRAS',
  'BRAF V600E',
  
  // Other
  'IDH1',
  'IDH2',
  'FLT3',
  'NPM1',
  'BCR-ABL',
  'FGFR',
] as const;

export const STAGES: CancerStage[] = [
  'Stage 0',
  'Stage I',
  'Stage II',
  'Stage III',
  'Stage IV',
  'Metastatic',
  'Locally Advanced',
  'Recurrent',
  'Refractory',
  'Unresectable',
];

export const PHASES: TrialPhase[] = [
  'Early Phase 1',
  'Phase 1',
  'Phase 1/Phase 2',
  'Phase 2',
  'Phase 2/Phase 3',
  'Phase 3',
  'Phase 4',
];

export const PRIOR_TREATMENTS = [
  'Treatment-naïve',
  'Chemotherapy',
  'Immunotherapy',
  'Targeted Therapy',
  'Radiation',
  'Surgery',
  'Hormone Therapy',
  'CAR-T',
  'Stem Cell Transplant',
] as const;
