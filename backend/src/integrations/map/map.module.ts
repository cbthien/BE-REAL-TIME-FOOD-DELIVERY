import { Module } from '@nestjs/common';
import { MAP_GATEWAY } from './interfaces/map-gateway.interface';
import { MockMapAdapter } from './adapters/mock-map.adapter';

@Module({
  providers: [
    {
      provide: MAP_GATEWAY,
      useClass: MockMapAdapter,
    },
  ],
  exports: [MAP_GATEWAY],
})
export class MapModule {}
