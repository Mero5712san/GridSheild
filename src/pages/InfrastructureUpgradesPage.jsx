import useSimulation from "@/hooks/useSimulation";
import { useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

export default function InfrastructureUpgradesPage() {
    const { infrastructureRecommendations, readings, moduleTrends, alerts } = useSimulation();
    const [priorityFilter, setPriorityFilter] = useState("all");
    const actions = infrastructureRecommendations?.actions || [];
    const filteredActions = priorityFilter === "all" ? actions : actions.filter((action) => action.priority === priorityFilter);

    const zoneCapacity = Object.values(
        (readings || []).reduce((acc, node) => {
            if (!acc[node.zone]) {
                acc[node.zone] = { zone: `Zone ${node.zone}`, load: 0, capacity: 0 };
            }
            acc[node.zone].load += node.power;
            acc[node.zone].capacity += node.maxLoad;
            return acc;
        }, {})
    );

    const infraAlerts = alerts.filter((a) => /upgrade|capacity|critical|overload/i.test(a.message)).slice(-6).reverse();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Infrastructure Upgrades</h1>
                <p className="text-sm text-muted-foreground mt-1">Capacity planning and upgrade actions for long-term grid resilience</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <StatCard label="Overloaded Nodes" value={infrastructureRecommendations?.overloadedNodes || 0} tone="danger" />
                <StatCard label="Upgrade Required" value={infrastructureRecommendations?.upgradeRequired || 0} tone="warn" />
                <StatCard label="Capacity Shortage" value={`${infrastructureRecommendations?.capacityShortage || 0}%`} tone="danger" />
                <StatCard label="Recommended Actions" value={actions.length} />
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-[10px] text-slate-400 md:col-span-4">
                    Data check: Actions={actions.length} | Zone Capacity={zoneCapacity.length} | Infrastructure History={moduleTrends?.infrastructureHistory?.length || 0}
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Upgrade controls</p>
                <select
                    className="bg-secondary border border-border rounded-md px-2 py-1 text-xs"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                >
                    <option value="all">All priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Capacity vs Load by Zone">
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={zoneCapacity}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                <XAxis dataKey="zone" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="capacity" fill="#22c55e" />
                                <Bar dataKey="load" fill="#ef4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>

                <Panel title="Growth and Upgrade Pressure">
                    <div className="h-[260px]">
                        {(moduleTrends?.infrastructureHistory || []).length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                                Loading chart data...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={moduleTrends?.infrastructureHistory || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                    <XAxis dataKey="time" tick={false} />
                                    <YAxis />
                                    <Tooltip />
                                    <Line dataKey="capacityShortage" stroke="#ef4444" dot={false} />
                                    <Line dataKey="upgradeRequired" stroke="#f59e0b" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Panel>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {filteredActions.map((action, idx) => (
                    <div key={`${action.action}-${idx}`} className="rounded-xl border border-border bg-card p-4">
                        <p className="text-sm font-semibold text-foreground">{action.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">{action.reason}</p>
                        <p className="text-[11px] mt-2 text-primary">Affected Zone: {action.zone}</p>
                    </div>
                ))}
                {filteredActions.length === 0 && (
                    <div className="rounded-xl border border-border bg-card p-4 col-span-full text-xs text-muted-foreground">
                        No upgrade cards generated in this cycle.
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">Upgrade Recommendation Table</p>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-xs text-muted-foreground">
                        <tr>
                            <th className="text-left p-3">Priority</th>
                            <th className="text-left p-3">Action</th>
                            <th className="text-left p-3">Zone</th>
                            <th className="text-left p-3">Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredActions.map((action, idx) => (
                            <tr key={idx} className="border-t border-border/60">
                                <td className="p-3 capitalize">{action.priority}</td>
                                <td className="p-3">{action.action}</td>
                                <td className="p-3">Zone {action.zone}</td>
                                <td className="p-3">{action.reason}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Related Alerts">
                    <div className="space-y-2 text-xs">
                        {infraAlerts.length === 0 && <p className="text-muted-foreground">No infrastructure alerts in this cycle.</p>}
                        {infraAlerts.map((alert, idx) => (
                            <div key={idx} className="rounded-md border border-border/60 bg-secondary/40 p-2.5">
                                <p className="text-foreground font-medium">{alert.message}</p>
                                <p className="text-muted-foreground mt-1">{alert.action}</p>
                            </div>
                        ))}
                    </div>
                </Panel>
                <Panel title="Insights">
                    <ul className="space-y-2 text-xs text-muted-foreground">
                        <li>Capacity shortage above 10% indicates imminent upgrade requirement.</li>
                        <li>Combine feeder expansion with transformer upgrades to reduce overload clusters.</li>
                        <li>Critical-health nodes should be prioritized for backup supply installation.</li>
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
