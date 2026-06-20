import { NextRequest, NextResponse } from 'next/server';

// POST /api/ai/expand-query
export async function POST(request: NextRequest) {
  try {
    const { query, patientProfile } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Return basic expansion without AI
      return NextResponse.json({
        originalQuery: query,
        expandedQueries: [query],
        suggestions: [],
        explanation: null,
      });
    }

    const context = buildContext(query, patientProfile);

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
      console.error('Anthropic API error');
      return NextResponse.json({
        originalQuery: query,
        expandedQueries: [query],
        suggestions: [],
        explanation: null,
      });
    }

    const data = await response.json();
    const expansionText = data.content
      ?.map((block: any) => (block.type === 'text' ? block.text : ''))
      .filter(Boolean)
      .join('\n');

    let expansion;
    try {
      const cleaned = expansionText.replace(/```json\s?|```/g, '').trim();
      expansion = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse expansion JSON:', expansionText);
      return NextResponse.json({
        originalQuery: query,
        expandedQueries: [query],
        suggestions: [],
        explanation: null,
      });
    }

    return NextResponse.json({
      originalQuery: query,
      expandedQueries: expansion.expandedQueries || [query],
      suggestions: expansion.suggestions || [],
      synonyms: expansion.synonyms || [],
      relatedBiomarkers: expansion.relatedBiomarkers || [],
      broaderTerms: expansion.broaderTerms || [],
      narrowerTerms: expansion.narrowerTerms || [],
      explanation: expansion.explanation || null,
    });
  } catch (error: any) {
    console.error('Query expansion error:', error);
    return NextResponse.json(
      { error: 'Failed to expand query' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a clinical trial search specialist. Your job is to expand user search queries to help them find more relevant clinical trials they might otherwise miss.

IMPORTANT RULES:
1. Understand medical terminology and common variations
2. Include synonyms, abbreviations, and related terms
3. Consider subtypes and related conditions
4. Add relevant biomarkers when applicable
5. Keep expansions clinically relevant — don't add unrelated terms
6. Prioritize terms likely to appear in ClinicalTrials.gov listings

EXPANSION STRATEGIES:
- Abbreviations: "non-small cell lung cancer" ↔ "NSCLC"
- Subtypes: "lung cancer" → includes "adenocarcinoma", "squamous cell"
- Synonyms: "tumor" ↔ "tumour" ↔ "neoplasm" ↔ "malignancy"
- Biomarkers: "NSCLC" → consider "EGFR", "ALK", "ROS1", "KRAS", "PD-L1"
- Drug classes: "immunotherapy" → "checkpoint inhibitor", "PD-1", "PD-L1"
- Staging: Include stage-specific searches if relevant

You MUST respond with valid JSON (no markdown, no code fences):
{
  "expandedQueries": [
    "Primary expanded query combining key terms",
    "Alternative query with synonyms",
    "More specific subtype query"
  ],
  "synonyms": [
    {"term": "original term", "alternatives": ["synonym1", "synonym2"]}
  ],
  "relatedBiomarkers": ["EGFR", "ALK"],
  "broaderTerms": ["More general search term"],
  "narrowerTerms": ["More specific subtype"],
  "suggestions": [
    {
      "query": "Suggested refined search",
      "reason": "Why this might help find more trials",
      "type": "biomarker|subtype|synonym|drug_class|stage"
    }
  ],
  "explanation": "Brief explanation of how the query was expanded"
}

GUIDELINES:
- expandedQueries: 2-4 alternative search strings to try
- synonyms: Medical term variations
- relatedBiomarkers: Only if cancer/condition has known biomarkers
- broaderTerms: If query is very specific, suggest broader searches
- narrowerTerms: If query is broad, suggest more specific options
- suggestions: 3-6 clickable search refinements with explanations

Be helpful but don't overwhelm — prioritize the most clinically relevant expansions.`;

// ─────────────────────────────────────────────────────────────────────────────
// Build context
// ─────────────────────────────────────────────────────────────────────────────
function buildContext(query: string, patientProfile?: any): string {
  const sections: string[] = [];

  sections.push(`USER SEARCH QUERY: "${query}"`);

  if (patientProfile) {
    sections.push('\nPATIENT PROFILE (for context):');
    if (patientProfile.cancerType) sections.push(`- Cancer Type: ${patientProfile.cancerType}`);
    if (patientProfile.stage) sections.push(`- Stage: ${patientProfile.stage}`);
    if (patientProfile.biomarkers?.length > 0) {
      sections.push(`- Known Biomarkers: ${patientProfile.biomarkers.join(', ')}`);
    }
    if (patientProfile.priorTreatments?.length > 0) {
      const treatments = patientProfile.priorTreatments
        .map((t: any) => (typeof t === 'string' ? t : t.treatment))
        .join(', ');
      sections.push(`- Prior Treatments: ${treatments}`);
    }
  }

  sections.push('\nExpand this search query to help find more relevant clinical trials. Respond with JSON only.');

  return sections.join('\n');
}
