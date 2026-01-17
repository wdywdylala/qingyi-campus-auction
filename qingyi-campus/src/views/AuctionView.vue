<template>
  <div class="auction-container">
    <!-- 筛选栏 -->
    <div class="filter-section">
      <div class="filter-group">
        <div class="filter-label">总分类：</div>
        <div class="filter-tags">
          <span
            v-for="cat in categories"
            :key="cat"
            class="filter-tag"
            :class="{ active: filters.category === (cat === '全部' ? '' : cat) }"
            @click="toggleCategory(cat)"
          >
            {{ cat }}
          </span>
        </div>
      </div>

      <div class="filter-group">
        <div class="filter-label">状态筛选：</div>
        <div class="filter-tags">
          <span
            class="filter-tag"
            :class="{ active: filters.status === 'ongoing' }"
            @click="filters.status = 'ongoing'"
          >
            正在竞拍
          </span>
          <span
            class="filter-tag"
            :class="{ active: filters.status === 'ended' }"
            @click="filters.status = 'ended'"
          >
            已结束
          </span>
          <span
            class="filter-tag"
            :class="{ active: filters.status === 'sold' }"
            @click="filters.status = 'sold'"
          >
            已成交
          </span>
        </div>
      </div>

      <div class="filter-group">
        <div class="filter-label">时间筛选：</div>
        <div class="filter-tags">
          <span
            class="filter-tag"
            :class="{ active: filters.timeRange === '' }"
            @click="filters.timeRange = ''"
          >
            全部
          </span>
          <span
            class="filter-tag"
            :class="{ active: filters.timeRange === 'today' }"
            @click="filters.timeRange = 'today'"
          >
            今天结束
          </span>
          <span
            class="filter-tag"
            :class="{ active: filters.timeRange === 'tomorrow' }"
            @click="filters.timeRange = 'tomorrow'"
          >
            明天结束
          </span>
          <span
            class="filter-tag"
            :class="{ active: filters.timeRange === 'week' }"
            @click="filters.timeRange = 'week'"
          >
            本周结束
          </span>
        </div>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="main-content">
      <!-- 商品列表区 -->
      <div class="products-section">
        <div v-if="loading" class="loading">
          <t-loading size="large" />
        </div>

        <div v-else-if="auctions.length === 0" class="empty-state">
          <t-empty description="暂无拍卖商品" />
        </div>

        <div v-else class="products-list">
          <div
            v-for="auction in auctions"
            :key="auction.id"
            class="product-card"
            @click="viewAuction(auction)"
          >
            <div v-if="auction.image" class="product-image">
              <img :src="auction.image" alt="商品图片" />
            </div>
            <div v-else class="product-image no-image">
              <t-icon name="image" size="48px" />
            </div>
              <div class="product-content">
              <h4 class="product-title">{{ auction.product?.title }}</h4>
              <p class="product-description">{{ auction.product?.description }}</p>
              <div class="product-meta">
                <span class="location">{{ auction.product?.location || '未知' }}</span>
              </div>
            </div>
            <div class="product-right">
              <div class="auction-status" :class="auction.status">
                {{ getStatusText(auction.status) }}
              </div>
              <div class="price-section">
                <span class="price-label">当前价：</span>
                <span class="price">¥{{ auction.current_price || auction.start_price }}</span>
                <span class="bid-count">{{ auction.bid_count }}次出价</span>
              </div>
              <t-button theme="primary" size="small">
                去竞拍
              </t-button>
              <div class="time-remaining">{{ formatTimeRemaining(auction.end_time) }}</div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination">
          <t-pagination
            :current="pagination.current"
            :total="pagination.total"
            :page-size="pagination.pageSize"
            :show-page-size="false"
            @change="handlePageChange"
          />
        </div>
      </div>

      <!-- 右侧辅助模块区 -->
      <div class="sidebar">
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const isInitialLoad = ref(true) // 标记是否为首次加载

const categories = [
  '全部',
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

const filters = reactive({
  category: '',
  status: 'ongoing',
  timeRange: ''
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

const auctions = ref<any[]>([])
let countdownTimerId: any = null
let refreshTimerId: any = null

const news = [
  '如何上传商品及货证',
  '如何退货退款',
  '卖家信誉等级说明',
  '平台交易规则',
  '如何安全支付'
]

const guarantees = [
  { name: '把控货源', icon: '🛡️', color: '#e34d59' },
  { name: '包退包换', icon: '✅', color: '#67c23a' },
  { name: '支持退款', icon: '🌾', color: '#e6a23c' },
  { name: '物流赔付', icon: '🚚', color: '#409eff' },
  { name: '支付安全', icon: '🔒', color: '#f56c6c' },
  { name: '服务保障', icon: '❤️', color: '#e34d59' }
]

onMounted(async () => {
  await loadAuctions()
  // 每秒更新一次倒计时显示
  countdownTimerId = setInterval(() => {
    // 触发重新渲染以更新倒计时
    auctions.value = [...auctions.value]
  }, 1000)

  // 每2秒刷新一次拍卖数据以更新出价次数
  refreshTimerId = setInterval(() => {
    loadAuctions()
  }, 2000)
})

onUnmounted(() => {
  if (countdownTimerId) {
    clearInterval(countdownTimerId)
  }
  if (refreshTimerId) {
    clearInterval(refreshTimerId)
  }
})

watch(() => route.query.search, () => {
  pagination.current = 1
  loadAuctions()
})

watch(filters, () => {
  pagination.current = 1
  loadAuctions()
}, { deep: true })

const toggleCategory = (cat: string) => {
  if (filters.category === (cat === '全部' ? '' : cat)) {
    filters.category = ''
  } else {
    filters.category = cat === '全部' ? '' : cat
  }
}

const handlePageChange = (pageInfo: any) => {
  pagination.current = pageInfo.current
  loadAuctions()
}

const loadAuctions = async () => {
  // 只在首次加载时显示loading状态，刷新时不显示
  if (isInitialLoad.value) {
    loading.value = true
  }
  try {
    let query = supabase
      .from('auctions')
      .select(`
        *,
        product:products(
          *,
          profiles:profiles(username)
        ),
        bids:bids(id)
      `)
      .order('end_time', { ascending: true })

    // 应用状态筛选
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    // 获取所有数据以便进行前端过滤
    const { data, error } = await query

    if (error) throw error

    let filteredData = data || []

    // 分类筛选
    if (filters.category) {
      filteredData = filteredData.filter((auction: any) =>
        auction.product?.category === filters.category
      )
    }

    // 时间筛选
    if (filters.timeRange) {
      filteredData = filteredData.filter((auction: any) => {
        const end = new Date(auction.end_time)
        const now = new Date()
        const diffDays = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (filters.timeRange === 'today') return diffDays === 0
        if (filters.timeRange === 'tomorrow') return diffDays === 1
        if (filters.timeRange === 'week') return diffDays <= 7
        return true
      })
    }

    // 搜索筛选
    if (route.query.search) {
      const searchTerm = (route.query.search as string).toLowerCase()
      filteredData = filteredData.filter((auction: any) => {
        const title = auction.product?.title?.toLowerCase() || ''
        const desc = auction.product?.description?.toLowerCase() || ''
        const cat = auction.product?.category?.toLowerCase() || ''
        return title.includes(searchTerm) || desc.includes(searchTerm) || cat.includes(searchTerm)
      })
    }

    // 分页
    const startIndex = (pagination.current - 1) * pagination.pageSize
    const endIndex = startIndex + pagination.pageSize
    auctions.value = filteredData
      .slice(startIndex, endIndex)
      .map((auction: any) => ({
        ...auction,
        image: auction.product?.images?.[0] || 'https://via.placeholder.com/200',
        bid_count: auction.bids?.length ?? 0
      }))

    pagination.total = filteredData.length
  } catch (error: any) {
    console.error('Load auctions error:', error)
  } finally {
    loading.value = false
    isInitialLoad.value = false // 标记首次加载完成
  }
}

const formatTimeRemaining = (endTime: string) => {
  const end = new Date(endTime)
  const now = new Date()
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) return '已结束'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return `${days}天${hours}时${minutes}分`
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    ongoing: '正在竞拍',
    ended: '已结束',
    sold: '已成交'
  }
  return statusMap[status] || status
}

const viewAuction = (auction: any) => {
  router.push(`/auction/${auction.id}`)
}
</script>

<style scoped>
.auction-container {
  width: 100%;
  background: #faf9f5;
  min-height: 100vh;
  padding: 20px;
}

/* 筛选栏 */
.filter-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filter-group {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 12px;
}

.filter-label {
  min-width: 80px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.filter-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-tag {
  padding: 6px 16px;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  color: #666;
}

.filter-tag:hover {
  background: #e34d59;
  color: white;
}

.filter-tag.active {
  background: #e34d59;
  color: white;
  font-weight: 600;
}

/* 主体内容 */
.main-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
}

/* 商品列表区 */
.products-section {
  min-height: 600px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-card {
  display: flex;
  background: white;
  border-radius: 8px;
  padding: 16px;
  gap: 16px;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  cursor: pointer;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(227, 77, 89, 0.15);
  transform: translateX(4px);
}

.product-image {
  width: 140px;
  height: 140px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-image.no-image {
  color: #ccc;
}

.product-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.product-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #333;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.product-title:hover {
  color: #e34d59;
}

.product-description {
  margin: 0;
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}

.product-meta {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 16px;
}

.bid-count {
  color: #e34d59;
  font-weight: 500;
}

.product-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 120px;
  padding-top: 8px;
}

.auction-status {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.price-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
  border-radius: 8px;
  border: 1px solid #fde2e2;
  flex-wrap: wrap;
  justify-content: center;
}

.price-label {
  font-size: 12px;
  color: #e34d59;
  font-weight: 600;
}

.price {
  color: #e34d59;
  font-size: 22px;
  font-weight: 700;
}

.bid-count {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.time-remaining {
  font-size: 11px;
  color: #666;
}

.auction-status.ongoing {
  background: #e34d59;
  color: white;
}

.auction-status.ended {
  background: #909399;
  color: white;
}

.auction-status.sold {
  background: #67c23a;
  color: white;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.pagination :deep(.t-pagination) {
  width: auto;
}

.pagination :deep(.t-pagination__total) {
  margin-right: 20px;
  color: #666;
  font-size: 14px;
}

.pagination :deep(.t-pagination__btn) {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s;
}

.pagination :deep(.t-pagination__btn:hover) {
  transform: translateY(-2px);
}

.pagination :deep(.t-pagination__btn.t-is-current) {
  background: #e34d59;
  color: white;
  border-color: #e34d59;
}

/* 右侧边栏 */
.sidebar {
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
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }
}

@media (max-width: 768px) {
  .auction-container {
    padding: 12px;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .filter-tags {
    flex-wrap: wrap;
  }

  .filter-label {
    min-width: auto;
  }

  .product-card {
    flex-direction: column;
  }

  .product-image {
    width: 100%;
    height: 180px;
  }

  .product-right {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    padding-top: 12px;
    align-items: center;
  }

  .price {
    font-size: 18px;
  }

  .auction-status {
    font-size: 11px;
    padding: 3px 8px;
  }

  .price-section {
    padding: 6px;
  }

  .price-label {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .auction-container {
    padding: 10px;
  }

  .filter-tag {
    padding: 5px 12px;
    font-size: 12px;
  }

  .product-title {
    font-size: 14px;
  }

  .product-description {
    -webkit-line-clamp: 1;
  }

  .pagination {
    padding: 15px;
  }

  .pagination :deep(.t-pagination__btn) {
    width: 32px;
    height: 32px;
  }
}
</style>
