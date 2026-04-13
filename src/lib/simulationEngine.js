// Simulation Engine for Smart Grid Data Generation & AI Prediction

const NODE_CONFIGS = [
    { name: "Power Station Alpha", type: "power_station", priority: "high", zone: 1, maxLoad: 50000, baseVoltage: 235, baseCurrent: 20, posX: 0, posY: 0, posZ: -8 },
    { name: "North Substation", type: "substation", priority: "high", zone: 1, maxLoad: 25000, baseVoltage: 232, baseCurrent: 16, posX: 0, posY: 0, posZ: -18 },
    { name: "South Substation", type: "substation", priority: "high", zone: 2, maxLoad: 25000, baseVoltage: 230, baseCurrent: 16, posX: 0, posY: 0, posZ: 14 },
    { name: "East Substation", type: "substation", priority: "high", zone: 3, maxLoad: 25000, baseVoltage: 231, baseCurrent: 16, posX: 16, posY: 0, posZ: 2 },
    { name: "West Substation", type: "substation", priority: "high", zone: 4, maxLoad: 25000, baseVoltage: 231, baseCurrent: 16, posX: -16, posY: 0, posZ: 2 },
    { name: "City Hospital", type: "hospital", priority: "high", zone: 1, maxLoad: 15000, baseVoltage: 225, baseCurrent: 15, posX: -10, posY: 0, posZ: 18 },
    { name: "Residential Block A", type: "residential", priority: "medium", zone: 1, maxLoad: 8000, baseVoltage: 222, baseCurrent: 12, posX: -12, posY: 0, posZ: 8 },
    { name: "Residential Block B", type: "residential", priority: "medium", zone: 2, maxLoad: 8000, baseVoltage: 220, baseCurrent: 11, posX: 10, posY: 0, posZ: 8 },
    { name: "Industrial Complex", type: "industrial", priority: "medium", zone: 3, maxLoad: 25000, baseVoltage: 232, baseCurrent: 22, posX: 18, posY: 0, posZ: -2 },
    { name: "Street Lights Zone 1", type: "street_light", priority: "low", zone: 4, maxLoad: 3000, baseVoltage: 218, baseCurrent: 8, posX: -18, posY: 0, posZ: 12 },
    { name: "Street Lights Zone 2", type: "street_light", priority: "low", zone: 3, maxLoad: 3000, baseVoltage: 216, baseCurrent: 7, posX: 18, posY: 0, posZ: 12 },
    { name: "EV Charging Station", type: "ev_charging", priority: "low", zone: 2, maxLoad: 5000, baseVoltage: 220, baseCurrent: 10, posX: 8, posY: 0, posZ: 18 },
    { name: "Mall District", type: "industrial", priority: "medium", zone: 1, maxLoad: 22000, baseVoltage: 229, baseCurrent: 19, posX: -2, posY: 0, posZ: 20 },
    { name: "School Block", type: "residential", priority: "medium", zone: 3, maxLoad: 7000, baseVoltage: 221, baseCurrent: 10, posX: 20, posY: 0, posZ: 18 },
];

// History buffer for prediction
const readingHistory = {};

function randomVariation(base, range) {
    return base + (Math.random() - 0.5) * range * 2;
}

export function getNodeConfigs() {
    return NODE_CONFIGS;
}

export function generateSensorData(overloadZone = null, disconnectedNodes = [], instabilityLevel = 0) {
    const readings = NODE_CONFIGS.map((node) => {
        const chaos = Math.max(0, Math.min(1, instabilityLevel));
        const isDisconnected = disconnectedNodes.includes(node.name);
        const isInOverloadZone = overloadZone === node.zone;
        const isTransientTrip = chaos > 0.65 && Math.random() < 0.1;

        let voltage, current;

        if (isDisconnected || isTransientTrip) {
            voltage = 0;
            current = 0;
        } else {
            const chaosSpike = chaos > 0 ? 1 + chaos * (2.5 + Math.random() * 3.5) : 1;
            const loadMultiplier = (isInOverloadZone ? 1.3 + Math.random() * 0.3 : 1.0) * chaosSpike;

            const chaosVoltageSag = chaos > 0 ? 1 - chaos * (0.15 + Math.random() * 0.35) : 1;
            const voltageRange = 10 + chaos * 28;
            voltage = randomVariation(node.baseVoltage, voltageRange) * (isInOverloadZone ? 0.95 : 1) * chaosVoltageSag;

            if (chaos > 0.45 && Math.random() < 0.25) {
                voltage *= 0.55 + Math.random() * 0.25;
            }

            current = randomVariation(node.baseCurrent, 3) * loadMultiplier;

            if (chaos > 0.5) {
                current += randomVariation(node.baseCurrent * chaos * 0.9, node.baseCurrent * chaos);
            }
        }

        voltage = Math.max(0, Math.round(voltage * 10) / 10);
        current = Math.max(0, Math.round(current * 10) / 10);
        const power = Math.round(voltage * current);
        const loadPercent = (power / node.maxLoad) * 100;

        let status = "active";
        if (isDisconnected || isTransientTrip) status = "disconnected";
        else if (loadPercent > 90) status = "critical";
        else if (loadPercent > 75) status = "warning";
        else if (loadPercent > 50) status = "reduced";

        // Store history
        if (!readingHistory[node.name]) readingHistory[node.name] = [];
        readingHistory[node.name].push({ power, timestamp: Date.now() });
        if (readingHistory[node.name].length > 10) readingHistory[node.name].shift();

        return {
            ...node,
            voltage,
            current,
            power,
            loadPercent: Math.round(loadPercent * 10) / 10,
            status,
        };
    });

    return readings;
}

export function predictOverload(nodeName) {
    const history = readingHistory[nodeName];
    if (!history || history.length < 5) return { risk: false, predictedLoad: 0, trend: "stable" };

    const recent = history.slice(-5);
    const diffs = [];
    for (let i = 1; i < recent.length; i++) {
        diffs.push(recent[i].power - recent[i - 1].power);
    }

    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const lastPower = recent[recent.length - 1].power;
    const predictedLoad = lastPower + avgDiff * 3;

    const node = NODE_CONFIGS.find((n) => n.name === nodeName);
    const maxLoad = node ? node.maxLoad : 10000;
    const risk = predictedLoad > maxLoad * 0.85;

    let trend = "stable";
    if (avgDiff > 50) trend = "increasing";
    else if (avgDiff < -50) trend = "decreasing";

    return {
        risk,
        predictedLoad: Math.round(predictedLoad),
        trend,
        currentLoad: lastPower,
        maxLoad,
        riskPercent: Math.round((predictedLoad / maxLoad) * 100),
    };
}

export function getLoadManagementActions(readings) {
    const actions = [];
    const zones = {};

    readings.forEach((r) => {
        if (!zones[r.zone]) zones[r.zone] = [];
        zones[r.zone].push(r);
    });

    Object.entries(zones).forEach(([zone, nodes]) => {
        const totalLoad = nodes.reduce((s, n) => s + n.power, 0);
        const totalCapacity = nodes.reduce((s, n) => s + n.maxLoad, 0);
        const zoneLoadPercent = (totalLoad / totalCapacity) * 100;

        if (zoneLoadPercent > 80) {
            const lowPriority = nodes.filter((n) => n.priority === "low" && n.status !== "disconnected");
            lowPriority.forEach((n) => {
                actions.push({
                    action: "disconnect",
                    node: n.name,
                    zone: parseInt(zone),
                    reason: `Zone ${zone} load at ${Math.round(zoneLoadPercent)}%`,
                    priority: n.priority,
                });
            });

            if (zoneLoadPercent > 90) {
                const medPriority = nodes.filter((n) => n.priority === "medium" && n.status !== "disconnected");
                medPriority.forEach((n) => {
                    actions.push({
                        action: "reduce",
                        node: n.name,
                        zone: parseInt(zone),
                        reason: `Zone ${zone} critical at ${Math.round(zoneLoadPercent)}%`,
                        priority: n.priority,
                    });
                });
            }
        }
    });

    return actions;
}

export function getGridHealth(readings) {
    const totalLoad = readings.reduce((s, r) => s + r.power, 0);
    const totalCapacity = readings.reduce((s, r) => s + r.maxLoad, 0);
    const activeNodes = readings.filter((r) => r.status !== "disconnected").length;
    const criticalNodes = readings.filter((r) => r.status === "critical").length;
    const warningNodes = readings.filter((r) => r.status === "warning").length;

    let healthScore = 100;
    healthScore -= criticalNodes * 15;
    healthScore -= warningNodes * 5;
    if (totalLoad / totalCapacity > 0.8) healthScore -= 20;
    healthScore = Math.max(0, Math.min(100, healthScore));

    let healthStatus = "excellent";
    if (healthScore < 40) healthStatus = "critical";
    else if (healthScore < 60) healthStatus = "poor";
    else if (healthScore < 80) healthStatus = "fair";
    else if (healthScore < 95) healthStatus = "good";

    return {
        totalLoad,
        totalCapacity,
        loadPercent: Math.round((totalLoad / totalCapacity) * 100),
        activeNodes,
        totalNodes: readings.length,
        criticalNodes,
        warningNodes,
        healthScore,
        healthStatus,
        efficiency: Math.round((1 - criticalNodes / readings.length) * 100),
    };
}