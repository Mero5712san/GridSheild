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
} from "../src/lib/simulationEngine.js";

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
    };
}

export class GridSimulationRuntime {
    constructor() {
        this.state = createInitialState();
        this.tickRef = 0;
        this.instabilityRef = { ticks: 0, level: 0 };
        this.clients = new Set();
    }

    getSnapshot() {
        return {
            ...this.state,
            nodeConfigs: getNodeConfigs(),
            app: {
                name: "GridShield",
                mode: "websocket",
                version: "1.0.0",
            },
            connectionStatus: "connected",
            serverTime: new Date().toISOString(),
        };
    }

    emit() {
        const payload = JSON.stringify({ type: "snapshot", state: this.getSnapshot() });
        this.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send(payload);
            }
        });
    }

    setState(patch) {
        this.state = {
            ...this.state,
            ...patch,
        };
        this.emit();
    }

    addAlert(alert) {
        this.setState((prev) => ({
            ...prev,
            alerts: [alert, ...this.state.alerts].slice(0, 50),
        }));
    }

    runTick() {
        if (!this.state.isRunning) {
            this.emit();
            return;
        }

        const instabilityLevel = this.instabilityRef.level;
        const data = generateSensorData(this.state.overloadZone, this.state.disconnectedNodes, instabilityLevel);
        const health = getGridHealth(data);
        const newAlerts = [];

        data.forEach((node) => {
            const prediction = predictOverload(node.name);
            if (prediction.risk) {
                newAlerts.push({
                    severity: "warning",
                    message: `⚠ Overload predicted: ${node.name} (${prediction.riskPercent}%)`,
                    action: `Predicted load: ${(prediction.predictedLoad / 1000).toFixed(1)} kW`,
                    time: new Date().toLocaleTimeString(),
                });
            }
            if (node.status === "critical") {
                newAlerts.push({
                    severity: "critical",
                    message: `🔴 Critical load: ${node.name} at ${node.loadPercent}%`,
                    action: `Power: ${(node.power / 1000).toFixed(1)} kW`,
                    time: new Date().toLocaleTimeString(),
                });
            }
        });

        const actions = getLoadManagementActions(data);
        actions.forEach((action) => {
            newAlerts.push({
                severity: action.action === "disconnect" ? "warning" : "info",
                message: `⚡ ${action.action === "disconnect" ? "Low priority load disconnected" : "Medium priority load reduced"}: ${action.node}`,
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

        if (newAlerts.length === 0 && this.tickRef % 5 === 0) {
            newAlerts.push({
                severity: "success",
                message: "Grid operating normally",
                action: `Health: ${health.healthScore}% | Load: ${health.loadPercent}%`,
                time: new Date().toLocaleTimeString(),
            });
        }

        const totalLoad = data.reduce((sum, reading) => sum + reading.power, 0);
        const predicted = totalLoad * (1 + (Math.random() - 0.3) * 0.15);
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

        this.state = {
            ...this.state,
            readings: data,
            gridHealth: health,
            alerts: [...this.state.alerts, ...newAlerts].slice(-50),
            history: [...this.state.history, {
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
            billing,
            report: generateReportPayload({
                gridHealth: health,
                substationMonitoring,
                recommendationEngine,
                loadFluctuationPrediction,
                componentHealth,
                infrastructureRecommendations,
                billing,
                alerts: [...this.state.alerts, ...newAlerts].slice(-50),
            }),
            instabilityActive: this.instabilityRef.ticks > 0 || instabilityLevel > 0,
        };

        if (this.instabilityRef.ticks > 0) {
            this.instabilityRef.ticks -= 1;
            this.instabilityRef.level = Math.max(0, this.instabilityRef.level * 0.82 - 0.04);
            if (this.instabilityRef.ticks === 0) {
                this.instabilityRef.level = 0;
            }
        }

        this.tickRef += 1;
        this.emit();
    }

    triggerInstability() {
        this.instabilityRef = { ticks: 7, level: 1 };
        this.state = {
            ...this.state,
            instabilityActive: true,
            alerts: [
                {
                    severity: "critical",
                    message: "Grid destabilization event triggered",
                    action: "High fluctuation mode active for next few cycles",
                    time: new Date().toLocaleTimeString(),
                },
                ...this.state.alerts,
            ].slice(0, 50),
        };
        this.emit();
        this.runTick();
    }

    triggerOverload(zone) {
        this.state = { ...this.state, overloadZone: zone };
        this.emit();
        this.runTick();
    }

    clearOverload() {
        this.state = { ...this.state, overloadZone: null };
        this.emit();
        this.runTick();
    }

    toggleNode(nodeName) {
        const disconnectedNodes = this.state.disconnectedNodes.includes(nodeName)
            ? this.state.disconnectedNodes.filter((node) => node !== nodeName)
            : [...this.state.disconnectedNodes, nodeName];

        this.state = { ...this.state, disconnectedNodes };
        this.emit();
        this.runTick();
    }

    toggleSimulation() {
        this.state = { ...this.state, isRunning: !this.state.isRunning };
        this.emit();
        if (this.state.isRunning) {
            this.runTick();
        }
    }

    handleCommand(message, client) {
        const command = message?.command || message?.type;

        switch (command) {
            case "subscribe":
            case "requestSnapshot":
                client.send(JSON.stringify({ type: "snapshot", state: this.getSnapshot() }));
                break;
            case "triggerInstability":
                this.triggerInstability();
                break;
            case "triggerOverload":
                this.triggerOverload(message?.zone ?? null);
                break;
            case "clearOverload":
                this.clearOverload();
                break;
            case "toggleNode":
                if (message?.nodeName) {
                    this.toggleNode(message.nodeName);
                }
                break;
            case "toggleSimulation":
                this.toggleSimulation();
                break;
            case "getNodeConfigs":
                client.send(JSON.stringify({ type: "nodeConfigs", nodes: getNodeConfigs() }));
                break;
            default:
                client.send(JSON.stringify({ type: "error", message: `Unknown command: ${command}` }));
                break;
        }
    }

    connect(client) {
        this.clients.add(client);
        client.send(JSON.stringify({ type: "init", state: this.getSnapshot() }));
        client.on("close", () => {
            this.clients.delete(client);
        });
        client.on("message", (raw) => {
            try {
                const message = JSON.parse(raw.toString());
                this.handleCommand(message, client);
            } catch {
                client.send(JSON.stringify({ type: "error", message: "Invalid JSON message" }));
            }
        });
    }
}
