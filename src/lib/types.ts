import type { CompetencyId } from "@/content/types";

export type Role = "teacher" | "admin";

export type BenchmarkWindow = "closed" | "pre" | "post";

export interface School {
  id: string;
  name: string;
  slug: string;
  district: string;
  city: string;
  state: string;
  monogram: string;
  brand_accent: string;
  plan: string;
  licensed_students: number;
  term_starts_on: string;
  term_renews_on: string;
  contact_name: string;
  contact_email: string;
  retention_months: number;
  /** 'closed' | 'pre' | 'post' — which check-in window is open, if any. */
  benchmark_window: BenchmarkWindow;
  created_at: string;
}

export interface User {
  id: string;
  school_id: string;
  role: Role;
  name: string;
  email: string;
  title: string;
  created_at: string;
}

export interface Classroom {
  id: string;
  school_id: string;
  teacher_id: string;
  name: string;
  grade: number;
  join_code: string;
  school_year: string;
  created_at: string;
  archived_at: string | null;
}

export interface Student {
  id: string;
  class_id: string;
  display_name: string;
  avatar_key: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  class_id: string;
  mission_id: string;
  assigned_by: string;
  assigned_at: string;
  due_on: string | null;
  note: string | null;
}

export type EvidenceResult = "demonstrated" | "developing";
export type EvidenceMap = Record<string, EvidenceResult>;
export interface PathStep {
  sceneId: string;
  choiceId: string;
}

export interface Attempt {
  id: string;
  student_id: string;
  mission_id: string;
  started_at: string;
  completed_at: string | null;
  path: PathStep[];
  evidence: EvidenceMap;
}

export interface BenchmarkRecord {
  id: string;
  student_id: string;
  form: "pre" | "post";
  started_at: string;
  completed_at: string | null;
  responses: Record<string, string>;
}

export interface CertificationRecord {
  id: string;
  user_id: string;
  answers: Record<string, string>;
  completed_at: string | null;
}

export interface AuditEntry {
  id: string;
  school_id: string;
  actor_label: string;
  action: string;
  detail: string;
  created_at: string;
}

export interface CompetencyBreakdown {
  competency: CompetencyId;
  /** Skills demonstrated at least once, out of the competency's total. */
  demonstrated: number;
  developing: number;
  total: number;
}
