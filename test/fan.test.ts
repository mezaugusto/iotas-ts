import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { FanMode, parseFanModeString, parseFanModes, getFanModeAt, findFanModeIndex } from '../src/fan.js';

describe('parseFanModeString', () => {
  it('should parse "Auto Low"', () => {
    assert.equal(parseFanModeString('Auto Low'), FanMode.AutoLow);
  });
  it('should parse "On Low"', () => {
    assert.equal(parseFanModeString('On Low'), FanMode.OnLow);
  });
  it('should parse "Circulate"', () => {
    assert.equal(parseFanModeString('Circulate'), FanMode.Circulate);
  });
  it('should be case-insensitive', () => {
    assert.equal(parseFanModeString('AUTO LOW'), FanMode.AutoLow);
    assert.equal(parseFanModeString('on low'), FanMode.OnLow);
    assert.equal(parseFanModeString('CIRCULATE'), FanMode.Circulate);
  });
  it('should return Unknown for unrecognized strings', () => {
    assert.equal(parseFanModeString('turbo'), FanMode.Unknown);
    assert.equal(parseFanModeString(''), FanMode.Unknown);
  });
});

describe('parseFanModes', () => {
  it('should parse colon-delimited values string', () => {
    const modes = parseFanModes('Auto Low:On Low:Circulate');
    assert.deepEqual(modes, [FanMode.AutoLow, FanMode.OnLow, FanMode.Circulate]);
  });
  it('should return empty array for undefined', () => {
    assert.deepEqual(parseFanModes(undefined), []);
  });
  it('should return empty array for empty string', () => {
    assert.deepEqual(parseFanModes(''), []);
  });
});

describe('getFanModeAt', () => {
  const modes = [FanMode.AutoLow, FanMode.OnLow, FanMode.Circulate];

  it('should return mode at valid index', () => {
    assert.equal(getFanModeAt(modes, 0), FanMode.AutoLow);
    assert.equal(getFanModeAt(modes, 1), FanMode.OnLow);
    assert.equal(getFanModeAt(modes, 2), FanMode.Circulate);
  });
  it('should return AutoLow for out-of-bounds index', () => {
    assert.equal(getFanModeAt(modes, -1), FanMode.AutoLow);
    assert.equal(getFanModeAt(modes, 99), FanMode.AutoLow);
  });
});

describe('findFanModeIndex', () => {
  const modes = [FanMode.AutoLow, FanMode.OnLow, FanMode.Circulate];

  it('should find existing mode', () => {
    assert.equal(findFanModeIndex(modes, FanMode.OnLow), 1);
  });
  it('should return -1 for missing mode', () => {
    assert.equal(findFanModeIndex(modes, FanMode.Unknown), -1);
  });
});
