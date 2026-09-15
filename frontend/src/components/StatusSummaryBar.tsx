import type { StatusCounts, JobStatus } from "../api/jobs";

interface Props {
  counts: StatusCounts;
  isLoading: boolean;
}

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  running:   { label: "Running",   color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  completed: { label: "Completed", color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  failed:    { label: "Failed",    color: "text-red-700",    bg: "bg-red-50 border-red-200" },
};

export function StatusSummaryBar({ counts, isLoading }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {(Object.keys(STATUS_CONFIG) as JobStatus[]).map((status) => {
        const cfg = STATUS_CONFIG[status];
        return (
          <div
            key={status}
            className={`rounded-lg border p-4 ${cfg.bg} flex flex-col gap-1`}
          >
            <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
            <span className={`text-3xl font-bold ${cfg.color}`}>
              {isLoading ? "—" : counts[status]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
