import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // === 1. KONFIGURASI BUILD & SERVER (Dari kode aslimu) ===
  build: {
    target: 'esnext',
    outDir: 'build',
  },
  server: {
    port: 3000,
    open: true,
  },

  // === 2. SOLUSI ERROR "INVALID HOOK CALL" (Wajib ada) ===
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
      
      // Memaksa penggunaan satu versi React (Pencegah Crash)
      react: path.resolve(process.cwd(), "./node_modules/react"),
      "react-dom": path.resolve(process.cwd(), "./node_modules/react-dom"),
    },
  },
})