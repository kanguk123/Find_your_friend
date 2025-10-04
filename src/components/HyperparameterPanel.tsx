"use client";

import { useState } from "react";
import { useStore } from "@/state/useStore";

export default function HyperparameterPanel() {
    const { hyperparameters, setHyperparameters } = useStore();
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="bg-black/60 border border-white/15 rounded-xl backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                    Hyperparameters
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
                <div className="px-4 pb-4 space-y-4">
                    {/* Learning Rate */}
                    <div>
                        <label className="flex justify-between text-xs text-white/70 mb-2">
                            <span>Learning Rate</span>
                            <span className="font-mono text-purple-400">{hyperparameters.learningRate}</span>
                        </label>
                        <input
                            type="range"
                            min="0.0001"
                            max="0.1"
                            step="0.0001"
                            value={hyperparameters.learningRate}
                            onChange={(e) => setHyperparameters({ learningRate: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    {/* Epochs */}
                    <div>
                        <label className="flex justify-between text-xs text-white/70 mb-2">
                            <span>Epochs</span>
                            <span className="font-mono text-purple-400">{hyperparameters.epochs}</span>
                        </label>
                        <input
                            type="range"
                            min="10"
                            max="500"
                            step="10"
                            value={hyperparameters.epochs}
                            onChange={(e) => setHyperparameters({ epochs: parseInt(e.target.value) })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    {/* Batch Size */}
                    <div>
                        <label className="flex justify-between text-xs text-white/70 mb-2">
                            <span>Batch Size</span>
                            <span className="font-mono text-purple-400">{hyperparameters.batchSize}</span>
                        </label>
                        <input
                            type="range"
                            min="8"
                            max="128"
                            step="8"
                            value={hyperparameters.batchSize}
                            onChange={(e) => setHyperparameters({ batchSize: parseInt(e.target.value) })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    {/* Hidden Layers */}
                    <div>
                        <label className="flex justify-between text-xs text-white/70 mb-2">
                            <span>Hidden Layers</span>
                            <span className="font-mono text-purple-400">{hyperparameters.hiddenLayers}</span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={hyperparameters.hiddenLayers}
                            onChange={(e) => setHyperparameters({ hiddenLayers: parseInt(e.target.value) })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    {/* Dropout */}
                    <div>
                        <label className="flex justify-between text-xs text-white/70 mb-2">
                            <span>Dropout Rate</span>
                            <span className="font-mono text-purple-400">{hyperparameters.dropout}</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="0.8"
                            step="0.05"
                            value={hyperparameters.dropout}
                            onChange={(e) => setHyperparameters({ dropout: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    {/* Momentum */}
                    <div>
                        <label className="flex justify-between text-xs text-white/70 mb-2">
                            <span>Momentum</span>
                            <span className="font-mono text-purple-400">{hyperparameters.momentum}</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={hyperparameters.momentum}
                            onChange={(e) => setHyperparameters({ momentum: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
