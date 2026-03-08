import { Injectable } from '@nestjs/common';
import { EtaRequest, MapGateway } from '../interfaces/map-gateway.interface';

@Injectable()
export class MockMapAdapter implements MapGateway {
  async estimateEtaMinutes(_request: EtaRequest): Promise<number> {
    // Fixed ETA for development before integrating real map providers.
    return 20;
  }
}
