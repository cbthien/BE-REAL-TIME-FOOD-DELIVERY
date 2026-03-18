'use client';

import { useState } from 'react';
import { TicketCard } from './TicketCard';
import { useTickets } from './useTickets';
import { ticketService } from './ticket.service';
import { Spinner } from '@/components/ui';

export function TicketQueue() {
  const { tickets, loading, error, refetch } = useTickets();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleAction = async (
    ticketId: string,
    action: 'accept' | 'complete' | 'reject'
  ) => {
    setProcessing(ticketId);
    try {
      if (action === 'accept') await ticketService.acceptTicket(ticketId);
      if (action === 'complete') await ticketService.completeTicket(ticketId);
      if (action === 'reject') {
        const reason = prompt('Reason for rejection:');
        if (!reason) return;
        await ticketService.rejectTicket(ticketId, reason);
      }
      await refetch();
    } catch (err) {
      alert(`Failed to ${action} ticket: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No tickets in queue</p>
        <p className="text-sm mt-2">New orders will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          onAction={processing === ticket.id ? undefined : handleAction}
        />
      ))}
    </div>
  );
}
