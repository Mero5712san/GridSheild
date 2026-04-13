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
        ],
        payloads: {
            triggerOverload: { zone: 1 },
            toggleNode: { nodeName: "City Hospital" },
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
    console.log(`GridShield backend listening on http://localhost:${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
