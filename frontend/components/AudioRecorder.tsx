"use client";

import { useEffect, useRef, useState } from "react";

type AudioRecorderProps = {
  disabled?: boolean;
  onFileSelected: (file: File | null) => void;
};

export default function AudioRecorder({ disabled = false, onFileSelected }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices);
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [audioUrl]);

  async function startRecording() {
    setError(null);
    if (!isSupported) {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `inspection-audio-${Date.now()}.webm`, {
          type: blob.type || "audio/webm"
        });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(file));
        onFileSelected(file);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setError("Microphone access was blocked or unavailable.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    onFileSelected(file);
    setError(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(file ? URL.createObjectURL(file) : null);
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-3">
        {!isRecording ? (
          <button type="button" className="secondary-button" onClick={startRecording} disabled={disabled}>
            Start recording
          </button>
        ) : (
          <button type="button" className="secondary-button" onClick={stopRecording} disabled={disabled}>
            Stop recording
          </button>
        )}
        <label className="secondary-button cursor-pointer">
          Upload audio
          <input
            type="file"
            accept=".wav,.mp3,.m4a,.webm,audio/*"
            className="sr-only"
            onChange={handleUpload}
            disabled={disabled}
          />
        </label>
      </div>
      {isRecording ? <p className="text-sm font-medium text-rose-700">Recording in progress...</p> : null}
      {!isSupported ? (
        <p className="text-sm text-amber-700">MediaRecorder is unavailable, but audio upload still works.</p>
      ) : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {audioUrl ? <audio controls src={audioUrl} className="w-full" /> : null}
    </div>
  );
}
