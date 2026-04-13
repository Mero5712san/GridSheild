import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#0ea5e9", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#06b6d4", "#f97316"];

const TYPE_LABELS = {
    power_station: "Power Station",
    transformer: "Transformer",
    residential: "Residential",
    industrial: "Industrial",
    hospital: "Hospital",
    street_light: "Street Lights",
    ev_charging: "EV Charging",
};

export default function PowerDistribution({ readings }) {
    const byType = {};
    readings.forEach((r) => {
        const label = TYPE_LABELS[r.type] || r.type;
        byType[label] = (byType[label] || 0) + r.power;
    });

    const data = Object.entries(byType).map(([name, value]) => ({ name, value }));

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Power Distribution</h3>
            <p className="text-xs text-muted-foreground mb-4">By node type</p>
            <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((_, idx) => (
                                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ background: 'hsl(222 44% 8%)', border: '1px solid hsl(222 30% 16%)', borderRadius: 8, fontSize: 12 }}
                            formatter={(value) => [`${(value / 1000).toFixed(1)} kW`]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                {data.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-muted-foreground truncate">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}