import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'node:fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    build: { manifest: true },
    plugins: [react(), tailwindcss(), (()=>{
      let googleClientId='';
      return {name:'openvoley-client-build',apply:'build' as const,
        configResolved(config:any){googleClientId=String(config.env.VITE_GOOGLE_CLIENT_ID||'').trim();},
        closeBundle(){fs.mkdirSync('server-build',{recursive:true});fs.writeFileSync('server-build/client-build.json',JSON.stringify({version:1,builtAt:new Date().toISOString(),googleClientId}),{mode:0o600});}
      };
    })()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
