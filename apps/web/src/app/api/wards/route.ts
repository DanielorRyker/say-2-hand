import { NextResponse } from "next/server";

// API lấy danh sách phường/xã
// Hỗ trợ cả v1 (63 tỉnh) và v2 (34 tỉnh sau sáp nhập)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceCode = searchParams.get("provinceCode");
    const districtCode = searchParams.get("districtCode");
    const useV2 = searchParams.get("v2") === "true";

    let apiUrl = "";

    if (provinceCode && useV2) {
      // API v2: Lấy phường/xã trực tiếp từ tỉnh (2-tier: Province → Ward)
      apiUrl = `https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`;
    } else if (provinceCode) {
      // API v1: Lấy phường/xã từ tỉnh (3-tier: Province → District → Ward)
      apiUrl = `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`;
    } else if (districtCode) {
      // API v1: Lấy phường/xã từ quận/huyện
      apiUrl = `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`;
    }

    if (!apiUrl) {
      return NextResponse.json(
        { error: "Province code or district code is required" },
        { status: 400 }
      );
    }

    console.log("Fetching wards from:", apiUrl);
    const res = await fetch(apiUrl);
    const data = await res.json();
    console.log("Wards response:", data);

    return NextResponse.json(data.wards || []);
  } catch (error) {
    console.error("Error fetching wards:", error);
    return NextResponse.json(
      { error: "Failed to fetch wards" },
      { status: 500 }
    );
  }
}
