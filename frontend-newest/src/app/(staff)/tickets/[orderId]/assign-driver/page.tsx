'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Bike, CheckCircle2, Loader2, PhoneCall, UserRound } from 'lucide-react';
import { toast } from 'react-toastify';
import { PageContainer } from '@/components/layout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { staffService } from '@/features/staff';
import type { StaffAvailableDriver, StaffOrderResponse } from '@/features/staff/staff.service';
import { cn } from '@/lib/utils';

const currencyFormatter = new Intl.NumberFormat('vi-VN');
const DRIVER_POLLING_INTERVAL_MS = 5000;

export default function AssignDriverPage() {
  const router = useRouter();
  const params = useParams<{ orderId?: string | string[] }>();
  const rawOrderId = params?.orderId;
  const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;

  const [order, setOrder] = useState<StaffOrderResponse | null>(null);
  const [drivers, setDrivers] = useState<StaffAvailableDriver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousDriverOnlineMapRef = useRef<Record<string, boolean>>({});
  const pollingInFlightRef = useRef(false);

  const loadAssignData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!orderId) return;
      if (silent && pollingInFlightRef.current) return;

      if (silent) {
        pollingInFlightRef.current = true;
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const [orderData, driverData] = await Promise.all([
          staffService.getOrderById(orderId),
          staffService.getAvailableDrivers(),
        ]);

        setOrder(orderData);
        setDrivers(driverData);

        const nextOnlineMap: Record<string, boolean> = {};
        const justWentOnlineNames: string[] = [];

        for (const driver of driverData) {
          const driverId = String(driver.userId ?? '');
          const isOnline = Boolean(driver.isOnline);
          nextOnlineMap[driverId] = isOnline;

          const previousOnline = previousDriverOnlineMapRef.current[driverId];
          if (previousOnline === false && isOnline) {
            justWentOnlineNames.push(driver.fullName || `Driver #${driverId}`);
          }
        }

        previousDriverOnlineMapRef.current = nextOnlineMap;

        console.info('[AssignDriverPage.load] ready', {
          orderId,
          orderStatus: orderData?.status,
          driverCount: driverData.length,
          silent,
        });

        if (justWentOnlineNames.length > 0) {
          console.info('[AssignDriverPage.driver_status_changed]', {
            orderId,
            wentOnline: justWentOnlineNames,
          });
          toast.info(`Driver online: ${justWentOnlineNames.join(', ')}`);
          router.refresh();
        }
      } catch (err) {
        console.error('[AssignDriverPage.load] failed', { orderId, silent, err });
        if (!silent) {
          setError(err instanceof Error ? err.message : 'Failed to load assign-driver data.');
        }
      } finally {
        if (silent) {
          pollingInFlightRef.current = false;
        } else {
          setLoading(false);
        }
      }
    },
    [orderId, router],
  );

  useEffect(() => {
    if (!orderId) {
      setError('Missing order id.');
      setLoading(false);
      return;
    }

    void loadAssignData({ silent: false });
  }, [orderId, loadAssignData]);

  useEffect(() => {
    if (!orderId) return;

    const intervalId = setInterval(() => {
      void loadAssignData({ silent: true });
    }, DRIVER_POLLING_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [orderId, loadAssignData]);

  useEffect(() => {
    if (!selectedDriverId) return;
    const stillExists = drivers.some((driver) => String(driver.userId ?? '') === selectedDriverId);
    if (!stillExists) {
      setSelectedDriverId('');
    }
  }, [drivers, selectedDriverId]);

  const isReadyOrder = (order?.status ?? '').toUpperCase() === 'READY';

  const canAssign = useMemo(() => {
    if (!order) return false;
    if (!isReadyOrder) return false;
    if (!selectedDriverId.trim()) return false;
    return true;
  }, [order, isReadyOrder, selectedDriverId]);

  const handleAssign = async () => {
    if (!orderId || !canAssign) return;
    setAssigning(true);
    try {
      console.info('[AssignDriverPage.assign] request_start', {
        endpoint: `/staff/orders/${orderId}/assign-driver`,
        payload: { driverId: selectedDriverId },
      });
      await staffService.assignDriver(orderId, selectedDriverId);
      console.info('[AssignDriverPage.assign] request_success', {
        orderId,
        driverId: selectedDriverId,
      });
      toast.success(`Driver assigned to order #${orderId}`);
      router.push('/tickets');
      router.refresh();
    } catch (err) {
      console.error('[AssignDriverPage.assign] failed', { orderId, selectedDriverId, err });
      toast.error(err instanceof Error ? err.message : 'Assign driver failed.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assign Driver</h1>
            <p className="text-sm text-gray-600">
              Select one available driver and assign to this READY order.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/tickets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Kitchen Queue
          </Button>
        </div>

        {loading && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading order and drivers...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && order && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader className="space-y-2 border-b border-gray-100">
                <p className="text-xl font-bold text-gray-900">Order #{order.id}</p>
                <Badge variant="outline" className="w-fit border-green-200 bg-green-50 text-green-700">
                  {order.status}
                </Badge>
                {!isReadyOrder && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                    This order is not READY, so assigning a driver is disabled.
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-sm">
                <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Customer</p>
                  <p className="mt-1 font-semibold text-gray-900">{order.customer?.fullName || '-'}</p>
                  <p className="text-gray-600">{order.customer?.phone || '-'}</p>
                </div>
                <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Payment</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {order.paymentMethod || '-'} / {order.paymentStatus || '-'}
                  </p>
                </div>
                <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
                  <p className="mt-1 text-lg font-bold text-red-600">
                    {currencyFormatter.format(order.totalAmount)} VND
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4 lg:col-span-2">
              <Card>
                <CardHeader className="border-b border-gray-100">
                  <p className="text-lg font-semibold text-gray-900">
                    Available Drivers ({drivers.length})
                  </p>
                </CardHeader>
                <CardContent className="pt-4">
                  {drivers.length === 0 && (
                    <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                      No available drivers at the moment.
                    </div>
                  )}

                  {drivers.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {drivers.map((driver) => {
                        const driverId = String(driver.userId ?? '');
                        const isSelected = selectedDriverId === driverId;
                        return (
                          <button
                            key={driverId}
                            type="button"
                            onClick={() => {
                              setSelectedDriverId(driverId);
                              console.info('[AssignDriverPage.select_driver]', {
                                orderId,
                                driverId,
                              });
                            }}
                            className={cn(
                              'rounded-lg border p-4 text-left transition',
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40',
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {driver.fullName || `Driver #${driverId}`}
                                </p>
                                <p className="truncate text-xs text-gray-500">{driver.email || '-'}</p>
                              </div>
                              <Badge
                                className={
                                  driver.isOnline
                                    ? 'bg-emerald-600 text-white'
                                    : 'border border-gray-300 bg-white text-gray-600'
                                }
                              >
                                {driver.isOnline ? 'Online' : 'Offline'}
                              </Badge>
                            </div>

                            <div className="mt-3 space-y-1 text-xs text-gray-600">
                              <p className="flex items-center gap-2">
                                <UserRound className="h-3.5 w-3.5 text-gray-400" />
                                <span>{driver.phone || 'No phone'}</span>
                              </p>
                              <p className="flex items-center gap-2">
                                <Bike className="h-3.5 w-3.5 text-gray-400" />
                                <span>
                                  {driver.vehicleType || 'Vehicle N/A'}
                                  {driver.licensePlate ? ` - ${driver.licensePlate}` : ''}
                                </span>
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-wrap items-center justify-end gap-3">
                {selectedDriverId && (
                  <p className="text-sm text-gray-600">
                    Selected driver ID: <span className="font-semibold text-gray-900">{selectedDriverId}</span>
                  </p>
                )}
                <Button variant="outline" onClick={() => router.push('/tickets')} disabled={assigning}>
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleAssign()}
                  disabled={!canAssign || assigning}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400"
                >
                  {assigning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Assign Order
                </Button>
              </div>

              {order.customer?.phone && (
                <a
                  href={`tel:${order.customer.phone}`}
                  className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Call customer before assign
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
