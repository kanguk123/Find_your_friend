"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function TrainingPage() {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadSample = () => {
    // NASA Kepler 데이터셋 형식 (122 features)
    const sampleCSV = `rowid,ra,dec,koi_period,koi_period_err1,koi_period_err2,koi_time0bk,koi_time0bk_err1,koi_time0bk_err2,koi_time0,koi_time0_err1,koi_time0_err2,koi_impact,koi_impact_err1,koi_impact_err2,koi_duration,koi_duration_err1,koi_duration_err2,koi_depth,koi_depth_err1,koi_depth_err2,koi_ror,koi_ror_err1,koi_ror_err2,koi_srho,koi_srho_err1,koi_srho_err2,koi_sma,koi_incl,koi_teq,koi_dor,koi_dor_err1,koi_dor_err2,koi_ldm_coeff2,koi_ldm_coeff1,koi_max_sngle_ev,koi_max_mult_ev,koi_model_snr,koi_num_transits,koi_steff,koi_steff_err1,koi_steff_err2,koi_slogg,koi_slogg_err1,koi_slogg_err2,koi_smet,koi_smet_err1,koi_smet_err2,koi_srad,koi_srad_err1,koi_srad_err2,koi_smass,koi_smass_err1,koi_smass_err2,pl_rade,pl_radeerr1,pl_radeerr2,pl_radj,pl_radjerr1,pl_radjerr2,pl_tranmid,pl_tranmiderr1,pl_tranmiderr2,pl_imppar,pl_impparerr1,pl_impparerr2,pl_trandep,pl_trandeperr1,pl_trandeperr2,pl_ratror,pl_ratrorerr1,pl_ratrorerr2,st_teff,st_tefferr1,st_tefferr2,st_rad,st_raderr1,st_raderr2,st_mass,st_masserr1,st_masserr2,st_met,st_meterr1,st_meterr2,st_logg,st_loggerr1,st_loggerr2,st_dens,st_denserr1,st_denserr2,pl_eqt,st_teff.1,st_tefferr1.1,st_tefferr2.1,st_logg.1,st_loggerr1.1,st_loggerr2.1,pl_trandurherr1,pl_trandurherr2,st_dist,st_disterr1,st_disterr2,st_rad.1,st_raderr1.1,st_raderr2.1,pl_insol,st_pmdec,st_pmdecerr1,st_pmdecerr2,st_rad.2,st_raderr1.2,st_raderr2.2,st_pmra,st_pmraerr1,st_pmraerr2,pl_orbper,pl_orbpererr1,pl_orbpererr2,st_tmag,st_tmagerr1,st_tmagerr2,pl_trandurherr3,pl_trandurh
1,291.93423,48.141651,9.48803557,2.78e-05,-2.78e-05,170.53875,0.00216,-0.00216,2455003.539,0.00216,-0.00216,0.146,0.318,-0.146,2.9575,0.0819,-0.0819,616.0,19.5,-19.5,0.022344,0.000832,-0.000528,3.20796,0.33173,-1.09986,0.0853,89.66,793.0,24.81,2.6,-2.6,0.2291,0.4603,5.135849,28.47082,35.8,142.0,5455.0,81.0,-81.0,4.467,0.064,-0.096,0.14,0.15,-0.15,0.927,0.105,-0.061,0.919,0.052,-0.046,9.75677598697376,1.9111994289568224,-1.8865112967923687,0.755270481752285,0.25629403435746445,-0.24826669117769312,2458821.0386662656,0.017478979745478275,-0.017773547748461675,0.4381592632639355,0.1915559198156682,-0.19947930322580645,6488.647363468292,421.8151631222811,-421.81511935972554,0.06149085530856006,0.015048973228648026,-0.01324384852546917,5609.113771812081,180.5956894168621,-180.48960496684688,1.1759922638100155,0.11795472424429365,-0.12180580160692211,0.8730237706945765,0.11331790955806784,-0.09072538762886598,-0.029684864546525323,0.09758986202759448,-0.09809736052789442,4.338743296010436,0.14819090928420497,-0.1487003070655045,4.692353332624867,0.5478327806122449,-0.5156926466836735,1282.5539722337169,5791.63068718493,205.61936297439445,-205.61936297439445,4.30529042671343,0.17485606393442624,-0.17485606393442624,0.36256119457455116,-0.36256119457455116,478.2956283097274,19.538125880434784,-19.538125880434784,1.4038391917547275,0.0744430372320028,-0.0744430372320028,2245.7707804001466,-9.180085789821547,0.22283159286186385,-0.22283159286186385,1.4038391917547275,0.0744430372320028,-0.0744430372320028,-0.5760165234633179,0.22882524785194977,-0.22882524785194977,17.74653113644626,0.0003098854915433403,-0.0003098854915433403,11.563821223795298,0.009960774126509937,-0.009960774126509937,-16.04035411784062,3.0592803569944147`;

    const blob = new Blob([sampleCSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "planet_sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 이전 다운로드 URL 정리
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    setIsTraining(true);
    setProgress(0);
    setLogs([]);

    const addLog = (message: string) => {
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ${message}`,
      ]);
    };

    try {
      addLog(`📁 Uploading file: ${file.name}`);
      setProgress(10);

      // FormData 준비
      const formData = new FormData();
      formData.append("file", file);

      addLog("🚀 Sending to AI model...");
      setProgress(20);

      // 백엔드 API 호출
      const response = await fetch("/api/upload/identify-planets", {
        method: "POST",
        body: formData,
      });

      setProgress(60);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      addLog("✅ AI prediction completed!");
      setProgress(80);

      // CSV 파일 다운로드 준비
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const filename = `planet_predictions_${file.name}`;

      setDownloadUrl(url);
      setDownloadFilename(filename);

      addLog(`💾 Labeled CSV ready for download: ${filename}`);
      addLog("✨ Processing completed successfully!");
      setProgress(100);

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      console.error("Upload error:", error);
      alert("Failed to process file. Please check the console for details.");
    } finally {
      setIsTraining(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownloadPredictions = () => {
    if (!downloadUrl) return;

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = downloadFilename;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-white">
                Planet Identify
              </h1>
              <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">
                AI-powered exoplanet classification
              </p>
            </div>
          </div>
          <Link
            href="/?mode=expert"
            className="px-2 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-xs sm:text-sm font-medium transition-colors"
          >
            <span className="hidden sm:inline">← Back to Expert Mode</span>
            <span className="sm:hidden">← Back</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Left Panel - Upload & Controls */}
          <div className="space-y-4 sm:space-y-6">
            {/* Sample Download */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                1. Download Sample Dataset
              </h2>
              <p className="text-xs sm:text-sm text-white/60 mb-3 sm:mb-4">
                Start with our sample CSV file to understand the required
                format.
              </p>
              <button
                onClick={handleDownloadSample}
                className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 rounded-lg text-blue-300 text-sm sm:text-base font-medium transition-colors"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download Sample CSV
              </button>
            </div>

            {/* Planet Identify */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-white mb-4">
                2. Planet Identify
              </h2>
              <p className="text-sm text-white/60 mb-4">
                Upload your CSV file with planet data to get AI predictions.
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
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {isTraining ? "Processing..." : "Planet Identify"}
              </label>
            </div>

            {/* Processing Progress */}
            {isTraining && (
              <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Processing Progress
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-white/70">
                    <span>Progress</span>
                    <span className="font-mono text-purple-400">
                      {progress.toFixed(0)}%
                    </span>
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
          <div className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
              Processing Logs
            </h2>
            <div className="bg-black/60 border border-white/5 rounded-lg p-3 sm:p-4 h-[300px] sm:h-[400px] overflow-y-auto font-mono text-[10px] sm:text-xs text-green-400">
              {logs.length === 0 ? (
                <div className="text-white/40 text-center py-8">
                  Upload a CSV file to identify planets...
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>

            {/* Download Button */}
            {downloadUrl && (
              <div className="mt-4">
                <button
                  onClick={handleDownloadPredictions}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-400/50 rounded-lg text-green-300 font-medium transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Labeled CSV
                </button>
                <p className="text-xs text-white/50 mt-2 text-center">
                  {downloadFilename}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-500/10 border border-blue-400/20 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">
            How It Works
          </h3>
          <p className="text-sm text-white/70 mb-2">
            1. Upload a CSV file with planet features (122 features from NASA Kepler dataset)
          </p>
          <p className="text-sm text-white/70 mb-2">
            2. AI model processes each row and adds predictions:
          </p>
          <ul className="text-sm text-white/70 ml-4 space-y-1">
            <li>• <code className="text-blue-300">ai_prediction</code>: CONFIRMED or FALSE POSITIVE</li>
            <li>• <code className="text-blue-300">ai_probability</code>: Confidence score (0.0-1.0)</li>
            <li>• <code className="text-blue-300">ai_confidence</code>: high, medium, or low</li>
          </ul>
          <p className="text-sm text-white/70 mt-2">
            3. Download the labeled CSV with prediction results
          </p>
        </div>
      </div>
    </div>
  );
}
