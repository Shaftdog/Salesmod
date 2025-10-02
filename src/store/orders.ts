
import { create } from 'zustand';
import type { Order } from '@/lib/types';
import { orders as initialOrders } from '@/lib/data';

type OrdersState = {
  orders: Order[];
  addOrder: (order: Order) => void;
  // In a real app, you would have updateOrder, deleteOrder, etc.
};

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: initialOrders,
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
}));

    