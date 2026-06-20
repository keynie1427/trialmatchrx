import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { trials, patientProfile, digestType = 'weekly' } = await request.json();

    if (!trials || !Array.isArray(trials) || trials.length === 0) {
      return NextResponse.json({ error: 'Trials array is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const context = buildContext(trials, patientProfile, digestType);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: context }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 502 });
    }

    const data = await response.json();
    const digestText = data.content?.map((block: any) => block.type === 'text' ? block.text : '').filter(Boolean).join('\n');

    let digest;
    try {
      const cleaned = digestText.replace(/```json\s?|```/g, '').trim();
      digest = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Failed to parse digest' }, { status: 500 });
    }

    return NextResponse.json({ digest });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate digest' }, { status: 500 });
  }
}

const SYSTEM_PROMPT = `You are a clinical trial digest specialist. Summarize new clinical trials for cancer patients in a clear, encouraging, and actionable email digest.

RULES:
1. Write at an 8th-grade reading level
2. Be warm and supportive
3. Highlight the most promising trials first
4. Explain WHY each trial might be relevant
5. Keep summaries concise but informative

Respond with valid JSON only:
{
  "subject": "Email subject line",
  "preheader": "Email preheader text",
  "greeting": "Personalized greeting",
  "summary": "2-3 sentence overview",
  "highlights": [
    {
      "nctId": "NCT12345678",
      "title": "Brief trial title",
      "oneLiner": "One sentence why this trial is exciting",
      "relevance": "Why this matches the patient",
      "phase": "Phase 2",
      "status": "Recruiting",
      "highlight": "precision|immunotherapy|combination|novel|convenient|expanded"
    }
  ],
  "quickStats": { "totalNew": 5, "recruiting": 4, "nearYou": 2, "biomarkerMatch": 3 },
  "callToAction": "Encouraging message",
  "tip": "Helpful tip for the patient"
}`;

function buildContext(trials: any[], patientProfile?: any, digestType?: string): string {
  const sections: string[] = [`DIGEST TYPE: ${digestType || 'weekly'}`, `NEW TRIALS: ${trials.length}`, ''];

  if (patientProfile) {
    sections.push('=== PATIENT PROFILE ===');
    if (patientProfile.name) sections.push(`Name: ${patientProfile.name.split(' ')[0]}`);
    if (patientProfile.cancerType) sections.push(`Cancer Type: ${patientProfile.cancerType}`);
    if (patientProfile.stage) sections.push(`Stage: ${patientProfile.stage}`);
    if (patientProfile.biomarkers?.length > 0) sections.push(`Biomarkers: ${patientProfile.biomarkers.join(', ')}`);
    sections.push('');
  }

  sections.push('=== TRIALS TO SUMMARIZE ===');
  trials.slice(0, 10).forEach((trial, i) => {
    sections.push(`\n[${i + 1}] ${trial.nctId}`);
    sections.push(`Title: ${trial.briefTitle || trial.title}`);
    sections.push(`Phase: ${trial.phase}`);
    sections.push(`Status: ${trial.status}`);
    if (trial.conditions?.length) sections.push(`Conditions: ${trial.conditions.join(', ')}`);
  });

  sections.push('\n\nCreate an engaging email digest. Respond with JSON only.');
  return sections.join('\n');
}
