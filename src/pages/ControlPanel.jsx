import useSimulation from "@/hooks/useSimulation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Play, Pause, Zap, ShieldCheck, Power } from "lucide-react";

const priorityColors = {
    high: "border-red-500/30 bg-red-500/5",
    medium: "border-yellow-500/30 bg-yellow-500/5",
    low: "border-blue-500/30 bg-blue-500/5",
};

const priorityText = {
    high: "text-red-400",
    medium: "text-yellow-400",
    low: "text-blue-400",
};

export default function ControlPanel() {
    const {
        readings,
        overloadZone,
        disconnectedNodes,
        isRunning,
        pageFeeds,
        triggerOverload,
        clearOverload,
        toggleNode,
        toggleSimulation,
    } = useSimulation();

    const controlFeed = pageFeeds?.controlPanel;
    const feedReadings = controlFeed?.readings || readings;
    const feedOverloadZone = controlFeed?.overloadZone ?? overloadZone;
    const feedDisconnectedNodes = controlFeed?.disconnectedNodes || disconnectedNodes;
    const feedIsRunning = controlFeed?.isRunning ?? isRunning;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Control Panel</h1>
                </div>
                <Button
                    onClick={toggleSimulation}
                    variant={feedIsRunning ? "destructive" : "default"}
                    className="gap-2"
                >
                    {feedIsRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {feedIsRunning ? "Pause Simulation" : "Resume Simulation"}
                </Button>
            </div>

            {/* Overload simulation */}
            <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-1">Overload Simulation</h3>
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant={feedOverloadZone === 1 ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => (feedOverloadZone === 1 ? clearOverload() : triggerOverload(1))}
                        className="gap-2"
                    >
                        <Zap className="w-3.5 h-3.5" />
                        {feedOverloadZone === 1 ? "Stop Zone 1 Overload" : "Overload Zone 1"}
                    </Button>
                    <Button
                        variant={feedOverloadZone === 2 ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => (feedOverloadZone === 2 ? clearOverload() : triggerOverload(2))}
                        className="gap-2"
                    >
                        <Zap className="w-3.5 h-3.5" />
                        {feedOverloadZone === 2 ? "Stop Zone 2 Overload" : "Overload Zone 2"}
                    </Button>
                    {feedOverloadZone && (
                        <Button variant="ghost" size="sm" onClick={clearOverload} className="gap-2 text-green-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Clear All Overloads
                        </Button>
                    )}
                </div>
                {feedOverloadZone && (
                    <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-xs text-red-400 font-medium">
                            ⚡ Zone {feedOverloadZone} overload active — AI prevention system engaged
                        </p>
                    </div>
                )}
            </div>

            {/* Node controls */}
            <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-1">Node Controls</h3>
                <p className="text-xs text-muted-foreground mb-4">Manually enable or disable individual grid nodes</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {feedReadings.map((node) => {
                        const isDisconnected = feedDisconnectedNodes.includes(node.name);
                        return (
                            <div
                                key={node.name}
                                className={`rounded-lg border p-4 transition-all ${isDisconnected
                                    ? "border-gray-500/30 bg-gray-500/5 opacity-60"
                                    : priorityColors[node.priority]
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Power className={`w-4 h-4 ${isDisconnected ? "text-gray-400" : priorityText[node.priority]}`} />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{node.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[10px] uppercase font-semibold ${priorityText[node.priority]}`}>
                                                    {node.priority}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">Zone {node.zone}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={!isDisconnected}
                                        onCheckedChange={() => toggleNode(node.name)}
                                    />
                                </div>
                                {!isDisconnected && (
                                    <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-mono text-muted-foreground">
                                        <span>{node.voltage}V</span>
                                        <span>{node.current}A</span>
                                        <span>{(node.power / 1000).toFixed(1)}kW</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}