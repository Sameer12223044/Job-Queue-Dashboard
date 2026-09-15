import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = axios.create({ baseURL: BASE_URL });

export type JobStatus = "pending" | "running" | "completed" | "failed";
export type JobType = "email" | "report" | "export" | "import" | "notification";

export interface Job {
  id: string;
  title: string;
  type: JobType;
  status: JobStatus;
  createdAt: string;
  version: number;
}

export interface StatusCounts {
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

export interface CreateJobPayload {
  title: string;
  type: JobType;
}

export const jobsApi = {
  getAll: (status?: JobStatus) =>
    api
      .get<Job[]>("/jobs", { params: status ? { status } : undefined })
      .then((r) => r.data),

  getCounts: () => api.get<StatusCounts>("/jobs/counts").then((r) => r.data),

  create: (payload: CreateJobPayload, idempotencyKey?: string) =>
    api
      .post<Job>("/jobs", payload, {
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
      })
      .then((r) => r.data),

  updateStatus: (id: string, status: JobStatus) =>
    api.patch<Job>(`/jobs/${id}/status`, { status }).then((r) => r.data),

  remove: (id: string) => api.delete(`/jobs/${id}`),
};
