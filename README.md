# Grid Monitoring

Smart-grid dashboard with a websocket-backed simulation backend.

## Architecture

The application shares one live simulation state across the dashboard, 3D view, alerts, node table, and control panel.

The backend is the only source of truth. The frontend connects over WebSocket and renders server snapshots only.

## Getting Started

1. Install dependencies:
	`npm install`
2. Start the websocket backend:
	`npm run server`
3. Start the frontend dev server:
	`npm run dev`

Or run both in development:

```bash
npm run dev:full
```

## Production Serve

Build the frontend and serve it from the backend:

```bash
npm run serve
```

## WebSocket Endpoint

- URL: `ws://localhost:3001/ws`
- Override with `VITE_GRID_WS_URL` if needed

## WebSocket Commands

- `subscribe` - receive the initial snapshot
- `requestSnapshot` - fetch the current application state
- `triggerInstability` - force a grid fluctuation event
- `triggerOverload` - set an overload zone
- `clearOverload` - clear overload mode
- `toggleNode` - disconnect/reconnect a node
- `toggleSimulation` - pause/resume the simulation
- `getNodeConfigs` - retrieve all configured nodes

## Data Streams

The backend broadcasts snapshots containing:

- `readings`
- `gridHealth`
- `alerts`
- `history`
- `overloadZone`
- `disconnectedNodes`
- `isRunning`
- `instabilityActive`
- `nodeConfigs`
- `pageFeeds.dashboard`
- `pageFeeds.controlPanel`
- `pageFeeds.alertsLog`
- `pageFeeds.nodeMonitoring`
- `pageFeeds.gridView3D`
- connection metadata

## Page Feed Endpoint

- URL: `http://localhost:3001/api/pages/:pageName`
- Supported page names:
	- `dashboard`
	- `controlPanel`
	- `alertsLog`
	- `nodeMonitoring`
	- `gridView3D`

## Project Structure

- `server/` websocket backend and simulation runtime
- `src/pages/` app pages
- `src/components/`, `src/hooks/`, `src/lib/`, `src/utils/` supporting modules
- Root config files for Vite, ESLint, Tailwind, and PostCSS
