import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/meu-orcamento-familiar-andre/', // Adicione esta linha com o nome exato do repositório
})
