import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
    try {
        // Get the FormData from the request
        const formData = await request.formData();

        console.log('[Next.js API Route] Proxying file upload to backend:', `${BACKEND_URL}/upload/identify-planets`);

        // Forward the FormData to the backend
        const response = await fetch(`${BACKEND_URL}/upload/identify-planets`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Next.js API Route] Backend error:', response.status, errorText);
            throw new Error(`Backend returned ${response.status}: ${errorText}`);
        }

        // Get the CSV blob from the backend response
        const blob = await response.blob();

        // Get the filename from the Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'planet_predictions.csv';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        console.log('[Next.js API Route] Successfully received CSV from backend');

        // Return the CSV file to the client
        return new NextResponse(blob, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('[Next.js API Route] Error:', error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
