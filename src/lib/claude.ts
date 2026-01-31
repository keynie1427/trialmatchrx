import Anthropic from '@anthropic-ai/sdk';
import type { Trial, PatientProfile, AIMatchResponse, SearchCriteria } from '@/types';

// Initialize client (API key from environment)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

// =============================================================================
// AI MATCHING
// =============================================================================

export async function analyzeTrialMatch(
  trial: Trial,
  profile: PatientProfile
): Promise<AIMatchResponse> {
  const prompt = `You are an expert oncology clinical trial matching assistant. Analyze how well this clinical trial matches the patient's profile.

## Patient Profile
- Cancer Type: ${profile.cancerType}${profile.cancerSubtype ? ` (${profile.cancerSubtype})` : ''}
- Stage: ${profile.stage || 'Not specified'}
- Biomarkers: ${profile.biomarkers.length > 0 ? profile.biomarkers.join(', ') : 'None specified'}
- Prior Treatments: ${profile.priorTreatments.length > 0 ? profile.priorTreatments.map(t => t.treatment).join(', ') : 'None (treatment-naïve)'}
- Age: ${profile.age || 'Not specified'}
- ECOG Status: ${profile.ecogStatus !== undefined ? profile.ecogStatus : 'Not specified'}
- Location: ${profile.zip || 'Not specified'}

## Clinical Trial: ${trial.nctId}
- Title: ${trial.title}
- Phase: ${trial.phase}
- Status: ${trial.status}
- Conditions: ${trial.conditions.join(', ')}
- Required Biomarkers: ${trial.biomarkersRequired.length > 0 ? trial.biomarkersRequired.join(', ') : 'None specified'}
- Stages: ${trial.stages.length > 0 ? trial.stages.join(', ') : 'Not specified'}
- Interventions: ${trial.interventions.map(i => `${i.name} (${i.type})`).join(', ')}

## Eligibility Criteria
${trial.eligibilityCriteria.substring(0, 3000)}

---

Analyze the match and respond in JSON format:
{
  "score": <0-100 match score>,
  "summary": "<2-3 sentence summary of how well this trial matches and key considerations>",
  "matchReasons": ["<reason 1>", "<reason 2>", ...],
  "concerns": ["<potential concern or mismatch 1>", ...],
  "questions": ["<question patient should ask their oncologist>", ...]
}

Be specific and actionable. Focus on clinical relevance.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  // Extract text response
  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse JSON from response
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from response');
  }

  return JSON.parse(jsonMatch[0]) as AIMatchResponse;
}

// =============================================================================
// NATURAL LANGUAGE SEARCH
// =============================================================================

export async function parseNaturalLanguageQuery(query: string): Promise<SearchCriteria> {
  const prompt = `You are a clinical trial search assistant. Parse this natural language query into structured search criteria.

Query: "${query}"

Extract any mentioned:
- Cancer type (normalize to standard names like "Non-Small Cell Lung Cancer", "Breast Cancer", etc.)
- Stage (Stage I, II, III, IV, Metastatic, etc.)
- Biomarkers (EGFR, ALK, KRAS, HER2, PD-L1, BRCA, etc.)
- Prior treatments mentioned
- Trial phase preferences
- Location/distance preferences

Respond in JSON format:
{
  "cancerType": "<normalized cancer type or null>",
  "stage": "<stage or null>",
  "biomarkers": ["<biomarker>", ...] or [],
  "priorTreatment": "<treatment type or null>",
  "treatmentNaive": <true/false/null>,
  "phase": ["<phase>", ...] or [],
  "query": "<refined keyword query for additional search>"
}

If something isn't mentioned, use null or empty array. Be precise with medical terminology.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from response');
  }

  return JSON.parse(jsonMatch[0]) as SearchCriteria;
}

// =============================================================================
// TRIAL SUMMARIZATION
// =============================================================================

export async function generateTrialSummary(trial: Trial): Promise<string> {
  const prompt = `Summarize this clinical trial in 2-3 sentences for a cancer patient. Be clear, helpful, and avoid jargon.

Trial: ${trial.nctId}
Title: ${trial.title}
Phase: ${trial.phase}
Conditions: ${trial.conditions.join(', ')}
Interventions: ${trial.interventions.map(i => i.name).join(', ')}
Biomarkers: ${trial.biomarkers.join(', ') || 'None specified'}
Locations: ${trial.locationCount} sites

Brief eligibility:
${trial.eligibilityParsed.keyInclusions.slice(0, 3).join('\n')}

Write a patient-friendly summary (2-3 sentences):`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    return trial.briefTitle;
  }

  return textContent.text.trim();
}

// =============================================================================
// ELIGIBILITY ANALYSIS
// =============================================================================

export async function analyzeEligibility(
  trial: Trial,
  profile: PatientProfile
): Promise<{
  likely: boolean;
  confidence: number;
  analysis: string;
  meetsCriteria: string[];
  mayNotMeet: string[];
  unclear: string[];
}> {
  const prompt = `Analyze whether this patient likely meets the eligibility criteria for this clinical trial.

## Patient
- Cancer: ${profile.cancerType} ${profile.stage || ''}
- Biomarkers: ${profile.biomarkers.join(', ') || 'Unknown'}
- Prior treatments: ${profile.priorTreatments.map(t => t.treatment).join(', ') || 'None'}
- Age: ${profile.age || 'Unknown'}
- ECOG: ${profile.ecogStatus ?? 'Unknown'}

## Trial Eligibility Criteria
${trial.eligibilityCriteria.substring(0, 4000)}

Analyze and respond in JSON:
{
  "likely": <true/false - likely eligible based on available info>,
  "confidence": <0-100 - how confident in this assessment>,
  "analysis": "<brief explanation>",
  "meetsCriteria": ["<criteria clearly met>", ...],
  "mayNotMeet": ["<criteria that may not be met>", ...],
  "unclear": ["<criteria that need more info to determine>", ...]
}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from response');
  }

  return JSON.parse(jsonMatch[0]);
}

// =============================================================================
// BATCH SCORING
// =============================================================================

export async function scoreTrialsBatch(
  trials: Trial[],
  profile: PatientProfile
): Promise<Map<string, number>> {
  // For efficiency, score multiple trials in one call
  const trialsInfo = trials.slice(0, 10).map(t => ({
    nctId: t.nctId,
    title: t.briefTitle,
    phase: t.phase,
    conditions: t.conditionsNormalized.join(', '),
    biomarkers: t.biomarkers.join(', '),
    stages: t.stages.join(', '),
  }));

  const prompt = `Score these clinical trials for this patient on a 0-100 scale.

## Patient
- Cancer: ${profile.cancerType} ${profile.stage || ''}
- Biomarkers: ${profile.biomarkers.join(', ') || 'None'}
- Prior treatments: ${profile.treatmentNaive ? 'None (treatment-naïve)' : profile.priorTreatments.map(t => t.treatment).join(', ')}

## Trials
${trialsInfo.map((t, i) => `${i + 1}. ${t.nctId}: ${t.title}
   Phase: ${t.phase} | Conditions: ${t.conditions} | Biomarkers: ${t.biomarkers} | Stages: ${t.stages}`).join('\n\n')}

Score each trial. Higher = better match. Consider cancer type match, biomarker alignment, stage appropriateness, and treatment history fit.

Respond in JSON:
{
  "scores": {
    "<nctId>": <score>,
    ...
  }
}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from response');
  }

  const result = JSON.parse(jsonMatch[0]);
  return new Map(Object.entries(result.scores) as [string, number][]);
}

export default {
  analyzeTrialMatch,
  parseNaturalLanguageQuery,
  generateTrialSummary,
  analyzeEligibility,
  scoreTrialsBatch,
};
