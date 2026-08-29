/**
 * PROXIMA Manual Import Discovery Provider
 * Allows importing prospects from a list of pre-defined candidates.
 */

import { DiscoveryProvider, DiscoveryCandidate, DiscoveryProviderResult } from './interface';

export class ManualImportProvider implements DiscoveryProvider {
  name = 'ManualImport';
  private candidates: DiscoveryCandidate[];

  constructor(candidates: DiscoveryCandidate[] = []) {
    this.candidates = candidates;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async discover(params: {
    industry: string;
    location: string;
    offset?: number;
    batchSize?: number;
  }): Promise<DiscoveryProviderResult> {
    const { offset = 0, batchSize = 25 } = params;
    const sliced = this.candidates.slice(offset, offset + batchSize);

    return {
      provider: this.name,
      success: true,
      candidates: sliced,
      totalAvailable: this.candidates.length,
      offset,
      batchSize
    };
  }
}
