"use client";

import * as d3 from "d3";
import { useMemo, useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";

const usGeoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_NAME_BY_ABBR: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

function normalizeStateName(input?: string) {
  if (!input) return "";
  const trimmed = input.replace("United States :", "").trim();
  const abbr = trimmed.toUpperCase();
  return STATE_NAME_BY_ABBR[abbr] || trimmed;
}

type Trial = {
  state?: string;
  country?: string;
  conditions?: string;
  phase?: string;
};

type Props = {
  trials: Trial[];
  selectedState?: string | null;
  onSelectState?: (stateName: string | null) => void;
};

export default function TrialMap({ trials, selectedState, onSelectState }: Props) {
  const [tooltip, setTooltip] = useState<{ name: string; count: number } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [open, setOpen] = useState(false);
  const [loadingStateData, setLoadingStateData] = useState(false);
  const [stateDetails, setStateDetails] = useState<any>(null);

  useEffect(() => {
    setOpen(Boolean(selectedState));
  }, [selectedState]);

  // 🧮 Count trials per state
  const { stateCounts, maxCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of trials) {
      if (t.country !== "United States") continue;
      const state = normalizeStateName(t.state);
      if (!state) continue;
      counts[state] = (counts[state] || 0) + 1;
    }
    const max = Math.max(10, ...Object.values(counts));
    return { stateCounts: counts, maxCount: max };
  }, [trials]);

  const fillForCount = (count: number, isSelected: boolean) => {
    if (isSelected) return "#2563eb";
    if (count <= 0) return "#e5e7eb";
    const t = Math.min(1, count / maxCount);
    return d3.interpolateGreens(0.2 + 0.8 * t);
  };

  const topEntries = (obj: Record<string, number>, limit = 3) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, limit);

  // 🧭 Fetch trials for selected state
  const fetchStateTrials = async (stateName: string) => {
    try {
      setLoadingStateData(true);
      const condition = window.location.search.match(/condition=([^&]+)/)?.[1];
      const url = `/api/trials?condition=${decodeURIComponent(
        condition || ""
      )}&state=${encodeURIComponent(stateName)}&pageSize=500`;

      const res = await fetch(url);
      const data = await res.json();
      const list = data?.trials || [];
      if (!list.length) {
        setStateDetails({ total: 0, conditions: {}, phases: {} });
        setLoadingStateData(false);
        return;
      }

      const condCount: Record<string, number> = {};
      const phaseCount: Record<string, number> = {};

      for (const t of list) {
        const ps = t?.protocolSection;
        const conds = ps?.conditionsModule?.conditions || [];
        const phase = ps?.designModule?.phases?.join(", ") || "Not Applicable";

        conds.forEach((c: string) => {
          if (!c) return;
          condCount[c] = (condCount[c] || 0) + 1;
        });
        phaseCount[phase] = (phaseCount[phase] || 0) + 1;
      }

      setStateDetails({
        total: list.length,
        conditions: condCount,
        phases: phaseCount,
      });
    } catch (err) {
      console.error("Error fetching state trials:", err);
      setStateDetails(null);
    } finally {
      setLoadingStateData(false);
    }
  };

  return (
    <div className="relative mt-10 pb-10">
      <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
        Clinical Trials by U.S. State
      </h2>

      {/* Legend ABOVE the map */}
      <div className="flex justify-center items-center mb-4 mt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Fewer</span>
          <div className="w-40 h-3 rounded-full bg-gradient-to-r from-[#e5e7eb] to-[#166534]" />
          <span className="text-xs text-gray-600">More</span>
        </div>
      </div>

      {/* Map */}
      <div className="w-full relative rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white mb-6">
        <ComposableMap
          projection="geoAlbersUsa"
          width={980}
          height={500} // slightly taller for better framing
          projectionConfig={{
            scale: 1000, // was too tight; this zooms out slightly
            translate: [490, 250], // centers better vertically
          }}
          className="!overflow-visible"
        >
          <Geographies geography={usGeoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = geo.properties.name as string;
                const count = stateCounts[name] || 0;
                const isSelected = selectedState === name;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillForCount(count, isSelected)}
                    stroke="#cbd5e1"
                    style={{
                      default: { outline: "none" },
                      hover: { fill: isSelected ? "#1d4ed8" : "#fbbf24" },
                      pressed: { fill: isSelected ? "#1e40af" : "#fb923c" },
                    }}
                    onMouseMove={(evt) => {
                      setTooltip({ name, count });
                      setTooltipPos({ x: evt.pageX + 10, y: evt.pageY - 28 });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => {
                      const next = selectedState === name ? null : name;
                      onSelectState?.(next);
                      if (next) fetchStateTrials(next);
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute bg-white border border-gray-300 rounded-lg shadow-md px-3 py-1 text-sm text-gray-700 pointer-events-none"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y,
                transform: "translate(-50%, -120%)",
                whiteSpace: "nowrap",
                zIndex: 30,
              }}
            >
              <strong>{tooltip.name}</strong>: {tooltip.count} trial
              {tooltip.count !== 1 ? "s" : ""}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {open && selectedState && (
          <motion.div
            key="drawer"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-safe backdrop-blur-sm bg-gradient-to-t from-white/95 to-white/60 shadow-2xl"
          >
            <div className="w-full max-w-5xl mx-auto mb-4">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {selectedState}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {loadingStateData ? (
                        <span className="text-blue-600">Loading full data…</span>
                      ) : (
                        <>
                          Total trials:{" "}
                          <span className="font-semibold">
                            {stateDetails?.total || 0}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectState?.(null)}
                    className="text-sm rounded-md px-3 py-1 border border-gray-300 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>

                {!loadingStateData && stateDetails && (
                  <div className="grid md:grid-cols-2 gap-6 mt-4">
                    {/* Top Conditions */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Top Conditions
                      </h4>
                      {Object.keys(stateDetails.conditions).length ? (
                        <ul className="space-y-2">
                          {topEntries(stateDetails.conditions, 3).map(
                            ([cond, count]) => (
                              <li key={cond}>
                                <div className="flex justify-between text-sm text-gray-700">
                                  <span>{cond}</span>
                                  <span className="font-medium">{count}</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-600"
                                    style={{
                                      width: `${
                                        (count / stateDetails.total) * 100
                                      }%`,
                                    }}
                                  />
                                </div>
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No condition data.</p>
                      )}
                    </div>

                    {/* Top Phases */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Top Phases
                      </h4>
                      {Object.keys(stateDetails.phases).length ? (
                        <ul className="space-y-2">
                          {topEntries(stateDetails.phases, 3).map(
                            ([phase, count]) => (
                              <li key={phase}>
                                <div className="flex justify-between text-sm text-gray-700">
                                  <span>{phase}</span>
                                  <span className="font-medium">{count}</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-600"
                                    style={{
                                      width: `${
                                        (count / stateDetails.total) * 100
                                      }%`,
                                    }}
                                  />
                                </div>
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No phase data.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}