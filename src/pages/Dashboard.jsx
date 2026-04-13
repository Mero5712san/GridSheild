import { useState } from "react";
import useSimulation from "@/hooks/useSimulation";
import StatsCards from "@/components/dashboard/StatsCards";
import LoadChart from "@/components/dashboard/LoadChart";
import PowerDistribution from "@/components/dashboard/PowerDistribution";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import NodeComparisonChart from "@/components/dashboard/NodeComparisonChart";
import { Activity, Clock } from "lucide-react";

export default function Dashboard() {
    const { readings, gridHealth, alerts, history } = useSimulation();

    if (!gridHealth) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Grid Dashboard</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                        <Activity className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs font-medium text-green-400">Live</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono">{new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <StatsCards gridHealth={gridHealth} />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <LoadChart history={history} />
                </div>
                <PowerDistribution readings={readings} />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <NodeComparisonChart readings={readings} />
                </div>
                <AlertsPanel alerts={alerts} />
            </div>
        </div>
    );
}