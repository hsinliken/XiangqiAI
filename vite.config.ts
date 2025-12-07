import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Safely inject the API KEY string
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})