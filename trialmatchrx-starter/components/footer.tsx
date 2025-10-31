export function Footer() {
  return (
    <footer className="border-t mt-8">
      <div className="container mx-auto px-4 py-8 text-sm text-slate-600 grid gap-2">
        <p><strong>Disclaimer:</strong> Educational resource only. Not medical advice. Talk to your clinician.</p>
        <div className="flex gap-6">
          <a href="#" aria-label="Privacy policy">Privacy</a>
          <a href="#" aria-label="Terms of service">Terms</a>
          <a href="#" aria-label="Accessibility">Accessibility</a>
        </div>
        <p className="text-xs">© {new Date().getFullYear()} TrialMatchRX</p>
      </div>
    </footer>
  );
}
