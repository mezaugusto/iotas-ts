export function autoRelockSeconds(enabled: number, timeoutSeconds: number): number {
  return enabled === 1 ? timeoutSeconds : 0;
}

export function isAutoRelockEnabled(seconds: number): number {
  return seconds > 0 ? 1 : 0;
}

export enum DoorLockAlarm {
  Jammed = 9,
  ManualLock = 21,
  ManualUnlock = 22,
  RFLock = 23,
  RFUnlock = 24,
  KeypadLock = 25,
  KeypadUnlock = 26,
  AutoLock = 27,
}

const LOCKED_ALARMS = new Set<number>([
  DoorLockAlarm.ManualLock,
  DoorLockAlarm.RFLock,
  DoorLockAlarm.KeypadLock,
  DoorLockAlarm.AutoLock,
]);

const UNLOCKED_ALARMS = new Set<number>([
  DoorLockAlarm.ManualUnlock,
  DoorLockAlarm.RFUnlock,
  DoorLockAlarm.KeypadUnlock,
]);

export function isLockedAlarm(alarmCode: number): boolean | null {
  if (LOCKED_ALARMS.has(alarmCode)) {
    return true;
  }
  if (UNLOCKED_ALARMS.has(alarmCode)) {
    return false;
  }
  return null;
}
