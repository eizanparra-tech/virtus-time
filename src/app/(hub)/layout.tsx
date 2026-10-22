// Fase 8: layout propio para /inicio, sin el menú lateral del AppShell — es
// la pantalla "¿qué modo abro?" que se ve justo después de elegir perfil,
// cada vez (así lo pidió Eizan), antes de entrar en el modo reloj o en el
// modo calendario.
export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-sunken px-4 py-10">
      <div className="mb-8 flex items-baseline gap-1.5">
        <span className="font-display text-2xl font-semibold tracking-tight text-ink">
          Virtus
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
          Time
        </span>
      </div>
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  );
}
