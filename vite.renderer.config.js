import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postcss from 'vite-plugin-postcss'

export default defineConfig({
    plugins: [
        postcss({
            include: '**/*.css',
        // plugins: [
        //     tailwindcss(),
        //     autoprefixer(),
        // ],
        } ),
        react({
        include: '**/*.jsx',
        }),
    ],
    // resolve: {
    //     alias: {
    //     '@': '/src/renderer/src',
    //     },
    // },
    // css: {
    //     preprocessorOptions: {
    //     scss: {
    //         additionalData: '@import "@/styles/variables.scss";',
    //     },
    //     },
    // },
    })