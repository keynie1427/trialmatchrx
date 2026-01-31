import { NextRequest, NextResponse } from 'next/server';

// POST /api/ai/compare
export async function POST(request: NextRequest) {
  try {
    const { trials, patientProfile } = await request.json();

    if (!trials || !Array.isArray(trials) || trials.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 trials are required for comparison' },
        { status: 400 }
      );
    }

    if (trials.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 trials can be compared at once' },
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

    const context = buildComparisonContext(trials, patientProfile);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
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
    const comparisonText = data.content
      ?.map((block: any) => (block.type === 'text' ? block.text : ''))
      .filter(Boolean)
      .join('\n');

    if (!comparisonText) {
      return NextResponse.json(
        { error: 'No comparison generated' },
        { status: 500 }
      );
    }

    // Parse the structured JSON response
    let comparison;
    try {
      const cleaned = comparisonText.replace(/```json\s?|```/g, '').trim();
      comparison = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse comparison JSON:', comparisonText);
      return NextResponse.json(
        { error: 'Failed to parse comparison data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ comparison });
  } catch (error: any) {
    console.error('Comparison generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate comparison' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a clinical trial comparison specialist helping cancer patients and caregivers understand the differences between trials they're considering. Your job is to provide personalized, actionable insights.

IMPORTANT RULES:
1. You are NOT a doctor. You CANNOT recommend one trial over another.
2. Focus on objective differences and how they relate to the patient's profile.
3. Write at an 8th-grade reading level. Explain medical terms in parentheses.
4. Be warm and supportive — patients are making difficult decisions.
5. Highlight both advantages AND disadvantages of each trial fairly.
6. If patient profile is provided, personalize insights to their specific situation.
7. Be specific — mention actual biomarkers, locations, phases, treatments by name.

You MUST respond with valid JSON matching this structure (no markdown, no code fences):
{
  "overview": "2-3 sentence summary of how these trials compare overall",
  "trialInsights": [
    {
      "nctId": "NCT12345678",
      "title": "Brief trial title",
      "pros": [
        {
          "point": "Short pro headline",
          "detail": "1-2 sentence explanation of why this is good for the patient",
          "icon": "target|location|clock|pill|shield|star|users|trending"
        }
      ],
      "cons": [
        {
          "point": "Short con headline", 
          "detail": "1-2 sentence explanation of the potential downside",
          "icon": "alert|clock|location|question|x"
        }
      ],
      "bestFor": "One sentence describing who this trial is ideal for",
      "personalizedNote": "Specific insight based on patient profile (or null if no profile)"
    }
  ],
  "keyDifferences": [
    {
      "category": "Treatment Approach|Phase|Location|Schedule|Eligibility|Biomarkers",
      "comparison": "Clear explanation of how the trials differ in this aspect"
    }
  ],
  "questions": [
    "Question patient should ask their doctor when deciding between these trials"
  ],
  "bottomLine": "Balanced 2-3 sentence conclusion helping patient think about their decision (without recommending one over another)"
}

ICON OPTIONS for pros: "target" (targeted therapy/precision), "location" (convenient location), "clock" (shorter duration/less visits), "pill" (oral treatment), "shield" (safety profile), "star" (newer/innovative), "users" (larger trial), "trending" (promising results)

ICON OPTIONS for cons: "alert" (side effects/risks), "clock" (longer duration/more visits), "location" (far away), "question" (less data), "x" (strict requirements)

Be specific and personalized. Don't give generic advice — reference actual details from the trials.`;

// ─────────────────────────────────────────────────────────────────────────────
// Build comparison context
// ─────────────────────────────────────────────────────────────────────────────
function buildComparisonContext(trials: any[], patientProfile?: any): string {
  const sections: string[] = [];

  // Patient profile (if available)
  if (patientProfile) {
    sections.push('=== PATIENT PROFILE ===');
    if (patientProfile.cancerType) sections.push(`Cancer Type: ${patientProfile.cancerType}`);
    if (patientProfile.stage) sections.push(`Stage: ${patientProfile.stage}`);
    if (patientProfile.biomarkers?.length > 0) {
      sections.push(`Biomarkers: ${patientProfile.biomarkers.join(', ')}`);
    }
    if (patientProfile.age) sections.push(`Age: ${patientProfile.age}`);
    if (patientProfile.priorTreatments?.length > 0) {
      const treatments = patientProfile.priorTreatments.map((t: any) => 
        typeof t === 'string' ? t : t.treatment
      ).join(', ');
      sections.push(`Prior Treatments: ${treatments}`);
    }
    if (patientProfile.zip) sections.push(`Location (ZIP): ${patientProfile.zip}`);
    if (patientProfile.ecogStatus !== undefined) {
      sections.push(`ECOG Status: ${patientProfile.ecogStatus}`);
    }
    sections.push('');
  }

  // Each trial
  trials.forEach((trial, index) => {
    sections.push(`=== TRIAL ${index + 1}: ${trial.nctId} ===`);
    sections.push(`Title: ${trial.briefTitle || trial.title}`);
    sections.push(`Phase: ${trial.phase || 'Not specified'}`);
    sections.push(`Status: ${trial.status}`);
    sections.push(`Sponsor: ${trial.sponsor || 'Unknown'}`);

    if (trial.conditions?.length > 0) {
      sections.push(`Conditions: ${trial.conditions.join(', ')}`);
    }

    if (trial.interventions?.length > 0) {
      const interventions = trial.interventions
        .map((i: any) => `${i.name} (${i.type})${i.description ? ': ' + i.description : ''}`)
        .join('; ');
      sections.push(`Treatments: ${interventions}`);
    }

    if (trial.biomarkers?.length > 0) {
      sections.push(`Biomarkers: ${trial.biomarkers.join(', ')}`);
    }

    if (trial.stages?.length > 0) {
      sections.push(`Stages: ${trial.stages.join(', ')}`);
    }

    if (trial.locationCount) {
      sections.push(`Number of Sites: ${trial.locationCount}`);
    }

    if (trial.locations?.length > 0) {
      const topLocations = trial.locations.slice(0, 5).map((loc: any) => 
        `${loc.city}, ${loc.state}`
      ).join('; ');
      sections.push(`Sample Locations: ${topLocations}`);
    }

    if (trial.eligibilityParsed) {
      const ep = trial.eligibilityParsed;
      if (ep.minAge || ep.maxAge) {
        sections.push(`Age: ${ep.minAge || 'No min'} - ${ep.maxAge || 'No max'}`);
      }
    }

    if (trial.eligibilityCriteria) {
      // Truncate if too long
      const eligibility = trial.eligibilityCriteria.length > 2000 
        ? trial.eligibilityCriteria.substring(0, 2000) + '...'
        : trial.eligibilityCriteria;
      sections.push(`Eligibility Criteria:\n${eligibility}`);
    }

    // Distance from patient if available
    if (trial.nearestDistance !== undefined) {
      sections.push(`Distance from Patient: ${trial.nearestDistance} miles`);
    }

    sections.push('');
  });

  sections.push('Please compare these trials and provide personalized insights. Respond ONLY with the JSON structure specified — no other text.');

  return sections.join('\n');
}
