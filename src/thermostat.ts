/**
 * Thermostat mode utilities for IOTAS thermostats.
 *
 * IOTAS stores thermostat modes as indices into a colon-delimited string
 * (e.g., "Off:Heat:Cool:Auto"). This module provides a canonical enum
 * and helpers to parse and look up modes.
 */

export enum ThermostatMode {
  Off = 0,
  Heat = 1,
  Cool = 2,
  EmergencyHeat = 3,
  Auto = 4,
  Unknown = -1,
}

export function parseThermostatModeString(modeStr: string): ThermostatMode {
  const lower = modeStr.toLowerCase().trim();
  if (lower.includes('emergency') || lower === 'eheat') {
    return ThermostatMode.EmergencyHeat;
  }
  if (lower.includes('heat')) {
    return ThermostatMode.Heat;
  }
  if (lower.includes('cool')) {
    return ThermostatMode.Cool;
  }
  if (lower.includes('auto')) {
    return ThermostatMode.Auto;
  }
  if (lower.includes('off')) {
    return ThermostatMode.Off;
  }
  return ThermostatMode.Unknown;
}

export function parseThermostatModes(valuesString?: string): ThermostatMode[] {
  if (!valuesString) {
    return [];
  }
  return valuesString.split(':').map(parseThermostatModeString);
}

export function getThermostatModeAt(modes: ThermostatMode[], index: number): ThermostatMode {
  if (index < 0 || index >= modes.length) {
    return ThermostatMode.Off;
  }
  return modes[index];
}

export function findThermostatModeIndex(modes: ThermostatMode[], mode: ThermostatMode): number {
  return modes.indexOf(mode);
}
