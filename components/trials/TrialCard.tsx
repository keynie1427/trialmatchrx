"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { computeMatchScore } from "@/lib/matchScore";

export default function TrialCard({
  trial,
  patient,
}: {
  trial: any;
  patient?: any;
}) {
  const [match, setMatch] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>("");

  // ✅ Safely capture browser URL once mounted
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    if (!trial) return;
    const result = computeMatchScore(trial, patient || {});
    setMatch(result);
  }, [trial, patient]);

  if (!trial) return null;

  const id = trial.nctId || "Unknown NCT ID";
  const title = trial.title || "Untitled Trial";
  const status = trial.status || "Unknown";
  const phase = trial.phase || "N/A";
  const condition =
    Array.isArray(trial.conditions) && trial.conditions.length > 0
      ? trial.conditions[0]
      : typeof trial.conditions === "string"
      ? trial.conditions
      : "Unspecified";

  // 🌈 Score glow color
  const getGlow = (score: number) => {
    if (score >= 85) return "0 0 10px rgba(34,197,94,0.6)";
    if (score >= 60) return "0 0 6px rgba(234,179,8,0.5)";
    return "0 0 4px rgba(239,68,68,0.4)";
  };

  // ✅ Add `from` param safely for both links
  const fromParam = currentUrl ? `?from=${encodeURIComponent(currentUrl)}` : "";

  return (
    <div className="border border-gray-200 rounded-2xl shadow-sm p-5 bg-white hover:shadow-md transition">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>

      <p className="text-sm text-gray-600 mt-1">
        <strong>Status:</strong> {status}
      </p>
      <p className="text-sm text-gray-600 mt-1">
        <strong>Phase:</strong> {phase}
      </p>
      <p className="text-sm text-gray-600 mt-1">
        <strong>Condition:</strong> {condition}
      </p>

      {/* 🧠 Overall Match Score */}
      {match && (
        <div className="mt-4">
          <div className="flex justify-between items-center text-sm text-gray-700 mb-1">
            <span>Overall Match Score</span>
            <span className="font-semibold">{match.matchScore}/100</span>
          </div>

          {/* Gradient progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 transition-all duration-700 ease-out"
              style={{
                width: `${match.matchScore}%`,
                boxShadow: getGlow(match.matchScore),
              }}
            ></div>
          </div>

          {/* Label */}
          <p
            className={`mt-1 text-xs font-medium ${
              match.matchScore >= 85
                ? "text-green-700"
                : match.matchScore >= 60
                ? "text-yellow-700"
                : "text-red-700"
            }`}
          >
            {match.matchScore >= 85
              ? "High Match"
              : match.matchScore >= 60
              ? "Moderate Match"
              : "Low Match"}
          </p>
        </div>
      )}

      {/* 📊 Category Breakdown */}
      {match && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Breakdown by Category
          </h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="flex flex-col items-center">
              <span className="font-semibold text-blue-700">
                {match.clinicalEvidence}%
              </span>
              <span className="text-gray-600">Clinical Evidence</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold text-emerald-700">
                {match.eligibilityFit}%
              </span>
              <span className="text-gray-600">Eligibility Fit</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold text-amber-700">
                {match.convenienceScore}%
              </span>
              <span className="text-gray-600">Convenience</span>
            </div>
          </div>
        </div>
      )}

      {/* 🧬 Biomarkers */}
      {trial.tumorMarkers?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {trial.tumorMarkers.map((m: string, idx: number) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200"
            >
              🔬 {m.toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {/* 🧾 Reasoning toggle */}
      {match?.reasoning?.length > 0 && (
        <button
          onClick={() => setShowDetails((v) => !v)}
          className="text-xs text-blue-600 mt-3 hover:underline"
        >
          {showDetails ? "Hide reasoning ▲" : "Show reasoning ▼"}
        </button>
      )}

      {showDetails && (
        <ul className="mt-2 text-xs text-gray-700 list-disc pl-4 space-y-1">
          {match.reasoning.map((r: string, i: number) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}

      {/* 🔗 Action Buttons */}
      <div className="flex justify-between mt-4">
        <Link
          href={`/trial/${id}${fromParam}`}
          target="_blank"
          className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
        >
          View Details
        </Link>

        <Link
          href={`/evidence/${id}${fromParam}`}
          target="_blank"
          className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
        >
          Evidence Score
        </Link>
      </div>
    </div>
  );
}