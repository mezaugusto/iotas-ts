import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isDeviceCategory,
  DeviceCategory,
  READ_ONLY_CATEGORIES,
  DISCOVERY_EVENT_TYPES,
  FeatureCategory,
  EventTypeName,
} from '../src/constants.js';

describe('isDeviceCategory', () => {
  it('returns true for valid device categories', () => {
    assert.strictEqual(isDeviceCategory('dimmer'), true);
    assert.strictEqual(isDeviceCategory('switch'), true);
    assert.strictEqual(isDeviceCategory('motion_switch'), true);
    assert.strictEqual(isDeviceCategory('lock'), true);
    assert.strictEqual(isDeviceCategory('thermostat'), true);
    assert.strictEqual(isDeviceCategory('door'), true);
  });

  it('returns false for invalid device categories', () => {
    assert.strictEqual(isDeviceCategory('invalid'), false);
    assert.strictEqual(isDeviceCategory(''), false);
    assert.strictEqual(isDeviceCategory('DIMMER'), false); // case-sensitive
    assert.strictEqual(isDeviceCategory('light'), false);
    assert.strictEqual(isDeviceCategory('sensor'), false);
  });

  it('returns true for all DeviceCategory enum values', () => {
    for (const value of Object.values(DeviceCategory)) {
      assert.strictEqual(isDeviceCategory(value), true);
    }
  });
});

describe('READ_ONLY_CATEGORIES', () => {
  it('contains expected read-only categories', () => {
    assert.strictEqual(READ_ONLY_CATEGORIES.has(FeatureCategory.CurrentTemperature), true);
    assert.strictEqual(READ_ONLY_CATEGORIES.has(FeatureCategory.Battery), true);
    assert.strictEqual(READ_ONLY_CATEGORIES.has(FeatureCategory.Humidity), true);
    assert.strictEqual(READ_ONLY_CATEGORIES.has(FeatureCategory.Motion), true);
    assert.strictEqual(READ_ONLY_CATEGORIES.has(FeatureCategory.DoorState), true);
  });

  it('does not contain settable categories', () => {
    assert.strictEqual(READ_ONLY_CATEGORIES.has(FeatureCategory.Light), false);
    assert.strictEqual(READ_ONLY_CATEGORIES.has(FeatureCategory.Lock), false);
    assert.strictEqual(READ_ONLY_CATEGORIES.has(FeatureCategory.HeatSetPoint), false);
    assert.strictEqual(READ_ONLY_CATEGORIES.has(FeatureCategory.CoolSetPoint), false);
    assert.strictEqual(READ_ONLY_CATEGORIES.has(FeatureCategory.ThermostatMode), false);
  });

  it('has exactly 5 read-only categories', () => {
    assert.strictEqual(READ_ONLY_CATEGORIES.size, 5);
  });
});

describe('DISCOVERY_EVENT_TYPES', () => {
  it('contains expected discovery event types', () => {
    assert.strictEqual(DISCOVERY_EVENT_TYPES.has(EventTypeName.Temperature), true);
    assert.strictEqual(DISCOVERY_EVENT_TYPES.has(EventTypeName.OnOff), true);
    assert.strictEqual(DISCOVERY_EVENT_TYPES.has(EventTypeName.Level), true);
    assert.strictEqual(DISCOVERY_EVENT_TYPES.has(EventTypeName.ThermostatMode), true);
    assert.strictEqual(DISCOVERY_EVENT_TYPES.has(EventTypeName.FanMode), true);
    assert.strictEqual(DISCOVERY_EVENT_TYPES.has(EventTypeName.Lock), true);
  });

  it('does not contain non-discovery event types', () => {
    assert.strictEqual(DISCOVERY_EVENT_TYPES.has('Battery'), false);
    assert.strictEqual(DISCOVERY_EVENT_TYPES.has('Humidity'), false);
    assert.strictEqual(DISCOVERY_EVENT_TYPES.has('Unknown'), false);
  });

  it('has exactly 6 discovery event types', () => {
    assert.strictEqual(DISCOVERY_EVENT_TYPES.size, 6);
  });
});
