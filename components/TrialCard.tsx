import Link from "next/link";

export default function TrialCard({ trial }: { trial: any }) {
  const id =
    trial.protocolSection?.identificationModule?.nctId || "Unknown NCT ID";
  const title =
    trial.protocolSection?.identificationModule?.briefTitle || "Untitled Trial";
  const status =
    trial.protocolSection?.statusModule?.overallStatus || "Unknown";
  const phase =
    trial.protocolSection?.designModule?.phases?.join(", ") ||
    trial.protocolSection?.designModule?.studyType ||
    "N/A";
  const condition =
    trial.protocolSection?.conditionsModule?.conditions?.[0] || "Unspecified";

  // ✅ Detect biomarkers
  const allText = JSON.stringify(trial).toLowerCase();
  const markers = ["her2", "brca1", "brca2", "egfr", "kras", "alk", "pdl1", "msi", "braf"];
  const foundMarkers = markers.filter((m) => allText.includes(m));

  console.log("🧬 Found markers for", id, ":", foundMarkers);

  return (
    <div className="bg-white border border-blue-100 rounded-xl shadow-sm p-4 hover:shadow-md transition">
      <h2 className="text-lg font-semibold text-blue-700 mb-2">{title}</h2>

      <div className="text-sm text-gray-600 mb-1">
        <strong>Status:</strong> {status}
      </div>
      <div className="text-sm text-gray-600 mb-1">
        <strong>Condition:</strong> {condition}
      </div>
      <div className="text-sm text-gray-600 mb-3">
        <strong>Phase:</strong> {phase}
      </div>

      {/* 🧬 Marker row */}
      {foundMarkers.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 mb-3 border-t border-gray-100 pt-2">
          <span className="text-sm font-semibold text-gray-700">Tumor Markers:</span>
          {foundMarkers.map((m) => (
            <span
              key={m}
              className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-md"
            >
              {m.toUpperCase()}
            </span>
          ))}

          {/* ✅ Always visible link if markers exist */}
          <Link
            href={`/evidence/${id}`}
            className="ml-2 bg-green-50 border border-green-300 text-green-700 text-xs font-semibold px-3 py-1 rounded-full hover:bg-green-100 transition"
          >
            View Evidence →
          </Link>
        </div>
      ) : (
        <div className="text-xs text-gray-400 italic mb-3">No biomarkers detected</div>
      )}

      {/* 🔗 View Details */}
      <div className="mt-2">
        <Link
          href={`/trial/${id}`}
          className="text-blue-600 text-sm font-medium hover:underline"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}