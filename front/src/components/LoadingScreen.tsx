"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useStore } from "@/state/useStore";

interface LoadingScreenProps {
  onEnter: () => void;
}

export default function LoadingScreen({ onEnter }: LoadingScreenProps) {
  const [mounted, setMounted] = useState(false);     // 첫 진입 페이드인
  const [exiting, setExiting] = useState(false);     // 버튼 클릭 후 페이드아웃
  const containerRef = useRef<HTMLDivElement>(null);
  const { toggleSound, isSoundOn } = useStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioStarted, setAudioStarted] = useState(false);

  useEffect(() => {
    // 마운트 직후 페이드인 및 배경음악 시작
    const id = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // 페이지 전체에 대한 클릭/터치 이벤트로 음악 시작
  useEffect(() => {
    const startAudio = () => {
      if (!audioStarted && audioRef.current) {
        audioRef.current.volume = 0.3;
        audioRef.current.play().then(() => {
          setAudioStarted(true);
          // 사운드 상태 업데이트
          if (!isSoundOn) {
            toggleSound();
          }
        }).catch((error) => {
          console.log("Audio play failed:", error);
        });
      }
    };

    // 다양한 이벤트 리스너 등록 (클릭, 터치, 키보드)
    document.addEventListener('click', startAudio);
    document.addEventListener('touchstart', startAudio);
    document.addEventListener('keydown', startAudio);

    return () => {
      document.removeEventListener('click', startAudio);
      document.removeEventListener('touchstart', startAudio);
      document.removeEventListener('keydown', startAudio);
    };
  }, [audioStarted, isSoundOn, toggleSound]);

  const handleGetStarted = () => {
    setExiting(true);
  };

  // 페이드아웃이 끝나면 onEnter 호출
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: TransitionEvent) => {
      if (e.propertyName === "opacity" && exiting) {
        onEnter();
      }
    };
    el.addEventListener("transitionend", handler);
    return () => el.removeEventListener("transitionend", handler);
  }, [exiting, onEnter]);

  return (
      <div
          ref={containerRef}
          className={[
            "fixed inset-0 z-[100]",
            "transition-opacity duration-700",
            mounted && !exiting ? "opacity-100" : "opacity-0",
            "bg-black",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
      >
        {/* Background audio */}
        <audio ref={audioRef} src="/audio/sound_background.mp3" loop />

        {/* 풀스크린 배경 이미지 */}
        <div className="absolute inset-0 z-0">
          <Image
              src="/images/star.jpg"
              alt="A shining star"
              fill                     // layout=fill 대체
              priority                 // 로딩 페이지이므로 우선 로드
              sizes="100vw"
              style={{ objectFit: "cover" }}
          />
        </div>

        {/* 반투명 오버레이 + 콘텐츠 */}
        <div className="relative z-10 flex h-full w-full items-center justify-center bg-black/50 px-4">
          <div className="text-center">
            <h1 className="mb-4 text-5xl font-bold text-white drop-shadow-lg sm:text-7xl">
              Welcome to the Cosmos
            </h1>
            <p className="mb-8 text-lg text-white/80 drop-shadow-md sm:text-xl">
              Explore the galaxy and beyond.
            </p>

            <button
                onClick={handleGetStarted}
                className="transform rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-purple-600 hover:to-blue-600"
            >
              Get Started!
            </button>
          </div>
        </div>
      </div>
  );
}
