import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterDevices } from '../src/utils.js';
import type { Rooms } from '../src/types.js';

function makeRooms(): Rooms {
  return [
    {
      id: 1,
      unit: 100,
      name: 'Living Room',
      devices: [
        {
          id: 10,
          room: 1,
          deviceTemplateId: 1,
          deviceType: 1,
          name: 'Floor Lamp',
          category: 'dimmer',
          active: true,
          movable: false,
          secure: false,
          paired: true,
          features: [
            {
              id: 100,
              device: 10,
              featureType: 1,
              featureTypeName: 'OnOff',
              featureTypeCategory: 'switch',
              name: 'OnOff',
              isLight: true,
              value: 1,
            },
          ],
        },
        {
          id: 11,
          room: 1,
          deviceTemplateId: 2,
          deviceType: 2,
          name: 'TV Outlet',
          category: 'switch',
          active: true,
          movable: false,
          secure: false,
          paired: true,
          features: [
            {
              id: 101,
              device: 11,
              featureType: 1,
              featureTypeName: 'OnOff',
              featureTypeCategory: 'switch',
              name: 'OnOff',
              isLight: false,
              value: 0,
            },
          ],
        },
      ],
    },
    {
      id: 2,
      unit: 100,
      name: 'Bedroom',
      devices: [
        {
          id: 20,
          room: 2,
          deviceTemplateId: 1,
          deviceType: 1,
          name: 'Bedside Lamp',
          category: 'dimmer',
          active: true,
          movable: false,
          secure: false,
          paired: true,
          features: [
            {
              id: 200,
              device: 20,
              featureType: 1,
              featureTypeName: 'OnOff',
              featureTypeCategory: 'switch',
              name: 'OnOff',
              isLight: true,
              value: 0,
            },
          ],
        },
      ],
    },
  ];
}

describe('filterDevices', () => {
  it('returns all rooms when no options provided', () => {
    const rooms = makeRooms();
    const result = filterDevices(rooms);
    assert.equal(result.length, 2);
    assert.equal(result[0].devices.length, 2);
    assert.equal(result[1].devices.length, 1);
  });

  it('returns all rooms when empty lists provided', () => {
    const rooms = makeRooms();
    const result = filterDevices(rooms, { allowList: [], denyList: [] });
    assert.equal(result.length, 2);
  });

  it('filters by allowList (case-insensitive)', () => {
    const rooms = makeRooms();
    const result = filterDevices(rooms, { allowList: ['floor lamp'] });
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'Living Room');
    assert.equal(result[0].devices.length, 1);
    assert.equal(result[0].devices[0].name, 'Floor Lamp');
  });

  it('filters by denyList (case-insensitive)', () => {
    const rooms = makeRooms();
    const result = filterDevices(rooms, { denyList: ['TV OUTLET'] });
    assert.equal(result.length, 2);
    assert.equal(result[0].devices.length, 1);
    assert.equal(result[0].devices[0].name, 'Floor Lamp');
  });

  it('applies both allowList and denyList', () => {
    const rooms = makeRooms();
    const result = filterDevices(rooms, {
      allowList: ['Floor Lamp', 'TV Outlet'],
      denyList: ['TV Outlet'],
    });
    assert.equal(result.length, 1);
    assert.equal(result[0].devices.length, 1);
    assert.equal(result[0].devices[0].name, 'Floor Lamp');
  });

  it('excludes rooms with no remaining devices', () => {
    const rooms = makeRooms();
    const result = filterDevices(rooms, { denyList: ['Bedside Lamp'] });
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'Living Room');
  });

  it('trims whitespace in filter names', () => {
    const rooms = makeRooms();
    const result = filterDevices(rooms, { allowList: ['  Floor Lamp  '] });
    assert.equal(result.length, 1);
    assert.equal(result[0].devices[0].name, 'Floor Lamp');
  });

  it('does not mutate input rooms', () => {
    const rooms = makeRooms();
    const originalDeviceCount = rooms[0].devices.length;
    filterDevices(rooms, { allowList: ['Floor Lamp'] });
    assert.equal(rooms[0].devices.length, originalDeviceCount);
  });
});
