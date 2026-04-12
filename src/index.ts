// Logger interface
export type { IotasLogger } from './logger.js';

// API Client
export { IotasClient } from './api/iotasClient.js';

// Caching
export { FeatureCache } from './cache/featureCache.js';
export type { FeatureChangeCallback, SnapshotFilter } from './cache/featureCache.js';

// Types
export type {
  Room,
  Rooms,
  Device,
  Feature,
  Residency,
  AuthResponse,
  AccountResponse,
  PhysicalDeviceDescription,
  IotasClientOptions,
  IotasTokens,
  FeatureCacheOptions,
} from './types.js';

// Utilities
export { Temperature, filterDevices } from './utils.js';
export type { DeviceFilterOptions } from './utils.js';
