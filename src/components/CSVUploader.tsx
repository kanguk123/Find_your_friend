"use client";

import { useRef, useState } from "react";
import { useStore, type Planet } from "@/state/useStore";

export default function CSVUploader() {
    const { setPlanets } = useStore();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        try {
            const text = await file.text();
            const lines = text.split("\n").filter((line) => line.trim());
            const headers = lines[0].split(",").map((h) => h.trim());

            const planets: Planet[] = lines.slice(1).map((line, idx) => {
                const values = line.split(",").map((v) => v.trim());
                const planet: Planet = {
                    id: `planet-${idx}`,
                    name: values[headers.indexOf("name")] || `Planet ${idx}`,
                    ra: parseFloat(values[headers.indexOf("ra")] || "0"),
                    dec: parseFloat(values[headers.indexOf("dec")] || "0"),
                    teq: parseFloat(values[headers.indexOf("teq")] || "0"),
                    score: parseFloat(values[headers.indexOf("score")] || "0"),
                    features: {},
                };

                // Expert 모드용 피처들
                const featureKeys = headers.filter(
                    (h) => !["id", "name", "ra", "dec", "teq", "score"].includes(h)
                );
                featureKeys.forEach((key) => {
                    const value = parseFloat(values[headers.indexOf(key)]);
                    if (!isNaN(value) && planet.features) {
                        planet.features[key] = value;
                    }
                });

                return planet;
            });

            setPlanets(planets);
            alert(`${planets.length} planets loaded successfully!`);
        } catch (error) {
            console.error("Error parsing CSV:", error);
            alert("Error parsing CSV file. Please check the format.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
            />
            <label
                htmlFor="csv-upload"
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                    isUploading
                        ? "bg-gray-500/20 border-gray-400/50 cursor-not-allowed"
                        : "bg-purple-500/20 border-purple-400/50 hover:bg-purple-500/30 text-purple-300"
                }`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                </svg>
                <span className="text-sm font-medium">
                    {isUploading ? "Uploading..." : "Upload CSV"}
                </span>
            </label>
            <p className="text-xs text-white/50 px-1">
                CSV format: name, ra, dec, teq, score, [features...]
            </p>
        </div>
    );
}
