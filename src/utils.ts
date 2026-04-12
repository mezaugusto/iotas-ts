import type { Rooms } from './types.js';

export const Temperature = {
  toFahrenheit: (c: number) => (c * 9) / 5 + 32,
  toCelsius: (f: number) => ((f - 32) * 5) / 9,
} as const;

export interface DeviceFilterOptions {
  /** Only include devices whose name is in this list (case-insensitive, trimmed). */
  allowList?: string[];
  /** Exclude devices whose name is in this list (case-insensitive, trimmed). */
  denyList?: string[];
}

function normalizeSet(list?: string[]): Set<string> {
  if (!list || list.length === 0) {
    return new Set();
  }
  return new Set(list.map((s) => s.trim().toLowerCase()));
}

/**
 * Filter devices in rooms by allowList and/or denyList.
 *
 * - If allowList is non-empty, only devices matching it are kept.
 * - If denyList is non-empty, matching devices are excluded.
 * - Both can be applied simultaneously (allowed AND not denied).
 * - Matching is case-insensitive and trimmed.
 * - Rooms with no remaining devices are excluded from the result.
 * - Returns a new array; input is not mutated.
 */
export function filterDevices(rooms: Rooms, options?: DeviceFilterOptions): Rooms {
  if (!options) {
    return rooms;
  }

  const allowSet = normalizeSet(options.allowList);
  const denySet = normalizeSet(options.denyList);

  if (allowSet.size === 0 && denySet.size === 0) {
    return rooms;
  }

  const filtered: Rooms = [];
  for (const room of rooms) {
    const devices = room.devices.filter((device) => {
      const name = device.name.trim().toLowerCase();
      if (allowSet.size > 0 && !allowSet.has(name)) {
        return false;
      }
      if (denySet.size > 0 && denySet.has(name)) {
        return false;
      }
      return true;
    });

    if (devices.length > 0) {
      filtered.push({ ...room, devices });
    }
  }

  return filtered;
}
