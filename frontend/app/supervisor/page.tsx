"use client";

import { useEffect, useMemo, useState } from "react";

import AppShell from "@/components/AppShell";
import DefectTable from "@/components/DefectTable";
import LoadingBlock from "@/components/LoadingBlock";
import StatCard from "@/components/StatCard";
import {
  getDashboardSummary,
  getDefect,
  getDefects,
  getHealth,
  mediaUrl,
  transcribeDefectAudio,
  updateDefectStatus
} from "@/lib/api";
import type { DashboardSummary, DefectLog, DefectStatus, HealthStatus, Severity } from "@/lib/types";
import { SEVERITY_OPTIONS, STATUS_OPTIONS } from "@/lib/types";
import { useDemoUser } from "@/lib/useDemoUser";

export default function SupervisorPage() {
  const { getUserForRole, loading: demoUsersLoading, error: demoUsersError } = useDemoUser();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [defects, setDefects] = useState<DefectLog[]>([]);
  const [allDefects, setAllDefects] = useState<DefectLog[]>([]);
  const [selectedDefect, setSelectedDefect] = useState<DefectLog | null>(null);
  const [statusFilter, setStatusFilter] = useState<DefectStatus | "">("");
  const [severityFilter, setSeverityFilter] = useState<Severity | "">("");
  const [componentFilter, setComponentFilter] = useState("");
  const [statusDraft, setStatusDraft] = useState<DefectStatus>("Open");
  const [remarks, setRemarks] = useState("");
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const componentOptions = useMemo(
    () => Array.from(new Set(allDefects.map((defect) => defect.component_name))).sort(),
    [allDefects]
  );
  const supervisorUser = getUserForRole("supervisor");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [summaryData, filteredDefects, everyDefect] = await Promise.all([
          getDashboardSummary(),
          getDefects({
            status: statusFilter,
            severity: severityFilter,
            component: componentFilter
          }),
          getDefects()
        ]);

        if (cancelled) return;

        setSummary(summaryData);
        setDefects(filteredDefects);
        setAllDefects(everyDefect);

        const preferredId = selectedDefect?.id;
        const nextDefect = filteredDefects.find((defect) => defect.id === preferredId) || filteredDefects[0] || null;
        if (nextDefect) {
          setSelectedDefect(await getDefect(nextDefect.id));
        } else {
          setSelectedDefect(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load supervisor data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [componentFilter, severityFilter, statusFilter]);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const healthStatus = await getHealth();
        if (!cancelled) setHealth(healthStatus);
      } catch {
        if (!cancelled) setHealth(null);
      }
    }

    loadHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedDefect) {
      setStatusDraft(selectedDefect.status);
      setRemarks("");
    }
  }, [selectedDefect]);

  async function handleSelect(defect: DefectLog) {
    setDetailLoading(true);
    setError(null);
    setNotice(null);
    try {
      setSelectedDefect(await getDefect(defect.id));
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : "Could not load defect details.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleStatusUpdate() {
    if (!selectedDefect) return;
    if (!supervisorUser) {
      setError("Demo supervisor is not available yet. Please wait a moment and try again.");
      return;
    }

    setSavingStatus(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await updateDefectStatus(selectedDefect.id, {
        new_status: statusDraft,
        remarks: remarks || null,
        updated_by: supervisorUser.id
      });
      setSelectedDefect(updated);
      const [summaryData, filteredDefects, everyDefect] = await Promise.all([
        getDashboardSummary(),
        getDefects({
          status: statusFilter,
          severity: severityFilter,
          component: componentFilter
        }),
        getDefects()
      ]);
      setSummary(summaryData);
      setDefects(filteredDefects);
      setAllDefects(everyDefect);
      setRemarks("");
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not update defect status.");
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleTranscribeAudio() {
    if (!selectedDefect) return;

    setTranscribing(true);
    setError(null);
    setNotice(null);
    try {
      const response = await transcribeDefectAudio(selectedDefect.id);
      if (response.defect) {
        setSelectedDefect(response.defect);
        const [summaryData, filteredDefects, everyDefect] = await Promise.all([
          getDashboardSummary(),
          getDefects({
            status: statusFilter,
            severity: severityFilter,
            component: componentFilter
          }),
          getDefects()
        ]);
        setSummary(summaryData);
        setDefects(filteredDefects);
        setAllDefects(everyDefect);
      }
      setNotice(response.message);
    } catch (transcribeError) {
      setError(transcribeError instanceof Error ? transcribeError.message : "Could not transcribe audio.");
    } finally {
      setTranscribing(false);
    }
  }

  return (
    <AppShell
      title="Supervisor Dashboard"
      subtitle="Review defect logs, inspect media evidence, and move issues through status."
    >
      {demoUsersError ? (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">{demoUsersError}</div>
      ) : null}
      {error ? (
        <div className="rounded-lg bg-rose-50 p-4 text-sm leading-6 text-rose-700">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
          {notice}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total" value={summary?.total_defects ?? 0} helper="All logged defects" />
        <StatCard label="Open" value={summary?.open_defects ?? 0} helper="Awaiting review" />
        <StatCard label="In progress" value={summary?.in_progress_defects ?? 0} helper="Under action" />
        <StatCard label="Resolved" value={summary?.resolved_defects ?? 0} helper="Work completed" tone="success" />
        <StatCard label="Critical" value={summary?.critical_defects ?? 0} helper="Needs priority" tone="critical" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="panel p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Defect table</h2>
              <p className="mt-1 text-sm text-slate-500">
                Filter and select a row to inspect evidence. Status updates are saved as{" "}
                {demoUsersLoading ? "loading supervisor..." : supervisorUser?.name || "Suresh Patil"}.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-1">
                <span className="field-label">Status</span>
                <select
                  className="field-input"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as DefectStatus | "")}
                >
                  <option value="">All</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="field-label">Severity</span>
                <select
                  className="field-input"
                  value={severityFilter}
                  onChange={(event) => setSeverityFilter(event.target.value as Severity | "")}
                >
                  <option value="">All</option>
                  {SEVERITY_OPTIONS.map((severity) => (
                    <option key={severity} value={severity}>
                      {severity}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="field-label">Component</span>
                <select
                  className="field-input"
                  value={componentFilter}
                  onChange={(event) => setComponentFilter(event.target.value)}
                >
                  <option value="">All</option>
                  {componentOptions.map((component) => (
                    <option key={component} value={component}>
                      {component}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5">
            {loading ? (
              <LoadingBlock message="Loading defects from the backend..." />
            ) : (
              <DefectTable defects={defects} selectedId={selectedDefect?.id} onSelect={handleSelect} />
            )}
          </div>
        </div>

        <DefectDetail
          defect={selectedDefect}
          loading={detailLoading}
          statusDraft={statusDraft}
          remarks={remarks}
          saving={savingStatus}
          saveDisabled={demoUsersLoading || !supervisorUser}
          whisperEnabled={health?.whisper_enabled === true}
          transcribing={transcribing}
          onStatusChange={setStatusDraft}
          onRemarksChange={setRemarks}
          onSave={handleStatusUpdate}
          onTranscribe={handleTranscribeAudio}
        />
      </section>
    </AppShell>
  );
}

type DefectDetailProps = {
  defect: DefectLog | null;
  loading: boolean;
  statusDraft: DefectStatus;
  remarks: string;
  saving: boolean;
  saveDisabled: boolean;
  whisperEnabled: boolean;
  transcribing: boolean;
  onStatusChange: (status: DefectStatus) => void;
  onRemarksChange: (remarks: string) => void;
  onSave: () => void;
  onTranscribe: () => void;
};

function DefectDetail({
  defect,
  loading,
  statusDraft,
  remarks,
  saving,
  saveDisabled,
  whisperEnabled,
  transcribing,
  onStatusChange,
  onRemarksChange,
  onSave,
  onTranscribe
}: DefectDetailProps) {
  const audioFiles = defect?.media_files.filter((file) => file.file_type === "audio") || [];
  const imageFiles = defect?.media_files.filter((file) => file.file_type === "image") || [];

  return (
    <aside className="panel p-5">
      <h2 className="text-lg font-semibold text-slate-950">Defect detail</h2>
      {loading ? <p className="mt-4 text-sm text-slate-500">Loading selected defect...</p> : null}
      {!loading && !defect ? (
        <p className="mt-4 text-sm leading-6 text-slate-500">Select a defect to review transcript and media evidence.</p>
      ) : null}
      {!loading && defect ? (
        <div className="mt-4 grid gap-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">{defect.defect_code}</p>
            <p className="mt-1 text-sm text-slate-600">
              {defect.train_number} / {defect.coach_number || "coach not detected"} / {defect.component_name}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-900">{defect.defect_type}</p>
            <p className="mt-1 text-sm text-slate-600">{defect.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Transcript</h3>
            <p className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">
              {defect.raw_transcript}
            </p>
            {defect.translated_text ? (
              <>
                <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  English translation
                </h3>
                <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">
                  {defect.translated_text}
                </p>
              </>
            ) : null}
          </div>

          <div className="grid gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Audio evidence</h3>
            {whisperEnabled ? (
              <button
                type="button"
                className="secondary-button justify-self-start"
                onClick={onTranscribe}
                disabled={transcribing || audioFiles.length === 0}
              >
                {transcribing ? "Transcribing..." : "Transcribe and translate audio"}
              </button>
            ) : null}
            {audioFiles.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No audio uploaded. Upload audio from the Inspector page to attach evidence.
              </p>
            ) : (
              audioFiles.map((file) => (
                <audio key={file.id} controls src={mediaUrl(file.file_path)} className="w-full" />
              ))
            )}
          </div>

          <div className="grid gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Image evidence</h3>
            {imageFiles.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No image uploaded.
              </p>
            ) : (
              <div className="grid gap-3">
                {imageFiles.map((file) => (
                  <img
                    key={file.id}
                    src={mediaUrl(file.file_path)}
                    alt={file.original_filename}
                    className="max-h-72 w-full rounded-lg border border-slate-200 object-contain"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <label className="grid gap-2">
              <span className="field-label">Update status</span>
              <select
                className="field-input"
                value={statusDraft}
                onChange={(event) => onStatusChange(event.target.value as DefectStatus)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="field-label">Remarks</span>
              <textarea
                className="field-input min-h-20 resize-y"
                value={remarks}
                onChange={(event) => onRemarksChange(event.target.value)}
                placeholder="Optional supervisor note"
              />
            </label>
            <button type="button" className="primary-button" onClick={onSave} disabled={saving || saveDisabled}>
              {saving ? "Saving..." : "Save status"}
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
