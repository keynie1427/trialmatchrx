import { NextRequest, NextResponse } from 'next/server';

// POST /api/ai/timeline
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
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: trialContext,
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
    const timelineText = data.content
      ?.map((block: any) => (block.type === 'text' ? block.text : ''))
      .filter(Boolean)
      .join('\n');

    if (!timelineText) {
      return NextResponse.json(
        { error: 'No timeline generated' },
        { status: 500 }
      );
    }

    // Parse the structured JSON response
    let timeline;
    try {
      const cleaned = timelineText.replace(/```json\s?|```/g, '').trim();
      timeline = JSON.parse(cleaned);
    } catch {
      // If JSON parsing fails, return error
      console.error('Failed to parse timeline JSON:', timelineText);
      return NextResponse.json(
        { error: 'Failed to parse timeline data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ timeline, nctId: trial.nctId });
  } catch (error: any) {
    console.error('Timeline generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate timeline' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a clinical trial timeline specialist. Your job is to analyze clinical trial protocols and generate a clear, patient-friendly timeline showing what participation would look like.

IMPORTANT RULES:
1. Extract timeline information from the trial data provided
2. If specific timing is not mentioned, make reasonable estimates based on standard practices for that trial phase and type
3. Be clear about what is estimated vs. explicitly stated
4. Write at an 8th-grade reading level
5. Use patient-friendly language

You MUST respond with valid JSON matching this exact structure (no markdown, no code fences, no other text):
{
  "totalDuration": {
    "estimate": "6-12 months",
    "note": "Based on trial phase and design"
  },
  "phases": [
    {
      "id": "screening",
      "name": "Screening Period",
      "duration": "2-4 weeks",
      "icon": "clipboard",
      "color": "blue",
      "description": "Initial tests to confirm you qualify for the trial",
      "activities": [
        {
          "name": "Initial consultation",
          "description": "Meet the research team, review consent forms",
          "timing": "Day 1"
        },
        {
          "name": "Medical tests",
          "description": "Blood work, scans, physical exam",
          "timing": "Week 1-2"
        }
      ]
    },
    {
      "id": "treatment",
      "name": "Treatment Period",
      "duration": "3-6 months",
      "icon": "pill",
      "color": "green",
      "description": "Active treatment phase with regular monitoring",
      "activities": [
        {
          "name": "Treatment cycles",
          "description": "Description of how treatment is given",
          "timing": "Every X weeks"
        }
      ],
      "cycles": {
        "count": "4-6 cycles",
        "length": "3 weeks each",
        "note": "Each cycle includes treatment and rest period"
      }
    },
    {
      "id": "followup",
      "name": "Follow-up Period",
      "duration": "6-12 months",
      "icon": "calendar",
      "color": "purple",
      "description": "Monitoring after treatment ends",
      "activities": [
        {
          "name": "Follow-up visits",
          "description": "Check-ups to monitor your health",
          "timing": "Every 3 months"
        }
      ]
    }
  ],
  "visitFrequency": {
    "duringTreatment": "Weekly to every 3 weeks",
    "duringFollowUp": "Monthly to quarterly"
  },
  "timeCommitment": {
    "perVisit": "2-4 hours typically",
    "note": "First visits may take longer"
  },
  "keyMilestones": [
    {
      "name": "Consent & Screening",
      "timing": "Week 0",
      "description": "Sign consent, begin screening tests"
    },
    {
      "name": "Treatment Start",
      "timing": "Week 2-4",
      "description": "First dose of study treatment"
    },
    {
      "name": "Mid-treatment Assessment",
      "timing": "Week 12",
      "description": "Scans to check treatment response"
    },
    {
      "name": "End of Treatment",
      "timing": "Week 24",
      "description": "Complete active treatment phase"
    }
  ],
  "importantNotes": [
    "Timelines can vary based on your individual response",
    "Some visits may be done virtually/by phone",
    "The trial team will provide a detailed schedule"
  ],
  "confidence": "medium",
  "confidenceNote": "Timeline estimated from trial phase and standard protocols; specific details may vary"
}

ICON OPTIONS: "clipboard" (screening), "pill" (treatment/drug), "syringe" (injection/infusion), "calendar" (follow-up), "scan" (imaging), "vial" (lab tests), "heart" (monitoring)

COLOR OPTIONS: "blue" (screening), "green" (treatment), "purple" (follow-up), "amber" (assessment), "teal" (primary)

Analyze the trial data carefully. For phase 1 trials, expect shorter duration. For phase 3, expect longer. Immunotherapy trials often have longer treatment periods. Adjust accordingly.`;

// ─────────────────────────────────────────────────────────────────────────────
// Build trial context
// ─────────────────────────────────────────────────────────────────────────────
function buildTrialContext(trial: any): string {
  const sections: string[] = [];

  sections.push(`CLINICAL TRIAL: ${trial.nctId}`);
  sections.push(`TITLE: ${trial.briefTitle || trial.title}`);
  sections.push(`PHASE: ${trial.phase || 'Not specified'}`);
  sections.push(`STUDY TYPE: ${trial.studyType || 'Interventional'}`);
  sections.push(`STATUS: ${trial.status}`);

  if (trial.conditions?.length > 0) {
    sections.push(`CONDITIONS: ${trial.conditions.join(', ')}`);
  }

  if (trial.interventions?.length > 0) {
    const interventionText = trial.interventions
      .map((i: any) => {
        let desc = `${i.name} (${i.type})`;
        if (i.description) desc += `: ${i.description}`;
        return desc;
      })
      .join('\n');
    sections.push(`INTERVENTIONS:\n${interventionText}`);
  }

  if (trial.startDate) {
    sections.push(`START DATE: ${trial.startDate}`);
  }

  if (trial.primaryCompletionDate) {
    sections.push(`PRIMARY COMPLETION DATE: ${trial.primaryCompletionDate}`);
  }

  if (trial.completionDate) {
    sections.push(`COMPLETION DATE: ${trial.completionDate}`);
  }

  if (trial.eligibilityCriteria) {
    // Include eligibility as it often contains visit/schedule info
    sections.push(`ELIGIBILITY CRITERIA (may contain schedule info):\n${trial.eligibilityCriteria}`);
  }

  if (trial.summary) {
    sections.push(`SUMMARY: ${trial.summary}`);
  }

  sections.push(
    '\nPlease generate a patient-friendly timeline for this trial. Respond ONLY with the JSON structure specified — no other text.'
  );

  return sections.join('\n');
}
