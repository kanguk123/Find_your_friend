"use client";

import { useState, useEffect } from "react";

export default function ModelAccuracy() {
    // 실제로는 백엔드에서 가져올 데이터
    const [accuracy, setAccuracy] = useState({
        training: 0.92,
        validation: 0.88,
        testing: 0.85,
    });

    return (
        <div className="bg-black/60 border border-white/15 rounded-xl p-4 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">
                Model Performance
            </h3>
            <div className="space-y-3">
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
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-xs text-white/50">Last Updated</div>
                <div className="text-sm text-white/80 font-mono">
                    {new Date().toLocaleString()}
                </div>
            </div>
        </div>
    );
}
