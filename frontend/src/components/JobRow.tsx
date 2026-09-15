import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi } from "../api/jobs";
import type { Job, JobStatus } from "../api/jobs";

const STATUS_STYLES: Record<JobStatus, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  running:   "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed:    "bg-red-100 text-red-800",
};

const NEXT_STATUSES: Record<JobStatus, JobStatus[]> = {
  pending:   ["running"],
  running:   ["completed", "failed"],
  completed: [],
  failed:    [],
};

interface Props {
  job: Job;
}

export function JobRow({ job }: Props) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: (status: JobStatus) => jobsApi.updateStatus(job.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobCounts"] });
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.message ?? "Failed to update status");
    },
  });

  const { mutate: deleteJob, isPending: isDeleting } = useMutation({
    mutationFn: () => jobsApi.remove(job.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobCounts"] });
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.message ?? "Failed to delete job");
    },
  });

  const nextStatuses = NEXT_STATUSES[job.status];
  const isbusy = isUpdating || isDeleting;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4 text-sm text-gray-800 max-w-xs truncate">{job.title}</td>
      <td className="py-3 px-4">
        <span className="text-xs font-medium bg-gray-100 text-gray-600 rounded px-2 py-0.5 capitalize">
          {job.type}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 capitalize ${STATUS_STYLES[job.status]}`}>
          {job.status}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-gray-500">
        {new Date(job.createdAt).toLocaleString()}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 flex-wrap">
          {nextStatuses.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={isbusy}
              className="text-xs px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors capitalize"
            >
              → {s}
            </button>
          ))}
          {nextStatuses.length === 0 && (
            <span className="text-xs text-gray-400 italic">Terminal</span>
          )}
          <button
            onClick={() => deleteJob()}
            disabled={isbusy}
            className="text-xs px-2.5 py-1 rounded border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto"
          >
            Delete
          </button>
        </div>
        {actionError && (
          <p className="text-red-500 text-xs mt-1">{actionError}</p>
        )}
      </td>
    </tr>
  );
}
