#!/usr/bin/env node

/**
 * Release script for Radikari Chat Widget
 * Handles version bumping, changelog updates, and publishing
 */

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const currentVersion = packageJson.version;

function getVersionType() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Please specify version type: patch, minor, or major");
    process.exit(1);
  }
  const type = args[0];
  if (!["patch", "minor", "major"].includes(type)) {
    console.error("Invalid version type. Use: patch, minor, or major");
    process.exit(1);
  }
  return type;
}

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split(".").map(Number);

  switch (type) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "major":
      return `${major + 1}.0.0`;
    default:
      return current;
  }
}

function updateChangelog(newVersion) {
  const changelog = readFileSync("CHANGELOG.md", "utf8");
  const today = new Date().toISOString().split("T")[0];

  const newEntry = `## [${newVersion}] - ${today}

### Added
- Version bump to ${newVersion}

### Changed
- Updated package version

`;

  const updatedChangelog = changelog.replace(
    "## [Unreleased]",
    newEntry + "\n## [Unreleased]"
  );

  writeFileSync("CHANGELOG.md", updatedChangelog);
  console.log(`✅ Updated CHANGELOG.md for v${newVersion}`);
}

function main() {
  const versionType = getVersionType();
  const newVersion = bumpVersion(currentVersion, versionType);

  console.log(
    `🚀 Releasing ${versionType} version: ${currentVersion} → ${newVersion}`
  );

  // Update package.json
  packageJson.version = newVersion;
  writeFileSync("package.json", JSON.stringify(packageJson, null, 2) + "\n");
  console.log(`✅ Updated package.json to v${newVersion}`);

  // Update changelog
  updateChangelog(newVersion);

  // Git operations
  try {
    execSync(`git add package.json CHANGELOG.md`);
    execSync(`git commit -m "chore: release v${newVersion}"`);
    execSync(`git tag v${newVersion}`);
    console.log(`✅ Created git commit and tag v${newVersion}`);

    console.log("\n🎉 Release ready!");
    console.log(`📦 To publish: npm run release`);
    console.log(`📤 To push: git push origin main --tags`);
  } catch (error) {
    console.error("❌ Git operations failed:", error.message);
    process.exit(1);
  }
}

main();
