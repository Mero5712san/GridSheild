import useSimulation from "@/hooks/useSimulation";
import GridScene from "@/components/grid3d/GridScene";
import { Siren } from "lucide-react";

/**
 * @typedef {{
 *   name: string,
 *   status: string,
 *   loadPercent: number,
 *   voltage: number,
 *   current: number,
 *   power: number,
 * }} GridReading
 */

/** @type {Record<string, string>} */
const statusColors = {
    active: "bg-green-500",
    warning: "bg-yellow-500",
    critical: "bg-red-500",
    reduced: "bg-blue-500",
    disconnected: "bg-gray-500",
};

const statusLegend = [
    ["active", "Normal"],
    ["warning", "High Load"],
    ["critical", "Overload Risk"],
    ["reduced", "Load Reduced"],
    ["disconnected", "Disconnected"],
];

export default function GridView3D() {
    const { readings, gridHealth, triggerInstability, instabilityActive } = useSimulation();
    const healthBorderClass = !gridHealth
        ? "border-border"
        : gridHealth.healthScore >= 85
            ? "border-green-500"
            : gridHealth.healthScore >= 70
                ? "border-yellow-400"
                : gridHealth.healthScore >= 50
                    ? "border-orange-500"
                    : "border-red-500";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Stimulation</h1>
                <button
                    type="button"
                    onClick={triggerInstability}
                    title="Trigger grid instability"
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors ${instabilityActive ? "bg-red-600 hover:bg-red-600/90" : "bg-zinc-800 hover:bg-zinc-700"}`}
                >
                    <Siren className="h-4 w-4" />
                </button>
            </div>

            <div className={`relative overflow-hidden rounded-xl border-2 bg-card ${healthBorderClass}`} style={{ height: "500px" }}>
                <GridScene readings={readings} />

                <div className="absolute inset-x-0 bottom-0 m-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
                    <div className="flex items-center justify-evenly whitespace-nowrap px-0 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status Legend</p>
                        {statusLegend.map(([key, label]) => (
                            <div key={key} className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${statusColors[key]}`} />
                                <span className="text-xs text-muted-foreground">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {readings.map((/** @type {GridReading} */ node) => (
                    <div key={node.name} className="space-y-2 rounded-lg border border-border bg-card p-3">
                        <div className="flex items-center justify-between">
                            <span className={`h-2 w-2 rounded-full ${statusColors[node.status]}`} />
                            <span className="text-[10px] font-mono text-muted-foreground">{node.loadPercent}%</span>
                        </div>
                        <p className="truncate text-xs font-semibold text-foreground">{node.name}</p>
                        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-muted-foreground">
                            <span>{node.voltage}V</span>
                            <span>{node.current}A</span>
                            <span>{(node.power / 1000).toFixed(1)}kW</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}