import type { IotasLogger } from './logger.js';

export type Rooms = Room[];

export interface IotasTokens {
  jwt: string;
  refresh: string;
}

export interface IotasClientOptions {
  log: IotasLogger;
  email: string;
  unitName?: string;
  authenticate: () => Promise<{ username: string; password: string }>;
  onTokensChanged?: (tokens: IotasTokens) => void;
  initialTokens?: IotasTokens;
  /** Base URL for the IOTAS API. Default: 'https://api.iotashome.com/api/v1' */
  baseUrl?: string;
  /** Auth retry delays in ms (one entry per retry). Default: [60_000, 300_000, 600_000] */
  authRetryDelaysMs?: number[];
  /** Max 401 retries per request before failing. Default: 1 */
  maxRequestAuthRetries?: number;
  /** Config for redundant feature updates (Z-Wave reliability). */
  reliableUpdate?: {
    /** Number of redundant PUT calls. Default: 3 */
    attempts?: number;
    /** Delay between redundant calls in ms. Default: 500 */
    delayMs?: number;
  };
  /** Injected fetch function for testing. Default: globalThis.fetch */
  fetch?: typeof fetch;
  /** Injected delay function for testing. Default: setTimeout-based sleep */
  delay?: (ms: number) => Promise<void>;
}

export interface FeatureCacheOptions {
  /** Polling interval in ms. Default: 30_000 */
  pollIntervalMs?: number;
  /** Base delay for exponential backoff on poll failure in ms. Default: 5_000 */
  pollBackoffBaseMs?: number;
  /** Maximum backoff delay on poll failure in ms. Default: 300_000 */
  pollBackoffMaxMs?: number;
  /** Optional transform applied to every rooms snapshot (discovery and polling). */
  snapshotFilter?: (rooms: Rooms) => Rooms;
}

export interface Room {
  id: number;
  unit: number;
  name: string;
  devices: Device[];
}

export interface PhysicalDeviceDescription {
  id: number;
  name: string;
  manufacturer: string;
  model: string;
  secure: boolean;
  movable: boolean;
  external: boolean;
  protocol: string;
  deviceSpecificKey: boolean;
  isActive: boolean;
}

export interface Device {
  id: number;
  room: number;
  roomName?: string;
  deviceTemplateId: number;
  deviceType: number;
  triggerTags?: string[];
  name: string;
  category: string;
  icon?: string;
  active: boolean;
  movable: boolean;
  secure: boolean;
  paired: boolean;
  serialNumber?: string;
  features: Feature[];
  physicalDevice?: number;
  physicalDeviceDescription?: PhysicalDeviceDescription;
}

export interface Feature {
  // Base fields (always present)
  id: number;
  device: number;
  featureType: number;
  featureTypeName: string;
  featureTypeCategory: string;
  name: string;
  isLight: boolean;

  // Fields only present when device is paired
  eventType?: number;
  eventTypeName?: string;
  physical?: number;
  physicalFeatureDescription?: number;
  featureTypeSettable?: boolean;
  value?: number;
  values?: string;

  // Optional UI state
  uiStoredValue?: number;
}

export interface Residency {
  id: string;
  accountId: number;
  unit: number;
  buildingId: number;
  unitName: string;
  dateFrom: string;
  tenant: boolean;
  unitAdmin: boolean;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  createdAt: string;
  suspended: boolean;
  account: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    hasPassword: boolean;
  };
}

export interface AuthResponse {
  jwt: string;
  refresh: string;
}

export interface AccountResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  hasPassword?: boolean;
  phoneNumber?: string;
  passwordSetAt?: string;
  passwordFirstSetAt?: string;
  createdAt?: string;
  keepConnected?: boolean;
  shareData?: boolean;
  accessibilityColor?: boolean;
  onboardingComplete?: boolean;
  soSecureRegistered?: boolean;
  phoneNumberVerified?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  mfaEnabled?: boolean;
  mfaPopup?: boolean;
  showPairingInstructions?: boolean;
}
