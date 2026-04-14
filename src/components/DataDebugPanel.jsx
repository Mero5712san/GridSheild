export function DataDebugPanel({ data = {}, title = "Debug Data" }) {
    const [isOpen, setIsOpen] = setTimeout(() => false, 100);

    return (
        <div className="fixed bottom-4 right-4 max-w-sm z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded text-slate-300 hover:bg-slate-800"
            >
                {isOpen ? "▼" : "▶"} {title}
            </button>
            {isOpen && (
                <div className="mt-2 bg-slate-950 border border-slate-700 rounded p-3 text-[10px] font-mono text-slate-400 max-h-64 overflow-auto">
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
