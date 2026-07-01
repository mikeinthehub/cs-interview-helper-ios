export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  detail?: string;
}

export interface SessionInfo {
  session_id: string;
  path: string;
  created_at: string;
  runtime_status: string;
  mode?: string;
  role?: string;
  active_stage?: string;
}

export interface ParseResumeResult {
  status: string;
  output_dir: string;
  profile: Record<string, unknown> | null;
  source_resume_md: string;
  resume_risks_md: string;
  files: string[];
}

export interface UploadResult {
  filename: string;
  path: string;
  size: number;
  content_type: string;
}

export interface RoleOption {
  id: string;
  label: string;
}

export interface ConfigOption {
  id: string;
  label: string;
  description?: string;
}
