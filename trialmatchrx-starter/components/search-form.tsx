"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { compact?: boolean };

export function SearchForm({ compact = true }: Props) {
  const router = useRouter();
  const [condition, setCondition] = useState("");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState("50");
  const [age, setAge] = useState("");
  const [phase, setPhase] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      ...(condition && { condition }),
      ...(zip && { zip }),
      ...(radius && { radius }),
      ...(age && { age }),
      ...(phase && { phase }),
    });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className={`grid gap-3 ${compact ? "md:grid-cols-5" : "md:grid-cols-6"}`}>
      <input aria-label="Cancer type" placeholder="Cancer type (e.g., breast)" className="input" value={condition} onChange={(e)=>setCondition(e.target.value)} />
      <input aria-label="ZIP or City" placeholder="ZIP or City" className="input" value={zip} onChange={(e)=>setZip(e.target.value)} />
      <select aria-label="Search radius" className="input" value={radius} onChange={(e)=>setRadius(e.target.value)}>
        {[10,25,50,100,250].map(r => <option key={r} value={r}>{r} miles</option>)}
      </select>
      <input aria-label="Age" placeholder="Age" inputMode="numeric" className="input" value={age} onChange={(e)=>setAge(e.target.value)} />
      <select aria-label="Phase" className="input" value={phase} onChange={(e)=>setPhase(e.target.value)}>
        <option value="">Any Phase</option>
        <option value="I">Phase I</option>
        <option value="II">Phase II</option>
        <option value="III">Phase III</option>
        <option value="IV">Phase IV</option>
      </select>
      <button type="submit" className="btn-primary">Search</button>
    </form>
  );
}
