"use client";

import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import LoadingBlock from "@/components/LoadingBlock";
import StatCard from "@/components/StatCard";
import {
  getDashboardSummary,
  getDefectsByComponent,
  getDefectsByStatus,
  getRecentDefects
} from "@/lib/api";
import type { DashboardBucket, DashboardSummary, DefectLog } from "@/lib/types";

export default function ManagerPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [byComponent, setByComponent] = useState<DashboardBucket[]>([]);
  const [byStatus, setByStatus] = useState<DashboardBucket[]>([]);
  const [recentCritical, setRecentCritical] = useState<DefectLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [summaryData, componentData, statusData, criticalData] = await Promise.all([
          getDashboardSummary(),
          getDefectsByComponent(),
          getDefectsByStatus(),
          getRecentDefects("Critical", 8)
        ]);

        if (cancelled) return;
        setSummary(summaryData);
        setByComponent(componentData);
        setByStatus(statusData);
        setRecentCritical(criticalData);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load manager analytics.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const maxComponentCount = useMemo(() => Math.max(1, ...byComponent.map((item) => item.count)), [byComponent]);
  const maxStatusCount = useMemo(() => Math.max(1, ...byStatus.map((item) => item.count)), [byStatus]);

  return (
    <AppShell
      title="Manager Analytics"
      subtitle="Track defect volume, status distribution, component concentration, and critical items."
    >
      {error ? (
        <div className="rounded-lg bg-rose-50 p-4 text-sm leading-6 text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total defects" value={summary?.total_defects ?? 0} helper="All captured logs" />
        <StatCard label="Open" value={summary?.open_defects ?? 0} helper="Needs intake" />
        <StatCard label="In progress" value={summary?.in_progress_defects ?? 0} helper="Work active" />
        <StatCard label="Resolved" value={summary?.resolved_defects ?? 0} helper="Completed items" tone="success" />
        <StatCard label="Critical" value={summary?.critical_defects ?? 0} helper="Priority risk" tone="critical" />
      </section>

      {loading ? (
        <LoadingBlock message="Loading manager analytics from the backend..." />
      ) : (
        <section className="grid gap-6 xl:grid-cols-2">
          <AnalyticsPanel title="Defects by component" items={byComponent} maxCount={maxComponentCount} />
          <AnalyticsPanel title="Defects by status" items={byStatus} maxCount={maxStatusCount} />
          <div className="panel p-5 xl:col-span-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Recent critical defects</h2>
                <p className="mt-1 text-sm text-slate-500">Newest high-priority issues from the inspection stream.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {recentCritical.length === 0 ? (
                <EmptyState
                  title="No critical defects yet"
                  message="Critical items will appear here as inspectors log brake, wheel, smoke, fire, or electrical spark issues."
                />
              ) : (
                recentCritical.map((defect) => (
                  <article key={defect.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-950">{defect.defect_code}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {defect.train_number} / {defect.coach_number || "coach not detected"} /{" "}
                          {defect.component_name}
                        </p>
                      </div>
                      <span className="self-start rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        {defect.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-900">{defect.defect_type}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{defect.description}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
}

function AnalyticsPanel({
  title,
  items,
  maxCount
}: {
  title: string;
  items: DashboardBucket[];
  maxCount: number;
}) {
  return (
    <article className="panel p-5">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-5 grid gap-4">
        {items.length === 0 ? (
          <EmptyState
            title="No data yet"
            message="Seeded demo defects will appear after the backend starts and initializes the SQLite database."
          />
        ) : (
          items.map((item) => (
            <div key={item.label} className="grid gap-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="font-semibold text-slate-950">{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-800"
                  style={{ width: `${Math.max(8, (item.count / maxCount) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
