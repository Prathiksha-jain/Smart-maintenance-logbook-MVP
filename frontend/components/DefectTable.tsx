"use client";

import type { DefectLog, DefectStatus, Severity } from "@/lib/types";
import EmptyState from "@/components/EmptyState";

type DefectTableProps = {
  defects: DefectLog[];
  selectedId?: number;
  onSelect: (defect: DefectLog) => void;
};

const severityClasses: Record<Severity, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-amber-50 text-amber-700",
  High: "bg-orange-50 text-orange-700",
  Critical: "bg-rose-50 text-rose-700"
};

const statusClasses: Record<DefectStatus, string> = {
  Open: "bg-slate-100 text-slate-700",
  Reviewed: "bg-sky-50 text-sky-700",
  Assigned: "bg-indigo-50 text-indigo-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Resolved: "bg-emerald-50 text-emerald-700",
  Closed: "bg-zinc-100 text-zinc-700"
};

export default function DefectTable({ defects, selectedId, onSelect }: DefectTableProps) {
  if (defects.length === 0) {
    return (
      <EmptyState
        title="No defects found"
        message="Try clearing the filters, or create a new defect from the Inspector workspace."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-3">Code</th>
            <th className="px-3 py-3">Train</th>
            <th className="px-3 py-3">Coach</th>
            <th className="px-3 py-3">Component</th>
            <th className="px-3 py-3">Severity</th>
            <th className="px-3 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {defects.map((defect) => (
            <tr
              key={defect.id}
              className={`cursor-pointer transition hover:bg-slate-50 ${
                selectedId === defect.id ? "bg-slate-100" : "bg-white"
              }`}
              onClick={() => onSelect(defect)}
            >
              <td className="px-3 py-3 font-semibold text-slate-950">{defect.defect_code}</td>
              <td className="px-3 py-3 text-slate-700">{defect.train_number}</td>
              <td className="px-3 py-3 text-slate-700">{defect.coach_number || "-"}</td>
              <td className="px-3 py-3 text-slate-700">{defect.component_name}</td>
              <td className="px-3 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${severityClasses[defect.severity]}`}>
                  {defect.severity}
                </span>
              </td>
              <td className="px-3 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[defect.status]}`}>
                  {defect.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
