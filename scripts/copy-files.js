#!/usr/bin/env node

/**
 * Copy build files from separate directories to main dist directory
 * This ensures both ESM and UMD builds are available in the expected locations
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function log(message, type = "info") {
  const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
  };

  const color = colors[type] || colors.reset;
  console.log(`${color}${message}${colors.reset}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    log(`✓ Copied ${path.basename(src)} to dist/`);
    return true;
  } else {
    log(`✗ Source file not found: ${src}`, "error");
    return false;
  }
}

export function main() {
  log("📦 Copying build files to main dist directory...");

  const rootDist = path.resolve(__dirname, "../dist");
  const esmDist = path.resolve(__dirname, "../dist/esm");
  const umdDist = path.resolve(__dirname, "../dist/umd");

  // Ensure main dist directory exists
  ensureDir(rootDist);

  let success = true;

  // Copy ESM files
  if (fs.existsSync(esmDist)) {
    const esmFiles = fs.readdirSync(esmDist);
    esmFiles.forEach((file) => {
      if (file.endsWith(".js") || file.endsWith(".js.map")) {
        const srcPath = path.join(esmDist, file);
        const destPath = path.join(rootDist, file);
        if (!copyFile(srcPath, destPath)) {
          success = false;
        }
      }
    });
  } else {
    log(`✗ ESM directory not found: ${esmDist}`, "error");
    success = false;
  }

  // Copy UMD files
  if (fs.existsSync(umdDist)) {
    const umdFiles = fs.readdirSync(umdDist);
    umdFiles.forEach((file) => {
      if (file.endsWith(".js") || file.endsWith(".js.map")) {
        const srcPath = path.join(umdDist, file);
        const destPath = path.join(rootDist, file);
        if (!copyFile(srcPath, destPath)) {
          success = false;
        }
      }
    });
  } else {
    log(`✗ UMD directory not found: ${umdDist}`, "error");
    success = false;
  }

  // Copy TypeScript declaration if it exists
  const dtsSrc = path.join(esmDist, "radikari-chat.d.ts");
  const dtsDest = path.join(rootDist, "radikari-chat.d.ts");
  if (fs.existsSync(dtsSrc)) {
    copyFile(dtsSrc, dtsDest);
  }

  if (success) {
    log("\n✅ All files copied successfully!");

    // List final dist contents
    const finalFiles = fs.readdirSync(rootDist);
    log("\n📋 Final dist directory contents:");
    finalFiles.forEach((file) => {
      const filePath = path.join(rootDist, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024).toFixed(2);
      log(`  ${file} (${size} KB)`);
    });
  } else {
    log("\n❌ Some files failed to copy", "error");
    process.exit(1);
  }
}

main();
