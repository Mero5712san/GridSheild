import { Download, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";

function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

function downloadReport(report, variant = "full") {
    if (!report) return;

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sectionMap = {
        full: report,
        load: report.loadAnalysis,
        substation: report.substationUtilization,
        recommendations: report.recommendationHistory,
        energy: report.energyConsumption,
        blackout: report.blackoutPreventionLog,
    };

    const payload = sectionMap[variant] ?? report;
    const suffix = variant === "full" ? "full" : variant;
    downloadBlob(JSON.stringify(payload, null, 2), `grid-report-${suffix}-${stamp}.json`, "application/json");
}

function downloadBillingCsv(billing) {
    if (!billing?.zones?.length) return;

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const lines = ["zone,energy_kwh,peak_demand_kw,estimated_cost"];
    billing.zones.forEach((zone) => {
        lines.push(`${zone.zone},${zone.energyKwh},${zone.peakDemandKw},${zone.estimatedCost}`);
    });

    downloadBlob(lines.join("\n"), `grid-billing-${stamp}.csv`, "text/csv;charset=utf-8");
}

export default function ReportingBillingPanel({ billing, report }) {
    const zones = billing?.zones || [];

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Reports and Billing Estimation</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Automated report generation with zone-wise energy usage and cost</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => downloadReport(report, "full")}>
                        <Download className="w-3.5 h-3.5" />
                        Full Report
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadReport(report, "recommendations")}>
                        Recommendations JSON
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadReport(report, "substation")}>
                        Substation JSON
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadBillingCsv(billing)}>
                        Billing CSV
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                    <p className="text-[11px] text-muted-foreground">Total Energy</p>
                    <p className="text-lg font-semibold text-foreground">{billing?.totalEnergyKwh ?? 0} kWh</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                    <p className="text-[11px] text-muted-foreground">Estimated Cost</p>
                    <p className="text-lg font-semibold text-foreground">{billing?.currency || "USD"} {billing?.totalEstimatedCost ?? 0}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                    <p className="text-[11px] text-muted-foreground">Report Status</p>
                    <p className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                        <ReceiptText className="w-4 h-4" /> Ready
                    </p>
                </div>
            </div>

            <div className="rounded-lg border border-border/60 overflow-hidden">
                <div className="grid grid-cols-4 bg-secondary/40 px-3 py-2 text-[11px] font-medium text-muted-foreground">
                    <span>Zone</span>
                    <span>Energy (kWh)</span>
                    <span>Peak Demand (kW)</span>
                    <span>Estimated Cost</span>
                </div>
                <div className="divide-y divide-border/60">
                    {zones.map((zone) => (
                        <div key={zone.zone} className="grid grid-cols-4 px-3 py-2 text-[11px] text-foreground">
                            <span>Zone {zone.zone}</span>
                            <span>{zone.energyKwh}</span>
                            <span>{zone.peakDemandKw}</span>
                            <span>{billing.currency} {zone.estimatedCost}</span>
                        </div>
                    ))}
                    {zones.length === 0 && <p className="px-3 py-3 text-[11px] text-muted-foreground">Billing data initializing...</p>}
                </div>
            </div>
        </div>
    );
}
