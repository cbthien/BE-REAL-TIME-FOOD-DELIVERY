'use client';

import { useRouter } from 'next/navigation';
import { CartList, CartSummary, useCart } from '@/features/cart';
import { orderService } from '@/features/orders';
import { useState } from 'react';

export default function CartPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      alert('Please enter delivery address');
      return;
    }

    setLoading(true);
    try {
      const order = await orderService.create({
        items,
        deliveryAddress,
      });
      clearCart();
      router.push(`/orders/${order.id}`);
    } catch (error) {
      alert('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CartList />
          {items.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                Delivery Address
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter your delivery address"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          )}
        </div>
        <div>
          <CartSummary onCheckout={handleCheckout} />
          {loading && <p className="text-center mt-4 text-gray-600">Placing order...</p>}
        </div>
      </div>
    </div>
  );
}

