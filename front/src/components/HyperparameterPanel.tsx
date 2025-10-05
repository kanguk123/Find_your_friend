"use client";

import { useState } from "react";
import { useStore } from "@/state/useStore";

type Props = {
  isExpanded: boolean;
  onToggle: () => void;
};

export default function HyperparameterPanel({ isExpanded, onToggle }: Props) {
  const { hyperparameters, setHyperparameters } = useStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 실제로는 API 호출로 하이퍼파라미터를 서버에 저장
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 시뮬레이션

      setSaved(true);
      setTimeout(() => setSaved(false), 2000); // 2초 후 상태 초기화
    } catch (error) {
      console.error("Failed to save hyperparameters:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-black/60 border border-white/15 rounded-xl backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          Hyperparameters
        </h3>
        <svg
          className={`w-5 h-5 text-white/70 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 max-h-48 overflow-y-auto">
          {/* Save Button */}
          <div className="pb-3 border-b border-white/10">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                saved
                  ? "bg-green-500/20 text-green-400 border border-green-400/50"
                  : isSaving
                  ? "bg-gray-500/20 text-gray-400 border border-gray-400/50 cursor-not-allowed"
                  : "bg-purple-500/20 text-purple-400 border border-purple-400/50 hover:bg-purple-500/30"
              }`}
            >
              {saved ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Saved!
                </div>
              ) : isSaving ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Save Hyperparameters
                </div>
              )}
            </button>
          </div>

          {/* Learning Rate */}
          <div>
            <label className="flex justify-between text-xs text-white/70 mb-2">
              <span>Learning Rate</span>
              <span className="font-mono text-purple-400">
                {hyperparameters.learningRate}
              </span>
            </label>
            <input
              type="range"
              min="0.0001"
              max="0.1"
              step="0.0001"
              value={hyperparameters.learningRate}
              onChange={(e) =>
                setHyperparameters({ learningRate: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Epochs */}
          <div>
            <label className="flex justify-between text-xs text-white/70 mb-2">
              <span>Epochs</span>
              <span className="font-mono text-purple-400">
                {hyperparameters.epochs}
              </span>
            </label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={hyperparameters.epochs}
              onChange={(e) =>
                setHyperparameters({ epochs: parseInt(e.target.value) })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Batch Size */}
          <div>
            <label className="flex justify-between text-xs text-white/70 mb-2">
              <span>Batch Size</span>
              <span className="font-mono text-purple-400">
                {hyperparameters.batchSize}
              </span>
            </label>
            <input
              type="range"
              min="8"
              max="128"
              step="8"
              value={hyperparameters.batchSize}
              onChange={(e) =>
                setHyperparameters({ batchSize: parseInt(e.target.value) })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Hidden Layers */}
          <div>
            <label className="flex justify-between text-xs text-white/70 mb-2">
              <span>Hidden Layers</span>
              <span className="font-mono text-purple-400">
                {hyperparameters.hiddenLayers}
              </span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={hyperparameters.hiddenLayers}
              onChange={(e) =>
                setHyperparameters({ hiddenLayers: parseInt(e.target.value) })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Dropout */}
          <div>
            <label className="flex justify-between text-xs text-white/70 mb-2">
              <span>Dropout Rate</span>
              <span className="font-mono text-purple-400">
                {hyperparameters.dropout}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={hyperparameters.dropout}
              onChange={(e) =>
                setHyperparameters({ dropout: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Momentum */}
          <div>
            <label className="flex justify-between text-xs text-white/70 mb-2">
              <span>Momentum</span>
              <span className="font-mono text-purple-400">
                {hyperparameters.momentum}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={hyperparameters.momentum}
              onChange={(e) =>
                setHyperparameters({ momentum: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
