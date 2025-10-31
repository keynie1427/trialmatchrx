"use client";
import { useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("Thanks! We will reach out soon.");
    e.currentTarget.reset();
  }

  return (
    <section className="grid gap-4 max-w-xl">
      <h1 className="text-xl font-semibold">Contact / Referral</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <input name="name" className="input" placeholder="Name" aria-label="Name" required />
        <input name="email" type="email" className="input" placeholder="Email" aria-label="Email" required />
        <input name="phone" className="input" placeholder="Phone (optional)" aria-label="Phone" />
        <input name="condition" className="input" placeholder="Cancer type" aria-label="Cancer type" />
        <textarea name="message" className="input" placeholder="How can we help?" aria-label="Message" rows={4} />
        <label className="text-sm"><input type="checkbox" required className="mr-2" />I consent to be contacted about clinical trials.</label>
        <button className="btn-primary">Submit</button>
      </form>
      {status && <p className="text-green-700">{status}</p>}
      <p className="text-xs text-slate-500">We do not store medical records. Avoid sharing sensitive PHI here.</p>
    </section>
  );
}
