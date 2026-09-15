import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { jobsApi } from "./api/jobs";
import type { JobStatus } from "./api/jobs";
import { StatusSummaryBar } from "./components/StatusSummaryBar";
import { FilterBar } from "./components/FilterBar";
import { CreateJobForm } from "./components/CreateJobForm";
import { JobTable } from "./components/JobTable";

export default function App() {
  const [filter, setFilter] = useState<JobStatus | "all">("all");

  const {
    data: jobs = [],
    isLoading: jobsLoading,
    error: jobsError,
  } = useQuery({
    queryKey: ["jobs", filter],
    queryFn: () => jobsApi.getAll(filter === "all" ? undefined : filter),
    refetchInterval: 10000, // Poll every 10s for freshness
  });

  const {
    data: counts = { pending: 0, running: 0, completed: 0, failed: 0 },
    isLoading: countsLoading,
  } = useQuery({
    queryKey: ["jobCounts"],
    queryFn: jobsApi.getCounts,
    refetchInterval: 10000,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <h1 className="text-xl font-bold text-gray-900">Job Queue Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monitor and manage background jobs</p>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        <StatusSummaryBar counts={counts} isLoading={countsLoading} />
        <CreateJobForm />
        <FilterBar activeFilter={filter} onChange={setFilter} />
        <JobTable
          jobs={jobs}
          isLoading={jobsLoading}
          error={jobsError as Error | null}
        />
      </main>
    </div>
  );
}
