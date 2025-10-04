"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useStore } from "@/state/useStore";
import { SUN, PLANETS, type Body } from "@/data/solar";

type Item = { id: string; name: string; isExoplanet?: boolean };

export default function SolarSearchSidebar() {
  const { bodyPositions, setSelectedId, setFlyToTarget, setFollowRocket, planets, setIsCameraMoving } =
    useStore();

  const catalog = useMemo<Item[]>(
    () => [
      { id: SUN.id, name: SUN.name, isExoplanet: false },
      ...PLANETS.map((p) => ({ id: p.id, name: p.name, isExoplanet: false })),
      ...planets
        .filter((p) => p.ra !== undefined && p.dec !== undefined)
        .map((p) => ({ id: p.id, name: p.name, isExoplanet: true })),
    ],
    [planets]
  );

  const [q, setQ] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = s
      ? catalog.filter(
          (i) =>
            i.name.toLowerCase().includes(s) || i.id.toLowerCase().includes(s)
        )
      : [];
    return base.slice(0, 8);
  }, [catalog, q]);

  // 입력이 있고 포커스되어 있으면 자동으로 suggestions 표시
  const showDropdown = focused && list.length > 0 && q.trim().length > 0;

  useEffect(() => {
    setActiveIdx(0);
  }, [q]);

  const flyTo = useCallback(
    (id: string, isExoplanet: boolean = false) => {
      // 같은 행성을 다시 선택하면 카메라 이동하지 않음
      const currentSelectedId = useStore.getState().selectedId;
      if (currentSelectedId === id) {
        setQ("");
        setFocused(false);
        inputRef.current?.blur();
        return;
      }

      // 검색 후 입력창 초기화 및 포커스 제거
      setQ("");
      setFocused(false);
      inputRef.current?.blur();

      setSelectedId(id);
      setIsCameraMoving(true);

      if (isExoplanet) {
        // 외계행성 처리
        const planet = planets.find((p) => p.id === id);
        if (!planet || planet.ra === undefined || planet.dec === undefined) {
          console.warn("외계행성 데이터를 찾을 수 없습니다:", id);
          setIsCameraMoving(false);
          return;
        }

        console.log("Search: Flying to exoplanet:", planet.name, "id:", id);

        // 외계행성 위치 계산
        const radius = 30; // ExoplanetPoints의 radius와 동일
        const SURFACE_OFFSET = 0.1;
        const phi = (planet.ra * Math.PI) / 180;
        const theta = (planet.dec * Math.PI) / 180;
        const x = (radius + SURFACE_OFFSET) * Math.cos(theta) * Math.cos(phi);
        const y = (radius + SURFACE_OFFSET) * Math.sin(theta);
        const z = (radius + SURFACE_OFFSET) * Math.cos(theta) * Math.sin(phi);

        // 카메라 위치 계산
        const len = Math.hypot(x, y, z) || 1;
        const n = [x / len, y / len, z / len];
        const dist = radius * 1.2;
        const camX = n[0] * dist;
        const camY = n[1] * dist;
        const camZ = n[2] * dist;

        console.log("Search: Planet position:", [x, y, z], "Camera target:", [camX, camY, camZ]);

        // bodyPositions 업데이트
        const { setBodyPositions } = useStore.getState();
        const newPositions = {
          ...bodyPositions,
          [id]: [x, y, z] as [number, number, number],
        };
        setBodyPositions(newPositions);

        // 즉시 상태 업데이트 후 카메라 이동
        useStore.setState({ bodyPositions: newPositions });
        setFlyToTarget([camX, camY, camZ]);
      } else {
        // 태양계 행성 처리
        const pos = bodyPositions[id];
        if (!pos) return;
        const [x, y, z] = pos;

        // 선택된 천체의 정보 가져오기
        const allBodies = [SUN, ...PLANETS];
        const body = allBodies.find((b) => b.id === id);
        if (!body) return;

        // 행성 크기에 따라 카메라 거리 조정
        const planetRadius = body.id === "sun" ? body.radius : body.radius * 0.62; // GLOBAL_PLANET_SCALE 적용
        const cameraDistance = planetRadius * 4.5; // 더 멀리

        // 태양(0, 0, 0)에서 행성으로 향하는 방향 벡터 (정규화)
        const len = Math.hypot(x, z) || 1;
        const normalX = x / len;
        const normalZ = z / len;

        // 행성 앞쪽에서 태양 반대 방향으로 카메라 배치
        // 행성의 밝은 면을 정면에서 봄
        const camX = x + normalX * cameraDistance;
        const camY = y + cameraDistance * 0.15; // 약간 위에서
        const camZ = z + normalZ * cameraDistance;

        setFlyToTarget([camX, camY, camZ]);
      }

      // 🔻 로켓 추적 해제 → 로켓은 가만히, 카메라는 천체 보기 모드
      setFollowRocket(false);
    },
    [bodyPositions, setSelectedId, setFlyToTarget, setFollowRocket, planets, setIsCameraMoving]
  );

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
      return;
    }
    if (!list.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = list[activeIdx];
      flyTo(item.id, item.isExoplanet);
    }
  };

  const handleBlur = () => {
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
    blurTimer.current = window.setTimeout(() => setFocused(false), 120);
  };
  const handleFocus = () => {
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
    setFocused(true);
  };

  return (
    <div className="pointer-events-auto w-full lg:w-72 bg-black/60 border border-white/15 rounded-xl p-2 sm:p-3 text-white backdrop-blur-sm">
      <div className="text-sm sm:text-base font-semibold mb-2">
        Search planets
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder='Try "Earth", "Mars", "Planet 123"...'
          className="w-full rounded-md bg-black/60 text-white px-2 sm:px-3 py-1.5 sm:py-2 text-sm outline-none border border-white/15"
        />

        <div className="mt-2 flex items-center justify-end text-xs">
          <span className="opacity-60">
            {q ? `${list.length} match(es)` : "type to search"}
          </span>
        </div>

        {showDropdown && (
          <ul
            className="absolute left-0 right-0 mt-2 max-h-60 overflow-auto rounded-md border border-white/10 divide-y divide-white/10 bg-black/80 z-50"
            onMouseDown={(e) => e.preventDefault()}
          >
            {list.map((item, idx) => (
              <li
                key={item.id}
                className={`px-3 py-2 cursor-pointer ${
                  idx === activeIdx ? "bg-white/15" : "hover:bg-white/10"
                }`}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => flyTo(item.id, item.isExoplanet)}
              >
                <div className="flex items-center justify-between">
                  <span>{item.name}</span>
                  {item.isExoplanet && (
                    <span className="text-xs text-purple-400 ml-2">Exoplanet</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
