import { NextRequest, NextResponse } from "next/server";

// AI ML 서버는 별도 포트 사용 (개발 환경에서는 8001)
const AI_SERVER_URL = process.env.AI_ML_SERVER_URL || "http://127.0.0.1:8001";

export async function POST(request: NextRequest) {
  try {
    console.log("[Label CSV API] Received request");

    // FormData를 그대로 AI 서버로 전달
    const formData = await request.formData();
    const file = formData.get("file");

    console.log("[Label CSV API] File received:", file ? "yes" : "no");

    // AI 서버의 /predict-csv 엔드포인트로 요청
    const aiUrl = `${AI_SERVER_URL}/predict-csv`;
    console.log("[Label CSV API] Sending to AI server:", aiUrl);

    const response = await fetch(aiUrl, {
      method: "POST",
      body: formData,
    });

    console.log("[Label CSV API] AI server response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Label CSV API] AI server error:", errorText);
      return NextResponse.json(
        {
          success: false,
          message: "AI server returned an error",
          error: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[Label CSV API] Success, processed", data.count, "items");
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Label CSV API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to label CSV",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
