import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const previewId = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env?.VITE_PAGES_PREVIEW_ID ?? "local";

export default defineConfig(({ mode }) => ({
  base: mode === "pages"
    ? "/mekan-prototype/"
    : mode === "pages-preview"
      ? `/mekan-prototype/previews/${previewId}/`
      : "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
}));
