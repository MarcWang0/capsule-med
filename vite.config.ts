import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Permet d'utiliser process.env.API_KEY comme demandé dans le code existant
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});