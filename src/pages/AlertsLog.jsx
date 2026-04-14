import useSimulation from "@/hooks/useSimulation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Zap, CheckCircle, Info, Shield } from "lucide-react";

const iconMap = {
    critical: AlertTriangle,
    warning: Zap,
    success: CheckCircle,
    info: Info,
};

const colorMap = {
    critical: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
    warning: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
    success: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
    info: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
};

export default function AlertsLog() {
    const { alerts, pageFeeds } = useSimulation();
    const feed = pageFeeds?.alertsLog;
    const feedAlerts = feed?.alerts || alerts;
    const reversed = feed?.reversed || [...feedAlerts].reverse();
    const counts = feed?.counts || {
        critical: feedAlerts.filter((a) => a.severity === "critical").length,
        warning: feedAlerts.filter((a) => a.severity === "warning").length,
        success: feedAlerts.filter((a) => a.severity === "success").length,
        info: feedAlerts.filter((a) => a.severity === "info").length,
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Alerts Log</h1>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-mono text-muted-foreground">{feedAlerts.length} events</span>
                </div>
            </div>

            {/* Severity counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(counts).map(([severity, count]) => {
                    const c = colorMap[severity];
                    const Icon = iconMap[severity];
                    return (
                        <div key={severity} className={`rounded-lg border ${c.border} ${c.bg} p-4 flex items-center gap-3`}>
                            <Icon className={`w-5 h-5 ${c.text}`} />
                            <div>
                                <p className={`text-xl font-bold ${c.text}`}>{count}</p>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{severity}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Alert list */}
            <div className="rounded-xl border border-border bg-card">
                <ScrollArea className="h-[500px]">
                    <div className="divide-y divide-border">
                        {reversed.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-16">No alerts recorded yet</p>
                        )}
                        {reversed.map((alert, idx) => {
                            const c = colorMap[alert.severity] || colorMap.info;
                            const Icon = iconMap[alert.severity] || Info;
                            return (
                                <div key={idx} className="flex items-start gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors">
                                    <div className={`p-2 rounded-lg ${c.bg} mt-0.5`}>
                                        <Icon className={`w-4 h-4 ${c.text}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground">{alert.message}</p>
                                        {alert.action && <p className="text-xs text-muted-foreground mt-1">{alert.action}</p>}
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground/60 whitespace-nowrap">{alert.time}</span>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}