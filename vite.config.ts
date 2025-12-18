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
    outDir: "dist/esm", // Separate output directory
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      fileName: () => "radikari-chat.es.js",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["lit"],
      output: {
        entryFileNames: "radikari-chat.es.js",
        chunkFileNames: "radikari-chat.es-[name].js",
        assetFileNames: "radikari-chat.es-[extname]",
      },
    },
  },
};

// UMD build configuration (bundle Lit)
const umdConfig: UserConfig = {
  ...baseConfig,
  build: {
    ...baseConfig.build!,
    outDir: "dist/umd", // Separate output directory
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      name: "RadikariChat", // Global name for UMD (mostly irrelevant for web components)
      fileName: () => "radikari-chat.umd.js",
      formats: ["umd"],
    },
    rollupOptions: {
      // Bundle Lit for UMD to prevent runtime failures
      // No external dependencies - everything is bundled
      output: {
        entryFileNames: "radikari-chat.umd.js",
        chunkFileNames: "radikari-chat.umd-[name].js",
        assetFileNames: "radikari-chat.umd-[extname]",
      },
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
