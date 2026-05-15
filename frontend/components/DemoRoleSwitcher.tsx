"use client";

import Link from "next/link";

import { ROLE_LABELS, ROLE_PATHS } from "@/lib/demoRole";
import type { Role } from "@/lib/types";
import { useDemoUser } from "@/lib/useDemoUser";

const SWITCHABLE_ROLES: Role[] = ["inspector", "supervisor", "manager"];

export default function DemoRoleSwitcher() {
  const { activeRole, activeUser, loading, error, setActiveRole } = useDemoUser();

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo role</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {loading ? "Loading demo users..." : activeUser?.name || ROLE_LABELS[activeRole]}
          </p>
          <p className="mt-1 text-xs text-slate-500">{ROLE_LABELS[activeRole]} workspace</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="field-input min-w-40 bg-white"
            value={activeRole}
            onChange={(event) => setActiveRole(event.target.value as Role)}
          >
            {SWITCHABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <Link href={ROLE_PATHS[activeRole]} className="secondary-button bg-white">
            Open role
          </Link>
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-amber-700">{error}</p> : null}
    </div>
  );
}
