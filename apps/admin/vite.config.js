import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src"),
        },
    },
    server: {
        host: true,
        port: 5174,
    },
});
