<template>
  <div class="auction-detail-container">
    <div v-if="loading" class="loading-state">
      <t-loading size="large" text="加载中..." />
    </div>

    <div v-else-if="error" class="error-state">
      <t-empty description="加载失败：{{ error }}" />
    </div>

    <div v-else-if="auction && product" class="product-content">
      <!-- 返回按钮 -->
      <div class="back-button-container">
        <button class="back-button" @click="goBack">
          <t-icon name="chevron-left" class="back-icon" />
          <span class="back-text">返回</span>
        </button>
      </div>

      <!-- 面包屑导航 -->
      <t-breadcrumb :items="breadcrumbItems" class="breadcrumb" />

      <!-- 商品主要信息 -->
      <t-card class="product-main-card">
        <div class="product-gallery">
          <div v-if="product.images && product.images.length > 0" class="image-carousel">
            <img
              :src="currentImage"
              class="main-image"
              @click="openPreview"
              @mouseenter="isHovering = true"
              @mouseleave="isHovering = false"
              style="cursor: zoom-in"
            />
            <!-- 轮播指示器 -->
            <div v-if="product.images.length > 1" class="carousel-indicators">
              <div class="indicator-info">
                {{ currentImageIndex + 1 }} / {{ product.images.length }}
              </div>
              <div class="carousel-dots">
                <span
                  v-for="(img, index) in product.images"
                  :key="index"
                  :class="{ active: index === currentImageIndex }"
                  @click="currentImageIndex = Number(index)"
                  class="carousel-dot"
                ></span>
              </div>
            </div>
            <div v-if="product.images.length > 1" class="image-thumbnails">
              <img
                v-for="(img, index) in product.images"
                :key="index"
                :src="img"
                :class="{ active: index === currentImageIndex }"
                @click="currentImageIndex = Number(index)"
                class="thumbnail"
              />
            </div>
          </div>
          <img v-else src="/placeholder.png" class="main-image" alt="商品图片" />
        </div>

        <div class="product-info">
          <h1 class="product-title">{{ product.title }}</h1>
          <p v-if="product.category" class="product-category">
            <t-tag theme="primary" size="small">{{ product.category }}</t-tag>
          </p>

          <div class="product-price-section">
            <div class="price-header">
              <p class="auction-price">
                <span class="price-label">当前最高价:</span>
                <span class="current-price">¥{{ currentPrice }}</span>
              </p>
            </div>
            <p class="start-price">
              <span class="price-label">起拍价:</span>
              <span class="price">¥{{ auction.start_price }}</span>
            </p>
            <p class="deposit-price">
              <span class="price-label">保证金:</span>
              <span class="price">¥{{ auction.deposit_amount }}</span>
            </p>
            <p class="time-left-display">
              <span class="price-label">剩余时间:</span>
              <span class="time-value">{{ timeLeft }}</span>
            </p>
            <p v-if="product.location" class="product-location">
              <t-icon name="location" /> {{ product.location }}
            </p>
          </div>

          <div class="product-meta">
            <div class="meta-item">
              <span class="meta-label">卖家:</span>
              <span class="meta-value">{{ product.seller?.username || '未知' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">发布时间:</span>
              <span class="meta-value">{{ formatDate(product.created_at) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">结束时间:</span>
              <span class="meta-value">{{ formatDateTime(auction.end_time) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">出价次数:</span>
              <span class="meta-value">{{ bidCount }}次</span>
            </div>
            <div v-if="product.view_count" class="meta-item">
              <span class="meta-label">浏览量:</span>
              <span class="meta-value">{{ product.view_count }}</span>
            </div>
          </div>

          <t-divider />

          <div class="product-description">
            <h3>商品描述</h3>
            <p>{{ product.description || '暂无描述' }}</p>
          </div>

          <!-- 操作按钮 -->
          <div class="product-actions">
            <t-button
              theme="danger"
              size="large"
              @click="placeBid"
              :disabled="!isLoggedIn || auction.status !== 'ongoing'"
            >
              参与拍卖
            </t-button>
            <t-button
              theme="default"
              size="large"
              @click="toggleFavorite"
              :disabled="!isLoggedIn"
            >
              <t-icon :name="isFavorited ? 'heart-filled' : 'heart'" />
              {{ isFavorited ? '已收藏' : '收藏' }}
            </t-button>
          </div>

          <div v-if="!isLoggedIn" class="login-tip">
            <t-alert theme="warning">
              请 <t-link theme="primary" @click="router.push('/auth')">登录</t-link> 后进行拍卖或收藏
            </t-alert>
          </div>

          <div v-if="auction.status !== 'ongoing'" class="auction-status-alert">
            <t-alert theme="info">
              {{ getStatusText(auction.status) }}
            </t-alert>
          </div>
        </div>
      </t-card>

      <!-- 出价历史记录 -->
      <t-card class="bid-history-card">
        <template #title>
          <div class="bid-history-title">出价记录 ({{ bidCount }}次)</div>
        </template>
        <div v-if="bidHistory.length === 0" class="no-bids">
          暂无出价记录
        </div>
        <div v-else class="bid-history-container">
          <div class="bid-history-list">
            <div
              v-for="(bid, index) in bidHistory"
              :key="bid.id"
              class="bid-history-item"
              :class="{ 'is-highest': index === 0 }"
            >
            <div class="bid-info">
              <t-avatar
                :image="bid.bidder?.avatar_url"
                size="32px"
              >
                {{ bid.bidder?.username?.[0] || 'U' }}
              </t-avatar>
              <div class="bid-details">
                <div class="bid-user">{{ bid.bidder?.username || '匿名用户' }}</div>
                <div class="bid-time">{{ formatDateTime(bid.bid_time) }}</div>
              </div>
            </div>
            <div class="bid-amount">¥{{ bid.bid_amount }}</div>
          </div>
          </div>
        </div>
      </t-card>

      <!-- 商品评论区 -->
      <t-card class="comments-card">
        <template #title>
          <div class="comments-title">商品评价</div>
        </template>

        <!-- 评分统计 -->
        <div class="rating-summary" v-if="comments.length > 0">
          <div class="rating-overview">
            <div class="average-rating">
              <div class="rating-number">{{ averageRating.toFixed(1) }}</div>
              <t-rate :value="averageRating" :count="5" size="large" readonly />
              <div class="rating-count">{{ comments.length }} 条评价</div>
            </div>
            <div class="rating-distribution">
              <div v-for="star in 5" :key="star" class="rating-bar">
                <span class="rating-label">{{ 6 - star }}星</span>
                <div class="rating-progress">
                  <div
                    class="rating-progress-fill"
                    :style="{ width: getRatingPercentage(6 - star) + '%' }"
                  ></div>
                </div>
                <span class="rating-count">{{ getRatingCount(6 - star) }}</span>
              </div>
            </div>
          </div>
        </div>

        <t-divider v-if="comments.length > 0" />

        <!-- 评论筛选和排序 -->
        <div class="comment-filters" v-if="comments.length > 0">
          <div class="filter-stars">
            <t-button
              v-for="star in [0, 5, 4, 3, 2, 1]"
              :key="star"
              :theme="selectedRating === star ? 'primary' : 'default'"
              size="small"
              @click="filterByRating(star)"
            >
              {{ star === 0 ? '全部' : star + '星' }}
              <t-tag v-if="star > 0 && getRatingCount(star) > 0" size="small" variant="light">
                {{ getRatingCount(star) }}
              </t-tag>
            </t-button>
          </div>
          <t-select
            v-model="commentSort"
            size="small"
            class="sort-select"
          >
            <t-option value="latest" label="最新发布">最新发布</t-option>
            <t-option value="highest" label="评分从高到低">评分从高到低</t-option>
            <t-option value="lowest" label="评分从低到高">评分从低到高</t-option>
          </t-select>
        </div>

        <t-divider v-if="comments.length > 0" />

        <div class="comment-input-section">
          <div v-if="isLoggedIn">
            <t-textarea
              v-model="newComment"
              placeholder="分享你的使用体验，帮助其他买家做出更好的选择..."
              :maxlength="500"
              :autosize="{ minRows: 3, maxRows: 6 }"
              class="comment-input"
            />
            <div class="comment-actions">
              <div class="rating-section">
                <span class="rating-label">评分：</span>
                <t-rate v-model="newRating" :count="5" />
                <span class="rating-text">{{ getRatingText(newRating) }}</span>
              </div>
              <t-button theme="primary" @click="submitComment" :loading="submittingComment">
                发表评价
              </t-button>
            </div>
          </div>
          <div v-else class="login-tip">
            <t-alert theme="info">
              请 <t-link theme="primary" @click="router.push('/auth')">登录</t-link> 后发表评价
            </t-alert>
          </div>
        </div>

        <div v-if="loadingComments" class="loading-state">
          <t-loading size="large" text="加载评论中..." />
        </div>

        <div v-else-if="filteredComments.length === 0" class="empty-comments">
          <t-empty description="暂无符合条件的评价" />
        </div>

        <div v-else class="comments-container">
          <div class="comments-list">
          <div v-for="comment in filteredComments" :key="comment.id" class="comment-item">
            <div class="comment-avatar">
              <t-avatar
                :image="comment.user?.avatar_url"
                size="48px"
              >
                {{ comment.user?.username?.[0] || 'U' }}
              </t-avatar>
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-username">{{ comment.user?.username || '匿名用户' }}</span>
                <div class="comment-meta">
                  <t-rate
                    :value="comment.rating"
                    :count="5"
                    size="small"
                    readonly
                  />
                  <span class="comment-time">{{ formatDateTime(comment.created_at) }}</span>
                </div>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
              <div class="comment-footer">
                <div class="comment-likes" @click="toggleLike(comment)">
                  <t-icon :name="comment.isLiked ? 'heart-filled' : 'heart'" />
                  <span>{{ comment.likes || 0 }}</span>
                </div>
                <t-button variant="text" size="small" @click="showReplyDialog(comment)">
                  回复
                </t-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasMoreComments" class="load-more">
          <t-button variant="outline" @click="loadMoreComments" :loading="loadingMore">
            {{ loadingMore ? '加载中...' : '加载更多评价' }}
          </t-button>
        </div>
      </t-card>
    </div>

    <!-- 出价对话框 -->
    <t-dialog
      v-model:visible="showBidDialog"
      header="参与拍卖"
      width="500px"
      :confirm-btn="null"
      :cancel-btn="null"
      @close="cancelBid"
    >
      <div class="bid-dialog-content">
        <div class="bid-info-section">
          <div class="info-row">
            <span class="info-label">当前最高价：</span>
            <span class="info-value current">¥{{ highestBid }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">起拍价：</span>
            <span class="info-value">¥{{ auction?.start_price || 0 }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">最低加价：</span>
            <span class="info-value">¥{{ minBidIncrement }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">保证金：</span>
            <span class="info-value highlight">¥{{ auction?.deposit_amount || 0 }}</span>
          </div>
        </div>

        <div class="bid-input-section">
          <label class="input-label">出价金额</label>
          <t-input-number
            v-model="bidAmount"
            :min="minBidAmount"
            :step="minBidIncrement"
            :decimal-places="2"
            size="large"
            placeholder="请输入出价金额"
            class="bid-input"
          >
            <template #prefix>
              <span style="color: #666">¥</span>
            </template>
          </t-input-number>
          <p class="bid-tip">最低出价：¥{{ minBidAmount }}</p>
        </div>

        <t-alert theme="info" class="bid-alert">
          <template #icon>
            <t-icon name="info-circle" />
          </template>
          <div>
            <p style="margin: 0 0 8px;">当前最高价 <strong>¥{{ highestBid }}</strong>，您的出价必须高于此价格。</p>
            <p style="margin: 0;">出价成功后将从您的账户扣除 ¥{{ auction?.deposit_amount || 0 }} 作为保证金。如果您的出价被超越，保证金将在拍卖结束后自动退回。</p>
          </div>
        </t-alert>

        <div class="bid-actions">
          <t-button theme="default" @click="cancelBid" :disabled="bidding">取消</t-button>
          <t-button theme="danger" @click="confirmBid" :loading="bidding" :disabled="bidding">
            立即出价
          </t-button>
        </div>
      </div>
    </t-dialog>

    <!-- 图片预览模态框 -->
    <transition name="preview-fade">
      <div v-if="showPreview" class="image-preview-modal" @click="closePreview">
        <div class="preview-header">
          <div class="preview-info">
            {{ currentImageIndex + 1 }} / {{ product.images.length }}
          </div>
          <button class="preview-close-btn" @click.stop="closePreview">
            <t-icon name="close" size="24px" />
          </button>
        </div>
        <div class="preview-content" @click.stop>
          <button v-if="product.images.length > 1" class="preview-nav-btn prev" @click.stop="prevImage">
            <t-icon name="chevron-left" size="32px" />
          </button>
          <img
            :src="currentImage"
            class="preview-image"
            :alt="product.title"
          />
          <button v-if="product.images.length > 1" class="preview-nav-btn next" @click.stop="nextImage">
            <t-icon name="chevron-right" size="32px" />
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { supabase } from '@/utils/supabase'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const isInitialLoad = ref(true) // 标记是否为首次加载
const auction = ref<any>(null)
const product = ref<any>(null)
const comments = ref<any[]>([])
const loadingComments = ref(false)
const isLoggedIn = ref(false)
const isRefreshing = ref(false) // 实时刷新中状态
const isFavorited = ref(false)
const newComment = ref('')
const newRating = ref(5)
const currentUser = ref<any>(null)
const currentImageIndex = ref(0)
const carouselTimer = ref<number | null>(null)
const isHovering = ref(false)
const showPreview = ref(false)
const selectedRating = ref(0)
const commentSort = ref('latest')
const submittingComment = ref(false)
const loadingMore = ref(false)
const hasMoreComments = ref(true)
const bidAmount = ref(0)
const showBidDialog = ref(false)
const bidHistory = ref<any[]>([])
const minBidIncrement = 10 // 最低加价幅度
const bidding = ref(false) // 出价中状态
let countdownTimer: any = null
let refreshTimer: any = null // 实时刷新定时器

// 当前图片
const currentImage = computed(() => {
  return product.value?.images?.[currentImageIndex.value] || '/placeholder.png'
})

// 当前价格
const currentPrice = computed(() => {
  return auction.value?.current_price || auction.value?.start_price || 0
})

// 当前最高出价（用于实时显示）
const highestBid = computed(() => {
  if (bidHistory.value.length > 0) {
    return bidHistory.value[0]?.bid_amount || auction.value?.current_price || 0
  }
  return auction.value?.current_price || auction.value?.start_price || 0
})

// 剩余时间
const timeLeft = ref('')

// 更新倒计时显示
const updateCountdownDisplay = () => {
  if (!auction.value?.end_time) {
    timeLeft.value = ''
    return
  }
  
  const end = new Date(auction.value.end_time)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  
  if (diff <= 0) {
    timeLeft.value = '已结束'
    return
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  timeLeft.value = `${days}天${hours}时${minutes}分${seconds}秒`
}

// 出价次数
const bidCount = computed(() => {
  return bidHistory.value.length || 0
})

// 最低出价
const minBidAmount = computed(() => {
  // 如果有出价记录，使用最高出价
  if (bidHistory.value.length > 0) {
    return bidHistory.value[0]?.bid_amount + minBidIncrement
  }
  // 否则使用起拍价
  return (auction.value?.current_price || auction.value?.start_price || 0) + minBidIncrement
})

// 面包屑
const breadcrumbItems = computed(() => {
  return [
    { value: '/', label: '首页' },
    { value: '/auction', label: '竞价拍卖' },
    { value: `/auction/${route.params.id}`, label: product.value?.title || '拍卖详情' }
  ]
})

// 平均评分
const averageRating = computed(() => {
  if (!comments.value || comments.value.length === 0) return 0
  const total = comments.value.reduce((sum, comment) => sum + (comment.rating || 5), 0)
  return total / comments.value.length
})

// 过滤后的评论
const filteredComments = computed(() => {
  let filtered = [...comments.value]

  // 按评分筛选
  if (selectedRating.value > 0) {
    filtered = filtered.filter(comment => comment.rating === selectedRating.value)
  }

  // 按排序方式排序
  switch (commentSort.value) {
    case 'highest':
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      break
    case 'lowest':
      filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0))
      break
    case 'latest':
    default:
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      break
  }

  return filtered
})

onMounted(async () => {
  await checkLogin()

  // 先加载拍卖数据，确保auction.value有值
  await loadAuction()

  // 然后并行加载其他数据
  await Promise.all([
    loadComments(),
    loadBidHistory()
  ])

  // 启动倒计时
  if (auction.value?.end_time) {
    updateCountdown()
  }

  // 启动自动轮播
  startAutoCarousel()

  // 启动实时刷新（每5秒刷新一次拍卖信息）- 等待数据加载完成后再启动
  if (auction.value?.id) {
    startRealTimeRefresh()
  }
})

onUnmounted(() => {
  // 清除轮播定时器
  stopAutoCarousel()

  // 清除倒计时定时器
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }

  // 清除实时刷新定时器
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

const goBack = () => {
  router.back()
}

const checkLogin = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  isLoggedIn.value = !!session?.user
  currentUser.value = session?.user || null
}

const loadAuction = async () => {
  const auctionId = route.params.id
  if (!auctionId) {
    error.value = '拍卖ID无效'
    loading.value = false
    return
  }

  // 只在首次加载时显示loading状态
  if (isInitialLoad.value) {
    loading.value = true
  }

  try {
    const { data: auctionData, error: auctionError } = await supabase
      .from('auctions')
      .select(`
        *,
        product:products(
          *,
          seller:seller_id(username, avatar_url)
        )
      `)
      .eq('id', auctionId)
      .single()

    if (auctionError) throw auctionError

    auction.value = auctionData
    product.value = auctionData.product

    loading.value = false
    isInitialLoad.value = false // 标记首次加载完成

    // 数据加载完成后，启动实时刷新（如果还未启动）
    if (auction.value?.id && !refreshTimer) {
      startRealTimeRefresh()
    }
  } catch (err: any) {
    error.value = err.message || '加载拍卖失败'
    loading.value = false
    isInitialLoad.value = false
  }
}

const loadComments = async () => {
  const productId = product.value?.id
  if (!productId) return

  loadingComments.value = true

  try {
    const { data, error: commentsError } = await supabase
      .from('comments')
      .select(`
        *,
        user:user_id(username, avatar_url)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (commentsError) throw commentsError

    comments.value = (data || []).map(comment => ({
      ...comment,
      likes: comment.likes || 0,
      isLiked: false
    }))
    loadingComments.value = false

    // 检查是否已收藏
    await checkFavorite()
  } catch (err: any) {
    console.error('加载评论失败:', err)
    MessagePlugin.error('加载评论失败')
    loadingComments.value = false
  }
}

const checkFavorite = async () => {
  if (!isLoggedIn.value || !product.value?.id) return

  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .eq('product_id', product.value.id)
      .maybeSingle() // 使用maybeSingle而不是single，避免没有收藏时报错

    isFavorited.value = !!data
  } catch (err) {
    console.error('检查收藏失败:', err)
    isFavorited.value = false
  }
}

const loadBidHistory = async () => {
  if (!auction.value?.id) return

  try {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        bidder:bidder_id(username, avatar_url)
      `)
      .eq('auction_id', auction.value.id)
      .order('bid_time', { ascending: false })
      .limit(10)

    if (error) throw error

    console.log('加载出价历史:', data?.length || 0, '条记录')
    bidHistory.value = data || []
  } catch (err: any) {
    console.error('加载出价历史失败:', err)
  }
}

const placeBid = async () => {
  if (!isLoggedIn.value || !auction.value?.id) {
    MessagePlugin.warning('请先登录后参与拍卖')
    return
  }

  if (auction.value.status !== 'ongoing') {
    MessagePlugin.warning('拍卖已结束，无法出价')
    return
  }

  // 检查是否是卖家自己
  if (product.value?.seller_id === currentUser.value.id) {
    MessagePlugin.warning('不能参与自己发布的拍卖')
    return
  }

  // 检查拍卖是否还有时间
  if (auction.value.end_time) {
    const endTime = new Date(auction.value.end_time)
    const now = new Date()
    if (endTime <= now) {
      MessagePlugin.warning('拍卖时间已到，无法出价')
      return
    }
  }

  // 初始化出价金额为最低出价
  bidAmount.value = minBidAmount.value
  showBidDialog.value = true
}

const confirmBid = async () => {
  if (!auction.value?.id || !currentUser.value?.id) return

  // 验证出价金额
  if (bidAmount.value < minBidAmount.value) {
    MessagePlugin.error(`出价金额不能低于 ¥${minBidAmount.value}`)
    return
  }

  bidding.value = true

  try {
    // 确保用户有 profiles 记录
    const profileReady = await ensureUserProfile()
    if (!profileReady) {
      MessagePlugin.error('用户信息不完整，请重新登录')
      bidding.value = false
      return
    }

    // 1. 创建出价记录（现在允许重复出价）
    const { data: bidData, error: bidError } = await supabase
      .from('bids')
      .insert({
        auction_id: auction.value.id,
        bidder_id: currentUser.value.id,
        bid_amount: bidAmount.value
      })
      .select()
      .single()

    if (bidError) throw bidError

    // 2. 更新拍卖表的当前价格
    const { error: updateError } = await supabase
      .from('auctions')
      .update({
        current_price: bidAmount.value
      })
      .eq('id', auction.value.id)

    if (updateError) {
      console.error('更新拍卖价格失败:', updateError)
      // 即使更新价格失败，出价记录也已创建
    }

    // 出价成功
    MessagePlugin.success(`出价成功！¥${bidAmount.value} 是当前最高价`)

    // 关闭对话框
    showBidDialog.value = false
    bidAmount.value = 0
    bidding.value = false

    // 立即刷新出价历史和拍卖信息
    await Promise.all([
      loadAuction(),
      loadBidHistory()
    ])

  } catch (err: any) {
    console.error('出价失败:', err)
    bidding.value = false

    if (err.code === '23503') {
      // 外键约束错误
      MessagePlugin.error('出价失败，可能该拍卖已结束或不存在')
    } else if (err.code === '42501') {
      // 触发 WITH CHECK 约束（卖家出价）
      MessagePlugin.error('不能参与自己发布的拍卖')
    } else {
      MessagePlugin.error(err.message || '出价失败，请重试')
    }
  }
}

const cancelBid = () => {
  if (bidding.value) {
    MessagePlugin.warning('出价中，请稍候...')
    return
  }
  showBidDialog.value = false
  bidAmount.value = 0
}

// 确保用户在 profiles 表中有记录的辅助函数
const ensureUserProfile = async () => {
  if (!currentUser.value?.id) return false

  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', currentUser.value.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('检查用户档案失败:', profileError)
      return false
    }

    // 如果用户没有 profiles 记录，创建一个
    if (!profileData) {
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: currentUser.value.id,
          username: currentUser.value.user_metadata?.username ||
                    currentUser.value.email?.split('@')[0] ||
                    '用户',
          avatar_url: currentUser.value.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString()
        })

      if (createProfileError) {
        console.error('创建用户档案失败:', createProfileError)
        return false
      }

      console.log('已为用户创建 profiles 记录:', currentUser.value.id)
    }

    return true
  } catch (err) {
    console.error('确保用户档案时出错:', err)
    return false
  }
}

const toggleFavorite = async () => {
  if (!isLoggedIn.value || !product.value?.id) return

  try {
    // 确保用户有 profiles 记录
    await ensureUserProfile()

    if (isFavorited.value) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUser.value.id)
        .eq('product_id', product.value.id)

      if (error) throw error

      MessagePlugin.success('已取消收藏')
      isFavorited.value = false
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: currentUser.value.id,
          product_id: product.value.id
        })

      if (error) throw error

      MessagePlugin.success('已收藏')
      isFavorited.value = true
    }
  } catch (err: any) {
    MessagePlugin.error(err.message || '操作失败')
  }
}

const nextImage = () => {
  if (!product.value?.images || product.value.images.length === 0) return
  currentImageIndex.value = (currentImageIndex.value + 1) % product.value.images.length
}

const prevImage = () => {
  if (!product.value?.images || product.value.images.length === 0) return
  currentImageIndex.value = (currentImageIndex.value - 1 + product.value.images.length) % product.value.images.length
}

const openPreview = () => {
  showPreview.value = true
  document.body.style.overflow = 'hidden'
  stopAutoCarousel()
}

const closePreview = () => {
  showPreview.value = false
  document.body.style.overflow = ''
  startAutoCarousel()
}

const startAutoCarousel = () => {
  stopAutoCarousel()
  if (product.value?.images && product.value.images.length > 1) {
    carouselTimer.value = window.setInterval(() => {
      if (!isHovering.value) {
        nextImage()
      }
    }, 3000)
  }
}

const stopAutoCarousel = () => {
  if (carouselTimer.value) {
    clearInterval(carouselTimer.value)
    carouselTimer.value = null
  }
}

const submitComment = async () => {
  if (!isLoggedIn.value || !product.value?.id || !newComment.value.trim()) {
    MessagePlugin.warning('请先登录并填写评价内容')
    return
  }

  submittingComment.value = true

  try {
    const { error } = await supabase
      .from('comments')
      .insert({
        product_id: product.value.id,
        user_id: currentUser.value.id,
        content: newComment.value,
        rating: newRating.value
      })

    if (error) throw error

    MessagePlugin.success('评价发表成功')
    newComment.value = ''
    newRating.value = 5

    await loadComments()
  } catch (err: any) {
    console.error('发表评价错误:', err)
    let errorMessage = '发表评价失败，请重试'

    if (err.message) {
      // 解析英文错误信息，转换为中文提示
      if (err.message.includes('invalid input syntax')) {
        errorMessage = '评分格式错误，请重新选择评分'
      } else if (err.message.includes('integer')) {
        errorMessage = '评分必须是整数，请重新选择'
      } else if (err.message.includes('duplicate key')) {
        errorMessage = '您已经评价过该商品'
      } else if (err.message.includes('foreign key')) {
        errorMessage = '商品或用户信息无效'
      } else if (err.message.includes('null')) {
        errorMessage = '请填写完整的评价信息'
      } else {
        errorMessage = err.message
      }
    }

    MessagePlugin.error(errorMessage)
  } finally {
    submittingComment.value = false
  }
}

// 筛选评论
const filterByRating = (rating: number) => {
  selectedRating.value = rating
}

// 获取评分数量
const getRatingCount = (rating: number) => {
  return comments.value.filter(c => c.rating === rating).length
}

// 获取评分百分比
const getRatingPercentage = (rating: number) => {
  if (comments.value.length === 0) return 0
  const count = getRatingCount(rating)
  return Math.round((count / comments.value.length) * 100)
}

// 获取评分文字
const getRatingText = (rating: number) => {
  const texts = ['非常差', '较差', '一般', '满意', '非常满意']
  return texts[Math.round(rating) - 1] || ''
}

// 点赞评论
const toggleLike = async (comment: any) => {
  if (!isLoggedIn.value) {
    MessagePlugin.warning('请先登录')
    return
  }

  try {
    if (comment.isLiked) {
      comment.likes = (comment.likes || 0) - 1
      comment.isLiked = false
    } else {
      comment.likes = (comment.likes || 0) + 1
      comment.isLiked = true
    }
    // TODO: 这里应该调用API保存点赞状态
  } catch (err: any) {
    MessagePlugin.error('操作失败')
  }
}

// 显示回复对话框
const showReplyDialog = (comment: any) => {
  MessagePlugin.info('回复功能开发中...')
}

// 加载更多评论
const loadMoreComments = async () => {
  loadingMore.value = true
  // TODO: 实现真正的分页加载
  setTimeout(() => {
    loadingMore.value = false
    hasMoreComments.value = false
    MessagePlugin.info('已加载全部评论')
  }, 1000)
}

const updateCountdown = () => {
  if (!auction.value?.end_time) return

  // 先更新一次显示
  updateCountdownDisplay()

  countdownTimer = setInterval(() => {
    if (!auction.value?.end_time) return
    const end = new Date(auction.value.end_time)
    const now = new Date()
    if (end <= now) {
      // 拍卖结束，重新加载拍卖信息
      loadAuction()
    } else {
      // 更新倒计时显示
      updateCountdownDisplay()
    }
  }, 1000)
}

// 启动实时刷新
const startRealTimeRefresh = () => {
  // 安全检查：确保 auction 存在
  if (!auction.value?.id) {
    console.warn('拍卖数据未加载，无法启动实时刷新')
    return
  }

  // 清除已有的定时器
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }

  // 每2秒刷新一次拍卖信息
  refreshTimer = setInterval(async () => {
    if (auction.value?.status === 'ongoing') {
      await refreshAuctionData()
    }
  }, 2000)

  console.log('实时刷新已启动，拍卖ID:', auction.value.id)
}

// 刷新拍卖数据（获取最新价格和出价记录）
const refreshAuctionData = async () => {
  if (isRefreshing.value) return // 防止重复刷新

  // 安全检查：确保 auction 和 id 存在
  if (!auction.value?.id) {
    console.warn('拍卖数据未加载，跳过刷新')
    return
  }

  isRefreshing.value = true

  try {
    // 刷新拍卖信息
    const { data: auctionData, error: auctionError } = await supabase
      .from('auctions')
      .select('current_price, status, end_time')
      .eq('id', auction.value.id.toString())
      .single()

    if (auctionError) {
      console.error('刷新拍卖数据失败:', auctionError)
      // 如果是404或400错误，可能是拍卖已被删除，停止刷新
      if (auctionError.code === 'PGRST116') {
        console.warn('拍卖可能不存在，停止刷新')
      }
      return
    }

    if (auctionData) {
      // 更新当前价格
      auction.value.current_price = auctionData.current_price
      auction.value.status = auctionData.status
      auction.value.end_time = auctionData.end_time

      // 每次刷新都更新出价历史，以便看到实时的出价记录
      await loadBidHistory()

      console.log('刷新完成，当前出价次数:', bidHistory.value.length)
    }
  } catch (err: any) {
    console.error('刷新拍卖数据异常:', err)
    // 如果是网络错误或API错误，不影响后续刷新
    if (err?.status === 404 || err?.code === 'PGRST116') {
      console.warn('拍卖不存在，可能需要重新加载页面')
    }
  } finally {
    isRefreshing.value = false
  }
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    ongoing: '正在拍卖',
    ended: '已结束',
    sold: '已成交'
  }
  return statusMap[status] || status
}

const formatDate = (date: string) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

const formatDateTime = (date: string) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.auction-detail-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.back-button-container {
  margin-bottom: 20px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border: 2px solid #e8eef3;
  border-radius: 12px;
  color: #495057;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.back-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #e34d59 0%, #f0656e 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.back-button:hover {
  border-color: #e34d59;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
  color: #e34d59;
  box-shadow: 0 4px 16px rgba(227, 77, 89, 0.15);
  transform: translateX(-2px);
}

.back-button:hover::before {
  opacity: 1;
}

.back-button:active {
  transform: translateX(0) scale(0.98);
  box-shadow: 0 2px 8px rgba(227, 77, 89, 0.1);
}

.back-icon {
  font-size: 18px;
  transition: transform 0.3s ease;
}

.back-button:hover .back-icon {
  transform: translateX(-2px);
}

.back-text {
  letter-spacing: 0.5px;
}

.loading-state,
.error-state {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.breadcrumb {
  margin: 0 0 20px;
}

.product-main-card {
  margin-bottom: 20px;
}

.product-main-card :deep(.t-card__body) {
  display: flex;
  gap: 40px;
  padding: 40px;
}

.product-gallery {
  flex: 0 0 auto;
  width: 500px;
}

.image-carousel {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.main-image {
  width: 100%;
  height: 500px;
  object-fit: cover;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
}

.main-image:hover {
  opacity: 0.9;
}

/* 轮播指示器 */
.carousel-indicators {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
}

.indicator-info {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.carousel-dots {
  display: flex;
  gap: 8px;
  pointer-events: auto;
}

.carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s;
}

.carousel-dot:hover {
  background: rgba(255, 255, 255, 0.8);
}

.carousel-dot.active {
  background: white;
  transform: scale(1.2);
}

.image-thumbnails {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  overflow-x: auto;
}

.thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.3s;
}

.thumbnail:hover {
  border-color: #e34d59;
}

.thumbnail.active {
  border-color: #e34d59;
  opacity: 1;
}

.product-info {
  flex: 1;
}

.product-title {
  margin: 0 0 16px;
  font-size: 28px;
  font-weight: 700;
  color: #333;
  line-height: 1.4;
}

.product-category {
  margin: 0 0 20px;
}

.product-price-section {
  background: linear-gradient(135deg, #ff6b9c 0%, #ee5a24 100%);
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.price-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.refresh-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: white;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 16px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.refresh-icon {
  font-size: 14px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.auction-price {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 20px;
}

.price-label {
  color: white;
  font-size: 14px;
}

.current-price {
  color: white;
  font-size: 36px;
  font-weight: 700;
}

.time-left-display {
  margin: 12px 0 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-left-display .price-label {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.time-value {
  color: white;
  font-size: 20px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}

.start-price,
.deposit-price {
  margin: 0 0 12px;
  text-align: left;
}

.price {
  color: white;
  font-size: 28px;
  font-weight: 700;
}

.product-location {
  margin: 12px 0 0;
  color: white;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-label {
  color: #999;
  font-size: 14px;
  min-width: 80px;
}

.meta-value {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.product-description {
  margin-bottom: 24px;
}

.product-description h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #333;
}

.product-description p {
  color: #666;
  line-height: 1.8;
  margin: 0;
}

.product-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.product-actions .t-button {
  flex: 1;
  min-width: 150px;
}

.login-tip {
  margin-top: 16px;
}

.auction-status-alert {
  margin-top: 16px;
}

.bid-history-card {
  margin-bottom: 20px;
}

.bid-history-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.no-bids {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.bid-history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
  scroll-behavior: smooth;
}

/* 自定义滚动条样式 */
.bid-history-list::-webkit-scrollbar {
  width: 6px;
}

.bid-history-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.bid-history-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  transition: background 0.3s ease;
}

.bid-history-list::-webkit-scrollbar-thumb:hover {
  background: #e34d59;
}

.bid-history-list::-webkit-scrollbar-thumb:active {
  background: #c9202a;
}

/* Firefox 滚动条样式 */
.bid-history-list {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

.bid-history-list:hover {
  scrollbar-color: #e34d59 #f1f1f1;
}

.bid-history-container {
  position: relative;
}

.bid-history-list {
  padding-bottom: 8px;
  border-radius: 8px;
}

.bid-history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  transition: all 0.3s;
}

.bid-history-item:hover {
  background: #f5f5f5;
}

.bid-history-item.is-highest {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
  border: 2px solid #e34d59;
}

.bid-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bid-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bid-user {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.bid-time {
  font-size: 12px;
  color: #999;
}

.bid-amount {
  font-size: 20px;
  font-weight: 700;
  color: #e34d59;
}

.bid-history-item.is-highest .bid-amount {
  color: #e34d59;
  font-size: 24px;
}

/* 出价对话框样式 */
.bid-dialog-content {
  padding: 20px 0;
}

.bid-info-section {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e0e0e0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.info-value.current {
  font-size: 24px;
  color: #e34d59;
  font-weight: 700;
}

.info-value.highlight {
  font-size: 20px;
  color: #e34d59;
  font-weight: 700;
}

.bid-input-section {
  margin-bottom: 24px;
}

.input-label {
  display: block;
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 8px;
}

.bid-input {
  width: 100%;
  margin-bottom: 8px;
}

.bid-input :deep(.t-input-number) {
  width: 100%;
}

.bid-tip {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.bid-alert {
  margin-bottom: 24px;
}

.bid-alert :deep(.t-alert__content) {
  font-size: 14px;
  line-height: 1.6;
}

.bid-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.bid-actions .t-button {
  min-width: 100px;
}

.comments-card {
  margin-bottom: 20px;
}

.comments-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

/* 评分统计 */
.rating-summary {
  margin-bottom: 20px;
}

.rating-overview {
  display: flex;
  gap: 40px;
  align-items: center;
}

.average-rating {
  text-align: center;
  min-width: 150px;
}

.rating-number {
  font-size: 48px;
  font-weight: 700;
  color: #333;
  line-height: 1;
  margin-bottom: 8px;
}

.rating-count {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.rating-distribution {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rating-label {
  font-size: 14px;
  color: #666;
  min-width: 40px;
}

.rating-progress {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.rating-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff9800, #e34d59);
  border-radius: 4px;
  transition: width 0.3s;
}

.rating-count {
  font-size: 14px;
  color: #999;
  min-width: 40px;
  text-align: right;
}

/* 评论筛选 */
.comment-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border: 2px solid #e8eef3;
  border-radius: 16px;
  flex-wrap: wrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.comment-filters::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #e34d59 0%, #f0656e 50%, #ff9a9e 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.comment-filters:hover {
  border-color: #e34d59;
  box-shadow: 0 4px 20px rgba(227, 77, 89, 0.12);
  transform: translateY(-1px);
}

.comment-filters:hover::before {
  opacity: 1;
}

.filter-stars {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-stars :deep(.t-button) {
  border-radius: 24px;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.filter-stars :deep(.t-button::before) {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.filter-stars :deep(.t-button:hover::before) {
  width: 300px;
  height: 300px;
}

.filter-stars :deep(.t-button--theme-default) {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 2px solid #e9ecef;
  color: #495057;
}

.filter-stars :deep(.t-button--theme-default:hover) {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
  border-color: #e34d59;
  color: #e34d59;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(227, 77, 89, 0.25);
}

.filter-stars :deep(.t-button--theme-primary) {
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 100%);
  border: 2px solid transparent;
  color: white;
  box-shadow: 0 4px 12px rgba(227, 77, 89, 0.35),
              inset 0 1px 2px rgba(255, 255, 255, 0.2);
}

.filter-stars :deep(.t-button--theme-primary:hover) {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(227, 77, 89, 0.45),
              inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.filter-stars :deep(.t-tag) {
  margin-left: 6px;
  font-weight: 600;
  border-radius: 12px;
}

.sort-select {
  width: 200px;
  flex-shrink: 0;
}

.sort-select :deep(.t-input) {
  border-radius: 12px;
  border: 2px solid #e9ecef;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.02);
}

.sort-select :deep(.t-input:hover) {
  border-color: #e34d59;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
  box-shadow: 0 0 0 4px rgba(227, 77, 89, 0.1), inset 0 1px 3px rgba(0, 0, 0, 0.02);
}

.sort-select :deep(.t-input:focus) {
  border-color: #e34d59;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
  box-shadow: 0 0 0 4px rgba(227, 77, 89, 0.15), inset 0 1px 3px rgba(0, 0, 0, 0.02);
}

.sort-select :deep(.t-select__placeholder) {
  color: #adb5bd;
  font-weight: 500;
}

.sort-select :deep(.t-select__value) {
  color: #495057;
  font-weight: 600;
}

.comment-input-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.comment-input {
  margin-bottom: 16px;
}

.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.rating-label {
  font-size: 14px;
  color: #666;
}

.rating-text {
  font-size: 14px;
  color: #e34d59;
  font-weight: 500;
}

.empty-comments {
  padding: 60px 20px;
}

.comments-container {
  position: relative;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 8px;
  padding-bottom: 8px;
  scroll-behavior: smooth;
  border-radius: 8px;
}

/* 自定义滚动条样式 */
.comments-list::-webkit-scrollbar {
  width: 6px;
}

.comments-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.comments-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  transition: background 0.3s ease;
}

.comments-list::-webkit-scrollbar-thumb:hover {
  background: #e34d59;
}

.comments-list::-webkit-scrollbar-thumb:active {
  background: #c9202a;
}

/* Firefox 滚动条样式 */
.comments-list {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

.comments-list:hover {
  scrollbar-color: #e34d59 #f1f1f1;
}

.comment-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  transition: all 0.3s;
}

.comment-item:hover {
  background: #f5f5f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.comment-username {
  font-weight: 600;
  font-size: 15px;
  color: #333;
  flex-shrink: 0;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.comment-time {
  color: #999;
  font-size: 12px;
}

.comment-text {
  color: #666;
  line-height: 1.6;
  margin: 0 0 12px;
  word-break: break-word;
}

.comment-footer {
  display: flex;
  align-items: center;
  gap: 16px;
}

.comment-likes {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: white;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 13px;
  color: #666;
}

.comment-likes:hover {
  background: #e34d59;
  color: white;
}

.comment-likes.is-liked {
  color: #e34d59;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .product-main-card :deep(.t-card__body) {
    flex-direction: column;
    gap: 24px;
  }

  .product-gallery {
    width: 100%;
  }

  .main-image {
    height: 350px;
  }

  .image-thumbnails {
    flex-wrap: wrap;
  }

  .product-actions {
    flex-direction: column;
  }

  .product-actions .t-button {
    width: 100%;
  }

  .comment-item {
    flex-direction: column;
  }

  .comment-avatar {
    margin-right: 0;
    margin-bottom: 12px;
  }

  .rating-overview {
    gap: 20px;
  }

  .comment-filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-stars {
    flex-wrap: wrap;
  }

  .sort-select {
    width: 100%;
  }

  .comment-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .rating-section {
    flex-wrap: wrap;
  }

  /* 移动端评论列表 */
  .comments-container {
    max-width: 100%;
  }

  .comments-list {
    max-height: 300px;
    padding-right: 4px;
  }

  /* 移动端出价历史 */
  .bid-history-container {
    max-width: 100%;
  }

  .bid-history-list {
    max-height: 300px;
    padding-right: 4px;
    max-height: 280px;
  }

  .bid-history-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .bid-info {
    justify-content: flex-start;
  }

  .bid-amount {
    text-align: right;
    font-size: 18px;
  }

  .bid-history-item.is-highest .bid-amount {
    font-size: 20px;
  }

  /* 移动端出价对话框 */
  .bid-info-section {
    padding: 16px;
  }

  .info-row {
    padding: 6px 0;
  }

  .info-value.current {
    font-size: 20px;
  }

  .bid-actions {
    flex-direction: column;
  }

  .bid-actions .t-button {
    width: 100%;
  }
}

/* 图片预览模态框 */
.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.3s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.preview-info {
  color: white;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 1px;
}

.preview-close-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.preview-close-btn:hover {
  background: rgba(227, 77, 89, 0.9);
  border-color: #e34d59;
  transform: rotate(90deg) scale(1.1);
}

.preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 40px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.preview-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.preview-nav-btn:hover {
  background: rgba(227, 77, 89, 0.9);
  border-color: #e34d59;
  transform: translateY(-50%) scale(1.1);
}

.preview-nav-btn.prev {
  left: 24px;
}

.preview-nav-btn.next {
  right: 24px;
}
</style>
