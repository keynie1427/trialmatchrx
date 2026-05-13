'use client';

// src/app/trial-matcher/sponsor/page.tsx
//
// Read-only sponsor prescreen portal.
// Accessible to users with role: 'sponsor' in trial_matcher_users.
//
// What sponsors see:
//   - Only their assigned trial (set via assignedTrialId in Firestore)
//   - Aggregate eligibility stats
//   - De-identified patient table (no PAT IDs — age, sex, cancer type, biomarkers, score)
//   - Full eligibility criteria breakdown per patient
//   - One-click PDF export of their trial's prescreen report
//   - No patient identifiers, no other trials, no admin controls

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  ExternalLink,
  Users,
  Dna,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { checkTrialMatcherAccess, type TrialMatcherUser } from '@/lib/trialMatcherAuth';
import { TRIALS, STATUS_CONFIG, type TrialMatcherPatient, type MatchStatus } from '@/lib/trialMatcherData';
import { generateTrialReport } from '@/lib/trialMatcherPdf';

// ─── Types ────────────────────────────────────────────────────────────────────

// De-identified patient — no patientId exposed to sponsors
interface SponsorPatient {
  index: number;            // Sequential number for display (Patient #1, #2...)
  age: number;
  sex: string;
  cancerType: string;
  biomarkers: TrialMatcherPatient['biomarkers'];
  labs: TrialMatcherPatient['labs'];
  priorTreatments: string[];
  lastVisit: string;
  trialMatch: { score: number; status: MatchStatus; criteria: TrialMatcherPatient['trialMatches'][string]['criteria'] };
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MatchStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bgClass} ${cfg.textClass}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dotColor }} />
      {cfg.shortLabel}
    </span>
  );
}

function ScoreRing({ score, status, size = 40 }: { score: number; status: MatchStatus; size?: number }) {
  const cfg = STATUS_CONFIG[status];
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={cfg.barColor} strokeWidth={4}
        strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: 10, fontWeight: 800, fill: cfg.barColor }}>
        {Math.round(score)}
      </text>
    </svg>
  );
}

function CriteriaList({ criteria }: { criteria: SponsorPatient['trialMatch']['criteria'] }) {
  return (
    <div className="space-y-1.5 mt-3">
      {criteria.map((c, i) => {
        const bg = c.pass === true
          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30'
          : c.pass === false
          ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30'
          : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30';
        return (
          <div key={i} className={`flex gap-3 p-2.5 rounded-lg border ${bg}`}>
            <div className="mt-0.5 flex-shrink-0">
              {c.pass === true  && <CheckCircle2  className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              {c.pass === false && <XCircle        className="w-4 h-4 text-red-600 dark:text-red-400" />}
              {c.pass === null  && <AlertTriangle  className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{c.criterion}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{c.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SponsorPortalPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const [accessChecking, setAccessChecking] = useState(true);
  const [sponsorUser, setSponsorUser]         = useState<TrialMatcherUser | null>(null);

  const [patients, setPatients]         = useState<TrialMatcherPatient[]>([]);
  const [dataLoading, setDataLoading]   = useState(false);
  const [selectedIdx, setSelectedIdx]   = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<MatchStatus | 'all'>('LIKELY_ELIGIBLE');
  const [search, setSearch]             = useState('');

  // ── Auth check ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;
    if (!user?.email) { router.replace('/login?next=/trial-matcher/sponsor'); return; }

    checkTrialMatcherAccess(user.email).then(result => {
      setAccessChecking(false);
      if (!result.granted) { router.replace('/trial-matcher/access-denied'); return; }
      if (result.user.role === 'crc' || result.user.role === 'physician' || result.user.role === 'admin') {
        // CRC/physician/admin → send to main matcher
        router.replace('/trial-matcher'); return;
      }
      if (result.user.role !== 'sponsor') { router.replace('/trial-matcher/access-denied'); return; }
      if (!result.user.assignedTrialId) { router.replace('/trial-matcher/access-denied'); return; }
      setSponsorUser(result.user);
    });
  }, [user, authLoading, router]);

  // ── Load patients ──────────────────────────────────────────────────────────

  const fetchPatients = useCallback(async () => {
    setDataLoading(true);
    try {
      const res = await fetch('/api/trial-matcher/patients');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPatients(data.patients || []);
    } catch {
      setPatients([]);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sponsorUser) fetchPatients();
  }, [sponsorUser, fetchPatients]);

  // ── De-identified patient list for this sponsor's trial ───────────────────

  const trialId = sponsorUser?.assignedTrialId || '';
  const trial   = TRIALS[trialId];

  const sponsorPatients = useMemo((): SponsorPatient[] => {
    if (!trialId) return [];
    return patients
      .filter(p => p.trialMatches[trialId]?.status !== 'EXCLUDED')
      .sort((a, b) => {
        const order: Record<MatchStatus, number> = { LIKELY_ELIGIBLE: 3, REVIEW_REQUIRED: 2, EXCLUDED: 1 };
        const oa = order[a.trialMatches[trialId]?.status ?? 'EXCLUDED'];
        const ob = order[b.trialMatches[trialId]?.status ?? 'EXCLUDED'];
        if (ob !== oa) return ob - oa;
        return (b.trialMatches[trialId]?.score ?? 0) - (a.trialMatches[trialId]?.score ?? 0);
      })
      .map((p, i) => ({
        index: i + 1,
        age: p.age,
        sex: p.sex,
        cancerType: p.cancerType,
        biomarkers: p.biomarkers,
        labs: p.labs,
        priorTreatments: p.priorTreatments,
        lastVisit: p.lastVisit,
        trialMatch: p.trialMatches[trialId],
      }));
  }, [patients, trialId]);

  const filtered = useMemo(() => {
    return sponsorPatients.filter(p => {
      if (statusFilter !== 'all' && p.trialMatch.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.cancerType.toLowerCase().includes(q) ||
               p.priorTreatments.some(t => t.toLowerCase().includes(q)) ||
               Object.entries(p.biomarkers).some(([k, v]) => v === 'Positive' && k.includes(q));
      }
      return true;
    });
  }, [sponsorPatients, statusFilter, search]);

  const stats = useMemo(() => ({
    eligible: sponsorPatients.filter(p => p.trialMatch.status === 'LIKELY_ELIGIBLE').length,
    review:   sponsorPatients.filter(p => p.trialMatch.status === 'REVIEW_REQUIRED').length,
    total:    patients.length,
  }), [sponsorPatients, patients]);

  const selectedPatient = selectedIdx !== null ? filtered[selectedIdx] : null;

  // ── Loading / auth guards ──────────────────────────────────────────────────

  if (authLoading || accessChecking || !sponsorUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950">

      {/* Header */}
      <header className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-6 py-3.5 flex-shrink-0">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-surface-900 dark:text-surface-100">TrialMatchRX</div>
              <div className="text-xs text-surface-400">Sponsor Prescreen Portal</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sponsor badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-xs font-semibold text-orange-700 dark:text-orange-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sponsor · {trial?.shortName || trialId}
            </div>

            {/* PDF export */}
            <button
              onClick={() => generateTrialReport(trial, patients.filter(p =>
                p.trialMatches[trialId]?.status !== 'EXCLUDED'
              ))}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>

            <span className="text-xs text-surface-400 hidden sm:block">
              {sponsorUser.name ?? sponsorUser.email}
            </span>

            <button
              onClick={() => { signOut(); router.push('/'); }}
              className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden max-w-screen-xl mx-auto w-full px-6 py-5 gap-5">

        {/* Trial info card */}
        {trial && (
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 p-5">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span className="text-lg font-bold px-3 py-1 rounded-full text-sm"
                    style={{ background: trial.colorLight, color: trial.color }}>
                    {trial.name}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 font-medium">{trial.phase}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 font-semibold">{trial.status}</span>
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-400 mb-1">{trial.indication}</p>
                <p className="text-xs text-surface-400"><strong>Drug:</strong> {trial.drug} &nbsp;·&nbsp; <strong>Route:</strong> {trial.route} &nbsp;·&nbsp; <strong>Sponsor:</strong> {trial.sponsor}</p>
              </div>
              <a href={`https://clinicaltrials.gov/study/${trialId}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline flex-shrink-0">
                <ExternalLink className="w-3.5 h-3.5" /> ClinicalTrials.gov
              </a>
            </div>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Screened',        value: stats.total.toLocaleString(), color: 'text-surface-900 dark:text-surface-100', sub: 'total patients' },
            { label: 'Likely eligible', value: stats.eligible,               color: 'text-emerald-700 dark:text-emerald-400', sub: 'ready for contact' },
            { label: 'Review required', value: stats.review,                 color: 'text-amber-700 dark:text-amber-400',    sub: 'data gaps present' },
          ].map(m => (
            <div key={m.label} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 p-4">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">{m.label}</p>
              <p className={`text-3xl font-black ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-surface-400 mt-1">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Patient table + detail */}
        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">

          {/* Patient list */}
          <div className="flex flex-col w-96 flex-shrink-0 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            {/* Controls */}
            <div className="p-3 border-b border-surface-100 dark:border-surface-800 flex gap-2 flex-wrap">
              <input
                className="flex-1 min-w-0 px-3 py-1.5 text-xs rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none focus:border-primary-400"
                placeholder="Filter by cancer, biomarker…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="text-xs px-2.5 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none cursor-pointer"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as MatchStatus | 'all')}
              >
                <option value="all">All</option>
                <option value="LIKELY_ELIGIBLE">Eligible</option>
                <option value="REVIEW_REQUIRED">Review</option>
              </select>
            </div>
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider px-4 py-2">
              {filtered.length} patients
            </div>
            <div className="flex-1 overflow-y-auto">
              {dataLoading ? (
                <div className="flex items-center justify-center py-16 text-surface-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-surface-400">
                  <Users className="w-7 h-7 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No patients match filters</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {filtered.map((p, i) => (
                    <motion.div
                      key={i}
                      layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setSelectedIdx(i)}
                      className={`px-4 py-3 border-b border-surface-50 dark:border-surface-800 cursor-pointer transition-all border-l-[3px] ${
                        selectedIdx === i
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-primary-500'
                          : 'hover:bg-surface-50 dark:hover:bg-surface-800/50 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-surface-900 dark:text-surface-100">
                            Patient #{p.index}
                          </p>
                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                            {p.cancerType} · {p.age}y {p.sex[0]}
                          </p>
                          <p className="text-xs text-surface-400 mt-0.5 truncate">
                            {p.priorTreatments.slice(0, 2).join(', ') || 'No prior therapy'}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <StatusBadge status={p.trialMatch.status} />
                          <p className="text-xs font-bold mt-1" style={{ color: STATUS_CONFIG[p.trialMatch.status].barColor }}>
                            {p.trialMatch.score}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 h-1 rounded-full bg-surface-100 dark:bg-surface-700 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${p.trialMatch.score}%`, background: STATUS_CONFIG[p.trialMatch.status].barColor }} />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className="flex-1 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-y-auto">
            {!selectedPatient ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-12 text-surface-400">
                <Dna className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-base font-semibold text-surface-500 dark:text-surface-400">Select a patient to view eligibility criteria</p>
                <p className="text-sm mt-1">Patient identifiers are not shown in the sponsor portal</p>
              </div>
            ) : (
              <div className="p-5">
                {/* De-identified header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg flex-shrink-0 font-bold text-white"
                    style={{ background: trial?.color }}>
                    #{selectedPatient.index}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100">
                      Patient #{selectedPatient.index}
                    </h2>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                      {selectedPatient.cancerType} · {selectedPatient.age}y {selectedPatient.sex} · Last visit: {selectedPatient.lastVisit}
                    </p>
                    {/* Biomarker tags */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(selectedPatient.biomarkers)
                        .filter(([, v]) => v === 'Positive')
                        .map(([k]) => (
                          <span key={k} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                            {k.toUpperCase()}+
                          </span>
                        ))
                      }
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-3">
                    <ScoreRing score={selectedPatient.trialMatch.score} status={selectedPatient.trialMatch.status} size={48} />
                    <StatusBadge status={selectedPatient.trialMatch.status} />
                  </div>
                </div>

                {/* Prior treatments */}
                <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Prior treatments</h3>
                <div className="flex flex-wrap gap-2 mb-5">
                  {selectedPatient.priorTreatments.length > 0
                    ? selectedPatient.priorTreatments.map(t => (
                        <span key={t} className="text-xs px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-700">
                          {t}
                        </span>
                      ))
                    : <span className="text-xs text-surface-400">None documented</span>
                  }
                </div>

                {/* Eligibility criteria */}
                <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-1">
                  Eligibility criteria — {trial?.name}
                </h3>
                <CriteriaList criteria={selectedPatient.trialMatch.criteria} />

                {/* Action box */}
                <div className="mt-5">
                  {selectedPatient.trialMatch.status === 'LIKELY_ELIGIBLE' && (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Meets prescreen criteria
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1.5 leading-relaxed">
                        This patient meets EMR-verifiable criteria for {trial?.name}. Contact the site coordinator to initiate formal screening and consent.
                      </p>
                    </div>
                  )}
                  {selectedPatient.trialMatch.status === 'REVIEW_REQUIRED' && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Manual review required
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5 leading-relaxed">
                        One or more criteria require manual verification. Contact the site coordinator before proceeding.
                      </p>
                    </div>
                  )}
                </div>

                {/* Disclaimer */}
                <p className="text-[10px] text-surface-400 mt-5 leading-relaxed border-t border-surface-100 dark:border-surface-800 pt-4">
                  Patient identifiers have been removed from this view. All patients require formal eligibility 
                  confirmation per protocol before consent. This prescreen data is for investigational purposes only 
                  and is not a guarantee of eligibility.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
