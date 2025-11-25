import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Plus besoin de "define" car nous utilisons le standard import.meta.env.VITE_ dans le code
});