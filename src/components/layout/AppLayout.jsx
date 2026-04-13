import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-[220px] min-h-screen">
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}