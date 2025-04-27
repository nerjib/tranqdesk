import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
// import postcss from 'vite-plugin-postcss'
import tailwindcss from 'tailwindcss'

export default defineConfig({
  main: {
    plugins: [
        externalizeDepsPlugin(),
        // postcss({
        //     include: '**/*.css',
        //     plugins: [
        //         tailwindcss(),
        //         autoprefixer(),
        //     ],
        // }),
    ]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
