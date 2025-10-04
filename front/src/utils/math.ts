export function deg2rad(d: number) {
    return (d * Math.PI) / 180;
}

// RA(deg), DEC(deg) -> x,y,z (radius)
export function sph2cart(raDeg: number, decDeg: number, r: number) {
    const ra = deg2rad(raDeg);
    const dec = deg2rad(decDeg);
    const x = r * Math.cos(dec) * Math.cos(ra);
    const y = r * Math.sin(dec);
    const z = r * Math.cos(dec) * Math.sin(ra);
    return [x, y, z] as [number, number, number];
}

// 0..1 -> HSL(파랑->빨강) CSS 문자열
export function scoreToHSL(score?: number) {
    const s = Math.max(0, Math.min(1, score ?? 0));
    const hue = (1 - s) * 240; // 240(파랑) -> 0(빨강)
    return `hsl(${hue.toFixed(0)} 90% 55%)`;
}
