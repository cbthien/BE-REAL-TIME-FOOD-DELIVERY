export type PaymentMethod = 'COD' | 'ONLINE';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
}

export interface PaymentGateway {
  charge(request: PaymentRequest): Promise<PaymentResult>;
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';
