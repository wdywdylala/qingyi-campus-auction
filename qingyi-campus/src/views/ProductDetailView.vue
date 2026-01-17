<template>
  <div class="product-detail-container">
    <div v-if="loading" class="loading-state">
      <t-loading size="large" text="加载中..." />
    </div>

    <div v-else-if="error" class="error-state">
      <t-empty description="加载失败：{{ error }}" />
    </div>

    <div v-else-if="product" class="product-content">
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
                  @click="currentImageIndex = index"
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
                @click="currentImageIndex = index"
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
            <p v-if="product.is_auction" class="auction-price">
              <span class="price-label">当前价:</span>
              <span class="current-price">¥{{ currentPrice }}</span>
              <span v-if="product.auction?.end_time" class="time-left">
                剩余时间: {{ timeLeft }}
              </span>
            </p>
            <p v-else class="normal-price">
              <span class="price">¥{{ product.price }}</span>
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

          <!-- 飞入购物车动画元素 -->
          <div v-if="flyingCart" class="flying-cart">
            <t-icon name="cart" />
          </div>

          <!-- 操作按钮 -->
          <div class="product-actions">
            <t-button
              theme="primary"
              size="large"
              @click="addToCart"
              :disabled="!isLoggedIn"
            >
              <t-icon name="cart" /> 加入购物车
            </t-button>
            <t-button
              v-if="!product.is_auction"
              theme="danger"
              size="large"
              @click="buyNow"
              :disabled="!isLoggedIn"
            >
              立即购买
            </t-button>
            <t-button
              v-if="product.is_auction"
              theme="danger"
              size="large"
              @click="placeBid"
              :disabled="!isLoggedIn"
            >
              参与拍卖
            </t-button>
            <t-button
              theme="default"
              size="large"
              @click="toggleFavorite"
            >
              <t-icon :name="isFavorited ? 'heart-filled' : 'heart'" />
              {{ isFavorited ? '已收藏' : '收藏' }}
            </t-button>
          </div>

          <div v-if="!isLoggedIn" class="login-tip">
            <t-alert theme="warning">
              请 <t-link theme="primary" @click="router.push('/auth')">登录</t-link> 后进行购买或收藏
            </t-alert>
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
            <div class="comment-input-wrapper">
              <t-textarea
                v-model="newComment"
                placeholder="分享你的使用体验，帮助其他买家做出更好的选择..."
                :maxlength="500"
                :autosize="{ minRows: 3, maxRows: 6 }"
                class="comment-input"
                show-limit
              />
            </div>
            <div class="comment-actions">
              <div class="rating-section">
                <span class="rating-label">评分</span>
                <t-rate v-model="newRating" :count="5" />
                <span class="rating-text">{{ getRatingText(newRating) }}</span>
              </div>
              <t-button
                theme="primary"
                @click="submitComment"
                :loading="submittingComment"
                class="submit-btn"
              >
                发表评价
              </t-button>
            </div>
          </div>
          <div v-else class="login-tip">
            <t-alert theme="info" class="login-alert">
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
import eventBus from '@/utils/eventBus'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const product = ref<any>(null)
const comments = ref<any[]>([])
const loadingComments = ref(false)
const isLoggedIn = ref(false)
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

// 飞入购物车动画
const flyingCart = ref(false)
const flyingStartX = ref(0)
const flyingStartY = ref(0)

// 拍卖倒计时
const currentImage = computed(() => {
  return product.value?.images?.[currentImageIndex.value] || '/placeholder.png'
})

const currentPrice = computed(() => {
  return product.value?.auction?.current_price || product.value?.price || 0
})

const timeLeft = computed(() => {
  if (!product.value?.auction?.end_time) return ''
  const end = new Date(product.value.auction.end_time)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  if (diff <= 0) return '已结束'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  return `${days}天${hours}时${minutes}分${seconds}秒`
})

const breadcrumbItems = computed(() => {
  return [
    { value: '/', label: '首页' },
    { value: '/market', label: '交易大厅' },
    { value: `/product/${route.params.id}`, label: product.value?.title || '商品详情' }
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
  await Promise.all([
    checkLogin(),
    loadProduct(),
    loadComments()
  ])

  // 启动拍卖倒计时更新
  if (product.value?.is_auction && product.value.auction?.end_time) {
    updateCountdown()
  }

  // 启动自动轮播
  startAutoCarousel()
})

onUnmounted(() => {
  // 清除轮播定时器
  stopAutoCarousel()
})

const checkLogin = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  isLoggedIn.value = !!session?.user
  currentUser.value = session?.user || null
}

const goBack = () => {
  router.back()
}

const loadProduct = async () => {
  const productId = route.params.id
  if (!productId) {
    error.value = '商品ID无效'
    loading.value = false
    return
  }

  try {
    const { data, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        seller:seller_id(username, avatar_url),
        auction:auctions(
          *,
          current_bid:bids(
            bid_amount,
            bidder:bidder_id(username)
          )
        )
      `)
      .eq('id', productId)
      .single()

    if (productError) {
      throw productError
    }

    product.value = data
    loading.value = false
  } catch (err: any) {
    error.value = err.message || '加载商品失败'
    loading.value = false
  }
}

const loadComments = async () => {
  const productId = route.params.id
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

    // 为每条评论添加点赞相关字段
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
      .single()

    isFavorited.value = !!data
  } catch (err) {
    console.error('检查收藏失败:', err)
  }
}

const addToCart = async () => {
  if (!isLoggedIn.value || !product.value?.id) return

  try {
    // 检查购物车中是否已有此商品
    const { data: existing } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', currentUser.value.id)
      .eq('product_id', product.value.id)
      .single()

    if (existing) {
      MessagePlugin.info('该商品已在购物车中')
      return
    }

    const { error } = await supabase
      .from('cart_items')
      .insert({
        user_id: currentUser.value.id,
        product_id: product.value.id,
        quantity: 1
      })

    if (error) throw error

    MessagePlugin.success('已加入购物车')

    // 触发飞入购物车动画
    triggerFlyToCart()

    // 发出购物车更新事件
    eventBus.emit('cart:updated')
  } catch (err: any) {
    console.error('加入购物车失败:', err)
    MessagePlugin.error(getErrorMessage(err, '加入购物车失败'))
  }
}

// 触发飞入购物车动画
const triggerFlyToCart = () => {
  // 获取购物车按钮的位置
  const cartButton = document.querySelector('.floating-cart') as HTMLElement
  if (!cartButton) return

  const cartRect = cartButton.getBoundingClientRect()
  const cartCenterX = cartRect.left + cartRect.width / 2
  const cartCenterY = cartRect.top + cartRect.height / 2

  // 获取加入购物车按钮的位置
  const buttons = document.querySelectorAll('.product-actions .t-button')
  const addToCartBtn = buttons[0] as HTMLElement
  if (!addToCartBtn) return

  const btnRect = addToCartBtn.getBoundingClientRect()
  const btnCenterX = btnRect.left + btnRect.width / 2
  const btnCenterY = btnRect.top + btnRect.height / 2

  // 计算移动距离
  const deltaX = cartCenterX - btnCenterX
  const deltaY = cartCenterY - btnCenterY

  // 计算中间点，创造抛物线效果
  const midX = btnCenterX + deltaX * 0.3
  const midY = Math.min(btnCenterY, cartCenterY) - 150 // 向上抬起

  // 设置初始位置（元素现在是 50x50，所以要减去 25）
  flyingStartX.value = btnCenterX - 25
  flyingStartY.value = btnCenterY - 25

  // 显示飞入元素
  flyingCart.value = true

  // 使用 nextTick 确保元素已经渲染
  setTimeout(() => {
    const element = document.querySelector('.flying-cart') as HTMLElement
    if (element) {
      // 设置初始位置
      element.style.left = flyingStartX.value + 'px'
      element.style.top = flyingStartY.value + 'px'

      // 使用 Web Animations API 进行动画 - 添加中间关键帧创造抛物线
      const midDeltaX = midX - btnCenterX
      const midDeltaY = midY - btnCenterY

      element.animate([
        {
          // 起点
          transform: 'translate(0, 0) rotate(0deg) scale(1.2)',
          opacity: 1
        },
        {
          // 中间点（最高点）- 40%
          offset: 0.4,
          transform: `translate(${midDeltaX}px, ${midDeltaY}px) rotate(180deg) scale(1.5)`,
          opacity: 1
        },
        {
          // 终点
          transform: `translate(${deltaX}px, ${deltaY}px) rotate(360deg) scale(0.8)`,
          opacity: 0.3
        }
      ], {
        duration: 1000, // 增加到 1 秒
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
      })

      setTimeout(() => {
        flyingCart.value = false
      }, 1000)
    }
  }, 50)
}

const buyNow = async () => {
  if (!isLoggedIn.value || !product.value?.id) return

  try {
    const { error } = await supabase
      .from('orders')
      .insert({
        product_id: product.value.id,
        buyer_id: currentUser.value.id,
        seller_id: product.value.seller_id,
        total_amount: product.value.price,
        status: 'pending',
        order_type: 'normal'
      })

    if (error) throw error

    MessagePlugin.success('订单创建成功，请完成支付')
    router.push('/orders')
  } catch (err: any) {
    console.error('创建订单失败:', err)
    MessagePlugin.error(getErrorMessage(err, '创建订单失败'))
  }
}

const placeBid = async () => {
  if (!isLoggedIn.value || !product.value?.id) return

  const dialog = DialogPlugin({
    header: '出价',
    body: () => {
      const bidAmount = ref(product.value.auction?.current_price || product.value.price)
      
      const dialogBody = document.createElement('div')
      dialogBody.innerHTML = `
        <div style="padding: 20px;">
          <p>当前价格: ¥${product.value.auction?.current_price || product.value.price}</p>
          <p>出价金额:</p>
          <input id="bid-amount" type="number" min="${bidAmount.value}" step="10" value="${bidAmount.value}" style="width: 100%; padding: 8px; font-size: 16px;" />
          <p style="color: #999; font-size: 12px;">提示: 出价后不可撤销，请谨慎出价</p>
        </div>
      `
      
      setTimeout(() => {
        const input = document.getElementById('bid-amount') as HTMLInputElement
        input?.addEventListener('change', (e) => {
          bidAmount.value = Number((e.target as HTMLInputElement).value)
        })
      }, 100)
      
      return dialogBody
    },
    confirmBtn: {
      content: '确认出价',
      theme: 'danger',
      onClick: async () => {
        const input = document.getElementById('bid-amount') as HTMLInputElement
        const amount = Number(input.value)
        
        if (amount < (product.value.auction?.current_price || product.value.price)) {
          MessagePlugin.error('出价金额不能低于当前价')
          return false
        }

        try {
          const { error: bidError } = await supabase
            .from('bids')
            .insert({
              auction_id: product.value.auction.id,
              bidder_id: currentUser.value.id,
              bid_amount: amount
            })

          if (bidError) throw bidError

          MessagePlugin.success('出价成功！')
          dialog.hide()
          return true
        } catch (err: any) {
          console.error('出价失败:', err)
          MessagePlugin.error(getErrorMessage(err, '出价失败'))
          return false
        }
      }
    },
    onConfirm: () => {},
    onCancel: () => {}
  })
}

const toggleFavorite = async () => {
  if (!isLoggedIn.value || !product.value?.id) return

  try {
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
    console.error('操作失败:', err)
    MessagePlugin.error(getErrorMessage(err, '操作失败'))
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
  if (!product.value?.auction?.end_time) return
  
  setInterval(() => {
    if (!product.value?.auction?.end_time) return
    const end = new Date(product.value.auction.end_time)
    const now = new Date()
    if (end <= now) {
      // 拍卖结束，重新加载商品信息
      loadProduct()
    }
  }, 1000)
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
.product-detail-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
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

/* 飞入购物车动画 */
.flying-cart {
  position: fixed;
  z-index: 9999;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 100%);
  border-radius: 50%;
  pointer-events: none;
  font-size: 28px;
  box-shadow: 0 8px 24px rgba(227, 77, 89, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.3);
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

.time-left {
  color: white;
  font-size: 14px;
  margin-left: auto;
}

.normal-price {
  margin: 0;
  text-align: center;
}

.price {
  color: white;
  font-size: 48px;
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
  margin-bottom: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border-radius: 16px;
  border: 2px solid #f0f0f0;
  transition: all 0.3s ease;
}

.rating-summary:hover {
  border-color: #e34d59;
  box-shadow: 0 4px 20px rgba(227, 77, 89, 0.1);
}

.rating-overview {
  display: flex;
  gap: 48px;
  align-items: center;
}

.average-rating {
  text-align: center;
  min-width: 150px;
  padding: 20px;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
  border-radius: 16px;
  border: 2px solid #e34d59;
  position: relative;
  overflow: hidden;
}

.average-rating::before {
  content: '★';
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 30px;
  color: #ffd700;
  text-shadow: 0 2px 4px rgba(255, 215, 0, 0.4);
}

.rating-number {
  font-size: 52px;
  font-weight: 700;
  color: #e34d59;
  line-height: 1;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(227, 77, 89, 0.2);
}

.rating-count {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  font-weight: 500;
}

.rating-distribution {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.rating-bar:hover {
  gap: 16px;
}

.rating-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  min-width: 45px;
}

.rating-progress {
  flex: 1;
  height: 10px;
  background: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.rating-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff9800 0%, #e34d59 50%, #f0656e 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.rating-progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
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
  margin-bottom: 24px;
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
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border-radius: 16px;
  border: 2px solid #f0f0f0;
  transition: all 0.3s ease;
}

.comment-input-section:hover {
  border-color: #e34d59;
  box-shadow: 0 4px 16px rgba(227, 77, 89, 0.1);
}

.comment-input-wrapper {
  margin-bottom: 20px;
}

.comment-input {
  font-size: 14px;
  line-height: 1.6;
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
  gap: 12px;
  flex: 1;
}

.rating-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  padding: 8px 16px;
  background: linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%);
  border-radius: 8px;
}

.rating-text {
  font-size: 14px;
  color: #e34d59;
  font-weight: 600;
  padding: 4px 12px;
  background: rgba(227, 77, 89, 0.1);
  border-radius: 6px;
}

.submit-btn {
  padding: 10px 28px;
  font-weight: 600;
  border-radius: 10px;
}

.login-alert {
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%) !important;
  border: 1px solid #d4e3fc !important;
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
  gap: 20px;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 8px;
  scroll-behavior: smooth;
}

/* 自定义评论列表滚动条 */
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

/* Firefox 滚动条 */
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
  background: white;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f0f0f0;
  position: relative;
  overflow: hidden;
}

.comment-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #e34d59 0%, #f0656e 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.comment-item:hover {
  background: #ffffff;
  border-color: #e34d59;
  box-shadow: 0 4px 20px rgba(227, 77, 89, 0.12);
  transform: translateX(4px);
}

.comment-item:hover::before {
  opacity: 1;
}

.comment-avatar {
  flex-shrink: 0;
  position: relative;
}

.comment-avatar::after {
  content: '';
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: #52c41a;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
  gap: 12px;
}

.comment-username {
  font-weight: 600;
  font-size: 15px;
  color: #333;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-username::after {
  content: '★'.repeat(5);
  font-size: 10px;
  color: #ffd700;
  letter-spacing: 2px;
  margin-left: 8px;
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
  padding: 4px 10px;
  background: #f5f5f5;
  border-radius: 6px;
  font-weight: 500;
}

.comment-text {
  color: #666;
  line-height: 1.8;
  margin: 0 0 16px;
  word-break: break-word;
  padding: 16px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-radius: 8px;
  border-left: 3px solid #e34d59;
  position: relative;
}

.comment-text::before {
  content: '"';
  position: absolute;
  top: 8px;
  left: 12px;
  font-size: 24px;
  color: rgba(227, 77, 89, 0.15);
  font-family: Georgia, serif;
  line-height: 1;
}

.comment-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 4px;
}

.comment-likes {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.comment-likes:hover {
  background: #e34d59;
  border-color: #e34d59;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(227, 77, 89, 0.3);
}

.comment-likes.is-liked {
  color: #e34d59;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
  border-color: #e34d59;
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
    padding: 12px;
  }

  .filter-stars {
    flex-wrap: wrap;
    justify-content: center;
  }

  .sort-select {
    width: 100%;
  }

  .comment-input-section {
    padding: 16px;
  }

  .comments-list {
    max-height: 350px;
  }

  .comment-item {
    padding: 16px;
    flex-direction: column;
    gap: 12px;
  }

  .comment-avatar {
    margin-right: 0;
  }

  .comment-item::before {
    width: 100%;
    height: 3px;
    top: 0;
    left: 0;
  }

  .comment-text {
    padding: 12px;
  }

  .comment-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .rating-section {
    flex-wrap: wrap;
  }

  .submit-btn {
    width: 100%;
    margin-top: 12px;
  }

  .rating-overview {
    flex-direction: column;
    gap: 24px;
  }

  .average-rating {
    min-width: auto;
    width: 100%;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .comments-list {
    max-height: 450px;
  }

  .rating-overview {
    gap: 32px;
  }

  .filter-stars {
    flex-wrap: wrap;
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
