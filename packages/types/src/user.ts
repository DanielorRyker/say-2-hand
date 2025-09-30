import { BaseEntity } from "./api";

// User Types
export interface User extends BaseEntity {
  email: string;
  full_name: string;
  phone_number?: string;
  avatar?: string;
  role: "user" | "admin";
  status: "active" | "inactive" | "banned";
}

export interface CreateUserDto {
  email: string;
  full_name: string;
  password_hash: string;
  phone_number?: string;
}

export interface UpdateUserDto {
  full_name?: string;
  phone_number?: string;
  avatar?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  full_name: string;
  password: string;
  phone_number?: string;
}
