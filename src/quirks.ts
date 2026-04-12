import { DeviceCategory } from './constants.js';
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
