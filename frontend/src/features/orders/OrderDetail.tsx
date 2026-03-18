'use client';

import type { Order } from '@/types';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderDetailProps {
  order: Order;
}

const currencyFormatter = new Intl.NumberFormat('vi-VN');

function formatDate(value?: string): string {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';

  return parsed.toLocaleString('vi-VN');
}

export function OrderDetail({ order }: OrderDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h2>
          <p className="text-gray-600">{formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold mb-2">Delivery Address</h3>
        <p className="text-gray-700">{order.deliveryAddress || '-'}</p>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Items</h3>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">
                  {currencyFormatter.format(item.unitPrice)} VND x {item.quantity}
                </p>
              </div>
              <p className="font-semibold">
                {currencyFormatter.format(item.unitPrice * item.quantity)} VND
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between text-xl font-bold">
          <span>Total</span>
          <span className="text-red-600">{currencyFormatter.format(order.totalAmount)} VND</span>
        </div>
      </div>
    </div>
  );
}