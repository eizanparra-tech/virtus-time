export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-baseline justify-center gap-1.5">
          <span className="font-display text-3xl font-semibold tracking-tight text-ink-on-brand">
            Virtus
          </span>
          <span className="text-sm font-medium uppercase tracking-[0.25em] text-accent">
            Time
          </span>
        </div>
        <div className="rounded-lg border border-white/10 bg-surface p-7 shadow-float sm:p-8">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-ink-on-brand/50">
          VIRTUS COMPANY
        </p>
      </div>
    </div>
  );
}
