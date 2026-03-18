import { api } from '@/lib/api';
import type { KitchenTicket, TicketAction } from '@/types';

export const ticketService = {
  async getQueue(): Promise<KitchenTicket[]> {
    return api.get<KitchenTicket[]>('/staff/queue');
  },

  async acceptTicket(ticketId: string, notes?: string): Promise<KitchenTicket> {
    return api.patch<KitchenTicket>(`/staff/queue/${ticketId}/accept`, { notes });
  },

  async completeTicket(ticketId: string, notes?: string): Promise<KitchenTicket> {
    return api.patch<KitchenTicket>(`/staff/queue/${ticketId}/complete`, { notes });
  },

  async rejectTicket(ticketId: string, reason: string): Promise<KitchenTicket> {
    return api.patch<KitchenTicket>(`/staff/queue/${ticketId}/reject`, { reason });
  },
};
