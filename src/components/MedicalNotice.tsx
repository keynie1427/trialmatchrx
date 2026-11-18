'use client';

// Short, visible "not medical advice" notice for pages where people act on results.
// Links to the full Medical Disclaimer. Follows the EN/ES language toggle.

import Link from 'next/link';
import { Stethoscope } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function MedicalNotice({ className = '' }: { className?: string }) {
  const { lang } = useT();
  const es = lang === 'es';
  return (
    <p
      role="note"
      className={`flex items-start gap-2 text-xs text-surface-600 dark:text-surface-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl px-3 py-2 ${className}`}
    >
      <Stethoscope className="w-4 h-4 flex-shrink-0 text-amber-600 mt-px" />
      <span>
        {es
          ? 'Esta información no es un consejo médico. Las puntuaciones y los resúmenes son automáticos y pueden contener errores; solo el equipo del estudio puede confirmar si usted califica. Hable con su oncólogo antes de decidir. '
          : 'This is not medical advice. Match scores and summaries are automated and can be wrong — only the study team can confirm whether you qualify. Talk with your oncologist before making any decision. '}
        <Link href="/legal/disclaimer" className="underline hover:text-surface-900 dark:hover:text-surface-200">
          {es ? 'Aviso médico' : 'Medical disclaimer'}
        </Link>
      </span>
    </p>
  );
}
