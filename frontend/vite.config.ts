import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'node:child_process'
import path from 'node:path'

function backendDevPlugin() {
  let backend: ReturnType<typeof spawn> | null = null
  return {
    name: 'suraksha-backend-dev',
    configureServer(server) {
      const backendDir = path.resolve(__dirname, '../backend')
      backend = spawn('npm', ['run', 'dev'], {
        cwd: backendDir,
        stdio: 'inherit',
        shell: true,
      })
      const stop = () => {
        if (backend && !backend.killed) backend.kill()
      }
      process.on('exit', stop)
      server.httpServer?.on('close', stop)
    },
  }
}

export default defineConfig({
  plugins: [react(), backendDevPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
