"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function TrainingPage() {
    const [isTraining, setIsTraining] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadSample = () => {
        const sampleCSV = `name,ra,dec,teq,score,mass,radius,orbital_period,stellar_flux
Kepler-186f,346.0,44.5,188,0.85,1.17,1.11,129.9,0.29
Proxima Centauri b,217.5,-62.7,234,0.75,1.27,1.07,11.2,0.65
TRAPPIST-1e,346.6,-5.0,251,0.92,0.62,0.92,6.1,0.66
Kepler-452b,294.2,44.3,265,0.68,5.0,1.6,384.8,1.1
LHS 1140 b,10.5,-15.0,230,0.88,6.6,1.4,24.7,0.46`;

        const blob = new Blob([sampleCSV], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "exoplanet_sample.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsTraining(true);
        setProgress(0);
        setLogs([]);

        // 시뮬레이션: 실제로는 백엔드 API 호출
        const steps = [
            "Loading dataset...",
            "Preprocessing data...",
            "Splitting train/validation/test sets...",
            "Initializing neural network...",
            "Training epoch 1/100...",
            "Training epoch 25/100...",
            "Training epoch 50/100...",
            "Training epoch 75/100...",
            "Training epoch 100/100...",
            "Evaluating model...",
            "Saving model weights...",
            "Training completed!",
        ];

        for (let i = 0; i < steps.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${steps[i]}`]);
            setProgress(((i + 1) / steps.length) * 100);
        }

        setIsTraining(false);
        alert("Model training completed successfully!");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/40 backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Model Training</h1>
                            <p className="text-xs text-white/60">Train custom exoplanet detection model</p>
                        </div>
                    </div>
                    <Link
                        href="/"
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                        ← Back to Explorer
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Panel - Upload & Controls */}
                    <div className="space-y-6">
                        {/* Sample Download */}
                        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <h2 className="text-lg font-semibold text-white mb-4">1. Download Sample Dataset</h2>
                            <p className="text-sm text-white/60 mb-4">
                                Start with our sample CSV file to understand the required format.
                            </p>
                            <button
                                onClick={handleDownloadSample}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 rounded-lg text-blue-300 font-medium transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download Sample CSV
                            </button>
                        </div>

                        {/* Upload Training Data */}
                        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <h2 className="text-lg font-semibold text-white mb-4">2. Upload Training Data</h2>
                            <p className="text-sm text-white/60 mb-4">
                                Upload your CSV file with exoplanet features to train the model.
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                disabled={isTraining}
                                className="hidden"
                                id="training-upload"
                            />
                            <label
                                htmlFor="training-upload"
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                                    isTraining
                                        ? "bg-gray-500/20 border border-gray-400/50 text-gray-400 cursor-not-allowed"
                                        : "bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 text-purple-300"
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                {isTraining ? "Training in Progress..." : "Upload & Train"}
                            </label>
                        </div>

                        {/* Training Progress */}
                        {isTraining && (
                            <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                                <h2 className="text-lg font-semibold text-white mb-4">Training Progress</h2>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-white/70">
                                        <span>Progress</span>
                                        <span className="font-mono text-purple-400">{progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Logs */}
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-lg font-semibold text-white mb-4">Training Logs</h2>
                        <div className="bg-black/60 border border-white/5 rounded-lg p-4 h-[500px] overflow-y-auto font-mono text-xs text-green-400">
                            {logs.length === 0 ? (
                                <div className="text-white/40 text-center py-8">
                                    Upload a dataset to start training...
                                </div>
                            ) : (
                                logs.map((log, idx) => (
                                    <div key={idx} className="mb-1">
                                        {log}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="mt-8 bg-blue-500/10 border border-blue-400/20 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-blue-300 mb-2">CSV Format Requirements</h3>
                    <p className="text-sm text-white/70">
                        Your CSV must include: <code className="text-blue-300">name, ra, dec, teq, score</code> (required)
                        + additional feature columns like <code className="text-blue-300">mass, radius, orbital_period, stellar_flux</code> (optional)
                    </p>
                </div>
            </div>
        </div>
    );
}
