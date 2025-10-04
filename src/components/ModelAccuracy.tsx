"use client";

import { useState, useEffect } from "react";

export default function ModelAccuracy() {
    const [isExpanded, setIsExpanded] = useState(false);
    // 실제로는 백엔드에서 가져올 데이터
    const [accuracy, setAccuracy] = useState({
        training: 0.92,
        validation: 0.88,
        testing: 0.85,
    });

    return (
        <div className="bg-black/60 border border-white/15 rounded-xl backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                    Model Performance
                </h3>
                <svg
                    className={`w-5 h-5 text-white/70 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-3 max-h-96 overflow-y-auto">
                    {Object.entries(accuracy).map(([key, value]) => (
                        <div key={key}>
                            <div className="flex justify-between text-xs text-white/70 mb-1">
                                <span className="capitalize">{key} Accuracy</span>
                                <span className="font-mono text-green-400">{(value * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${value * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="text-xs text-white/50">Last Updated</div>
                        <div className="text-sm text-white/80 font-mono">
                            {new Date().toLocaleString()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
