import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSerialNumber,
  getManufacturer,
  getModel,
  findFeatureByCategory,
  findFeatureByEventType,
} from '../src/device.js';
import { FeatureCategory, EventTypeName } from '../src/constants.js';
import type { Device, Feature } from '../src/types.js';

function makeDevice(overrides: Partial<Device> = {}): Device {
  return {
    id: 1,
    room: 1,
    deviceTemplateId: 1,
    deviceType: 1,
    name: 'Test Device',
    category: 'dimmer',
    active: true,
    movable: false,
    secure: false,
    paired: true,
    features: [],
    ...overrides,
  };
}

function makeFeature(overrides: Partial<Feature> = {}): Feature {
  return {
    id: 100,
    device: 1,
    featureType: 1,
    featureTypeName: 'Light',
    featureTypeCategory: 'light',
    name: 'Light',
    isLight: true,
    ...overrides,
  };
}

describe('getSerialNumber', () => {
  it('returns serial number when it is longer than 1 character', () => {
    const device = makeDevice({ serialNumber: 'ABC123' });
    assert.strictEqual(getSerialNumber(device), 'ABC123');
  });

  it('returns IOTAS-{id} fallback when serial number is 1 character', () => {
    const device = makeDevice({ id: 42, serialNumber: 'X' });
    assert.strictEqual(getSerialNumber(device), 'IOTAS-42');
  });

  it('returns IOTAS-{id} fallback when serial number is empty string', () => {
    const device = makeDevice({ id: 99, serialNumber: '' });
    assert.strictEqual(getSerialNumber(device), 'IOTAS-99');
  });

  it('returns IOTAS-{id} fallback when serial number is undefined', () => {
    const device = makeDevice({ id: 123, serialNumber: undefined });
    assert.strictEqual(getSerialNumber(device), 'IOTAS-123');
  });

  it('returns serial number when exactly 2 characters', () => {
    const device = makeDevice({ serialNumber: 'AB' });
    assert.strictEqual(getSerialNumber(device), 'AB');
  });
});

describe('getManufacturer', () => {
  it('returns manufacturer from physicalDeviceDescription when present', () => {
    const device = makeDevice({
      physicalDeviceDescription: {
        id: 1,
        name: 'Device',
        manufacturer: 'GE',
        model: 'Smart Switch',
        secure: false,
        movable: false,
        external: false,
        protocol: 'zwave',
        deviceSpecificKey: false,
        isActive: true,
      },
    });
    assert.strictEqual(getManufacturer(device), 'GE');
  });

  it('returns IOTAS when physicalDeviceDescription is undefined', () => {
    const device = makeDevice({ physicalDeviceDescription: undefined });
    assert.strictEqual(getManufacturer(device), 'IOTAS');
  });

  it('returns IOTAS when manufacturer is undefined in physicalDeviceDescription', () => {
    const device = makeDevice({
      physicalDeviceDescription: {
        id: 1,
        name: 'Device',
        manufacturer: undefined,
        model: 'Model',
        secure: false,
        movable: false,
        external: false,
        protocol: 'zwave',
        deviceSpecificKey: false,
        isActive: true,
      } as unknown as Device['physicalDeviceDescription'],
    });
    assert.strictEqual(getManufacturer(device), 'IOTAS');
  });
});

describe('getModel', () => {
  it('returns model from physicalDeviceDescription when present', () => {
    const device = makeDevice({
      physicalDeviceDescription: {
        id: 1,
        name: 'Device',
        manufacturer: 'GE',
        model: 'Smart Dimmer',
        secure: false,
        movable: false,
        external: false,
        protocol: 'zwave',
        deviceSpecificKey: false,
        isActive: true,
      },
    });
    assert.strictEqual(getModel(device), 'Smart Dimmer');
  });

  it('returns device category when physicalDeviceDescription is undefined', () => {
    const device = makeDevice({ category: 'thermostat', physicalDeviceDescription: undefined });
    assert.strictEqual(getModel(device), 'thermostat');
  });

  it('returns device category when model is undefined in physicalDeviceDescription', () => {
    const device = makeDevice({
      category: 'lock',
      physicalDeviceDescription: {
        id: 1,
        name: 'Device',
        manufacturer: 'GE',
        model: undefined,
        secure: true,
        movable: false,
        external: false,
        protocol: 'zwave',
        deviceSpecificKey: false,
        isActive: true,
      } as unknown as Device['physicalDeviceDescription'],
    });
    assert.strictEqual(getModel(device), 'lock');
  });
});

describe('findFeatureByCategory', () => {
  it('finds feature matching the category', () => {
    const lightFeature = makeFeature({ id: 1, featureTypeCategory: FeatureCategory.Light });
    const batteryFeature = makeFeature({ id: 2, featureTypeCategory: FeatureCategory.Battery });
    const device = makeDevice({ features: [lightFeature, batteryFeature] });

    const result = findFeatureByCategory(device, FeatureCategory.Battery);
    assert.strictEqual(result?.id, 2);
  });

  it('returns first matching feature when multiple exist', () => {
    const light1 = makeFeature({ id: 1, featureTypeCategory: FeatureCategory.Light });
    const light2 = makeFeature({ id: 2, featureTypeCategory: FeatureCategory.Light });
    const device = makeDevice({ features: [light1, light2] });

    const result = findFeatureByCategory(device, FeatureCategory.Light);
    assert.strictEqual(result?.id, 1);
  });

  it('returns undefined when no feature matches', () => {
    const device = makeDevice({
      features: [makeFeature({ featureTypeCategory: FeatureCategory.Light })],
    });

    const result = findFeatureByCategory(device, FeatureCategory.Lock);
    assert.strictEqual(result, undefined);
  });

  it('returns undefined for device with no features', () => {
    const device = makeDevice({ features: [] });

    const result = findFeatureByCategory(device, FeatureCategory.Light);
    assert.strictEqual(result, undefined);
  });
});

describe('findFeatureByEventType', () => {
  it('finds feature matching the event type', () => {
    const onOffFeature = makeFeature({ id: 1, eventTypeName: EventTypeName.OnOff });
    const levelFeature = makeFeature({ id: 2, eventTypeName: EventTypeName.Level });
    const device = makeDevice({ features: [onOffFeature, levelFeature] });

    const result = findFeatureByEventType(device, EventTypeName.Level);
    assert.strictEqual(result?.id, 2);
  });

  it('returns first matching feature when multiple exist', () => {
    const onOff1 = makeFeature({ id: 1, eventTypeName: EventTypeName.OnOff });
    const onOff2 = makeFeature({ id: 2, eventTypeName: EventTypeName.OnOff });
    const device = makeDevice({ features: [onOff1, onOff2] });

    const result = findFeatureByEventType(device, EventTypeName.OnOff);
    assert.strictEqual(result?.id, 1);
  });

  it('returns undefined when no feature matches', () => {
    const device = makeDevice({
      features: [makeFeature({ eventTypeName: EventTypeName.OnOff })],
    });

    const result = findFeatureByEventType(device, EventTypeName.Lock);
    assert.strictEqual(result, undefined);
  });

  it('returns undefined for device with no features', () => {
    const device = makeDevice({ features: [] });

    const result = findFeatureByEventType(device, EventTypeName.OnOff);
    assert.strictEqual(result, undefined);
  });

  it('returns undefined when feature has no eventTypeName', () => {
    const device = makeDevice({
      features: [makeFeature({ eventTypeName: undefined })],
    });

    const result = findFeatureByEventType(device, EventTypeName.OnOff);
    assert.strictEqual(result, undefined);
  });
});
