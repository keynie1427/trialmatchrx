'use client';

// src/app/trial-matcher/page.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CheckCircle2, XCircle, AlertTriangle, Dna, FlaskConical,
  Stethoscope, ClipboardList, LayoutGrid, List, ExternalLink,
  Users, LogOut, Loader2, Download, Bell, ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { checkTrialMatcherAccess, type TrialMatcherRole, type TrialMatcherUser } from '@/lib/trialMatcherAuth';
import { generateTrialReport, generatePatientReport } from '@/lib/trialMatcherPdf';
import {
  PATIENTS as STATIC_PATIENTS, TRIALS, STATUS_CONFIG,
  type TrialMatcherPatient, type MatchStatus, type TrialDefinition,
} from '@/lib/trialMatcherData';

const CANCER_EMOJI: Record<string, string> = {
  'Lung Cancer': '🫁', 'Colorectal Cancer': '🔬', 'Breast Cancer': '🩷',
  'Pancreatic Cancer': '🔶', 'Prostate Cancer': '🔵', 'Melanoma': '🟤', 'Ovarian Cancer': '🟣',
};

const BIOMARKER_COLORS: Record<string, { bg: string; text: string }> = {
  kras: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300' },
  egfr: { bg: 'bg-blue-100 dark:bg-blue-900/30',      text: 'text-blue-800 dark:text-blue-300' },
  braf: { bg: 'bg-amber-100 dark:bg-amber-900/30',    text: 'text-amber-800 dark:text-amber-300' },
  her2: { bg: 'bg-pink-100 dark:bg-pink-900/30',      text: 'text-pink-800 dark:text-pink-300' },
  msi:  { bg: 'bg-purple-100 dark:bg-purple-900/30',  text: 'text-purple-800 dark:text-purple-300' },
};

type AllTrials = Record<string, TrialDefinition>;

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-surface-400">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      <p className="text-sm">Verifying access…</p>
    </div>
  );
}

function StatusBadge({ status }: { status: MatchStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bgClass} ${cfg.textClass}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dotColor }} />
      {cfg.shortLabel}
    </span>
  );
}

function ScoreRing({ score, status, size = 44 }: { score: number; status: MatchStatus; size?: number }) {
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

function BiomarkerTags({ biomarkers }: { biomarkers: TrialMatcherPatient['biomarkers'] }) {
  const positive = Object.entries(biomarkers).filter(([, v]) => v === 'Positive');
  if (!positive.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {positive.map(([key]) => {
        const colors = BIOMARKER_COLORS[key] || { bg: 'bg-surface-100', text: 'text-surface-700' };
        return (
          <span key={key} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
            {key.toUpperCase()}+
          </span>
        );
      })}
    </div>
  );
}

function CriteriaList({ criteria }: { criteria: TrialMatcherPatient['trialMatches'][string]['criteria'] }) {
  return (
    <div className="space-y-1.5">
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

function LabCard({ name, value, unit, flagged }: { name: string; value: number | null; unit: string; flagged: boolean }) {
  if (value === null || value === undefined) return (
    <div className="rounded-lg p-2.5 border bg-surface-50 dark:bg-surface-800/50 border-surface-200 dark:border-surface-700">
      <p className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">{name}</p>
      <p className="text-sm font-bold mt-0.5 text-surface-400">N/A</p>
    </div>
  );
  return (
    <div className={`rounded-lg p-2.5 border ${flagged
      ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40'
      : 'bg-surface-50 dark:bg-surface-800/50 border-surface-200 dark:border-surface-700'}`}>
      <p className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{name}</p>
      <p className={`text-sm font-bold mt-0.5 ${flagged ? 'text-red-700 dark:text-red-400' : 'text-surface-900 dark:text-surface-100'}`}>
        {value} <span className="text-xs font-normal text-surface-400">{unit}</span>
      </p>
    </div>
  );
}

function TrialSidebarBtn({ trial, active, eligibleCount, reviewCount, onClick }: {
  trial: TrialDefinition; active: boolean; eligibleCount: number; reviewCount: number; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border-[1.5px] transition-all duration-150 ${
        active ? 'border-current' : 'border-transparent hover:bg-surface-50 dark:hover:bg-surface-800/50'
      }`}
      style={active ? { borderColor: trial.color, background: `${trial.color}10` } : {}}>
      <span className="block text-sm font-bold" style={{ color: active ? trial.color : undefined }}>
        {trial.name}
      </span>
      <span className="block text-xs text-surface-500 dark:text-surface-400 mt-0.5">
        {trial.phase} · {trial.biomarker}
      </span>
      <div className="flex gap-1.5 mt-2 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG.LIKELY_ELIGIBLE.bgClass} ${STATUS_CONFIG.LIKELY_ELIGIBLE.textClass}`}>
          {eligibleCount} eligible
        </span>
        {reviewCount > 0 && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG.REVIEW_REQUIRED.bgClass} ${STATUS_CONFIG.REVIEW_REQUIRED.textClass}`}>
            {reviewCount} review
          </span>
        )}
      </div>
    </button>
  );
}

function PatientRow({ patient, activeTrial, selected, onClick }: {
  patient: TrialMatcherPatient; activeTrial: string; selected: boolean; onClick: () => void;
}) {
  const td = patient.trialMatches[activeTrial];
  if (!td) return null;
  const cfg = STATUS_CONFIG[td.status];
  return (
    <motion.div layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`px-4 py-3 border-b border-surface-100 dark:border-surface-800 cursor-pointer transition-all duration-100 border-l-[3px] ${
        selected
          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-primary-500'
          : 'hover:bg-surface-50 dark:hover:bg-surface-800/50 border-l-transparent'
      }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-surface-900 dark:text-surface-100 truncate">
            {patient.patientId}
            <span className="font-normal text-surface-400 ml-1.5">
              {CANCER_EMOJI[patient.cancerType] || '🔬'} {patient.cancerType}
            </span>
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 truncate">
            {patient.age}y {patient.sex} ·{' '}
            {patient.priorTreatments.length
              ? patient.priorTreatments.slice(0, 2).join(', ')
              : 'No prior therapy'}
            {patient.priorTreatments.length > 2 ? ` +${patient.priorTreatments.length - 2}` : ''}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <StatusBadge status={td.status} />
          <p className="text-xs font-bold mt-1" style={{ color: cfg.barColor }}>{td.score}%</p>
        </div>
      </div>
      <div className="mt-2 h-1 rounded-full bg-surface-100 dark:bg-surface-700 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${td.score}%`, background: cfg.barColor }} />
      </div>
    </motion.div>
  );
}

// DetailPanel receives allTrials as a prop to avoid closure issues
function DetailPanel({ patient, detailTrialId, onTrialSelect, viewMode, allTrials, onPatientReport }: {
  patient: TrialMatcherPatient | null;
  detailTrialId: string;
  onTrialSelect: (id: string) => void;
  viewMode: string;
  allTrials: AllTrials;
  onPatientReport: (p: TrialMatcherPatient) => void;
}) {
  if (!patient) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-surface-400">
        <Dna className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-base font-semibold text-surface-500 dark:text-surface-400">Select a patient to view eligibility</p>
        <p className="text-sm mt-1">Criteria evaluated automatically from EMR data</p>
      </div>
    );
  }

  const ptTrialData = patient.trialMatches[detailTrialId];
  const detailTrial = allTrials[detailTrialId];
  if (!ptTrialData) return null;

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: allTrials[detailTrialId]?.colorLight || '#f3f4f6' }}>
          {CANCER_EMOJI[patient.cancerType] || '🔬'}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100">{patient.patientId}</h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
            {patient.cancerType} · {patient.age}y {patient.sex} · Last visit: {patient.lastVisit}
          </p>
          <BiomarkerTags biomarkers={patient.biomarkers} />
        </div>
      </div>

      <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3">Trial match overview</h3>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Object.values(allTrials).map((t) => {
          const td = patient.trialMatches[t.nctId];
          if (!td) return null;
          const isActive = detailTrialId === t.nctId;
          return (
            <button key={t.nctId} onClick={() => onTrialSelect(t.nctId)}
              className={`p-3 rounded-xl border-[1.5px] text-left transition-all duration-150 ${
                isActive ? 'border-current' : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
              }`}
              style={isActive ? { borderColor: t.color, background: `${t.color}0e` } : {}}>
              <p className="text-[11px] font-bold mb-2" style={{ color: t.color }}>{t.shortName}</p>
              <div className="flex items-center gap-2">
                <ScoreRing score={td.score} status={td.status} size={36} />
                <StatusBadge status={td.status} />
              </div>
              <p className="text-[10px] text-surface-400 mt-2">{t.phase} · {t.biomarker}</p>
            </button>
          );
        })}
      </div>

      <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3">
        Eligibility criteria — {detailTrial?.name}
      </h3>
      <CriteriaList criteria={ptTrialData.criteria} />

      {viewMode === 'crc' && (
        <>
          <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3 mt-5">Lab values</h3>
          <div className="grid grid-cols-3 gap-2">
            <LabCard name="AST"        value={patient.labs.ast}        unit="U/L"    flagged={(patient.labs.ast ?? 0) > 100} />
            <LabCard name="ALT"        value={patient.labs.alt}        unit="U/L"    flagged={(patient.labs.alt ?? 0) > 100} />
            <LabCard name="Creatinine" value={patient.labs.creatinine} unit="mg/dL"  flagged={(patient.labs.creatinine ?? 0) > 1.5} />
            <LabCard name="Hemoglobin" value={patient.labs.hemoglobin} unit="g/dL"   flagged={(patient.labs.hemoglobin ?? 99) < 8} />
            <LabCard name="Platelets"  value={patient.labs.platelets}  unit="10⁹/L"  flagged={(patient.labs.platelets ?? 999) < 75} />
            <LabCard name="WBC"        value={patient.labs.wbc}        unit="10⁹/L"  flagged={(patient.labs.wbc ?? 999) < 1.5} />
          </div>
        </>
      )}

      <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3 mt-5">Prior treatments</h3>
      <div className="flex flex-wrap gap-2">
        {patient.priorTreatments.length > 0
          ? patient.priorTreatments.map((t) => (
              <span key={t} className="text-xs px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-700">{t}</span>
            ))
          : <span className="text-xs text-surface-400">None documented</span>
        }
      </div>

      <div className="mt-5">
        {ptTrialData.status === 'LIKELY_ELIGIBLE' && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {viewMode === 'crc' ? 'Recommend for pre-screening contact' : 'Likely eligible — consider referral'}
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1.5 leading-relaxed">
              {viewMode === 'crc'
                ? `Patient meets EMR-verifiable criteria for ${detailTrial?.name}. CRC action: confirm ECOG in next clinic note and verify no prior targeted inhibitor exposure before consent discussion.`
                : `Strong biomarker and clinical profile match for ${detailTrial?.name}. Review ⚠ flagged items with the patient before consent.`
              }
            </p>
          </div>
        )}
        {ptTrialData.status === 'REVIEW_REQUIRED' && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Manual review required
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5 leading-relaxed">
              One or more criteria could not be resolved from available EMR data. Review ⚠ flagged items above before pre-screening contact.
            </p>
          </div>
        )}
        {ptTrialData.status === 'EXCLUDED' && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
            <p className="text-sm font-bold text-red-800 dark:text-red-300 flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Excluded from {detailTrial?.shortName}
            </p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1.5 leading-relaxed">
              Patient does not meet one or more hard inclusion criteria. Check other trials for a potential match.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
        <a href={`https://clinicaltrials.gov/study/${detailTrialId}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline">
          <ExternalLink className="w-3 h-3" /> View {detailTrialId} on ClinicalTrials.gov
        </a>
        <button onClick={() => onPatientReport(patient)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 transition-colors">
          <Download className="w-3 h-3" /> Patient report
        </button>
      </div>
    </div>
  );
}

function CompareTable({ patients, onSelect, allTrials }: {
  patients: TrialMatcherPatient[];
  onSelect: (p: TrialMatcherPatient) => void;
  allTrials: AllTrials;
}) {
  const trialIds = Object.keys(allTrials);
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="sticky top-0 bg-white dark:bg-surface-900 z-10">
            <th className="text-left p-3 font-semibold text-surface-600 dark:text-surface-400 border-b border-surface-200 dark:border-surface-700">Patient</th>
            <th className="text-left p-3 font-semibold text-surface-600 dark:text-surface-400 border-b border-surface-200 dark:border-surface-700">Cancer type</th>
            <th className="text-left p-3 font-semibold text-surface-600 dark:text-surface-400 border-b border-surface-200 dark:border-surface-700">Age / Sex</th>
            {trialIds.map((id) => (
              <th key={id} className="text-left p-3 font-semibold border-b border-surface-200 dark:border-surface-700"
                style={{ color: allTrials[id]?.color }}>
                {allTrials[id]?.shortName}
              </th>
            ))}
            <th className="text-left p-3 font-semibold text-surface-600 dark:text-surface-400 border-b border-surface-200 dark:border-surface-700">Best match</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.patientId} onClick={() => onSelect(p)}
              className="cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors border-b border-surface-100 dark:border-surface-800">
              <td className="p-3 font-bold text-surface-900 dark:text-surface-100">{p.patientId}</td>
              <td className="p-3 text-surface-600 dark:text-surface-400">{CANCER_EMOJI[p.cancerType] || '🔬'} {p.cancerType}</td>
              <td className="p-3 text-surface-600 dark:text-surface-400">{p.age}y {p.sex[0]}</td>
              {trialIds.map((id) => {
                const td = p.trialMatches[id];
                if (!td) return <td key={id} className="p-3"><span className="text-xs text-surface-400">—</span></td>;
                return (
                  <td key={id} className="p-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={td.status} />
                      <span className="text-xs text-surface-400">{td.score}%</span>
                    </div>
                  </td>
                );
              })}
              <td className="p-3">
                <span className="text-xs font-bold" style={{ color: allTrials[p.bestMatch.trialId]?.color }}>
                  {allTrials[p.bestMatch.trialId]?.shortName}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TrialMatcherPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const [accessChecking, setAccessChecking] = useState(false);
  const [accessUser, setAccessUser]         = useState<TrialMatcherUser | null>(null);

  const [patients, setPatients]   = useState<TrialMatcherPatient[]>(STATIC_PATIENTS);
  const [dataSource, setDataSource] = useState<'static' | 'fhir' | 'loading'>('static');
  const [dataError, setDataError] = useState<string | null>(null);
  const [allTrials, setAllTrials] = useState<AllTrials>(TRIALS as AllTrials);

  const [notifCount, setNotifCount]     = useState(0);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [activeTrial, setActiveTrial]     = useState('NCT06983743');
  const [selectedPt, setSelectedPt]       = useState<TrialMatcherPatient | null>(null);
  const [detailTrialId, setDetailTrialId] = useState('NCT06983743');
  const [statusFilter, setStatusFilter]   = useState<MatchStatus | 'all'>('LIKELY_ELIGIBLE');
  const [cancerFilter, setCancerFilter]   = useState('all');
  const [search, setSearch]               = useState('');
  const [viewMode, setViewMode]           = useState<'list' | 'compare'>('list');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login?next=/trial-matcher'); return; }
    const email = user.email;
    if (!email) { router.replace('/trial-matcher/access-denied'); return; }
    setAccessChecking(true);
    checkTrialMatcherAccess(email).then((result) => {
      setAccessChecking(false);
      if (result.granted) {
        if (result.user.role === 'sponsor') { router.replace('/trial-matcher/sponsor'); return; }
        setAccessUser(result.user);
      } else {
        router.replace('/trial-matcher/access-denied');
      }
    });
  }, [user, authLoading, router]);

  const fetchPatients = useCallback(async () => {
    setDataSource('loading');
    setDataError(null);
    try {
      const res = await fetch('/api/trial-matcher/patients');
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (data.patients && data.patients.length > 0) {
        setPatients(data.patients);
        setDataSource('fhir');
        const merged: AllTrials = { ...(TRIALS as AllTrials) };
        (data.firestoreTrials || []).forEach((t: any) => { merged[t.nctId] = t; });
        setAllTrials(merged);
      } else {
        setPatients(STATIC_PATIENTS);
        setDataSource('static');
        if (data.message) setDataError(data.message);
      }
    } catch (err) {
      console.warn('[TrialMatcher] API fetch failed, using static data:', err);
      setPatients(STATIC_PATIENTS);
      setDataSource('static');
    }
  }, []);

  useEffect(() => { if (accessUser) fetchPatients(); }, [accessUser, fetchPatients]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible' && accessUser) fetchPatients();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [accessUser, fetchPatients]);

  const fetchNotifications = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken(true);
      const res = await fetch('/api/trial-matcher/rescreen', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      const unread = (data.notifications || []).filter((n: any) => !n.read);
      setNotifications(data.notifications || []);
      setNotifCount(unread.length);
    } catch (err) { console.warn('[Notifications] fetch failed:', err); }
  }, []);

  useEffect(() => { if (accessUser) fetchNotifications(); }, [accessUser, fetchNotifications]);

  const cancerTypes = useMemo(() => [...new Set(patients.map((p) => p.cancerType))].sort(), [patients]);

  const trialStats = useMemo(() =>
    Object.fromEntries(
      Object.keys(allTrials).map((id) => [id, {
        eligible: patients.filter((p) => p.trialMatches[id]?.status === 'LIKELY_ELIGIBLE').length,
        review:   patients.filter((p) => p.trialMatches[id]?.status === 'REVIEW_REQUIRED').length,
      }])
    ), [patients, allTrials]);

  const activeStats = trialStats[activeTrial] || { eligible: 0, review: 0 };

  const filtered = useMemo(() =>
    patients.filter((p) => {
      const ts = p.trialMatches[activeTrial]?.status ?? 'EXCLUDED';
      if (statusFilter !== 'all' && ts !== statusFilter) return false;
      if (cancerFilter !== 'all' && p.cancerType !== cancerFilter) return false;
      if (search && !p.patientId.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      const order: Record<MatchStatus, number> = { LIKELY_ELIGIBLE: 3, REVIEW_REQUIRED: 2, EXCLUDED: 1 };
      const oa = order[a.trialMatches[activeTrial]?.status ?? 'EXCLUDED'];
      const ob = order[b.trialMatches[activeTrial]?.status ?? 'EXCLUDED'];
      if (ob !== oa) return ob - oa;
      return (b.trialMatches[activeTrial]?.score ?? 0) - (a.trialMatches[activeTrial]?.score ?? 0);
    }), [patients, activeTrial, statusFilter, cancerFilter, search]);

  function handleTrialSwitch(id: string) {
    setActiveTrial(id); setDetailTrialId(id); setSelectedPt(null); setStatusFilter('LIKELY_ELIGIBLE');
  }

  function handlePatientSelect(p: TrialMatcherPatient) {
    setSelectedPt(p); setDetailTrialId(activeTrial); setViewMode('list');
  }

  if (authLoading || accessChecking || !accessUser) return <AuthLoadingScreen />;

  const userRole = accessUser.role;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

        {/* Page header */}
        <div className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-6 py-3.5 flex-shrink-0">
          <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary-600" /> Trial Matcher
              </h1>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                EMR-driven · {dataSource === 'loading' ? 'Loading patients…' : `${patients.length} patients`} · {dataSource === 'fhir' ? 'Synthea FHIR R4' : 'Synthetic POC data'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-xs font-semibold text-surface-600 dark:text-surface-300">
                {userRole === 'crc' ? <><ClipboardList className="w-3.5 h-3.5" /> CRC</>
                  : userRole === 'admin' ? <><ShieldCheck className="w-3.5 h-3.5 text-purple-500" /> Admin</>
                  : <><Stethoscope className="w-3.5 h-3.5" /> Physician</>}
              </div>
              {userRole === 'admin' && (
                <Link href="/trial-matcher/admin"
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors">
                  <ShieldCheck className="w-3.5 h-3.5" /> Manage users
                </Link>
              )}
              <button
                onClick={() => generateTrialReport(allTrials[activeTrial], patients)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
              <div className="relative">
                <button onClick={() => setNotifOpen(v => !v)}
                  className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
                  <Bell className="w-4 h-4" />
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-10 w-80 bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
                      <span className="text-sm font-bold text-surface-900 dark:text-surface-100">Re-screening alerts</span>
                      <button onClick={() => setNotifOpen(false)} className="text-surface-400 hover:text-surface-600 text-xs">✕</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0
                        ? <div className="px-4 py-8 text-center text-sm text-surface-400">No alerts yet</div>
                        : notifications.slice(0, 15).map((n: any) => (
                          <div key={n.id} className={`px-4 py-3 border-b border-surface-50 dark:border-surface-800 ${!n.read ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''}`}>
                            <p className="text-xs font-semibold text-surface-900 dark:text-surface-100">{n.patientId} → {n.trialName}</p>
                            <p className="text-xs text-surface-500 mt-0.5">
                              <span className="line-through text-surface-400">{n.previousStatus?.replace(/_/g,' ')}</span>
                              {' → '}<span className="text-emerald-600 font-semibold">{n.newStatus?.replace(/_/g,' ')}</span>
                              {' · '}{n.newScore}%
                            </p>
                            <p className="text-[10px] text-surface-400 mt-0.5">{n.cancerType} · {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}</p>
                          </div>
                        ))
                      }
                    </div>
                    <div className="px-4 py-2.5 border-t border-surface-100 dark:border-surface-800">
                      <button
                        onClick={async () => {
                          try {
                            const currentUser = auth.currentUser;
                            if (!currentUser) return;
                            const token = await currentUser.getIdToken(true);
                            const res = await fetch('/api/trial-matcher/rescreen', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ dryRun: false }),
                            });
                            const data = await res.json();
                            console.log('[Rescreen] Response:', data);
                            fetchNotifications();
                            setNotifOpen(false);
                          } catch (err) { console.error('[Rescreen] Error:', err); }
                        }}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold">
                        ↻ Run re-screening now
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-xs text-surface-400 hidden sm:block">{accessUser.name ?? accessUser.email}</span>
              <button onClick={() => { signOut(); router.push('/'); }}
                className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          </div>
        </div>

        {/* App body */}
        <div className="flex flex-1 overflow-hidden max-w-screen-2xl mx-auto w-full">
          <aside className="w-56 flex-shrink-0 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700 flex flex-col">
            <div className="p-3 border-b border-surface-100 dark:border-surface-800">
              <p className="text-[9px] font-bold text-surface-400 uppercase tracking-wider mb-2">Active Trials</p>
              <div className="space-y-1">
                {Object.values(allTrials).map((t) => (
                  <TrialSidebarBtn key={t.nctId} trial={t} active={activeTrial === t.nctId}
                    eligibleCount={trialStats[t.nctId]?.eligible ?? 0}
                    reviewCount={trialStats[t.nctId]?.review ?? 0}
                    onClick={() => handleTrialSwitch(t.nctId)} />
                ))}
              </div>
            </div>
            <div className="p-3 mt-auto border-t border-surface-100 dark:border-surface-800">
              <p className="text-[9px] font-bold text-surface-400 uppercase tracking-wider mb-1">Data source</p>
              <p className="text-[10px] text-surface-500 dark:text-surface-400 leading-relaxed">
                {dataSource === 'fhir'
                  ? <><span className="text-emerald-600 font-semibold">● Synthea FHIR R4</span><br />{patients.length} patients loaded</>
                  : dataSource === 'loading'
                  ? <><span className="text-amber-600 font-semibold">● Loading…</span></>
                  : <><span className="text-surface-400 font-semibold">● POC synthetic data</span><br />{patients.length} patients</>
                }
                {dataError && <span className="text-amber-500 block mt-1">{dataError}</span>}
              </p>
              <button onClick={fetchPatients} disabled={dataSource === 'loading'}
                className="mt-2 text-[10px] text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-40">
                {dataSource === 'loading' ? 'Loading…' : '↻ Refresh data'}
              </button>
            </div>
          </aside>

          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-5 py-2.5 flex items-center gap-3 flex-wrap flex-shrink-0">
              {(() => {
                const t = allTrials[activeTrial];
                if (!t) return null;
                return (
                  <>
                    <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: t.colorLight, color: t.color }}>{t.name}</span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 font-medium">{t.phase}</span>
                    <span className="text-xs text-surface-500 dark:text-surface-400">{t.indication}</span>
                    <span className="ml-auto text-xs text-surface-400">{t.sponsor}</span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">{t.status}</span>
                  </>
                );
              })()}
            </div>

            <div className="grid grid-cols-4 gap-3 px-5 py-3 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex-shrink-0">
              {[
                { label: 'Screened',        value: patients.length.toLocaleString(),                    color: 'text-surface-900 dark:text-surface-100', sub: 'total patients' },
                { label: 'Likely eligible', value: activeStats.eligible,                                 color: 'text-emerald-700 dark:text-emerald-400',  sub: 'ready for contact' },
                { label: 'Review required', value: activeStats.review,                                   color: 'text-amber-700 dark:text-amber-400',      sub: 'data gaps present' },
                { label: 'Auto-excluded',   value: patients.length - activeStats.eligible - activeStats.review, color: 'text-red-700 dark:text-red-400', sub: 'no criteria match' },
              ].map((m) => (
                <div key={m.label} className="bg-surface-50 dark:bg-surface-800/60 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">{m.label}</p>
                  <p className={`text-2xl font-black ${m.color}`}>{m.value}</p>
                  <p className="text-[10px] text-surface-400 mt-0.5">{m.sub}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex-wrap flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
                <input className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none focus:border-primary-400 w-40"
                  placeholder="Search patient ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="text-xs px-2.5 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none cursor-pointer"
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as MatchStatus | 'all')}>
                <option value="all">All statuses</option>
                <option value="LIKELY_ELIGIBLE">Likely eligible</option>
                <option value="REVIEW_REQUIRED">Review required</option>
                <option value="EXCLUDED">Excluded</option>
              </select>
              <select className="text-xs px-2.5 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none cursor-pointer"
                value={cancerFilter} onChange={(e) => setCancerFilter(e.target.value)}>
                <option value="all">All cancers</option>
                {cancerTypes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="text-xs text-surface-400">{filtered.length} patients</span>
              <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 rounded-lg p-0.5 ml-auto">
                <button onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-400'}`}>
                  <List className="w-3.5 h-3.5" /> List
                </button>
                <button onClick={() => setViewMode('compare')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'compare' ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-400'}`}>
                  <LayoutGrid className="w-3.5 h-3.5" /> Side-by-side
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden min-h-0">
              {viewMode === 'compare' ? (
                <CompareTable patients={filtered} onSelect={handlePatientSelect} allTrials={allTrials} />
              ) : (
                <>
                  <div className="w-80 flex-shrink-0 overflow-y-auto border-r border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
                    {filtered.length === 0
                      ? <div className="text-center py-16 text-surface-400"><Users className="w-8 h-8 mx-auto mb-3 opacity-30" /><p className="text-sm">No patients match filters</p></div>
                      : <AnimatePresence initial={false}>
                          {filtered.map((p) => (
                            <PatientRow key={p.patientId} patient={p} activeTrial={activeTrial}
                              selected={selectedPt?.patientId === p.patientId}
                              onClick={() => { setSelectedPt(p); setDetailTrialId(activeTrial); }} />
                          ))}
                        </AnimatePresence>
                    }
                  </div>
                  <div className="flex-1 overflow-y-auto bg-surface-50 dark:bg-surface-900 min-w-0">
                    <DetailPanel
                      patient={selectedPt}
                      detailTrialId={detailTrialId}
                      onTrialSelect={setDetailTrialId}
                      viewMode={userRole}
                      allTrials={allTrials}
                      onPatientReport={(p) => generatePatientReport(p, allTrials)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
