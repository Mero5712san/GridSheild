import { getNodeConfigs } from "@/lib/simulationEngine";

function createInitialState() {
    return {
        readings: [],
        gridHealth: null,
        alerts: [],
        history: [],
        recommendationEngine: [],
        substationMonitoring: [],
        sensorOptimization: null,
        loadFluctuationPrediction: { zones: [] },
        componentHealth: null,
        infrastructureRecommendations: { actions: [], overloadedNodes: 0, upgradeRequired: 0, capacityShortage: 0 },
        energyFlow: { flows: [], summary: { green: 0, yellow: 0, red: 0, blue: 0 } },
        stabilityControl: null,
        moduleTrends: {
            substationLoadHistory: [],
            voltageFluctuationHistory: [],
            sensorOptimizationHistory: [],
            predictionHistory: [],
            componentHealthHistory: [],
            infrastructureHistory: [],
            stabilityHistory: [],
            energyFlowHistory: [],
        },
        billing: null,
        report: null,
        overloadZone: null,
        disconnectedNodes: [],
        isRunning: true,
        instabilityActive: false,
        pageFeeds: {
            dashboard: null,
            controlPanel: null,
            alertsLog: null,
            nodeMonitoring: null,
            gridView3D: null,
        },
        connectionStatus: "connecting",
        nodeConfigs: getNodeConfigs(),
        app: {
            name: "GridShield",
            mode: "backend-only",
            version: "1.0.0",
        },
    };
}

const store = globalThis.__gridSimulationClient || {
    state: createInitialState(),
    listeners: new Set(),
    started: false,
    socket: null,
    reconnectTimer: null,
    pollTimer: null,
    wsAttempts: 0,
    wsDisabled: false,
    backendMode: false,
};

globalThis.__gridSimulationClient = store;

function emit() {
    store.listeners.forEach((listener) => listener());
}

function getApiBaseUrl() {
    const configuredApiUrl = import.meta.env.VITE_GRID_API_URL;
    if (configuredApiUrl) {
        return configuredApiUrl.replace(/\/$/, "");
    }
    return "";
}

function shouldUseWebSocket() {
    if (typeof window === "undefined") return false;
    if (store.wsDisabled) return false;

    const explicitWsUrl = import.meta.env.VITE_GRID_WS_URL;
    if (explicitWsUrl) return true;

    const host = window.location.hostname;
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    if (isLocalHost) return true;

    // Vercel deployments commonly do not support long-lived websocket upgrades.
    // Opt in explicitly with VITE_GRID_WS_URL when a dedicated WS backend exists.
    return false;
}

function getWsUrl() {
    if (typeof window === "undefined") return null;

    const configuredWsUrl = import.meta.env.VITE_GRID_WS_URL;
    if (configuredWsUrl) return configuredWsUrl;

    const configuredApiUrl = import.meta.env.VITE_GRID_API_URL;
    if (configuredApiUrl) {
        try {
            const apiUrl = new URL(configuredApiUrl);
            const wsProtocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
            return `${wsProtocol}//${apiUrl.host}/ws`;
        } catch {
            // Ignore invalid API URL and continue with automatic fallback.
        }
    }

    const host = window.location.hostname;
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    if (isLocalHost) {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        return `${protocol}//${host}:3001/ws`;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
}

async function fetchSnapshot() {
    const apiBase = getApiBaseUrl();
    const response = await fetch(`${apiBase}/api/state`, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    if (!response.ok) {
        throw new Error(`Snapshot request failed: ${response.status}`);
    }
    return response.json();
}

function startPolling() {
    if (store.pollTimer) return;

    const run = async () => {
        try {
            const remoteState = await fetchSnapshot();
            applyRemoteSnapshot(remoteState);
        } catch {
            store.backendMode = false;
            store.state = { ...store.state, connectionStatus: "offline", app: { ...store.state.app, mode: "backend-only" } };
            emit();
        }
    };

    run();
    store.pollTimer = setInterval(run, 3000);
}

function stopPolling() {
    if (!store.pollTimer) return;
    clearInterval(store.pollTimer);
    store.pollTimer = null;
}

function applyRemoteSnapshot(remoteState) {
    store.backendMode = true;
    store.state = {
        ...createInitialState(),
        ...remoteState,
        connectionStatus: "connected",
        app: {
            name: "GridShield",
            mode: "websocket",
            version: "1.0.0",
            ...(remoteState?.app || {}),
        },
        nodeConfigs: remoteState?.nodeConfigs || getNodeConfigs(),
    };
    emit();
}

function scheduleReconnect() {
    if (store.reconnectTimer || typeof window === "undefined") return;
    store.reconnectTimer = setTimeout(() => {
        store.reconnectTimer = null;
        connectBackend();
    }, 3000);
}

function connectBackend() {
    if (typeof window === "undefined") return;

    if (!shouldUseWebSocket()) {
        startPolling();
        return;
    }

    if (store.socket && (store.socket.readyState === WebSocket.OPEN || store.socket.readyState === WebSocket.CONNECTING)) {
        return;
    }

    const wsUrl = getWsUrl();
    if (!wsUrl) return;

    try {
        stopPolling();
        const socket = new WebSocket(wsUrl);
        store.socket = socket;
        store.wsAttempts += 1;
        store.state = { ...store.state, connectionStatus: "connecting" };
        emit();

        socket.addEventListener("open", () => {
            store.wsAttempts = 0;
            store.backendMode = true;
            store.state = {
                ...store.state,
                connectionStatus: "connected",
                app: { ...store.state.app, mode: "websocket" },
            };
            emit();
            socket.send(JSON.stringify({ type: "subscribe" }));
            socket.send(JSON.stringify({ type: "requestSnapshot" }));
        });

        socket.addEventListener("message", (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === "snapshot" && message.state) {
                    applyRemoteSnapshot(message.state);
                } else if (message.type === "init" && message.state) {
                    applyRemoteSnapshot(message.state);
                } else if (message.type === "nodeConfigs" && message.nodes) {
                    store.state = { ...store.state, nodeConfigs: message.nodes };
                    emit();
                }
            } catch {
                // Ignore malformed messages; the next snapshot will correct state.
            }
        });

        socket.addEventListener("close", () => {
            if (store.socket === socket) {
                store.socket = null;
            }
            store.backendMode = false;
            store.state = { ...store.state, connectionStatus: "offline", app: { ...store.state.app, mode: "backend-only" } };
            emit();

            // Avoid infinite websocket retry noise on hosted builds.
            if (store.wsAttempts >= 1 && typeof window !== "undefined" && window.location.hostname.endsWith("vercel.app")) {
                store.wsDisabled = true;
                startPolling();
                return;
            }

            scheduleReconnect();
        });

        socket.addEventListener("error", () => {
            // The close handler will handle fallback and reconnect.
        });
    } catch {
        store.backendMode = false;
        store.state = { ...store.state, connectionStatus: "offline", app: { ...store.state.app, mode: "backend-only" } };
        emit();
        startPolling();
    }
}

function sendCommand(command, payload = {}) {
    const message = JSON.stringify({ type: command, command, ...payload });
    if (store.socket && store.socket.readyState === WebSocket.OPEN) {
        store.socket.send(message);
        return true;
    }
    return false;
}

function triggerInstability() {
    sendCommand("triggerInstability");
}

function triggerOverload(zone) {
    sendCommand("triggerOverload", { zone });
}

function clearOverload() {
    sendCommand("clearOverload");
}

function toggleNode(nodeName) {
    sendCommand("toggleNode", { nodeName });
}

function toggleSimulation() {
    sendCommand("toggleSimulation");
}

function applyRecommendation(id, decision = "approved") {
    sendCommand("applyRecommendation", { id, decision });
}

function ensureStarted() {
    if (store.started) return;
    store.started = true;
    connectBackend();
}

export function subscribe(listener) {
    ensureStarted();
    store.listeners.add(listener);
    return () => {
        store.listeners.delete(listener);
    };
}

export function getSnapshot() {
    ensureStarted();
    return store.state;
}

export {
    triggerInstability,
    triggerOverload,
    clearOverload,
    toggleNode,
    toggleSimulation,
    applyRecommendation,
    connectBackend,
};
