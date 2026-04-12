import type { Device } from './types.js';

const ZWAVE_MANUFACTURERS = {
  JASCO: '0x0063',
} as const;

const DEVICE_CATEGORIES = {
  DIMMER: 'dimmer',
} as const;

export function needsReliableUpdate(device: Device): boolean {
  return (
    device.category === DEVICE_CATEGORIES.DIMMER &&
    device.physicalDeviceDescription?.manufacturer === ZWAVE_MANUFACTURERS.JASCO
  );
}
