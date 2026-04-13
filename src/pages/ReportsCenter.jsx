import useSimulation from "@/hooks/useSimulation";
import ReportingBillingPanel from "@/components/dashboard/ReportingBillingPanel";
import { FileText } from "lucide-react";

function formatNumber(value) {
    return Number(value || 0).toLocaleString();
}

export default function ReportsCenter() {
    const { report, billing, alerts, gridHealth, recommendationEngine } = useSimulation();

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

            <ReportingBillingPanel billing={billing} report={report} />
        </div>
    );
}
