<template>
  <div class="layout-container">
    <header class="header">
      <!-- 顶部区域：Logo、搜索框、热门搜索 -->
      <div class="header-top">
        <div class="header-top-content">
          <div class="logo-section" @click="router.push('/')">
            <div class="logo-wrapper">
              <h1 class="logo">青易校园</h1>
              <h2 class="tagline">当代大学生的二手平台交易网站</h2>
            </div>
          </div>

          <div class="spacer"></div>

          <div class="search-section">
            <div class="search-bar">
              <t-input
                v-model="searchKeyword"
                placeholder="搜索商品、卖家、关键词"
                class="search-input"
                clearable
                @enter="handleSearch"
                size="large"
              >
                <template #suffix-icon>
                  <t-icon name="search" />
                </template>
              </t-input>
              <t-button theme="primary" variant="base" @click="handleSearch" size="large">
                搜索
              </t-button>
            </div>
            <div class="hot-searches">
              <span class="hot-label">热门搜索：</span>
              <span class="hot-item" v-for="item in hotSearches" :key="item" @click="searchKeyword = item; handleSearch()">
                {{ item }}
              </span>
            </div>
          </div>

          <div class="spacer"></div>
        </div>
      </div>

      <!-- 导航条区域 -->
      <div class="header-nav">
        <div class="nav-content">
          <!-- 左侧导航链接 -->
          <nav class="main-nav" :class="{ 'mobile-open': mobileMenuOpen }">
            <router-link to="/" class="nav-item" exact-active-class="active" @click="mobileMenuOpen = false">
              首页推荐
            </router-link>
            <router-link to="/market" class="nav-item" exact-active-class="active" @click="mobileMenuOpen = false">
              交易大厅
            </router-link>
            <router-link to="/auction" class="nav-item" exact-active-class="active" @click="mobileMenuOpen = false">
              竞价拍卖 <span class="hot-tag">[HOT]</span>
            </router-link>
          </nav>

          <!-- 右侧操作按钮 -->
          <div class="nav-actions">
            <div class="desktop-actions">
              <t-button
                theme="primary"
                variant="base"
                @click="handleBuy"
              >
                真心求购
              </t-button>

              <t-button
                theme="primary"
                variant="base"
                @click="handleSell"
              >
                我要出售
              </t-button>

              <t-button
                theme="primary"
                variant="base"
                @click="handleAuction"
              >
                我要拍卖
              </t-button>

              <t-dropdown>
                <t-avatar :image="userAvatar" size="large" class="user-avatar">
                  <t-icon name="user" size="24px" />
                </t-avatar>
                <template #dropdown>
                  <t-dropdown-menu>
                    <t-dropdown-item @click="router.push('/profile')">个人中心</t-dropdown-item>
                    <t-dropdown-item @click="router.push('/orders')">我的订单</t-dropdown-item>
                    <t-dropdown-item @click="router.push('/my-products')">我的出售</t-dropdown-item>
                    <t-dropdown-item @click="router.push('/my-auctions')">我的拍卖</t-dropdown-item>
                    <t-dropdown-item divider />
                    <t-dropdown-item @click="handleLogout" style="color: #e34d59;">退出登录</t-dropdown-item>
                  </t-dropdown-menu>
                </template>
              </t-dropdown>
            </div>

            <t-button
              class="mobile-menu-btn"
              variant="text"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <t-icon :name="mobileMenuOpen ? 'close' : 'menu'" size="32px" />
            </t-button>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-view />
    </main>

    <!-- 悬浮购物车按钮 -->
    <div class="floating-cart" @click="router.push('/cart')">
      <div class="cart-button" :class="cartAnimateClass">
        <t-icon name="cart" size="24px" />
        <div v-if="cartCount > 0" class="cart-badge" :class="cartAnimateClass">
          {{ cartCount > 99 ? '99+' : cartCount }}
        </div>
      </div>
    </div>

    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>关于我们</h3>
          <a href="#">平台介绍</a>
          <a href="#">联系我们</a>
        </div>
        <div class="footer-section">
          <h3>帮助中心</h3>
          <a href="#">注册帮助</a>
          <a href="#">购买流程</a>
          <a href="#">拍卖流程</a>
        </div>
        <div class="footer-section">
          <h3>服务保障</h3>
          <a href="#">充值帮助</a>
          <a href="#">退款政策</a>
        </div>
        <div class="footer-section">
          <h3>青易校园</h3>
          <p>专业的大学生二手交易平台</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 青易校园 All Rights Reserved</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { supabase } from '@/utils/supabase'
import eventBus from '@/utils/eventBus'

const router = useRouter()
const route = useRoute()
const searchKeyword = ref('')
const mobileMenuOpen = ref(false)
const user = ref<any>(null)
const userProfile = ref<any>(null)

// 热门搜索
const hotSearches = ['雀巢咖啡', '二手平板', '二手书籍', '手机', '笔记本电脑']

const userAvatar = computed(() => {
  return userProfile.value?.avatar_url || ''
})

// 购物车
const cartCount = ref(0)
const cartAnimateClass = ref('')

// 加载购物车数量
const loadCartCount = async () => {
  if (!user.value) {
    cartCount.value = 0
    return
  }

  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('id')
      .eq('user_id', user.value.id)

    if (error) throw error

    cartCount.value = data?.length || 0
  } catch (err) {
    console.error('加载购物车数量失败:', err)
  }
}

// 触发购物车数量更新动画
const animateCartBadge = () => {
  cartAnimateClass.value = 'animate'
  setTimeout(() => {
    cartAnimateClass.value = ''
  }, 1000) // 增加到 1 秒
}

// 监听用户变化，重新加载购物车数量
watch(user, () => {
  loadCartCount()
})

// 监听路由变化，更新购物车数量
watch(route, () => {
  loadCartCount()
})

// 搜索去抖动
let searchTimer: any = null
const debounceSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    performSearch()
  }, 300)
}

// 执行搜索
const performSearch = () => {
  if (!searchKeyword.value.trim()) {
    MessagePlugin.warning('请输入搜索关键词')
    return
  }

  console.log('Searching for:', searchKeyword.value)
  router.push({
    path: '/market',
    query: {
      search: searchKeyword.value.trim()
    }
  })

  mobileMenuOpen.value = false
}

// 监听搜索输入，实现实时搜索
watch(searchKeyword, (newValue) => {
  if (newValue.trim()) {
    debounceSearch()
  }
})

const loadUserProfile = async () => {
  if (user.value) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    userProfile.value = data
  }
}

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user || null
  if (user.value) {
    await loadUserProfile()
    await loadCartCount()
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user || null
    if (user.value) {
      loadUserProfile()
      loadCartCount()
    } else {
      userProfile.value = null
      cartCount.value = 0
    }
  })

  // 监听购物车更新事件
  eventBus.on('cart:updated', handleCartUpdate)
})

onUnmounted(() => {
  // 移除事件监听
  eventBus.off('cart:updated', handleCartUpdate)
})

// 处理购物车更新
const handleCartUpdate = async () => {
  await loadCartCount()
  animateCartBadge()
}

const handleSearch = () => {
  performSearch()
}

const handleBuy = () => {
  router.push('/market')
  mobileMenuOpen.value = false
}

const handleSell = () => {
  router.push('/sell')
  mobileMenuOpen.value = false
}

const handleAuction = () => {
  router.push('/auction-publish')
  mobileMenuOpen.value = false
}

const handleLogout = async () => {
  console.log('Starting logout...')
  console.log('User before logout:', user.value)
  
  // 先检查当前 session
  const { data: { session: currentSession } } = await supabase.auth.getSession()
  console.log('Current session before logout:', currentSession)
  
  try {
    // 只有在有 session 的情况下才调用 signOut
    if (currentSession) {
      console.log('Calling signOut with existing session...')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        // 如果错误是 session missing，说明已经没有有效的 session 了
        // 这种情况下直接继续退出流程
        if (error.message?.includes('Auth session missing') || error.name === 'AuthSessionMissingError') {
          console.log('Session already missing during signOut, continuing with logout')
        } else {
          console.error('Sign out error:', error)
        }
      } else {
        console.log('Sign out successful from Supabase')
      }
    } else {
      console.log('No session exists, skipping signOut call')
    }
  } catch (error: any) {
    // 捕获异常，检查是否是 session missing 错误
    if (error?.message?.includes('Auth session missing') || error?.name === 'AuthSessionMissingError') {
      console.log('Session already missing (exception), continuing with logout')
    } else {
      console.error('Logout exception:', error)
    }
  }
  
  // 清除本地用户状态
  user.value = null
  userProfile.value = null
  
  // 强制清除所有浏览器存储
  localStorage.clear()
  sessionStorage.clear()
  
  // 显示成功提示
  MessagePlugin.success('退出登录成功')
  
  console.log('Navigating to /auth...')
  
  // 等待消息提示显示后再跳转
  setTimeout(async () => {
    // 确认 session 已清除
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Session after logout:', session)
    
    // 跳转到登录页
    await router.push('/auth')
  }, 800)
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #e34d59;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

/* 顶部区域 */
.header-top {
  padding: 16px 0;
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 100%);
}

.header-top-content {
  width: 100%;
  padding: 0 0 0 8px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.spacer {
  flex: 1;
}

.logo-section {
  cursor: pointer;
  flex: 0 0 auto;
  align-self: flex-start;
  margin-top: 0;
  margin-left: 0;
}

.logo-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.logo-section .logo {
  color: white;
  font-size: 32px;
  margin: 0;
  font-weight: 700;
  white-space: nowrap;
  line-height: 1.1;
}

.logo-section .tagline {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  margin: 4px 0 0 0;
  white-space: nowrap;
  font-weight: 400;
  font-size: 14px;
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 0 1 auto;
  max-width: 800px;
  margin: 0 auto;
}

.search-bar {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.search-input {
  flex: 1;
  height: 48px;
}

.search-bar :deep(.t-input__inner) {
  height: 48px;
  font-size: 16px;
  padding: 0 16px;
}

.search-bar :deep(.t-button) {
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
  font-weight: 600;
}

.hot-searches {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 14px;
}

.hot-label {
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  font-weight: 500;
}

.hot-item {
  color: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  transition: all 0.3s;
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 500;
}

.hot-item:hover {
  color: white;
  background: rgba(255, 255, 255, 0.2);
}

/* 导航条区域 */
.header-nav {
  background: #d63d49;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 0;
}

.nav-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.main-nav {
  display: flex;
  gap: 60px;
  align-items: center;
}

.nav-item {
  color: white;
  text-decoration: none;
  font-size: 16px;
  font-weight: 600;
  padding: 12px 24px;
  transition: all 0.3s;
  white-space: nowrap;
  position: relative;
  border-radius: 8px;
  letter-spacing: 0.5px;
}

.hot-tag {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 4px;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%);
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.3);
  font-weight: 700;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: white;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.5);
}

.nav-actions {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
}

.desktop-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  cursor: pointer;
  background: white;
  color: #e34d59;
  font-weight: 600;
  border: 3px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.user-avatar:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.user-avatar :deep(.t-avatar__image) {
  object-fit: cover;
}

/* 美化下拉菜单 */
.user-avatar :deep(.t-dropdown) {
  min-width: 180px;
}

.user-avatar :deep(.t-dropdown-menu) {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 8px;
}

.user-avatar :deep(.t-dropdown-item) {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #2c3e50;
  transition: all 0.2s ease;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar :deep(.t-dropdown-item:hover) {
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 100%);
  color: white;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(227, 77, 89, 0.3);
}

.user-avatar :deep(.t-dropdown-item[divider]) {
  margin: 8px 0;
  padding: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(227, 77, 89, 0.2), transparent);
}

.user-avatar :deep(.t-dropdown-item:last-child) {
  color: #e34d59;
  font-weight: 600;
}

.user-avatar :deep(.t-dropdown-item:last-child:hover) {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
  color: white;
}

.search-input {
  width: 400px;
}

.mobile-menu-btn {
  display: none;
  color: white;
}

.main-content {
  flex: 1;
  padding: 20px;
  width: 100%;
  max-width: 100%;
}

/* 悬浮购物车按钮 */
.floating-cart {
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 1000;
  cursor: pointer;
  transition: all 0.3s;
}

.floating-cart:hover {
  transform: scale(1.1);
}

.floating-cart:hover .cart-button {
  box-shadow: 0 8px 24px rgba(227, 77, 89, 0.4);
}

.cart-button {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 100%);
  box-shadow: 0 4px 16px rgba(227, 77, 89, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.cart-button .t-icon {
  color: white;
}

.cart-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  min-width: 26px;
  height: 26px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
  color: white;
  border: 3px solid white;
  border-radius: 13px;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  box-shadow: 0 3px 12px rgba(255, 107, 107, 0.5);
}

.cart-badge.animate {
  animation: bounce 1s ease-in-out;
}

@keyframes bounce {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(2);
  }
  60% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

.cart-button.animate {
  animation: shake 1s ease-in-out;
}

@keyframes shake {
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: rotate(-15deg) scale(1.05);
  }
  20%, 40%, 60%, 80% {
    transform: rotate(15deg) scale(1.05);
  }
}

.cart-button.animate {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-15deg);
  }
  75% {
    transform: rotate(15deg);
  }
}

.footer {
  background: #2c3e50;
  color: white;
  padding: 40px 20px 20px;
  margin-top: auto;
}

.footer-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
}

.footer-section h3 {
  color: #e34d59;
  margin-bottom: 20px;
  font-size: 18px;
}

.footer-section a {
  display: block;
  color: white;
  text-decoration: none;
  margin-bottom: 10px;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.footer-section a:hover {
  opacity: 1;
}

.footer-section p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.footer-bottom {
  width: 100%;
  max-width: 1400px;
  margin: 40px auto 0;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

/* 平板设备 */
@media (max-width: 1024px) {
  .header-top-content {
    gap: 30px;
    padding: 0 0 0 12px;
  }

  .logo-section .logo {
    font-size: 28px;
  }

  .logo-section .tagline {
    font-size: 13px;
  }

  .main-nav {
    gap: 30px;
  }

  .nav-item {
    font-size: 14px;
    padding: 12px 12px;
  }

  .search-input {
    height: 40px;
  }

  .search-bar :deep(.t-input__inner) {
    height: 40px;
    font-size: 14px;
    padding: 0 12px;
  }

  .search-bar :deep(.t-button) {
    height: 40px;
    padding: 0 24px;
    font-size: 14px;
  }

  .hot-searches {
    font-size: 13px;
  }

  .footer-content {
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
  }

  .main-content {
    padding: 15px;
  }
}

/* 移动设备 */
@media (max-width: 768px) {
  .header-top {
    padding: 12px 0 10px 12px;
  }

  .search-section {
    max-width: 100%;
  }

  .search-input {
    height: 44px;
  }

  .search-bar :deep(.t-input__inner) {
    height: 44px;
    font-size: 15px;
  }

  .search-bar :deep(.t-button) {
    height: 44px;
    padding: 0 20px;
    font-size: 15px;
  }

  .hot-searches {
    font-size: 13px;
  }

  .header-top-content {
    flex-direction: column;
    gap: 12px;
  }

  .spacer {
    display: none;
  }

  .logo-section .logo {
    font-size: 26px;
  }

  .logo-section .tagline {
    font-size: 13px;
  }

  .search-section {
    width: 100%;
    max-width: 100%;
  }

  .header-nav {
    position: relative;
  }

  .nav-content {
    height: auto;
    padding: 12px 15px;
    flex-direction: column;
    gap: 12px;
    position: relative;
  }

  .main-nav {
    width: 100%;
    flex-direction: column;
    gap: 2px;
    padding: 0;
  }

  .main-nav.mobile-open {
    display: flex;
  }

  .main-nav:not(.mobile-open) {
    display: none;
  }

  .nav-item {
    width: 100%;
    padding: 12px 16px;
    text-align: center;
    font-size: 15px;
  }

  .nav-item.active::after {
    display: none;
  }

  .nav-actions {
    position: relative;
    right: auto;
    top: auto;
    transform: none;
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }

  .desktop-actions {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: flex-end;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
    padding: 0 10px;
  }

  .footer {
    padding: 30px 15px 15px;
  }

  .footer-section h3 {
    font-size: 16px;
  }

  .main-content {
    padding: 15px 10px;
  }

  .floating-cart {
    right: 20px;
    bottom: 20px;
  }

  .cart-button {
    width: 52px;
    height: 52px;
  }

  .cart-badge {
    min-width: 20px;
    height: 20px;
    font-size: 11px;
    top: -6px;
    right: -6px;
  }
}

/* 小屏手机 */
@media (max-width: 480px) {
  .logo-section .logo {
    font-size: 24px;
  }

  .logo-section .tagline {
    font-size: 12px;
  }

  .footer-bottom {
    font-size: 12px;
  }
}
</style>
