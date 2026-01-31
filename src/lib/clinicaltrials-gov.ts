import type { Trial, TrialStatus, TrialPhase, CancerStage, Intervention, ParsedEligibility } from '@/types';

const CTG_API_BASE = 'https://clinicaltrials.gov/api/v2';

interface CTGStudy {
  protocolSection: {
    identificationModule: {
      nctId: string;
      briefTitle: string;
      officialTitle?: string;
    };
    statusModule: {
      overallStatus: string;
      statusVerifiedDate?: string;
      lastUpdateSubmitDate?: string;
      startDateStruct?: { date: string };
      primaryCompletionDateStruct?: { date: string };
      completionDateStruct?: { date: string };
    };
    descriptionModule?: {
      briefSummary?: string;
      detailedDescription?: string;
    };
    conditionsModule?: {
      conditions?: string[];
      keywords?: string[];
    };
    designModule?: {
      studyType?: string;
      phases?: string[];
    };
    armsInterventionsModule?: {
      interventions?: Array<{
        type: string;
        name: string;
        description?: string;
      }>;
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
      sex?: string;
      minimumAge?: string;
      maximumAge?: string;
      healthyVolunteers?: string;
    };
    contactsLocationsModule?: {
      overallOfficials?: Array<{
        name?: string;
        role?: string;
        affiliation?: string;
      }>;
      centralContacts?: Array<{
        name?: string;
        phone?: string;
        email?: string;
      }>;
      locations?: Array<{
        facility?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
        status?: string;
        contacts?: Array<{
          name?: string;
          phone?: string;
          email?: string;
        }>;
        geoPoint?: {
          lat: number;
          lon: number;
        };
      }>;
    };
    sponsorCollaboratorsModule?: {
      leadSponsor?: { name: string };
      collaborators?: Array<{ name: string }>;
    };
  };
}

interface CTGSearchResponse {
  studies: CTGStudy[];
  nextPageToken?: string;
  totalCount: number;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

export async function searchClinicalTrials(params: {
  condition?: string;
  term?: string;
  status?: string[];
  phase?: string[];
  pageSize?: number;
  pageToken?: string;
}): Promise<{ trials: Trial[]; nextPageToken?: string; totalCount: number }> {
  const queryParams = new URLSearchParams();
  
  // Build query
  const queryParts: string[] = [];
  
  if (params.condition) {
    queryParts.push(`AREA[Condition]${params.condition}`);
  }
  
  if (params.term) {
    queryParts.push(params.term);
  }
  
  // Default to cancer-related trials
  if (!params.condition && !params.term) {
    queryParts.push('cancer OR carcinoma OR tumor OR malignant OR oncology');
  }
  
  queryParams.set('query.cond', queryParts.join(' AND '));
  
  // Status filter
  if (params.status && params.status.length > 0) {
    queryParams.set('filter.overallStatus', params.status.join(','));
  } else {
    queryParams.set('filter.overallStatus', 'RECRUITING');
  }
  
  // Phase filter
  if (params.phase && params.phase.length > 0) {
    queryParams.set('filter.phase', params.phase.join(','));
  }
  
  // Pagination
  queryParams.set('pageSize', String(params.pageSize || 100));
  if (params.pageToken) {
    queryParams.set('pageToken', params.pageToken);
  }
  
  // Request fields
  queryParams.set('fields', [
    'NCTId',
    'BriefTitle',
    'OfficialTitle',
    'OverallStatus',
    'StatusVerifiedDate',
    'LastUpdateSubmitDate',
    'StartDate',
    'PrimaryCompletionDate',
    'CompletionDate',
    'BriefSummary',
    'Condition',
    'Keyword',
    'StudyType',
    'Phase',
    'InterventionType',
    'InterventionName',
    'InterventionDescription',
    'EligibilityCriteria',
    'Gender',
    'MinimumAge',
    'MaximumAge',
    'HealthyVolunteers',
    'LeadSponsorName',
    'CollaboratorName',
    'LocationFacility',
    'LocationCity',
    'LocationState',
    'LocationZip',
    'LocationCountry',
    'LocationStatus',
    'CentralContactName',
    'CentralContactPhone',
    'CentralContactEMail',
    'LocationGeoPoint',
  ].join(','));
  
  const url = `${CTG_API_BASE}/studies?${queryParams.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`ClinicalTrials.gov API error: ${response.status}`);
  }
  
  const data: CTGSearchResponse = await response.json();
  
  const trials = data.studies.map(transformCTGStudy);
  
  return {
    trials,
    nextPageToken: data.nextPageToken,
    totalCount: data.totalCount,
  };
}

export async function getTrialByNCTId(nctId: string): Promise<Trial | null> {
  const url = `${CTG_API_BASE}/studies/${nctId}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`ClinicalTrials.gov API error: ${response.status}`);
  }
  
  const study: CTGStudy = await response.json();
  
  return transformCTGStudy(study);
}

// =============================================================================
// TRANSFORM FUNCTIONS
// =============================================================================

function transformCTGStudy(study: CTGStudy): Trial {
  const protocol = study.protocolSection;
  const id = protocol.identificationModule;
  const status = protocol.statusModule;
  const conditions = protocol.conditionsModule;
  const design = protocol.designModule;
  const arms = protocol.armsInterventionsModule;
  const eligibility = protocol.eligibilityModule;
  const contacts = protocol.contactsLocationsModule;
  const sponsors = protocol.sponsorCollaboratorsModule;
  
  // Parse eligibility criteria for biomarkers and stages
  const eligibilityText = eligibility?.eligibilityCriteria || '';
  const parsedEligibility = parseEligibilityCriteria(eligibilityText, eligibility);
  const biomarkers = extractBiomarkers(eligibilityText);
  const stages = extractStages(eligibilityText, conditions?.conditions || []);
  
  // Normalize conditions to standard cancer types
  const conditionsNormalized = normalizeConditions(conditions?.conditions || []);
  
  // Transform interventions
  const interventions: Intervention[] = (arms?.interventions || []).map(i => ({
    type: mapInterventionType(i.type),
    name: i.name,
    description: i.description,
  }));
  
  // Transform locations
  const locations = (contacts?.locations || [])
    .filter(loc => loc.country === 'United States')
    .map(loc => ({
      facility: loc.facility || 'Unknown Facility',
      city: loc.city || '',
      state: loc.state || '',
      country: loc.country || 'United States',
      zip: loc.zip,
      latitude: loc.geoPoint?.lat,
      longitude: loc.geoPoint?.lon,
      status: mapLocationStatus(loc.status),
      contact: loc.contacts?.[0] ? {
        name: loc.contacts[0].name,
        phone: loc.contacts[0].phone,
        email: loc.contacts[0].email,
      } : undefined,
    }));
  
  // Build searchable text
  const searchText = [
    id.briefTitle,
    id.officialTitle,
    ...(conditions?.conditions || []),
    ...(conditions?.keywords || []),
    ...interventions.map(i => i.name),
    eligibilityText,
  ].filter(Boolean).join(' ').toLowerCase();
  
  return {
    nctId: id.nctId,
    title: id.briefTitle,
    briefTitle: id.briefTitle,
    officialTitle: id.officialTitle,
    status: mapStatus(status.overallStatus),
    statusVerifiedDate: status.statusVerifiedDate,
    lastUpdateDate: status.lastUpdateSubmitDate || new Date().toISOString(),
    phase: mapPhase(design?.phases?.[0]),
    studyType: mapStudyType(design?.studyType),
    conditions: conditions?.conditions || [],
    conditionsNormalized,
    interventions,
    biomarkers,
    biomarkersRequired: biomarkers, // Simplified for now
    biomarkersExcluded: [],
    stages,
    priorTherapies: extractPriorTherapies(eligibilityText),
    treatmentNaive: eligibilityText.toLowerCase().includes('treatment-naïve') || 
                    eligibilityText.toLowerCase().includes('treatment naive') ||
                    eligibilityText.toLowerCase().includes('no prior'),
    eligibilityCriteria: eligibilityText,
    eligibilityParsed: parsedEligibility,
    locations,
    locationCount: locations.length,
    overallContact: contacts?.centralContacts?.[0] ? {
      name: contacts.centralContacts[0].name,
      phone: contacts.centralContacts[0].phone,
      email: contacts.centralContacts[0].email,
    } : undefined,
    contacts: [],
    sponsor: sponsors?.leadSponsor?.name || 'Unknown',
    collaborators: (sponsors?.collaborators || []).map(c => c.name),
    startDate: status.startDateStruct?.date,
    primaryCompletionDate: status.primaryCompletionDateStruct?.date,
    completionDate: status.completionDateStruct?.date,
    searchText,
    updatedAt: new Date(),
    createdAt: new Date(),
  };
}

// =============================================================================
// PARSING HELPERS
// =============================================================================

function parseEligibilityCriteria(text: string, eligibility?: CTGStudy['protocolSection']['eligibilityModule']): ParsedEligibility {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  let inInclusion = false;
  let inExclusion = false;
  const inclusionCriteria: string[] = [];
  const exclusionCriteria: string[] = [];
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    
    if (lower.includes('inclusion criteria') || lower.includes('inclusion:')) {
      inInclusion = true;
      inExclusion = false;
      continue;
    }
    
    if (lower.includes('exclusion criteria') || lower.includes('exclusion:')) {
      inInclusion = false;
      inExclusion = true;
      continue;
    }
    
    if (inInclusion && line.length > 10) {
      inclusionCriteria.push(line);
    } else if (inExclusion && line.length > 10) {
      exclusionCriteria.push(line);
    }
  }
  
  return {
    minAge: parseAge(eligibility?.minimumAge),
    maxAge: parseAge(eligibility?.maximumAge),
    sex: mapSex(eligibility?.sex),
    healthyVolunteers: eligibility?.healthyVolunteers === 'Yes',
    inclusionCriteria,
    exclusionCriteria,
    keyInclusions: inclusionCriteria.slice(0, 5),
    keyExclusions: exclusionCriteria.slice(0, 5),
  };
}

function parseAge(ageStr?: string): number | undefined {
  if (!ageStr) return undefined;
  const match = ageStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

function extractBiomarkers(text: string): string[] {
  const biomarkerPatterns = [
    /\bEGFR\b/gi,
    /\bEGFR\s*T790M\b/gi,
    /\bEGFR\s*Exon\s*19\b/gi,
    /\bEGFR\s*L858R\b/gi,
    /\bALK\b/gi,
    /\bROS1\b/gi,
    /\bKRAS\b/gi,
    /\bKRAS\s*G12C\b/gi,
    /\bBRAF\b/gi,
    /\bBRAF\s*V600E?\b/gi,
    /\bHER2\b/gi,
    /\bHER-2\b/gi,
    /\bBRCA1?\b/gi,
    /\bBRCA2\b/gi,
    /\bPD-?L1\b/gi,
    /\bMSI-?H\b/gi,
    /\bdMMR\b/gi,
    /\bNTRK\b/gi,
    /\bPIK3CA\b/gi,
    /\bRET\b/gi,
    /\bMET\b/gi,
    /\bFGFR\b/gi,
    /\bIDH1\b/gi,
    /\bIDH2\b/gi,
    /\bFLT3\b/gi,
  ];
  
  const found = new Set<string>();
  
  for (const pattern of biomarkerPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(m => found.add(m.toUpperCase().replace(/\s+/g, ' ')));
    }
  }
  
  return Array.from(found);
}

function extractStages(text: string, conditions: string[]): CancerStage[] {
  const stages = new Set<CancerStage>();
  const combined = `${text} ${conditions.join(' ')}`.toLowerCase();
  
  if (combined.includes('stage 0') || combined.includes('stage-0')) stages.add('Stage 0');
  if (combined.includes('stage i') || combined.includes('stage 1') || combined.includes('stage-i')) stages.add('Stage I');
  if (combined.includes('stage ii') || combined.includes('stage 2') || combined.includes('stage-ii')) stages.add('Stage II');
  if (combined.includes('stage iii') || combined.includes('stage 3') || combined.includes('stage-iii')) stages.add('Stage III');
  if (combined.includes('stage iv') || combined.includes('stage 4') || combined.includes('stage-iv')) stages.add('Stage IV');
  if (combined.includes('metastatic') || combined.includes('metastases')) stages.add('Metastatic');
  if (combined.includes('locally advanced')) stages.add('Locally Advanced');
  if (combined.includes('recurrent')) stages.add('Recurrent');
  if (combined.includes('refractory')) stages.add('Refractory');
  if (combined.includes('unresectable')) stages.add('Unresectable');
  
  return Array.from(stages);
}

function extractPriorTherapies(text: string): Array<{ therapy: string; required: boolean }> {
  const therapies: Array<{ therapy: string; required: boolean }> = [];
  const lower = text.toLowerCase();
  
  const patterns = [
    { therapy: 'Chemotherapy', patterns: ['chemotherapy', 'chemo'] },
    { therapy: 'Immunotherapy', patterns: ['immunotherapy', 'checkpoint inhibitor', 'pd-1', 'pd-l1'] },
    { therapy: 'Targeted Therapy', patterns: ['targeted therapy', 'tyrosine kinase inhibitor', 'tki'] },
    { therapy: 'Radiation', patterns: ['radiation', 'radiotherapy'] },
    { therapy: 'Surgery', patterns: ['surgery', 'surgical', 'resection'] },
  ];
  
  for (const { therapy, patterns: keywords } of patterns) {
    for (const keyword of keywords) {
      if (lower.includes(`prior ${keyword}`) || lower.includes(`previous ${keyword}`)) {
        therapies.push({ therapy, required: true });
        break;
      }
      if (lower.includes(`no prior ${keyword}`) || lower.includes(`no previous ${keyword}`)) {
        therapies.push({ therapy, required: false });
        break;
      }
    }
  }
  
  return therapies;
}

function normalizeConditions(conditions: string[]): string[] {
  const normalized = new Set<string>();
  
  const mappings: Record<string, string[]> = {
    'Breast Cancer': ['breast cancer', 'breast carcinoma', 'breast neoplasm'],
    'Non-Small Cell Lung Cancer': ['non-small cell lung cancer', 'nsclc', 'non small cell'],
    'Small Cell Lung Cancer': ['small cell lung cancer', 'sclc'],
    'Lung Cancer': ['lung cancer', 'lung carcinoma', 'lung neoplasm'],
    'Prostate Cancer': ['prostate cancer', 'prostate carcinoma', 'prostate neoplasm'],
    'Colorectal Cancer': ['colorectal cancer', 'colorectal carcinoma', 'colon cancer', 'rectal cancer'],
    'Pancreatic Cancer': ['pancreatic cancer', 'pancreas cancer', 'pancreatic carcinoma'],
    'Melanoma': ['melanoma', 'malignant melanoma', 'cutaneous melanoma'],
    'Leukemia': ['leukemia', 'leukaemia'],
    'Lymphoma': ['lymphoma'],
    'Multiple Myeloma': ['multiple myeloma', 'myeloma'],
    'Ovarian Cancer': ['ovarian cancer', 'ovarian carcinoma'],
    'Bladder Cancer': ['bladder cancer', 'urothelial', 'bladder carcinoma'],
    'Kidney Cancer': ['kidney cancer', 'renal cell', 'renal cancer'],
    'Liver Cancer': ['liver cancer', 'hepatocellular', 'hcc'],
    'Glioblastoma': ['glioblastoma', 'gbm'],
    'Brain Cancer': ['brain cancer', 'brain tumor', 'glioma'],
  };
  
  for (const condition of conditions) {
    const lower = condition.toLowerCase();
    
    for (const [standard, keywords] of Object.entries(mappings)) {
      if (keywords.some(k => lower.includes(k))) {
        normalized.add(standard);
      }
    }
  }
  
  return Array.from(normalized);
}

// =============================================================================
// MAPPING HELPERS
// =============================================================================

function mapStatus(status: string): TrialStatus {
  const statusMap: Record<string, TrialStatus> = {
    'RECRUITING': 'Recruiting',
    'NOT_YET_RECRUITING': 'Not yet recruiting',
    'ACTIVE_NOT_RECRUITING': 'Active, not recruiting',
    'COMPLETED': 'Completed',
    'SUSPENDED': 'Suspended',
    'TERMINATED': 'Terminated',
    'WITHDRAWN': 'Withdrawn',
    'ENROLLING_BY_INVITATION': 'Enrolling by invitation',
  };
  return statusMap[status] || 'Unknown status';
}

function mapPhase(phase?: string): TrialPhase {
  if (!phase) return 'Not Applicable';
  
  const phaseMap: Record<string, TrialPhase> = {
    'EARLY_PHASE1': 'Early Phase 1',
    'PHASE1': 'Phase 1',
    'PHASE1_PHASE2': 'Phase 1/Phase 2',
    'PHASE2': 'Phase 2',
    'PHASE2_PHASE3': 'Phase 2/Phase 3',
    'PHASE3': 'Phase 3',
    'PHASE4': 'Phase 4',
    'NA': 'Not Applicable',
  };
  
  return phaseMap[phase] || 'Not Applicable';
}

function mapStudyType(type?: string): 'Interventional' | 'Observational' | 'Expanded Access' {
  if (type === 'OBSERVATIONAL') return 'Observational';
  if (type === 'EXPANDED_ACCESS') return 'Expanded Access';
  return 'Interventional';
}

function mapInterventionType(type: string): Intervention['type'] {
  const typeMap: Record<string, Intervention['type']> = {
    'DRUG': 'Drug',
    'BIOLOGICAL': 'Biological',
    'PROCEDURE': 'Procedure',
    'RADIATION': 'Radiation',
    'DEVICE': 'Device',
    'COMBINATION_PRODUCT': 'Combination',
  };
  return typeMap[type] || 'Other';
}

function mapSex(sex?: string): 'All' | 'Male' | 'Female' {
  if (sex === 'MALE') return 'Male';
  if (sex === 'FEMALE') return 'Female';
  return 'All';
}

function mapLocationStatus(status?: string): 'Recruiting' | 'Not yet recruiting' | 'Completed' | 'Withdrawn' | undefined {
  if (!status) return undefined;
  const statusMap: Record<string, 'Recruiting' | 'Not yet recruiting' | 'Completed' | 'Withdrawn'> = {
    'RECRUITING': 'Recruiting',
    'NOT_YET_RECRUITING': 'Not yet recruiting',
    'COMPLETED': 'Completed',
    'WITHDRAWN': 'Withdrawn',
  };
  return statusMap[status];
}

export default {
  searchClinicalTrials,
  getTrialByNCTId,
};
