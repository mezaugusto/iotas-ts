import type { Device, Feature } from './types.js';
import type { EventTypeName, FeatureCategory } from './constants.js';

/**
 * Get serial number with IOTAS-{id} fallback for short/missing values.
 * HomeKit requires >1 character; this ensures compliance.
 */
export function getSerialNumber(device: Device): string {
  const raw = device.serialNumber;
  if (raw && raw.length > 1) {
    return raw;
  }
  return `IOTAS-${device.id}`;
}

/**
 * Get manufacturer from physicalDeviceDescription, falls back to 'IOTAS'.
 * Handles empty strings as missing values.
 */
export function getManufacturer(device: Device): string {
  return device.physicalDeviceDescription?.manufacturer || 'IOTAS';
}

/**
 * Get model from physicalDeviceDescription, falls back to device.category.
 * Handles empty strings as missing values.
 */
export function getModel(device: Device): string {
  return device.physicalDeviceDescription?.model || device.category;
}

export function findFeatureByCategory(device: Device, category: FeatureCategory): Feature | undefined {
  return device.features.find((f) => f.featureTypeCategory === category);
}

export function findFeatureByEventType(device: Device, eventType: EventTypeName): Feature | undefined {
  return device.features.find((f) => f.eventTypeName === eventType);
}
