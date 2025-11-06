import { NextResponse } from "next/server";

// API lấy danh sách 34 tỉnh/thành (sau sáp nhập 2025)
export async function GET() {
  try {
    const apiUrl = "https://provinces.open-api.vn/api/v2/p/";
    const res = await fetch(apiUrl, { next: { revalidate: 3600 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching provinces v2:", error);
    return NextResponse.json(
      { error: "Failed to fetch provinces v2" },
      { status: 500 }
    );
  }
}
