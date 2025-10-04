import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000';

export async function GET(request: NextRequest) {
    try {
        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const page = searchParams.get('page') || '1';
        const pageSize = searchParams.get('page_size') || '50';

        // Proxy request to backend
        const backendUrl = `${BACKEND_URL}/planets?page=${page}&page_size=${pageSize}`;
        console.log('[Next.js API Route] Proxying to:', backendUrl);

        const response = await fetch(backendUrl);

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        console.log('[Next.js API Route] Successfully fetched data');

        return NextResponse.json(data);
    } catch (error) {
        console.error('[Next.js API Route] Error:', error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                data: []
            },
            { status: 500 }
        );
    }
}
