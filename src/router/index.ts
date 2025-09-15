import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'


type DashboardRouteRecordRaw = RouteRecordRaw & {
    meta: {
        title?: string
        hide?: boolean
        system?: boolean
        noToken?: boolean
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
        path: '/user-config',
        name: 'userConfig',
        meta: {
            title: '设置'
        },
        component: () => import('../views/dashboard/UserConfig.vue')
    },
    {
        path: '/rule-sets',
        name: 'ruleSets',
        meta: {
            title: '违规规则'
        },
        component: () => import('../views/dashboard/RuleSets.vue')
    },
    {
        path: '/whitelist-rule-sets',
        name: 'whitelistRuleSets',
        meta: {
            title: '信任规则'
        },
        component: () => import('../views/dashboard/RuleSets.vue')
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
        path: '/rule-sets/:id(\\d+)',
        name: 'ruleSetDetail',
        meta: {
            hide: true
        },
        component: () => import('../views/dashboard/EditRuleSet.vue'),
    },
    {
        path: '/rule-sets/new',
        name: 'newRuleSet',
        meta: {
            hide: true
        },
        component: () => import('../views/dashboard/EditRuleSet.vue')
    },
    {
        path: '/whitelist-rule-sets/new',
        name: 'newWhitelistRuleSet',
        meta: {
            hide: true
        },
        component: () => import('../views/dashboard/EditRuleSet.vue')
    },
    {
        path: '/user-log',
        name: 'userLog',
        meta: {
            title: '日志'
        },
        component: () => import('../views/LogComponent.vue')
    },
]

export const SystemManagementRoutes: DashboardRouteRecordRaw[] = [
    {
        path: '/user-management',
        name: 'userManagement',
        meta: {
            title: '用户管理',
            system: true
        },
        component: () => import('../views/systemManagement/UserManagement.vue')
    },
    {
        path: '/system-log',
        name: 'systemLog',
        meta: {
            title: '系统日志',
            system: true
        },
        component: () => import('../views/LogComponent.vue')
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
        children: [...DashboardRoutes, ...SystemManagementRoutes],
        redirect: '/home',
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
