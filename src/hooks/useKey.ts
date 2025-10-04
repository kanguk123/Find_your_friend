"use client";

import { useEffect, useRef } from "react";

export type KeyState = {
    down: (code: string) => boolean;
};

export function useKey(): KeyState {
    const pressed = useRef<Set<string>>(new Set());

    useEffect(() => {
        const onDown = (e: KeyboardEvent) => { pressed.current.add(e.code); };
        const onUp = (e: KeyboardEvent) => { pressed.current.delete(e.code); };
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
