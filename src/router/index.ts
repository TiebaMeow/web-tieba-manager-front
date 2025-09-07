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
