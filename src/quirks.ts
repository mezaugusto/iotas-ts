import { DeviceCategory } from './constants.js';
import { DEFAULT_WRITE_BARRIER_MS, LOCK_WRITE_BARRIER_MS } from './defaults.js';
import type { Device } from './types.js';

const ZWAVE_MANUFACTURERS = {
  JASCO: '0x0063',
} as const;

export function needsReliableUpdate(device: Device): boolean {
  return (
    device.category === DeviceCategory.Dimmer &&
    device.physicalDeviceDescription?.manufacturer === ZWAVE_MANUFACTURERS.JASCO
  );
}

export function getWriteBarrierMs(device: Device): number {
  if (device.category === DeviceCategory.Lock) {
    return LOCK_WRITE_BARRIER_MS;
  }
  return DEFAULT_WRITE_BARRIER_MS;
}
