import { Injectable } from '@nestjs/common';
import {
  PaymentGateway,
  PaymentRequest,
  PaymentResult,
} from '../interfaces/payment-gateway.interface';

@Injectable()
export class MockPaymentAdapter implements PaymentGateway {
  async charge(request: PaymentRequest): Promise<PaymentResult> {
    if (request.method === 'COD') {
      return { success: true, transactionId: `COD-${request.orderId}` };
    }

    // Mock ONLINE payment success path for development.
    return {
      success: true,
      transactionId: `ONLINE-${request.orderId}`,
    };
  }
}
