# 🚀 Say 2 Hand - Modern Marketplace Platform

Say 2 Hand là một nền tảng marketplace hiện đại được xây dựng với Bun runtime, Next.js, và NestJS trong kiến trúc monorepo.

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Công nghệ](#️-công-nghệ)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Bắt đầu nhanh](#-bắt-đầu-nhanh)
- [Development](#️-development)
- [Deployment](#-deployment)
- [Đóng góp](#-đóng-góp)

## ✨ Tính năng

- 🔐 **Authentication & Authorization** - JWT-based với role management
- 📱 **Responsive Design** - Tối ưu cho mọi thiết bị
- 🖼️ **File Upload** - Upload hình ảnh với Google Cloud Storage
- 💬 **Real-time Chat** - WebSocket cho tin nhắn real-time
- 🔍 **Search & Filter** - Tìm kiếm và lọc sản phẩm mạnh mẽ
- 📍 **Location-based** - Tích hợp Google Maps
- 🎨 **Modern UI** - Tailwind CSS với components tái sử dụng

## 🛠️ Công nghệ

### Runtime & Tools

- **Bun** - JavaScript runtime và package manager
- **Turborepo** - Build system và monorepo tool
- **Docker** - Containerization
- **GitHub Actions** - CI/CD

### Frontend

- **Next.js 15** - React framework với App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React 19** - UI library

### Backend

- **NestJS** - Node.js framework
- **MongoDB** - Database
- **Redis** - Caching và session storage
- **Socket.IO** - Real-time communication

## 📁 Cấu trúc dự án

```
say-2-hand/
├── apps/                          # Ứng dụng chính
│   ├── web/                      # Next.js Frontend
│   └── backend/                  # NestJS Backend
├── packages/                     # Shared packages
│   ├── types/                   # TypeScript types
│   ├── config/                  # Shared configurations
│   └── ui/                      # Shared UI components
├── tools/                       # Development tools
│   ├── docker/                 # Docker configurations
│   └── scripts/                # Setup và deploy scripts
├── .github/                     # GitHub workflows
├── bunfig.toml                 # Bun configuration
└── turbo.json                  # Turborepo configuration
```

## 🚀 Bắt đầu nhanh

### Yêu cầu hệ thống

- **Bun** >= 1.0.0
- **Docker** (tùy chọn)
- **MongoDB** (hoặc Docker)
- **Redis** (hoặc Docker)

### Cài đặt

1. **Clone repository**

   ```bash
   git clone https://github.com/DanielorRyker/say-2-hand.git
   cd say-2-hand
   ```

2. **Chạy setup script**

   ```bash
   bun run setup
   ```

3. **Cấu hình environment**

   ```bash
   # Cấu hình backend
   cp apps/backend/.env.example apps/backend/.env

   # Cấu hình frontend
   cp apps/web/.env.example apps/web/.env.local
   ```

4. **Khởi động development**
   ```bash
   bun dev
   ```

### Truy cập ứng dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/api

## ⚡️ Development

### Commands chính

```bash
# Development
bun dev                    # Start tất cả services
bun dev --filter=web      # Chỉ start frontend
bun dev --filter=backend  # Chỉ start backend

# Build
bun run build             # Build tất cả apps
bun run build --filter=web # Build chỉ frontend

# Testing
bun run test             # Run tất cả tests
bun run lint             # Run ESLint
bun run type-check       # TypeScript checking

# Database
bun run db:migrate       # Run database migrations
bun run db:seed         # Seed database với sample data
```

### Thêm dependencies

```bash
# Thêm dependency cho specific app
cd apps/web
bun add package-name

# Thêm shared dependency
bun add package-name -w
```

### Tạo component mới

```bash
# Frontend component
cd apps/web/src/components/ui
# Tạo component theo pattern có sẵn

# Backend module
cd apps/backend/src/modules
nest g module module-name
nest g controller module-name
nest g service module-name
```

## 🐳 Docker Development

### Sử dụng Docker Compose

```bash
# Start tất cả services với Docker
bun run docker:dev

# Chỉ start databases
docker-compose -f tools/docker/docker-compose.yml up -d mongodb redis

# Xem logs
docker-compose -f tools/docker/docker-compose.yml logs -f
```

## 🚢 Deployment

### Production Build

```bash
# Build cho production
bun run build

# Chạy production build local
bun run start
```

### Docker Deployment

```bash
# Build và push images
docker build -f apps/backend/Dockerfile -t say2hand-backend .
docker build -f apps/web/Dockerfile -t say2hand-frontend .

# Hoặc sử dụng docker-compose
docker-compose -f tools/docker/docker-compose.prod.yml up -d
```

### Environment Variables

#### Backend (.env)

```bash
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb://localhost:27017/say2hand
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

#### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-nextauth-secret
```

## 🏗️ Architecture

### Frontend Architecture

- **App Router** - Next.js 15 app directory structure
- **Component-driven** - Reusable UI components
- **Custom Hooks** - Business logic separation
- **State Management** - React state + custom stores

### Backend Architecture

- **Modular** - Feature-based modules
- **Repository Pattern** - Data access layer
- **Guards & Interceptors** - Authentication & logging
- **DTOs** - Data validation

### Database Schema

- **Users** - User profiles và authentication
- **Posts** - Marketplace listings
- **Categories** - Product categories
- **Messages** - Chat system
- **Conversations** - Message threads

## 🤝 Đóng góp

1. **Fork** repository
2. **Tạo feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

### Coding Standards

- **TypeScript** - Bắt buộc type safety
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Conventional Commits** - Commit message format

## 📝 License

MIT License - xem [LICENSE](LICENSE) file để biết chi tiết.

## 🆘 Hỗ trợ

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/DanielorRyker/say-2-hand/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DanielorRyker/say-2-hand/discussions)

---

**Made with ❤️ by the Say 2 Hand team**
