# iotas-ts

[![npm](https://img.shields.io/npm/v/iotas-ts)](https://www.npmjs.com/package/iotas-ts)

TypeScript client library for the [IOTAS](https://www.iotashome.com/) smart home platform. Provides API access, device discovery, feature caching with background polling, and shared utilities for building IOTAS integrations.

Used by [homebridge-iotas](https://github.com/mezaugusto/homebridge-iotas) and [matterbridge-iotas](https://github.com/mezaugusto/matterbridge-iotas).

## Features

- **API Client** — authenticate, discover rooms/devices/features, read/write feature values
- **Feature Cache** — background polling with per-device write barriers, subscription model for push updates
- **Device Quirks** — automatic handling of Z-Wave reliability issues and lock timing
- **Thermostat Utilities** — mode parsing, temperature conversion (°F ↔ °C)
- **Device Helpers** — serial number, manufacturer/model extraction, feature lookups
- **Shared Constants** — thermostat defaults, battery threshold

## Installation

```bash
npm install iotas-ts
```

Requires Node.js ^20.18.0, ^22.10.0, or ^24.0.0. ESM only.

## Quick Start

```typescript
import { IotasClient, FeatureCache } from 'iotas-ts';

// Create a client
const client = IotasClient.withCredentials(logger, 'email', 'password');

// Discover devices
const rooms = await client.getRooms();

// Set up cached polling
const cache = new FeatureCache(logger, client, { pollIntervalMs: 5000 });
cache.seed(rooms);

// Subscribe to changes
cache.subscribe(['featureId1', 'featureId2'], (changed) => {
  for (const [id, value] of changed) {
    console.log(`Feature ${id} changed to ${value}`);
  }
});

cache.start();

// Write a value (updates cache + sends API request)
cache.writeThrough('featureId1', 1);
```

## API

### IotasClient

High-level API client with JWT authentication, token refresh, and unit resolution.

| Method | Description |
|---|---|
| `withCredentials(log, email, password, unit?)` | Factory method |
| `getRooms()` | Discover all rooms, devices, and features |
| `getFeature(id)` | Look up a single feature by ID |
| `updateFeature(id, value)` | Send a PUT to update a feature value |

### FeatureCache

Background polling cache with write barriers and change subscriptions.

| Method | Description |
|---|---|
| `seed(rooms)` | Populate cache from a rooms snapshot |
| `get(featureId)` | Read cached value (synchronous) |
| `set(featureId, value)` | Update cache locally with write barrier |
| `writeThrough(featureId, value)` | Update cache + send API request |
| `subscribe(featureIds, callback)` | Watch for changes, returns disposer |
| `start()` / `stop()` / `reset()` | Polling lifecycle |

**Write barriers** prevent stale poll data from overwriting recent writes. Barriers are per-device: locks get a 15-second window (they take ~10s to actuate), other devices get 5 seconds. If a poll confirms the pending value, the barrier clears early.

### Utilities

| Export | Description |
|---|---|
| `Temperature.toCelsius(f)` / `.toFahrenheit(c)` | Temperature conversion |
| `filterDevices(rooms, options)` | Allow/deny list filtering |
| `getSerialNumber(device)` / `getManufacturer(device)` / `getModel(device)` | Device metadata |
| `findFeatureByCategory(device, category)` | Find feature by category |
| `findFeatureByEventType(device, eventType)` | Find feature by event type |
| `isReadOnlyCategory(category)` / `isSupportedDevice(device)` | Device predicates |
| `parseThermostatModes(values)` / `getThermostatModeAt(modes, index)` | Thermostat mode helpers |

### Shared Constants

| Constant | Value | Description |
|---|---|---|
| `DEFAULT_CURRENT_TEMPERATURE_F` | `70` | Fallback current temperature |
| `DEFAULT_HEAT_SETPOINT_F` | `68` | Default heating setpoint |
| `DEFAULT_COOL_SETPOINT_F` | `76` | Default cooling setpoint |
| `LOW_BATTERY_THRESHOLD` | `20` | Battery level % for low warning |

## Development

```bash
npm run build         # Clean build (rm -rf dist && tsc)
npm run lint          # ESLint
npm run format        # Prettier format
npm run format:check  # Prettier check
npm test              # Build then run: tsc && node --test dist/test/*.test.js
```

## License

[Apache-2.0](LICENSE)
