'use client';

import { JobList } from '@/features/driver';
import { PageContainer } from '@/components/layout';

export default function DriverJobsPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Delivery Jobs</h1>
          <p className="text-gray-600">Track and manage your active deliveries</p>
        </div>
        
        <JobList />
      </div>
    </PageContainer>
  );
}

