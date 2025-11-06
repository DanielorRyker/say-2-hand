import { NextResponse } from "next/server";

// API lấy danh sách 63 tỉnh/thành (trước sáp nhập 2025)
export async function GET() {
  try {
    const apiUrl = "https://provinces.open-api.vn/api/p/";
    const res = await fetch(apiUrl, { next: { revalidate: 3600 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return NextResponse.json(
      { error: "Failed to fetch provinces" },
      { status: 500 }
    );
  }
}
