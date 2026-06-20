import { NextRequest, NextResponse } from 'next/server';

// POST /api/ai/similar
export async function POST(request: NextRequest) {
  try {
    const { trial, patientProfile, limit = 5 } = await request.json();

    if (!trial || !trial.nctId) {
      return NextResponse.json(
        { error: 'Trial data is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Step 1: Search ClinicalTrials.gov for similar trials
    const similarTrials = await findSimilarTrials(trial, limit + 5); // fetch extra for filtering

    if (similarTrials.length === 0) {
      return NextResponse.json({
        recommendations: [],
        message: 'No similar trials found',
      });
    }

    // Step 2: Use AI to rank and explain similarities
    const context = buildContext(trial, similarTrials, patientProfile);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: context,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', errorData);
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const recommendationsText = data.content
      ?.map((block: any) => (block.type === 'text' ? block.text : ''))
      .filter(Boolean)
      .join('\n');

    if (!recommendationsText) {
      return NextResponse.json(
        { error: 'No recommendations generated' },
        { status: 500 }
      );
    }

    // Parse the structured JSON response
    let recommendations;
    try {
      const cleaned = recommendationsText.replace(/```json\s?|```/g, '').trim();
      recommendations = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse recommendations JSON:', recommendationsText);
      return NextResponse.json(
        { error: 'Failed to parse recommendations' },
        { status: 500 }
      );
    }

    // Merge AI insights with trial data
    const enrichedRecommendations = recommendations.trials
      .slice(0, limit)
      .map((rec: any) => {
        const trialData = similarTrials.find((t) => t.nctId === rec.nctId);
        return {
          ...rec,
          trial: trialData,
        };
      })
      .filter((rec: any) => rec.trial); // Only include trials we have data for

    return NextResponse.json({
      recommendations: enrichedRecommendations,
      summary: recommendations.summary,
      sourceTrialId: trial.nctId,
    });
  } catch (error: any) {
    console.error('Similar trials error:', error);
    return NextResponse.json(
      { error: 'Failed to find similar trials' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Find similar trials from ClinicalTrials.gov
// ─────────────────────────────────────────────────────────────────────────────
async function findSimilarTrials(trial: any, limit: number): Promise<any[]> {
  const similarTrials: any[] = [];

  // Build search queries based on the trial's characteristics
  const searchQueries: string[] = [];

  // Primary: Same conditions
  if (trial.conditions?.length > 0) {
    // Use the first condition as primary search
    const primaryCondition = trial.conditions[0];
    searchQueries.push(primaryCondition);
  }

  // Secondary: Biomarkers + condition
  if (trial.biomarkers?.length > 0 && trial.conditions?.length > 0) {
    const biomarkerQuery = `${trial.conditions[0]} ${trial.biomarkers[0]}`;
    searchQueries.push(biomarkerQuery);
  }

  // Tertiary: Intervention type
  if (trial.interventions?.length > 0) {
    const interventionType = trial.interventions[0]?.type;
    if (interventionType && trial.conditions?.length > 0) {
      searchQueries.push(`${trial.conditions[0]} ${interventionType}`);
    }
  }

  // Execute searches
  for (const query of searchQueries.slice(0, 2)) {
    try {
      const params = new URLSearchParams({
        'query.cond': query,
        'filter.overallStatus': 'RECRUITING',
        pageSize: '15',
        fields: [
          'NCTId',
          'BriefTitle',
          'OfficialTitle',
          'OverallStatus',
          'Phase',
          'Condition',
          'InterventionName',
          'InterventionType',
          'InterventionDescription',
          'LeadSponsorName',
          'LocationCity',
          'LocationState',
          'LocationCountry',
          'EligibilityCriteria',
          'BriefSummary',
        ].join('|'),
      });

      const response = await fetch(
        `https://clinicaltrials.gov/api/v2/studies?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        const studies = data.studies || [];

        for (const study of studies) {
          const nctId = study.protocolSection?.identificationModule?.nctId;
          
          // Skip the source trial and duplicates
          if (
            nctId === trial.nctId ||
            similarTrials.find((t) => t.nctId === nctId)
          ) {
            continue;
          }

          const transformedTrial = transformStudy(study);
          if (transformedTrial) {
            similarTrials.push(transformedTrial);
          }

          if (similarTrials.length >= limit) break;
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    }

    if (similarTrials.length >= limit) break;
  }

  return similarTrials.slice(0, limit);
}

function transformStudy(study: any): any {
  try {
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

    return {
      nctId: id.nctId,
      briefTitle: id.briefTitle,
      officialTitle: id.officialTitle,
      status: mapStatus(status.overallStatus) as any,
      phase: mapPhase(design.phases?.[0]),
      conditions: conditions.conditions || [],
      interventions: (arms.interventions || []).map((i: any) => ({
        type: i.type || 'Other',
        name: i.name,
        description: i.description,
      })),
      biomarkers: extractBiomarkers(eligibilityText),
      sponsor: sponsors.leadSponsor?.name || 'Unknown',
      locationCount: contacts.locations?.length || 0,
      locations: (contacts.locations || []).slice(0, 3).map((loc: any) => ({
        city: loc.city,
        state: loc.state,
        country: loc.country,
      })),
      summary: description.briefSummary,
      eligibilityCriteria: eligibilityText,
    };
  } catch (error) {
    console.error('Transform error:', error);
    return null;
  }
}

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    RECRUITING: 'Recruiting',
    NOT_YET_RECRUITING: 'Not yet recruiting',
    ACTIVE_NOT_RECRUITING: 'Active, not recruiting',
    COMPLETED: 'Completed',
  };
  return map[status] || status || 'Unknown';
}

function mapPhase(phase?: string): string {
  if (!phase) return 'Not Applicable';
  const map: Record<string, string> = {
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

function extractBiomarkers(text: string): string[] {
  const found = new Set<string>();
  const patterns = [
    'EGFR', 'ALK', 'ROS1', 'KRAS', 'BRAF', 'HER2', 'PD-L1', 'BRCA1', 'BRCA2',
    'MSI-H', 'NTRK', 'RET', 'MET', 'PIK3CA', 'FGFR', 'IDH1', 'IDH2',
  ];
  const upper = text.toUpperCase();
  patterns.forEach((p) => {
    if (upper.includes(p)) found.add(p);
  });
  return Array.from(found);
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a clinical trial recommendation specialist. Your job is to analyze a source trial and rank similar trials by relevance, explaining WHY each might be a good alternative or complement.

IMPORTANT RULES:
1. Rank trials by how similar/relevant they are to the source trial
2. Consider: same cancer type, similar biomarkers, similar treatment approach, same phase
3. Explain the connection in plain English (8th-grade reading level)
4. If patient profile is provided, factor in their specific situation
5. Be specific — mention actual biomarkers, drugs, mechanisms by name
6. Highlight what's DIFFERENT too, not just what's similar

You MUST respond with valid JSON (no markdown, no code fences):
{
  "summary": "One sentence overview of what types of similar trials were found",
  "trials": [
    {
      "nctId": "NCT12345678",
      "relevanceScore": 95,
      "whySimilar": "Short explanation of why this trial is similar (1-2 sentences)",
      "keyDifference": "What's notably different about this trial (1 sentence)",
      "highlightTag": "Same Drug|Same Target|Same Cancer|Alternative Approach|Different Phase|Combination Therapy",
      "personalizedNote": "If patient profile provided, specific relevance to them (or null)"
    }
  ]
}

HIGHLIGHT TAGS:
- "Same Drug" — tests the same drug/intervention
- "Same Target" — targets the same biomarker/pathway
- "Same Cancer" — same cancer type but different approach
- "Alternative Approach" — different treatment strategy for same condition
- "Different Phase" — same/similar treatment in different trial phase
- "Combination Therapy" — combines similar drugs with others

Rank by relevanceScore (0-100). Higher = more similar/relevant.`;

// ─────────────────────────────────────────────────────────────────────────────
// Build context for AI
// ─────────────────────────────────────────────────────────────────────────────
function buildContext(trial: any, similarTrials: any[], patientProfile?: any): string {
  const sections: string[] = [];

  // Source trial
  sections.push('=== SOURCE TRIAL (the one user is viewing) ===');
  sections.push(`NCT ID: ${trial.nctId}`);
  sections.push(`Title: ${trial.briefTitle || trial.title}`);
  sections.push(`Phase: ${trial.phase}`);
  sections.push(`Status: ${trial.status}`);
  
  if (trial.conditions?.length > 0) {
    sections.push(`Conditions: ${trial.conditions.join(', ')}`);
  }
  
  if (trial.interventions?.length > 0) {
    const interventions = trial.interventions
      .map((i: any) => `${i.name} (${i.type})`)
      .join(', ');
    sections.push(`Interventions: ${interventions}`);
  }
  
  if (trial.biomarkers?.length > 0) {
    sections.push(`Biomarkers: ${trial.biomarkers.join(', ')}`);
  }

  if (trial.summary) {
    sections.push(`Summary: ${trial.summary}`);
  }

  sections.push('');

  // Patient profile (if available)
  if (patientProfile) {
    sections.push('=== PATIENT PROFILE ===');
    if (patientProfile.cancerType) sections.push(`Cancer Type: ${patientProfile.cancerType}`);
    if (patientProfile.stage) sections.push(`Stage: ${patientProfile.stage}`);
    if (patientProfile.biomarkers?.length > 0) {
      sections.push(`Biomarkers: ${patientProfile.biomarkers.join(', ')}`);
    }
    if (patientProfile.priorTreatments?.length > 0) {
      const treatments = patientProfile.priorTreatments
        .map((t: any) => (typeof t === 'string' ? t : t.treatment))
        .join(', ');
      sections.push(`Prior Treatments: ${treatments}`);
    }
    sections.push('');
  }

  // Similar trials found
  sections.push('=== SIMILAR TRIALS FOUND ===');
  similarTrials.forEach((t, index) => {
    sections.push(`\n--- Trial ${index + 1}: ${t.nctId} ---`);
    sections.push(`Title: ${t.briefTitle}`);
    sections.push(`Phase: ${t.phase}`);
    sections.push(`Status: ${t.status}`);
    sections.push(`Sponsor: ${t.sponsor}`);
    
    if (t.conditions?.length > 0) {
      sections.push(`Conditions: ${t.conditions.join(', ')}`);
    }
    
    if (t.interventions?.length > 0) {
      const interventions = t.interventions
        .map((i: any) => `${i.name} (${i.type})`)
        .join(', ');
      sections.push(`Interventions: ${interventions}`);
    }
    
    if (t.biomarkers?.length > 0) {
      sections.push(`Biomarkers: ${t.biomarkers.join(', ')}`);
    }
    
    if (t.locationCount) {
      sections.push(`Locations: ${t.locationCount} sites`);
    }
  });

  sections.push('\n\nPlease rank these trials by relevance to the source trial. Respond ONLY with JSON.');

  return sections.join('\n');
}
