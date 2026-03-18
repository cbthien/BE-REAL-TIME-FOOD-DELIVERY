'use client';

import { useState } from 'react';
import { JobCard } from './JobCard';
import { useJobs } from './useJobs';
import { jobService } from './job.service';
import { Spinner } from '@/components/ui';

export function JobList() {
  const { jobs, loading, error, refetch } = useJobs();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleAction = async (
    jobId: string,
    action: 'accept' | 'pickup' | 'deliver'
  ) => {
    setProcessing(jobId);
    try {
      if (action === 'accept') await jobService.acceptJob(jobId);
      if (action === 'pickup') await jobService.pickupJob(jobId);
      if (action === 'deliver') await jobService.deliverJob(jobId);
      await refetch();
    } catch (err) {
      alert(`Failed to ${action} job: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No active deliveries</p>
        <p className="text-sm mt-2">Check back later for new jobs</p>
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => j.status !== 'DELIVERED' && j.status !== 'CANCELLED');
  const completedJobs = jobs.filter((j) => j.status === 'DELIVERED');

  return (
    <div className="space-y-6">
      {activeJobs.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Active Deliveries</h2>
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onAction={processing === job.id ? undefined : handleAction}
              />
            ))}
          </div>
        </div>
      )}

      {completedJobs.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Completed Today</h2>
          <div className="space-y-4">
            {completedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
