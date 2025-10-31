"use client";

import { useEffect, useState } from "react";
import ContactForm from "@/components/contactForm";

export default function TrialDetailsClient({ nctId }: { nctId: string }) {
  const [trial, setTrial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTrial = async () => {
      try {
        const res = await fetch(`/api/trials/${nctId}`);
        if (!res.ok) throw new Error("Failed to load trial details.");
        const data = await res.json();
        setTrial(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrial();
  }, [nctId]);

  if (loading)
    return (
      <div className="p-8 text-center text-blue-500">
        Loading trial details...
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center text-red-500">
        Error loading trial: {error}
      </div>
    );

  const info = trial?.protocolSection?.identificationModule;
  const desc = trial?.protocolSection?.descriptionModule?.briefSummary;
  const eligibility =
    trial?.protocolSection?.eligibilityModule?.eligibilityCriteria;

  return (
    <div className="min-h-screen bg-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* 🔹 Title */}
        <h1 className="text-2xl font-bold text-blue-700 mb-3">
          {info?.briefTitle || "Untitled Study"}
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          <strong>NCT ID:</strong> {nctId}
        </p>

        {/* 🔹 Summary */}
        <section className="bg-blue-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-blue-600 mb-2">Summary</h2>
          <p className="text-gray-700 whitespace-pre-line">
            {desc || "No summary provided."}
          </p>
        </section>

        {/* 🔹 Eligibility */}
        <section className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-600 mb-2">
            Eligibility Criteria
          </h2>
          <p className="text-gray-700 whitespace-pre-line">
            {eligibility || "Not provided."}
          </p>
        </section>

        {/* 🔹 Contact Form */}
        <ContactForm nctId={nctId} />
      </div>
    </div>
  );
}