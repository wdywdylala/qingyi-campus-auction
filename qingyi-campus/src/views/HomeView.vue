<template>
  <div class="home-container">
    <!-- 左侧区域（拍卖相关） -->
    <div class="left-section">
      <!-- 分类标签 -->
      <div class="category-tabs">
        <div 
          v-for="tab in auctionTabs" 
          :key="tab"
          class="tab-item"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ tab }}
        </div>
      </div>

      <!-- 拍卖说明列表 -->
      <div class="auction-help" v-if="activeTab === '拍卖'">
        <h4>拍卖帮助</h4>
        <ul>
          <li v-for="item in auctionHelpItems" :key="item" @click="showAuctionHelp(item)">
            {{ item }}
          </li>
        </ul>
      </div>

      <!-- 功能图标区 -->
      <div class="feature-icons">
        <div class="feature-item" v-for="feature in auctionFeatures" :key="feature.label">
          <div class="feature-icon">{{ feature.icon }}</div>
          <div class="feature-label">{{ feature.label }}</div>
        </div>
      </div>
    </div>

    <!-- 中间区域 -->
    <div class="center-section">
      <!-- 节日横幅 -->
      <div class="festival-banner">
        <div class="banner-content">
          <div class="festival-icon">🐴</div>
          <div class="festival-text">
            <h2>2026 拜大年</h2>
            <p>春节的韵味 —— 2026 新春快乐！</p>
          </div>
        </div>
        <div class="banner-dots">
          <span class="dot active"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>

      <!-- 中间功能区（规则/说明图标栏） -->
      <div class="rule-bar">
        <div
          v-for="rule in rules"
          :key="rule.name"
          class="rule-item"
          @click="showRule(rule.name)"
        >
          <span class="rule-icon">{{ rule.icon }}</span>
          <span class="rule-name">{{ rule.name }}</span>
        </div>
      </div>

      <!-- 二手闲置区 -->
      <div class="secondhand-section">
        <div class="section-header">
          <div class="header-left">
            <div class="section-title">
              <span class="title-icon">📦</span>
              <h3>二手闲置</h3>
              <span class="title-badge">优质好物</span>
            </div>
            <div class="sub-categories">
              <span
                v-for="cat in subCategories"
                :key="cat"
                class="sub-cat"
                :class="{ active: selectedCategory === cat }"
                @click="selectCategory(cat)"
              >
                {{ cat }}
              </span>
            </div>
          </div>
          <div class="header-actions">
            <t-button
              theme="primary"
              variant="outline"
              size="small"
              class="refresh-btn"
              @click="refreshProducts"
            >
              <template #icon>
                <t-icon name="refresh" />
              </template>
              换一换
            </t-button>
            <span class="more-link" @click="goToMarket">
              <span>查看更多</span>
              <t-icon name="chevron-right" size="16px" />
            </span>
          </div>
        </div>

        <div class="secondhand-content">
          <!-- Loading状态 -->
          <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <p class="loading-text">加载中...</p>
          </div>

          <!-- 商品列表 -->
          <transition-group v-else name="product-list" tag="div" class="products-list">
            <div
              v-for="product in featuredProducts"
              :key="product.id"
              class="product-card"
              @click="viewProduct(product)"
            >
              <div class="product-image-wrapper">
                <img :src="product.image" alt="商品图片" class="product-image" />
              </div>
              <div class="product-details">
                <div class="product-info">
                  <div class="product-price">{{ product.price }}</div>
                  <h4 class="product-title">{{ product.title }}</h4>
                  <div class="product-seller">
                    <t-icon name="user" size="14px" />
                    <span>{{ product.profiles?.username || '未知卖家' }}</span>
                  </div>
                </div>
                <div class="product-action">
                  <t-icon name="arrow-right" size="18px" />
                </div>
              </div>
            </div>
            <!-- 不足8个时用空白卡片填充，保持两行四列 -->
            <div
              v-for="n in (8 - featuredProducts.length)"
              :key="'empty-' + n"
              class="product-card empty-card"
            >
              <div class="product-image-wrapper empty-image">
              </div>
            </div>
          </transition-group>
        </div>
      </div>
    </div>

    <!-- 右侧区域 -->
    <div class="right-section">
      <!-- 二手平台快讯 -->
      <div class="sidebar-section">
        <h4 class="sidebar-title">二手平台快讯</h4>
        <ul class="news-list">
          <li v-for="item in news" :key="item">{{ item }}</li>
        </ul>
      </div>

      <!-- 全国统一客服热线 -->
      <div class="sidebar-section customer-service">
        <h4 class="sidebar-title">全国统一客服热线</h4>
        <div class="phone">6666-1234567</div>
        <div class="work-time">周一至周日 9:00-18:00</div>
      </div>

      <!-- 六重保障 -->
      <div class="sidebar-section">
        <h4 class="sidebar-title">六重保障，放心购买</h4>
        <div class="guarantees">
          <div class="guarantee-item" v-for="item in guarantees" :key="item.name">
            <div class="guarantee-icon" :style="{ background: item.color }">
              {{ item.icon }}
            </div>
            <span class="guarantee-text">{{ item.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const user = ref<any>(null)
const userProfile = ref<any>(null)
const activeTab = ref('拍卖')
const selectedCategory = ref('精心推荐')
const featuredProducts = ref<any[]>([])
const isLoading = ref(false)

const userAvatar = computed(() => {
  return userProfile.value?.avatar_url || ''
})

// 拍卖分类标签
const auctionTabs = ['公告', '二手', '拍卖', '资讯']

// 拍卖说明列表
const auctionHelpItems = [
  '拍品拍卖结束时间说明',
  '注册拍卖资格',
  '什么是拍卖预展',
  '如何缴纳保证金',
  '什么是退保费',
  '如何申请拍卖权限'
]

// 拍卖功能图标
const auctionFeatures = [
  { label: '公平公正', icon: '⚖️' },
  { label: '拍卖预告', icon: '📢' },
  { label: '委托拍卖', icon: '🤝' },
  { label: '资金保障', icon: '💰' }
]

// 规则按钮
const rules = [
  { name: '商品竞拍规则', icon: '⚖️' },
  { name: '商品拍卖流程', icon: '📋' },
  { name: '商品发布规则', icon: '📤' },
  { name: '商品购买规则', icon: '🛒' },
  { name: '用户操作须知', icon: '📖' },
  { name: '发布信息规范', icon: '✨' },
  { name: '个人诚信考核', icon: '🏆' }
]

// 二手子分类
const subCategories = [
  '精心推荐',
  '数码产品',
  '书籍教材',
  '衣鞋帽伞',
  '代步工具',
  '课外娱乐',
  '日常用品',
  '虚拟产品',
  '手工设计',
  '其他'
]

// 每个分类已推荐的商品ID集合
const recommendedProductIds = ref<Record<string, Set<string>>>({
  '精心推荐': new Set(),
  '数码产品': new Set(),
  '书籍教材': new Set(),
  '衣鞋帽伞': new Set(),
  '代步工具': new Set(),
  '课外娱乐': new Set(),
  '日常用品': new Set(),
  '虚拟产品': new Set(),
  '手工设计': new Set(),
  '其他': new Set()
})

// 每个分类已推荐的商品数据缓存
const categoryProductCache = ref<Record<string, any[]>>({
  '精心推荐': [],
  '数码产品': [],
  '书籍教材': [],
  '衣鞋帽伞': [],
  '代步工具': [],
  '课外娱乐': [],
  '日常用品': [],
  '虚拟产品': [],
  '手工设计': [],
  '其他': []
})

// 二手平台快讯
const news = [
  '如何上传商品及货证',
  '如何退货退款',
  '卖家信誉等级说明',
  '平台交易规则',
  '如何安全支付'
]

// 六重保障
const guarantees = [
  { name: '把控货源', icon: '🛡️', color: '#e34d59' },
  { name: '包退包换', icon: '✅', color: '#67c23a' },
  { name: '支持退款', icon: '🌾', color: '#e6a23c' },
  { name: '物流赔付', icon: '🚚', color: '#409eff' },
  { name: '支付安全', icon: '🔒', color: '#f56c6c' },
  { name: '服务保障', icon: '❤️', color: '#e34d59' }
]

onMounted(async () => {
  await loadUser()
  await loadFeaturedProducts()
})

const loadUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user || null
  if (user.value) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    userProfile.value = data
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user || null
    if (user.value) {
      loadUserProfile()
    } else {
      userProfile.value = null
    }
  })
}

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

const selectCategory = (category: string) => {
  // 切换到新的分类
  selectedCategory.value = category

  // 如果该分类之前没有推荐过（首次访问），则自动加载
  if (recommendedProductIds.value[category].size === 0) {
    loadFeaturedProducts()
  } else {
    // 如果已经推荐过，从缓存中恢复已推荐的商品
    featuredProducts.value = categoryProductCache.value[category]
  }
}

const refreshProducts = async () => {
  // 清空当前分类的推荐记录
  recommendedProductIds.value[selectedCategory.value] = new Set()
  categoryProductCache.value[selectedCategory.value] = []
  // 重新随机推荐
  await loadFeaturedProducts()
}

const loadFeaturedProducts = async () => {
  isLoading.value = true

  let query = supabase
    .from('products')
    .select(`
      *,
      profiles:profiles(username)
    `)
    .eq('status', 'active')
    .eq('is_auction', false)

  // 如果选中了分类且不是"精心推荐"，添加过滤条件
  if (selectedCategory.value && selectedCategory.value !== '精心推荐') {
    query = query.eq('category', selectedCategory.value)
  }

  // 获取所有符合条件的商品
  const { data, error } = await query
    .order('created_at', { ascending: false })

  if (error || !data) {
    isLoading.value = false
    return
  }

  // 过滤掉已经推荐过的商品
  const availableProducts = data.filter((product: any) => {
    return !recommendedProductIds.value[selectedCategory.value].has(product.id)
  })

  if (availableProducts.length === 0) {
    // 如果没有可推荐的商品，显示空列表
    featuredProducts.value = []
    isLoading.value = false
    return
  }

  // 随机抽取8个商品（或全部如果不足8个）
  const productsToRecommend = Math.min(8, availableProducts.length)
  const recommended: any[] = []

  // Fisher-Yates 洗牌算法实现真正的随机
  const shuffled = [...availableProducts]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // 取前8个
  for (let i = 0; i < productsToRecommend; i++) {
    recommended.push(shuffled[i])
    // 记录已推荐的商品ID
    recommendedProductIds.value[selectedCategory.value].add(shuffled[i].id)
  }

  featuredProducts.value = recommended.map((product: any) => ({
    ...product,
    image: product.images?.[0] || 'https://via.placeholder.com/200'
  }))

  // 缓存当前分类的商品数据
  categoryProductCache.value[selectedCategory.value] = [...featuredProducts.value]

  isLoading.value = false
}

const viewProduct = (product: any) => {
  router.push(`/product/${product.id}`)
}

const goToMarket = () => {
  router.push('/market')
}

const showAuctionHelp = (item: string) => {
  MessagePlugin.info(`查看：${item}`)
}

const showRule = (rule: string) => {
  MessagePlugin.info(`查看：${rule}`)
}

const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
    }
  } catch (error) {
    console.error('Logout exception:', error)
  }

  user.value = null
  userProfile.value = null
  localStorage.clear()
  sessionStorage.clear()

  MessagePlugin.success('退出登录成功')

  setTimeout(async () => {
    await router.push('/auth')
  }, 800)
}
</script>

<style scoped>
.home-container {
  display: grid;
  grid-template-columns: 220px 1fr 280px;
  gap: 20px;
  width: 100%;
  min-height: calc(100vh - 160px);
}

/* 左侧区域 */
.left-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 191px;
  align-self: start;
  max-height: calc(100vh - 211px);
  overflow-y: auto;
}

.category-tabs {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.tab-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  color: #666;
  text-align: center;
}

.tab-item:hover {
  background: #e34d59;
  color: white;
}

.tab-item.active {
  background: #e34d59;
  color: white;
  font-weight: 600;
}

.auction-help {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.auction-help h4 {
  margin: 0 0 12px;
  color: #333;
  font-size: 15px;
}

.auction-help ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.auction-help li {
  padding: 8px 0;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: color 0.3s;
}

.auction-help li:hover {
  color: #e34d59;
}

.auction-help li:last-child {
  border-bottom: none;
}

.feature-icons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.feature-item {
  background: white;
  padding: 16px 12px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
  cursor: pointer;
}

.feature-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(227, 77, 89, 0.2);
}

.feature-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.feature-label {
  font-size: 12px;
  color: #666;
}

/* 中间区域 */
.center-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.festival-banner {
  background: linear-gradient(135deg, #e34d59 0%, #c0392b 100%);
  border-radius: 8px;
  padding: 24px;
  position: relative;
  color: white;
  overflow: hidden;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.festival-icon {
  font-size: 80px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.festival-text h2 {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 700;
}

.festival-text p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.banner-dots {
  position: absolute;
  bottom: 16px;
  right: 20px;
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s;
}

.dot.active {
  background: white;
  width: 20px;
  border-radius: 4px;
}

.dot:hover {
  background: white;
}

.rule-bar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
}

.rule-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid #e9ecef;
  position: relative;
  overflow: hidden;
  justify-content: center;
  text-align: center;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid #e9ecef;
  position: relative;
  overflow: hidden;
}

.rule-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(227, 77, 89, 0.1), transparent);
  transition: left 0.6s;
}

.rule-item:hover::before {
  left: 100%;
}

.rule-item:hover {
  background: linear-gradient(135deg, #e34d59 0%, #c0392b 100%);
  color: white;
  border-color: #e34d59;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(227, 77, 89, 0.25);
}

.rule-item:active {
  transform: translateY(-1px);
}

.rule-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
}

.rule-item:hover .rule-icon {
  transform: scale(1.2);
}

.rule-name {
  letter-spacing: 0.5px;
}

.secondhand-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e34d59;
  position: relative;
}

.header-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 24px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.section-title h3 {
  margin: 0;
  color: #e34d59;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
}

.title-badge {
  position: relative;
  color: #e34d59;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  display: inline-block;
}

.title-badge::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: linear-gradient(180deg, #e34d59 0%, #c0392b 100%);
  border-radius: 2px;
}

.title-badge::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #e34d59 0%, transparent 100%);
}

.sub-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.sub-cat {
  font-size: 13px;
  color: #666;
  cursor: pointer;
  padding: 6px 16px;
  border-radius: 20px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.sub-cat::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s;
}

.sub-cat:hover::before {
  left: 100%;
}

.sub-cat:hover {
  color: #e34d59;
  background: #fff5f5;
  border-color: #e34d59;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(227, 77, 89, 0.15);
}

.sub-cat.active {
  color: white;
  background: linear-gradient(135deg, #e34d59 0%, #c0392b 100%);
  border-color: transparent;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(227, 77, 89, 0.3);
}

.sub-cat.active::before {
  left: 100%;
}

.more-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 20px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.more-link:hover {
  color: #e34d59;
  background: #fff5f5;
  border-color: #e34d59;
  transform: translateX(3px);
  box-shadow: 0 4px 12px rgba(227, 77, 89, 0.15);
}

.more-link t-icon {
  transition: transform 0.3s;
}

.more-link:hover t-icon {
  transform: translateX(3px);
}

.refresh-btn {
  border-width: 2px !important;
  font-weight: 500;
  padding: 6px 18px !important;
  height: 36px !important;
  border-radius: 18px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(227, 77, 89, 0.25);
}

.refresh-btn:active {
  transform: translateY(0);
}

.secondhand-content {
  padding: 0;
  min-height: 400px;
  position: relative;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #e34d59;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #999;
  font-size: 14px;
  margin: 0;
}

.products-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* 商品列表过渡动画 */
.product-list-enter-active,
.product-list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-list-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.product-list-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.product-list-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(227, 77, 89, 0.2);
  border-color: #e34d59;
}

.empty-card {
  background: transparent;
  border: 2px dashed #e0e0e0;
  box-shadow: none;
  cursor: default;
}

.empty-card:hover {
  transform: none;
  box-shadow: none;
  border-color: #e0e0e0;
}

.empty-image {
  background: #fafafa;
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 75%;
  background: #f5f5f5;
  overflow: hidden;
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.product-details {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-price {
  color: #e34d59;
  font-weight: 700;
  font-size: 22px;
  margin-bottom: 8px;
  line-height: 1;
}

.product-price::before {
  content: '¥';
  font-size: 14px;
  margin-right: 2px;
}

.product-title {
  font-size: 14px;
  margin: 0 0 10px;
  color: #333;
  font-weight: 500;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.product-seller {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.product-action {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  transition: all 0.3s;
  margin-top: 4px;
}

.product-card:hover .product-action {
  background: #e34d59;
  color: white;
  transform: translateX(3px);
}

/* 右侧区域 */
.right-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 191px;
  align-self: start;
  max-height: calc(100vh - 211px);
  overflow-y: auto;
}

.sidebar-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.sidebar-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 2px solid #e34d59;
}

.news-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.news-list li {
  padding: 8px 0;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  border-bottom: 1px dashed #eee;
  transition: color 0.3s;
}

.news-list li:hover {
  color: #e34d59;
}

.news-list li:last-child {
  border-bottom: none;
}

.customer-service {
  background: linear-gradient(135deg, #fff9c4 0%, #fff59d 100%);
  border: 2px solid #fdd835;
}

.phone {
  font-size: 24px;
  font-weight: 700;
  color: #e34d59;
  margin: 12px 0 8px;
  text-align: center;
}

.work-time {
  font-size: 13px;
  color: #666;
  text-align: center;
}

.guarantees {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.guarantee-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border-radius: 6px;
  background: #fafafa;
  transition: all 0.3s;
}

.guarantee-item:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
}

.guarantee-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.guarantee-text {
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .home-container {
    grid-template-columns: 200px 1fr 260px;
  }
}

/* 中等屏幕 */
@media (max-width: 1600px) {
  .products-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 小屏幕 */
@media (max-width: 1200px) {
  .home-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }

  .left-section,
  .right-section {
    display: none;
  }

  .products-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 12px;
  }

  .products-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .product-title {
    font-size: 13px;
  }

  .product-price {
    font-size: 18px;
  }

  .product-price::before {
    font-size: 12px;
  }

  .rule-bar {
    gap: 8px;
    padding: 16px;
  }

  .rule-item {
    flex: 0 0 calc(25% - 6px);
    font-size: 12px;
    padding: 8px 10px;
  }

  .rule-icon {
    font-size: 16px;
  }

  .sub-categories {
    gap: 8px;
  }

  .sub-cat {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .products-list {
    grid-template-columns: 1fr;
  }

  .product-details {
    padding: 12px;
  }

  .festival-text h2 {
    font-size: 24px;
  }

  .festival-text p {
    font-size: 14px;
  }

  .festival-icon {
    font-size: 60px;
  }

  .rule-bar {
    padding: 12px;
    gap: 6px;
  }

  .rule-item {
    flex: 0 0 calc(50% - 3px);
    font-size: 11px;
    padding: 8px 10px;
  }

  .rule-icon {
    font-size: 14px;
  }
}
</style>
