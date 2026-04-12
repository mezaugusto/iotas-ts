import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ThermostatMode,
  parseThermostatModeString,
  parseThermostatModes,
  getThermostatModeAt,
  findThermostatModeIndex,
} from '../src/thermostat.js';

describe('parseThermostatModeString', () => {
  it('parses "heat" to Heat', () => {
    assert.strictEqual(parseThermostatModeString('heat'), ThermostatMode.Heat);
  });

  it('parses "Heat" to Heat (case-insensitive)', () => {
    assert.strictEqual(parseThermostatModeString('Heat'), ThermostatMode.Heat);
  });

  it('parses "HEAT" to Heat (case-insensitive)', () => {
    assert.strictEqual(parseThermostatModeString('HEAT'), ThermostatMode.Heat);
  });

  it('parses "cool" to Cool', () => {
    assert.strictEqual(parseThermostatModeString('cool'), ThermostatMode.Cool);
  });

  it('parses "Cool" to Cool (case-insensitive)', () => {
    assert.strictEqual(parseThermostatModeString('Cool'), ThermostatMode.Cool);
  });

  it('parses "off" to Off', () => {
    assert.strictEqual(parseThermostatModeString('off'), ThermostatMode.Off);
  });

  it('parses "Off" to Off (case-insensitive)', () => {
    assert.strictEqual(parseThermostatModeString('Off'), ThermostatMode.Off);
  });

  it('parses "auto" to Auto', () => {
    assert.strictEqual(parseThermostatModeString('auto'), ThermostatMode.Auto);
  });

  it('parses "Auto" to Auto (case-insensitive)', () => {
    assert.strictEqual(parseThermostatModeString('Auto'), ThermostatMode.Auto);
  });

  it('parses "emergency heat" to EmergencyHeat', () => {
    assert.strictEqual(parseThermostatModeString('emergency heat'), ThermostatMode.EmergencyHeat);
  });

  it('parses "Emergency Heat" to EmergencyHeat (case-insensitive)', () => {
    assert.strictEqual(parseThermostatModeString('Emergency Heat'), ThermostatMode.EmergencyHeat);
  });

  it('parses "eheat" to EmergencyHeat', () => {
    assert.strictEqual(parseThermostatModeString('eheat'), ThermostatMode.EmergencyHeat);
  });

  it('parses "EHeat" to EmergencyHeat (case-insensitive)', () => {
    assert.strictEqual(parseThermostatModeString('EHeat'), ThermostatMode.EmergencyHeat);
  });

  it('returns Unknown for unknown mode string', () => {
    assert.strictEqual(parseThermostatModeString('unknown'), ThermostatMode.Unknown);
  });

  it('returns Unknown for empty string', () => {
    assert.strictEqual(parseThermostatModeString(''), ThermostatMode.Unknown);
  });

  it('returns Unknown for random string', () => {
    assert.strictEqual(parseThermostatModeString('foobar'), ThermostatMode.Unknown);
  });

  it('trims whitespace', () => {
    assert.strictEqual(parseThermostatModeString('  heat  '), ThermostatMode.Heat);
  });

  it('handles substring matching for heat (e.g., "preheat")', () => {
    assert.strictEqual(parseThermostatModeString('preheat'), ThermostatMode.Heat);
  });

  it('handles substring matching for cool (e.g., "precool")', () => {
    assert.strictEqual(parseThermostatModeString('precool'), ThermostatMode.Cool);
  });
});

describe('parseThermostatModes', () => {
  it('parses "Off:Heat:Cool:Auto" into ordered array', () => {
    const result = parseThermostatModes('Off:Heat:Cool:Auto');
    assert.deepStrictEqual(result, [ThermostatMode.Off, ThermostatMode.Heat, ThermostatMode.Cool, ThermostatMode.Auto]);
  });

  it('returns empty array for empty string', () => {
    const result = parseThermostatModes('');
    assert.deepStrictEqual(result, []);
  });

  it('returns empty array for undefined', () => {
    const result = parseThermostatModes(undefined);
    assert.deepStrictEqual(result, []);
  });

  it('parses single mode', () => {
    const result = parseThermostatModes('Heat');
    assert.deepStrictEqual(result, [ThermostatMode.Heat]);
  });

  it('parses modes with unknown values', () => {
    const result = parseThermostatModes('Off:Unknown:Heat');
    assert.deepStrictEqual(result, [ThermostatMode.Off, ThermostatMode.Unknown, ThermostatMode.Heat]);
  });

  it('parses modes with emergency heat', () => {
    const result = parseThermostatModes('Off:Heat:Emergency Heat:Cool');
    assert.deepStrictEqual(result, [
      ThermostatMode.Off,
      ThermostatMode.Heat,
      ThermostatMode.EmergencyHeat,
      ThermostatMode.Cool,
    ]);
  });

  it('handles mixed case modes', () => {
    const result = parseThermostatModes('OFF:HEAT:COOL');
    assert.deepStrictEqual(result, [ThermostatMode.Off, ThermostatMode.Heat, ThermostatMode.Cool]);
  });
});

describe('getThermostatModeAt', () => {
  const modes = [ThermostatMode.Off, ThermostatMode.Heat, ThermostatMode.Cool, ThermostatMode.Auto];

  it('returns mode at index 0', () => {
    assert.strictEqual(getThermostatModeAt(modes, 0), ThermostatMode.Off);
  });

  it('returns mode at index 1', () => {
    assert.strictEqual(getThermostatModeAt(modes, 1), ThermostatMode.Heat);
  });

  it('returns mode at index 2', () => {
    assert.strictEqual(getThermostatModeAt(modes, 2), ThermostatMode.Cool);
  });

  it('returns mode at index 3', () => {
    assert.strictEqual(getThermostatModeAt(modes, 3), ThermostatMode.Auto);
  });

  it('returns Off for index out of bounds (too high)', () => {
    assert.strictEqual(getThermostatModeAt(modes, 10), ThermostatMode.Off);
  });

  it('returns Off for index out of bounds (negative)', () => {
    assert.strictEqual(getThermostatModeAt(modes, -1), ThermostatMode.Off);
  });

  it('returns Off for empty array', () => {
    assert.strictEqual(getThermostatModeAt([], 0), ThermostatMode.Off);
  });
});

describe('findThermostatModeIndex', () => {
  const modes = [ThermostatMode.Off, ThermostatMode.Heat, ThermostatMode.Cool, ThermostatMode.Auto];

  it('finds index of Off', () => {
    assert.strictEqual(findThermostatModeIndex(modes, ThermostatMode.Off), 0);
  });

  it('finds index of Heat', () => {
    assert.strictEqual(findThermostatModeIndex(modes, ThermostatMode.Heat), 1);
  });

  it('finds index of Cool', () => {
    assert.strictEqual(findThermostatModeIndex(modes, ThermostatMode.Cool), 2);
  });

  it('finds index of Auto', () => {
    assert.strictEqual(findThermostatModeIndex(modes, ThermostatMode.Auto), 3);
  });

  it('returns -1 for mode not in array', () => {
    assert.strictEqual(findThermostatModeIndex(modes, ThermostatMode.EmergencyHeat), -1);
  });

  it('returns -1 for Unknown', () => {
    assert.strictEqual(findThermostatModeIndex(modes, ThermostatMode.Unknown), -1);
  });

  it('returns -1 for empty array', () => {
    assert.strictEqual(findThermostatModeIndex([], ThermostatMode.Heat), -1);
  });

  it('finds first occurrence when mode appears multiple times', () => {
    const modesWithDuplicates = [ThermostatMode.Heat, ThermostatMode.Off, ThermostatMode.Heat];
    assert.strictEqual(findThermostatModeIndex(modesWithDuplicates, ThermostatMode.Heat), 0);
  });
});
