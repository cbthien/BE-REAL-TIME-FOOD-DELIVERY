'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { TicketCard, ticketService } from '@/features/staff';
import type { StaffTicket } from '@/features/staff/ticket.service';

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<StaffTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [processing, setProcessing] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ticketService.getAll();
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refetch();
    const interval = setInterval(() => {
      void refetch();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const activeOrders = useMemo(
    () => orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.orderStatus)),
    [orders]
  );
  const historyOrders = useMemo(
    () => orders.filter((o) => ['DELIVERED', 'CANCELLED'].includes(o.orderStatus)),
    [orders]
  );
  const displayOrders = activeTab === 'active' ? activeOrders : historyOrders;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Xử lý đơn (Kitchen Queue)</h1>

      <div className="flex space-x-1 mb-6 bg-gray-100/50 p-1.5 rounded-xl">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'active'
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Đang xử lý ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'history'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Lịch sử ({historyOrders.length})
        </button>
      </div>

      {loading && !orders.length && (
        <div className="flex justify-center py-12">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      )}

      {error && <p className="text-center text-red-600 py-4">{error}</p>}

      {!error && !loading && displayOrders.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
            <ClipboardList className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {activeTab === 'active' ? 'Chưa có đơn cần xử lý' : 'Chưa có lịch sử'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {activeTab === 'active'
              ? 'Đơn mới sẽ xuất hiện ở đây.'
              : 'Các đơn đã hủy / đã giao sẽ hiển thị ở đây.'}
          </p>
        </div>
      )}

      {!error && displayOrders.length > 0 && (
        <div className="space-y-4">
          {displayOrders.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onAction={
                processing === ticket.id
                  ? undefined
                  : async (ticketId, action, driverId) => {
                      setProcessing(ticketId);
                      try {
                        if (action === 'accept') await ticketService.acceptTicket(ticketId);
                        if (action === 'start') await ticketService.startCooking(ticketId);
                        if (action === 'complete') await ticketService.completeTicket(ticketId);
                        if (action === 'reject') await ticketService.rejectTicket(ticketId);
                        if (action === 'assign' && driverId) await ticketService.assignDriver(ticketId, driverId);
                        await refetch();
                      } finally {
                        setProcessing(null);
                      }
                    }
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
