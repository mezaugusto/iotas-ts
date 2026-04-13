export type { IotasLogger } from './logger.js';

export { IotasClient } from './api/iotasClient.js';

export { FeatureCache } from './cache/featureCache.js';
export type { FeatureChangeCallback, SnapshotFilter } from './cache/featureCache.js';

export type {
  Room,
  Rooms,
  Device,
  Feature,
  PhysicalDeviceDescription,
  IotasClientOptions,
  IotasTokens,
  FeatureCacheOptions,
} from './types.js';

export { Temperature, filterDevices } from './utils.js';
export type { DeviceFilterOptions } from './utils.js';

export {
  EventTypeName,
  FeatureCategory,
  FeatureTypeName,
  DeviceCategory,
  isDeviceCategory,
  READ_ONLY_CATEGORIES,
  DISCOVERY_EVENT_TYPES,
} from './constants.js';

export { getSerialNumber, getManufacturer, getModel, findFeatureByCategory, findFeatureByEventType } from './device.js';

export { isReadOnlyCategory, isSupportedFeature, isDiscoverableFeature, isSupportedDevice } from './predicates.js';

export { ThermostatMode, parseThermostatModes, getThermostatModeAt, findThermostatModeIndex } from './thermostat.js';

export { FanMode, parseFanModeString, parseFanModes, getFanModeAt, findFanModeIndex } from './fan.js';

export { autoRelockSeconds, isAutoRelockEnabled } from './lock.js';

export {
  DEFAULT_CURRENT_TEMPERATURE_F,
  DEFAULT_HEAT_SETPOINT_F,
  DEFAULT_COOL_SETPOINT_F,
  LOW_BATTERY_THRESHOLD,
} from './defaults.js';
