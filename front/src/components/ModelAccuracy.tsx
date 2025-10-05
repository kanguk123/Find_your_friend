"use client";

type Props = {
  isExpanded: boolean;
  onToggle: () => void;
};

export default function ModelAccuracy({ isExpanded, onToggle }: Props) {
  // 실제로는 백엔드에서 가져올 데이터
  const accuracy = {
    training: 0.92,
    validation: 0.88,
    testing: 0.85,
  };

  const performance = {
    inferenceTime: 0.045, // 초 단위
    trainingTime: 1247, // 초 단위
    epochs: 100,
    batchSize: 32,
  };

  return (
    <div className="bg-black/60 border border-white/15 rounded-xl backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          Model Performance
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
          {Object.entries(accuracy).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span className="capitalize">{key} Accuracy</span>
                <span className="font-mono text-green-400">
                  {(value * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${value * 100}%` }}
                />
              </div>
            </div>
          ))}

          {/* Performance Metrics */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <h4 className="text-xs font-semibold text-white/80 mb-3 uppercase tracking-wider">
              Performance Metrics
            </h4>

            {/* Inference Time */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Inference Time</span>
                <span className="font-mono text-blue-400">
                  {performance.inferenceTime < 1
                    ? `${(performance.inferenceTime * 1000).toFixed(1)}ms`
                    : `${performance.inferenceTime.toFixed(3)}s`}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      performance.inferenceTime * 1000,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Training Time */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Training Time</span>
                <span className="font-mono text-purple-400">
                  {performance.trainingTime < 60
                    ? `${performance.trainingTime.toFixed(1)}s`
                    : performance.trainingTime < 3600
                    ? `${(performance.trainingTime / 60).toFixed(1)}m`
                    : `${(performance.trainingTime / 3600).toFixed(1)}h`}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (performance.trainingTime / 3600) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-white/50">Epochs</div>
                <div className="font-mono text-orange-400">
                  {performance.epochs}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-white/50">Batch Size</div>
                <div className="font-mono text-orange-400">
                  {performance.batchSize}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10">
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
