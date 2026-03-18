'use client';

import type { KitchenTicket } from '@/types';
import { Badge } from '@/components/ui';

interface TicketCardProps {
  ticket: KitchenTicket;
  onAction?: (ticketId: string, action: 'accept' | 'complete' | 'reject') => void;
}

export function TicketCard({ ticket, onAction }: TicketCardProps) {
  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'IN_PROGRESS':
        return <Badge>In Progress</Badge>;
      case 'READY':
        return <Badge variant="default">Ready</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg">Order #{ticket.orderId.slice(0, 8)}</h3>
          <p className="text-sm text-gray-600">
            {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-2 mb-4">
        <h4 className="font-medium text-sm text-gray-700">Items:</h4>
        {ticket.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="text-gray-600">${item.unitPrice.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {ticket.notes && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <strong>Note:</strong> {ticket.notes}
        </div>
      )}

      <div className="flex gap-2">
        {ticket.status === 'PENDING' && onAction && (
          <>
            <button
              onClick={() => onAction(ticket.id, 'accept')}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => onAction(ticket.id, 'reject')}
              className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Reject
            </button>
          </>
        )}
        {ticket.status === 'IN_PROGRESS' && onAction && (
          <button
            onClick={() => onAction(ticket.id, 'complete')}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Complete
          </button>
        )}
      </div>
    </div>
  );
}
