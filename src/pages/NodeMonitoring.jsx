import useSimulation from "@/hooks/useSimulation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const statusBadge = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    reduced: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    disconnected: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const priorityBadge = {
    high: "bg-red-500/10 text-red-400",
    medium: "bg-yellow-500/10 text-yellow-400",
    low: "bg-blue-500/10 text-blue-400",
};

export default function NodeMonitoring() {
    const { readings } = useSimulation();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Node Monitoring</h1>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Node</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Zone</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Voltage</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Power</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Load</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {readings.map((node) => (
                            <TableRow key={node.name} className="border-border">
                                <TableCell className="font-medium text-sm text-foreground">{node.name}</TableCell>
                                <TableCell className="text-xs text-muted-foreground capitalize">{node.type.replace("_", " ")}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${priorityBadge[node.priority]}`}>
                                        {node.priority}
                                    </span>
                                </TableCell>
                                <TableCell className="text-xs font-mono text-muted-foreground">{node.zone}</TableCell>
                                <TableCell className="text-xs font-mono text-foreground">{node.voltage} V</TableCell>
                                <TableCell className="text-xs font-mono text-foreground">{node.current} A</TableCell>
                                <TableCell className="text-xs font-mono text-foreground">{(node.power / 1000).toFixed(2)} kW</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16">
                                            <Progress
                                                value={Math.min(node.loadPercent, 100)}
                                                className="h-1.5 bg-secondary"
                                            />
                                        </div>
                                        <span className="text-xs font-mono text-muted-foreground">{node.loadPercent}%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${statusBadge[node.status]}`}>
                                        {node.status}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}