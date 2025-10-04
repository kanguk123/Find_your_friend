"use client";

import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onEnter: () => void;
}

export default function LoadingScreen({ onEnter }: LoadingScreenProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'} bg-black`}
    >
      <div className="relative z-10 flex flex-col items-center justify-center h-full bg-black bg-opacity-50">
        <div className="text-center">
          <h1 className="text-5xl sm:text-7xl font-bold text-white drop-shadow-lg mb-4">Welcome to the Cosmos</h1>
          <p className="text-lg sm:text-xl text-white/80 drop-shadow-md mb-8">Explore the galaxy and beyond.</p>
          <button
            onClick={onEnter}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg transform hover:scale-105"
          >
            Get Started!
          </button>
        </div>
      </div>
    </div>
  );
}