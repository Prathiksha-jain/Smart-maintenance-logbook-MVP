export type Role = "inspector" | "supervisor" | "manager" | "admin";

export type Severity = "Low" | "Medium" | "High" | "Critical";

export type DefectStatus = "Open" | "Reviewed" | "Assigned" | "In Progress" | "Resolved" | "Closed";

export type MediaFileType = "audio" | "image";

export type DemoUser = {
  id: number;
  name: string;
  employee_id: string;
  role: Role;
  created_at: string;
};

export type MediaFile = {
  id: number;
  defect_id: number;
  file_type: MediaFileType;
  file_path: string;
  original_filename: string;
  uploaded_at: string;
};

export type DefectLog = {
  id: number;
  defect_code: string;
  train_number: string;
  coach_number: string | null;
  component_name: string;
  defect_type: string;
  severity: Severity;
  description: string;
  raw_transcript: string;
  translated_text: string | null;
  status: DefectStatus;
  location: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  media_files: MediaFile[];
};

export type DefectCreatePayload = {
  train_number: string;
  coach_number?: string | null;
  location?: string | null;
  raw_transcript: string;
  created_by: number;
};

export type DefectStatusPayload = {
  new_status: DefectStatus;
  remarks?: string | null;
  updated_by: number;
};

export type DashboardSummary = {
  total_defects: number;
  open_defects: number;
  in_progress_defects: number;
  resolved_defects: number;
  critical_defects: number;
};

export type DashboardBucket = {
  label: string;
  count: number;
};

export type HealthStatus = {
  status: string;
  app: string;
  environment: string;
  database: string;
  host: string;
  port: number;
  whisper_enabled: boolean;
};

export type TranscriptionResponse = {
  message: string;
  defect: DefectLog | null;
};

export const STATUS_OPTIONS: DefectStatus[] = [
  "Open",
  "Reviewed",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed"
];

export const SEVERITY_OPTIONS: Severity[] = ["Low", "Medium", "High", "Critical"];
