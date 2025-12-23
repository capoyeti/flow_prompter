// Provider Registry
// Central registration system for all provider adapters

import type { ProviderAdapter, ProviderMetadata } from './types';

/**
 * Central registry for all provider adapters
 * Enables plugin-based architecture for easy provider addition
 */
class ProviderRegistry {
  private adapters: Map<string, ProviderAdapter> = new Map();

  /**
   * Register a provider adapter
   * @param adapter The adapter to register
   */
  register(adapter: ProviderAdapter): void {
    if (this.adapters.has(adapter.id)) {
      console.warn(`Provider adapter '${adapter.id}' is being re-registered`);
    }
    this.adapters.set(adapter.id, adapter);
  }

  /**
   * Get a provider adapter by ID
   * @param id Provider ID (e.g., 'openai', 'anthropic')
   * @returns The adapter or undefined if not found
   */
  get(id: string): ProviderAdapter | undefined {
    return this.adapters.get(id);
  }

  /**
   * Get all registered adapters
   * @returns Array of all registered adapters
   */
  getAll(): ProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get all provider IDs
   * @returns Array of provider IDs
   */
  getIds(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get metadata for all providers (for UI display)
   * @returns Array of provider metadata
   */
  getAllMetadata(): ProviderMetadata[] {
    return this.getAll().map((adapter) => ({
      id: adapter.id,
      displayName: adapter.displayName,
      brandColor: adapter.brandColor,
      envKeyName: adapter.envKeyName,
      isLocal: adapter.isLocal,
      baseUrl: adapter.baseUrl,
      description: adapter.description,
    }));
  }

  /**
   * Check if a provider is registered
   * @param id Provider ID
   * @returns Boolean indicating if provider exists
   */
  has(id: string): boolean {
    return this.adapters.has(id);
  }

  /**
   * Get only cloud providers (non-local)
   * @returns Array of cloud provider adapters
   */
  getCloudProviders(): ProviderAdapter[] {
    return this.getAll().filter((adapter) => !adapter.isLocal);
  }

  /**
   * Get only local providers (Ollama, etc.)
   * @returns Array of local provider adapters
   */
  getLocalProviders(): ProviderAdapter[] {
    return this.getAll().filter((adapter) => adapter.isLocal);
  }
}

// Singleton instance
export const providerRegistry = new ProviderRegistry();

// Convenience functions
export function registerProvider(adapter: ProviderAdapter): void {
  providerRegistry.register(adapter);
}

export function getProvider(id: string): ProviderAdapter | undefined {
  return providerRegistry.get(id);
}

export function getAllProviders(): ProviderAdapter[] {
  return providerRegistry.getAll();
}

export function getProviderIds(): string[] {
  return providerRegistry.getIds();
}
