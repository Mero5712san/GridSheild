import { AlertTriangle, Zap, CheckCircle, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const iconMap = {
    critical: AlertTriangle,
    warning: Zap,
    success: CheckCircle,
    info: Info,
};

const colorMap = {
    critical: "text-red-400 bg-red-500/10",
    warning: "text-yellow-400 bg-yellow-500/10",
    success: "text-green-400 bg-green-500/10",
    info: "text-blue-400 bg-blue-500/10",
};

export default function AlertsPanel({ alerts }) {
    const recent = alerts.slice(-8).reverse();

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Live Alerts</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{alerts.length} total events</p>
                </div>
                {alerts.some((a) => a.severity === "critical") && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 uppercase tracking-wider animate-pulse">
                        Active
                    </span>
                )}
            </div>
            <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                    {recent.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">No alerts yet</p>
                    )}
                    {recent.map((alert, idx) => {
                        const Icon = iconMap[alert.severity] || Info;
                        const colors = colorMap[alert.severity] || colorMap.info;
                        return (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                                <div className={`p-1.5 rounded-md ${colors}`}>
                                    <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground">{alert.message}</p>
                                    {alert.action && (
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{alert.action}</p>
                                    )}
                                    <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">{alert.time}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}