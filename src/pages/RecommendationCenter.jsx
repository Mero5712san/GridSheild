import useSimulation from "@/hooks/useSimulation";
import { useMemo } from "react";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function RecommendationCenter() {
    const { recommendationEngine, applyRecommendation, alerts } = useSimulation();

    const stats = useMemo(() => {
        const total = recommendationEngine.length;
        const high = recommendationEngine.filter((r) => r.priority === "high").length;
        const pending = recommendationEngine.filter((r) => r.status === "pending").length;
        const affectedZones = new Set(recommendationEngine.flatMap((r) => r.affectedZones || []));
        return { total, high, pending, zones: affectedZones.size };
    }, [recommendationEngine]);

    const byPriority = [
        { priority: "high", count: recommendationEngine.filter((r) => r.priority === "high").length },
        { priority: "medium", count: recommendationEngine.filter((r) => r.priority === "medium").length },
        { priority: "low", count: recommendationEngine.filter((r) => r.priority === "low").length },
    ];

    const recommendationAlerts = alerts.filter((a) => /recommendation|predicted|load spike/i.test(a.message)).slice(-6).reverse();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Recommendation Center</h1>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">AI Engine Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <StatCard label="Total Recommendations" value={stats.total} />
                <StatCard label="High Priority" value={stats.high} tone="danger" />
                <StatCard label="Pending Actions" value={stats.pending} tone="warn" />
                <StatCard label="Affected Zones" value={stats.zones} />
            </div>

            {/* <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Recommendation Priority Distribution</h3>
                <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={byPriority}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                            <XAxis dataKey="priority" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#0ea5e9" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div> */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recommendationEngine.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-foreground">{item.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">{item.action}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${item.priority === "high" ? "bg-red-500/20 text-red-300" : item.priority === "medium" ? "bg-yellow-500/20 text-yellow-300" : "bg-blue-500/20 text-blue-300"}`}>
                                {item.priority}
                            </span>
                        </div>
                        <div className="mt-3 text-[11px] text-muted-foreground grid grid-cols-2 gap-2">
                            <p>Time: {item.time}</p>
                            <p>Status: <span className="capitalize">{item.status}</span></p>
                            <p className="col-span-2">Affected Zones: {(item.affectedZones || []).length ? item.affectedZones.map((z) => `Zone ${z}`).join(", ") : "Global"}</p>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <Button size="sm" onClick={() => applyRecommendation(item.id, "approved")}>Apply</Button>
                            <Button size="sm" variant="outline" onClick={() => applyRecommendation(item.id, "rejected")}>Dismiss</Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Recommendation Alerts</h3>
                    <div className="space-y-2 text-xs">
                        {recommendationAlerts.length === 0 && <p className="text-muted-foreground">No recommendation alerts in the current window.</p>}
                        {recommendationAlerts.map((alert, idx) => (
                            <div key={idx} className="rounded-md border border-border/60 bg-secondary/40 p-2.5">
                                <p className="text-foreground font-medium">{alert.message}</p>
                                <p className="text-muted-foreground mt-1">{alert.action}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Decision Insights</h3>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                        <li>Apply high-priority actions first to stabilize critical feeders.</li>
                        <li>Use zone impact tags to coordinate control-room dispatch.</li>
                        <li>Track action status to measure recommendation acceptance and outcomes.</li>
                    </ul>
                </div>
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
