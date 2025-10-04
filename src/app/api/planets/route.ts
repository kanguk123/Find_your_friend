import { NextResponse } from 'next/server';

export interface ExternalPlanet {
    id: string;
    name: string;
    position: [number, number, number]; // x, y, z
    radius: number;
    color: string;
    orbitRadius?: number;
    orbitSpeed?: number;
}

// Generate random planets for demonstration
function generateRandomPlanets(count: number): ExternalPlanet[] {
    const planets: ExternalPlanet[] = [];
    const colors = ['#4a90e2', '#e24a4a', '#4ae24a', '#e2e24a', '#e24ae2', '#4ae2e2'];

    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const orbitRadius = 20 + Math.random() * 15; // 20-35 units from center
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;

        planets.push({
            id: `external-planet-${i}`,
            name: `Exoplanet ${String.fromCharCode(65 + i)}`,
            position: [x, 0, z],
            radius: 0.1 + Math.random() * 0.3, // 0.1-0.4
            color: colors[Math.floor(Math.random() * colors.length)],
            orbitRadius,
            orbitSpeed: 0.0001 + Math.random() * 0.0002,
        });
    }

    return planets;
}

export async function GET() {
    try {
        // Try to fetch from your actual server
        // const response = await fetch('YOUR_SERVER_URL/planets');
        // const data = await response.json();
        // return NextResponse.json(data);

        // For now, return random planets
        const planets = generateRandomPlanets(20);
        return NextResponse.json({ planets });
    } catch (error) {
        // If server fails, return random planets
        const planets = generateRandomPlanets(20);
        return NextResponse.json({ planets });
    }
}
