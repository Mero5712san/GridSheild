import useSimulation from "@/hooks/useSimulation";
import RecommendationEnginePanel from "@/components/dashboard/RecommendationEnginePanel";
import OperationsIntelligencePanel from "@/components/dashboard/OperationsIntelligencePanel";
import { Bot } from "lucide-react";

export default function RecommendationCenter() {
    const {
        recommendationEngine,
        substationMonitoring,
        sensorOptimization,
        loadFluctuationPrediction,
        componentHealth,
        infrastructureRecommendations,
        energyFlow,
        stabilityControl,
    } = useSimulation();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Recommendation Center</h1>
                    <p className="text-sm text-muted-foreground mt-1">AI decision support for proactive micro-blackout prevention</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">AI Engine Active</span>
                </div>
            </div>

            <RecommendationEnginePanel recommendations={recommendationEngine} />

            <OperationsIntelligencePanel
                substationMonitoring={substationMonitoring}
                sensorOptimization={sensorOptimization}
                loadPrediction={loadFluctuationPrediction}
                componentHealth={componentHealth}
                infrastructureRecommendations={infrastructureRecommendations}
                energyFlow={energyFlow}
                stabilityControl={stabilityControl}
            />
        </div>
    );
}
