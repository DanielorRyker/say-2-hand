// Script để replace tất cả import axios từ "axios" thành "@/lib/api-client"
const fs = require("fs");
const path = require("path");

function replaceInFile(filePath) {
  try {
    // SKIP file api-client.ts để tránh replace chính nó
    if (filePath.includes("api-client.ts")) {
      return false;
    }

    // Đọc file với encoding UTF-8 BOM để tránh lỗi
    const content = fs.readFileSync(filePath, "utf8");
    const newContent = content.replace(
      /import axios from ["']axios["'];/g,
      'import axios from "@/lib/api-client";'
    );

    if (content !== newContent) {
      // Ghi file với encoding UTF-8 (không BOM)
      fs.writeFileSync(filePath, newContent, { encoding: "utf8" });
      console.log(`✅ Đã sửa: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`❌ Lỗi khi xử lý ${filePath}:`, err.message);
    return false;
  }
}

function walkDir(dir) {
  let changedCount = 0;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      changedCount += walkDir(filePath);
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      if (replaceInFile(filePath)) {
        changedCount++;
      }
    }
  }

  return changedCount;
}

const srcDir = path.join(__dirname, "src");
console.log("🔄 Đang thay thế import axios...\n");
const changed = walkDir(srcDir);
console.log(`\n✨ Hoàn thành! Đã sửa ${changed} file(s).`);
