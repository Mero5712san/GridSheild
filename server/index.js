import express from "express";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import { GridSimulationRuntime } from "./gridSimulation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3001);
const DIST_DIR = path.resolve(__dirname, "../dist");
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
const simulation = new GridSimulationRuntime();

app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ ok: true, name: "GridShield Backend", websocket: "/ws" });
});

app.get("/api/state", (_req, res) => {
    res.json(simulation.getSnapshot());
});

app.get("/api/pages/:pageName", (req, res) => {
    const snapshot = simulation.getSnapshot();
    const pageName = req.params.pageName;
    const feed = snapshot.pageFeeds?.[pageName];

    if (!feed) {
        res.status(404).json({ message: `Unknown page feed: ${pageName}` });
        return;
    }

    res.json({
        page: pageName,
        updatedAt: snapshot.serverTime,
        payload: feed,
    });
});

app.get("/api/modules/:moduleName", (req, res) => {
    const snapshot = simulation.getSnapshot();
    const moduleMap = {
        recommendations: snapshot.recommendationEngine,
        "substation-monitoring": {
            data: snapshot.substationMonitoring,
            trends: snapshot.moduleTrends?.substationLoadHistory || [],
            voltage: snapshot.moduleTrends?.voltageFluctuationHistory || [],
        },
        "sensor-optimization": {
            data: snapshot.sensorOptimization,
            trends: snapshot.moduleTrends?.sensorOptimizationHistory || [],
        },
        "load-prediction": {
            data: snapshot.loadFluctuationPrediction,
            trends: snapshot.moduleTrends?.predictionHistory || [],
        },
        "component-health": {
            data: snapshot.componentHealth,
            trends: snapshot.moduleTrends?.componentHealthHistory || [],
        },
        "infrastructure-upgrades": {
            data: snapshot.infrastructureRecommendations,
            trends: snapshot.moduleTrends?.infrastructureHistory || [],
        },
        "grid-stability": {
            data: snapshot.stabilityControl,
            trends: snapshot.moduleTrends?.stabilityHistory || [],
        },
        "energy-flow": {
            data: snapshot.energyFlow,
            trends: snapshot.moduleTrends?.energyFlowHistory || [],
        },
        reports: snapshot.report,
    };

    const modulePayload = moduleMap[req.params.moduleName];
    if (!modulePayload) {
        res.status(404).json({ message: `Unknown module: ${req.params.moduleName}` });
        return;
    }

    res.json({
        module: req.params.moduleName,
        updatedAt: snapshot.serverTime,
        payload: modulePayload,
    });
});

app.get("/api/protocol", (_req, res) => {
    res.json({
        transport: "websocket",
        socketPath: "/ws",
        commands: [
            "subscribe",
            "requestSnapshot",
            "triggerInstability",
            "triggerOverload",
            "clearOverload",
            "toggleNode",
            "toggleSimulation",
            "getNodeConfigs",
            "applyRecommendation",
        ],
        payloads: {
            triggerOverload: { zone: 1 },
            toggleNode: { nodeName: "City Hospital" },
            applyRecommendation: { id: "1713020012000-0", decision: "approved" },
        },
    });
});

if (fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR));
    app.get("*", (_req, res) => {
        res.sendFile(path.join(DIST_DIR, "index.html"));
    });
} else {
    app.get("/", (_req, res) => {
        res.status(200).send("GridShield backend is running. Build the frontend with npm run build to serve the app here.");
    });
}

wss.on("connection", (ws) => {
    simulation.connect(ws);
});

simulation.runTick();
setInterval(() => simulation.runTick(), 2000);

server.listen(PORT, () => {
    const wsBaseUrl = PUBLIC_BASE_URL.replace(/^http/i, "ws");
    console.log(`GridShield backend listening on ${PUBLIC_BASE_URL}`);
    console.log(`WebSocket endpoint: ${wsBaseUrl}/ws`);
});
