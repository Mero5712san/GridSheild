import { useMemo, useState } from "react";
import useSimulation from "@/hooks/useSimulation";
import {
    CartesianGrid,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Cell,
} from "recharts";

const utilizationColors = ["#22c55e", "#eab308", "#ef4444"];

export default function SubstationMonitoringPage() {
    const { substationMonitoring, moduleTrends, alerts } = useSimulation();
    const [selectedNode, setSelectedNode] = useState(substationMonitoring[0]?.node || "");

    console.log("SubstationMonitoring:", {
        substationMonitoring: substationMonitoring?.length,
        voltageHistory: moduleTrends?.voltageFluctuationHistory?.length,
    });

    const stats = useMemo(() => {
        const total = substationMonitoring.length;
        const avgLoad = Math.round(
            substationMonitoring.reduce((sum, s) => sum + s.transformerLoadPercent, 0) / Math.max(total, 1)
        );
        const critical = substationMonitoring.filter((s) => s.overloadRisk === "high").length;
        const peak = Math.max(...substationMonitoring.map((s) => s.transformerLoadPercent), 0);
        return { total, avgLoad, critical, peak };
    }, [substationMonitoring]);

    const utilizationData = useMemo(() => {
        const healthy = substationMonitoring.filter((s) => s.transformerLoadPercent < 75).length;
        const warning = substationMonitoring.filter((s) => s.transformerLoadPercent >= 75 && s.transformerLoadPercent < 90).length;
        const critical = substationMonitoring.filter((s) => s.transformerLoadPercent >= 90).length;
        return [
            { name: "Healthy", value: healthy },
            { name: "Warning", value: warning },
            { name: "Critical", value: critical },
        ];
    }, [substationMonitoring]);

    const selectedStation = substationMonitoring.find((s) => s.node === selectedNode) || substationMonitoring[0];
    const trendData = (moduleTrends?.substationLoadHistory || []).map((point) => ({
        time: point.time,
        selectedLoad: Math.max(
            0,
            Math.min(100, Math.round((point.avgLoad * (selectedStation?.transformerLoadPercent || 50)) / Math.max(stats.avgLoad, 1)))
        ),
        avgLoad: point.avgLoad,
    }));

    const stationAlerts = alerts.filter((alert) => /overload|critical/i.test(alert.message)).slice(-6).reverse();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Substation Monitoring</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <StatCard label="Total Substations" value={stats.total} />
                <StatCard label="Average Load" value={`${stats.avgLoad}%`} />
                <StatCard label="Critical Stations" value={stats.critical} tone="danger" />
                <StatCard label="Peak Utilization" value={`${stats.peak}%`} tone="warn" />
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-[10px] text-slate-400 md:col-span-4">
                    Data check: Substations={substationMonitoring.length} | Voltage History={moduleTrends?.voltageFluctuationHistory?.length || 0}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Voltage Fluctuation Trend">
                    <ChartBox>
                        {(moduleTrends?.voltageFluctuationHistory || []).length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                                Loading chart data...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={moduleTrends?.voltageFluctuationHistory || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                    <XAxis dataKey="time" tick={false} />
                                    <YAxis />
                                    <Tooltip />
                                    <Line dataKey="avgVoltage" stroke="#22c55e" dot={false} />
                                    <Line dataKey="minVoltage" stroke="#eab308" dot={false} />
                                    <Line dataKey="maxVoltage" stroke="#ef4444" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </ChartBox>
                </Panel>

                <Panel title="Transformer Utilization Mix">
                    <ChartBox>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={utilizationData} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="70%">
                                    {utilizationData.map((_, idx) => (
                                        <Cell key={idx} fill={utilizationColors[idx]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartBox>
                </Panel>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Substation Table</p>
                    <select
                        className="bg-secondary border border-border rounded-md px-2 py-1 text-xs"
                        value={selectedStation?.node || ""}
                        onChange={(e) => setSelectedNode(e.target.value)}
                    >
                        {substationMonitoring.map((station) => (
                            <option key={station.node} value={station.node}>
                                {station.node}
                            </option>
                        ))}
                    </select>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-xs text-muted-foreground">
                        <tr>
                            <th className="text-left p-3">Substation</th>
                            <th className="text-left p-3">Load</th>
                            <th className="text-left p-3">Voltage</th>
                            <th className="text-left p-3">Current</th>
                            <th className="text-left p-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {substationMonitoring.map((station) => (
                            <tr
                                key={station.node}
                                className={`border-t border-border/60 cursor-pointer ${selectedStation?.node === station.node ? "bg-primary/5" : ""}`}
                                onClick={() => setSelectedNode(station.node)}
                            >
                                <td className="p-3">{station.node}</td>
                                <td className="p-3">{station.transformerLoadPercent}%</td>
                                <td className="p-3">{station.voltage} V</td>
                                <td className="p-3">{station.current} A</td>
                                <td className="p-3 capitalize">{station.overloadRisk}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title={`Historical Trend: ${selectedStation?.node || "N/A"}`}>
                    <ChartBox>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                <XAxis dataKey="time" tick={false} />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Line dataKey="selectedLoad" stroke="#38bdf8" dot={false} />
                                <Line dataKey="avgLoad" stroke="#f59e0b" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartBox>
                </Panel>

                <Panel title="Alerts and Insights">
                    <div className="space-y-2 text-xs">
                        {stationAlerts.length === 0 && <p className="text-muted-foreground">No critical substation alerts in current window.</p>}
                        {stationAlerts.map((alert, idx) => (
                            <div key={idx} className="rounded-md border border-border/60 bg-secondary/40 p-2.5">
                                <p className="text-foreground font-medium">{alert.message}</p>
                                <p className="text-muted-foreground mt-1">{alert.action}</p>
                            </div>
                        ))}
                        <div className="rounded-md border border-border/60 bg-primary/5 p-2.5 text-muted-foreground">
                            Click a substation row to inspect its trend and compare against fleet average.
                        </div>
                    </div>
                </Panel>
            </div>
        </div>
    );
}

function StatCard({ label, value, tone = "default" }) {
    const toneClass = tone === "danger" ? "text-red-400" : tone === "warn" ? "text-yellow-400" : "text-foreground";
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] text-muted-foreground uppercase">{label}</p>
            <p className={`text-2xl font-semibold mt-1 ${toneClass}`}>{value}</p>
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
    return <div className="h-[220px] sm:h-[240px]">{children}</div>;
}
