import { useMemo, useState } from "react";
import useSimulation from "@/hooks/useSimulation";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
    Cell,
} from "recharts";

export default function SensorOptimizationPage() {
    const { sensorOptimization, nodeConfigs, moduleTrends, alerts } = useSimulation();
    const [optimizedView, setOptimizedView] = useState(true);

    const placementData = useMemo(
        () => (sensorOptimization?.placementPlan || []).map((zone) => ({
            zone: `Zone ${zone.zone}`,
            sensors: zone.recommendedSensors,
            shared: zone.sharedCoverageNodes,
        })),
        [sensorOptimization]
    );

    const selectedLocations = new Set((sensorOptimization?.placementPlan || []).flatMap((z) => z.locations));
    const mapData = (nodeConfigs || []).map((node) => ({
        x: node.posX,
        y: node.posZ,
        node: node.name,
        monitored: selectedLocations.has(node.name),
    }));

    const heatCells = (sensorOptimization?.placementPlan || []).map((zone) => {
        const intensity = Math.min(100, Math.round((zone.recommendedSensors / Math.max(zone.sharedCoverageNodes + zone.recommendedSensors, 1)) * 100));
        return { zone: zone.zone, intensity, sensors: zone.recommendedSensors };
    });

    const costData = [
        { name: "Traditional", cost: (sensorOptimization?.totalNodes || 0) * 1000 },
        { name: "Optimized", cost: (sensorOptimization?.requiredSensors || 0) * 1000 },
    ];

    const moduleAlerts = alerts.filter((a) => /sensor|coverage|optimization|disconnect/i.test(a.message)).slice(-5).reverse();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Sensor Cost Optimization</h1>
                </div>
                <button
                    type="button"
                    onClick={() => setOptimizedView((v) => !v)}
                    className="px-3 py-1.5 text-xs rounded-md border border-border bg-secondary"
                >
                    {optimizedView ? "Show Non-Optimized View" : "Show Optimized View"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <StatCard label="Required Sensors" value={sensorOptimization?.requiredSensors || 0} />
                <StatCard label="Nodes Covered" value={sensorOptimization?.totalNodes || 0} />
                <StatCard label="Coverage" value={`${sensorOptimization?.coveragePercent || 0}%`} tone="ok" />
                <StatCard label="Cost Savings" value={`${sensorOptimization?.savingPercent || 0}%`} tone="ok" />
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-[10px] text-slate-400 md:col-span-4">
                    Data check: Placement Plan={sensorOptimization?.placementPlan?.length || 0} | Sensor Table={sensorOptimization?.sensorTable?.length || 0} | Optimization History={moduleTrends?.sensorOptimizationHistory?.length || 0}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Panel title="Coverage Heatmap">
                    <div className="grid grid-cols-2 gap-2">
                        {heatCells.map((cell) => (
                            <div key={cell.zone} className="rounded-md border border-border/60 p-3" style={{ backgroundColor: `rgba(56,189,248,${cell.intensity / 130})` }}>
                                <p className="text-xs text-foreground font-medium">Zone {cell.zone}</p>
                                <p className="text-[11px] text-muted-foreground mt-1">Intensity: {cell.intensity}%</p>
                                <p className="text-[11px] text-muted-foreground">Sensors: {cell.sensors}</p>
                            </div>
                        ))}
                    </div>
                </Panel>

                <Panel title="Sensor Placement Map">
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                <XAxis dataKey="x" name="X" />
                                <YAxis dataKey="y" name="Z" />
                                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                                <Scatter data={mapData}>
                                    {mapData.map((point, idx) => (
                                        <Cell
                                            key={idx}
                                            fill={optimizedView ? (point.monitored ? "#22c55e" : "#64748b") : "#ef4444"}
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>

                <Panel title="Cost Comparison">
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={costData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="cost" fill="#f97316" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">Sensor Efficiency Table</p>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-xs text-muted-foreground">
                        <tr>
                            <th className="text-left p-3">Sensor</th>
                            <th className="text-left p-3">Coverage Nodes</th>
                            <th className="text-left p-3">Efficiency</th>
                            <th className="text-left p-3">Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(sensorOptimization?.sensorTable || []).map((sensor) => (
                            <tr key={sensor.sensor} className="border-t border-border/60">
                                <td className="p-3">{sensor.sensor}</td>
                                <td className="p-3">{sensor.coverageNodes}</td>
                                <td className="p-3">{sensor.efficiency}%</td>
                                <td className="p-3">${sensor.cost}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Optimization Trend">
                    <div className="h-[220px]">
                        {(moduleTrends?.sensorOptimizationHistory || []).length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                                Loading chart data...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={moduleTrends?.sensorOptimizationHistory || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                    <XAxis dataKey="time" tick={false} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="requiredSensors" fill="#0ea5e9" />
                                    <Bar dataKey="coverage" fill="#22c55e" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Panel>
                <Panel title="Alerts and Insights">
                    <div className="space-y-2 text-xs">
                        {moduleAlerts.length === 0 && <p className="text-muted-foreground">No sensor optimization alerts in this window.</p>}
                        {moduleAlerts.map((alert, idx) => (
                            <div key={idx} className="rounded-md border border-border/60 bg-secondary/40 p-2.5">
                                <p className="text-foreground font-medium">{alert.message}</p>
                                <p className="text-muted-foreground mt-1">{alert.action}</p>
                            </div>
                        ))}
                        <div className="rounded-md border border-border/60 bg-primary/5 p-2.5 text-muted-foreground">
                            Optimized placement minimizes sensor count while maintaining broad zone coverage.
                        </div>
                    </div>
                </Panel>
            </div>
        </div>
    );
}

function StatCard({ label, value, tone = "default" }) {
    const color = tone === "ok" ? "text-emerald-400" : "text-foreground";
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] text-muted-foreground uppercase">{label}</p>
            <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
        </div>
    );
}

function Panel({ title, children }) {
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
            {children}
        </div>
    );
}
