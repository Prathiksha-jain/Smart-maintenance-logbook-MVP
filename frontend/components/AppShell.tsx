import type { ReactNode } from "react";

import DemoRoleSwitcher from "@/components/DemoRoleSwitcher";
import Sidebar from "@/components/Sidebar";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 bg-slate-100">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <header className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-panel md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Smart Maintenance Logbook
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl">{title}</h1>
                {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
              </div>
              <div className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                API: 127.0.0.1:8101
              </div>
            </header>
            <DemoRoleSwitcher />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
