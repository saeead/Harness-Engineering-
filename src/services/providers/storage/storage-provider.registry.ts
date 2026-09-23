/**
 * Storage Provider Registry
 */

import { StorageProviderId, StorageProviderInfo } from '../../../domain/models';
import { BrowserLocalStorageProvider } from './local-storage.provider';
import { StorageProvider } from './storage-provider.interface';

class StorageProviderRegistry {
  private providers = new Map<StorageProviderId, StorageProvider>();
  private activeProviderId: StorageProviderId = 'browser_local';

  constructor() {
    this.register(new BrowserLocalStorageProvider());
  }

  register(provider: StorageProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: StorageProviderId): StorageProvider | undefined {
    return this.providers.get(id);
  }

  getActiveProvider(): StorageProvider {
    const provider = this.providers.get(this.activeProviderId);
    if (!provider) {
      return new BrowserLocalStorageProvider();
    }
    return provider;
  }

  listAvailableProviders(): StorageProviderInfo[] {
    return Array.from(this.providers.values()).map((p) => p.getInfo());
  }
}

export const storageProviderRegistry = new StorageProviderRegistry();
