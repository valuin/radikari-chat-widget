import { defineConfig, type UserConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Base configuration shared by all builds
const baseConfig: UserConfig = {
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    target: "es2018", // Chrome 64+, Safari 12+
    cssCodeSplit: false, // Ensure CSS is bundled with JS
    sourcemap: true,
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: undefined, // Prevent code splitting
      },
    },
  },
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version || "1.0.0"),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __COMMIT_HASH__: JSON.stringify(process.env.GIT_SHA || "unknown"),
  },
};

// ESM build configuration (external Lit)
const esmConfig: UserConfig = {
  ...baseConfig,
  build: {
    ...baseConfig.build!,
    lib: {
      entry: resolve(__dirname, "src/radikari-chat.ts"),
      fileName: "radikari-chat.es.js",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["lit"],
      output: {
        // No globals for ESM - users will import Lit
      },
    },
  },
};

// UMD build configuration (bundle Lit)
const umdConfig: UserConfig = {
  ...baseConfig,
  build: {
    ...baseConfig.build!,
    lib: {
      entry: resolve(__dirname, "src/radikari-chat.ts"),
      name: "RadikariChat", // Global name for UMD (mostly irrelevant for web components)
      fileName: "radikari-chat.umd.js",
      formats: ["umd"],
    },
    rollupOptions: {
      // Bundle Lit for UMD to prevent runtime failures
      // No external dependencies - everything is bundled
    },
  },
};

// Export configuration factory
export default defineConfig(({ mode }): UserConfig => {
  if (mode === "umd") {
    return umdConfig;
  }

  // Default to ESM build
  return esmConfig;
});
