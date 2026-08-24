import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(() => {
  return {
    plugins: [
      tailwindcss(),
      react(),
      visualizer({
        // open: true,
        gzipSize: true,
      }),
    ],
    base: "/",
    build: {
      rollupOptions: {
        input: {
          main: "index.html",
          counter: "counter.html",
        },
      },
    },
  };
});
