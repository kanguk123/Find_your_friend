"use client";

import { useState } from "react";
import Scene from "@/components/Scene";
import LoadingScreen from "@/components/LoadingScreen";
import Tutorial from "@/components/Tutorial";

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  const handleEnter = () => {
    setIsLoading(false);
    setShowTutorial(true);
  };

  const handleStart = () => {
    setShowTutorial(false);
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