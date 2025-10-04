"use client";

interface TutorialProps {
  onStart: () => void;
}

export default function Tutorial({ onStart }: TutorialProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80">
      <div className="bg-gray-900 text-white p-8 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-3xl font-bold mb-4 text-center">How to Explore</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Movement:</h3>
            <p className="text-gray-400">- <span className="font-bold text-white">W, A, S, D:</span> Move forward, left, backward, and right.</p>
            <p className="text-gray-400">- <span className="font-bold text-white">Space:</span> Use booster for extra speed.</p>
            <p className="text-gray-400">- <span className="font-bold text-white">Q, E:</span> Roll left and right.</p>
            <p className="text-gray-400">- <span className="font-bold text-white">Arrow Keys (↑↓←→):</span> Pitch and yaw.</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Camera:</h3>
            <p className="text-gray-400">- <span className="font-bold text-white">Mouse Wheel:</span> Zoom in and out.</p>
            <p className="text-gray-400">- <span className="font-bold text-white">Right Mouse Button (Hold):</span> Orbit around the spaceship.</p>
          </div>
        </div>
        <div className="text-center mt-8">
          <button
            onClick={onStart}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg transform hover:scale-105"
          >
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
}