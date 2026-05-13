// src/lib/trialMatcherPdf.ts
//
// Client-side PDF generation for Trial Matcher sponsor reports.
// Uses the browser's print API with a styled HTML template.
// No server dependency — works on Vercel edge/static builds.
//
// Two report types:
//   generateTrialReport(trial, patients)   → all eligible patients for one trial
//   generatePatientReport(patient, trials) → one patient across all trials

import type { TrialMatcherPatient, TrialDefinition } from './trialMatcherData';
import { STATUS_CONFIG } from './trialMatcherData';

// ─── Shared styles ────────────────────────────────────────────────────────────

const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a1a; background: white; font-size: 12px; line-height: 1.5; }
  @page { margin: 20mm 18mm; size: A4; }
  @media print { .no-print { display: none !important; } }
  .header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb; margin-bottom: 20px; }
  .logo { font-size: 14px; font-weight: 800; color: #0F6E56; letter-spacing: 0.05em; }
  .logo-sub { font-size: 10px; color: #6b7280; margin-top: 2px; }
  .report-title { font-size: 18px; font-weight: 800; color: #111827; margin-bottom: 4px; }
  .report-meta { font-size: 10px; color: #6b7280; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin: 18px 0 8px; }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
  .badge-eligible { background: #d1fae5; color: #065f46; }
  .badge-review { background: #fef3c7; color: #92400e; }
  .badge-excluded { background: #fee2e2; color: #991b1b; }
  .badge-admin { background: #ede9fe; color: #5b21b6; }
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
  .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
  .stat-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin-bottom: 3px; }
  .stat-value { font-size: 22px; font-weight: 800; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead tr { background: #f3f4f6; }
  th { padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
  td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  tr:hover td { background: #f9fafb; }
  .crit-row { display: flex; gap: 6px; padding: 4px 0; border-bottom: 1px solid #f3f4f6; }
  .crit-icon { font-size: 12px; flex-shrink: 0; }
  .crit-name { font-weight: 600; font-size: 11px; }
  .crit-val { font-size: 10px; color: #6b7280; margin-top: 1px; }
  .lab-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 8px; }
  .lab-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 8px; }
  .lab-name { font-size: 9px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
  .lab-val { font-size: 13px; font-weight: 700; }
  .lab-flagged { background: #fef2f2; border-color: #fca5a5; }
  .lab-flagged .lab-val { color: #dc2626; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; display: flex; justify-content: space-between; }
  .disclaimer { font-size: 9px; color: #9ca3af; margin-top: 8px; font-style: italic; }
  .page-break { page-break-before: always; }
  .trial-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-bottom: 12px; }
  .trial-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .score-circle { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; flex-shrink: 0; }
`;

function printWindow(html: string, title: string) {
  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to generate PDF reports.'); return; }
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>${BASE_STYLES}</style></head><body>${html}</body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); }, 800);
}

function statusBadge(status: string): string {
  const cls = status === 'LIKELY_ELIGIBLE' ? 'badge-eligible' : status === 'REVIEW_REQUIRED' ? 'badge-review' : 'badge-excluded';
  const label = status === 'LIKELY_ELIGIBLE' ? 'Eligible' : status === 'REVIEW_REQUIRED' ? 'Review' : 'Excluded';
  const dot = status === 'LIKELY_ELIGIBLE' ? '#10b981' : status === 'REVIEW_REQUIRED' ? '#f59e0b' : '#ef4444';
  return `<span class="badge ${cls}"><span style="width:6px;height:6px;border-radius:50%;background:${dot};display:inline-block;"></span>${label}</span>`;
}

function labRow(name: string, value: number | null, unit: string, flagged: boolean): string {
  return `<div class="lab-card${flagged ? ' lab-flagged' : ''}"><div class="lab-name">${name}</div><div class="lab-val">${value ?? 'N/A'} <span style="font-size:9px;font-weight:400;color:#9ca3af;">${unit}</span></div></div>`;
}

function criteriaRows(criteria: TrialMatcherPatient['trialMatches'][string]['criteria']): string {
  return criteria.map(c => {
    const icon = c.pass === true ? '✓' : c.pass === false ? '✗' : '⚠';
    const color = c.pass === true ? '#059669' : c.pass === false ? '#dc2626' : '#d97706';
    const bg = c.pass === true ? '#f0fdf4' : c.pass === false ? '#fef2f2' : '#fffbeb';
    return `<div class="crit-row" style="background:${bg};padding:5px 8px;border-radius:5px;margin-bottom:3px;">
      <span class="crit-icon" style="color:${color}">${icon}</span>
      <div><div class="crit-name">${c.criterion}</div><div class="crit-val">${c.value}</div></div>
    </div>`;
  }).join('');
}

// ─── Trial-Level Report ───────────────────────────────────────────────────────

export function generateTrialReport(
  trial: TrialDefinition,
  allPatients: TrialMatcherPatient[]
) {
  const trialPatients = allPatients.filter(p => p.trialMatches[trial.nctId]?.status !== 'EXCLUDED');
  const eligible = trialPatients.filter(p => p.trialMatches[trial.nctId]?.status === 'LIKELY_ELIGIBLE');
  const review   = trialPatients.filter(p => p.trialMatches[trial.nctId]?.status === 'REVIEW_REQUIRED');
  const excluded = allPatients.filter(p => p.trialMatches[trial.nctId]?.status === 'EXCLUDED');
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const patientRows = [...eligible, ...review].map(p => {
    const td = p.trialMatches[trial.nctId];
    const bioStr = Object.entries(p.biomarkers)
      .filter(([, v]) => v === 'Positive')
      .map(([k]) => k.toUpperCase() + '+')
      .join(', ') || '—';
    return `<tr>
      <td><strong>${p.patientId}</strong></td>
      <td>${p.cancerType}</td>
      <td>${p.age}y ${p.sex[0]}</td>
      <td>${bioStr}</td>
      <td>${p.priorTreatments.slice(0, 2).join(', ') || '—'}</td>
      <td>${statusBadge(td.status)}</td>
      <td><strong>${td.score}%</strong></td>
    </tr>`;
  }).join('');

  const html = `
    <div class="header">
      <div>
        <div class="logo">MyTrialMatchRX</div>
        <div class="logo-sub">EMR-Driven Trial Matching Platform</div>
      </div>
      <div style="text-align:right;">
        <div class="report-title">${trial.name}</div>
        <div class="report-meta">${trial.nctId} · ${trial.phase} · ${trial.sponsor}</div>
        <div class="report-meta">Generated: ${date} · CONFIDENTIAL — FOR INVESTIGATOR USE ONLY</div>
      </div>
    </div>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:20px;">
      <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:${trial.color}">${trial.indication}</div>
      <div style="font-size:11px;color:#374151;margin-bottom:4px;"><strong>Drug:</strong> ${trial.drug}</div>
      <div style="font-size:11px;color:#374151;margin-bottom:4px;"><strong>Route:</strong> ${trial.route} &nbsp;·&nbsp; <strong>Status:</strong> ${trial.status} &nbsp;·&nbsp; <strong>Biomarker:</strong> ${trial.biomarker}</div>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><div class="stat-label">Total screened</div><div class="stat-value">${allPatients.length.toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-label">Likely eligible</div><div class="stat-value" style="color:#059669">${eligible.length}</div></div>
      <div class="stat-card"><div class="stat-label">Review required</div><div class="stat-value" style="color:#d97706">${review.length}</div></div>
      <div class="stat-card"><div class="stat-label">Auto-excluded</div><div class="stat-value" style="color:#dc2626">${excluded.length}</div></div>
    </div>

    <div class="section-title">Actionable patients — ${eligible.length + review.length} total</div>
    <table>
      <thead><tr>
        <th>Patient ID</th><th>Cancer type</th><th>Age/Sex</th><th>Biomarkers</th><th>Prior treatments</th><th>Status</th><th>Score</th>
      </tr></thead>
      <tbody>${patientRows}</tbody>
    </table>

    <div class="footer">
      <span>${trial.nctId} — ${trial.name} Prescreen Report</span>
      <span>Page 1 · MyTrialMatchRX · ${date}</span>
    </div>
    <div class="disclaimer">
      This report is generated from EMR-derived data for investigator prescreening purposes only. 
      All patients require formal eligibility confirmation per protocol before consent. 
      Not for distribution outside the study team.
    </div>
  `;

  printWindow(html, `${trial.shortName} Prescreen Report — ${date}`);
}

// ─── Patient-Level Report ─────────────────────────────────────────────────────

export function generatePatientReport(
  patient: TrialMatcherPatient,
  trials: Record<string, TrialDefinition>
) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const positiveBiomarkers = Object.entries(patient.biomarkers)
    .filter(([, v]) => v === 'Positive')
    .map(([k]) => `<span class="badge badge-admin">${k.toUpperCase()}+</span>`)
    .join(' ');

  const trialSummaryRows = Object.entries(patient.trialMatches).map(([nct, match]) => {
    const trial = trials[nct];
    if (!trial) return '';
    return `<tr>
      <td><strong>${trial.name}</strong><br><span style="font-size:10px;color:#6b7280;">${trial.phase} · ${trial.biomarker}</span></td>
      <td>${trial.indication}</td>
      <td>${statusBadge(match.status)}</td>
      <td><strong>${match.score}%</strong></td>
    </tr>`;
  }).join('');

  const trialDetailCards = Object.entries(patient.trialMatches)
    .filter(([, m]) => m.status !== 'EXCLUDED')
    .map(([nct, match]) => {
      const trial = trials[nct];
      if (!trial) return '';
      const scoreColor = match.status === 'LIKELY_ELIGIBLE' ? '#059669' : '#d97706';
      return `<div class="trial-card" style="border-color:${trial.color}30">
        <div class="trial-card-header">
          <div>
            <div style="font-weight:800;font-size:13px;color:${trial.color}">${trial.name}</div>
            <div style="font-size:10px;color:#6b7280;margin-top:2px;">${trial.nctId} · ${trial.phase} · ${trial.sponsor}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="score-circle" style="background:${trial.colorLight};color:${scoreColor}">${match.score}%</div>
            ${statusBadge(match.status)}
          </div>
        </div>
        <div style="font-size:11px;margin-bottom:10px;color:#374151;"><strong>Drug:</strong> ${trial.drug}</div>
        ${criteriaRows(match.criteria)}
      </div>`;
    }).join('');

  const html = `
    <div class="header">
      <div>
        <div class="logo">MyTrialMatchRX</div>
        <div class="logo-sub">EMR-Driven Trial Matching Platform</div>
      </div>
      <div style="text-align:right;">
        <div class="report-title">Patient Eligibility Report</div>
        <div class="report-meta">Generated: ${date} · CONFIDENTIAL</div>
      </div>
    </div>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:18px;display:flex;gap:20px;">
      <div style="flex:1">
        <div style="font-size:16px;font-weight:800;margin-bottom:4px;">${patient.patientId}</div>
        <div style="font-size:11px;color:#374151;">${patient.cancerType} · ${patient.age}y ${patient.sex} · Last visit: ${patient.lastVisit}</div>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">${positiveBiomarkers || '<span style="font-size:10px;color:#9ca3af">No key biomarkers detected</span>'}</div>
      </div>
      <div style="flex:1">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-bottom:6px;">Prior treatments</div>
        <div style="font-size:11px;color:#374151;">${patient.priorTreatments.join(', ') || 'None documented'}</div>
      </div>
    </div>

    <div class="section-title">Lab values</div>
    <div class="lab-grid">
      ${labRow('AST', patient.labs.ast, 'U/L', (patient.labs.ast ?? 0) > 100)}
      ${labRow('ALT', patient.labs.alt, 'U/L', (patient.labs.alt ?? 0) > 100)}
      ${labRow('Creatinine', patient.labs.creatinine, 'mg/dL', (patient.labs.creatinine ?? 0) > 1.5)}
      ${labRow('Hemoglobin', patient.labs.hemoglobin, 'g/dL', (patient.labs.hemoglobin ?? 99) < 8)}
      ${labRow('Platelets', patient.labs.platelets, '10\u2079/L', (patient.labs.platelets ?? 999) < 75)}
      ${labRow('WBC', patient.labs.wbc, '10\u2079/L', (patient.labs.wbc ?? 999) < 1.5)}
    </div>

    <div class="section-title">Trial match summary — all ${Object.keys(patient.trialMatches).length} trials</div>
    <table>
      <thead><tr><th>Trial</th><th>Indication</th><th>Status</th><th>Score</th></tr></thead>
      <tbody>${trialSummaryRows}</tbody>
    </table>

    ${trialDetailCards.length ? `
    <div class="page-break"></div>
    <div class="section-title">Eligibility detail — actionable trials only</div>
    ${trialDetailCards}
    ` : ''}

    <div class="footer">
      <span>${patient.patientId} — Multi-Trial Eligibility Report</span>
      <span>MyTrialMatchRX · ${date}</span>
    </div>
    <div class="disclaimer">
      This report is generated from EMR-derived data for investigator prescreening purposes only.
      Requires formal eligibility confirmation per protocol before consent. Not for distribution outside the study team.
    </div>
  `;

  printWindow(html, `${patient.patientId} Eligibility Report — ${date}`);
}
