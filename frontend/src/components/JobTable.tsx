import type { Job } from "../api/jobs";
import { JobRow } from "./JobRow";

interface Props {
  jobs: Job[];
  isLoading: boolean;
  error: Error | null;
}

export function JobTable({ jobs, isLoading, error }: Props) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16 text-gray-400 text-sm">
        Loading jobs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
        <strong>Error:</strong>{" "}
        {(error as any)?.response?.data?.message ?? error.message ?? "Failed to load jobs"}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex justify-center items-center py-16 text-gray-400 text-sm">
        No jobs found. Create one above!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
            <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
            <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created At</th>
            <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
