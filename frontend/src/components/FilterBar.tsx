import type { JobStatus } from "../api/jobs";

const FILTERS: Array<{ label: string; value: JobStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Running", value: "running" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
];

interface Props {
  activeFilter: JobStatus | "all";
  onChange: (filter: JobStatus | "all") => void;
}

export function FilterBar({ activeFilter, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            activeFilter === f.value
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
