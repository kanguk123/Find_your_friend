"use client";

import { useStore } from "@/state/useStore";
import { IoMdSettings, IoMdVolumeHigh, IoMdVolumeLow, IoMdVolumeOff } from "react-icons/io";
import { MdGraphicEq } from "react-icons/md";

export default function Settings() {
  const {
    isSoundOn,
    backgroundVolume,
    effectsVolume,
    toggleSound,
    setBackgroundVolume,
    setEffectsVolume,
  } = useStore();

  return (
    <div className="fixed bottom-20 right-3 z-50">
      <div className="p-4 bg-black/60 border border-white/15 rounded-xl backdrop-blur-sm text-white">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <IoMdSettings />
          Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm">
              <IoMdVolumeHigh />
              Background Music
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={backgroundVolume}
              onChange={(e) => setBackgroundVolume(parseFloat(e.target.value))}
              className="w-full"
              disabled={!isSoundOn}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm">
              <MdGraphicEq />
              Sound Effects
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={effectsVolume}
              onChange={(e) => setEffectsVolume(parseFloat(e.target.value))}
              className="w-full"
              disabled={!isSoundOn}
            />
          </div>
          <button
            onClick={toggleSound}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg bg-white/10 border border-white/15 hover:bg-white/20"
          >
            {isSoundOn ? <IoMdVolumeHigh /> : <IoMdVolumeOff />}
            {isSoundOn ? "Mute All" : "Unmute All"}
          </button>
        </div>
      </div>
    </div>
  );
}