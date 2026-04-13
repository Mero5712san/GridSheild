import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from 'next-themes'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import GridView3D from './pages/GridView3D';
import NodeMonitoring from './pages/NodeMonitoring';
import AlertsLog from './pages/AlertsLog';
import ControlPanel from './pages/ControlPanel';

const AuthenticatedApp = () => {
    const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

    // Show loading spinner while checking app public settings or auth
    if (isLoadingPublicSettings || isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Handle authentication errors
    if (authError) {
        if (authError.type === 'user_not_registered') {
            return <UserNotRegisteredError />;
        } else if (authError.type === 'auth_required') {
            // Redirect to login automatically
            navigateToLogin();
            return null;
        }
    }

    // Render the main app
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/grid-3d" element={<GridView3D />} />
                <Route path="/nodes" element={<NodeMonitoring />} />
                <Route path="/alerts" element={<AlertsLog />} />
                <Route path="/control" element={<ControlPanel />} />
                <Route path="*" element={<PageNotFound />} />
            </Route>
        </Routes>
    );
};


function App() {

    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <AuthProvider>
                <QueryClientProvider client={queryClientInstance}>
                    <Router>
                        <AuthenticatedApp />
                    </Router>
                    <Toaster />
                </QueryClientProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App