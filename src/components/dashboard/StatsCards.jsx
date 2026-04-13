import { Zap, Activity, AlertTriangle, Shield } from "lucide-react";

const formatPower = (watts) => {
    if (watts >= 1000) return `${(watts / 1000).toFixed(1)} kW`;
    return `${watts} W`;
};

export default function StatsCards({ gridHealth }) {
    const cards = [
        {
            label: "Total Load",
            value: formatPower(gridHealth.totalLoad),
            sub: `${gridHealth.loadPercent}% capacity`,
            icon: Zap,
            color: gridHealth.loadPercent > 80 ? "red" : gridHealth.loadPercent > 60 ? "yellow" : "green",
        },
        {
            label: "Active Nodes",
            value: `${gridHealth.activeNodes}/${gridHealth.totalNodes}`,
            sub: `${gridHealth.totalNodes - gridHealth.activeNodes} disconnected`,
            icon: Activity,
            color: "blue",
        },
        {
            label: "Grid Health",
            value: `${gridHealth.healthScore}%`,
            sub: gridHealth.healthStatus,
            icon: Shield,
            color: gridHealth.healthScore > 80 ? "green" : gridHealth.healthScore > 50 ? "yellow" : "red",
        },
        {
            label: "Warnings",
            value: gridHealth.warningNodes + gridHealth.criticalNodes,
            sub: `${gridHealth.criticalNodes} critical`,
            icon: AlertTriangle,
            color: gridHealth.criticalNodes > 0 ? "red" : gridHealth.warningNodes > 0 ? "yellow" : "green",
        },
    ];

    const colorMap = {
        green: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30", glow: "glow-green" },
        yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30", glow: "glow-yellow" },
        red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", glow: "glow-red" },
        blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", glow: "glow-blue" },
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => {
                const c = colorMap[card.color];
                const Icon = card.icon;
                return (
                    <div
                        key={card.label}
                        className={`relative overflow-hidden rounded-xl border ${c.border} bg-card p-5 ${c.glow} transition-all duration-300`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {card.label}
                                </p>
                                <p className={`text-2xl font-bold mt-1 ${c.text}`}>{card.value}</p>
                                <p className="text-xs text-muted-foreground mt-1 capitalize">{card.sub}</p>
                            </div>
                            <div className={`p-2.5 rounded-lg ${c.bg}`}>
                                <Icon className={`w-5 h-5 ${c.text}`} />
                            </div>
                        </div>
                        <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${c.bg}`} />
                    </div>
                );
            })}
        </div>
    );
}