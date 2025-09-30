# API Documentation

## Base URL

- Development: `http://localhost:8080`
- Production: `https://api.say2hand.com`

## Authentication

API sử dụng JWT (JSON Web Tokens) để authentication. Token phải được gửi trong header:

```
Authorization: Bearer <your-token>
```

## Endpoints

### Authentication

#### POST /auth/register

Đăng ký tài khoản mới

**Request Body:**

```json
{
  "email": "user@example.com",
  "full_name": "Nguyen Van A",
  "password": "password123",
  "phone_number": "0123456789"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "full_name": "Nguyen Van A",
      "role": "user",
      "status": "active"
    },
    "access_token": "jwt-token"
  }
}
```

#### POST /auth/login

Đăng nhập

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Users

#### GET /users/profile

Lấy thông tin profile của user hiện tại (cần authentication)

#### PUT /users/profile

Cập nhật profile

### Posts

#### GET /posts

Lấy danh sách posts với pagination

**Query Parameters:**

- `page` (number): Trang hiện tại (default: 1)
- `limit` (number): Số items per page (default: 20)
- `category` (string): Lọc theo category
- `search` (string): Tìm kiếm theo title/description

#### POST /posts

Tạo post mới (cần authentication)

#### GET /posts/:id

Lấy chi tiết post

#### PUT /posts/:id

Cập nhật post (chỉ owner)

#### DELETE /posts/:id

Xóa post (chỉ owner hoặc admin)

### Categories

#### GET /categories

Lấy danh sách categories

### Upload

#### POST /upload/image

Upload hình ảnh

**Request:** `multipart/form-data` với field `file`

**Response:**

```json
{
  "success": true,
  "data": {
    "url": "https://storage.googleapis.com/bucket/image.jpg"
  }
}
```

## Error Responses

Tất cả error responses có format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": ["validation error"]
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error
