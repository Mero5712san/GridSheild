import {
    generateSensorData,
    getGridHealth,
    getLoadManagementActions,
    predictOverload,
    getNodeConfigs,
    getSubstationMonitoring,
    getLoadFluctuationPrediction,
    getComponentHealth,
    getInfrastructureRecommendations,
    getSensorOptimization,
    getEnergyFlowVisualization,
    getGridStabilityControl,
    getEnergyUsageBilling,
    getRecommendationEngine,
    generateReportPayload,
} from "@/lib/simulationEngine";

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
    localTimer: null,
    tickRef: 0,
    localInstability: { ticks: 0, level: 0 },
    wsAttempts: 0,
    wsDisabled: false,
    pollingDisabled: false,
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

function hasBackendApi() {
    if (typeof window === "undefined") return false;
    if (getApiBaseUrl()) return true;

    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1";
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
        const error = new Error(`Snapshot request failed: ${response.status}`);
        error.status = response.status;
        throw error;
    }
    return response.json();
}

function startPolling() {
    if (!hasBackendApi()) return;
    if (store.pollingDisabled) return;
    if (store.pollTimer) return;

    const run = async () => {
        try {
            const remoteState = await fetchSnapshot();
            applyRemoteSnapshot(remoteState);
        } catch (error) {
            if (error?.status === 404) {
                store.pollingDisabled = true;
                stopPolling();
            }
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
    stopLocalSimulation();
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

function buildPageFeeds(state) {
    const alerts = state.alerts || [];
    const readings = state.readings || [];

    return {
        dashboard: {
            gridHealth: state.gridHealth,
            readings,
            history: state.history || [],
            alerts,
        },
        controlPanel: {
            readings,
            overloadZone: state.overloadZone,
            disconnectedNodes: state.disconnectedNodes || [],
            isRunning: state.isRunning,
        },
        alertsLog: {
            alerts,
            reversed: [...alerts].reverse(),
            counts: {
                critical: alerts.filter((a) => a.severity === "critical").length,
                warning: alerts.filter((a) => a.severity === "warning").length,
                success: alerts.filter((a) => a.severity === "success").length,
                info: alerts.filter((a) => a.severity === "info").length,
            },
        },
        nodeMonitoring: {
            rows: readings,
        },
        gridView3D: {
            readings,
            gridHealth: state.gridHealth,
            energyFlow: state.energyFlow,
            instabilityActive: state.instabilityActive,
        },
    };
}

function runLocalTick() {
    if (!store.state.isRunning) {
        emit();
        return;
    }

    const instabilityLevel = store.localInstability.level;
    const data = generateSensorData(store.state.overloadZone, store.state.disconnectedNodes, instabilityLevel);
    const health = getGridHealth(data);
    const newAlerts = [];

    data.forEach((node) => {
        const prediction = predictOverload(node.name);
        if (prediction.risk) {
            newAlerts.push({
                severity: "warning",
                message: `Overload predicted: ${node.name} (${prediction.riskPercent}%)`,
                action: `Predicted load: ${(prediction.predictedLoad / 1000).toFixed(1)} kW`,
                time: new Date().toLocaleTimeString(),
            });
        }
        if (node.status === "critical") {
            newAlerts.push({
                severity: "critical",
                message: `Critical load: ${node.name} at ${node.loadPercent}%`,
                action: `Power: ${(node.power / 1000).toFixed(1)} kW`,
                time: new Date().toLocaleTimeString(),
            });
        }
    });

    const actions = getLoadManagementActions(data);
    actions.forEach((action) => {
        newAlerts.push({
            severity: action.action === "disconnect" ? "warning" : "info",
            message: `${action.action === "disconnect" ? "Low priority load disconnected" : "Medium priority load reduced"}: ${action.node}`,
            action: action.reason,
            time: new Date().toLocaleTimeString(),
        });
    });

    if (instabilityLevel > 0.25) {
        newAlerts.push({
            severity: "critical",
            message: "Grid instability detected",
            action: `Fluctuation intensity ${(instabilityLevel * 100).toFixed(0)}%`,
            time: new Date().toLocaleTimeString(),
        });
    }

    if (newAlerts.length === 0 && store.tickRef % 5 === 0) {
        newAlerts.push({
            severity: "success",
            message: "Grid operating normally",
            action: `Health: ${health.healthScore}% | Load: ${health.loadPercent}%`,
            time: new Date().toLocaleTimeString(),
        });
    }

    const totalLoad = data.reduce((sum, reading) => sum + reading.power, 0);
    const predicted = totalLoad * (1 + (Math.random() - 0.3) * 0.15);
    const timeLabel = new Date().toLocaleTimeString();
    const substationMonitoring = getSubstationMonitoring(data);
    const loadFluctuationPrediction = getLoadFluctuationPrediction(data);
    const componentHealth = getComponentHealth(data);
    const infrastructureRecommendations = getInfrastructureRecommendations(data, componentHealth);
    const sensorOptimization = getSensorOptimization(data);
    const energyFlow = getEnergyFlowVisualization(data);
    const stabilityControl = getGridStabilityControl(data, health);
    const billing = getEnergyUsageBilling(data);
    const recommendationEngine = getRecommendationEngine(
        data,
        actions,
        loadFluctuationPrediction,
        infrastructureRecommendations,
        stabilityControl
    );

    const avgSubstationLoad = Math.round(
        substationMonitoring.reduce((sum, station) => sum + station.transformerLoadPercent, 0)
        / Math.max(substationMonitoring.length, 1)
    );
    const avgVoltage = Math.round(
        substationMonitoring.reduce((sum, station) => sum + station.voltage, 0)
        / Math.max(substationMonitoring.length, 1)
    );

    const moduleTrends = {
        substationLoadHistory: [...store.state.moduleTrends.substationLoadHistory, {
            time: timeLabel,
            avgLoad: avgSubstationLoad,
            peakUtilization: Math.max(...substationMonitoring.map((station) => station.transformerLoadPercent), 0),
        }].slice(-40),
        voltageFluctuationHistory: [...store.state.moduleTrends.voltageFluctuationHistory, {
            time: timeLabel,
            avgVoltage,
            minVoltage: Math.min(...substationMonitoring.map((station) => station.voltage), avgVoltage),
            maxVoltage: Math.max(...substationMonitoring.map((station) => station.voltage), avgVoltage),
        }].slice(-40),
        sensorOptimizationHistory: [...store.state.moduleTrends.sensorOptimizationHistory, {
            time: timeLabel,
            requiredSensors: sensorOptimization.requiredSensors,
            savings: sensorOptimization.savingPercent,
            coverage: sensorOptimization.coveragePercent,
        }].slice(-40),
        predictionHistory: [...store.state.moduleTrends.predictionHistory, {
            time: timeLabel,
            current: loadFluctuationPrediction.timeline[0]?.value ?? 0,
            predicted: loadFluctuationPrediction.timeline[2]?.value ?? 0,
            overloadProbability: loadFluctuationPrediction.overloadProbability,
        }].slice(-40),
        componentHealthHistory: [...store.state.moduleTrends.componentHealthHistory, {
            time: timeLabel,
            averageHealth: componentHealth.averageHealth,
            atRisk: componentHealth.atRiskCount,
            failureProbability: componentHealth.failureProbability,
        }].slice(-40),
        infrastructureHistory: [...store.state.moduleTrends.infrastructureHistory, {
            time: timeLabel,
            overloadedNodes: infrastructureRecommendations.overloadedNodes,
            capacityShortage: infrastructureRecommendations.capacityShortage,
            upgradeRequired: infrastructureRecommendations.upgradeRequired,
        }].slice(-40),
        stabilityHistory: [...store.state.moduleTrends.stabilityHistory, {
            time: timeLabel,
            stabilityScore: stabilityControl.stabilityScore,
            gridBalance: stabilityControl.gridBalancePercent,
            imbalanceNodes: stabilityControl.imbalanceNodes,
        }].slice(-40),
        energyFlowHistory: [...store.state.moduleTrends.energyFlowHistory, {
            time: timeLabel,
            green: energyFlow.summary.green,
            yellow: energyFlow.summary.yellow,
            red: energyFlow.summary.red,
            blue: energyFlow.summary.blue,
        }].slice(-40),
    };

    const mergedAlerts = [...store.state.alerts, ...newAlerts].slice(-50);
    const nextState = {
        ...store.state,
        readings: data,
        gridHealth: health,
        alerts: mergedAlerts,
        history: [...store.state.history, {
            time: new Date().toLocaleTimeString(),
            load: totalLoad,
            predicted: Math.round(predicted),
        }].slice(-30),
        recommendationEngine,
        substationMonitoring,
        sensorOptimization,
        loadFluctuationPrediction,
        componentHealth,
        infrastructureRecommendations,
        energyFlow,
        stabilityControl,
        moduleTrends,
        billing,
        report: generateReportPayload({
            gridHealth: health,
            substationMonitoring,
            recommendationEngine,
            loadFluctuationPrediction,
            componentHealth,
            infrastructureRecommendations,
            billing,
            alerts: mergedAlerts,
        }),
        instabilityActive: store.localInstability.ticks > 0 || instabilityLevel > 0,
    };

    store.state = {
        ...nextState,
        pageFeeds: buildPageFeeds(nextState),
        connectionStatus: "connected",
        app: { ...nextState.app, mode: "local-simulation" },
    };

    if (store.localInstability.ticks > 0) {
        store.localInstability.ticks -= 1;
        store.localInstability.level = Math.max(0, store.localInstability.level * 0.82 - 0.04);
        if (store.localInstability.ticks === 0) {
            store.localInstability.level = 0;
        }
    }

    store.tickRef += 1;
    emit();
}

function startLocalSimulation() {
    if (store.localTimer) return;
    runLocalTick();
    store.localTimer = setInterval(runLocalTick, 2000);
}

function stopLocalSimulation() {
    if (!store.localTimer) return;
    clearInterval(store.localTimer);
    store.localTimer = null;
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
        startLocalSimulation();
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
        startLocalSimulation();
    }
}

function sendCommand(command, payload = {}) {
    if (!store.backendMode) {
        if (command === "triggerInstability") {
            store.localInstability = { ticks: 7, level: 1 };
            store.state = {
                ...store.state,
                instabilityActive: true,
                alerts: [
                    {
                        severity: "critical",
                        message: "Grid destabilization event triggered",
                        action: "High fluctuation mode active for next few cycles",
                        time: new Date().toLocaleTimeString(),
                    },
                    ...store.state.alerts,
                ].slice(0, 50),
            };
            emit();
            runLocalTick();
            return true;
        }

        if (command === "triggerOverload") {
            store.state = { ...store.state, overloadZone: payload.zone };
            emit();
            runLocalTick();
            return true;
        }

        if (command === "clearOverload") {
            store.state = { ...store.state, overloadZone: null };
            emit();
            runLocalTick();
            return true;
        }

        if (command === "toggleNode") {
            const nodeName = payload.nodeName;
            const disconnected = new Set(store.state.disconnectedNodes);
            if (disconnected.has(nodeName)) disconnected.delete(nodeName);
            else disconnected.add(nodeName);
            store.state = { ...store.state, disconnectedNodes: [...disconnected] };
            emit();
            runLocalTick();
            return true;
        }

        if (command === "toggleSimulation") {
            store.state = { ...store.state, isRunning: !store.state.isRunning };
            emit();
            return true;
        }

        return false;
    }

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
