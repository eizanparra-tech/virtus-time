"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

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
          <Link href="/dashboard" className="flex items-baseline gap-1.5">
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

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => {
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
