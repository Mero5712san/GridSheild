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
const zoneEnergyHistory = {};

const ENERGY_PRICE_PER_KWH = 0.14;
const ZONE_COST_MULTIPLIER = {
    1: 1.08,
    2: 1,
    3: 1.04,
    4: 0.97,
};

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

        if (!zoneEnergyHistory[node.zone]) zoneEnergyHistory[node.zone] = [];
        zoneEnergyHistory[node.zone].push(power / 1000);
        if (zoneEnergyHistory[node.zone].length > 72) zoneEnergyHistory[node.zone].shift();

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

export function getSubstationMonitoring(readings) {
    const substations = readings.filter((node) => node.type === "substation" || node.type === "power_station");

    return substations.map((node) => ({
        node: node.name,
        zone: node.zone,
        transformerLoadPercent: Math.round(node.loadPercent),
        voltage: node.voltage,
        current: node.current,
        power: node.power,
        overloadRisk: node.loadPercent >= 90 ? "high" : node.loadPercent >= 75 ? "medium" : "low",
        status: node.status,
    }));
}

export function getLoadFluctuationPrediction(readings) {
    const zoneSummary = {};

    readings.forEach((node) => {
        if (!zoneSummary[node.zone]) {
            zoneSummary[node.zone] = {
                zone: node.zone,
                totalPower: 0,
                totalCapacity: 0,
                nodeCount: 0,
                unstableNodes: 0,
            };
        }

        zoneSummary[node.zone].totalPower += node.power;
        zoneSummary[node.zone].totalCapacity += node.maxLoad;
        zoneSummary[node.zone].nodeCount += 1;
        if (node.status === "warning" || node.status === "critical") {
            zoneSummary[node.zone].unstableNodes += 1;
        }
    });

    const zoneForecast = Object.values(zoneSummary).map((zone) => {
        const loadPercent = (zone.totalPower / zone.totalCapacity) * 100;
        const instabilityBias = zone.unstableNodes / Math.max(zone.nodeCount, 1);
        const projectedLoadPercent = Math.min(120, Math.max(0, loadPercent * (1.04 + instabilityBias * 0.2)));

        let trend = "stable";
        if (projectedLoadPercent - loadPercent > 8) trend = "spike";
        else if (projectedLoadPercent - loadPercent > 2) trend = "increasing";
        else if (loadPercent - projectedLoadPercent > 5) trend = "dropping";

        return {
            zone: zone.zone,
            currentLoadPercent: Math.round(loadPercent),
            projectedLoadPercent: Math.round(projectedLoadPercent),
            trend,
            risk: projectedLoadPercent >= 90 ? "high" : projectedLoadPercent >= 75 ? "medium" : "low",
        };
    });

    const highRiskZones = zoneForecast.filter((zone) => zone.risk === "high");
    const peakWindow = highRiskZones.length > 0 ? "next 15 minutes" : "next hour";

    return {
        zones: zoneForecast,
        peakLoadWindow: peakWindow,
        suddenSpikeRisk: highRiskZones.length > 0,
    };
}

export function getComponentHealth(readings) {
    const components = readings.map((node) => {
        const history = readingHistory[node.name] || [];
        let stressCycles = 0;

        for (let i = 1; i < history.length; i += 1) {
            if (history[i].power > history[i - 1].power * 1.15) {
                stressCycles += 1;
            }
        }

        const utilization = node.loadPercent;
        const voltageInstability = Math.abs(node.voltage - node.baseVoltage) / Math.max(node.baseVoltage, 1);
        const currentInstability = Math.abs(node.current - node.baseCurrent) / Math.max(node.baseCurrent, 1);
        const healthPenalty = utilization * 0.35 + stressCycles * 8 + voltageInstability * 100 * 0.25 + currentInstability * 100 * 0.2;
        const healthScore = Math.max(5, Math.min(100, Math.round(100 - healthPenalty)));

        return {
            name: node.name,
            zone: node.zone,
            type: node.type,
            utilization: Math.round(utilization),
            stressCycles,
            healthScore,
            warning: healthScore < 65,
        };
    });

    const averageHealth = Math.round(
        components.reduce((sum, component) => sum + component.healthScore, 0) / Math.max(components.length, 1)
    );

    return {
        components,
        averageHealth,
        atRiskCount: components.filter((component) => component.warning).length,
    };
}

export function getInfrastructureRecommendations(readings, componentHealth) {
    const recommendations = [];
    const zoneAggregates = {};

    readings.forEach((node) => {
        if (!zoneAggregates[node.zone]) {
            zoneAggregates[node.zone] = {
                zone: node.zone,
                totalPower: 0,
                totalCapacity: 0,
                overloadedNodes: 0,
            };
        }

        zoneAggregates[node.zone].totalPower += node.power;
        zoneAggregates[node.zone].totalCapacity += node.maxLoad;
        if (node.loadPercent >= 85) {
            zoneAggregates[node.zone].overloadedNodes += 1;
        }
    });

    Object.values(zoneAggregates).forEach((zone) => {
        const usage = (zone.totalPower / zone.totalCapacity) * 100;
        if (usage > 82) {
            recommendations.push({
                zone: zone.zone,
                priority: usage > 92 ? "high" : "medium",
                action: "Increase transformer capacity",
                reason: `Zone ${zone.zone} operating at ${Math.round(usage)}%`,
            });
        }

        if (zone.overloadedNodes >= 2) {
            recommendations.push({
                zone: zone.zone,
                priority: "medium",
                action: "Add feeder line",
                reason: `${zone.overloadedNodes} nodes in sustained high utilization`,
            });
        }
    });

    componentHealth.components
        .filter((component) => component.healthScore < 55)
        .forEach((component) => {
            recommendations.push({
                zone: component.zone,
                priority: "high",
                action: "Install backup supply",
                reason: `${component.name} health dropped to ${component.healthScore}%`,
            });
        });

    return recommendations.slice(0, 8);
}

export function getSensorOptimization(readings) {
    const criticalNodes = readings.filter((node) => node.priority === "high");
    const groupedByZone = readings.reduce((acc, node) => {
        if (!acc[node.zone]) acc[node.zone] = [];
        acc[node.zone].push(node);
        return acc;
    }, {});

    const placementPlan = Object.entries(groupedByZone).map(([zone, nodes]) => {
        const sorted = [...nodes].sort((a, b) => b.maxLoad - a.maxLoad);
        const recommendedNodes = sorted.slice(0, Math.max(1, Math.ceil(nodes.length / 3))).map((node) => node.name);

        return {
            zone: Number(zone),
            recommendedSensors: recommendedNodes.length,
            sharedCoverageNodes: Math.max(0, nodes.length - recommendedNodes.length),
            locations: recommendedNodes,
        };
    });

    const requiredSensors = placementPlan.reduce((sum, zone) => sum + zone.recommendedSensors, 0);

    return {
        totalNodes: readings.length,
        criticalNodes: criticalNodes.length,
        requiredSensors,
        savingPercent: Math.round((1 - requiredSensors / Math.max(readings.length, 1)) * 100),
        placementPlan,
    };
}

export function getEnergyFlowVisualization(readings) {
    return readings.map((node) => {
        let flowColor = "green";
        if (node.status === "critical") flowColor = "red";
        else if (node.status === "warning") flowColor = "yellow";
        else if (node.status === "reduced") flowColor = "blue";

        return {
            node: node.name,
            zone: node.zone,
            flowColor,
            intensity: Math.min(100, Math.round(node.loadPercent)),
        };
    });
}

export function getGridStabilityControl(readings, health) {
    const imbalance = readings.filter((node) => node.status === "warning" || node.status === "critical").length;
    const activeControls = [];

    if (imbalance > 0) {
        activeControls.push("redistribute-load");
    }
    if (health.loadPercent > 80) {
        activeControls.push("activate-load-reduction");
    }
    if (health.criticalNodes > 0) {
        activeControls.push("voltage-stabilization");
    }

    return {
        imbalanceDetected: imbalance > 0,
        imbalanceNodes: imbalance,
        activeControls,
        mode: health.healthScore < 60 ? "stabilization" : "normal",
    };
}

export function getEnergyUsageBilling(readings) {
    const zoneUsage = {};

    readings.forEach((node) => {
        if (!zoneUsage[node.zone]) {
            zoneUsage[node.zone] = {
                zone: node.zone,
                energyKwh: 0,
                peakDemandKw: 0,
            };
        }

        const powerKw = node.power / 1000;
        zoneUsage[node.zone].energyKwh += powerKw;
        zoneUsage[node.zone].peakDemandKw = Math.max(zoneUsage[node.zone].peakDemandKw, powerKw);
    });

    const zones = Object.values(zoneUsage).map((zone) => {
        const multiplier = ZONE_COST_MULTIPLIER[zone.zone] || 1;
        const estimatedCost = zone.energyKwh * ENERGY_PRICE_PER_KWH * multiplier;

        return {
            zone: zone.zone,
            energyKwh: Number(zone.energyKwh.toFixed(2)),
            peakDemandKw: Number(zone.peakDemandKw.toFixed(2)),
            estimatedCost: Number(estimatedCost.toFixed(2)),
        };
    });

    const totalEnergy = zones.reduce((sum, zone) => sum + zone.energyKwh, 0);
    const totalCost = zones.reduce((sum, zone) => sum + zone.estimatedCost, 0);

    return {
        zones,
        totalEnergyKwh: Number(totalEnergy.toFixed(2)),
        totalEstimatedCost: Number(totalCost.toFixed(2)),
        currency: "USD",
    };
}

export function getRecommendationEngine(readings, loadActions, loadForecast, infrastructureRecommendations, stability) {
    const suggestions = [];
    const criticalInfra = readings.filter(
        (node) => node.priority === "high" && (node.status === "warning" || node.status === "critical")
    );

    loadActions.slice(0, 4).forEach((action) => {
        suggestions.push({
            type: "load-control",
            priority: action.priority === "low" ? "medium" : "high",
            message: `${action.action === "disconnect" ? "Reduce non-critical load" : "Reduce medium load"} at ${action.node}`,
            action: action.reason,
        });
    });

    loadForecast.zones
        .filter((zone) => zone.risk === "high")
        .forEach((zone) => {
            suggestions.push({
                type: "prediction",
                priority: "high",
                message: `Load spike expected in Zone ${zone.zone}`,
                action: `Projected load ${zone.projectedLoadPercent}%`,
            });
        });

    if (criticalInfra.length > 0) {
        suggestions.push({
            type: "critical-infra",
            priority: "high",
            message: "Increase supply to critical infrastructure",
            action: `Priority nodes under stress: ${criticalInfra.slice(0, 3).map((node) => node.name).join(", ")}`,
        });
    }

    if (loadForecast.zones.some((zone) => zone.projectedLoadPercent >= 78)) {
        suggestions.push({
            type: "balancing",
            priority: "medium",
            message: "Balance load across feeders",
            action: "Shift medium-priority demand away from peak zones",
        });
    }

    infrastructureRecommendations.slice(0, 3).forEach((item) => {
        suggestions.push({
            type: "infrastructure",
            priority: item.priority,
            message: item.action,
            action: item.reason,
        });
    });

    if (stability.mode === "stabilization") {
        suggestions.push({
            type: "stability",
            priority: "high",
            message: "Activate grid stabilization mode",
            action: `Controls: ${stability.activeControls.join(", ")}`,
        });
    }

    if (suggestions.length === 0) {
        suggestions.push({
            type: "optimization",
            priority: "low",
            message: "Grid stable, continue balanced feeder strategy",
            action: "No immediate intervention required",
        });
    }

    return suggestions.slice(0, 10);
}

export function generateReportPayload({
    gridHealth,
    substationMonitoring,
    recommendationEngine,
    loadFluctuationPrediction,
    componentHealth,
    infrastructureRecommendations,
    billing,
    alerts,
}) {
    return {
        generatedAt: new Date().toISOString(),
        loadAnalysis: {
            totalLoad: gridHealth.totalLoad,
            loadPercent: gridHealth.loadPercent,
            healthScore: gridHealth.healthScore,
        },
        substationUtilization: substationMonitoring,
        recommendationHistory: recommendationEngine,
        loadPrediction: loadFluctuationPrediction,
        componentHealth,
        infrastructureRecommendations,
        energyConsumption: billing,
        blackoutPreventionLog: alerts.slice(-25),
    };
}