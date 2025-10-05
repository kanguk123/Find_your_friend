"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Scene from "@/components/Scene";
import LoadingScreen from "@/components/LoadingScreen";
import Tutorial from "@/components/Tutorial";
import { useStore } from "@/state/useStore";

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const searchParams = useSearchParams();
  const { setMode, toggleSound, isSoundOn } = useStore();

  useEffect(() => {
    // Check if mode query parameter is set
    const mode = searchParams.get("mode");
    if (mode === "expert") {
      setMode("expert");
      // Skip loading and tutorial when coming from expert mode
      setIsLoading(false);
      setShowTutorial(false);
    }
  }, [searchParams, setMode]);

  const handleEnter = () => {
    setIsLoading(false);
    setShowTutorial(true);
  };

  const handleStart = () => {
    setShowTutorial(false);
    // Turn on sound when starting the game
    if (!isSoundOn) {
      toggleSound();
    }
  };

  if (isLoading) {
    return <LoadingScreen onEnter={handleEnter} />;
  }

  if (showTutorial) {
    return <Tutorial onStart={handleStart} />;
  }

  return (
    <main className="h-screen">
      <Scene />
    </main>
  );
}