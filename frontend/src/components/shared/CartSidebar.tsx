'use client';

import { X, Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items?: CartItem[];
}

export function CartSidebar({ isOpen, onClose, items = [] }: CartSidebarProps) {
  const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[100]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-gray-50 flex flex-col z-[110] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-bold text-gray-900">Giỏ hàng của bạn</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-gray-300" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-500">Giỏ hàng đang trống</p>
                    <p className="text-sm text-gray-400">Tiếp tục mua sắm</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                      <div className="relative w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                          <button className="text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-red-600 text-sm">
                            {item.price.toLocaleString()}đ
                          </span>
                          <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                            <button className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 bg-white rounded-full shadow-sm">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                            <button className="w-6 h-6 flex items-center justify-center text-white bg-red-600 hover:bg-red-700 rounded-full shadow-sm">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="bg-white border-t border-gray-100 p-4 pb-8 space-y-4 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Tổng cộng</span>
                  <span className="text-2xl font-black text-red-600">
                    {totalAmount.toLocaleString()}đ
                  </span>
                </div>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white rounded-full py-6 text-lg font-bold">
                  Thanh toán ngay <span className="ml-2">›</span>
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}