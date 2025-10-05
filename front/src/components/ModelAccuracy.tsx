"use client";

export default function ModelAccuracy() {
  // 모델 성능 지표 - precision, recall, f1-score만 표시
  const modelMetrics = {
    precision: 0.94,
    recall: 0.93,
    f1Score: 0.93,
  };

  return (
    <div className="bg-black/60 border border-white/15 rounded-xl backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="w-full flex items-center justify-between p-4">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          Model Performance
        </h3>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-3 max-h-48 overflow-y-auto">
          {/* 모델 성능 지표 - precision, recall, f1-score */}
          {Object.entries(modelMetrics).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span className="capitalize font-semibold">{key}</span>
                <span className="font-mono text-green-400">
                  {value.toFixed(2)}
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
      </div>
    </div>
  );
}
