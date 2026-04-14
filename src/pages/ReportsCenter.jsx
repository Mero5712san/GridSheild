import useSimulation from "@/hooks/useSimulation";
import ReportingBillingPanel from "@/components/dashboard/ReportingBillingPanel";
import { FileText } from "lucide-react";
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

function formatNumber(value) {
    return Number(value || 0).toLocaleString();
}

export default function ReportsCenter() {
    const { report, billing, alerts, gridHealth, recommendationEngine, moduleTrends } = useSimulation();

    const zoneConsumption = billing?.zones || [];
    const reportAlerts = alerts.slice(-8).reverse();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Reports and Billing</h1>
                    <p className="text-sm text-muted-foreground mt-1">Downloadable analytics for monitoring, forecasting, and planning</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Automated Reports</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] text-muted-foreground uppercase">Health Score</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">{gridHealth?.healthScore ?? 0}%</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] text-muted-foreground uppercase">Total Alerts</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">{formatNumber(alerts?.length)}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] text-muted-foreground uppercase">Recommendations</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">{formatNumber(recommendationEngine?.length)}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] text-muted-foreground uppercase">Report Sections</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">{report ? 8 : 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Report Health Trend</h3>
                    <div className="h-[230px]">
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
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Zone-Wise Consumption</h3>
                    <div className="h-[230px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={zoneConsumption}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                <XAxis dataKey="zone" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="energyKwh" fill="#0ea5e9" />
                                <Bar dataKey="estimatedCost" fill="#f59e0b" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">Report Event Table</p>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-xs text-muted-foreground">
                        <tr>
                            <th className="text-left p-3">Time</th>
                            <th className="text-left p-3">Event</th>
                            <th className="text-left p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(report?.blackoutPreventionLog || []).slice(-8).map((item, idx) => (
                            <tr key={idx} className="border-t border-border/60">
                                <td className="p-3">{item.time}</td>
                                <td className="p-3">{item.message}</td>
                                <td className="p-3">{item.action}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ReportingBillingPanel billing={billing} report={report} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Active Alerts</h3>
                    <div className="space-y-2 text-xs">
                        {reportAlerts.map((alert, idx) => (
                            <div key={idx} className="rounded-md border border-border/60 bg-secondary/40 p-2.5">
                                <p className="text-foreground font-medium">{alert.message}</p>
                                <p className="text-muted-foreground mt-1">{alert.action}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Operational Insights</h3>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                        <li>Use report exports for audit trail of recommendations and control decisions.</li>
                        <li>Zone energy and cost trends highlight efficiency opportunities.</li>
                        <li>Failure and alert trajectories indicate where preventive maintenance is needed most.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
