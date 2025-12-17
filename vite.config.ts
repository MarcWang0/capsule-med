import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Cette configuration permet à Vite de remplacer process.env.API_KEY par la valeur réelle
    // présente sur le serveur de build (Vercel) lors de la compilation.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
});