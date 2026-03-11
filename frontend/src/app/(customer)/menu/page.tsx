'use client';

import { MenuList } from '@/features/menu';
import { useCart } from '@/features/cart';
import type { MenuItem } from '@/types';

export default function MenuPage() {
  const { addItem } = useCart(); // Lấy hàm addItem từ CartContext để thêm món vào giỏ hàng

  const handleAddToCart = (item: MenuItem) => {
    addItem(item);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Our Menu</h1>
      <MenuList onAddToCart={handleAddToCart} />
    </div>
  );
}

