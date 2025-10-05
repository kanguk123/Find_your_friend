"use client";

import { useEffect, useRef, useState } from "react";

export type KeyState = {
  down: (code: string) => boolean;
};

export function useKey(): KeyState {
  const pressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      // input/textarea에 포커스되어 있으면 무시
      if (document.body.dataset.inputFocused === 'true') {
        return;
      }
      pressed.current.add(e.code);
    };
    const onUp = (e: KeyboardEvent) => {
      // input/textarea에 포커스되어 있으면 무시
      if (document.body.dataset.inputFocused === 'true') {
        return;
      }
      pressed.current.delete(e.code);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  return {
    down: (code: string) => pressed.current.has(code),
  };
}

// WASD 키 상태를 관리하는 전용 훅
export function useWASDKeys() {
  const [keysPressed, setKeysPressed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(key)
      ) {
        e.preventDefault();
        setKeysPressed((prev) => ({ ...prev, [key]: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(key)
      ) {
        setKeysPressed((prev) => ({ ...prev, [key]: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return keysPressed;
}
