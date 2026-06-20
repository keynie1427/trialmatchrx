import { NextRequest, NextResponse } from 'next/server';

// POST /api/ai/eligibility
export async function POST(request: NextRequest) {
  try {
    const { trial, messages, patientProfile } = await request.json();

    if (!trial || !trial.nctId) {
      return NextResponse.json(
        { error: 'Trial data is required' },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
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

    // Build the system prompt with trial context
    const systemPrompt = buildSystemPrompt(trial, patientProfile);

    // Format messages for Anthropic API
    const apiMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: apiMessages,
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
    const replyText = data.content
      ?.map((block: any) => (block.type === 'text' ? block.text : ''))
      .filter(Boolean)
      .join('\n');

    if (!replyText) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply: replyText, nctId: trial.nctId });
  } catch (error: any) {
    console.error('Eligibility chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt builder
// ─────────────────────────────────────────────────────────────────────────────
function buildSystemPrompt(trial: any, patientProfile?: any): string {
  const trialContext = buildTrialContext(trial);
  const profileContext = patientProfile ? buildProfileContext(patientProfile) : '';

  return `You are a compassionate, knowledgeable clinical trial eligibility assistant for TrialMatchRX. You help cancer patients and caregivers understand whether they might be eligible for a specific clinical trial by walking them through the criteria in a conversational, supportive way.

CRITICAL RULES:
1. You are NOT a doctor. You CANNOT determine actual eligibility. Make this clear.
2. Only a trial's research team can make the final eligibility determination.
3. Write at an 8th-grade reading level. Explain medical terms in parentheses.
4. Be warm, empathetic, and encouraging — patients are going through a difficult time.
5. Ask ONE question at a time. Keep questions short and simple.
6. After gathering enough info (usually 4-6 questions), provide a preliminary assessment.
7. Never ask for sensitive personal identifiers (SSN, insurance numbers, etc.).
8. If someone seems distressed or mentions an emergency, direct them to call 911 or their doctor.

YOUR APPROACH:
- Start by introducing yourself briefly and explaining what you'll do.
- Ask about the MOST IMPORTANT criteria first (cancer type, stage, prior treatments).
- Skip criteria that are already known from the patient profile (if provided).
- For each answer, briefly acknowledge it before moving to the next question.
- After gathering key information, provide a structured preliminary assessment:
  • What criteria they appear to MEET ✅
  • What criteria they may NOT meet ❌
  • What criteria are UNCLEAR and need the trial team to confirm ❓
  • A clear next step recommendation
- Always end with the disclaimer that only the trial team can confirm eligibility.

ASSESSMENT FORMAT (use when ready to assess):
When you have enough information, structure your assessment clearly:
- Use ✅ for criteria that appear to be met
- Use ❌ for criteria that appear not to be met  
- Use ❓ for criteria that need further evaluation
- Give an overall outlook: "Likely eligible", "May be eligible", "Unlikely eligible", or "More information needed"
- Always recommend contacting the trial site as the next step

TRIAL BEING EVALUATED:
${trialContext}
${profileContext ? `\nPATIENT PROFILE (already known — skip these questions):\n${profileContext}` : ''}

Remember: Be conversational, warm, and ask ONE question at a time. Keep responses concise (2-4 sentences max per message, unless giving the final assessment).`;
}

function buildTrialContext(trial: any): string {
  const sections: string[] = [];

  sections.push(`Trial ID: ${trial.nctId}`);
  sections.push(`Title: ${trial.briefTitle || trial.title}`);
  sections.push(`Status: ${trial.status}`);
  sections.push(`Phase: ${trial.phase || 'Not specified'}`);

  if (trial.conditions?.length > 0) {
    sections.push(`Conditions: ${trial.conditions.join(', ')}`);
  }

  if (trial.interventions?.length > 0) {
    const interventionText = trial.interventions
      .map((i: any) => `${i.name} (${i.type})`)
      .join(', ');
    sections.push(`Treatments: ${interventionText}`);
  }

  if (trial.biomarkers?.length > 0) {
    sections.push(`Biomarkers: ${trial.biomarkers.join(', ')}`);
  }

  if (trial.stages?.length > 0) {
    sections.push(`Stages: ${trial.stages.join(', ')}`);
  }

  if (trial.eligibilityCriteria) {
    sections.push(`\nFull Eligibility Criteria:\n${trial.eligibilityCriteria}`);
  }

  if (trial.eligibilityParsed) {
    const ep = trial.eligibilityParsed;
    if (ep.minAge || ep.maxAge) {
      sections.push(`Age requirement: ${ep.minAge || 'No minimum'} to ${ep.maxAge || 'No maximum'}`);
    }
    if (ep.sex && ep.sex !== 'All') {
      sections.push(`Sex requirement: ${ep.sex}`);
    }
    if (ep.ecogMax !== undefined) {
      sections.push(`ECOG Performance Status: 0-${ep.ecogMax}`);
    }
  }

  if (trial.sponsor) {
    sections.push(`Sponsor: ${trial.sponsor}`);
  }

  if (trial.locationCount) {
    sections.push(`Number of sites: ${trial.locationCount}`);
  }

  return sections.join('\n');
}

function buildProfileContext(profile: any): string {
  const parts: string[] = [];

  if (profile.cancerType) parts.push(`Cancer type: ${profile.cancerType}`);
  if (profile.stage) parts.push(`Stage: ${profile.stage}`);
  if (profile.biomarkers?.length > 0) parts.push(`Biomarkers: ${profile.biomarkers.join(', ')}`);
  if (profile.age) parts.push(`Age: ${profile.age}`);
  if (profile.sex) parts.push(`Sex: ${profile.sex}`);
  if (profile.priorTreatments?.length > 0) {
    const treatments = profile.priorTreatments.map((t: any) => t.treatment).join(', ');
    parts.push(`Prior treatments: ${treatments}`);
  }
  if (profile.ecogStatus !== undefined) parts.push(`ECOG status: ${profile.ecogStatus}`);

  return parts.join('\n');
}
