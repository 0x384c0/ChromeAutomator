import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import zipPack from "vite-plugin-zip-pack";
import manifest from "./src/manifest";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "build",
    rollupOptions: {
      input: {
        main: resolve(new URL('src/devtools/index.html', import.meta.url).pathname),
        panel: resolve(new URL('src/panel/index.html', import.meta.url).pathname)
      },
      output: {
        chunkFileNames: "assets/chunk-[hash].js",
      },
    },
  },

  plugins: [
    vue(),
    Components({
      resolvers: [
        PrimeVueResolver()
      ]
    }),
    crx({ manifest }),
    zipPack({
      outDir: `package`,
      inDir: "build",
      // @ts-ignore
      outFileName: `${manifest.name.replaceAll(" ", "-")}-extension-v${manifest.version}.zip`,
    }),
  ],
  legacy: {
    skipWebSocketTokenCheck: true, // https://github.com/crxjs/chrome-extension-tools/issues/971#issuecomment-2605091492
  }
});

