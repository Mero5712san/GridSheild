import { useMemo, useState } from "react";
import useSimulation from "@/hooks/useSimulation";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Area,
    AreaChart,
    BarChart,
    Bar,
} from "recharts";

export default function LoadPredictionPage() {
    const { loadFluctuationPrediction, moduleTrends, alerts } = useSimulation();
    const [riskFilter, setRiskFilter] = useState("all");
    const zones = loadFluctuationPrediction?.zones || [];
    const filteredZones = riskFilter === "all" ? zones : zones.filter((zone) => zone.risk === riskFilter);

    const stats = useMemo(() => ({
        peak: loadFluctuationPrediction?.predictedPeakLoad || 0,
        overloadProbability: loadFluctuationPrediction?.overloadProbability || 0,
        trend: loadFluctuationPrediction?.currentTrend || "stable",
        riskZones: (loadFluctuationPrediction?.riskZones || []).length,
    }), [loadFluctuationPrediction]);

    const spikeAlerts = zones.filter((z) => z.risk === "high").map((z) => `Spike expected in Zone ${z.zone}`);
    const recentPredictionAlerts = alerts.filter((a) => /predicted|spike|overload/i.test(a.message)).slice(-6).reverse();

    console.log("LoadPrediction:", {
        loadFluctuationPrediction,
        zonesCount: zones.length,
        timelineLength: loadFluctuationPrediction?.timeline?.length || 0,
        predictionHistoryLength: moduleTrends?.predictionHistory?.length || 0,
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Load Fluctuation Prediction</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <StatCard label="Predicted Peak Load" value={`${stats.peak}%`} />
                <StatCard label="Overload Probability" value={`${stats.overloadProbability}%`} tone="warn" />
                <StatCard label="Current Trend" value={stats.trend} />
                <StatCard label="Risk Zones" value={stats.riskZones} tone="danger" />
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-[10px] text-slate-400 md:col-span-4">
                    Data check: Zones={zones.length} | Timeline={loadFluctuationPrediction?.timeline?.length || 0} | Prediction History={moduleTrends?.predictionHistory?.length || 0}
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Prediction controls</p>
                <select
                    className="bg-secondary border border-border rounded-md px-2 py-1 text-xs"
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                >
                    <option value="all">All risks</option>
                    <option value="high">High risk</option>
                    <option value="medium">Medium risk</option>
                    <option value="low">Low risk</option>
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Panel title="Real-Time vs Predicted Load">
                    <ChartBox>
                        {(moduleTrends?.predictionHistory || []).length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                                Loading chart data...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={moduleTrends?.predictionHistory || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                    <XAxis dataKey="time" tick={false} />
                                    <YAxis />
                                    <Tooltip />
                                    <Line dataKey="current" stroke="#0ea5e9" dot={false} />
                                    <Line dataKey="predicted" stroke="#eab308" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </ChartBox>
                </Panel>

                <Panel title="Now to +10m Timeline">
                    <ChartBox>
                        {(loadFluctuationPrediction?.timeline || []).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                                <div>Loading timeline data...</div>
                                <div className="text-[9px] text-slate-500">Forecast: {loadFluctuationPrediction?.timeline?.length || 0} points</div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                <div className="text-[9px] text-slate-600 mb-1">Data points: {loadFluctuationPrediction?.timeline?.length || 0}</div>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={loadFluctuationPrediction?.timeline || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                            <XAxis dataKey="point" />
                                            <YAxis />
                                            <Tooltip />
                                            <Area dataKey="value" stroke="#22c55e" fill="#22c55e33" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </ChartBox>
                </Panel>

                <Panel title="Zone Risk Comparison">
                    <ChartBox>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredZones}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                <XAxis dataKey="zone" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="currentLoadPercent" fill="#38bdf8" />
                                <Bar dataKey="projectedLoadPercent" fill="#ef4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartBox>
                </Panel>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">Prediction Table</p>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-xs text-muted-foreground">
                        <tr>
                            <th className="text-left p-3">Zone</th>
                            <th className="text-left p-3">Current</th>
                            <th className="text-left p-3">Projected</th>
                            <th className="text-left p-3">Trend</th>
                            <th className="text-left p-3">Risk</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredZones.map((zone) => (
                            <tr key={zone.zone} className="border-t border-border/60">
                                <td className="p-3">Zone {zone.zone}</td>
                                <td className="p-3">{zone.currentLoadPercent}%</td>
                                <td className="p-3">{zone.projectedLoadPercent}%</td>
                                <td className="p-3 capitalize">{zone.trend}</td>
                                <td className="p-3 capitalize">{zone.risk}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Active Prediction Alerts">
                    <div className="space-y-2 text-xs">
                        {spikeAlerts.length === 0 && <p className="text-muted-foreground">No spike alerts for current cycle.</p>}
                        {spikeAlerts.map((line) => (
                            <div key={line} className="rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-red-200">{line}</div>
                        ))}
                        {recentPredictionAlerts.map((alert, idx) => (
                            <div key={idx} className="rounded-md border border-border/60 bg-secondary/40 p-2.5">
                                <p className="text-foreground font-medium">{alert.message}</p>
                                <p className="text-muted-foreground mt-1">{alert.action}</p>
                            </div>
                        ))}
                    </div>
                </Panel>
                <Panel title="Insights">
                    <ul className="space-y-2 text-xs text-muted-foreground">
                        <li>Forecast updates every simulation tick for near-term operational planning.</li>
                        <li>Zones with rising projected load should trigger pre-emptive feeder balancing.</li>
                        <li>Use overload probability with recommendation actions to prevent cascading outages.</li>
                    </ul>
                </Panel>
            </div>
        </div>
    );
}

function StatCard({ label, value, tone = "default" }) {
    const color = tone === "danger" ? "text-red-400" : tone === "warn" ? "text-yellow-400" : "text-foreground";
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] text-muted-foreground uppercase">{label}</p>
            <p className={`text-2xl font-semibold mt-1 capitalize ${color}`}>{value}</p>
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

function ChartBox({ children }) {
    return <div className="h-[240px]">{children}</div>;
}
