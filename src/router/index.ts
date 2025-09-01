import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'


type DashboardRouteRecordRaw = RouteRecordRaw & {
    meta: {
        title?: string
        hide?: boolean
    }
}

export const DashboardRoutes: DashboardRouteRecordRaw[] = [
    {
        path: '/home',
        name: 'home',
        meta: {
            title: '主页'
        },
        component: () => import('../views/dashboard/DashboardHome.vue')
    },
    {
        path: '/user_config',
        name: 'user_config',
        meta: {
            title: '设置'
        },
        component: () => import('../views/dashboard/UserConfig.vue')
    }
]

const routes: RouteRecordRaw[] = [
    {
        path: '/initialize',
        name: 'initialize',
        component: () => import('../views/InitializeComponent.vue')
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('../views/LoginComponent.vue')
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        children: DashboardRoutes
    }
]

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes,
})

export default router
