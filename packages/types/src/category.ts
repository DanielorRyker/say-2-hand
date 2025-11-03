import { BaseEntity } from "./api";

// Category Types
export interface Category extends BaseEntity {
  name: string;
  slug: string;
  image?: string;
  icon?: string;
  parent_id?: Category | string | null;
  posts_count?: number;
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  image?: string;
  icon?: string;
  parent_id?: string | null;
}

export interface UpdateCategoryDto {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  icon?: string;
  parent_id?: string | null;
}
