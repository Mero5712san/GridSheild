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
        infrastructureRecommendations: [],
        energyFlow: [],
        stabilityControl: null,
        billing: null,
        report: null,
        overloadZone: null,
        disconnectedNodes: [],
        isRunning: true,
        instabilityActive: false,
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
    backendMode: false,
};

globalThis.__gridSimulationClient = store;

function emit() {
    store.listeners.forEach((listener) => listener());
}

function setState(updater) {
    const nextState = typeof updater === "function" ? updater(store.state) : updater;
    store.state = nextState;
    emit();
}

function getWsUrl() {
    if (typeof window === "undefined") return null;

    const configured = import.meta.env.VITE_GRID_WS_URL;
    if (configured) return configured;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.hostname}:3001/ws`;
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
    if (store.socket && (store.socket.readyState === WebSocket.OPEN || store.socket.readyState === WebSocket.CONNECTING)) {
        return;
    }

    const wsUrl = getWsUrl();
    if (!wsUrl) return;

    try {
        const socket = new WebSocket(wsUrl);
        store.socket = socket;
        store.state = { ...store.state, connectionStatus: "connecting" };
        emit();

        socket.addEventListener("open", () => {
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
            scheduleReconnect();
        });

        socket.addEventListener("error", () => {
            // The close handler will handle fallback and reconnect.
        });
    } catch {
        store.backendMode = false;
        store.state = { ...store.state, connectionStatus: "offline", app: { ...store.state.app, mode: "backend-only" } };
        emit();
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
    connectBackend,
};
