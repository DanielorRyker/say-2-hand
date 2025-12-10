"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "@/lib/constants";
import "leaflet/dist/leaflet.css";
import styles from "./CategoryForm.module.scss";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import stylesBasicForm from "./BasicInfoForm.module.scss";

import { parseAddress, normalizeProvinceName } from "../../../../lib/address";

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: string[];
  // original Nominatim address object when available
  addressObj?: Record<string, any>;
};

// component trợ giúp để di chuyển bản đồ chương trình khi tọa độ thay đổi
function FlyTo({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    if (!isNaN(lat) && !isNaN(lon)) {
      map.setView([lat, lon], 18, { animate: true });
    }
  }, [lat, lon, map]);
  return null;
}

export default function MapPicker({
  address,
  onChangeAddress,
  onSelectCoords,
  onSelectAddressDetails,
}: {
  address: string;
  onChangeAddress: (s: string) => void;
  onSelectCoords: (lat: number, lon: number) => void;
  onSelectAddressDetails?: (details: {
    detail: string;
    ward: string;
    province: string;
  }) => void;
}) {
  const [query, setQuery] = useState(address || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  // trạng thái loading đã bỏ (không dùng trong UI ở đây)
  const [selected, setSelected] = useState<Suggestion | null>(null);
  // trạng thái overlay GPS (tách biệt với marker 'selected' do người dùng chọn)
  const [gpsPos, setGpsPos] = useState<{
    lat: number;
    lon: number;
    accuracy?: number;
  } | null>(null);
  const debRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // trạng thái geoLoading đã bỏ (không dùng trong UI ở đây)
  const [geoError, setGeoError] = useState<string | null>(null);

  // AI address normalization state
  const [aiNormalizing, setAiNormalizing] = useState(false);
  const [aiNormalized, setAiNormalized] = useState(false);

  // tâm mặc định: Việt Nam (TP. HCM)
  const [center, setCenter] = useState<[number, number]>([
    10.762622, 106.660172,
  ]);

  useEffect(() => {
    // Khi component cha cập nhật địa chỉ (ví dụ sau khi chọn đề xuất ở nơi khác),
    // chỉ cập nhật query nội bộ nếu input không đang focus hoặc địa chỉ khác với query hiện tại
    // để tránh ghi đè khi người dùng đang gõ.
    try {
      const active = document.activeElement as HTMLElement | null;
      const isInputFocused =
        active && inputRef.current && active === inputRef.current;
      if (!isInputFocused) {
        setQuery(address || "");
      } else {
        // If focused but parent changed the address to a different value than current query,
        // we still avoid overwriting to preserve user's typing.
      }
    } catch {
      setQuery(address || "");
    }
  }, [address]);

  const fetchSuggestions = async (q: string) => {
    // bắt đầu fetchSuggestions
    try {
      // Tìm kiếm Nominatim với viewbox và countrycodes để ưu tiên kết quả ở VN
      const params = new URLSearchParams({
        q,
        format: "jsonv2",
        addressdetails: "1",
        limit: "8",
        countrycodes: "vn",
      });
      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
      let data: Suggestion[] | null = null;
      try {
        const res = await fetch(url, {
          headers: { "Accept-Language": "vi,en" },
        });
        if (!res.ok) {
          console.error("fetchSuggestions: Nominatim returned non-ok", {
            url,
            status: res.status,
          });
        } else {
          data = (await res.json()) as Suggestion[];
        }
      } catch (err) {
        console.error("fetchSuggestions: Nominatim fetch failed", { url, err });
      }
      // nếu Nominatim không trả kết quả, thử các biến thể và tìm kiếm có cấu trúc
      if ((!data || data.length === 0) && looksLikeHouseNumberQuery(q)) {
        // thử dùng kết quả cache trước
        const cacheKey = `variants:${q}`;
        if (cache.has(cacheKey)) {
          setSuggestions(cache.get(cacheKey) || []);
          return;
        }

        const variants = generateVariants(q);
        for (const variant of variants) {
          // thử tìm kiếm dạng văn bản tự do cho biến thể
          const res = await fetchNominatim(variant);
          if (res && res.length) {
            cache.set(cacheKey, res);
            setSuggestions(res);
            return;
          }
          // nếu biến thể chứa các phần cách nhau bởi dấu phẩy, thử tìm kiếm có cấu trúc
          const parts = variant
            .split(",")
            .map((partStr) => partStr.trim())
            .filter(Boolean);
          if (parts.length >= 2) {
            // giả sử phần đầu là street + số nhà, phần cuối là thành phố
            const streetLike = parts.slice(0, parts.length - 1).join(", ");
            const cityLike = parts[parts.length - 1];
            const structured = await fetchNominatimStructured(
              streetLike,
              cityLike
            );
            if (structured && structured.length) {
              cache.set(cacheKey, structured);
              setSuggestions(structured);
              return;
            }
          }
        }

        // dự phòng: Overpass
        const over = await fetchOverpassForHouse(q);
        if (over && over.length) {
          cache.set(cacheKey, over);
          setSuggestions(over);
          return;
        }
        // không tìm thấy
        setSuggestions([]);
        return;
      }
      // làm sạch display_name để loại bỏ mã bưu chính và tên quốc gia
      const qtrim = q.trim();
      function stripLeadingQuery(name: string, qstr: string) {
        if (!qstr) return name;
        const nameTrimmed = name.trim();
        const loweredName = nameTrimmed.toLowerCase();
        const loweredQuery = qstr.toLowerCase();
        // nếu display name bắt đầu bằng query chính xác theo sau bởi dấu phẩy hoặc dấu gạch chéo hoặc khoảng trắng,
        // bỏ đoạn dẫn đầu đó để đề xuất không chỉ lặp lại chuỗi đã gõ.
        const patterns = [
          loweredQuery + ", ",
          loweredQuery + ",",
          loweredQuery + " / ",
          loweredQuery + " /",
          loweredQuery + " ",
        ];
        for (const pattern of patterns) {
          if (loweredName.startsWith(pattern)) {
            return nameTrimmed.slice(pattern.length).trim();
          }
        }
        // cũng thử bỏ khi query trùng với token đầu tiên (ví dụ '195') trước dấu phẩy
        const firstToken = loweredName.split(/[ ,\/]+/)[0];
        if (firstToken === loweredQuery) {
          // remove that token from the original-cased name
          return nameTrimmed
            .replace(new RegExp("^" + firstToken + "[ ,\\/\\s]*", "iu"), "")
            .trim();
        }
        return nameTrimmed;
      }

      if (data && data.length) {
        const cleaned = (data || []).map((d) => ({
          ...d,
          display_name: formatAddress(
            stripLeadingQuery(cleanDisplayName(d.display_name), qtrim)
          ),
          // attach address object for structured parsing when available
          addressObj: (d as any).address || undefined,
        }));
        setSuggestions(cleaned);
        return;
      }
    } catch (error) {
      console.error("fetchSuggestions error", error);
      try {
        setGeoError(
          "Không thể kết nối tới dịch vụ gợi ý địa chỉ (mạng hoặc chặn CORS)."
        );
        // clear after 6s
        setTimeout(() => setGeoError(null), 6000);
      } catch {}
    } finally {
      // fetchSuggestions finished
    }
  };

  function looksLikeHouseNumberQuery(q: string) {
    // heuristic đơn giản: bắt đầu bằng chữ số hoặc chứa chữ số theo sau bởi từ khóa đường
    return /^\s*\d+/u.test(q);
  }

  async function fetchOverpassForHouse(q: string) {
    try {
      // Cố gắng trích xuất số nhà và tên đường từ query
      // Ví dụ: "195 Duong so 3, Phuong ..." hoặc "195 Đường số 3"
      const match = q.match(/^\s*(\d+)\s+(.+)$/u);
      if (!match) return null;
      const housenumber = match[1];
      const rest = match[2];
      // Thử tách tên đường và thành phố bằng dấu phẩy nếu có
      const parts = rest.split(",").map((s) => s.trim());
      const street = parts[0] || "";
      const city = parts.length > 1 ? parts[parts.length - 1] : "";

      // Xây dựng Overpass QL: tìm theo vùng (area) dựa trên city nếu có, nếu không tìm theo country=VN
      // Tìm node/way/relation có addr:housenumber khớp với số nhà và addr:street khớp với tên đường
      // Sử dụng regex không phân biệt chữ hoa/thường cho tên đường.
      const areaClause = city
        ? `area[name~"${escapeOverpass(city)}",i];`
        : `area["ISO3166-1"="VN"];`;

      const streetFilter = street
        ? `["addr:street"~"${escapeOverpass(street)}",i]`
        : "";
      const hnFilter = `["addr:housenumber"~"^${escapeOverpass(housenumber)}$"]`;

      const ql = `
        [out:json][timeout:25];
        ${areaClause}
        (
          node${hnFilter}${streetFilter}(area);
          way${hnFilter}${streetFilter}(area);
          relation${hnFilter}${streetFilter}(area);
        );
        out center;
      `;

      // cooldown đơn giản để tránh gửi quá nhiều yêu cầu giống nhau đến Overpass
      const cacheKey = `overpass:${encodeURIComponent(ql)}`;
      if (overpassCooldown.has(cacheKey)) {
        // still cooling down
        return null;
      }

      // kiểm tra cache phiên (session) trước
      try {
        const sess = loadSessionCache(cacheKey);
        if (sess) return sess;
      } catch {}

      // thử lại với exponential backoff khi nhận 429
      let attempt = 0;
      let json: any = null;
      while (attempt < 3) {
        const res = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(ql)}`,
        });
        if (res.status === 429) {
          attempt += 1;
          const ra = res.headers.get("Retry-After");
          const wait = ra ? Number(ra) * 1000 : 500 * Math.pow(2, attempt);
          // set a short cooldown for this query to avoid repeated 429s
          overpassCooldown.set(cacheKey, Date.now() + Math.max(2000, wait));
          await new Promise((r) => setTimeout(r, Math.max(500, wait)));
          continue;
        }
        if (!res.ok) {
          // treat other errors as no-results
          return null;
        }
        json = await res.json();
        break;
      }
      if (!json) return null;
      if (!json.elements || !json.elements.length) return null;
      // chuyển đổi phần tử (elements) sang dạng Suggestion
      const out: Suggestion[] = json.elements.map((el: any) => {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        const display =
          (el.tags && el.tags["addr:housenumber"]
            ? el.tags["addr:housenumber"] + " "
            : "") +
          (el.tags && el.tags["addr:street"]
            ? el.tags["addr:street"]
            : street || "");
        return {
          display_name: formatAddress(
            cleanDisplayName(
              display +
                (el.tags && el.tags["addr:city"]
                  ? `, ${el.tags["addr:city"]}`
                  : "")
            )
          ),
          lat: String(lat),
          lon: String(lon),
        };
      });
      try {
        saveSessionCache(cacheKey, out);
      } catch {}
      return out;
    } catch (error) {
      console.error("overpass error", error);
      return null;
    }
  }

  function escapeOverpass(s: string) {
    return s.replace(/"/g, '\\"');
  }

  // ------------------ Variants and helpers ------------------
  const cache: Map<string, Suggestion[]> = new Map();
  // map cooldown cho các truy vấn Overpass để tránh gửi nhiều yêu cầu (key -> timestamp tới khi được coi là hết hạn)
  const overpassCooldown: Map<string, number> = new Map();

  // helper sessionStorage để cache kết quả đề xuất trong suốt phiên duyệt
  function loadSessionCache(key: string): Suggestion[] | null {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const obj = JSON.parse(raw) as { ts: number; value: Suggestion[] };
      // TTL: 24 giờ
      if (Date.now() - obj.ts > 1000 * 60 * 60 * 24) {
        sessionStorage.removeItem(key);
        return null;
      }
      return obj.value || null;
    } catch {
      return null;
    }
  }

  function saveSessionCache(key: string, value: Suggestion[]) {
    try {
      const obj = { ts: Date.now(), value };
      sessionStorage.setItem(key, JSON.stringify(obj));
    } catch {
      // ignore quota errors
    }
  }

  function generateVariants(q: string) {
    const out = new Set<string>();
    const trimmed = q.trim();
    if (!trimmed) return [];
    out.add(trimmed);

    const noDiacritics = removeDiacritics(trimmed);
    if (noDiacritics !== trimmed) out.add(noDiacritics);

    // các thay thế token thông dụng cho địa chỉ tiếng Việt
    const tokenReplacements: Array<[RegExp, string[]]> = [
      [/\bĐường số\b/iu, ["Đường số", "ĐS", "D. số", "Duong so"]],
      [/\bĐường\b/iu, ["Đường", "Đ", "D.", "Duong"]],
      [/\bPhường\b/iu, ["Phường", "P.", "P", "Phuong"]],
      [/\bQuận\b/iu, ["Quận", "Q.", "Q", "Quan"]],
      [/\bHuyện\b/iu, ["Huyện", "H.", "H", "Huyen"]],
      [
        /\bThành phố\b/iu,
        ["Thành phố", "TP", "TP.", "Tp", "Thanh pho", "Thanhpho"],
      ],
      [
        /\bHồ Chí Minh\b/iu,
        ["Hồ Chí Minh", "Ho Chi Minh", "HCM", "TP HCM", "TP. HCM"],
      ],
      [/\bHẻm\b/iu, ["Hẻm", "Hem", "H.", "Hem."]],
      [/\bNgách\b/iu, ["Ngách", "Ngach", "Ng."]],
    ];

    // Nếu query bắt đầu bằng số nhà, sinh các biến thể số/đường
    const match = trimmed.match(/^\s*(\d+[A-Za-z0-9\/ -]*)\s+(.+)$/u);
    if (match) {
      const num = match[1];
      const rest = match[2];
      out.add(`${num} ${rest}`);
      out.add(`${rest} ${num}`); // swapped order

      // thêm số 0 ở đầu cho số nhỏ (1 -> 01)
      if (/^\d$/.test(num)) out.add(`0${num} ${rest}`);
      if (/^\d{1,2}$/.test(num)) out.add(num.padStart(2, "0") + " " + rest);

      // sinh các biến thể bằng cách áp dụng các thay thế token lên phần còn lại
      for (const [re, reps] of tokenReplacements) {
        if (re.test(rest)) {
          for (const rep of reps) {
            const replaced = rest.replace(re, rep);
            out.add(`${num} ${replaced}`);
            out.add(removeDiacritics(`${num} ${replaced}`));
            out.add(`${replaced} ${num}`);
          }
        }
      }

      // cũng thử thêm/bỏ từ 'số'
      out.add(`${num} ${rest.replace(/\bsố\b/iu, "")}`);
      out.add(removeDiacritics(`${num} ${rest.replace(/\bsố\b/iu, "")}`));
    }

    // Thêm các thay thế token chung trên toàn chuỗi
    for (const [re, reps] of tokenReplacements) {
      if (re.test(trimmed)) {
        for (const rep of reps) {
          out.add(trimmed.replace(re, rep));
          out.add(removeDiacritics(trimmed.replace(re, rep)));
        }
      }
    }

    // Thử một vài heuristics hoán vị nhỏ
    // Thay thế các viết tắt thông dụng một cách rõ ràng
    const extraPatterns: Array<[RegExp, string[]]> = [
      [/\bPhường\b/iu, ["P.", "P"]],
      [/\bQuận\b/iu, ["Q.", "Q"]],
      [/\bThành phố\b/iu, ["TP", "TP."]],
    ];
    for (const [re, reps] of extraPatterns) {
      if (re.test(trimmed)) {
        for (const rep of reps) {
          out.add(trimmed.replace(re, rep));
          out.add(removeDiacritics(trimmed.replace(re, rep)));
        }
      }
    }

    // một vài chuẩn hoá dấu câu cơ bản
    out.add(trimmed.replace(/\s+/g, " "));
    out.add(trimmed.replace(/[,\.]+/g, ",").replace(/\s+,/g, ","));
    out.add(noDiacritics.replace(/\s+/g, " "));

    // Thêm các biến thể loại bỏ dấu như 'Đường' -> 'Duong'
    const res = Array.from(out);
    // ensure uniqueness and reasonable ordering
    return res.slice(0, 60);
  }

  function removeDiacritics(str: string) {
    // chuẩn hoá cơ bản: loại bỏ dấu kết hợp
    return str
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  }

  async function fetchNominatim(q: string) {
    try {
      const key = `nominatim:${q}`;
      const sess = loadSessionCache(key);
      if (sess) return sess;
      const params = new URLSearchParams({
        q,
        format: "jsonv2",
        addressdetails: "1",
        limit: "6",
        countrycodes: "vn",
      });
      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
      const res = await fetch(url, { headers: { "Accept-Language": "vi,en" } });
      if (!res.ok) return null;
      const raw = (await res.json()) as any[];
      // preserve address object from nominatim into Suggestion.addressObj
      const data = (raw || []).map((d) => ({
        ...d,
        addressObj: d.address || undefined,
      })) as Suggestion[];
      saveSessionCache(key, data || []);
      return data;
    } catch (error) {
      console.error("nominatim fetch error", error);
      return null;
    }
  }

  async function fetchNominatimStructured(
    streetLike: string,
    cityLike: string
  ) {
    try {
      const key = `nominatim_struct:${streetLike}|${cityLike}`;
      const sess = loadSessionCache(key);
      if (sess) return sess;
      const params = new URLSearchParams({
        street: streetLike,
        city: cityLike,
        format: "jsonv2",
        addressdetails: "1",
        limit: "6",
        countrycodes: "vn",
      });
      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
      const res = await fetch(url, { headers: { "Accept-Language": "vi,en" } });
      if (!res.ok) return null;
      const raw = (await res.json()) as any[];
      const data = (raw || []).map((d) => ({
        ...d,
        addressObj: d.address || undefined,
      })) as Suggestion[];
      saveSessionCache(key, data || []);
      return data;
    } catch (error) {
      console.error("nominatim structured error", error);
      return null;
    }
  }

  const reverseGeocode = async (lat: number, lon: number) => {
    // Avoid calling network when offline
    try {
      if (typeof window !== "undefined" && "navigator" in window) {
        try {
          const nav = (window as any).navigator;
          if (nav && typeof nav.onLine === "boolean" && !nav.onLine) {
            // offline: skip reverse geocode
            return null;
          }
        } catch {}
      }

      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        format: "jsonv2",
        addressdetails: "1",
      });
      const url = `https://nominatim.openstreetmap.org/reverse?${params.toString()}`;
      const res = await fetch(url, { headers: { "Accept-Language": "vi,en" } });
      if (!res.ok) {
        // treat non-OK as no result
        return null;
      }
      const data = await res.json();
      if (data && data.display_name)
        data.display_name = cleanDisplayName(data.display_name);
      // attach address object if present
      if (data && data.address) data.addressObj = data.address;
      return data; // contains display_name, address, etc.
    } catch {
      // network or parsing error: swallow and return null (do not rethrow)
      return null;
    }
  };

  // AI Address Normalization using Gemini
  const normalizeAddressWithAI = async (rawAddress: string) => {
    try {
      setAiNormalizing(true);
      const response = await fetch(`${API_BASE}/api/gemini/normalize-address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: rawAddress }),
      });

      if (!response.ok) {
        console.error("AI normalization failed:", response.status);
        return null;
      }

      const data = await response.json();
      console.log("AI normalized address:", data);
      return data;
    } catch (error) {
      console.error("AI normalization error:", error);
      return null;
    } finally {
      setAiNormalizing(false);
    }
  };

  // Map Nominatim structured address object to our detail/ward/province fields
  function mapNominatimAddressToDetails(
    address: Record<string, any> | undefined
  ) {
    if (!address) return { detail: "", ward: "", province: "" };

    // detail: combine house_number + road-like keys
    const roadKeys = [
      "road",
      "street",
      "residential",
      "pedestrian",
      "footway",
      "cycleway",
      "path",
      "highway",
    ];
    const road = roadKeys.map((k) => address[k]).find(Boolean) || "";
    const house = address["house_number"] || address["housenumber"] || "";
    const detailParts: string[] = [];
    if (house) detailParts.push(String(house).trim());
    if (road) detailParts.push(String(road).trim());
    // sometimes city_district contains useful smaller area names; include if present and not duplicate
    const cityDistrict = address["city_district"] || address["quarter"] || "";
    if (cityDistrict && !detailParts.includes(cityDistrict))
      detailParts.push(String(cityDistrict).trim());

    const detail = detailParts.join(" ").trim();

    // ward: try suburb/neighbourhood/quarter/village/hamlet
    const wardKeys = [
      "suburb",
      "neighbourhood",
      "quarter",
      "village",
      "hamlet",
      "ward",
    ];
    const ward = wardKeys.map((k) => address[k]).find(Boolean) || "";

    // province: prefer state, then city, then county
    const provinceKeys = ["state", "province", "city", "county", "region"];
    const provinceRaw = provinceKeys.map((k) => address[k]).find(Boolean) || "";
    let province = String(provinceRaw || "").trim();

    // Normalize common variants for major cities (e.g., HCM) to include 'Thành phố'
    try {
      const lowercaseProvince = province.toLowerCase();
      if (
        /(hồ chí minh|ho chi minh|\bhcm\b|tp\.?\s*hcm)/i.test(lowercaseProvince)
      ) {
        province = "Thành phố Hồ Chí Minh";
      }
      // other normalization rules can be added here if needed
    } catch {}

    return {
      detail: detail,
      ward: ward,
      province: province,
    };
  }

  // use normalizeProvinceName imported from shared lib

  function cleanDisplayName(s: string) {
    if (!s || typeof s !== "string") return s;
    let out = s;
    // remove postal codes (4-6 digits) that are standalone or preceded/followed by comma/space
    out = out.replace(/\b\d{4,6}\b/g, "");
    // remove country suffixes like ', Việt Nam' or ', Vietnam'
    out = out.replace(/,?\s*(Việt Nam|Vietnam)\s*$/iu, "");
    // collapse repeated commas and whitespace
    out = out.replace(/\s*,\s*/g, ", ");
    out = out.replace(/,{2,}/g, ",");
    out = out.replace(/\s+/g, " ").trim();
    // remove leading/trailing commas/spaces
    out = out.replace(/^,\s*/, "").replace(/\s*,$/, "");

    // Split into parts and normalize city/region parts.
    const parts = out
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    // canonicalize parts: map certain locality tokens to canonical forms
    const normalizedParts = parts.map((p, idx) => {
      const lowercasePart = p.toLowerCase();
      // if it's not the street-first part and mentions Thủ Đức -> map to HCM
      if (idx > 0 && /(^|\s|,|\b)(thành\s*phố\s*)?thủ\s*đức(\b|$)/i.test(p)) {
        return "Thành phố Hồ Chí Minh";
      }
      // normalize common HCM variants
      if (
        lowercasePart.includes("hồ chí minh") ||
        lowercasePart.includes("ho chi minh") ||
        /\b(hcm|tp\.?\s*hcm)\b/i.test(p)
      ) {
        return "Thành phố Hồ Chí Minh";
      }
      return p;
    });

    // remove duplicate consecutive parts (case-insensitive), preserving order
    const deduped: string[] = [];
    const seen = new Set<string>();
    for (const part of normalizedParts) {
      const key = part.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(part.trim());
    }

    // If HCM is present, drop other city-locality tokens that conflict (e.g., 'Thuận An')
    // but keep street (first) and administrative parts (Phường/Quận/Huyện/...)
    const hasHCM = deduped.some((x) => /thành phố hồ chí minh/i.test(x));
    let finalParts = deduped;
    if (hasHCM && finalParts.length > 1) {
      const adminRe =
        /\b(Phường|P\.?|Phuong|Quận|Q\.?|Quan|Huyện|H\.?|Thị xã|Thị trấn|TP|Thành phố)\b/i;
      finalParts = finalParts.filter((p, idx) => {
        if (idx === 0) return true; // keep street
        if (/thành phố hồ chí minh/i.test(p)) return true;
        if (adminRe.test(p)) return true; // keep wards/districts
        return false; // drop other locality names that conflict
      });
    }

    return finalParts.join(", ");
  }

  // Delegate to shared formatter for canonical output
  function formatAddress(raw: string) {
    return raw.trim();
  }

  function handleSelect(suggestion: Suggestion) {
    setSelected(suggestion);
    setSuggestions([]);
    setActiveIndex(-1);
    setQuery(suggestion.display_name);
    onChangeAddress(suggestion.display_name);
    const lat = Number(suggestion.lat);
    const lon = Number(suggestion.lon);
    onSelectCoords(lat, lon);
    setCenter([lat, lon]);

    // Use AI to normalize the address for Vietnam post-2025 reforms
    (async () => {
      try {
        const aiResult = await normalizeAddressWithAI(suggestion.display_name);
        if (aiResult && aiResult.confidence > 0.7) {
          // Update with AI-normalized address if confidence is high
          setQuery(aiResult.normalized);
          onChangeAddress(aiResult.normalized);
          setAiNormalized(true);
          setTimeout(() => setAiNormalized(false), 3000); // Hide badge after 3s

          if (onSelectAddressDetails) {
            onSelectAddressDetails({
              detail: aiResult.detail_address || "",
              ward: aiResult.ward || "",
              province: aiResult.province || "",
            });
          }
        } else {
          // Fallback to original parsing if AI fails or low confidence
          let details = null as any;
          if ((suggestion as any).addressObj) {
            details = mapNominatimAddressToDetails(
              (suggestion as any).addressObj
            );
          } else {
            details = parseAddress(suggestion.display_name || "");
          }
          if (onSelectAddressDetails) {
            onSelectAddressDetails({
              detail: details.detail,
              ward: details.ward,
              province: normalizeProvinceName(details.province),
            });
          }
        }
      } catch (error) {
        console.error("AI normalization failed, using fallback:", error);
        // Fallback to original method
        let details = null as any;
        if ((suggestion as any).addressObj) {
          details = mapNominatimAddressToDetails(
            (suggestion as any).addressObj
          );
        } else {
          details = parseAddress(suggestion.display_name || "");
        }
        if (onSelectAddressDetails) {
          onSelectAddressDetails({
            detail: details.detail,
            ward: details.ward,
            province: normalizeProvinceName(details.province),
          });
        }
      }
    })();
  }

  // helper đã bỏ: cuộn được xử lý bằng hover/click chuột

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(activeIndex + 1, suggestions.length - 1);
      setActiveIndex(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(activeIndex - 1, 0);
      setActiveIndex(prev);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setActiveIndex(-1);
    }
  }

  function MapClickHandler() {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        // set a temporary selected marker
        const tempSuggestion: Suggestion = {
          display_name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          lat: String(lat),
          lon: String(lng),
        };
        setSelected(tempSuggestion);
        setSuggestions([]);
        setQuery(tempSuggestion.display_name);
        onSelectCoords(lat, lng);
        // try reverse geocode to get a better display_name/address
        try {
          const rev = await reverseGeocode(lat, lng);
          if (rev && rev.display_name) {
            const moved = formatAddress(rev.display_name as string);

            // Try AI normalization first
            try {
              const aiResult = await normalizeAddressWithAI(moved);
              if (aiResult && aiResult.confidence > 0.7) {
                const improved: Suggestion = {
                  display_name: aiResult.normalized,
                  lat: String(lat),
                  lon: String(lng),
                };
                setSelected(improved);
                setQuery(aiResult.normalized);
                onChangeAddress(aiResult.normalized);
                setAiNormalized(true);
                setTimeout(() => setAiNormalized(false), 3000); // Hide badge after 3s

                if (onSelectAddressDetails) {
                  onSelectAddressDetails({
                    detail: aiResult.detail_address || "",
                    ward: aiResult.ward || "",
                    province: aiResult.province || "",
                  });
                }
                setCenter([lat, lng]);
                return; // Exit early if AI succeeded
              }
            } catch (aiError) {
              console.error(
                "AI normalization failed, using fallback:",
                aiError
              );
            }

            // Fallback to original method
            const improved: Suggestion = {
              display_name: moved,
              lat: String(lat),
              lon: String(lng),
            };
            setSelected(improved);
            setQuery(moved);
            onChangeAddress(moved);
            try {
              let details = null as any;
              if ((rev as any).addressObj) {
                details = mapNominatimAddressToDetails((rev as any).addressObj);
              } else {
                details = parseAddress(moved || "");
              }
              if (onSelectAddressDetails) {
                onSelectAddressDetails({
                  detail: details.detail,
                  ward: details.ward,
                  province: normalizeProvinceName(details.province),
                });
              }
            } catch {}
          }
        } catch (err) {
          // network or reverse geocode error: log and continue with coords-only marker
          console.error("reverseGeocode (map click) failed", err);
        }
        setCenter([lat, lng]);
      },
    });
    return null;
  }

  const icon = L.icon({
    // Use an inline red SVG marker so the pin appears red regardless of static assets.
    iconUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48">
          <path d="M16 0C9.372 0 4 5.372 4 12c0 9.333 12 24 12 24s12-14.667 12-24C28 5.372 22.628 0 16 0z" fill="#d9534f"/>
          <circle cx="16" cy="12" r="5" fill="white"/>
        </svg>
      `
      ),
    iconSize: [32, 48],
    iconAnchor: [16, 44],
  });

  // debounce: gọi fetchSuggestions khi query thay đổi
  useEffect(() => {
    if (debRef.current) {
      window.clearTimeout(debRef.current);
    }
    if (!query) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    // schedule
    debRef.current = window.setTimeout(() => {
      fetchSuggestions(query).catch((error) =>
        console.error("geocode error", error)
      );
    }, 300);

    return () => {
      if (debRef.current) window.clearTimeout(debRef.current);
    };
    // fetchSuggestions is stable in this file
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Listen for locate control events (requests to reverse geocode) and errors
  useEffect(() => {
    // Yêu cầu quyền vị trí một lần khi component mount để trình duyệt hiển thị hộp thoại
    // khi người dùng lần đầu vào trang. Ta dùng getCurrentPosition (một lần)
    // và bỏ qua kết quả ở đây vì LocateControl sẽ thực hiện locate thực khi người dùng bấm nút GPS.
    try {
      if (
        navigator &&
        navigator.geolocation &&
        typeof navigator.geolocation.getCurrentPosition === "function"
      ) {
        navigator.geolocation.getCurrentPosition(
          () => {
            // quyền được cấp hoặc vị trí có sẵn; không cần xử lý thêm ở đây
          },
          () => {
            // quyền bị từ chối hoặc lỗi; không cần xử lý thêm ở đây, LocateControl sẽ hiển thị lỗi khi người dùng bấm
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
      }
    } catch {}
    async function onRequestReverse(e: Event) {
      const evtDetail = (e as CustomEvent).detail as {
        lat: number;
        lon: number;
        fromGps?: boolean;
      };
      // bắt đầu locate
      setGeoError(null);
      try {
        const rev = await reverseGeocode(evtDetail.lat, evtDetail.lon);
        if (rev && rev.display_name) {
          const display = formatAddress(rev.display_name as string);
          // Luôn cập nhật chuỗi địa chỉ hiển thị trong input
          setQuery(display);
          onChangeAddress(display);
          // Nếu yêu cầu reverse này bắt nguồn từ click thủ công trên map hoặc lựa chọn rõ ràng
          // (không phải từ GPS watch realtime), cập nhật marker selected và center.
          if (!evtDetail.fromGps) {
            onSelectCoords(evtDetail.lat, evtDetail.lon);
            setSelected({
              display_name: display,
              lat: String(evtDetail.lat),
              lon: String(evtDetail.lon),
            });
            setCenter([evtDetail.lat, evtDetail.lon]);
          }
        }
      } catch (error) {
        console.error("reverse geocode error (from locate)", error);
        setGeoError("Không thể lấy địa chỉ");
      } finally {
        // locate finished
      }
    }

    function onLocateError(e: Event) {
      const evtDetail = (e as CustomEvent).detail as { message?: string };
      setGeoError(evtDetail.message || "Không thể lấy vị trí");
      // locate kết thúc/dọn dẹp
    }

    window.addEventListener(
      "map:requestReverse",
      onRequestReverse as EventListener
    );
    window.addEventListener(
      "map:locateErrorUser",
      onLocateError as EventListener
    );
    // sự kiện dạng plugin: GPS located/disabled (từ LocateControl)
    function onGpsLocated(e: Event) {
      const evtDetail = (e as CustomEvent).detail as {
        marker?: any;
        latlng: { lat: number; lng: number };
        accuracy?: number;
      };
      setGpsPos({
        lat: evtDetail.latlng.lat,
        lon: evtDetail.latlng.lng,
        accuracy: evtDetail.accuracy,
      });
      // kích hoạt reverse geocode qua event ứng dụng để cập nhật địa chỉ
      const req = new CustomEvent("map:requestReverse", {
        detail: {
          lat: evtDetail.latlng.lat,
          lon: evtDetail.latlng.lng,
          fromGps: true,
        },
      });
      window.dispatchEvent(req);
    }

    function onGpsDisabled() {
      setGpsPos(null);
    }

    window.addEventListener("gps:located", onGpsLocated as EventListener);
    window.addEventListener("gps:disabled", onGpsDisabled as EventListener);
    return () => {
      window.removeEventListener(
        "map:requestReverse",
        onRequestReverse as EventListener
      );
      window.removeEventListener(
        "map:locateErrorUser",
        onLocateError as EventListener
      );
      window.removeEventListener("gps:located", onGpsLocated as EventListener);
      window.removeEventListener(
        "gps:disabled",
        onGpsDisabled as EventListener
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.mapPicker}>
      <div className={styles.searchRow}>
        {suggestions.length > 0 ? (
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="suggestions-list"
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
            }
            value={query}
            onKeyDown={onInputKeyDown}
            onChange={(e) => {
              // Chỉ cập nhật query nội bộ khi gõ. KHÔNG gọi onChangeAddress ở đây
              // để tránh gán địa chỉ chưa hoàn chỉnh hoặc sai cho component cha.
              setQuery(e.target.value);
            }}
            placeholder="Nhập địa chỉ (ví dụ: hẻm, số, tên đường, phường, tỉnh)"
            className={stylesBasicForm.input}
          />
        ) : (
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="false"
            aria-controls="suggestions-list"
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
            }
            value={query}
            onKeyDown={onInputKeyDown}
            onChange={(e) => {
              // Only update local query while typing. Do NOT call onChangeAddress here to
              // avoid assigning partial or incorrect addresses to the parent.
              setQuery(e.target.value);
            }}
            placeholder="Nhập địa chỉ (ví dụ: số, hẻm, tên đường, phường, tỉnh)"
            className={stylesBasicForm.input}
          />
        )}
        {/* control locate của Leaflet sẽ được thêm vào map; giữ phần hiển thị loading/lỗi ở đây */}
        {aiNormalizing && (
          <div className={styles.aiNormalizingIndicator}>
            <svg className={styles.aiSpinner} viewBox="0 0 24 24">
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill="currentColor"
              />
            </svg>
            <span>AI đang chuẩn hóa địa chỉ...</span>
          </div>
        )}
        {aiNormalized && (
          <div className={styles.aiSuccessIndicator}>
            <svg className={styles.aiCheckIcon} viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>✓ AI đã chuẩn hóa địa chỉ</span>
          </div>
        )}
        {geoError && <div className={styles.geoError}>{geoError}</div>}
      </div>

      {suggestions.length > 0 && (
        <div
          id="suggestions-list"
          className={styles.suggestions}
          role="listbox"
          aria-label="Đề xuất địa chỉ"
        >
          {suggestions.map((suggestion, idx) =>
            activeIndex === idx ? (
              <div
                id={`suggestion-${idx}`}
                key={`${suggestion.lat}-${suggestion.lon}`}
                role="option"
                aria-selected="true"
                className={styles.activeSuggestion}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(-1)}
                onClick={() => handleSelect(suggestion)}
              >
                {suggestion.display_name}
              </div>
            ) : (
              <div
                id={`suggestion-${idx}`}
                key={`${suggestion.lat}-${suggestion.lon}`}
                role="option"
                aria-selected="false"
                className={""}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(-1)}
                onClick={() => handleSelect(suggestion)}
              >
                {suggestion.display_name}
              </div>
            )
          )}
        </div>
      )}

      <div className={styles.mapWrap}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: 300 }}
          attributionControl={false}
        >
          <TileLayer
            attribution={""}
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler />
          <LocateControl />
          {/* Hiển thị overlay GPS: marker riêng và vòng chính xác khi có */}
          {gpsPos && (
            <>
              {gpsPos.accuracy ? (
                <Circle
                  center={[gpsPos.lat, gpsPos.lon]}
                  radius={gpsPos.accuracy}
                  pathOptions={{
                    color: "#3b82f6",
                    fillColor: "#3b82f6",
                    fillOpacity: 0.08,
                    weight: 1,
                  }}
                />
              ) : null}
              {/* không hiển thị marker thiết bị để ý (intentionally omitted): dùng vòng chính xác cho vị trí realtime */}
            </>
          )}
          {selected && (
            <>
              <Marker
                position={[Number(selected.lat), Number(selected.lon)]}
                icon={icon}
              />
              <FlyTo lat={Number(selected.lat)} lon={Number(selected.lon)} />
            </>
          )}
        </MapContainer>
        {/* Overlay nhỏ hiển thị Vĩ độ/Kinh độ (không tương tác) khi có marker được chọn */}
        {selected && (
          <div className={styles.mapLatLon} aria-hidden="true">
            <div className={styles.mapLatLonLabel}>Vĩ độ, Kinh độ</div>
            <div className={styles.mapLatLonValue}>
              {Number(selected.lat).toFixed(6)},{" "}
              {Number(selected.lon).toFixed(6)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Một component nhỏ thêm control locate giống Leaflet vào bản đồ sử dụng API map.locate().
function LocateControl() {
  const map = useMap();
  useEffect(() => {
    let controlContainer: HTMLElement | null = null;
    // trạng thái giữ bên trong closure
    let currentMarker: L.Layer | null = null;
    let accuracyCircle: L.Circle | null = null;

    // các tuỳ chọn mặc định tương tự plugin gốc
    const defaults: any = {
      autoActive: false,
      autoCenter: false,
      maxZoom: null,
      textErr: "",
      callErr: null,
      style: { radius: 6, color: "#c20", fillColor: "#f23" },
      marker: null,
      accuracy: true,
      title: "Sử dụng vị trí của tôi",
      position: "bottomright",
      transform: (latlng: L.LatLng) => latlng,
      setView: false,
    };

    const GpsControl = L.Control.extend({
      options: defaults,
      onAdd: function () {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control leaflet-gps-control"
        );
        const btn = L.DomUtil.create(
          "a",
          "leaflet-gps-btn",
          container
        ) as HTMLAnchorElement;
        btn.href = "#";
        btn.title = this.options.title || defaults.title;
        btn.setAttribute("role", "button");
        btn.setAttribute("aria-label", this.options.title || defaults.title);
        btn.tabIndex = 0;
        btn.innerHTML = `<img src="/leaflet/gps.png" alt="" width="20" height="20" style="display:block;"/>`;
        L.DomEvent.disableClickPropagation(container);

        const toggle = (ev?: Event) => {
          if (ev) L.DomEvent.preventDefault(ev);
          try {
            // Với hành vi một lần, chỉ gọi activate để thực hiện locate một lần.
            this.activate();
            // cung cấp phản hồi trực quan tạm thời bằng cách thêm/bỏ class
            if (controlContainer) {
              const btnEl = controlContainer.querySelector(
                ".leaflet-gps-btn"
              ) as HTMLElement | null;
              if (btnEl) {
                btnEl.classList.add("gps-pulse");
                setTimeout(() => btnEl.classList.remove("gps-pulse"), 1500);
              }
            }
          } catch {
            console.error("GPS toggle error");
          }
        };

        btn.addEventListener("click", toggle as any);
        btn.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            toggle();
          }
        });

        controlContainer = container;
        return container;
      },

      // các phương thức để điều khiển kích hoạt
      activate: function () {
        try {
          // locate một lần: không bắt watch, chỉ yêu cầu vị trí hiện tại
          map.locate({
            watch: false,
            setView: !!this.options.setView,
            maxZoom: this.options.maxZoom ?? undefined,
            enableHighAccuracy: true,
          });
        } catch {
          console.error("activate error");
        }
      },

      deactivate: function () {
        try {
          // Với hành vi một lần thì không có gì để dừng, nhưng vẫn phát sự kiện disabled
          // để ứng dụng có thể xoá overlay nếu cần.
          try {
            const ev = new CustomEvent("gps:disabled", {
              detail: { marker: currentMarker },
            });
            window.dispatchEvent(ev);
          } catch {}
        } catch {
          console.error("deactivate error");
        }
      },

      getLocation: function () {
        // trả về latlng và marker nếu có
        let latlng = null;
        if (currentMarker && (currentMarker as any).getLatLng) {
          latlng = (currentMarker as any).getLatLng();
        }
        return { latlng, marker: currentMarker };
      },
    });

    const ctrl = new (GpsControl as any)({ position: defaults.position });
    map.addControl(ctrl);

    function onLocationFound(e: L.LocationEvent) {
      const accuracy = (e as any).accuracy as number | undefined;

      // tuỳ chọn transform có thể có trên instance control nếu cần; fallback là identity
      let transformed = e.latlng;
      try {
        // đọc transform từ tuỳ chọn control nếu có
        const controlOptions = (ctrl as any).options || {};
        if (typeof controlOptions.transform === "function") {
          const candidate = controlOptions.transform(e.latlng);
          if (
            candidate &&
            typeof candidate.lat === "number" &&
            typeof candidate.lng === "number"
          )
            transformed = L.latLng(candidate.lat, candidate.lng);
        }
      } catch {
        // ignore transform errors
      }

      // xử lý marker: dùng marker tuỳ chọn nếu cung cấp hoặc circle marker mặc định
      try {
        const controlOptions = (ctrl as any).options || {};
        if (
          controlOptions.marker &&
          controlOptions.marker instanceof L.Marker
        ) {
          if (!currentMarker) {
            currentMarker = controlOptions.marker;
            (currentMarker as any).setLatLng(transformed).addTo(map);
          } else {
            (currentMarker as any).setLatLng(transformed);
          }
        } else {
          // mặc định: circle marker với style
          if (!currentMarker) {
            currentMarker = L.circleMarker(
              transformed,
              controlOptions.style || {
                radius: 6,
                color: "#c20",
                fillColor: "#f23",
              }
            ).addTo(map);
          } else {
            (currentMarker as any).setLatLng(transformed);
          }
        }
      } catch {
        console.error("marker update error");
      }

      // vòng chính xác (accuracy circle)
      try {
        const controlOptions = (ctrl as any).options || {};
        if (controlOptions.accuracy && accuracy && accuracy > 0) {
          if (!accuracyCircle) {
            accuracyCircle = L.circle([transformed.lat, transformed.lng], {
              radius: accuracy,
              className: "gps-accuracy-circle",
              color: "#34d399",
              weight: 1,
              opacity: 0.45,
              fillColor: "#34d399",
              fillOpacity: 0.12,
            }).addTo(map);
          } else {
            accuracyCircle.setLatLng([transformed.lat, transformed.lng]);
            accuracyCircle.setRadius(accuracy);
          }
        }
      } catch {
        console.error("accuracy circle error");
      }

      // hành vi autoCenter/setView
      try {
        const controlOptions = (ctrl as any).options || {};
        if (controlOptions.autoCenter || controlOptions.setView) {
          const mz = controlOptions.maxZoom || map.getZoom();
          map.setView([transformed.lat, transformed.lng], mz);
        }
      } catch {
        // ignore
      }

      // phát sự kiện dạng plugin và sự kiện ứng dụng hiện có để reverse geocode
      try {
        const ev = new CustomEvent("gps:located", {
          detail: { marker: currentMarker, latlng: transformed, accuracy },
        });
        window.dispatchEvent(ev);
      } catch {}

      const appEv = new CustomEvent("map:locationfound", {
        detail: { lat: transformed.lat, lon: transformed.lng },
      });
      window.dispatchEvent(appEv);
    }

    function onLocationError(e: L.ErrorEvent) {
      const ev = new CustomEvent("map:locationerror", {
        detail: { message: e.message },
      });
      window.dispatchEvent(ev);
      // xoá visuals và dọn trạng thái watch
      try {
        if (accuracyCircle) {
          map.removeLayer(accuracyCircle);
          accuracyCircle = null;
        }
        if (currentMarker) {
          map.removeLayer(currentMarker);
          currentMarker = null;
        }
        if (controlContainer) {
          const btnEl = controlContainer.querySelector(
            ".leaflet-gps-btn"
          ) as HTMLElement | null;
          if (btnEl) btnEl.classList.remove("gps-watching");
        }
      } catch {}
    }

    map.on("locationfound", onLocationFound as any);
    map.on("locationerror", onLocationError as any);

    return () => {
      try {
        map.off("locationfound", onLocationFound as any);
        map.off("locationerror", onLocationError as any);
        try {
          map.stopLocate();
        } catch {}
        try {
          if (accuracyCircle) {
            map.removeLayer(accuracyCircle);
            accuracyCircle = null;
          }
        } catch {}
        try {
          if (currentMarker) {
            map.removeLayer(currentMarker);
            currentMarker = null;
          }
        } catch {}
        map.removeControl(ctrl);
        try {
          if (controlContainer) {
            const btnEl = controlContainer.querySelector(
              ".leaflet-gps-btn"
            ) as HTMLElement | null;
            if (btnEl) btnEl.classList.remove("gps-watching");
          }
        } catch {}
      } catch {}
    };
  }, [map]);

  // keep app-level reverse geocode handler as before
  useEffect(() => {
    async function onFound(e: Event) {
      const evtDetail = (e as CustomEvent).detail as {
        lat: number;
        lon: number;
      };
      try {
        const req = new CustomEvent("map:requestReverse", {
          detail: { lat: evtDetail.lat, lon: evtDetail.lon },
        });
        window.dispatchEvent(req);
      } catch {
        console.error("reverse dispatch error");
      }
    }
    function onError(e: Event) {
      const evtDetail = (e as CustomEvent).detail as { message?: string };
      const ev = new CustomEvent("map:locateErrorUser", {
        detail: { message: evtDetail.message || "Không thể lấy vị trí" },
      });
      window.dispatchEvent(ev);
    }
    window.addEventListener("map:locationfound", onFound as EventListener);
    window.addEventListener("map:locationerror", onError as EventListener);
    return () => {
      window.removeEventListener("map:locationfound", onFound as EventListener);
      window.removeEventListener("map:locationerror", onError as EventListener);
    };
  }, []);

  return null;
}
