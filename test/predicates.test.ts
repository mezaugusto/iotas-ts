import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isReadOnlyCategory, isSupportedFeature, isDiscoverableFeature, isSupportedDevice } from '../src/predicates.js';
import { FeatureCategory, EventTypeName } from '../src/constants.js';
import type { Device, Feature } from '../src/types.js';

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

describe('isReadOnlyCategory', () => {
  it('returns true for battery category', () => {
    assert.strictEqual(isReadOnlyCategory(FeatureCategory.Battery), true);
  });

  it('returns true for humidity category', () => {
    assert.strictEqual(isReadOnlyCategory(FeatureCategory.Humidity), true);
  });

  it('returns true for motion category', () => {
    assert.strictEqual(isReadOnlyCategory(FeatureCategory.Motion), true);
  });

  it('returns true for current_temperature category', () => {
    assert.strictEqual(isReadOnlyCategory(FeatureCategory.CurrentTemperature), true);
  });

  it('returns true for door_state category', () => {
    assert.strictEqual(isReadOnlyCategory(FeatureCategory.DoorState), true);
  });

  it('returns false for light category', () => {
    assert.strictEqual(isReadOnlyCategory(FeatureCategory.Light), false);
  });

  it('returns false for lock category', () => {
    assert.strictEqual(isReadOnlyCategory(FeatureCategory.Lock), false);
  });

  it('returns false for thermostat_mode category', () => {
    assert.strictEqual(isReadOnlyCategory(FeatureCategory.ThermostatMode), false);
  });

  it('returns false for heat_set_point category', () => {
    assert.strictEqual(isReadOnlyCategory(FeatureCategory.HeatSetPoint), false);
  });

  it('returns false for unknown category', () => {
    assert.strictEqual(isReadOnlyCategory('unknown'), false);
  });
});

describe('isSupportedFeature', () => {
  it('returns true for settable feature', () => {
    const feature = makeFeature({
      featureTypeSettable: true,
      featureTypeCategory: FeatureCategory.Light,
    });
    assert.strictEqual(isSupportedFeature(feature), true);
  });

  it('returns true for read-only category feature even if not settable', () => {
    const feature = makeFeature({
      featureTypeSettable: false,
      featureTypeCategory: FeatureCategory.Battery,
    });
    assert.strictEqual(isSupportedFeature(feature), true);
  });

  it('returns false for non-settable feature with non-read-only category', () => {
    const feature = makeFeature({
      featureTypeSettable: false,
      featureTypeCategory: FeatureCategory.Light,
    });
    assert.strictEqual(isSupportedFeature(feature), false);
  });

  it('returns false for undefined settable with non-read-only category', () => {
    const feature = makeFeature({
      featureTypeSettable: undefined,
      featureTypeCategory: FeatureCategory.Light,
    });
    assert.strictEqual(isSupportedFeature(feature), false);
  });

  it('returns true for settable feature in read-only category', () => {
    const feature = makeFeature({
      featureTypeSettable: true,
      featureTypeCategory: FeatureCategory.Battery,
    });
    assert.strictEqual(isSupportedFeature(feature), true);
  });
});

describe('isDiscoverableFeature', () => {
  it('returns true for settable feature with OnOff event type', () => {
    const feature = makeFeature({
      eventTypeName: EventTypeName.OnOff,
      featureTypeSettable: true,
      featureTypeCategory: FeatureCategory.Light,
    });
    assert.strictEqual(isDiscoverableFeature(feature), true);
  });

  it('returns true for settable feature with Level event type', () => {
    const feature = makeFeature({
      eventTypeName: EventTypeName.Level,
      featureTypeSettable: true,
      featureTypeCategory: FeatureCategory.Light,
    });
    assert.strictEqual(isDiscoverableFeature(feature), true);
  });

  it('returns true for settable feature with Temperature event type', () => {
    const feature = makeFeature({
      eventTypeName: EventTypeName.Temperature,
      featureTypeSettable: true,
      featureTypeCategory: FeatureCategory.HeatSetPoint,
    });
    assert.strictEqual(isDiscoverableFeature(feature), true);
  });

  it('returns true for settable feature with ThermostatMode event type', () => {
    const feature = makeFeature({
      eventTypeName: EventTypeName.ThermostatMode,
      featureTypeSettable: true,
      featureTypeCategory: FeatureCategory.ThermostatMode,
    });
    assert.strictEqual(isDiscoverableFeature(feature), true);
  });

  it('returns true for settable feature with Lock event type', () => {
    const feature = makeFeature({
      eventTypeName: EventTypeName.Lock,
      featureTypeSettable: true,
      featureTypeCategory: FeatureCategory.Lock,
    });
    assert.strictEqual(isDiscoverableFeature(feature), true);
  });

  it('returns true for current_temperature feature with Temperature event type', () => {
    const feature = makeFeature({
      eventTypeName: EventTypeName.Temperature,
      featureTypeSettable: false,
      featureTypeCategory: FeatureCategory.CurrentTemperature,
    });
    assert.strictEqual(isDiscoverableFeature(feature), true);
  });

  it('returns true for read-only category regardless of event type', () => {
    const feature = makeFeature({
      eventTypeName: undefined,
      featureTypeSettable: false,
      featureTypeCategory: FeatureCategory.Battery,
    });
    assert.strictEqual(isDiscoverableFeature(feature), true);
  });

  it('returns true for motion feature', () => {
    const feature = makeFeature({
      eventTypeName: undefined,
      featureTypeSettable: false,
      featureTypeCategory: FeatureCategory.Motion,
    });
    assert.strictEqual(isDiscoverableFeature(feature), true);
  });

  it('returns true for humidity feature', () => {
    const feature = makeFeature({
      eventTypeName: undefined,
      featureTypeSettable: false,
      featureTypeCategory: FeatureCategory.Humidity,
    });
    assert.strictEqual(isDiscoverableFeature(feature), true);
  });

  it('returns true for door_state feature', () => {
    const feature = makeFeature({
      eventTypeName: undefined,
      featureTypeSettable: false,
      featureTypeCategory: FeatureCategory.DoorState,
    });
    assert.strictEqual(isDiscoverableFeature(feature), true);
  });

  it('returns false for non-settable feature with OnOff event but non-read-only category', () => {
    const feature = makeFeature({
      eventTypeName: EventTypeName.OnOff,
      featureTypeSettable: false,
      featureTypeCategory: FeatureCategory.Light,
    });
    assert.strictEqual(isDiscoverableFeature(feature), false);
  });

  it('returns false for settable feature with non-discovery event type', () => {
    const feature = makeFeature({
      eventTypeName: 'Battery',
      featureTypeSettable: true,
      featureTypeCategory: FeatureCategory.Light,
    });
    assert.strictEqual(isDiscoverableFeature(feature), false);
  });

  it('returns false for settable feature with undefined event type', () => {
    const feature = makeFeature({
      eventTypeName: undefined,
      featureTypeSettable: true,
      featureTypeCategory: FeatureCategory.Light,
    });
    assert.strictEqual(isDiscoverableFeature(feature), false);
  });
});

describe('isSupportedDevice', () => {
  it('returns false for unpaired device', () => {
    const device = makeDevice({
      paired: false,
      features: [
        makeFeature({
          eventTypeName: EventTypeName.OnOff,
          featureTypeSettable: true,
          featureTypeCategory: FeatureCategory.Light,
        }),
      ],
    });
    assert.strictEqual(isSupportedDevice(device), false);
  });

  it('returns true for paired device with discoverable feature', () => {
    const device = makeDevice({
      paired: true,
      features: [
        makeFeature({
          eventTypeName: EventTypeName.OnOff,
          featureTypeSettable: true,
          featureTypeCategory: FeatureCategory.Light,
        }),
      ],
    });
    assert.strictEqual(isSupportedDevice(device), true);
  });

  it('returns false for paired device with no discoverable features', () => {
    const device = makeDevice({
      paired: true,
      features: [
        makeFeature({
          eventTypeName: undefined,
          featureTypeSettable: false,
          featureTypeCategory: FeatureCategory.Light,
        }),
      ],
    });
    assert.strictEqual(isSupportedDevice(device), false);
  });

  it('returns false for paired device with no features', () => {
    const device = makeDevice({
      paired: true,
      features: [],
    });
    assert.strictEqual(isSupportedDevice(device), false);
  });

  it('returns true for paired device with at least one discoverable feature among many', () => {
    const device = makeDevice({
      paired: true,
      features: [
        makeFeature({
          id: 1,
          eventTypeName: undefined,
          featureTypeSettable: false,
          featureTypeCategory: FeatureCategory.Light,
        }),
        makeFeature({
          id: 2,
          eventTypeName: EventTypeName.OnOff,
          featureTypeSettable: true,
          featureTypeCategory: FeatureCategory.Light,
        }),
      ],
    });
    assert.strictEqual(isSupportedDevice(device), true);
  });

  it('returns true for paired device with battery feature', () => {
    const device = makeDevice({
      paired: true,
      features: [
        makeFeature({
          featureTypeSettable: false,
          featureTypeCategory: FeatureCategory.Battery,
        }),
      ],
    });
    assert.strictEqual(isSupportedDevice(device), true);
  });

  it('returns true for paired thermostat with current temperature', () => {
    const device = makeDevice({
      paired: true,
      category: 'thermostat',
      features: [
        makeFeature({
          eventTypeName: EventTypeName.Temperature,
          featureTypeSettable: false,
          featureTypeCategory: FeatureCategory.CurrentTemperature,
        }),
      ],
    });
    assert.strictEqual(isSupportedDevice(device), true);
  });
});
