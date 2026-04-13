import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { autoRelockSeconds, isAutoRelockEnabled, DoorLockAlarm, isLockedAlarm } from '../src/lock.js';

describe('autoRelockSeconds', () => {
  it('should return timeout when enabled', () => {
    assert.equal(autoRelockSeconds(1, 30), 30);
    assert.equal(autoRelockSeconds(1, 60), 60);
  });
  it('should return 0 when disabled', () => {
    assert.equal(autoRelockSeconds(0, 30), 0);
    assert.equal(autoRelockSeconds(0, 60), 0);
  });
});

describe('isAutoRelockEnabled', () => {
  it('should return 1 for positive values', () => {
    assert.equal(isAutoRelockEnabled(30), 1);
    assert.equal(isAutoRelockEnabled(1), 1);
  });
  it('should return 0 for zero', () => {
    assert.equal(isAutoRelockEnabled(0), 0);
  });
});

describe('isLockedAlarm', () => {
  it('should return true for locked alarm codes', () => {
    assert.equal(isLockedAlarm(DoorLockAlarm.ManualLock), true);
    assert.equal(isLockedAlarm(DoorLockAlarm.RFLock), true);
    assert.equal(isLockedAlarm(DoorLockAlarm.KeypadLock), true);
    assert.equal(isLockedAlarm(DoorLockAlarm.AutoLock), true);
  });
  it('should return false for unlocked alarm codes', () => {
    assert.equal(isLockedAlarm(DoorLockAlarm.ManualUnlock), false);
    assert.equal(isLockedAlarm(DoorLockAlarm.RFUnlock), false);
    assert.equal(isLockedAlarm(DoorLockAlarm.KeypadUnlock), false);
  });
  it('should return null for unknown codes', () => {
    assert.equal(isLockedAlarm(0), null);
    assert.equal(isLockedAlarm(99), null);
    assert.equal(isLockedAlarm(DoorLockAlarm.Jammed), null);
  });
});
