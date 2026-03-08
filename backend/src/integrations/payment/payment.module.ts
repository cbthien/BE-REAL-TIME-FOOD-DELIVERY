import { Module } from '@nestjs/common';
import { PAYMENT_GATEWAY } from './interfaces/payment-gateway.interface';
import { MockPaymentAdapter } from './adapters/mock-payment.adapter';

@Module({
  providers: [
    {
      provide: PAYMENT_GATEWAY,
      useClass: MockPaymentAdapter,
    },
  ],
  exports: [PAYMENT_GATEWAY],
})
export class PaymentModule {}
