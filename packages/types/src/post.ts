import { BaseEntity } from "./api";
import { User } from "./user";

// Post Types
export interface Post extends BaseEntity {
  title: string;
  description?: string;
  category: string;
  status: "active" | "sold" | "hidden";
  price?: number;
  currency: "VND" | "USD";
  location: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  owner: User | string;
  views: number;
  likes: number;
}

export interface CreatePostDto {
  title: string;
  description?: string;
  category: string;
  price?: number;
  currency: "VND" | "USD";
  location: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images?: string[];
}

export interface UpdatePostDto {
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: "VND" | "USD";
  location?: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images?: string[];
  status?: "active" | "sold" | "hidden";
}
