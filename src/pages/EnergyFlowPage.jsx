import useSimulation from "@/hooks/useSimulation";
import { useState } from "react";
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
    Sankey,
} from "recharts";

const colorLabel = {
    green: "Normal Flow",
    yellow: "High Load",
    red: "Overload Nodes",
    blue: "Reduced Load",
};

export default function EnergyFlowPage() {
    const { energyFlow, moduleTrends, alerts } = useSimulation();
    const [zoneFilter, setZoneFilter] = useState("all");
    const summary = energyFlow?.summary || { green: 0, yellow: 0, red: 0, blue: 0 };
    const allFlows = energyFlow?.flows || [];
    const flows = zoneFilter === "all" ? allFlows : allFlows.filter((flow) => String(flow.zone) === zoneFilter);

    console.log("🌊 EnergyFlow:", {
        energyFlow,
        flowsCount: allFlows.length,
        summary,
        energyFlowHistoryLength: moduleTrends?.energyFlowHistory?.length || 0,
    });

    const summaryData = [
        { type: "green", count: summary.green },
        { type: "yellow", count: summary.yellow },
        { type: "red", count: summary.red },
        { type: "blue", count: summary.blue },
    ];

    const zoneCounts = flows.reduce((acc, flow) => {
        const key = `Zone ${flow.zone}`;
        if (!acc[key]) acc[key] = 0;
        acc[key] += 1;
        return acc;
    }, {});

    const sankeyNodes = [
        { name: "Generation" },
        { name: "Zone 1" },
        { name: "Zone 2" },
        { name: "Zone 3" },
        { name: "Zone 4" },
        { name: "Normal" },
        { name: "High" },
        { name: "Overload" },
        { name: "Reduced" },
    ];

    const zoneEntries = ["Zone 1", "Zone 2", "Zone 3", "Zone 4"];
    const zoneLinks = zoneEntries.map((zone, idx) => ({ source: 0, target: idx + 1, value: zoneCounts[zone] || 1 }));
    const stateLinks = [
        { source: 1, target: 5, value: Math.max(1, summary.green) },
        { source: 2, target: 6, value: Math.max(1, summary.yellow) },
        { source: 3, target: 7, value: Math.max(1, summary.red) },
        { source: 4, target: 8, value: Math.max(1, summary.blue) },
    ];

    const flowAlerts = alerts.filter((a) => /load|flow|critical|overload/i.test(a.message)).slice(-6).reverse();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Energy Flow Visualization</h1>
                <p className="text-sm text-muted-foreground mt-1">Live flow classification, distribution tracking, and power transfer pathways</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {summaryData.map((item) => (
                    <div key={item.type} className="rounded-xl border border-border bg-card p-4">
                        <p className="text-[11px] text-muted-foreground uppercase">{colorLabel[item.type]}</p>
                        <p className="text-2xl font-semibold mt-1 text-foreground">{item.count}</p>
                    </div>
                ))}
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-[10px] text-slate-400 md:col-span-4">
                    Data check: Flows={allFlows.length} | Summary={JSON.stringify(summary)} | History={moduleTrends?.energyFlowHistory?.length || 0}
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Flow controls</p>
                <select
                    className="bg-secondary border border-border rounded-md px-2 py-1 text-xs"
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter(e.target.value)}
                >
                    <option value="all">All zones</option>
                    <option value="1">Zone 1</option>
                    <option value="2">Zone 2</option>
                    <option value="3">Zone 3</option>
                    <option value="4">Zone 4</option>
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* <Panel title="Flow Count Chart">
                    <ChartBox>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summaryData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                <XAxis dataKey="type" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#0ea5e9" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartBox>
                </Panel> */}

                <Panel title="Real-Time Flow Trend">
                    <ChartBox>
                        {(moduleTrends?.energyFlowHistory || []).length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                                Loading chart data...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={moduleTrends?.energyFlowHistory || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                                    <XAxis dataKey="time" tick={false} />
                                    <YAxis />
                                    <Tooltip />
                                    <Line dataKey="green" stroke="#22c55e" dot={false} />
                                    <Line dataKey="yellow" stroke="#eab308" dot={false} />
                                    <Line dataKey="red" stroke="#ef4444" dot={false} />
                                    <Line dataKey="blue" stroke="#3b82f6" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </ChartBox>
                </Panel>

                <Panel title="Power Flow Sankey">
                    <ChartBox>
                        <ResponsiveContainer width="100%" height="100%">
                            <Sankey data={{ nodes: sankeyNodes, links: [...zoneLinks, ...stateLinks] }} nodePadding={24} />
                        </ResponsiveContainer>
                    </ChartBox>
                </Panel>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">Flow Table</p>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-secondary/40 text-xs text-muted-foreground">
                        <tr>
                            <th className="text-left p-3">Node</th>
                            <th className="text-left p-3">Zone</th>
                            <th className="text-left p-3">Flow Color</th>
                            <th className="text-left p-3">Intensity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {flows.map((flow) => (
                            <tr key={flow.node} className="border-t border-border/60">
                                <td className="p-3">{flow.node}</td>
                                <td className="p-3">Zone {flow.zone}</td>
                                <td className="p-3 capitalize">{flow.flowColor}</td>
                                <td className="p-3">{flow.intensity}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Flow Alerts">
                    <div className="space-y-2 text-xs">
                        {flowAlerts.length === 0 && <p className="text-muted-foreground">No energy-flow alerts in this cycle.</p>}
                        {flowAlerts.map((alert, idx) => (
                            <div key={idx} className="rounded-md border border-border/60 bg-secondary/40 p-2.5">
                                <p className="text-foreground font-medium">{alert.message}</p>
                                <p className="text-muted-foreground mt-1">{alert.action}</p>
                            </div>
                        ))}
                    </div>
                </Panel>
                <Panel title="Insights">
                    <ul className="space-y-2 text-xs text-muted-foreground">
                        <li>Red channels indicate overload path concentration and require immediate balancing.</li>
                        <li>Blue channels indicate active load-reduction actions are working.</li>
                        <li>Sankey flow indicates transfer pressure from generation to zone endpoints.</li>
                    </ul>
                </Panel>
            </div>
        </div>
    );
}

function Panel({ title, children }) {
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
            {children}
        </div>
    );
}

function ChartBox({ children }) {
    return <div className="h-[240px]">{children}</div>;
}
