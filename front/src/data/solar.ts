// src/data/solar.ts
export type Ring = { texture: string; inner: number; outer: number };
export type Body = {
    id: string;
    name: string;
    color: string;
    radius: number;       // scene unit
    orbitRadius?: number; // AU
    periodDays?: number;
    score?: number;       // 0..1 (필터용)
    texture?: string;     // /textures/sol/*.jpg | .png
    ring?: Ring;
};

export const ORBIT_SCALE = 1.0;            // AU → scene 스케일 (지금은 1:1로 사용)
export const FLY_DISTANCE_FACTOR = 0.35;   // fly-to 살짝 바깥 보기

export const SUN: Body = {
    id: "sun",
    name: "Sun",
    color: "#ffd65a",
    radius: 0.3,
    texture: "/textures/sol/sun.jpg",
};

export const PLANETS: Body[] = [
    {
        id: "mercury",
        name: "Mercury",
        color: "#b6b3ae",
        radius: 0.10,
        orbitRadius: 0.39,
        periodDays: 88,
        score: 0.15,
        texture: "/textures/sol/mercury.jpg",
    },
    {
        id: "venus",
        name: "Venus",
        color: "#d6c08e",
        radius: 0.12,
        orbitRadius: 0.72,
        periodDays: 224.7,
        score: 0.22,
        texture: "/textures/sol/venus.jpg",
    },
    {
        id: "earth",
        name: "Earth",
        color: "#5aa0ff",
        radius: 0.13,
        orbitRadius: 1.0,
        periodDays: 365.25,
        score: 0.95,
        texture: "/textures/sol/earth.jpg",
    },
    {
        id: "mars",
        name: "Mars",
        color: "#c5653c",
        radius: 0.11,
        orbitRadius: 1.52,
        periodDays: 687,
        score: 0.35,
        texture: "/textures/sol/mars.jpg",
    },
    {
        id: "jupiter",
        name: "Jupiter",
        color: "#c9b190",
        radius: 0.28,
        orbitRadius: 5.2,
        periodDays: 4333,
        score: 0.45,
        texture: "/textures/sol/jupiter.jpg",
    },
    {
        id: "saturn",
        name: "Saturn",
        color: "#e1c787",
        radius: 0.25,
        orbitRadius: 9.54,
        periodDays: 10759,
        score: 0.5,
        texture: "/textures/sol/saturn.jpg",
        ring: {
            texture: "/textures/sol/saturn_ring.png", // ✅ PNG(알파)
            inner: 1.28,
            outer: 2.1,
        },
    },
    {
        id: "uranus",
        name: "Uranus",
        color: "#7db3d6",
        radius: 0.2,
        orbitRadius: 19.2,
        periodDays: 30687,
        score: 0.4,
        texture: "/textures/sol/uranus.jpg",
    },
    {
        id: "neptune",
        name: "Neptune",
        color: "#4c78c0",
        radius: 0.19,
        orbitRadius: 30.1,
        periodDays: 60190,
        score: 0.38,
        texture: "/textures/sol/neptune.jpg",
    },
];
