import { Cpu, Radar, HeartPulse, ArrowUpCircle, Route, Gauge } from "lucide-react";

const riskClass = {
    high: "text-red-400",
    medium: "text-yellow-400",
    low: "text-green-400",
};

export default function OperationsIntelligencePanel({
    substationMonitoring,
    sensorOptimization,
    loadPrediction,
    componentHealth,
    infrastructureRecommendations,
    energyFlow,
    stabilityControl,
}) {
    const topSubstations = (substationMonitoring || []).slice(0, 4);
    const riskyZones = (loadPrediction?.zones || []).filter((zone) => zone.risk !== "low");
    const weakComponents = (componentHealth?.components || []).filter((component) => component.warning).slice(0, 4);
    const upgrades = (infrastructureRecommendations || []).slice(0, 4);
    const flowCounts = (energyFlow || []).reduce((acc, flow) => {
        acc[flow.flowColor] = (acc[flow.flowColor] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Operations Intelligence Modules</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Substation, prediction, health, stability, and optimization analytics</p>
                </div>
                <Cpu className="w-4 h-4 text-primary" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                    <p className="text-xs font-medium text-foreground flex items-center gap-2"><Radar className="w-3.5 h-3.5" />Substation Monitoring</p>
                    <div className="mt-2 space-y-1.5">
                        {topSubstations.map((station) => (
                            <div key={station.node} className="text-[11px] text-muted-foreground flex items-center justify-between">
                                <span className="truncate">{station.node}</span>
                                <span className={riskClass[station.overloadRisk]}>{station.transformerLoadPercent}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                    <p className="text-xs font-medium text-foreground flex items-center gap-2"><Route className="w-3.5 h-3.5" />Sensor Cost Optimization</p>
                    <div className="mt-2 text-[11px] text-muted-foreground space-y-1">
                        <p>Required sensors: <span className="text-foreground font-medium">{sensorOptimization?.requiredSensors ?? 0}</span></p>
                        <p>Nodes covered: <span className="text-foreground font-medium">{sensorOptimization?.totalNodes ?? 0}</span></p>
                        <p>Estimated cost savings: <span className="text-emerald-400 font-medium">{sensorOptimization?.savingPercent ?? 0}%</span></p>
                    </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                    <p className="text-xs font-medium text-foreground flex items-center gap-2"><ArrowUpCircle className="w-3.5 h-3.5" />Load Fluctuation Prediction</p>
                    <div className="mt-2 space-y-1.5">
                        {riskyZones.length === 0 && <p className="text-[11px] text-emerald-400">No high-risk zones in current window.</p>}
                        {riskyZones.map((zone) => (
                            <p key={zone.zone} className="text-[11px] text-muted-foreground">
                                Zone {zone.zone}: <span className={riskClass[zone.risk]}>{zone.projectedLoadPercent}% projected ({zone.trend})</span>
                            </p>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                    <p className="text-xs font-medium text-foreground flex items-center gap-2"><HeartPulse className="w-3.5 h-3.5" />Component Health Monitoring</p>
                    <div className="mt-2 text-[11px] text-muted-foreground space-y-1.5">
                        <p>Average health: <span className="text-foreground font-medium">{componentHealth?.averageHealth ?? 0}%</span></p>
                        <p>At-risk components: <span className="text-red-400 font-medium">{componentHealth?.atRiskCount ?? 0}</span></p>
                        {weakComponents.slice(0, 2).map((component) => (
                            <p key={component.name} className="truncate">{component.name} ({component.healthScore}%)</p>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                    <p className="text-xs font-medium text-foreground">Infrastructure Upgrades</p>
                    <div className="mt-2 space-y-1.5">
                        {upgrades.length === 0 && <p className="text-[11px] text-muted-foreground">No upgrades recommended now.</p>}
                        {upgrades.map((item, index) => (
                            <p key={`${item.action}-${index}`} className="text-[11px] text-muted-foreground truncate">Zone {item.zone}: {item.action}</p>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                    <p className="text-xs font-medium text-foreground">Energy Flow Visualization</p>
                    <div className="mt-2 text-[11px] text-muted-foreground space-y-1">
                        <p>Normal flow (green): {flowCounts.green || 0}</p>
                        <p>High load (yellow): {flowCounts.yellow || 0}</p>
                        <p>Overload risk (red): {flowCounts.red || 0}</p>
                        <p>Load reduction (blue): {flowCounts.blue || 0}</p>
                    </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                    <p className="text-xs font-medium text-foreground flex items-center gap-2"><Gauge className="w-3.5 h-3.5" />Grid Stability Control</p>
                    <div className="mt-2 text-[11px] text-muted-foreground space-y-1">
                        <p>Mode: <span className="text-foreground font-medium capitalize">{stabilityControl?.mode || "normal"}</span></p>
                        <p>Imbalance nodes: <span className="text-foreground font-medium">{stabilityControl?.imbalanceNodes ?? 0}</span></p>
                        <p>Controls: <span className="text-foreground">{(stabilityControl?.activeControls || []).join(", ") || "none"}</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
