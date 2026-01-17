import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/Layout.vue'
import { supabase } from '@/utils/supabase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Layout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue'),
        },
        {
          path: 'market',
          name: 'market',
          component: () => import('../views/MarketView.vue'),
        },
        {
          path: 'auction',
          name: 'auction',
          component: () => import('../views/AuctionView.vue'),
        },
        {
          path: 'sell',
          name: 'sell',
          component: () => import('../views/SellView.vue'),
        },
        {
          path: 'my-products',
          name: 'my-products',
          component: () => import('../views/MyProductsView.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/ProfileView.vue'),
        },
        {
          path: 'orders',
          name: 'orders',
          component: () => import('../views/OrdersView.vue'),
        },
        {
          path: 'my-auctions',
          name: 'my-auctions',
          component: () => import('../views/MyAuctionsView.vue'),
        },
        {
          path: 'product/:id',
          name: 'product',
          component: () => import('../views/ProductDetailView.vue'),
        },
        {
          path: 'auction/:id',
          name: 'auction-detail',
          component: () => import('../views/AuctionDetailView.vue'),
        },
      ],
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/AuthView.vue'),
      meta: { guest: true },
    },
  ],
})

// 路由守卫：检查用户是否已登录
router.beforeEach(async (to) => {
  const { data: { session } } = await supabase.auth.getSession()
  const isAuthenticated = !!session?.user

  console.log('Route guard - to:', to.path, 'authenticated:', isAuthenticated)

  // 如果路由需要认证但用户未登录，重定向到登录页
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('Route guard: Redirecting to auth (requires auth but not authenticated)')
    return '/auth'
  }

  // 如果用户已登录且访问登录页，重定向到首页
  if (to.meta.guest && isAuthenticated) {
    console.log('Route guard: Redirecting to home (authenticated but accessing guest page)')
    return '/'
  }

  // 继续导航
  return
})

export default router
