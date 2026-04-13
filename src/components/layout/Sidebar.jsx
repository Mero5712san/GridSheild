import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { LayoutDashboard, Activity, AlertTriangle, Settings, Zap, Globe } from "lucide-react";
import useSimulation from "@/hooks/useSimulation";

const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/grid-3d", label: "Stimulate", icon: Globe },
    { path: "/nodes", label: "Node Monitor", icon: Activity },
    { path: "/alerts", label: "Alerts Log", icon: AlertTriangle },
    { path: "/control", label: "Control Panel", icon: Settings },
];

export default function Sidebar() {
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const { connectionStatus } = useSimulation();

    const appStatus = connectionStatus === "connected"
        ? { label: "Online", dotClass: "bg-green-500 animate-pulse-glow" }
        : connectionStatus === "connecting"
            ? { label: "Connecting", dotClass: "bg-amber-400 animate-pulse" }
            : { label: "Offline", dotClass: "bg-red-500" };

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-sidebar border-r border-sidebar-border flex flex-col z-50">
            <div className="px-5 py-5 border-b border-sidebar-border">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-foreground tracking-tight">GridShield</h1>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="px-4 py-4 border-t border-sidebar-border space-y-3">
                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                    {theme === 'dark' ? (
                        <Sun className="w-3.5 h-3.5 text-yellow-400" />
                    ) : (
                        <Moon className="w-3.5 h-3.5 text-primary" />
                    )}
                    <span className="text-xs font-medium text-muted-foreground">
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </span>
                </button>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${appStatus.dotClass}`} />
                    <span className="text-xs text-muted-foreground font-mono">{appStatus.label}</span>
                </div>
            </div>
        </aside>
    );
}