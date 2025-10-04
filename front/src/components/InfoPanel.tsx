"use client";

import { useMemo } from "react";
import { useStore } from "@/state/useStore";
import { SUN, PLANETS } from "@/data/solar";

export default function InfoPanel() {
  const { selectedId, favorites, toggleFavorite, planets } = useStore();
  // 태양계 행성과 외계행성을 모두 포함하는 배열
  const all = [SUN, ...PLANETS, ...planets];
  const b = useMemo(
    () => all.find((x) => x.id === selectedId),
    [selectedId, all]
  );

  if (!b) {
    return (
      <div className="w-full sm:w-64 lg:w-72 text-white/80 text-xs sm:text-sm">
        <div className="opacity-70">Click a planet to inspect.</div>
      </div>
    );
  }

  const isFavorite = favorites.has(b.id);

  return (
    <div className="w-full sm:w-64 lg:w-72 text-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs opacity-70">SELECTED</div>
          <div className="text-base sm:text-lg font-semibold">{b.name}</div>
        </div>
        <button
          onClick={() => toggleFavorite(b.id)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <svg
            className="w-5 h-5"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={isFavorite ? 0 : 2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </button>
      </div>

      {/* 태양계 행성인지 외계행성인지 확인 */}
      {b.ra !== undefined && b.dec !== undefined ? (
        // 외계행성 정보
        <>
          <div className="mt-1 text-xs opacity-70">Exoplanet</div>
          <div className="text-sm">
            RA: {b.ra.toFixed(2)}°, Dec: {b.dec.toFixed(2)}°
          </div>

          {b.teq && (
            <>
              <div className="mt-1 text-xs opacity-70">
                Equilibrium Temperature
              </div>
              <div className="text-sm">{b.teq} K</div>
            </>
          )}

          {b.score && (
            <>
              <div className="mt-1 text-xs opacity-70">Habitability Score</div>
              <div className="text-sm">{(b.score * 100).toFixed(1)}%</div>
            </>
          )}

          {b.features && (
            <>
              {b.features.mass && (
                <>
                  <div className="mt-1 text-xs opacity-70">Mass</div>
                  <div className="text-sm">{b.features.mass.toFixed(2)} M⊕</div>
                </>
              )}

              {b.features.radius && (
                <>
                  <div className="mt-1 text-xs opacity-70">Radius</div>
                  <div className="text-sm">
                    {b.features.radius.toFixed(2)} R⊕
                  </div>
                </>
              )}

              {b.features.orbital_period && (
                <>
                  <div className="mt-1 text-xs opacity-70">Orbital Period</div>
                  <div className="text-sm">
                    {b.features.orbital_period.toFixed(1)} days
                  </div>
                </>
              )}

              {b.features.stellar_flux && (
                <>
                  <div className="mt-1 text-xs opacity-70">Stellar Flux</div>
                  <div className="text-sm">
                    {b.features.stellar_flux.toFixed(2)}
                  </div>
                </>
              )}
            </>
          )}
        </>
      ) : (
        // 태양계 행성 정보
        <>
          {"periodDays" in b && b.periodDays ? (
            <>
              <div className="mt-1 text-xs opacity-70">Orbital period</div>
              <div className="text-sm">
                {b.periodDays.toLocaleString()} days
              </div>
            </>
          ) : (
            <>
              <div className="mt-1 text-xs opacity-70">Star</div>
              <div className="text-sm">G-type main-sequence</div>
            </>
          )}

          <div className="mt-1 text-xs opacity-70">Radius (scene)</div>
          <div className="text-sm">{b.radius}</div>

          {"orbitRadius" in b && b.orbitRadius && (
            <>
              <div className="mt-1 text-xs opacity-70">Orbit radius</div>
              <div className="text-sm">{b.orbitRadius} AU</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
