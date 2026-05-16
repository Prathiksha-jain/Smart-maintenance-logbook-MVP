import type {
  DashboardBucket,
  DashboardSummary,
  DefectCreatePayload,
  DefectLog,
  DefectStatusPayload,
  DemoUser,
  HealthStatus,
  MediaFile,
  Severity,
  SourceLanguage,
  TranscriptionResponse
} from "@/lib/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8101";

type DefectFilters = {
  status?: string;
  severity?: Severity | "";
  component?: string;
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store"
    });
  } catch {
    throw new Error(`Could not reach the backend at ${API_BASE_URL}. Start FastAPI on 127.0.0.1:8101 and retry.`);
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body) => body.detail || JSON.stringify(body))
      .catch(() => response.statusText);
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function mediaUrl(filePath: string): string {
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  return `${API_BASE_URL}/${filePath.replace(/^\/+/, "")}`;
}

export function getDemoUsers(): Promise<DemoUser[]> {
  return requestJson<DemoUser[]>("/api/auth/demo-users");
}

export function getHealth(): Promise<HealthStatus> {
  return requestJson<HealthStatus>("/health");
}

export function createDefect(payload: DefectCreatePayload): Promise<DefectLog> {
  return requestJson<DefectLog>("/api/defects", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getDefects(filters: DefectFilters = {}): Promise<DefectLog[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.component) params.set("component", filters.component);
  const query = params.toString();
  return requestJson<DefectLog[]>(`/api/defects${query ? `?${query}` : ""}`);
}

export function getDefect(id: number): Promise<DefectLog> {
  return requestJson<DefectLog>(`/api/defects/${id}`);
}

export function updateDefectStatus(id: number, payload: DefectStatusPayload): Promise<DefectLog> {
  return requestJson<DefectLog>(`/api/defects/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function transcribeDefectAudio(id: number, sourceLanguage: SourceLanguage = "auto"): Promise<TranscriptionResponse> {
  return requestJson<TranscriptionResponse>(`/api/defects/${id}/transcribe`, {
    method: "POST",
    body: JSON.stringify({ source_language: sourceLanguage })
  });
}

export function uploadDefectMedia(id: number, kind: "audio" | "image", file: File): Promise<MediaFile> {
  const data = new FormData();
  data.append("file", file);
  return requestJson<MediaFile>(`/api/defects/${id}/media/${kind}`, {
    method: "POST",
    body: data
  });
}

export function getDashboardSummary(): Promise<DashboardSummary> {
  return requestJson<DashboardSummary>("/api/dashboard/summary");
}

export function getDefectsByComponent(): Promise<DashboardBucket[]> {
  return requestJson<DashboardBucket[]>("/api/dashboard/defects-by-component");
}

export function getDefectsByStatus(): Promise<DashboardBucket[]> {
  return requestJson<DashboardBucket[]>("/api/dashboard/defects-by-status");
}

export function getRecentDefects(severity?: Severity, limit = 10): Promise<DefectLog[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (severity) params.set("severity", severity);
  return requestJson<DefectLog[]>(`/api/dashboard/recent-defects?${params.toString()}`);
}
