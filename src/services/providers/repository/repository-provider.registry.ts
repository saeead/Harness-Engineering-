/**
 * Repository Provider Registry
 * Allows dynamic registration and discovery of repository backends.
 */

import { RepositoryProviderId, RepositoryProviderInfo } from '../../../domain/models';
import { RepositoryProvider } from './repository-provider.interface';
import { GitHubRepositoryProvider } from './github-repository.provider';

class RepositoryProviderRegistry {
  private providers = new Map<RepositoryProviderId, RepositoryProvider>();
  private activeProviderId: RepositoryProviderId = 'github';

  constructor() {
    this.register(new GitHubRepositoryProvider());
  }

  register(provider: RepositoryProvider): void {
    this.providers.set(provider.id, provider);
  }


  get(id: RepositoryProviderId): RepositoryProvider | undefined {
    return this.providers.get(id);
  }

  getActiveProvider(): RepositoryProvider | undefined {
    return this.providers.get(this.activeProviderId);
  }

  setActiveProvider(id: RepositoryProviderId): boolean {
    if (this.providers.has(id)) {
      this.activeProviderId = id;
      return true;
    }
    return false;
  }

  listAvailableProviders(): RepositoryProviderInfo[] {
    return Array.from(this.providers.values()).map((p) => p.getInfo());
  }
}

export const repositoryProviderRegistry = new RepositoryProviderRegistry();
