#!/usr/bin/env bun
console.log("🚀 Setting up Say 2 Hand development environment...");

// Check if bun is available
try {
  const bunVersion = Bun.version;
  console.log(`✅ Bun ${bunVersion} detected`);
} catch (error) {
  console.error(
    "❌ Bun is not installed. Please install Bun first: https://bun.sh"
  );
  process.exit(1);
}

// Install dependencies
console.log("📦 Installing dependencies...");
await Bun.spawn(["bun", "install"], {
  cwd: process.cwd(),
  stdio: ["inherit", "inherit", "inherit"],
});

// Setup environment files
console.log("⚙️ Setting up environment files...");
const fs = require("fs");
const path = require("path");

// Backend .env
const backendEnvExample = path.join("apps", "backend", ".env.example");
const backendEnv = path.join("apps", "backend", ".env");

if (fs.existsSync(backendEnvExample) && !fs.existsSync(backendEnv)) {
  fs.copyFileSync(backendEnvExample, backendEnv);
  console.log("✅ Backend .env created");
}

// Frontend .env (use .env as the canonical env file)
const frontendEnvExample = path.join("apps", "web", ".env.example");
const frontendEnv = path.join("apps", "web", ".env");

if (fs.existsSync(frontendEnvExample) && !fs.existsSync(frontendEnv)) {
  fs.copyFileSync(frontendEnvExample, frontendEnv);
  console.log("✅ Frontend .env created");
}

// Start databases with Docker if available
console.log("🐳 Starting databases...");
try {
  await Bun.spawn(
    [
      "docker-compose",
      "-f",
      "tools/docker/docker-compose.yml",
      "up",
      "-d",
      "mongodb",
      "redis",
    ],
    {
      cwd: process.cwd(),
      stdio: ["inherit", "inherit", "inherit"],
    }
  );

  console.log("⏳ Waiting for databases to be ready...");
  await new Promise((resolve) => setTimeout(resolve, 10000));

  console.log("✅ Setup complete! Run 'bun dev' to start development.");
} catch (error) {
  console.log("⚠️ Docker not available or failed to start databases");
  console.log("Please make sure MongoDB and Redis are running manually");
}

console.log("\n📝 Next steps:");
console.log("1. Configure your .env files with proper values");
console.log("2. Run 'bun dev' to start development servers");
console.log("3. Open http://localhost:3000 for frontend");
console.log("4. API will be available at http://localhost:8080");
