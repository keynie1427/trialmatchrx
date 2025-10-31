"use client";

import { useEffect, useState } from "react";
import ContactForm from "@/components/ContactForm";

export default function TrialModal({
  nctId,
  onClose,
}: {
  nctId: string;
  onClose: () => void;
}) {
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl text-blue-600">Loading...</div>
      </div>
    );

  if (error)
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl text-red-600">
          Error: {error}
        </div>
      </div>
    );

  const p = trial.protocolSection;
  const id = p?.identificationModule;
  const desc = p?.descriptionModule;
  const eligibility = p?.eligibilityModule;
  const locations = p?.contactsLocationsModule?.locations || [];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg overflow-y-auto max-h-[90vh] p-6">
        <button
          onClick={onClose}
          className="float-right text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-blue-700 mb-3">
          {id?.briefTitle || "Untitled Study"}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          <strong>NCT ID:</strong> {nctId}
        </p>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-2">Summary</h3>
          <p className="text-gray-700 whitespace-pre-line">
            {desc?.briefSummary || "No summary available."}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-2">
            Eligibility
          </h3>
          <p className="text-gray-700 whitespace-pre-line">
            {eligibility?.eligibilityCriteria || "Not provided."}
          </p>
        </div>

        {locations.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">
              Locations
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {locations.map((loc: any, i: number) => (
                <li key={i}>
                  <strong>{loc.facility}</strong>
                  <br />
                  {[loc.city, loc.state, loc.country].filter(Boolean).join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        <ContactForm nctId={nctId} />
      </div>
    </div>
  );
}