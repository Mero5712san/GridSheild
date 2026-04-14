import { Lightbulb, ShieldAlert } from "lucide-react";

const priorityClass = {
    high: "border-red-500/30 bg-red-500/10 text-red-300",
    medium: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    low: "border-blue-500/30 bg-blue-500/10 text-blue-300",
};

export default function RecommendationEnginePanel({ recommendations }) {
    const list = recommendations?.length ? recommendations : [];

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Smart Grid Recommendation Engine</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">AI-generated corrective actions to prevent micro-blackouts</p>
                </div>
                <div className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground font-mono">
                    {list.length} actions
                </div>
            </div>

            <div className="space-y-2.5 max-h-[320px] overflow-auto pr-1">
                {list.length === 0 && (
                    <div className="rounded-lg border border-border/60 p-4 text-xs text-muted-foreground">
                        Recommendation engine is warming up with live grid telemetry.
                    </div>
                )}
                {list.map((item, index) => (
                    <div key={`${item.type}-${index}`} className="rounded-lg border border-border/60 bg-secondary/40 p-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <Lightbulb className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                                <p className="text-xs font-medium text-foreground truncate">{item.message}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase border ${priorityClass[item.priority] || priorityClass.low}`}>
                                {item.priority}
                            </span>
                        </div>
                        {item.action && <p className="text-[11px] text-muted-foreground mt-2">{item.action}</p>}
                    </div>
                ))}
            </div>

            {list.some((item) => item.priority === "high") && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[11px] text-red-300">High-priority interventions available now.</span>
                </div>
            )}
        </div>
    );
}
