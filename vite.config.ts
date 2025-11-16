import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import ElementPlus from 'unplugin-element-plus/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'


// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vueDevTools(),
        ElementPlus({}),
        AutoImport({
            imports: [
                'vue',
                {
                    'vue-router': [
                        'createRouter',
                        'createWebHashHistory',
                        'useLink',
                        'useRoute',
                        'useRouter',
                        'onBeforeRouteLeave',
                        'onBeforeRouteUpdate'
                    ]
                }
            ],
            vueTemplate: true,
            dts: './auto-imports.d.ts',
            eslintrc: {
                enabled: true,
                filepath: './.eslintrc-auto-import.json',
                globalsPropValue: true
            },
            resolvers: [
                ElementPlusResolver(),
                IconsResolver({
                    prefix: 'Icon'
                })]
        }),
        Components({
            resolvers: [
                ElementPlusResolver(),
                IconsResolver({
                    enabledCollections: ['ep']
                })
            ]
        }),
        Icons({
            autoInstall: true
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },
    server: {
        host: '0.0.0.0'
    }
})
