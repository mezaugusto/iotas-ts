export enum FanMode {
  AutoLow = 0,
  OnLow = 1,
  Circulate = 2,
  Unknown = -1,
}

export function parseFanModeString(modeStr: string): FanMode {
  const lower = modeStr.toLowerCase().trim();
  if (lower.includes('auto')) {
    return FanMode.AutoLow;
  }
  if (lower.includes('on')) {
    return FanMode.OnLow;
  }
  if (lower.includes('circulate')) {
    return FanMode.Circulate;
  }
  return FanMode.Unknown;
}

export function parseFanModes(valuesString?: string): FanMode[] {
  if (!valuesString) {
    return [];
  }
  return valuesString.split(':').map(parseFanModeString);
}

export function getFanModeAt(modes: FanMode[], index: number): FanMode {
  if (index < 0 || index >= modes.length) {
    return FanMode.AutoLow;
  }
  return modes[index];
}

export function findFanModeIndex(modes: FanMode[], mode: FanMode): number {
  return modes.indexOf(mode);
}
