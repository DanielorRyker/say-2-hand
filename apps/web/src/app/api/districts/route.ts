import { NextResponse } from "next/server";

// API lấy danh sách quận/huyện theo tỉnh (chỉ dùng cho API v1 - 63 tỉnh)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceCode = searchParams.get("provinceCode");

    if (!provinceCode) {
      return NextResponse.json(
        { error: "Province code is required" },
        { status: 400 }
      );
    }

    const apiUrl = `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    return NextResponse.json(data.districts || []);
  } catch (error) {
    console.error("Error fetching districts:", error);
    return NextResponse.json(
      { error: "Failed to fetch districts" },
      { status: 500 }
    );
  }
}
