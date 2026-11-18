'use client';

// /saved/visit-prep — a printable "bring this to your oncologist" sheet.
// Lists the saved (or selected, via ?trials=NCT1,NCT2) trials with the facts a
// doctor needs, plus questions tailored to each trial and a general list.
// "Print / Save as PDF" uses the browser's print dialog, so no PDF library is needed.

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { useSavedTrials } from '@/hooks';
import { useT } from '@/lib/i18n';
import { analytics_events } from '@/lib/analytics';

interface PrepTrial {
  nctId: string;
  title: string;
  phase: string;
  status: string;
  sponsor: string;
  conditions: string[];
  interventions: string[];
  ages: string;
  sex: string;
  contact?: { name?: string; phone?: string; email?: string };
  usSites: { facility: string; city: string; state: string }[];
  randomized: boolean;
  placebo: boolean;
}

const PHASE_LABEL: Record<string, string> = {
  EARLY_PHASE1: 'Early Phase 1', PHASE1: 'Phase 1', PHASE2: 'Phase 2', PHASE3: 'Phase 3', PHASE4: 'Phase 4', NA: 'N/A',
};

function toPrep(study: any): PrepTrial {
  const p = study.protocolSection || {};
  const id = p.identificationModule || {};
  const design = p.designModule || {};
  const elig = p.eligibilityModule || {};
  const cl = p.contactsLocationsModule || {};
  const text = `${elig.eligibilityCriteria || ''} ${p.descriptionModule?.briefSummary || ''}`.toLowerCase();
  const central = cl.centralContacts?.[0];
  return {
    nctId: id.nctId,
    title: id.briefTitle,
    phase: (design.phases || []).map((x: string) => PHASE_LABEL[x] || x).join(' / ') || 'N/A',
    status: (p.statusModule?.overallStatus || '').replace(/_/g, ' ').toLowerCase(),
    sponsor: p.sponsorCollaboratorsModule?.leadSponsor?.name || '',
    conditions: p.conditionsModule?.conditions || [],
    interventions: (p.armsInterventionsModule?.interventions || []).map((i: any) => i.name).slice(0, 6),
    ages: [elig.minimumAge, elig.maximumAge].filter(Boolean).join(' – ') || 'No age limit listed',
    sex: !elig.sex || elig.sex === 'ALL' ? 'All' : elig.sex.charAt(0) + elig.sex.slice(1).toLowerCase(),
    contact: central ? { name: central.name, phone: central.phone, email: central.email } : undefined,
    usSites: (cl.locations || [])
      .filter((l: any) => l.country === 'United States')
      .slice(0, 4)
      .map((l: any) => ({ facility: l.facility, city: l.city, state: l.state })),
    randomized: design.designInfo?.allocation === 'RANDOMIZED' || text.includes('randomiz'),
    placebo: text.includes('placebo'),
  };
}

function trialQuestions(t: PrepTrial, es: boolean): string[] {
  const q: string[] = [];
  const drug = t.interventions[0];
  if (es) {
    q.push('¿Cree que cumplo los requisitos de este ensayo según mi historial?');
    if (drug) q.push(`¿Cómo se administra ${drug} y con qué frecuencia?`);
    if (t.randomized) q.push('Este ensayo es aleatorizado: ¿podría recibir el tratamiento estándar en lugar del experimental?');
    if (t.placebo) q.push('¿Se usa placebo? ¿Seguiría recibiendo tratamiento activo?');
    if (t.phase.includes('1')) q.push('Es un ensayo de fase 1: ¿qué se sabe hasta ahora sobre la seguridad y la dosis?');
    q.push('¿Cómo se compara con mis opciones de tratamiento actuales?');
  } else {
    q.push('Based on my history, do you think I meet this trial’s eligibility requirements?');
    if (drug) q.push(`How is ${drug} given, and how often?`);
    if (t.randomized) q.push('This trial is randomized — could I be assigned to standard treatment instead of the new one?');
    if (t.placebo) q.push('Does this trial use a placebo? Would I still receive active treatment?');
    if (t.phase.includes('1')) q.push('This is a Phase 1 trial — what is known so far about safety and dosing?');
    q.push('How does this compare with the treatment options I have now?');
  }
  return q;
}

const GENERAL_EN = [
  'Would joining a trial delay or replace any treatment I need right now?',
  'Which tests or records will the study team need from you (pathology, scans, biomarker results)?',
  'Who pays for study visits, scans and travel? Will my insurance be billed for anything?',
  'How often would I need to visit the site, and can any visits happen closer to home?',
  'What happens if the treatment doesn’t work or the side effects are too much — can I leave the trial?',
  'Can you contact the study coordinator for me, or should I call them myself?',
];
const GENERAL_ES = [
  '¿Participar en un ensayo retrasaría o reemplazaría algún tratamiento que necesito ahora?',
  '¿Qué pruebas o registros necesitará el equipo del estudio (patología, imágenes, biomarcadores)?',
  '¿Quién paga las visitas, las pruebas y el viaje? ¿Se le cobrará algo a mi seguro?',
  '¿Con qué frecuencia tendría que ir al centro? ¿Algunas visitas pueden ser más cerca de casa?',
  'Si el tratamiento no funciona o los efectos secundarios son muy fuertes, ¿puedo salir del ensayo?',
  '¿Puede usted contactar al coordinador del estudio o debo llamarlo yo?',
];

function VisitPrepInner() {
  const params = useSearchParams();
  const { savedTrialIds } = useSavedTrials();
  const { lang, audience } = useT();
  const es = lang === 'es';
  const ids = useMemo(() => {
    const fromUrl = (params.get('trials') || '').split(',').map((s) => s.trim()).filter((s) => /^NCT\d{8}$/.test(s));
    return fromUrl.length ? fromUrl : savedTrialIds;
  }, [params, savedTrialIds]);

  const [trials, setTrials] = useState<PrepTrial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const out: PrepTrial[] = [];
      for (const id of ids.slice(0, 10)) {
        try {
          const r = await fetch(`https://clinicaltrials.gov/api/v2/studies/${id}`);
          if (r.ok) out.push(toPrep(await r.json()));
        } catch {
          /* skip */
        }
      }
      if (!cancelled) {
        setTrials(out);
        setLoading(false);
        if (out.length) analytics_events.visitPrepOpened({ trialCount: out.length });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  const today = new Date().toLocaleDateString(es ? 'es-US' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const who = audience === 'caregiver' ? (es ? 'Paciente' : 'Patient') : es ? 'Mi nombre' : 'My name';

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <style>{`@media print { .no-print, .fixed { display: none !important; } @page { margin: 0.6in; } .trial-block { break-inside: avoid; } }`}</style>

      <div className="no-print sticky top-0 bg-white/90 backdrop-blur border-b border-gray-200 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/saved" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> {es ? 'Volver a Guardados' : 'Back to Saved'}
          </Link>
          <button onClick={() => { analytics_events.visitPrepPrinted({ trialCount: trials.length, lang }); window.print(); }} className="btn-primary text-sm" disabled={loading || trials.length === 0}>
            <Printer className="w-4 h-4" /> {es ? 'Imprimir / Guardar PDF' : 'Print / Save as PDF'}
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8 text-[15px] leading-relaxed">
        <header className="border-b-2 border-gray-900 pb-4 mb-6">
          <p className="text-xs uppercase tracking-widest text-gray-500">TrialMatchRX</p>
          <h1 className="text-2xl font-bold">
            {es ? 'Preparación para la cita: ensayos clínicos para conversar' : 'Doctor Visit Prep: Clinical Trials to Discuss'}
          </h1>
          <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <p>{who}: ______________________________</p>
            <p>{es ? 'Fecha' : 'Date'}: {today}</p>
            <p>{es ? 'Oncólogo(a)' : 'Oncologist'}: ___________________________</p>
            <p>{es ? 'Diagnóstico' : 'Diagnosis'}: ___________________________</p>
          </div>
        </header>

        {loading && (
          <p className="no-print flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> {es ? 'Cargando ensayos…' : 'Loading trials…'}
          </p>
        )}

        {!loading && trials.length === 0 && (
          <p className="text-gray-600">
            {es ? 'No hay ensayos guardados. ' : 'No saved trials yet. '}
            <Link href="/search" className="text-primary-600 underline">{es ? 'Buscar ensayos' : 'Search trials'}</Link>
          </p>
        )}

        {trials.map((t, i) => (
          <section key={t.nctId} className="trial-block mb-8 pb-6 border-b border-gray-200">
            <h2 className="text-lg font-bold">
              {i + 1}. {t.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t.nctId} · {t.phase} · {t.status} {t.sponsor && `· ${es ? 'Patrocinador' : 'Sponsor'}: ${t.sponsor}`}
            </p>
            <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="font-semibold">{es ? 'Condiciones' : 'Conditions'}</dt>
              <dd>{t.conditions.slice(0, 3).join(', ') || '—'}</dd>
              <dt className="font-semibold">{es ? 'Tratamientos' : 'Treatments'}</dt>
              <dd>{t.interventions.join(', ') || '—'}</dd>
              <dt className="font-semibold">{es ? 'Edad / sexo' : 'Ages / sex'}</dt>
              <dd>{t.ages} · {t.sex}</dd>
              <dt className="font-semibold">{es ? 'Centros (EE. UU.)' : 'U.S. sites'}</dt>
              <dd>
                {t.usSites.length
                  ? t.usSites.map((s) => `${s.facility} (${[s.city, s.state].filter(Boolean).join(', ')})`).join('; ')
                  : '—'}
              </dd>
              <dt className="font-semibold">{es ? 'Contacto' : 'Contact'}</dt>
              <dd>{t.contact ? [t.contact.name, t.contact.phone, t.contact.email].filter(Boolean).join(' · ') : '—'}</dd>
              <dt className="font-semibold">{es ? 'Más información' : 'Full listing'}</dt>
              <dd>clinicaltrials.gov/study/{t.nctId}</dd>
            </dl>
            <h3 className="mt-4 font-semibold text-sm">{es ? 'Preguntas sobre este ensayo' : 'Questions about this trial'}</h3>
            <ul className="mt-1 space-y-2 text-sm">
              {trialQuestions(t, es).map((q) => (
                <li key={q} className="flex gap-2">
                  <span>☐</span>
                  <span>
                    {q}
                    <span className="block border-b border-dotted border-gray-300 h-5" />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {!loading && trials.length > 0 && (
          <section className="trial-block">
            <h2 className="text-lg font-bold">{es ? 'Preguntas generales' : 'General questions'}</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {(es ? GENERAL_ES : GENERAL_EN).map((q) => (
                <li key={q} className="flex gap-2">
                  <span>☐</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
            <h2 className="text-lg font-bold mt-6">{es ? 'Notas' : 'Notes'}</h2>
            <div className="mt-2 space-y-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-b border-gray-300" />
              ))}
            </div>
          </section>
        )}

        <footer className="mt-10 pt-4 border-t border-gray-200 text-xs text-gray-500">
          {es
            ? 'Información de ClinicalTrials.gov. TrialMatchRX no ofrece consejos médicos; hable con su equipo de atención antes de decidir.'
            : 'Information from ClinicalTrials.gov. TrialMatchRX does not provide medical advice — discuss every option with your care team before deciding.'}{' '}
          mytrialmatchrx.com · {today}
        </footer>
      </main>
    </div>
  );
}

export default function VisitPrepPage() {
  return (
    <Suspense fallback={null}>
      <VisitPrepInner />
    </Suspense>
  );
}
