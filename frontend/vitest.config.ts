import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/components/ui/**"],
    root: fileURLToPath(new URL("./src", import.meta.url)),
    coverage: {
      exclude: ["**/node_modules/**", "**/components/ui/**"], // Exclude ShadCN components from coverage
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
