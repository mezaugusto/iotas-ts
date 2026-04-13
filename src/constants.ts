export const EventTypeName = {
  OnOff: 'OnOff',
  Level: 'Level',
  Temperature: 'Temperature',
  ThermostatMode: 'ThermostatMode',
  FanMode: 'FanMode',
  Lock: 'Lock',
} as const;
export type EventTypeName = (typeof EventTypeName)[keyof typeof EventTypeName];

export const FeatureCategory = {
  Light: 'light',
  Lock: 'lock',
  CurrentTemperature: 'current_temperature',
  HeatSetPoint: 'heat_set_point',
  CoolSetPoint: 'cool_set_point',
  ThermostatMode: 'thermostat_mode',
  Battery: 'battery',
  Humidity: 'humidity',
  Motion: 'motion',
  FanMode: 'fan_mode',
  AutoRelock: 'auto_relock',
  AutoRelockTimeout: 'auto_relock_timeout',
  DoorState: 'door_state',
} as const;
export type FeatureCategory = (typeof FeatureCategory)[keyof typeof FeatureCategory];

export const FeatureTypeName = {
  Light: 'Light',
  OperationMode: 'Operation Mode',
  Battery: 'Battery',
} as const;
export type FeatureTypeName = (typeof FeatureTypeName)[keyof typeof FeatureTypeName];

export const DeviceCategory = {
  Dimmer: 'dimmer',
  Switch: 'switch',
  MotionSwitch: 'motion_switch',
  Lock: 'lock',
  Thermostat: 'thermostat',
  Door: 'door',
} as const;
export type DeviceCategory = (typeof DeviceCategory)[keyof typeof DeviceCategory];

const deviceCategoryValues = new Set<string>(Object.values(DeviceCategory));

export function isDeviceCategory(value: string): value is DeviceCategory {
  return deviceCategoryValues.has(value);
}

export const READ_ONLY_CATEGORIES: ReadonlySet<string> = new Set([
  FeatureCategory.CurrentTemperature,
  FeatureCategory.Battery,
  FeatureCategory.Humidity,
  FeatureCategory.Motion,
  FeatureCategory.DoorState,
]);

export const DISCOVERY_EVENT_TYPES: ReadonlySet<string> = new Set([
  EventTypeName.Temperature,
  EventTypeName.OnOff,
  EventTypeName.Level,
  EventTypeName.ThermostatMode,
  EventTypeName.FanMode,
  EventTypeName.Lock,
]);
