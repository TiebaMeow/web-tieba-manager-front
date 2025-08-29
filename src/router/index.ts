import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const DashboardRouted: RouteRecordRaw[] = [
    {
        path: '/home',
        name: 'home',
        component: () => import('../views/DashboardComponent.vue')
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
        children: DashboardRouted
    }
]

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes,
})

export default router
