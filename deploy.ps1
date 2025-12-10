# Say2Hand Deployment Script for Windows
# Tu dong build va deploy toan bo he thong

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('development', 'production')]
    [string]$Environment = 'production',
    
    [Parameter(Mandatory=$false)]
    [switch]$Clean = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$StopOnly = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Say2Hand Deployment Script" -ForegroundColor Cyan
Write-Host "  Environment: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiem tra Docker dang chay
Write-Host "[1/8] Kiem tra Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    docker-compose --version | Out-Null
    Write-Host "OK - Docker va Docker Compose da cai dat" -ForegroundColor Green
} catch {
    Write-Host "LOI: Docker hoac Docker Compose chua duoc cai dat!" -ForegroundColor Red
    Write-Host "Vui long cai dat Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Dừng containers hiện tại
Write-Host ""
Write-Host "[2/8] Dừng containers hiện tại..." -ForegroundColor Yellow
if ($Environment -eq 'production') {
    docker-compose -f docker-compose.prod.yml down
} else {
    docker-compose -f tools/docker/docker-compose.yml down
}
Write-Host "✓ Đã dừng containers" -ForegroundColor Green

if ($StopOnly) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Deployment đã dừng!" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    exit 0
}

# Clean build artifacts nếu cần
if ($Clean) {
    Write-Host ""
    Write-Host "[3/8] Xóa build artifacts cũ..." -ForegroundColor Yellow
    
    # Clean backend
    if (Test-Path "apps\backend\dist") {
        Remove-Item -Recurse -Force "apps\backend\dist"
        Write-Host "  ✓ Đã xóa apps/backend/dist" -ForegroundColor Green
    }
    
    # Clean frontend
    if (Test-Path "apps\web\.next") {
        Remove-Item -Recurse -Force "apps\web\.next"
        Write-Host "  ✓ Đã xóa apps/web/.next" -ForegroundColor Green
    }
    
    Write-Host "✓ Clean hoàn tất" -ForegroundColor Green
}

# Build project nếu không skip
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "[4/8] Build project..." -ForegroundColor Yellow
    bun run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Build thất bại!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Build thành công" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[4/8] Bỏ qua build (--SkipBuild)" -ForegroundColor Yellow
}

# Kiểm tra file .env
Write-Host ""
Write-Host "[5/8] Kiểm tra file .env..." -ForegroundColor Yellow

if ($Environment -eq 'production') {
    if (-not (Test-Path ".env.production")) {
        Write-Host "✗ Không tìm thấy .env.production!" -ForegroundColor Red
        Write-Host "Hãy copy .env.production.example thành .env.production và cập nhật thông tin" -ForegroundColor Yellow
        
        if (Test-Path ".env.production.example") {
            Write-Host ""
            Write-Host "Bạn có muốn copy .env.production.example -> .env.production không? (y/n)" -ForegroundColor Yellow
            $response = Read-Host
            if ($response -eq 'y') {
                Copy-Item ".env.production.example" ".env.production"
                Write-Host "✓ Đã tạo .env.production từ template" -ForegroundColor Green
                Write-Host "⚠ Lưu ý: Hãy mở .env.production và cập nhật thông tin thực tế!" -ForegroundColor Yellow
            } else {
                exit 1
            }
        } else {
            exit 1
        }
    }
    Write-Host "✓ File .env.production tồn tại" -ForegroundColor Green
}

# Build Docker images
Write-Host ""
Write-Host "[6/8] Build Docker images..." -ForegroundColor Yellow

if ($Environment -eq 'production') {
    docker-compose -f docker-compose.prod.yml build --no-cache
} else {
    docker-compose -f tools/docker/docker-compose.yml build
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build Docker images thất bại!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build Docker images thành công" -ForegroundColor Green

# Start containers
Write-Host ""
Write-Host "[7/8] Khởi động containers..." -ForegroundColor Yellow

if ($Environment -eq 'production') {
    docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
} else {
    docker-compose -f tools/docker/docker-compose.yml up -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Khởi động containers thất bại!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Containers đã khởi động" -ForegroundColor Green

# Health check
Write-Host ""
Write-Host "[8/8] Kiểm tra health của services..." -ForegroundColor Yellow
Write-Host "Đợi 15 giây để services khởi động..." -ForegroundColor Gray
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "Trạng thái containers:" -ForegroundColor Cyan
if ($Environment -eq 'production') {
    docker-compose -f docker-compose.prod.yml ps
} else {
    docker-compose -f tools/docker/docker-compose.yml ps
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment hoàn tất!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ứng dụng đang chạy tại:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8080" -ForegroundColor White
Write-Host "  MongoDB:  mongodb://localhost:27017" -ForegroundColor White
Write-Host "  Redis:    redis://localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "Xem logs:" -ForegroundColor Cyan
if ($Environment -eq 'production') {
    Write-Host "  docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor Gray
    Write-Host "  docker-compose -f docker-compose.prod.yml logs -f backend" -ForegroundColor Gray
    Write-Host "  docker-compose -f docker-compose.prod.yml logs -f frontend" -ForegroundColor Gray
} else {
    Write-Host "  docker-compose -f tools/docker/docker-compose.yml logs -f" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Dừng services:" -ForegroundColor Cyan
if ($Environment -eq 'production') {
    Write-Host "  .\deploy.ps1 -StopOnly" -ForegroundColor Gray
    Write-Host "  docker-compose -f docker-compose.prod.yml down" -ForegroundColor Gray
} else {
    Write-Host "  docker-compose -f tools/docker/docker-compose.yml down" -ForegroundColor Gray
}
Write-Host ""
