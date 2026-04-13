import { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const STATUS_COLORS = {
    active: new THREE.Color(0x22c55e),
    warning: new THREE.Color(0xeab308),
    critical: new THREE.Color(0xef4444),
    reduced: new THREE.Color(0x3b82f6),
    disconnected: new THREE.Color(0x374151),
};

// ─── Procedural Building Factories ───────────────────────────────────────────

function makePowerPlant() {
    const g = new THREE.Group();
    // Main building
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 2, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 })
    );
    body.position.y = 1;
    g.add(body);
    // Chimneys
    for (let i = 0; i < 2; i++) {
        const chimney = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.22, 2.5, 10),
            new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.4 })
        );
        chimney.position.set(-0.5 + i * 1, 2.25, 0);
        g.add(chimney);
        // Red/white stripe
        const stripe = new THREE.Mesh(
            new THREE.CylinderGeometry(0.19, 0.19, 0.2, 10),
            new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.3 })
        );
        stripe.position.set(-0.5 + i * 1, 3.2, 0);
        g.add(stripe);
    }
    // Generator dome
    const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.8, roughness: 0.2 })
    );
    dome.position.set(0, 2.05, 0);
    g.add(dome);
    return g;
}

function makeTransmissionTower() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    // Main vertical
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 3.5, 6), mat);
    trunk.position.y = 1.75;
    g.add(trunk);
    // Cross arms
    [-1.2, -0.4, 0.4].forEach((y) => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.06), mat);
        arm.position.y = 3.5 + y;
        g.add(arm);
        // Insulators
        [-0.75, 0.75].forEach((x) => {
            const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0xfbbf24 }));
            ins.position.set(x, 3.5 + y - 0.15, 0);
            g.add(ins);
        });
    });
    // Diagonal supports
    const diagMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.4 });
    [[-0.5, 0.5], [0.5, -0.5]].forEach(([sx, ex]) => {
        const pts = [new THREE.Vector3(sx, 0.2, 0), new THREE.Vector3(ex, 2.8, 0)];
        const diag = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, pts[0].distanceTo(pts[1]), 5),
            diagMat
        );
        diag.position.copy(pts[0]).lerp(pts[1], 0.5);
        diag.lookAt(pts[1]);
        diag.rotateX(Math.PI / 2);
        g.add(diag);
    });
    return g;
}

function makeSubstation() {
    const g = new THREE.Group();
    // Fence
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 });
    for (let i = 0; i < 8; i++) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 4), fenceMat);
        const angle = (i / 8) * Math.PI * 2;
        post.position.set(Math.cos(angle) * 1.6, 0.4, Math.sin(angle) * 1.2);
        g.add(post);
    }
    // Main transformer unit
    const tBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.0, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x1e40af, metalness: 0.6, roughness: 0.3 })
    );
    tBody.position.y = 0.5;
    g.add(tBody);
    // Transformer cylinders
    for (let i = 0; i < 3; i++) {
        const cyl = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.12, 1.1, 10),
            new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
        );
        cyl.position.set(-0.4 + i * 0.4, 0.55, 0);
        g.add(cyl);
        // Insulator on top
        const ins = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.25, 8),
            new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.2 })
        );
        ins.position.set(-0.4 + i * 0.4, 1.25, 0);
        g.add(ins);
    }
    return g;
}

function makeHouse() {
    const g = new THREE.Group();
    // Body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.8, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8, metalness: 0.0 })
    );
    body.position.y = 0.4;
    g.add(body);
    // Roof
    const roofGeo = new THREE.ConeGeometry(0.72, 0.55, 4);
    const roof = new THREE.Mesh(
        roofGeo,
        new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 })
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.07;
    g.add(roof);
    // Door
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.28, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x92400e })
    );
    door.position.set(0, 0.14, 0.42);
    g.add(door);
    // Window
    const win = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.18, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x7dd3fc, emissiveIntensity: 0.3 })
    );
    win.position.set(-0.3, 0.5, 0.42);
    g.add(win);
    return g;
}

function makeHospital() {
    const g = new THREE.Group();
    // Main building
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.5, 1.0),
        new THREE.MeshStandardMaterial({ color: 0xf0fdf4, roughness: 0.7 })
    );
    body.position.y = 0.75;
    g.add(body);
    // Red cross sign (front)
    const crossH = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.14, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.5 })
    );
    crossH.position.set(0, 1.1, 0.53);
    g.add(crossH);
    const crossV = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.5, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.5 })
    );
    crossV.position.set(0, 1.1, 0.53);
    g.add(crossV);
    // Flat roof
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.1, 1.1),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 })
    );
    roof.position.y = 1.55;
    g.add(roof);
    return g;
}

function makeFactory() {
    const g = new THREE.Group();
    // Main body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.2, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.5 })
    );
    body.position.y = 0.6;
    g.add(body);
    // Saw-tooth roof
    for (let i = 0; i < 3; i++) {
        const seg = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.08, 1.4),
            new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 })
        );
        seg.position.set(-0.6 + i * 0.6, 1.24, 0);
        g.add(seg);
    }
    // Smoke stacks
    for (let i = 0; i < 3; i++) {
        const stack = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.13, 1.8, 8),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6 })
        );
        stack.position.set(-0.55 + i * 0.55, 2.1, 0.3);
        g.add(stack);
    }
    return g;
}

function makeStreetLight() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.5, 6), mat);
    pole.position.y = 0.75;
    g.add(pole);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 5), mat);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(0.17, 1.45, 0);
    g.add(arm);
    const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xfef9c3, emissiveIntensity: 1.0 })
    );
    lamp.position.set(0.34, 1.45, 0);
    g.add(lamp);
    return g;
}

function makeEVStation() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.9, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 })
    );
    body.position.y = 0.45;
    g.add(body);
    const screen = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.22, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0ea5e9, emissiveIntensity: 0.6 })
    );
    screen.position.set(0, 0.65, 0.16);
    g.add(screen);
    return g;
}

function seededNoise(x, z, salt = 0) {
    const v = Math.sin((x + salt) * 12.9898 + (z - salt) * 78.233) * 43758.5453;
    return v - Math.floor(v);
}

function buildDecorativeCity(scene, coreLayout) {
    const corePositions = coreLayout.map((node) => new THREE.Vector2(node.x, node.z));
    const cityObjects = [];

    const weightedBuilder = (r) => {
        if (r < 0.18) return { builder: makeHouse, type: "house" };
        if (r < 0.42) return { builder: makeFactory, type: "factory" };
        if (r < 0.58) return { builder: makeHospital, type: "hospital" };
        if (r < 0.76) return { builder: makeSubstation, type: "substation" };
        return { builder: makeEVStation, type: "ev_station" };
    };

    for (let x = -44; x <= 44; x += 6) {
        for (let z = -34; z <= 34; z += 6) {
            const nearCore = corePositions.some((p) => p.distanceTo(new THREE.Vector2(x, z)) < 4.5);
            if (nearCore) continue;

            const lotChance = seededNoise(x, z, 1);
            if (lotChance < 0.58) continue;

            const cityChoice = weightedBuilder(seededNoise(x, z, 2));
            const group = cityChoice.builder();
            const scale = 0.75 + seededNoise(x, z, 3) * 0.75;
            group.scale.set(scale, scale, scale);
            group.rotation.y = seededNoise(x, z, 4) * Math.PI * 2;
            group.position.set(
                x + (seededNoise(x, z, 5) - 0.5) * 1.2,
                0,
                z + (seededNoise(x, z, 6) - 0.5) * 1.2
            );
            group.userData.cityType = cityChoice.type;
            group.traverse((child) => { if (child.isMesh) child.castShadow = true; });
            scene.add(group);
            cityObjects.push({
                group,
                type: cityChoice.type,
                name: cityChoice.type === "house" ? `House ${x}:${z}` : `City ${x}:${z}`,
                x: group.position.x,
                z: group.position.z,
            });

            if (seededNoise(x, z, 7) > 0.82) {
                const lamp = makeStreetLight();
                lamp.position.set(group.position.x + 0.9, 0, group.position.z + 0.9);
                lamp.rotation.y = seededNoise(x, z, 8) * Math.PI * 2;
                lamp.traverse((child) => { if (child.isMesh) child.castShadow = true; });
                scene.add(lamp);
                cityObjects.push({
                    group: lamp,
                    type: "street_light",
                    name: `Street Light ${x}:${z}`,
                    x: lamp.position.x,
                    z: lamp.position.z,
                });
            }
        }
    }

    for (let i = -40; i <= 40; i += 10) {
        const towerA = makeTransmissionTower();
        towerA.position.set(i, 0, -30);
        towerA.scale.set(0.85, 0.85, 0.85);
        towerA.traverse((child) => { if (child.isMesh) child.castShadow = true; });
        scene.add(towerA);
        cityObjects.push({
            group: towerA,
            type: "transmission_tower",
            name: `Tower A ${i}`,
            x: towerA.position.x,
            z: towerA.position.z,
        });

        const towerB = makeTransmissionTower();
        towerB.position.set(i, 0, 30);
        towerB.scale.set(0.85, 0.85, 0.85);
        towerB.traverse((child) => { if (child.isMesh) child.castShadow = true; });
        scene.add(towerB);
        cityObjects.push({
            group: towerB,
            type: "transmission_tower",
            name: `Tower B ${i}`,
            x: towerB.position.x,
            z: towerB.position.z,
        });
    }

    return cityObjects;
}

const MODEL_BUILDERS = {
    power_station: makePowerPlant,
    substation: makeSubstation,
    transformer: makeSubstation,
    residential: makeHouse,
    industrial: makeFactory,
    hospital: makeHospital,
    street_light: makeStreetLight,
    ev_charging: makeEVStation,
};

// ─── Animated Power Line ──────────────────────────────────────────────────────

function createPowerLine(from, to, color = 0x0ea5e9) {
    const group = new THREE.Group();
    // Glowing tube
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    mid.y += 1.0; // sag
    const curve = new THREE.QuadraticBezierCurve3(from.clone(), mid, to.clone());
    const tubeGeo = new THREE.TubeGeometry(curve, 30, 0.025, 6, false);
    const tubeMat = new THREE.MeshStandardMaterial({
        color,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.8,
        metalness: 0.3,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    group.add(tube);

    // Moving energy particle
    const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
    );
    const sparkGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 8, 8),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3 })
    );
    group.add(particle);
    group.add(sparkGlow);

    return { group, curve, particle, sparkGlow, tubeMat };
}

function createPowerLineStyled(from, to, options = {}) {
    const line = createPowerLine(from, to, options.color || 0x22c55e);
    const radius = options.radius ?? 0.025;
    const tube = line.group.children[0];
    if (tube && tube.geometry) {
        tube.geometry.dispose();
        tube.geometry = new THREE.TubeGeometry(line.curve, 30, radius, 6, false);
    }
    if (tube && tube.material) {
        tube.material = tube.material.clone();
        tube.material.color = new THREE.Color(options.color || 0x22c55e);
        tube.material.emissive = new THREE.Color(options.color || 0x22c55e);
        tube.material.emissiveIntensity = options.emissiveIntensity ?? 0.6;
        tube.material.opacity = options.opacity ?? 0.8;
    }
    return line;
}

// ─── Floating Label Sprite ────────────────────────────────────────────────────

function createLabel(voltage, power, status) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext("2d");

    const statusColor = { active: "#22c55e", warning: "#eab308", critical: "#ef4444", reduced: "#3b82f6", disconnected: "#6b7280" }[status] || "#22c55e";

    ctx.fillStyle = "rgba(10, 15, 26, 0.85)";
    ctx.roundRect(4, 4, 248, 72, 10);
    ctx.fill();
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 2;
    ctx.roundRect(4, 4, 248, 72, 10);
    ctx.stroke();

    ctx.fillStyle = statusColor;
    ctx.font = "bold 14px monospace";
    ctx.fillText(`${voltage}V  ${(power / 1000).toFixed(1)}kW`, 16, 32);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px monospace";
    ctx.fillText(`Status: ${status}`, 16, 54);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.8, 0.55, 1);
    return sprite;
}

function createTextLabel(title, subtitle = "") {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 88;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(10, 15, 26, 0.82)";
    ctx.roundRect(4, 4, 248, 80, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(34, 197, 94, 0.9)";
    ctx.lineWidth = 2;
    ctx.roundRect(4, 4, 248, 80, 12);
    ctx.stroke();

    ctx.fillStyle = "#dcfce7";
    ctx.font = "bold 16px monospace";
    ctx.fillText(title, 16, 34);
    if (subtitle) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "12px monospace";
        ctx.fillText(subtitle, 16, 58);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.7, 0.58, 1);
    return sprite;
}

// ─── NODE LAYOUT ─────────────────────────────────────────────────────────────

const LAYOUT = [
    { name: "Power Station Alpha", type: "power_station", x: 0, z: -8, tier: 1 },
    { name: "North Substation", type: "substation", x: 0, z: -18, tier: 2 },
    { name: "South Substation", type: "substation", x: 0, z: 14, tier: 2 },
    { name: "East Substation", type: "substation", x: 16, z: 2, tier: 2 },
    { name: "West Substation", type: "substation", x: -16, z: 2, tier: 2 },
    { name: "City Hospital", type: "hospital", x: -10, z: 18, tier: 3 },
    { name: "Residential Block A", type: "residential", x: -12, z: 8, tier: 3 },
    { name: "Residential Block B", type: "residential", x: 10, z: 8, tier: 3 },
    { name: "Industrial Complex", type: "industrial", x: 18, z: -2, tier: 3 },
    { name: "Street Lights Zone 1", type: "street_light", x: -18, z: 12, tier: 3 },
    { name: "Street Lights Zone 2", type: "street_light", x: 18, z: 12, tier: 3 },
    { name: "EV Charging Station", type: "ev_charging", x: 8, z: 18, tier: 3 },
    { name: "Mall District", type: "industrial", x: -2, z: 20, tier: 3 },
    { name: "School Block", type: "residential", x: 20, z: 18, tier: 3 },
];

const SUBSTATIONS = LAYOUT.filter((node) => node.type === "substation");

function getNearestSubstation(node) {
    if (node.type === "substation" || node.type === "power_station") return null;
    return SUBSTATIONS.reduce((best, current) => {
        const bestDist = best ? (best.x - node.x) ** 2 + (best.z - node.z) ** 2 : Infinity;
        const currentDist = (current.x - node.x) ** 2 + (current.z - node.z) ** 2;
        return currentDist < bestDist ? current : best;
    }, null);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GridScene({ readings }) {
    const mountRef = useRef(null);
    const readingsRef = useRef(readings);
    readingsRef.current = readings;

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        const W = container.clientWidth;
        const H = container.clientHeight;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050d1a);
        scene.fog = new THREE.FogExp2(0x050d1a, 0.022);

        // Camera
        const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 320);
        camera.position.set(0, 24, 42);
        camera.lookAt(0, 0, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 10;
        controls.maxDistance = 120;
        controls.maxPolarAngle = Math.PI / 2.1;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.92;

        // ── Lighting ──────────────────────────────────────────────────────────────
        const ambientLight = new THREE.AmbientLight(0x1a2744, 0.9);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.4);
        sunLight.position.set(10, 20, 10);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.set(2048, 2048);
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 100;
        sunLight.shadow.camera.left = -65;
        sunLight.shadow.camera.right = 65;
        sunLight.shadow.camera.top = 65;
        sunLight.shadow.camera.bottom = -65;
        scene.add(sunLight);

        const fillLight = new THREE.DirectionalLight(0x4488cc, 0.4);
        fillLight.position.set(-10, 8, -10);
        scene.add(fillLight);

        const bluePointLight = new THREE.PointLight(0x0ea5e9, 2, 28);
        bluePointLight.position.set(0, 6, -5);
        scene.add(bluePointLight);

        // ── Ground ─────────────────────────────────────────────────────────────────
        const groundGeo = new THREE.PlaneGeometry(120, 90, 96, 72);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x0d1f2d, roughness: 1, metalness: 0 });
        // Subtle height variation
        const pos = groundGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            pos.setZ(i, (Math.random() - 0.5) * 0.08);
        }
        groundGeo.computeVertexNormals();
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Grid overlay (subtle)
        const gridHelper = new THREE.GridHelper(120, 120, 0x0f2a3f, 0x0f2a3f);
        gridHelper.position.y = 0.01;
        scene.add(gridHelper);

        // Roads
        const roadMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
        [[55, 1, 0, 0], [1, 70, 0, 0]].forEach(([w, d, rx, rz]) => {
            const road = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), roadMat);
            road.position.y = 0.02;
            scene.add(road);
        });

        for (let z = -30; z <= 30; z += 10) {
            const roadH = new THREE.Mesh(new THREE.BoxGeometry(88, 0.02, 0.9), roadMat);
            roadH.position.set(0, 0.02, z);
            scene.add(roadH);
        }

        for (let x = -40; x <= 40; x += 10) {
            const roadV = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 68), roadMat);
            roadV.position.set(x, 0.02, 0);
            scene.add(roadV);
        }

        const cityObjects = buildDecorativeCity(scene, LAYOUT);

        // ── Build nodes ───────────────────────────────────────────────────────────
        const nodeGroups = {};
        const labels = {};

        LAYOUT.forEach((nodeDef) => {
            const builder = MODEL_BUILDERS[nodeDef.type] || makeHouse;
            const group = builder();
            group.position.set(nodeDef.x, 0, nodeDef.z);
            group.traverse((child) => { if (child.isMesh) child.castShadow = true; });
            scene.add(group);
            nodeGroups[nodeDef.name] = group;

            // Small point light at building
            const pLight = new THREE.PointLight(0x22c55e, 0.5, 4);
            pLight.position.set(nodeDef.x, 2, nodeDef.z);
            scene.add(pLight);
            group.userData.pointLight = pLight;

            // Floating label
            const label = createLabel(225, 3000, "active");
            label.position.set(nodeDef.x, 4.2, nodeDef.z);
            scene.add(label);
            labels[nodeDef.name] = label;
        });

        // ── Power Lines ────────────────────────────────────────────────────────────
        const powerLines = [];

        const connectNodePair = (fromNode, toNode, style) => {
            const from = new THREE.Vector3(fromNode.x, style.fromY ?? 2.6, fromNode.z);
            const to = new THREE.Vector3(toNode.x, style.toY ?? 2.6, toNode.z);
            const line = createPowerLineStyled(from, to, style);
            line.t = Math.random();
            line.fromNode = fromNode.name;
            line.toNode = toNode.name;
            scene.add(line.group);
            powerLines.push(line);
        };

        const mainHub = LAYOUT.find((node) => node.type === "power_station");
        const subStations = LAYOUT.filter((node) => node.type === "substation");
        const localNodes = LAYOUT.filter((node) => node.type !== "substation" && node.type !== "power_station");

        if (mainHub) {
            subStations.forEach((subStation) => {
                connectNodePair(mainHub, subStation, {
                    color: 0x22c55e,
                    radius: 0.05,
                    emissiveIntensity: 0.9,
                    opacity: 0.9,
                    fromY: 3.1,
                    toY: 2.8,
                });
            });
        }

        localNodes.forEach((localNode) => {
            const nearestSubstation = getNearestSubstation(localNode);
            if (!nearestSubstation) return;
            connectNodePair(nearestSubstation, localNode, {
                color: 0x16a34a,
                radius: 0.018,
                emissiveIntensity: 0.45,
                opacity: 0.65,
                fromY: 2.5,
                toY: 2.0,
            });
        });

        // Dense city links: houses, lights, and services connect to the grid and nearby blocks.
        const cityLinks = [];
        const coreNodes = LAYOUT.map((node) => ({
            name: node.name,
            type: node.type,
            x: node.x,
            z: node.z,
        }));

        const connectDecorativeNode = (fromNode, toNode, intensity = 1) => {
            const from = new THREE.Vector3(fromNode.x, 1.8, fromNode.z);
            const to = new THREE.Vector3(toNode.x, 1.8, toNode.z);
            const line = createPowerLine(from, to, 0x22c55e);
            line.t = Math.random();
            line.fromNode = fromNode.name;
            line.toNode = toNode.name;
            line.group.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.transparent = true;
                    child.material.opacity = 0.55 * intensity;
                }
            });
            scene.add(line.group);
            cityLinks.push(line);
        };

        const cityBuildings = cityObjects.filter((item) => item.type !== "transmission_tower");
        const cityLabels = [];

        cityObjects.forEach((item) => {
            const titleMap = {
                house: "House",
                factory: "Factory",
                hospital: "Hospital",
                substation: "Substation",
                ev_station: "EV Station",
                street_light: "Street Light",
                transmission_tower: "Tower",
            };
            const title = titleMap[item.type] || "Building";
            const label = createTextLabel(title, item.name);
            const heightOffset = item.type === "street_light" ? 2.1 : item.type === "transmission_tower" ? 4.5 : 3.0;
            label.position.set(item.x, heightOffset, item.z);
            scene.add(label);
            cityLabels.push({ label, item, heightOffset });
        });

        cityBuildings.forEach((item, index) => {
            const nearestCore = coreNodes
                .slice()
                .sort((a, b) => {
                    const da = (a.x - item.x) ** 2 + (a.z - item.z) ** 2;
                    const db = (b.x - item.x) ** 2 + (b.z - item.z) ** 2;
                    return da - db;
                })
                .slice(0, item.type === "street_light" ? 1 : 2);

            nearestCore.forEach((target, targetIndex) => {
                const dist = Math.sqrt((target.x - item.x) ** 2 + (target.z - item.z) ** 2);
                if (dist < 7 || dist > 40) return;
                if ((index + targetIndex) % 2 === 1 && seededNoise(item.x, item.z, targetIndex + 12) < 0.45) return;
                connectDecorativeNode(item, target, item.type === "street_light" ? 0.5 : 1);
            });
        });

        for (let i = 0; i < cityBuildings.length; i++) {
            const a = cityBuildings[i];
            let nearest = null;
            let nearestDist = Infinity;
            for (let j = 0; j < cityBuildings.length; j++) {
                if (i === j) continue;
                const b = cityBuildings[j];
                const dist = Math.sqrt((b.x - a.x) ** 2 + (b.z - a.z) ** 2);
                if (dist < 3.5 || dist > 15) continue;
                if (dist < nearestDist) {
                    nearest = b;
                    nearestDist = dist;
                }
            }

            if (nearest && seededNoise(a.x, a.z, i + 21) > 0.62) {
                connectDecorativeNode(a, nearest, 0.45);
            }
        }

        // ── Animation Loop ─────────────────────────────────────────────────────────
        let frameId;
        const clock = new THREE.Clock();

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();
            controls.update();

            const current = readingsRef.current;

            // Update node colors + labels
            LAYOUT.forEach((nodeDef) => {
                const reading = current.find((r) => r.name === nodeDef.name);
                if (!reading) return;
                const color = STATUS_COLORS[reading.status] || STATUS_COLORS.active;
                const group = nodeGroups[nodeDef.name];
                if (group) {
                    group.traverse((child) => {
                        if (child.isMesh && child.material && !child.userData.keepColor) {
                            // Only recolor the main structural meshes
                            if (!child.material.emissive) return;
                            child.material.emissiveIntensity = reading.status === "critical"
                                ? 0.5 + 0.5 * Math.sin(elapsed * 8)
                                : reading.status === "warning" ? 0.25 : 0.05;
                        }
                    });
                    // Animate point light
                    if (group.userData.pointLight) {
                        group.userData.pointLight.color.copy(color);
                        group.userData.pointLight.intensity = reading.status === "disconnected" ? 0 : 0.6;
                    }
                }

                // Update label
                const label = labels[nodeDef.name];
                if (label) {
                    const fresh = createLabel(reading.voltage, reading.power, reading.status);
                    label.material.map = fresh.material.map;
                    label.material.needsUpdate = true;
                    label.material.map.needsUpdate = true;
                    label.position.y = 4.0 + 0.1 * Math.sin(elapsed * 1.2 + nodeDef.x);
                }
            });

            // Animate particles on power lines
            powerLines.concat(cityLinks).forEach((line, i) => {
                line.t = (line.t + 0.008) % 1;
                const pos = line.curve.getPoint(line.t);
                line.particle.position.copy(pos);
                line.sparkGlow.position.copy(pos);

                // Color by source node status
                const sourceReading = current.find((r) => r.name === line.fromNode);
                if (sourceReading) {
                    const c = STATUS_COLORS[sourceReading.status] || STATUS_COLORS.active;
                    line.particle.material.color.copy(c);
                    line.sparkGlow.material.color.copy(c);
                    line.tubeMat.emissive.copy(c);
                    line.tubeMat.color.copy(c);
                    line.particle.material.opacity = sourceReading.status === "disconnected" ? 0.05 : 0.95;
                    line.sparkGlow.material.opacity = sourceReading.status === "disconnected" ? 0.02 : 0.25;
                    line.tubeMat.opacity = sourceReading.status === "disconnected" ? 0.1 : 0.7;
                    line.tubeMat.emissiveIntensity = sourceReading.status === "critical"
                        ? 0.8 + 0.5 * Math.sin(elapsed * 6 + i)
                        : 0.4;
                }
            });

            // Pulse blue center light
            bluePointLight.intensity = 1.5 + Math.sin(elapsed * 2) * 0.5;

            cityLabels.forEach(({ label, item, heightOffset }, index) => {
                const bob = item.type === "street_light" ? 0.04 : item.type === "transmission_tower" ? 0.06 : 0.08;
                label.position.y = heightOffset + bob * Math.sin(elapsed * 1.4 + index * 0.35);
                label.lookAt(camera.position);
            });

            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(frameId);
            controls.dispose();
            renderer.dispose();
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={mountRef} className="w-full h-full rounded-xl overflow-hidden" />;
}