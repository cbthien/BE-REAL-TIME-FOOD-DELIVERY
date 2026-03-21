'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@/components/ui';
import type { DeliveryJob } from '@/types';
import { ETAOverlay, TrackingMap } from '@/features/tracking';
import { haversineKm } from '@/features/tracking/eta';
import { JobCard } from './JobCard';
import { jobService, type DeliveryJobDetail } from './job.service';
import { useJobs } from './useJobs';

const currencyFormatter = new Intl.NumberFormat('vi-VN');
const DRIVER_ARRIVAL_THRESHOLD_KM = 0.12; // about 120 meters

type PaymentMethodType = 'CASH' | 'WALLET' | 'ONLINE' | 'UNKNOWN';
type PaymentStatusType = 'PAID' | 'UNPAID' | 'PENDING' | 'FAILED' | 'UNKNOWN';

function normalizePaymentMethod(method?: string): PaymentMethodType {
  const normalized = (method ?? '').trim().toUpperCase();
  if (normalized === 'CASH' || normalized === 'COD') return 'CASH';
  if (normalized === 'WALLET') return 'WALLET';
  if (normalized === 'ONLINE') return 'ONLINE';
  return 'UNKNOWN';
}

function normalizePaymentStatus(status?: string): PaymentStatusType {
  const normalized = (status ?? '').trim().toUpperCase();
  if (normalized === 'PAID') return 'PAID';
  if (normalized === 'UNPAID') return 'UNPAID';
  if (normalized === 'PENDING') return 'PENDING';
  if (normalized === 'FAILED') return 'FAILED';
  return 'UNKNOWN';
}

function getPaymentGuidance(detail: DeliveryJobDetail) {
  const method = normalizePaymentMethod(detail.paymentMethod);
  const status = normalizePaymentStatus(detail.paymentStatus);
  const isCash = method === 'CASH';
  const shouldCollectCash = isCash && status !== 'PAID';

  const methodLabel =
    method === 'CASH'
      ? 'Cash on Delivery'
      : method === 'WALLET'
      ? 'Wallet'
      : method === 'ONLINE'
      ? 'Online Payment'
      : detail.paymentMethod || 'Unknown';

  const statusLabel =
    status === 'PAID'
      ? 'Paid'
      : status === 'UNPAID'
      ? 'Unpaid'
      : status === 'PENDING'
      ? 'Payment Pending'
      : status === 'FAILED'
      ? 'Payment Failed'
      : detail.paymentStatus || 'Unknown';

  const statusClass =
    status === 'PAID'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'UNPAID' || status === 'FAILED'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';

  const actionLabel = shouldCollectCash ? 'Collect cash from customer' : 'Do not collect cash';
  const actionClass = shouldCollectCash
    ? 'border-orange-200 bg-orange-50 text-orange-700'
    : 'border-slate-200 bg-slate-50 text-slate-700';

  const note = shouldCollectCash
    ? `Collect ${currencyFormatter.format(detail.totalAmount)} VND when delivering this order.`
    : 'Payment is handled digitally or already paid. Deliver without cash collection.';

  return {
    methodLabel,
    statusLabel,
    statusClass,
    actionLabel,
    actionClass,
    note,
    shouldCollectCash,
  };
}

export function JobList() {
  const { jobs, loading, error, refetch } = useJobs();
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<DeliveryJobDetail | null>(null);
  const [syncingLocation, setSyncingLocation] = useState(false);

  const loadOrderDetail = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);

    try {
      const data = await jobService.getMyOrderDetail(orderId);
      if (!data) {
        setDetailError('Order detail is unavailable.');
        return;
      }
      setDetail(data);
      console.info('[DriverJobList.detail_loaded]', {
        orderId,
        status: data.statusRaw,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
      });
    } catch (err) {
      console.error('[DriverJobList.loadOrderDetail] failed', { orderId, err });
      setDetailError(err instanceof Error ? err.message : 'Failed to load order detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAction = async (job: DeliveryJob, action: 'pickup' | 'deliver') => {
    setProcessing(job.id);
    try {
      try {
        await jobService.updateMyLocation(job.orderId);
      } catch {
        // Ignore GPS failure, still allow status update.
      }

      if (action === 'pickup') {
        await jobService.pickupJob(job.orderId);
        toast.success(`Order #${job.orderId} marked as PICKED_UP`);
      }
      if (action === 'deliver') {
        await jobService.deliverJob(job.orderId);
        toast.success(`Order #${job.orderId} marked as DELIVERED`);
      }

      await refetch();
      if (detailOpen) {
        await loadOrderDetail(job.orderId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to ${action}: ${message}`);
    } finally {
      setProcessing(null);
    }
  };

  const distanceToDestinationKm = useMemo(() => {
    if (!detail?.driverLocation || !detail?.deliveryLocation) return null;
    return haversineKm(
      { lat: detail.driverLocation.lat, lng: detail.driverLocation.lng },
      { lat: detail.deliveryLocation.lat, lng: detail.deliveryLocation.lng },
    );
  }, [detail?.driverLocation, detail?.deliveryLocation]);

  const hasArrivedDestination = useMemo(() => {
    if (distanceToDestinationKm == null) return false;
    return distanceToDestinationKm <= DRIVER_ARRIVAL_THRESHOLD_KM;
  }, [distanceToDestinationKm]);

  const canConfirmDelivered = Boolean(
    detail &&
      detail.status === 'PICKED_UP' &&
      !detail.deliveredAt &&
      !detail.driverConfirmedDelivered &&
      hasArrivedDestination,
  );

  const syncMyLocationForDetail = async (orderId: string) => {
    setSyncingLocation(true);
    try {
      await jobService.updateMyLocation(orderId);
      await loadOrderDetail(orderId);
      console.info('[DriverJobList.location_synced]', { orderId });
    } catch (err) {
      console.error('[DriverJobList.location_sync_failed]', { orderId, err });
      toast.error('Failed to update current location.');
    } finally {
      setSyncingLocation(false);
    }
  };

  useEffect(() => {
    if (!detailOpen || !detail || detail.status !== 'PICKED_UP' || detail.deliveredAt) return;
    const intervalId = setInterval(() => {
      void syncMyLocationForDetail(detail.orderId);
    }, 15000);
    return () => clearInterval(intervalId);
  }, [detailOpen, detail?.orderId, detail?.status, detail?.deliveredAt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-red-600">{error}</p>
        <button
          onClick={refetch}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => j.status !== 'DELIVERED' && j.status !== 'CANCELLED');
  const historyJobs = jobs.filter((j) => j.status === 'DELIVERED' || j.status === 'CANCELLED');
  const displayJobs = activeTab === 'active' ? activeJobs : historyJobs;

  return (
    <div className="space-y-6">
      <div className="mb-2 flex space-x-1 rounded-xl bg-gray-100/50 p-1.5">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'active' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Active ({activeJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          History ({historyJobs.length})
        </button>
      </div>

      {displayJobs.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          <p className="text-lg">
            {activeTab === 'active' ? 'No active deliveries' : 'No delivery history yet'}
          </p>
          {activeTab === 'active' && <p className="mt-2 text-sm">Wait for staff to assign a new order.</p>}
        </div>
      )}

      {displayJobs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {displayJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              selected={selectedOrderId === job.orderId}
              onSelect={(selectedJob) => {
                void loadOrderDetail(selectedJob.orderId);
              }}
              onAction={activeTab === 'active' && processing !== job.id ? handleAction : undefined}
            />
          ))}
        </div>
      )}

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setDetailError(null);
            setDetail(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-[820px]">
          <DialogHeader>
            <DialogTitle>
              {detail ? `Order #${detail.orderId}` : selectedOrderId ? `Order #${selectedOrderId}` : 'Order Detail'}
            </DialogTitle>
          </DialogHeader>

          {detailLoading && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              Loading order detail...
            </div>
          )}

          {!detailLoading && detailError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {detailError}
            </div>
          )}

          {!detailLoading && !detailError && detail && (
            <div className="space-y-4 text-sm">
              {(() => {
                const payment = getPaymentGuidance(detail);
                return (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                    <p className="text-xs uppercase tracking-wide text-blue-700">Payment Guidance</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
                        {payment.methodLabel}
                      </Badge>
                      <Badge variant="outline" className={payment.statusClass}>
                        {payment.statusLabel}
                      </Badge>
                      <Badge variant="outline" className={payment.actionClass}>
                        {payment.actionLabel}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium text-blue-900">{payment.note}</p>
                  </div>
                );
              })()}

              <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Customer</p>
                  <p className="font-semibold text-gray-900">{detail.customerName || '-'}</p>
                  <p className="text-gray-600">{detail.customerPhone || '-'}</p>
                  <p className="text-gray-600">{detail.customerEmail || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Payment</p>
                  <p className="font-semibold text-gray-900">
                    {(detail.paymentMethod || 'Unknown').toUpperCase()} /{' '}
                    {(detail.paymentStatus || 'Unknown').toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                  <Badge variant="outline">{detail.statusRaw}</Badge>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Total Amount</p>
                  <p className="font-semibold text-red-600">{currencyFormatter.format(detail.totalAmount)} VND</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Delivered At</p>
                  <p className="font-semibold text-gray-900">
                    {detail.deliveredAt
                      ? new Date(detail.deliveredAt).toLocaleString('vi-VN')
                      : 'Not delivered yet'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Pickup Address</p>
                  <p className="font-semibold text-gray-900">{detail.pickupAddress || 'Store'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Delivery Address</p>
                  <p className="font-semibold text-gray-900">
                    {detail.deliveryAddress || 'Not provided by backend'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Delivery Route</p>
                    <p className="text-sm font-semibold text-gray-900">
                      Live route from driver to customer destination.
                    </p>
                  </div>
                  {detail.status === 'PICKED_UP' && !detail.deliveredAt && (
                    <Button
                      variant="outline"
                      onClick={() => void syncMyLocationForDetail(detail.orderId)}
                      disabled={syncingLocation}
                    >
                      {syncingLocation ? 'Syncing location...' : 'Update My Location'}
                    </Button>
                  )}
                </div>

                <div className="relative">
                  <TrackingMap
                    deliveryAddress={detail.deliveryAddress || 'Customer Address'}
                    deliveryLocation={detail.deliveryLocation ?? null}
                    driverLocation={
                      detail.driverLocation
                        ? {
                            lat: detail.driverLocation.lat,
                            lng: detail.driverLocation.lng,
                            timestamp: detail.driverLocation.timestamp ?? new Date().toISOString(),
                          }
                        : undefined
                    }
                  />
                  <ETAOverlay
                    driverLocation={
                      detail.driverLocation
                        ? { lat: detail.driverLocation.lat, lng: detail.driverLocation.lng }
                        : null
                    }
                    deliveryLocation={detail.deliveryLocation ?? null}
                  />
                </div>

                {detail.status === 'PICKED_UP' && !detail.deliveredAt && (
                  <div
                    className={`rounded-md border p-3 text-sm ${
                      hasArrivedDestination
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {distanceToDestinationKm == null &&
                      'Driver location or destination coordinates are missing. Confirm Delivered stays hidden.'}
                    {distanceToDestinationKm != null &&
                      !hasArrivedDestination &&
                      `Driver is ${distanceToDestinationKm.toFixed(2)} km away. Move within 0.12 km to enable confirmation.`}
                    {distanceToDestinationKm != null &&
                      hasArrivedDestination &&
                      'Driver arrived near destination. Confirmation is enabled.'}
                  </div>
                )}
              </div>

              <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Items ({detail.items.length})</p>
                {detail.items.length === 0 && (
                  <p className="text-sm text-gray-500">No item details.</p>
                )}
                {detail.items.map((item) => (
                  <div
                    key={item.orderItemId}
                    className="flex items-start justify-between border-b border-gray-100 pb-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{item.quantity}x {item.name}</p>
                      <p className="text-xs text-gray-500">{item.category || '-'}</p>
                      <p className="text-xs text-gray-500">{item.description || '-'}</p>
                    </div>
                    <p className="ml-3 whitespace-nowrap font-semibold text-gray-800">
                      {currencyFormatter.format(item.lineTotal)} VND
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {detail && detail.status === 'ASSIGNED' && (
              <Button
                onClick={() => void handleAction(detail, 'pickup')}
                disabled={processing === detail.id}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                Mark Picked Up
              </Button>
            )}
            {detail && canConfirmDelivered && (
              <Button
                onClick={() => void handleAction(detail, 'deliver')}
                disabled={processing === detail.id}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Confirm Delivered
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

