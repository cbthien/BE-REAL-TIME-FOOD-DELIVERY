'use client';

import { useParams } from 'next/navigation';
import { OrderDetail, useOrder } from '@/features/orders';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { order, loading, error } = useOrder(orderId);

  return (
    <div className="container mx-auto px-4 py-8">
      {loading && <p className="text-center text-gray-600">Loading order...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}
      {order && <OrderDetail order={order} />}
    </div>
  );
}
