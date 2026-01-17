<template>
  <div class="market-container">
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
        <div class="filter-label">类别：</div>
        <div class="filter-tags">
          <span
            class="filter-tag"
            :class="{ active: !filters.category }"
            @click="clearCategory"
          >
            全部
          </span>
        </div>
      </div>

      <div class="filter-group">
        <div class="filter-label">价格筛选：</div>
        <div class="filter-tags">
          <span
            v-for="price in priceRanges"
            :key="price.value"
            class="filter-tag"
            :class="{ active: filters.priceRange === price.value }"
            @click="togglePrice(price.value)"
          >
            {{ price.label }}
          </span>
        </div>
      </div>

      <div class="filter-group">
        <div class="filter-label">高级筛选：</div>
        <div class="advanced-filter">
          <t-select v-model="filters.sortBy" placeholder="默认" size="small">
            <t-option value="default" label="默认">默认</t-option>
            <t-option value="price-asc" label="价格从低到高">价格从低到高</t-option>
            <t-option value="price-desc" label="价格从高到低">价格从高到低</t-option>
            <t-option value="newest" label="最新发布">最新发布</t-option>
          </t-select>
          <t-select v-model="filters.province" placeholder="不限省份" size="small">
            <t-option value="" label="不限省份">不限省份</t-option>
            <t-option v-for="prov in provinces" :key="prov" :value="prov" :label="prov">{{ prov }}</t-option>
          </t-select>
          <t-select v-model="filters.campus" placeholder="不限校区" size="small">
            <t-option value="" label="不限校区">不限校区</t-option>
            <t-option value="清华" label="清华大学">清华大学</t-option>
            <t-option value="北大" label="北京大学">北京大学</t-option>
            <t-option value="复旦" label="复旦大学">复旦大学</t-option>
            <t-option value="上交" label="上海交通大学">上海交通大学</t-option>
            <t-option value="其他" label="其他">其他</t-option>
          </t-select>
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

        <div v-else-if="products.length === 0" class="empty-state">
          <t-empty description="暂无商品" />
        </div>

        <div v-else class="products-list">
          <div
            v-for="product in products"
            :key="product.id"
            class="product-card"
            @click="viewProduct(product)"
          >
            <div v-if="product.image" class="product-image">
              <img :src="product.image" alt="商品图片" />
            </div>
            <div v-else class="product-image no-image">
              <t-icon name="image" size="48px" />
            </div>
            <div class="product-content">
              <h4 class="product-title">{{ product.title }}</h4>
              <p class="product-description">{{ product.description }}</p>
              <div class="product-meta">
                <span class="location">{{ product.location || '未知' }}</span>
              </div>
            </div>
            <div class="product-right">
              <div class="price">¥{{ product.price }}</div>
              <t-button theme="primary" size="small">
                去看看
              </t-button>
              <div class="views">{{ product.view_count || 0 }} 人浏览</div>
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

        <!-- 答疑区 -->
        <div class="sidebar-section">
          <h4 class="sidebar-title">答疑区 <span class="view-all" @click="viewAllQuestions">查看全部 ({{ questions.length }})</span></h4>
          <ul class="questions-list">
            <li v-for="q in questions" :key="q">{{ q }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

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

const provinces = [
  '北京', '上海', '天津', '重庆', '河北', '山西', '辽宁', '吉林', '黑龙江',
  '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北',
  '湖南', '广东', '海南', '四川', '贵州', '云南', '陕西', '甘肃',
  '青海', '台湾', '内蒙古', '广西', '西藏', '宁夏', '新疆', '香港', '澳门'
]

const priceRanges = [
  { label: '全部', value: '' },
  { label: '100元以下', value: '0-100' },
  { label: '100-200元', value: '100-200' },
  { label: '200-300元', value: '200-300' },
  { label: '300-400元', value: '300-400' },
  { label: '400-600元', value: '400-600' },
  { label: '600-800元', value: '600-800' },
  { label: '800-1000元', value: '800-1000' },
  { label: '1000元以上', value: '1000+' }
]

const filters = reactive({
  category: '',
  priceRange: '',
  sortBy: 'default',
  province: '',
  campus: ''
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

const products = ref<any[]>([])

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

const questions = [
  '我是问题一',
  '我是问题二',
  '我是问题三',
  '我是问题四',
  '我是问题五'
]

onMounted(async () => {
  await loadProducts()
})

watch(() => route.query.search, () => {
  pagination.current = 1
  loadProducts()
})

watch(filters, () => {
  pagination.current = 1
  loadProducts()
}, { deep: true })

const toggleCategory = (cat: string) => {
  if (filters.category === (cat === '全部' ? '' : cat)) {
    filters.category = ''
  } else {
    filters.category = cat === '全部' ? '' : cat
  }
}

const clearCategory = () => {
  filters.category = ''
}

const togglePrice = (value: string) => {
  if (filters.priceRange === value) {
    filters.priceRange = ''
  } else {
    filters.priceRange = value
  }
}

const handlePageChange = (pageInfo: any) => {
  pagination.current = pageInfo.current
  loadProducts()
}

const viewProduct = (product: any) => {
  router.push(`/product/${product.id}`)
}

const viewAllQuestions = () => {
  console.log('查看全部问题')
}

const loadProducts = async () => {
  loading.value = true
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        profiles:profiles(username)
      `)
      .eq('is_auction', false)
      .eq('status', 'active')

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (route.query.search) {
      const searchTerm = route.query.search as string
      query = query.or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`
      )
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.replace('+', '').split('-').map(Number)
      query = query.gte('price', min)
      if (max) {
        query = query.lte('price', max)
      }
    }

    if (filters.province) {
      query = query.ilike('location', `%${filters.province}%`)
    }

    if (filters.campus) {
      query = query.ilike('location', `%${filters.campus}%`)
    }

    // 排序
    if (filters.sortBy === 'price-asc') {
      query = query.order('price', { ascending: true })
    } else if (filters.sortBy === 'price-desc') {
      query = query.order('price', { ascending: false })
    } else if (filters.sortBy === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query.range(
      (pagination.current - 1) * pagination.pageSize,
      pagination.current * pagination.pageSize - 1
    )

    if (error) throw error

    products.value = (data || []).map((product: any) => ({
      ...product,
      image: product.images?.[0],
      view_count: Math.floor(Math.random() * 10000) // 模拟浏览次数
    }))

    // 获取总数
    let countQuery = supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_auction', false)
      .eq('status', 'active')

    if (filters.category) {
      countQuery = countQuery.eq('category', filters.category)
    }

    const { count } = await countQuery
    pagination.total = count || 0
  } catch (error: any) {
    console.error('Load products error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.market-container {
  width: 100%;
  background: #faf9f5; /* 米白浅黄底色 */
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

.advanced-filter {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.advanced-filter .t-select {
  flex: 0 1 auto;
  min-width: 100px;
  max-width: 140px;
}

.advanced-filter :deep(.t-input__wrap) {
  border-radius: 6px;
  border-color: #e0e0e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.advanced-filter :deep(.t-input__wrap:hover) {
  border-color: #e34d59;
  box-shadow: 0 2px 8px rgba(227, 77, 89, 0.1);
}

.advanced-filter :deep(.t-input__inner) {
  font-size: 13px;
  color: #333;
}

.advanced-filter :deep(.t-select__placeholder) {
  color: #999;
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
}

.product-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 100px;
  padding-top: 8px;
}

.price {
  color: #e34d59;
  font-size: 20px;
  font-weight: 700;
}

.views {
  font-size: 11px;
  color: #999;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-all {
  font-size: 12px;
  color: #e34d59;
  cursor: pointer;
  font-weight: normal;
}

.view-all:hover {
  text-decoration: underline;
}

.news-list,
.questions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.news-list li,
.questions-list li {
  padding: 8px 0;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  border-bottom: 1px dashed #eee;
  transition: color 0.3s;
}

.news-list li:hover,
.questions-list li:hover {
  color: #e34d59;
}

.news-list li:last-child,
.questions-list li:last-child {
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
  .market-container {
    padding: 12px;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-tags {
    flex-wrap: wrap;
  }

  .advanced-filter {
    flex-direction: column;
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
  }

  .price {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .filter-label {
    min-width: auto;
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