import { NextRequest, NextResponse } from 'next/server';

// POST /api/ai/summarize
export async function POST(request: NextRequest) {
  try {
    const { trial } = await request.json();

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

    // Build a structured prompt with the trial data
    const trialContext = buildTrialContext(trial);

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
        messages: [
          {
            role: 'user',
            content: trialContext,
          },
        ],
        system: SYSTEM_PROMPT,
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
    const summaryText = data.content
      ?.map((block: any) => (block.type === 'text' ? block.text : ''))
      .filter(Boolean)
      .join('\n');

    if (!summaryText) {
      return NextResponse.json(
        { error: 'No summary generated' },
        { status: 500 }
      );
    }

    // Parse the structured JSON response
    let summary;
    try {
      // Strip markdown code fences if present
      const cleaned = summaryText.replace(/```json\s?|```/g, '').trim();
      summary = JSON.parse(cleaned);
    } catch {
      // If JSON parsing fails, return raw text as overview
      summary = {
        overview: summaryText,
        treatment: null,
        eligibility: null,
        timeline: null,
        sideEffects: null,
        keyTakeaway: null,
      };
    }

    return NextResponse.json({ summary, nctId: trial.nctId });
  } catch (error: any) {
    console.error('AI summarize error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt for Claude
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a clinical trial translator for cancer patients and their caregivers. Your job is to convert dense medical trial data into clear, compassionate, plain-English summaries that a non-medical person can understand.

IMPORTANT RULES:
- Write at an 8th-grade reading level
- Never give medical advice or recommendations
- Always remind readers to consult their doctor
- Explain medical terms in parentheses when first used
- Be honest about unknowns — if data is missing, say so
- Keep a warm, empowering tone — patients are going through a lot
- Be concise but thorough

You MUST respond with valid JSON matching this exact structure (no markdown, no code fences):
{
  "overview": "2-3 sentence plain-English summary of what this trial is studying and why it matters",
  "treatment": {
    "what": "What drug/therapy is being tested, in simple terms",
    "how": "How the treatment works (mechanism), explained simply",
    "administration": "How it's given (pill, IV, injection, etc.) if known"
  },
  "eligibility": {
    "summary": "1-2 sentence overview of who this trial is looking for",
    "mustHave": ["list of key inclusion criteria in plain English"],
    "cantHave": ["list of key exclusion criteria in plain English"],
    "ageRange": "age requirements if specified"
  },
  "timeline": {
    "phase": "What phase means in plain English",
    "estimatedDuration": "How long participation might last, if available",
    "visits": "What to expect in terms of visits/schedule, if available",
    "details": "Any other timeline info"
  },
  "sideEffects": {
    "summary": "General statement about what's known",
    "known": ["list of known/expected side effects if mentioned"],
    "note": "Important context about side effect monitoring"
  },
  "keyTakeaway": "One empowering sentence about this trial — what makes it noteworthy or hopeful"
}`;

// ─────────────────────────────────────────────────────────────────────────────
// Build trial context for the prompt
// ─────────────────────────────────────────────────────────────────────────────
function buildTrialContext(trial: any): string {
  const sections: string[] = [];

  sections.push(`CLINICAL TRIAL: ${trial.nctId}`);
  sections.push(`TITLE: ${trial.briefTitle || trial.title}`);

  if (trial.officialTitle) {
    sections.push(`OFFICIAL TITLE: ${trial.officialTitle}`);
  }

  sections.push(`STATUS: ${trial.status}`);
  sections.push(`PHASE: ${trial.phase || 'Not specified'}`);
  sections.push(`STUDY TYPE: ${trial.studyType || 'Interventional'}`);

  if (trial.conditions?.length > 0) {
    sections.push(`CONDITIONS: ${trial.conditions.join(', ')}`);
  }

  if (trial.interventions?.length > 0) {
    const interventionText = trial.interventions
      .map((i: any) => `- ${i.name} (${i.type}): ${i.description || 'No description'}`)
      .join('\n');
    sections.push(`INTERVENTIONS:\n${interventionText}`);
  }

  if (trial.biomarkers?.length > 0) {
    sections.push(`BIOMARKERS: ${trial.biomarkers.join(', ')}`);
  }

  if (trial.stages?.length > 0) {
    sections.push(`STAGES: ${trial.stages.join(', ')}`);
  }

  if (trial.eligibilityCriteria) {
    sections.push(`ELIGIBILITY CRITERIA:\n${trial.eligibilityCriteria}`);
  }

  if (trial.eligibilityParsed) {
    const ep = trial.eligibilityParsed;
    if (ep.minAge || ep.maxAge) {
      sections.push(`AGE: ${ep.minAge || 'No minimum'} to ${ep.maxAge || 'No maximum'}`);
    }
    if (ep.sex && ep.sex !== 'All') {
      sections.push(`SEX: ${ep.sex}`);
    }
  }

  if (trial.sponsor) {
    sections.push(`SPONSOR: ${trial.sponsor}`);
  }

  if (trial.locationCount) {
    sections.push(`LOCATIONS: ${trial.locationCount} sites`);
  }

  sections.push(
    '\nPlease summarize this trial for a cancer patient or caregiver. Respond ONLY with the JSON structure specified — no other text.'
  );

  return sections.join('\n');
}
