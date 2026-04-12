import type { Device, Feature } from './types.js';
import { FeatureCategory, READ_ONLY_CATEGORIES, DISCOVERY_EVENT_TYPES } from './constants.js';

export function isReadOnlyCategory(category: string): boolean {
  return READ_ONLY_CATEGORIES.has(category);
}

export function isSupportedFeature(feature: Feature): boolean {
  return Boolean(feature.featureTypeSettable) || isReadOnlyCategory(feature.featureTypeCategory);
}

export function isDiscoverableFeature(feature: Feature): boolean {
  return (
    (DISCOVERY_EVENT_TYPES.has(feature.eventTypeName ?? '') &&
      (Boolean(feature.featureTypeSettable) || feature.featureTypeCategory === FeatureCategory.CurrentTemperature)) ||
    isReadOnlyCategory(feature.featureTypeCategory)
  );
}

export function isSupportedDevice(device: Device): boolean {
  if (!device.paired) {
    return false;
  }
  return device.features.some(isDiscoverableFeature);
}
