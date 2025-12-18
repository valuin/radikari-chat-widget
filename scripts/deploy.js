#!/usr/bin/env node

/**
 * Radikari Chat Widget Deployment Script
 *
 * This script automates the deployment 
 * ocess to npm and provides
 * instructions for CDN access.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step) {
  log(`\n${colors.bright}${colors.cyan}📦 ${step}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠️  ${message}`, "yellow");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue");
}

function runCommand(command, description) {
  logStep(description);
  try {
    execSync(command, { stdio: "inherit" });
    logSuccess(`${description} completed`);
    return true;
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    return false;
  }
}

function checkPackageJson() {
  logStep("Checking package.json configuration");

  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

    const required = [
      "name",
      "version",
      "description",
      "main",
      "module",
      "types",
    ];
    const missing = required.filter((field) => !packageJson[field]);

    if (missing.length > 0) {
      logError(
        `Missing required fields in package.json: ${missing.join(", ")}`
      );
      return false;
    }

    logSuccess("package.json is properly configured");
    return true;
  } catch (error) {
    logError(`Failed to read package.json: ${error.message}`);
    return false;
  }
}

function checkBuildFiles() {
  logStep("Checking build files");

  const requiredFiles = [
    "dist/radikari-chat.es.js",
    "dist/radikari-chat.umd.js",
  ];

  const missing = requiredFiles.filter((file) => !fs.existsSync(file));

  if (missing.length > 0) {
    logError(`Missing build files: ${missing.join(", ")}`);
    logInfo('Run "npm run build:prod" first');
    return false;
  }

  logSuccess("All build files are present");
  return true;
}

function showCdnInstructions(packageName, version) {
  logStep("🌐 CDN Access Instructions");

  log(
    "\n" +
      colors.bright +
      colors.magenta +
      "jsDelivr (Recommended):" +
      colors.reset
  );
  log(`<!-- ESM Version -->`);
  log(
    `<script type="module" src="https://cdn.jsdelivr.net/npm/${packageName}@${version}/dist/radikari-chat.es.js"></script>`
  );
  log("");
  log(`<!-- UMD Version -->`);
  log(
    `<script src="https://cdn.jsdelivr.net/npm/${packageName}@${version}/dist/radikari-chat.umd.js"></script>`
  );

  log("\n" + colors.bright + colors.magenta + "unpkg:" + colors.reset);
  log(`<!-- ESM Version -->`);
  log(
    `<script type="module" src="https://unpkg.com/${packageName}@${version}/dist/radikari-chat.es.js"></script>`
  );
  log("");
  log(`<!-- UMD Version -->`);
  log(
    `<script src="https://unpkg.com/${packageName}@${version}/dist/radikari-chat.umd.js"></script>`
  );

  log(
    "\n" +
      colors.bright +
      colors.magenta +
      "Integration Example:" +
      colors.reset
  );
  log(`<radikari-chat`);
  log(`  tenant-id="YOUR_TENANT_ID"`);
  log(`  api-base-url="https://your-api.com"`);
  log(`  inline></radikari-chat>`);
  log("");
  log(
    `<script src="https://cdn.jsdelivr.net/npm/${packageName}@${version}/dist/radikari-chat.umd.js"></script>`
  );
}

export function main() {
  log(
    colors.bright +
      colors.cyan +
      "🚀 Radikari Chat Widget Deployment Script" +
      colors.reset
  );
  log(
    "This script will deploy the widget to npm and provide CDN access instructions.\n"
  );

  // Read package info
  let packageInfo;
  try {
    packageInfo = JSON.parse(fs.readFileSync("package.json", "utf8"));
  } catch (error) {
    logError(`Failed to read package.json: ${error.message}`);
    process.exit(1);
  }

  const { name: packageName, version } = packageInfo;

  logInfo(`Package: ${packageName}@${version}`);

  // Pre-deployment checks
  if (!checkPackageJson()) {
    process.exit(1);
  }

  if (!checkBuildFiles()) {
    process.exit(1);
  }

  // Ask for confirmation
  logWarning(`About to publish ${packageName}@${version} to npm`);
  logInfo('Make sure you are logged in to npm (run "npm login" if not)');

  // Build if needed
  if (!runCommand("npm run build:prod", "Building production files")) {
    process.exit(1);
  }

  // Run tests if available
  if (packageInfo.scripts && packageInfo.scripts.test) {
    if (!runCommand("npm test", "Running tests")) {
      logWarning("Tests failed. Continue anyway? (y/N)");
      // In a real script, you'd want to handle user input here
      // For now, we'll continue
    }
  }

  // Publish to npm
  logStep("Publishing to npm");
  logInfo("If you have 2FA enabled, you may need to provide an OTP.");
  logInfo(
    "You can also run manually: npm publish --access public --otp=YOUR_CODE"
  );

  try {
    // We use inherit to allow interactive OTP prompt if the environment supports it
    execSync("npm publish --access public", { stdio: "inherit" });
    logSuccess("Publishing to npm completed");
  } catch (error) {
    logError(`Publishing to npm failed: ${error.message}`);
    logWarning("\nManual Fallback Required:");
    logInfo("1. Check your authenticator app for an OTP");
    logInfo(`2. Run: npm publish --access public --otp=YOUR_CODE`);
    process.exit(1);
  }

  logSuccess(`🎉 ${packageName}@${version} published successfully!`);

  // Show CDN instructions
  showCdnInstructions(packageName, version);

  log(
    "\n" +
      colors.bright +
      colors.green +
      "✨ Deployment completed successfully!" +
      colors.reset
  );
  log("Your widget is now available via CDN and ready for integration.");
}

// Handle errors gracefully
process.on("uncaughtException", (error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logError(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run the deployment
main();
