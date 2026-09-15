import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi } from "../api/jobs";
import type { JobType, CreateJobPayload } from "../api/jobs";
import { v4 as uuidv4 } from "uuid";

const JOB_TYPES: JobType[] = ["email", "report", "export", "import", "notification"];

export function CreateJobForm() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<JobType>("email");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ payload, key }: { payload: CreateJobPayload; key: string }) =>
      jobsApi.create(payload, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobCounts"] });
      setTitle("");
      setType("email");
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? "Failed to create job");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Generate idempotency key per submission to prevent duplicate jobs on retry
    mutate({ payload: { title, type }, key: uuidv4() });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h2 className="text-base font-semibold text-gray-800 mb-3">Create New Job</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Job title (e.g. Send welcome email)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          minLength={3}
          maxLength={100}
          required
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as JobType)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="bg-gray-900 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Creating..." : "Create Job"}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </form>
  );
}
