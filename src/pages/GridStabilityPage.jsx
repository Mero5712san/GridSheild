import useSimulation from "@/hooks/useSimulation";
import {
    Bar,
    BarChart,
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

export default function GridStabilityPage() {
    const { stabilityControl, moduleTrends, readings, alerts, triggerInstability } = useSimulation();

    const loadDistribution = [
        { name: "High Priority", value: readings.filter((r) => r.priority === "high").length },
        { name: "Medium Priority", value: readings.filter((r) => r.priority === "medium").length },
        { name: "Low Priority", value: readings.filter((r) => r.priority === "low").length },
    ];

    const stabilityAlerts = alerts.filter((a) => /stability|imbalance|critical/i.test(a.message)).slice(-6).reverse();

    console.log("⚡ GridStability:", {
        stabilityControl,
        feederBalanceLength: stabilityControl?.feederBalance?.length || 0,
        stabilityHistoryLength: moduleTrends?.stabilityHistory?.length || 0,
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Grid Stability Control</h1>
                </div>
                <button
                    type="button"
                    onClick={triggerInstability}
                    className="px-3 py-1.5 text-xs rounded-md border border-red-500/40 bg-red-500/10 text-red-300"
                >
                    Trigger Instability Test
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <StatCard label="Grid Balance" value={`${stabilityControl?.gridBalancePercent || 0}%`} />
                <StatCard label="Imbalance Nodes" value={stabilityControl?.imbalanceNodes || 0} tone="danger" />
                <StatCard label="Stability Score" value={`${stabilityControl?.stabilityScore || 0}%`} tone="warn" />
                <StatCard label="Active Controls" value={(stabilityControl?.activeControls || []).length} />
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-[10px] text-slate-400 md:col-span-4">
                    Data check: Feeder Balance={stabilityControl?.feederBalance?.length || 0} | Stability History={moduleTrends?.stabilityHistory?.length || 0} | Mode={stabilityControl?.mode}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Panel title="Power Balance History">
                    <ChartBox>
                        {(moduleTrends?.stabilityHistory || []).length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                                Loading chart data...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={moduleTrends?.stabilityHistory || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                    <XAxis dataKey="time" tick={false} />
                                    <YAxis />
                                    <Tooltip />
                                    <Line dataKey="gridBalance" stroke="#22c55e" dot={false} />
                                    <Line dataKey="stabilityScore" stroke="#0ea5e9" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </ChartBox>
                </Panel>

                <Panel title="Load Distribution">
                    <ChartBox>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={loadDistribution} dataKey="value" nameKey="name" innerRadius={48} outerRadius={74}>
                                    <Cell fill="#ef4444" />
                                    <Cell fill="#eab308" />
                                    <Cell fill="#3b82f6" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartBox>
                </Panel>

                <Panel title="Feeder Balance">
                    <ChartBox>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stabilityControl?.feederBalance || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                <XAxis dataKey="zone" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="avgLoad" fill="#f59e0b" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartBox>
                </Panel>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Balanced vs Unstable Visualization">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-xs text-green-200">
                            <p className="font-semibold">Balanced</p>
                            <p className="mt-1">Uniform feeder loads and low correction demand.</p>
                        </div>
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
                            <p className="font-semibold">Unstable</p>
                            <p className="mt-1">High feeder delta with active stabilization controls.</p>
                        </div>
                    </div>
                    <div className="mt-3 rounded-md border border-border/60 bg-secondary/40 p-3 text-xs text-muted-foreground">
                        Current mode: <span className="text-foreground capitalize">{stabilityControl?.mode || "normal"}</span>
                    </div>
                </Panel>

                <Panel title="Control Actions and Alerts">
                    <div className="space-y-2 text-xs">
                        <div className="rounded-md border border-border/60 bg-primary/5 p-2.5 text-muted-foreground">
                            Active controls: {(stabilityControl?.activeControls || []).join(", ") || "none"}
                        </div>
                        {stabilityAlerts.map((alert, idx) => (
                            <div key={idx} className="rounded-md border border-border/60 bg-secondary/40 p-2.5">
                                <p className="text-foreground font-medium">{alert.message}</p>
                                <p className="text-muted-foreground mt-1">{alert.action}</p>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">Feeder Stability Table</p>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-xs text-muted-foreground">
                        <tr>
                            <th className="text-left p-3">Zone</th>
                            <th className="text-left p-3">Average Load</th>
                            <th className="text-left p-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(stabilityControl?.feederBalance || []).map((zone) => (
                            <tr key={zone.zone} className="border-t border-border/60">
                                <td className="p-3">Zone {zone.zone}</td>
                                <td className="p-3">{zone.avgLoad}%</td>
                                <td className="p-3">{zone.avgLoad > 80 ? "Unstable" : "Balanced"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatCard({ label, value, tone = "default" }) {
    const color = tone === "danger" ? "text-red-400" : tone === "warn" ? "text-yellow-400" : "text-foreground";
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

function ChartBox({ children }) {
    return <div className="h-[240px]">{children}</div>;
}
