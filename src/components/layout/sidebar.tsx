"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, TimerIcon, CalendarDays } from "lucide-react";
import {
  NAV_ITEMS_RELOJ,
  NAV_ITEMS_CALENDARIO,
  modoDeRuta,
} from "@/lib/nav-config";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const modo = modoDeRuta(pathname);
  const items = modo === "calendario" ? NAV_ITEMS_CALENDARIO : NAV_ITEMS_RELOJ;

  return (
    <>
      {/* Fondo oscuro al abrir el menú en móvil */}
      {open && (
        <button
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand text-ink-on-brand transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-[calc(4rem+env(safe-area-inset-top))] items-center justify-between px-5 pt-[env(safe-area-inset-top)]">
          <Link href="/inicio" className="flex items-baseline gap-1.5">
            <span className="font-display text-xl font-semibold tracking-tight">
              Virtus
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              Time
            </span>
          </Link>
          <button
            aria-label="Cerrar menú"
            onClick={onClose}
            className="rounded-sm p-1.5 text-ink-on-brand/70 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cambiar de modo al vuelo, sin pasar por /inicio (Fase 8). */}
        <div className="mx-3 mt-1 mb-2 inline-flex rounded-sm bg-white/5 p-1">
          <Link
            href="/dashboard"
            onClick={onClose}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors",
              modo === "reloj"
                ? "bg-white/15 text-ink-on-brand"
                : "text-ink-on-brand/55 hover:text-ink-on-brand"
            )}
          >
            <TimerIcon className="h-3.5 w-3.5" />
            Reloj
          </Link>
          <Link
            href="/calendario"
            onClick={onClose}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors",
              modo === "calendario"
                ? "bg-white/15 text-ink-on-brand"
                : "text-ink-on-brand/55 hover:text-ink-on-brand"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Calendario
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/10 text-ink-on-brand"
                    : "text-ink-on-brand/65 hover:bg-white/5 hover:text-ink-on-brand"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    active ? "text-accent" : "text-ink-on-brand/50"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-xs text-ink-on-brand/45">
          VIRTUS COMPANY
        </div>
      </aside>
    </>
  );
}
