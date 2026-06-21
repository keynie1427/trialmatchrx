/**
 * MyTrialMatchRx — Quantum Match API Route
 * =========================================
 * File location: src/app/api/ai/quantum-match/route.ts
 *
 * Calls the local Python quantum microservice and returns
 * results in the same shape as your existing SearchResponse type.
 *
 * The quantum service runs on localhost:5001 in dev.
 * In production, point QUANTUM_API_URL to your deployed microservice.
 */

import { NextRequest, NextResponse } from "next/server";
import type { PatientProfile, SearchResponse, SearchResult } from "@/types";

const QUANTUM_API_URL =
  process.env.QUANTUM_API_URL || "http://localhost:5001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile, useFirestore = true, limit = 30 } = body as {
      profile: PatientProfile;
      useFirestore?: boolean;
      limit?: number;
    };

    if (!profile?.cancerType) {
      return NextResponse.json(
        { error: "Patient profile with cancerType is required" },
        { status: 400 }
      );
    }

    // Call quantum Python microservice
    const quantumResponse = await fetch(
      `${QUANTUM_API_URL}/api/quantum/match`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, useFirestore, limit }),
        // Timeout after 30s — quantum optimization takes a few seconds
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!quantumResponse.ok) {
      const error = await quantumResponse.json();
      console.error("Quantum API error:", error);
      return NextResponse.json(
        { error: "Quantum matching service unavailable", details: error },
        { status: 502 }
      );
    }

    const quantumData = await quantumResponse.json();

    // Return in your existing SearchResponse shape
    const response: SearchResponse & {
      quantumEnabled: boolean;
      aiEnabled: boolean;
      eligibleCount: number;
    } = {
      results: quantumData.results as SearchResult[],
      total: quantumData.total,
      facets: {
        phases: [],
        statuses: [],
        biomarkers: [],
        states: [],
      },
      aiSummary: `Quantum-classical hybrid matching found ${quantumData.eligibleCount} eligible trials out of ${quantumData.total} analyzed.`,
      quantumEnabled: quantumData.quantumEnabled,
      aiEnabled: quantumData.aiEnabled,
      eligibleCount: quantumData.eligibleCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Quantum match route error:", error);

    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Quantum optimization timed out — try with fewer trials" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Quantum matching unavailable", fallback: true },
      { status: 503 }
    );
  }
}

// Health check — tells the frontend if quantum service is online
export async function GET() {
  try {
    const health = await fetch(`${QUANTUM_API_URL}/health`, {
      signal: AbortSignal.timeout(90000),
    });
    const data = await health.json();
    return NextResponse.json({ quantum: data, status: "online" });
  } catch {
    return NextResponse.json(
      { quantum: null, status: "offline" },
      { status: 503 }
    );
  }
}
