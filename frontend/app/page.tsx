import Link from "next/link";

import AppShell from "@/components/AppShell";

const destinations = [
  {
    title: "Inspector",
    href: "/inspector",
    description: "Log a defect with transcript, recorded audio, and image evidence."
  },
  {
    title: "Supervisor",
    href: "/supervisor",
    description: "Review defects, inspect media evidence, and update status."
  },
  {
    title: "Manager",
    href: "/manager",
    description: "Track defect volume, critical items, and operational trends."
  }
];

export default function HomePage() {
  return (
    <AppShell title="Smart Maintenance Logbook" subtitle="Railway defect logging MVP">
      <section className="grid gap-4 md:grid-cols-3">
        {destinations.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="panel block p-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Open workspace</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
