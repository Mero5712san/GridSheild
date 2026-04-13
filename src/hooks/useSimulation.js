import { useSyncExternalStore } from "react";
import {
    subscribe,
    getSnapshot,
    triggerInstability,
    triggerOverload,
    clearOverload,
    toggleNode,
    toggleSimulation,
} from "@/lib/simulationClient";

export default function useSimulation() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    return {
        ...snapshot,
        triggerInstability,
        triggerOverload,
        clearOverload,
        toggleNode,
        toggleSimulation,
    };
}
