import useSimulation from "@/hooks/useSimulation";
import { useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const riskColors = {
    healthy: "#22c55e",
    warning: "#eab308",
    critical: "#ef4444",
};

export default function ComponentHealthPage() {
    const { componentHealth, moduleTrends, alerts } = useSimulation();
    const [riskFilter, setRiskFilter] = useState("all");
    const components = componentHealth?.components || [];
    const filteredComponents = riskFilter === "all" ? components : components.filter((component) => component.risk === riskFilter);

    const riskBreakdown = [
        { name: "Healthy", value: components.filter((c) => c.risk === "healthy").length },
        { name: "Warning", value: components.filter((c) => c.risk === "warning").length },
        { name: "Critical", value: components.filter((c) => c.risk === "critical").length },
    ];

    const healthAlerts = alerts.filter((a) => /critical|health|stress/i.test(a.message)).slice(-6).reverse();

    console.log("🏥 ComponentHealth:", {
        componentHealth,
        componentsCount: components.length,
        riskBreakdown,
        healthHistory: moduleTrends?.componentHealthHistory?.length || 0,
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Component Health Monitoring</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <StatCard label="Average Health" value={`${componentHealth?.averageHealth || 0}%`} />
                <StatCard label="At-Risk Components" value={componentHealth?.atRiskCount || 0} tone="warn" />
                <StatCard label="Critical Nodes" value={componentHealth?.criticalNodes || 0} tone="danger" />
                <StatCard label="Failure Probability" value={`${componentHealth?.failureProbability || 0}%`} tone="danger" />
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-[10px] text-slate-400 md:col-span-4">
                    Data check: Components={components.length} | Health History={moduleTrends?.componentHealthHistory?.length || 0} | Risk Breakdown={JSON.stringify(riskBreakdown)}
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Component controls</p>
                <select
                    className="bg-secondary border border-border rounded-md px-2 py-1 text-xs"
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                >
                    <option value="all">All components</option>
                    <option value="healthy">Healthy</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Panel title="Component Health by Node">
                    <ChartBox>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredComponents}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                <XAxis dataKey="name" tick={false} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="healthScore">
                                    {filteredComponents.map((component, idx) => (
                                        <Cell key={idx} fill={riskColors[component.risk] || "#64748b"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartBox>
                </Panel>

                <Panel title="Component Risk">
                    <ChartBox>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={riskBreakdown} dataKey="value" nameKey="name" innerRadius={48} outerRadius={74}>
                                    <Cell fill="#22c55e" />
                                    <Cell fill="#eab308" />
                                    <Cell fill="#ef4444" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartBox>
                </Panel>

                <Panel title="Degradation Timeline">
                    <ChartBox>
                        {(moduleTrends?.componentHealthHistory || []).length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                                Loading chart data...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={moduleTrends?.componentHealthHistory || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                    <XAxis dataKey="time" tick={false} />
                                    <YAxis />
                                    <Tooltip />
                                    <Line dataKey="averageHealth" stroke="#22c55e" dot={false} />
                                    <Line dataKey="failureProbability" stroke="#ef4444" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </ChartBox>
                </Panel>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">Component Risk Table</p>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-xs text-muted-foreground">
                        <tr>
                            <th className="text-left p-3">Component</th>
                            <th className="text-left p-3">Health</th>
                            <th className="text-left p-3">Stress</th>
                            <th className="text-left p-3">Risk</th>
                            <th className="text-left p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredComponents.map((component) => (
                            <tr key={component.name} className="border-t border-border/60">
                                <td className="p-3">{component.name}</td>
                                <td className="p-3">{component.healthScore}%</td>
                                <td className="p-3">{component.stressCycles}</td>
                                <td className="p-3 capitalize" style={{ color: riskColors[component.risk] }}>{component.risk}</td>
                                <td className="p-3">
                                    {component.risk === "critical"
                                        ? "Immediate maintenance"
                                        : component.risk === "warning"
                                            ? "Schedule inspection"
                                            : "Monitor"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Health Alerts">
                    <div className="space-y-2 text-xs">
                        {healthAlerts.length === 0 && <p className="text-muted-foreground">No component-health alerts in current window.</p>}
                        {healthAlerts.map((alert, idx) => (
                            <div key={idx} className="rounded-md border border-border/60 bg-secondary/40 p-2.5">
                                <p className="text-foreground font-medium">{alert.message}</p>
                                <p className="text-muted-foreground mt-1">{alert.action}</p>
                            </div>
                        ))}
                    </div>
                </Panel>
                <Panel title="Insights">
                    <ul className="space-y-2 text-xs text-muted-foreground">
                        <li>Red components indicate elevated failure probability and require immediate response.</li>
                        <li>Stress cycles are an early indicator of fatigue in transformers and feeders.</li>
                        <li>Trend deterioration should trigger upgrade planning and preventive maintenance.</li>
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
