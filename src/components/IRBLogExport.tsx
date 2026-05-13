'use client';

// src/components/IRBLogExport.tsx
//
// Dropdown export button for the Trial Matcher page header.
// Provides four export options:
//   1. Prescreen Report PDF     — all eligible patients, sponsor-facing
//   2. IRB Screening Log PDF    — full regulatory log, all patients
//   3. IRB Screening Log Excel  — 4-sheet .xlsx for sponsor data submission
//   4. Patient Report PDF       — single patient (shown only when patient selected)

import { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table2, ChevronDown, Loader2 } from 'lucide-react';
import type { TrialDefinition, TrialMatcherPatient } from '@/lib/trialMatcherData';
import { generateTrialReport, generatePatientReport } from '@/lib/trialMatcherPdf';
import { generateIRBLogPDF, generateIRBLogExcel } from '@/lib/irbScreeningLog';
import { auth } from '@/lib/firebase';

interface IRBLogExportProps {
  trial: TrialDefinition;
  trials: Record<string, TrialDefinition>;
  patients: TrialMatcherPatient[];
  selectedPatient: TrialMatcherPatient | null;
}

export default function IRBLogExport({
  trial, trials, patients, selectedPatient,
}: IRBLogExportProps) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function getToken() {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return user.getIdToken(true);
  }

  async function handleExcel() {
    setLoading('excel');
    setOpen(false);
    try {
      await generateIRBLogExcel(trial, patients, getToken);
    } finally {
      setLoading(null);
    }
  }

  const options = [
    {
      id: 'prescreen-pdf',
      icon: <FileText className="w-3.5 h-3.5" />,
      label: 'Prescreen report',
      sub: 'Eligible patients · PDF',
      onClick: () => { setOpen(false); generateTrialReport(trial, patients); },
    },
    {
      id: 'irb-pdf',
      icon: <FileText className="w-3.5 h-3.5 text-purple-500" />,
      label: 'IRB screening log',
      sub: 'All patients · PDF · Regulatory',
      onClick: () => { setOpen(false); generateIRBLogPDF(trial, patients); },
    },
    {
      id: 'irb-excel',
      icon: <Table2 className="w-3.5 h-3.5 text-emerald-500" />,
      label: 'IRB screening log',
      sub: 'All patients · Excel (.xlsx)',
      onClick: handleExcel,
    },
    ...(selectedPatient ? [{
      id: 'patient-pdf',
      icon: <FileText className="w-3.5 h-3.5 text-blue-500" />,
      label: `Patient report`,
      sub: `${selectedPatient.patientId} · All trials · PDF`,
      onClick: () => { setOpen(false); generatePatientReport(selectedPatient, trials); },
    }] : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading !== null}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        Export
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-64 bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-surface-100 dark:border-surface-800">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">
              Export — {trial.shortName}
            </p>
          </div>
          <div className="py-1">
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={opt.onClick}
                disabled={loading !== null}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors text-left disabled:opacity-50"
              >
                <span className="flex-shrink-0 text-surface-400">{opt.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-surface-900 dark:text-surface-100">{opt.label}</p>
                  <p className="text-[10px] text-surface-400 mt-0.5">{opt.sub}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-surface-100 dark:border-surface-800">
            <p className="text-[9px] text-surface-400 leading-relaxed">
              IRB logs include all screened patients with per-criterion audit trail.<br />
              Reference: 21 CFR Part 11 · ICH E6(R2) GCP
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
