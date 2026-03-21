import { api } from '@/lib/api';
import type { DeliveryJob } from '@/types';

interface BeDriverOrderCustomer {
  userId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

interface BeDriverOrderMenuItem {
  id?: number | string;
  name?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
}

interface BeDriverOrderItem {
  orderItemId: string;
  quantity: number;
  price: number;
  lineTotal?: number;
  menuItem?: BeDriverOrderMenuItem | null;
}

interface BeDriverLocationAddress {
  addressText?: string | null;
  lat?: number | null;
  lng?: number | null;
}

interface BeDriverStoreInfo {
  name?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
}

interface BeDriverOrder {
  id: string;
  customerId: string;
  customer?: BeDriverOrderCustomer | null;
  driverId?: string | null;
  status: string;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  totalAmount: number;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  delivery?: BeDriverLocationAddress | null;
  store?: BeDriverStoreInfo | null;
  deliveryLocation?: { lat: number; lng: number } | null;
  driverLocation?: { lat: number; lng: number; timestamp?: string | null } | null;
  assignedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  driverConfirmedDelivered?: boolean | null;
  customerConfirmedDelivered?: boolean | null;
  items?: BeDriverOrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface DeliveryJobDetailItem {
  orderItemId: string;
  quantity: number;
  price: number;
  lineTotal: number;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
}

export interface DeliveryJobDetail extends DeliveryJob {
  customerEmail?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  totalAmount: number;
  statusRaw: string;
  driverConfirmedDelivered?: boolean;
  customerConfirmedDelivered?: boolean;
  storeName?: string;
  items: DeliveryJobDetailItem[];
  deliveryLocation?: { lat: number; lng: number } | null;
  driverLocation?: { lat: number; lng: number; timestamp?: string | null } | null;
}

function mapBackendStatusToDeliveryStatus(status: string): DeliveryJob['status'] {
  switch (status) {
    case 'READY':
      return 'ASSIGNED';
    case 'PICKED_UP':
      return 'PICKED_UP';
    case 'DELIVERED':
      return 'DELIVERED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return 'ASSIGNED';
  }
}

function mapBeOrderToDetail(be: BeDriverOrder): DeliveryJobDetail {
  const deliveryFromTracking =
    be.delivery?.lat != null && be.delivery?.lng != null
      ? { lat: be.delivery.lat, lng: be.delivery.lng }
      : null;

  const pickupAddress =
    be.pickupAddress?.trim() || be.store?.address?.trim() || 'Store';
  const deliveryAddress =
    be.deliveryAddress?.trim() || be.delivery?.addressText?.trim() || '';

  const items: DeliveryJobDetailItem[] = (be.items ?? []).map((item) => ({
    orderItemId: item.orderItemId,
    quantity: item.quantity,
    price: item.price,
    lineTotal: item.lineTotal ?? item.price * item.quantity,
    name: item.menuItem?.name ?? 'Item',
    description: item.menuItem?.description ?? undefined,
    imageUrl: item.menuItem?.imageUrl ?? undefined,
    category: item.menuItem?.category ?? undefined,
  }));

  return {
    id: be.id,
    orderId: be.id,
    status: mapBackendStatusToDeliveryStatus(be.status),
    pickupAddress,
    deliveryAddress,
    customerName: be.customer?.fullName ?? undefined,
    customerPhone: be.customer?.phone ?? undefined,
    customerEmail: be.customer?.email ?? undefined,
    paymentMethod: be.paymentMethod ?? undefined,
    paymentStatus: be.paymentStatus ?? undefined,
    totalAmount: be.totalAmount ?? 0,
    statusRaw: be.status,
    driverConfirmedDelivered: be.driverConfirmedDelivered ?? undefined,
    customerConfirmedDelivered: be.customerConfirmedDelivered ?? undefined,
    storeName: be.store?.name ?? undefined,
    items,
    createdAt: typeof be.createdAt === 'string' ? be.createdAt : new Date(be.createdAt).toISOString(),
    assignedAt: be.assignedAt ?? undefined,
    pickedUpAt: be.pickedUpAt ?? undefined,
    deliveredAt: be.deliveredAt ?? undefined,
    ...(be.deliveryLocation || deliveryFromTracking
      ? { deliveryLocation: be.deliveryLocation ?? deliveryFromTracking }
      : {}),
    ...(be.driverLocation ? { driverLocation: be.driverLocation } : {}),
  };
}

function mapBeOrderToJob(be: BeDriverOrder): DeliveryJob {
  return mapBeOrderToDetail(be);
}

function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 },
    );
  });
}

export const jobService = {
  async getMyJobs(): Promise<DeliveryJob[]> {
    const data = await api.get<BeDriverOrder[] | BeDriverOrder>('/driver/orders');
    const list = Array.isArray(data) ? data : data ? [data] : [];
    return list.map(mapBeOrderToJob);
  },

  async getMyOrderDetail(orderId: string): Promise<DeliveryJobDetail | null> {
    try {
      const be = await api.get<BeDriverOrder>(`/driver/orders/${orderId}`);
      return mapBeOrderToDetail(be);
    } catch {
      return null;
    }
  },

  async pickupJob(orderId: string): Promise<DeliveryJob> {
    const be = await api.patch<BeDriverOrder>(`/driver/orders/${orderId}/pick-up`);
    return mapBeOrderToJob(be);
  },

  async deliverJob(orderId: string): Promise<DeliveryJob> {
    const be = await api.patch<BeDriverOrder>(`/driver/orders/${orderId}/confirm-delivered`);
    return mapBeOrderToJob(be);
  },

  async updateMyLocation(orderId: string): Promise<void> {
    const { lat, lng } = await getCurrentPosition();
    await api.patch(`/driver/orders/${orderId}/location`, { lat, lng });
  },
};
