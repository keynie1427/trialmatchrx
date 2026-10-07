// Pull patient age and sex out of a free-text search query, e.g.
// "45 year old woman with HER2+ breast cancer" -> { age: 45, sex: 'Female' }.
// Deterministic (no API call) so it is fast, free and predictable.

export interface ExtractedDemographics {
  age?: number;
  sex?: 'Male' | 'Female';
  /** Query with the age/sex phrases removed, for keyword search */
  cleanedQuery: string;
}

const AGE_PATTERNS: RegExp[] = [
  /\b(\d{1,3})\s*[- ]?\s*(?:years?|yrs?|y)\s*[- ]?\s*\/?\s*o(?:ld)?\b/i, // 45 year old, 45-year-old, 45 yo, 45 y/o
  /\b(\d{1,3})\s*(?:years?|yrs?)\s+of\s+age\b/i,                          // 45 years of age
  /\b(?:age|aged)\s*:?\s*(\d{1,3})\b/i,                                   // age 45, aged 45
  /\b(\d{1,3})\s*(?:M|F)\b/,                                              // 45M, 45 F (clinical shorthand)
  /\b(?:woman|man|female|male|patient)\s*,\s*(\d{1,3})\b(?!\s*(?:mg|cm|mm|%))/i,    // woman, 52
  /\b(?:is|am|are|turned|turning)\s+(\d{1,3})\b(?!\s*(?:mg|cm|mm|%|cycles?|weeks?|months?|days?))/i, // she is 70
];

const FEMALE_WORDS = /\b(female|woman|women|girl|lady|she|her|mother|mom|wife|daughter|sister|grandmother|postmenopausal|premenopausal)\b/gi;
const MALE_WORDS = /\b(male|man|men|boy|gentleman|he|his|him|father|dad|husband|son|brother|grandfather)\b/gi;

export function extractDemographics(text: string): ExtractedDemographics {
  let cleaned = text;
  let age: number | undefined;

  for (const pattern of AGE_PATTERNS) {
    const m = cleaned.match(pattern);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 0 && n <= 120) {
        age = n;
        cleaned = cleaned.replace(m[0], ' ');
        break;
      }
    }
  }

  // Clinical shorthand "45M"/"45F" also implies sex
  const shorthand = text.match(/\b\d{1,3}\s*(M|F)\b/);
  const femaleHits = (text.match(FEMALE_WORDS) || []).length + (shorthand?.[1] === 'F' ? 1 : 0);
  const maleHits = (text.match(MALE_WORDS) || []).length + (shorthand?.[1] === 'M' ? 1 : 0);

  let sex: 'Male' | 'Female' | undefined;
  if (femaleHits > 0 && maleHits === 0) sex = 'Female';
  else if (maleHits > 0 && femaleHits === 0) sex = 'Male';
  // Mixed signals (e.g. "my husband's mother") -> don't guess

  if (sex) {
    cleaned = cleaned.replace(sex === 'Female' ? FEMALE_WORDS : MALE_WORDS, ' ');
  }

  // Tidy leftover filler words/punctuation at the start (e.g. "my is with ...")
  const FILLER = /^(?:[\s,.;:-]|\b(?:a|an|my|our|is|am|are|was|who|has|have|had|with|and|of|old)\b)+/i;
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  for (let i = 0; i < 5 && FILLER.test(cleaned); i++) cleaned = cleaned.replace(FILLER, '').trim();
  cleaned = cleaned.replace(/[\s,.;:-]+$/, '');

  return { age, sex, cleanedQuery: cleaned || text };
}
