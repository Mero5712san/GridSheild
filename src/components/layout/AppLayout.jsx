import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function AppLayout() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // Close sidebar when route changes on mobile
    useEffect(() => {
        setIsOpen(false);
    }, [location]);

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden md:block fixed left-0 top-0 bottom-0 w-[220px] z-50">
                <Sidebar />
            </div>

            {/* Mobile Header with Menu Toggle */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border flex items-center px-4 z-40">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <button className="inline-flex items-center justify-center rounded-lg bg-secondary p-2 hover:bg-secondary/80 transition-colors">
                            <Menu className="w-5 h-5 text-foreground" />
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[220px] p-0">
                        <Sidebar />
                    </SheetContent>
                </Sheet>
                <h1 className="ml-4 text-lg font-bold text-foreground">GridShield</h1>
            </div>

            {/* Main Content */}
            <main className="md:ml-[220px] pt-16 md:pt-0 min-h-screen">
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}