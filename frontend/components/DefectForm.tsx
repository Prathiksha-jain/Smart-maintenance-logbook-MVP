"use client";

import { useEffect, useState } from "react";

import AudioRecorder from "@/components/AudioRecorder";
import ImageUpload from "@/components/ImageUpload";
import { createDefect, getHealth, transcribeDefectAudio, uploadDefectMedia } from "@/lib/api";
import type { DefectLog, HealthStatus, SourceLanguage } from "@/lib/types";
import { SOURCE_LANGUAGE_OPTIONS } from "@/lib/types";
import { useDemoUser } from "@/lib/useDemoUser";

const SAMPLE_TRANSCRIPTS = [
  "Coach S3 door number two is not closing properly and rubber lining is damaged.",
  "Coach B2 brake pipe leakage near left side connection, needs urgent attention.",
  "Coach A1 electrical panel has spark and smoke smell.",
  "Coach S5 seat cushion is damaged near berth number 42."
];

export default function DefectForm() {
  const { getUserForRole, loading: usersLoading, error: usersError } = useDemoUser();
  const [trainNumber, setTrainNumber] = useState("");
  const [coachNumber, setCoachNumber] = useState("");
  const [location, setLocation] = useState("");
  const [rawTranscript, setRawTranscript] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<SourceLanguage>("hi");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [createdDefect, setCreatedDefect] = useState<DefectLog | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);
  const inspectorUser = getUserForRole("inspector");
  const canSubmit = Boolean(trainNumber.trim() && (rawTranscript.trim() || (audioFile && health?.whisper_enabled)));

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((healthStatus) => {
        if (!cancelled) setHealth(healthStatus);
      })
      .catch(() => {
        if (!cancelled) setHealth(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inspectorUser) {
      setError("Demo inspector is not available yet. Please wait a moment and try again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMediaNotice(null);
    setCreatedDefect(null);

    try {
      const defect = await createDefect({
        train_number: trainNumber,
        coach_number: coachNumber || null,
        location: location || null,
        raw_transcript: rawTranscript.trim() || "Pending audio transcription.",
        created_by: inspectorUser.id
      });

      const notices: string[] = [];
      let latestDefect = defect;
      if (audioFile) {
        try {
          await uploadDefectMedia(defect.id, "audio", audioFile);
          if (health?.whisper_enabled) {
            const transcription = await transcribeDefectAudio(defect.id, sourceLanguage);
            if (transcription.defect) {
              latestDefect = transcription.defect;
            }
            notices.push(transcription.message);
          }
        } catch (uploadError) {
          notices.push(uploadError instanceof Error ? uploadError.message : "Audio upload/transcription failed.");
        }
      }
      if (imageFile) {
        try {
          await uploadDefectMedia(defect.id, "image", imageFile);
        } catch (uploadError) {
          notices.push(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
        }
      }

      setCreatedDefect(latestDefect);
      if (notices.length > 0) setMediaNotice(notices.join(" "));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create defect.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
      <form onSubmit={handleSubmit} className="panel grid gap-5 p-5">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Role</p>
          <p className="text-lg font-semibold text-slate-950">
            {usersLoading ? "Loading inspector..." : inspectorUser?.name || "Ramesh Kumar"}
          </p>
          <p className="text-sm text-slate-500">Submitting as the inspector demo user.</p>
          {health?.whisper_enabled ? (
            <p className="text-sm text-emerald-700">
              Whisper is enabled: recorded audio will be transcribed and translated to English after submit.
            </p>
          ) : (
            <p className="text-sm text-slate-500">Whisper is disabled: type a transcript manually for extraction.</p>
          )}
          {usersError ? <p className="text-sm text-amber-700">{usersError}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2">
            <span className="field-label">Train number</span>
            <input
              className="field-input"
              value={trainNumber}
              onChange={(event) => setTrainNumber(event.target.value)}
              placeholder="12951"
              required
            />
          </label>
          <label className="grid gap-2">
            <span className="field-label">Coach number</span>
            <input
              className="field-input"
              value={coachNumber}
              onChange={(event) => setCoachNumber(event.target.value)}
              placeholder="S-3 or B2"
            />
          </label>
          <label className="grid gap-2">
            <span className="field-label">Location</span>
            <input
              className="field-input"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Platform 2"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="field-label">Transcript</span>
          <textarea
            className="field-input min-h-36 resize-y"
            value={rawTranscript}
            onChange={(event) => setRawTranscript(event.target.value)}
            placeholder={
              health?.whisper_enabled
                ? "Optional if recording audio. You can also type: Brake pipe air leakage reported in coach B2 near the coupling."
                : "Brake pipe air leakage reported in coach B2 near the coupling."
            }
          />
        </label>

        <div className="grid gap-2">
          <p className="field-label">Demo transcript shortcuts</p>
          <div className="grid gap-2 md:grid-cols-2">
            {SAMPLE_TRANSCRIPTS.map((transcript) => (
              <button
                key={transcript}
                type="button"
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white"
                onClick={() => setRawTranscript(transcript)}
              >
                {transcript}
              </button>
            ))}
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-950">Audio evidence</h2>
            <p className="mt-1 text-sm text-slate-500">Record from the browser or upload a saved clip.</p>
            {health?.whisper_enabled ? (
              <label className="mt-4 grid gap-2">
                <span className="field-label">Audio language</span>
                <select
                  className="field-input"
                  value={sourceLanguage}
                  onChange={(event) => setSourceLanguage(event.target.value as SourceLanguage)}
                  disabled={isSubmitting}
                >
                  {SOURCE_LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="text-xs leading-5 text-slate-500">
                  Select Hindi or Kannada for better English translation. Use Auto only when unsure.
                </span>
              </label>
            ) : null}
            <div className="mt-4">
              <AudioRecorder disabled={isSubmitting} onFileSelected={setAudioFile} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-950">Image evidence</h2>
            <p className="mt-1 text-sm text-slate-500">Attach a clear image of the defect.</p>
            <div className="mt-4">
              <ImageUpload disabled={isSubmitting} onFileSelected={setImageFile} />
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-md bg-rose-50 p-3 text-sm leading-6 text-rose-700">
            {error}
          </div>
        ) : null}
        {mediaNotice ? <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">{mediaNotice}</div> : null}

        <button
          type="submit"
          className="primary-button w-full sm:w-auto"
          disabled={isSubmitting || usersLoading || !canSubmit}
        >
          {isSubmitting ? "Submitting..." : health?.whisper_enabled ? "Submit and translate audio" : "Submit defect"}
        </button>
      </form>

      <aside className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-950">Extracted result</h2>
        {!createdDefect ? (
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Submit a transcript to see the generated defect code, component, defect type, severity, and normalized
            coach.
          </p>
        ) : (
          <dl className="mt-4 grid gap-3 text-sm">
            <ResultRow label="Defect code" value={createdDefect.defect_code} />
            <ResultRow label="Coach" value={createdDefect.coach_number || "Not detected"} />
            <ResultRow label="Component" value={createdDefect.component_name} />
            <ResultRow label="Defect type" value={createdDefect.defect_type} />
            <ResultRow label="Severity" value={createdDefect.severity} />
            <ResultRow label="Status" value={createdDefect.status} />
            {createdDefect.translated_text ? (
              <ResultRow label="English translation" value={createdDefect.translated_text} />
            ) : null}
            <ResultRow label="Description" value={createdDefect.description} />
          </dl>
        )}
      </aside>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-900">{value}</dd>
    </div>
  );
}
