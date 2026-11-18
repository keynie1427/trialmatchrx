'use client';

// src/lib/i18n.ts
//
// Lightweight language + audience preferences for the public site.
//   - lang:     'en' | 'es'  — UI strings below, and the language AI summaries are written in
//   - audience: 'self' | 'caregiver' — wording on the search form and AI summaries
//
// Persisted to localStorage via zustand so the choice sticks between visits.
// Only the public patient-facing surfaces are translated (header, homepage,
// search form, trial cards, visit-prep page). Add keys here as more pages are
// translated; t() falls back to English for any missing Spanish string.

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'en' | 'es';
export type Audience = 'self' | 'caregiver';

interface PrefsState {
  lang: Lang;
  audience: Audience;
  setLang: (lang: Lang) => void;
  setAudience: (audience: Audience) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      lang: 'en',
      audience: 'self',
      setLang: (lang) => set({ lang }),
      setAudience: (audience) => set({ audience }),
    }),
    { name: 'tmrx-prefs' }
  )
);

const en = {
  // Header
  'nav.search': 'Search Trials',
  'nav.saved': 'Saved',
  'nav.about': 'About',
  'nav.cancerTypes': 'Cancer Types',

  // Hero
  'hero.badge': 'AI-Powered Clinical Trial Matching',
  'hero.title1': 'Find Clinical Trials',
  'hero.title2': 'Designed for You',
  'hero.subtitle':
    'Precision matching for cancer trials — personalized by cancer type, stage, biomarkers, treatment history, and how far you can travel. Let AI help you find the right trial.',
  'hero.cta': 'Search Trials Now',
  'hero.learn': 'Learn How It Works',
  'hero.privacy': 'Privacy-first',
  'hero.free': 'Free to Use',
  'hero.caregiver': 'Searching for a loved one? Caregivers welcome',
  'hero.startSearch': 'Start Your Search',

  // Stats
  'stats.recruitingWorld': 'Recruiting cancer trials worldwide',
  'stats.recruitingUS': 'With U.S. research sites',
  'stats.new30': 'New trials in the last 30 days',
  'stats.cancerTypes': 'Cancer types to search',
  'stats.source': 'Live counts from ClinicalTrials.gov (U.S. National Library of Medicine)',
  'stats.updated': 'updated',

  // Features
  'features.title': 'Why TrialMatchRX?',
  'features.subtitle':
    'We combine AI with the official U.S. clinical trial registry to help you find the most relevant trials for your situation.',
  'f1.title': 'Plain-Language Summaries',
  'f1.desc': 'Dense medical criteria rewritten at an 8th-grade reading level, so you know what a trial involves.',
  'f2.title': 'Transparent Match Scores',
  'f2.desc': 'Every score shows exactly which of your criteria a trial meets — and which it doesn’t.',
  'f3.title': 'Trials Near You',
  'f3.desc': 'Search by ZIP code and travel distance, and see the closest research site for every trial.',
  'f4.title': 'Smart Alerts',
  'f4.desc': 'Get an email when a new trial matching your saved search is posted.',

  // How it works
  'how.title': 'How It Works',
  'how.subtitle': 'Finding the right clinical trial is simple with our three-step process.',
  'how.s1.title': 'Enter Your Profile',
  'how.s1.desc': 'Cancer type, stage, biomarkers, treatment history, and your ZIP code.',
  'how.s2.title': 'AI Matches Trials',
  'how.s2.desc': 'We search every recruiting trial on ClinicalTrials.gov and rank them against your profile.',
  'how.s3.title': 'Prepare & Connect',
  'how.s3.desc': 'Save trials, print a visit-prep sheet for your oncologist, and contact research coordinators.',
  'how.step': 'Step',

  // Trust strip
  'trust.title': 'Built on trustworthy data',
  'trust.source': 'Trial data comes directly from ClinicalTrials.gov and refreshes continuously.',
  'trust.doctor': 'TrialMatchRX does not give medical advice. Always talk with your oncologist before enrolling.',
  'trust.privacy': 'We never sell your data. Read how we protect it.',
  'trust.team': 'Meet the team behind TrialMatchRX',

  // CTA
  'cta.title': 'Ready to Find Your Match?',
  'cta.desc': 'Start your search today and discover clinical trials matched to your diagnosis and treatment history.',
  'cta.button': 'Start Searching',

  // Search form
  'form.aiSearch': 'AI Search',
  'form.clear': 'Clear all',
  'form.who': 'Who are you searching for?',
  'form.who.self': 'Myself',
  'form.who.caregiver': 'Someone I care for',
  'form.cancerType': 'Cancer Type',
  'form.cancerType.their': 'Their Cancer Type',
  'form.allTypes': 'All cancer types',
  'form.stage': 'Stage',
  'form.allStages': 'All stages',
  'form.prior': 'Prior Treatment',
  'form.anyPrior': 'Any treatment history',
  'form.age': 'Age',
  'form.age.their': 'Their Age',
  'form.anyAge': 'Any age',
  'form.sex': 'Sex',
  'form.any': 'Any',
  'form.female': 'Female',
  'form.male': 'Male',
  'form.biomarkers': 'Biomarkers',
  'form.zip': 'ZIP Code',
  'form.zipPlaceholder': 'e.g. 71101',
  'form.distance': 'Travel Distance',
  'form.anyDistance': 'Any distance',
  'form.within': 'Within',
  'form.miles': 'miles',
  'form.advanced': 'Advanced filters',
  'form.phase': 'Trial Phase',
  'form.allBiomarkers': 'All Biomarkers',
  'form.submit': 'Search Trials',
  'form.searching': 'Searching...',
  'form.aiPlaceholder':
    "Describe what you're looking for... e.g., 'Stage 4 lung cancer with EGFR mutation after Tagrisso failed'",
  'form.aiPlaceholder.caregiver':
    "Describe your loved one's situation... e.g., 'My mother, 68, stage 3 colon cancer, finished chemo'",
  'form.aiTip': 'Tip: Include age, sex, cancer type, stage, biomarkers, and treatment history for best results',
  'form.willFilter': 'Will filter by:',
  'form.prefilled': 'Age and sex filled in from your profile',

  // Trial card
  'card.why': 'Why this matches',
  'card.details': 'View Details',
  'card.nearest': 'Nearest site',
  'card.mi': 'mi',

  // Visit prep
  'prep.button': 'Prepare for my doctor visit',
};

type Key = keyof typeof en;

const es: Partial<Record<Key, string>> = {
  'nav.search': 'Buscar ensayos',
  'nav.saved': 'Guardados',
  'nav.about': 'Nosotros',
  'nav.cancerTypes': 'Tipos de cáncer',

  'hero.badge': 'Búsqueda de ensayos clínicos con IA',
  'hero.title1': 'Encuentre ensayos clínicos',
  'hero.title2': 'hechos para usted',
  'hero.subtitle':
    'Búsqueda precisa de ensayos de cáncer — personalizada según el tipo de cáncer, la etapa, los biomarcadores, los tratamientos previos y la distancia que puede viajar.',
  'hero.cta': 'Buscar ensayos ahora',
  'hero.learn': 'Cómo funciona',
  'hero.privacy': 'Privacidad primero',
  'hero.free': 'Gratis',
  'hero.caregiver': '¿Busca para un ser querido? Cuidadores bienvenidos',
  'hero.startSearch': 'Comience su búsqueda',

  'stats.recruitingWorld': 'Ensayos de cáncer reclutando en el mundo',
  'stats.recruitingUS': 'Con centros en EE. UU.',
  'stats.new30': 'Ensayos nuevos en los últimos 30 días',
  'stats.cancerTypes': 'Tipos de cáncer para buscar',
  'stats.source': 'Cifras en vivo de ClinicalTrials.gov (Biblioteca Nacional de Medicina de EE. UU.)',
  'stats.updated': 'actualizado',

  'features.title': '¿Por qué TrialMatchRX?',
  'features.subtitle':
    'Combinamos inteligencia artificial con el registro oficial de ensayos clínicos de EE. UU. para ayudarle a encontrar los ensayos más relevantes.',
  'f1.title': 'Resúmenes en lenguaje sencillo',
  'f1.desc': 'Los criterios médicos complicados, explicados de forma clara para que sepa qué implica cada ensayo.',
  'f2.title': 'Puntajes transparentes',
  'f2.desc': 'Cada puntaje muestra qué criterios cumple el ensayo — y cuáles no.',
  'f3.title': 'Ensayos cerca de usted',
  'f3.desc': 'Busque por código postal y distancia, y vea el centro más cercano de cada ensayo.',
  'f4.title': 'Alertas inteligentes',
  'f4.desc': 'Reciba un correo cuando se publique un ensayo nuevo que coincida con su búsqueda.',

  'how.title': 'Cómo funciona',
  'how.subtitle': 'Encontrar el ensayo adecuado es sencillo en tres pasos.',
  'how.s1.title': 'Ingrese su perfil',
  'how.s1.desc': 'Tipo de cáncer, etapa, biomarcadores, tratamientos previos y su código postal.',
  'how.s2.title': 'La IA busca ensayos',
  'how.s2.desc': 'Revisamos todos los ensayos que reclutan en ClinicalTrials.gov y los ordenamos según su perfil.',
  'how.s3.title': 'Prepárese y conéctese',
  'how.s3.desc': 'Guarde ensayos, imprima una hoja para su oncólogo y contacte a los coordinadores.',
  'how.step': 'Paso',

  'trust.title': 'Datos confiables',
  'trust.source': 'Los datos provienen directamente de ClinicalTrials.gov y se actualizan continuamente.',
  'trust.doctor': 'TrialMatchRX no ofrece consejos médicos. Hable siempre con su oncólogo antes de inscribirse.',
  'trust.privacy': 'Nunca vendemos sus datos. Lea cómo los protegemos.',
  'trust.team': 'Conozca al equipo de TrialMatchRX',

  'cta.title': '¿Listo para encontrar su ensayo?',
  'cta.desc': 'Comience hoy y descubra ensayos clínicos que coinciden con su diagnóstico y tratamientos.',
  'cta.button': 'Comenzar búsqueda',

  'form.aiSearch': 'Búsqueda con IA',
  'form.clear': 'Borrar todo',
  'form.who': '¿Para quién busca?',
  'form.who.self': 'Para mí',
  'form.who.caregiver': 'Para un ser querido',
  'form.cancerType': 'Tipo de cáncer',
  'form.cancerType.their': 'Su tipo de cáncer',
  'form.allTypes': 'Todos los tipos',
  'form.stage': 'Etapa',
  'form.allStages': 'Todas las etapas',
  'form.prior': 'Tratamiento previo',
  'form.anyPrior': 'Cualquier tratamiento',
  'form.age': 'Edad',
  'form.age.their': 'Su edad',
  'form.anyAge': 'Cualquier edad',
  'form.sex': 'Sexo',
  'form.any': 'Cualquiera',
  'form.female': 'Femenino',
  'form.male': 'Masculino',
  'form.biomarkers': 'Biomarcadores',
  'form.zip': 'Código postal',
  'form.zipPlaceholder': 'ej. 71101',
  'form.distance': 'Distancia de viaje',
  'form.anyDistance': 'Cualquier distancia',
  'form.within': 'Hasta',
  'form.miles': 'millas',
  'form.advanced': 'Filtros avanzados',
  'form.phase': 'Fase del ensayo',
  'form.allBiomarkers': 'Todos los biomarcadores',
  'form.submit': 'Buscar ensayos',
  'form.searching': 'Buscando...',
  'form.aiPlaceholder':
    "Describa lo que busca... ej., 'Cáncer de pulmón etapa 4 con mutación EGFR después de Tagrisso'",
  'form.aiPlaceholder.caregiver':
    "Describa la situación de su ser querido... ej., 'Mi madre, 68 años, cáncer de colon etapa 3'",
  'form.aiTip': 'Consejo: incluya edad, sexo, tipo de cáncer, etapa, biomarcadores y tratamientos previos',
  'form.willFilter': 'Se filtrará por:',
  'form.prefilled': 'Edad y sexo tomados de su perfil',

  'card.why': 'Por qué coincide',
  'card.details': 'Ver detalles',
  'card.nearest': 'Centro más cercano',
  'card.mi': 'mi',

  'prep.button': 'Preparar mi cita médica',
};

const dictionaries: Record<Lang, Partial<Record<Key, string>>> = { en, es };

export function translate(lang: Lang, key: Key): string {
  return dictionaries[lang]?.[key] ?? en[key] ?? key;
}

/** React hook: const { t, lang, audience } = useT(); */
export function useT() {
  const storedLang = usePrefsStore((s) => s.lang);
  const storedAudience = usePrefsStore((s) => s.audience);
  // Server render is always English/self; switch to the saved choice after
  // mount so the first client render matches the server HTML (no hydration warning).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const lang: Lang = mounted ? storedLang : 'en';
  const audience: Audience = mounted ? storedAudience : 'self';
  return {
    lang,
    audience,
    t: (key: Key) => translate(lang, key),
  };
}

export type TranslationKey = Key;
