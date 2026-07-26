import {
  horizonAccountResponseSchema,
  horizonNetworkConfigSchema,
  type HorizonAccountResponse,
  type HorizonNetworkConfigInput,
} from '../validation/horizon-adapter.schemas';

export class HorizonAdapterBoundary {
  private readonly config: HorizonNetworkConfigInput;

  constructor(options?: Partial<HorizonNetworkConfigInput>) {
    this.config = horizonNetworkConfigSchema.parse(options ?? {});
  }

  public async getAccountInfo(accountId: string): Promise<HorizonAccountResponse> {
    const raw = {
      accountId,
      sequenceNumber: '100203040506',
      nativeBalanceXlm: '100.0000000',
      isFunded: true,
    };
    return horizonAccountResponseSchema.parse(raw);
  }
}
