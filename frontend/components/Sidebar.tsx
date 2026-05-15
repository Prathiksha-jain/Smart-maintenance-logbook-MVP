"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/inspector", label: "Inspector" },
  { href: "/supervisor", label: "Supervisor" },
  { href: "/manager", label: "Manager" }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-slate-950 px-4 py-5 text-white lg:min-h-screen lg:w-72">
      <div className="flex items-center justify-between gap-4 lg:block">
        <Link href="/" className="block">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Railway MVP</p>
          <p className="mt-1 text-lg font-semibold text-white">Maintenance Logbook</p>
        </Link>
      </div>
      <nav className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
