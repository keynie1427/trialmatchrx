// src/lib/irbScreeningLog.ts
//
// IRB Screening Log generator for MyTrialMatchRX.
// Produces regulatory-grade documentation per 21 CFR Part 11 and ICH E6 GCP.
//
// Two outputs:
//   generateIRBLogPDF(trial, patients)  → browser print dialog (PDF)
//   generateIRBLogExcel(trial, patients) → calls /api/trial-matcher/screening-log
//                                          which returns .xlsx download
//
// Log structure:
//   PDF  → Cover page + screening table + footer with site/date/disclaimer
//   Excel → 4 sheets: Cover | Screening Log | Summary Statistics | Screen Failure Analysis

import type { TrialMatcherPatient, TrialDefinition } from './trialMatcherData';

// ─── Shared helpers ───────────────────────────────────────────────────────────

export function formatDate(iso?: string | null): string {
  if (!iso) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function getCriterionResult(
  criteria: TrialMatcherPatient['trialMatches'][string]['criteria'],
  keyword: string
): { pass: boolean | null; value: string } {
  const c = criteria.find(x => x.criterion.toLowerCase().includes(keyword.toLowerCase()));
  return c ? { pass: c.pass, value: c.value } : { pass: null, value: 'Not evaluated' };
}

export function getPrimaryExclusionReason(
  criteria: TrialMatcherPatient['trialMatches'][string]['criteria']
): string {
  const failed = criteria.filter(c => c.type === 'include' && c.pass === false);
  if (failed.length === 0) return '';
  return failed.map(c => c.criterion).join('; ');
}

// ─── PDF Report ───────────────────────────────────────────────────────────────

const PDF_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', Arial, sans-serif; color: #111827; background: white; font-size: 11px; line-height: 1.5; }
@page { margin: 15mm 12mm; size: A4 landscape; }
@media print { .no-print { display: none !important; } }

.cover { page-break-after: always; }
.cover-header { background: linear-gradient(135deg, #0F6E56, #059669); padding: 32px; text-align: center; border-radius: 8px; margin-bottom: 24px; }
.cover-title { font-size: 24px; font-weight: 800; color: white; margin-bottom: 6px; }
.cover-sub { font-size: 13px; color: rgba(255,255,255,0.85); }
.cover-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.cover-section { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
.cover-section h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; margin-bottom: 10px; }
.cover-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f3f4f6; font-size: 11px; }
.cover-row:last-child { border-bottom: none; }
.cover-label { font-weight: 600; color: #374151; }
.cover-value { color: #111827; }
.stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.stat-card { text-align: center; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
.stat-num { font-size: 28px; font-weight: 800; }
.stat-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; margin-top: 4px; }

.log-section { }
.section-title { font-size: 14px; font-weight: 800; color: #111827; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #0F6E56; }
table { width: 100%; border-collapse: collapse; font-size: 9px; }
thead tr { background: #0F6E56; }
th { padding: 6px 5px; text-align: left; font-weight: 700; color: white; font-size: 8px; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
td { padding: 5px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
tr.even td { background: #f9fafb; }
tr.eligible td { background: #f0fdf4; }
tr.review td { background: #fffbeb; }
tr.excluded td { background: #fff; }
.badge { display: inline-block; padding: 2px 6px; border-radius: 20px; font-size: 8px; font-weight: 700; }
.badge-elig { background: #d1fae5; color: #065f46; }
.badge-rev  { background: #fef3c7; color: #92400e; }
.badge-excl { background: #fee2e2; color: #991b1b; }
.pass  { color: #059669; font-weight: 700; }
.fail  { color: #dc2626; font-weight: 700; }
.warn  { color: #d97706; font-weight: 700; }
.exclusion-reason { font-size: 8px; color: #dc2626; font-style: italic; }
.footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 8px; color: #9ca3af; }
.disclaimer { margin-top: 8px; font-size: 8px; color: #9ca3af; font-style: italic; line-height: 1.4; }
.page-break { page-break-before: always; margin-top: 20px; }

.failure-section { margin-top: 30px; }
.failure-table th { background: #374151; }
`;

export function generateIRBLogPDF(
  trial: TrialDefinition,
  patients: TrialMatcherPatient[]
) {
  const trialPatients = patients.filter(p => p.trialMatches[trial.nctId]);
  const eligible = trialPatients.filter(p => p.trialMatches[trial.nctId]?.status === 'LIKELY_ELIGIBLE');
  const review   = trialPatients.filter(p => p.trialMatches[trial.nctId]?.status === 'REVIEW_REQUIRED');
  const excluded = trialPatients.filter(p => p.trialMatches[trial.nctId]?.status === 'EXCLUDED');
  const date     = formatDate();
  const total    = trialPatients.length;

  // Build patient rows
  const patientRows = trialPatients
    .sort((a, b) => {
      const order: Record<string, number> = { LIKELY_ELIGIBLE: 3, REVIEW_REQUIRED: 2, EXCLUDED: 1 };
      return (order[b.trialMatches[trial.nctId]?.status] || 0) - (order[a.trialMatches[trial.nctId]?.status] || 0);
    })
    .map((p, i) => {
      const tm = p.trialMatches[trial.nctId];
      const age_c   = getCriterionResult(tm.criteria, 'Age');
      const ras_c   = getCriterionResult(tm.criteria, 'RAS');
      const ecog_c  = getCriterionResult(tm.criteria, 'ECOG');
      const prior_c = getCriterionResult(tm.criteria, 'prior systemic');
      const labs_c  = getCriterionResult(tm.criteria, 'organ function');
      const statusClass = tm.status === 'LIKELY_ELIGIBLE' ? 'eligible' : tm.status === 'REVIEW_REQUIRED' ? 'review' : 'excluded';
      const badgeClass  = tm.status === 'LIKELY_ELIGIBLE' ? 'badge-elig' : tm.status === 'REVIEW_REQUIRED' ? 'badge-rev' : 'badge-excl';
      const statusLabel = tm.status === 'LIKELY_ELIGIBLE' ? 'Eligible' : tm.status === 'REVIEW_REQUIRED' ? 'Review' : 'Excluded';
      const exclusion = getPrimaryExclusionReason(tm.criteria);
      const rowClass = i % 2 === 0 ? 'even' : '';

      const passIcon = (pass: boolean | null) =>
        pass === true ? '<span class="pass">✓ Pass</span>' :
        pass === false ? '<span class="fail">✗ Fail</span>' :
        '<span class="warn">⚠ Review</span>';

      const bioPos = Object.entries(p.biomarkers).filter(([, v]) => v === 'Positive').map(([k]) => k.toUpperCase() + '+').join(', ') || '—';

      return `<tr class="${statusClass} ${rowClass}">
        <td><strong>${i + 1}</strong></td>
        <td>${p.patientId}</td>
        <td>${p.age}y ${p.sex[0]}</td>
        <td>${p.cancerType}</td>
        <td style="font-size:8px">${bioPos}</td>
        <td>${p.labs.hemoglobin ?? '—'} g/dL</td>
        <td>${p.labs.ast ?? '—'}</td>
        <td>${p.labs.alt ?? '—'}</td>
        <td>${p.labs.creatinine ?? '—'}</td>
        <td>${p.labs.platelets ?? '—'}</td>
        <td>${p.labs.wbc ?? '—'}</td>
        <td>${p.priorTreatments.join(', ') || '—'}</td>
        <td>${passIcon(age_c.pass)}</td>
        <td>${passIcon(ras_c.pass)}</td>
        <td>${passIcon(ecog_c.pass)}</td>
        <td>${passIcon(prior_c.pass)}</td>
        <td>${passIcon(labs_c.pass)}</td>
        <td><strong>${tm.score}%</strong></td>
        <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
        <td class="exclusion-reason" style="max-width:120px;">${exclusion || '—'}</td>
        <td style="font-size:8px">${date}</td>
        <td style="font-size:8px">EMR Engine</td>
      </tr>`;
    }).join('');

  // Screen failure analysis
  const failureMap = new Map<string, number>();
  excluded.forEach(p => {
    const tm = p.trialMatches[trial.nctId];
    tm.criteria.filter(c => c.type === 'include' && c.pass === false).forEach(c => {
      failureMap.set(c.criterion, (failureMap.get(c.criterion) || 0) + 1);
    });
  });
  const failureRows = Array.from(failureMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([criterion, count]) => `
      <tr>
        <td>${criterion}</td>
        <td style="text-align:center"><strong>${count}</strong></td>
        <td style="text-align:center">${((count / total) * 100).toFixed(1)}%</td>
        <td style="text-align:center">${((count / Math.max(excluded.length, 1)) * 100).toFixed(1)}%</td>
      </tr>`
    ).join('');

  const html = `
    <!-- Cover Page -->
    <div class="cover">
      <div class="cover-header">
        <div class="cover-title">IRB Pre-Screening Log</div>
        <div class="cover-sub">Clinical Trial Eligibility Documentation — EMR-Driven Assessment</div>
      </div>

      <div class="stat-row">
        <div class="stat-card"><div class="stat-num">${total.toLocaleString()}</div><div class="stat-label">Total screened</div></div>
        <div class="stat-card"><div class="stat-num" style="color:#059669">${eligible.length}</div><div class="stat-label">Likely eligible</div></div>
        <div class="stat-card"><div class="stat-num" style="color:#d97706">${review.length}</div><div class="stat-label">Review required</div></div>
        <div class="stat-card"><div class="stat-num" style="color:#dc2626">${excluded.length}</div><div class="stat-label">Screen failures</div></div>
      </div>

      <div class="cover-grid">
        <div class="cover-section">
          <h3>Protocol Information</h3>
          <div class="cover-row"><span class="cover-label">NCT ID:</span><span class="cover-value">${trial.nctId}</span></div>
          <div class="cover-row"><span class="cover-label">Trial Name:</span><span class="cover-value">${trial.name}</span></div>
          <div class="cover-row"><span class="cover-label">Sponsor:</span><span class="cover-value">${trial.sponsor}</span></div>
          <div class="cover-row"><span class="cover-label">Phase:</span><span class="cover-value">${trial.phase}</span></div>
          <div class="cover-row"><span class="cover-label">Status:</span><span class="cover-value">${trial.status}</span></div>
          <div class="cover-row"><span class="cover-label">Drug:</span><span class="cover-value">${trial.drug}</span></div>
          <div class="cover-row"><span class="cover-label">Indication:</span><span class="cover-value">${trial.indication}</span></div>
        </div>
        <div class="cover-section">
          <h3>Screening Documentation</h3>
          <div class="cover-row"><span class="cover-label">Report Date:</span><span class="cover-value">${date}</span></div>
          <div class="cover-row"><span class="cover-label">Screening Method:</span><span class="cover-value">EMR-driven (FHIR R4)</span></div>
          <div class="cover-row"><span class="cover-label">Data Source:</span><span class="cover-value">MyTrialMatchRX Platform</span></div>
          <div class="cover-row"><span class="cover-label">Total Screened:</span><span class="cover-value">${total.toLocaleString()}</span></div>
          <div class="cover-row"><span class="cover-label">Screen Failure Rate:</span><span class="cover-value">${((excluded.length / total) * 100).toFixed(1)}%</span></div>
          <div class="cover-row"><span class="cover-label">Eligibility Yield:</span><span class="cover-value">${(((eligible.length + review.length) / total) * 100).toFixed(1)}%</span></div>
          <div class="cover-row"><span class="cover-label">Regulatory Reference:</span><span class="cover-value">21 CFR Part 11 / ICH E6 GCP</span></div>
        </div>
      </div>

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;font-size:10px;color:#92400e;">
        <strong>IMPORTANT:</strong> This log documents EMR-based pre-screening for identification of potentially eligible patients.
        All patients identified as likely eligible or requiring review must undergo formal eligibility assessment per protocol
        before consent. This document does not constitute enrollment or formal screening per 21 CFR 312.62(b).
      </div>
    </div>

    <!-- Screening Log -->
    <div class="log-section">
      <div class="section-title">Pre-Screening Log — ${trial.name} (${trial.nctId})</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Patient ID</th>
            <th>Age/Sex</th>
            <th>Cancer Type</th>
            <th>Biomarkers</th>
            <th>Hgb (g/dL)</th>
            <th>AST</th>
            <th>ALT</th>
            <th>Cr</th>
            <th>Plt</th>
            <th>WBC</th>
            <th>Prior Therapy</th>
            <th>Age ≥18</th>
            <th>RAS Mut.</th>
            <th>ECOG 0-1</th>
            <th>Prior Tx</th>
            <th>Labs OK</th>
            <th>Score</th>
            <th>Status</th>
            <th>Exclusion Reason</th>
            <th>Screen Date</th>
            <th>Reviewed By</th>
          </tr>
        </thead>
        <tbody>${patientRows}</tbody>
      </table>

      <div class="failure-section page-break">
        <div class="section-title">Screen Failure Analysis by Criterion</div>
        <table class="failure-table" style="max-width:600px">
          <thead>
            <tr style="background:#374151">
              <th>Exclusion Criterion</th>
              <th style="text-align:center">Screen Failures (n)</th>
              <th style="text-align:center">% of Total Screened</th>
              <th style="text-align:center">% of All Failures</th>
            </tr>
          </thead>
          <tbody>${failureRows}</tbody>
        </table>
      </div>

      <div class="footer">
        <span>${trial.nctId} — ${trial.name} Pre-Screening Log · Generated: ${date}</span>
        <span>MyTrialMatchRX · CONFIDENTIAL — FOR INVESTIGATOR USE ONLY · Page 1</span>
      </div>
      <div class="disclaimer">
        This pre-screening log was generated by the MyTrialMatchRX EMR-driven eligibility engine using structured FHIR R4 patient data.
        Eligibility determinations are based on available EMR data only and require formal confirmation per protocol criteria before consent.
        Criteria marked ⚠ could not be determined from available data and require manual review.
        This document is intended for site investigator use only and should not be distributed outside the study team.
        Reference standards: 21 CFR Part 11, ICH E6(R2) GCP, FDA Guidance on Electronic Records.
      </div>
    </div>
  `;

  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to generate the IRB Screening Log.'); return; }
  win.document.write(`<!DOCTYPE html><html><head><title>IRB Screening Log — ${trial.name}</title><style>${PDF_STYLES}</style></head><body>${html}</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 800);
}

// ─── Excel — calls server API ─────────────────────────────────────────────────

export async function generateIRBLogExcel(
  trial: TrialDefinition,
  patients: TrialMatcherPatient[],
  getToken: () => Promise<string>
): Promise<void> {
  try {
    const token = await getToken();
    const res = await fetch('/api/trial-matcher/screening-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        trialId: trial.nctId,
        // Pass de-identified data — server will regenerate from FHIR
      }),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    // Download the Excel file
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IRB_Screening_Log_${trial.nctId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[IRB Excel] Failed:', err);
    alert('Failed to generate Excel report. Please try again.');
  }
}
