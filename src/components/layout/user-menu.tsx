"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { iniciales } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { signOutAction } from "@/app/(app)/actions";
import type { Profile } from "@/types/database.types";

export function UserMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-sm py-1 pl-1 pr-2 hover:bg-surface-sunken"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-ink-on-brand">
          {iniciales(profile.nombre, profile.apellidos)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-ink">
            {profile.nombre}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-ink-muted" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-border bg-surface p-1.5 shadow-float">
          <div className="px-2.5 py-2">
            <p className="text-sm font-medium text-ink">
              {profile.nombre} {profile.apellidos}
            </p>
            <Badge
              tone={profile.rol === "admin" ? "accent" : "neutral"}
              className="mt-1.5"
            >
              {profile.rol === "admin" ? "Administrador" : "Socio"}
            </Badge>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link
            href="/configuracion"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-sm px-2.5 py-2 text-sm text-ink-secondary hover:bg-surface-sunken"
          >
            <UserIcon className="h-4 w-4" /> Mi perfil
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm text-negative hover:bg-negative-soft"
            >
              <LogOut className="h-4 w-4" /> Cambiar de perfil
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
