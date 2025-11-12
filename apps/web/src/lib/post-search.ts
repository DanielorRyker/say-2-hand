import { apiClient } from "./api-client";

export interface SearchPostParams {
  q?: string; // Từ khóa tìm kiếm (hỗ trợ tiếng Việt có/không dấu)
  category_id?: string;
  transaction_type?: string;
  condition?: string;
  min_price?: number;
  max_price?: number;
  tags?: string[];
  province?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface GeoSearchPostParams extends SearchPostParams {
  lat?: number;
  lng?: number;
  max_distance?: number; // km
}

export interface SearchPostResponse {
  data: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Full-text search posts với hỗ trợ tiếng Việt không dấu
 */
export async function searchPosts(
  params: SearchPostParams
): Promise<SearchPostResponse> {
  const response = await apiClient.get("/posts/search", { params });
  return response.data;
}

/**
 * Geospatial search - Tìm posts gần vị trí hiện tại
 */
export async function geoSearchPosts(
  params: GeoSearchPostParams
): Promise<SearchPostResponse> {
  const response = await apiClient.get("/posts/search/nearby", { params });
  return response.data;
}

/**
 * Auto-generate tags cho post
 */
export async function generatePostTags(postId: string): Promise<string[]> {
  const response = await apiClient.post(`/posts/${postId}/generate-tags`);
  return response.data;
}
