import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const getBarColor = (loadPercent) => {
    if (loadPercent > 90) return "#ef4444";
    if (loadPercent > 75) return "#eab308";
    return "#22c55e";
};

export default function NodeComparisonChart({ readings }) {
    const data = readings.map((r) => ({
        name: r.name.replace("Street Lights ", "SL ").replace("Residential Block ", "Res ").replace("Transformer ", "T"),
        load: r.loadPercent,
        power: r.power,
    }));

    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Node Load Comparison</h3>
            <p className="text-xs text-muted-foreground mb-4">Load percentage per node</p>
            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: '#6b7280', fontSize: 9 }}
                            axisLine={false}
                            tickLine={false}
                            angle={-35}
                            textAnchor="end"
                        />
                        <YAxis
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 100]}
                            tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                            contentStyle={{ background: 'hsl(222 44% 8%)', border: '1px solid hsl(222 30% 16%)', borderRadius: 8, fontSize: 12 }}
                            formatter={(value) => [`${value}%`, 'Load']}
                        />
                        <Bar dataKey="load" radius={[4, 4, 0, 0]}>
                            {data.map((entry, idx) => (
                                <Cell key={idx} fill={getBarColor(entry.load)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}