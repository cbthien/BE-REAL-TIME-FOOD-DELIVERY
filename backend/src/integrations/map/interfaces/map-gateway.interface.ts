export interface EtaRequest {
  fromAddress: string;
  toAddress: string;
}

export interface MapGateway {
  estimateEtaMinutes(request: EtaRequest): Promise<number>;
}

export const MAP_GATEWAY = 'MAP_GATEWAY';
