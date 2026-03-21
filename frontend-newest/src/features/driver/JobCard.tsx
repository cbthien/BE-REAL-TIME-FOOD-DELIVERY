'use client';

import type { DeliveryJob } from '@/types';
import { cn } from '@/lib/utils';
import { Badge, Card } from '@/components/ui';

interface JobCardProps {
  job: DeliveryJob;
  onAction?: (job: DeliveryJob, action: 'pickup' | 'deliver') => void;
  onSelect?: (job: DeliveryJob) => void;
  selected?: boolean;
}

export function JobCard({ job, onAction, onSelect, selected = false }: JobCardProps) {
  const normalizedPaymentMethod = (job.paymentMethod ?? '').trim().toUpperCase();
  const normalizedPaymentStatus = (job.paymentStatus ?? '').trim().toUpperCase();
  const isCashPayment = normalizedPaymentMethod === 'CASH' || normalizedPaymentMethod === 'COD';
  const shouldCollectCash = isCashPayment && normalizedPaymentStatus !== 'PAID';

  const paymentMethodLabel =
    normalizedPaymentMethod === 'CASH' || normalizedPaymentMethod === 'COD'
      ? 'Cash'
      : normalizedPaymentMethod === 'WALLET'
      ? 'Wallet'
      : normalizedPaymentMethod === 'ONLINE'
      ? 'Online'
      : job.paymentMethod || 'Unknown';

  const paymentStatusLabel =
    normalizedPaymentStatus === 'PAID'
      ? 'Paid'
      : normalizedPaymentStatus === 'UNPAID'
      ? 'Unpaid'
      : normalizedPaymentStatus === 'PENDING'
      ? 'Pending'
      : normalizedPaymentStatus === 'FAILED'
      ? 'Failed'
      : job.paymentStatus || 'Unknown';

  const paymentStatusClass =
    normalizedPaymentStatus === 'PAID'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : normalizedPaymentStatus === 'UNPAID' || normalizedPaymentStatus === 'FAILED'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';

  const totalAmountLabel =
    typeof job.totalAmount === 'number'
      ? `${new Intl.NumberFormat('vi-VN').format(job.totalAmount)} VND`
      : null;

  const getStatusBadge = () => {
    switch (job.status) {
      case 'PENDING':
        return <Badge variant="default">Pending</Badge>;
      case 'ASSIGNED':
        return <Badge variant="outline">Assigned</Badge>;
      case 'PICKED_UP':
        return <Badge variant="secondary">Delivering</Badge>;
      case 'DELIVERED':
        return <Badge variant="default">Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{job.status}</Badge>;
    }
  };

  return (
    <Card
      onClick={() => onSelect?.(job)}
      className={cn(
        'cursor-pointer border p-4 transition-all hover:shadow-md',
        selected ? 'border-blue-300 ring-1 ring-blue-300' : 'border-gray-200',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Order #{job.orderId.slice(0, 8)}</h3>
          <p className="text-sm text-gray-600">{new Date(job.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {getStatusBadge()}
          {totalAmountLabel && <p className="text-sm font-semibold text-red-600">{totalAmountLabel}</p>}
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pickup</p>
          <p className="line-clamp-1 text-sm text-gray-900">{job.pickupAddress || 'Store'}</p>
        </div>
        {job.customerName && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customer</p>
            <p className="line-clamp-1 text-sm text-gray-900">
              {job.customerName}
              {job.customerPhone ? ` • ${job.customerPhone}` : ''}
            </p>
          </div>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
          Payment: {paymentMethodLabel}
        </Badge>
        <Badge variant="outline" className={paymentStatusClass}>
          {paymentStatusLabel}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            shouldCollectCash
              ? 'border-orange-200 bg-orange-50 text-orange-700'
              : 'border-blue-200 bg-blue-50 text-blue-700',
          )}
        >
          {shouldCollectCash ? 'Collect cash' : 'No cash collection'}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-blue-600">
          Click card for map and delivery confirmation
        </p>
        {job.status === 'ASSIGNED' && onAction && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onAction(job, 'pickup');
            }}
            className="rounded bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
          >
            Mark Picked Up
          </button>
        )}
      </div>
    </Card>
  );
}

