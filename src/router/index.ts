import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'


type DashboardRouteRecordRaw = RouteRecordRaw & {
    meta: {
        title?: string
        hide?: boolean
        system?: boolean
        noToken?: boolean
    }
}

export const processDashboardRoutes: DashboardRouteRecordRaw[] = [
    {
        path: '/process/search',
        name: 'processSearch',
        meta: {
            hide: true
        },
        component: () => import('../views/dashboard/process/ProcessIndex.vue')
    },
    {
        path: '/process/detail/:pid(\\d+)',
        name: 'processDetail',
        meta: {
            hide: true
        },
        component: () => import('../views/dashboard/process/ProcessDetail.vue')
    }
]

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
        path: '/user-config',
        name: 'userConfig',
        meta: {
            title: '设置'
        },
        component: () => import('../views/dashboard/UserConfig.vue')
    },
    {
        path: '/rules',
        name: 'rules',
        meta: {
            title: '违规规则'
        },
        component: () => import('../views/dashboard/RuleList.vue')
    },
    {
        path: '/whitelist-rules',
        name: 'whitelistRules',
        meta: {
            title: '信任规则'
        },
        component: () => import('../views/dashboard/RuleList.vue')
    },
    {
        path: '/confirm-list',
        name: 'confirmList',
        meta: {
            title: '确认列表'
        },
        component: () => import('../views/dashboard/ConfirmList.vue')
    },
    {
        path: '/rules/:id(\\d+)',
        name: 'ruleDetail',
        meta: {
            hide: true
        },
        component: () => import('../views/dashboard/EditRule.vue'),
    },
    {
        path: '/rules/new',
        name: 'newRule',
        meta: {
            hide: true
        },
        component: () => import('../views/dashboard/EditRule.vue')
    },
    {
        path: '/whitelist-rules/new',
        name: 'newWhitelistRule',
        meta: {
            hide: true
        },
        component: () => import('../views/dashboard/EditRule.vue')
    },
    {
        path: '/process/index',
        name: 'processIndex',
        meta: {
            title: '处理记录'
        },
        component: () => import('../views/dashboard/process/ProcessIndex.vue'),
        children: processDashboardRoutes,
    },
    {
        path: '/user-log',
        name: 'userLog',
        meta: {
            title: '日志'
        },
        component: () => import('../views/log/LogComponent.vue')
    },
]


export const systemDashboardRoutes: DashboardRouteRecordRaw[] = [
    {
        path: '/user-management',
        name: 'userManagement',
        meta: {
            title: '用户管理',
            system: true
        },
        component: () => import('../views/systemDashboard/UserManagement.vue')
    },
    {
        path: '/system-log',
        name: 'systemLog',
        meta: {
            title: '系统日志',
            system: true
        },
        component: () => import('../views/log/LogComponent.vue')
    },
    {
        path: '/system-config',
        name: 'systemConfig',
        meta: {
            title: '系统设置',
            system: true
        },
        component: () => import('../views/systemDashboard/SystemConfig.vue')
    },
]

const routes: RouteRecordRaw[] = [
    {
        path: '/initialize',
        name: 'initialize',
        meta: {
            noToken: true
        },
        component: () => import('../views/InitializeComponent.vue')
    },
    {
        path: '/login',
        name: 'login',
        meta: {
            noToken: true
        },
        component: () => import('../views/LoginComponent.vue')
    },
    {
        path: '/register',
        name: 'register',
        meta: {
            noToken: true
        },
        component: () => import('../views/LoginComponent.vue')
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        children: [...DashboardRoutes, ...systemDashboardRoutes],
        redirect: '/home',
    },
    // 捕获所有未定义路由，统一重定向到 /home
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        redirect: '/home',
        meta: {}
    },
]

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes,
})


import { currToken } from '../lib/data/tokenManager'

router.beforeEach((to, from, next) => {
    // noToken 默认为 false
    const noToken = to.meta?.noToken === true;
    if (!noToken && currToken.value === '') {
        next({ path: '/login' });
    } else {
        next();
    }
})

export default router
