<template>
  <div class="auction-list">
    <div v-if="auctions.length === 0" class="no-auctions">
      <t-empty :description="emptyMessage">
        <template #action>
          <t-button v-if="role === 'seller'" theme="primary" @click="router.push('/auction-publish')">
            发布拍卖
          </t-button>
          <t-button v-else theme="primary" @click="router.push('/auction')">
            参与拍卖
          </t-button>
        </template>
      </t-empty>
    </div>

    <div v-else class="auction-items">
      <div
        v-for="auction in auctions"
        :key="auction.auction?.id"
        class="auction-item"
        @click="handleViewAuction(auction)"
      >
        <div class="auction-header">
          <div class="auction-info">
            <span class="auction-id" v-if="auction.auction">拍卖ID: {{ auction.auction.id.slice(0, 8) }}...</span>
            <span class="auction-time">{{ formatTime(auction.created_at) }}</span>
          </div>
          <div class="auction-status" :class="getStatusClass(auction)">
            {{ getStatusText(auction) }}
          </div>
        </div>

        <div class="auction-content" @click.stop>
          <div class="product-info">
            <div class="product-image">
              <img
                v-if="auction.product?.images?.[0]"
                :src="auction.product.images[0]"
                alt="商品图片"
              />
              <div v-else class="no-image">
                <t-icon name="image" size="32px" />
              </div>
            </div>
            <div class="product-details">
              <h3 class="product-title">{{ auction.product?.title }}</h3>
              <p class="product-seller" v-if="auction.role === 'bidder'">
                发布者: {{ auction.product?.profiles?.username }}
              </p>

              <!-- 卖家信息 -->
              <div v-if="auction.role === 'seller'" class="auction-info-panel">
                <p class="product-auction-info">
                  <span class="info-label">起拍价:</span>
                  <span class="price">¥{{ auction.auction?.start_price }}</span>
                </p>
                <p class="product-auction-info" v-if="auction.auction?.status === 'ongoing'">
                  <span class="info-label">当前价:</span>
                  <span class="current-price">¥{{ auction.auction?.current_price }}</span>
                </p>
                <p class="product-auction-info" v-if="auction.auction?.status === 'ongoing'">
                  <span class="info-label">出价人数:</span>
                  <span class="bid-count">{{ auction.bid_count || 0 }}人</span>
                </p>
                <p class="product-auction-info" v-if="auction.auction?.status === 'ended' && auction.auction?.current_price">
                  <span class="info-label">成交价:</span>
                  <span class="sold-price">¥{{ auction.auction?.current_price }}</span>
                </p>
                <p class="product-auction-info" v-if="getRemainingTime(auction.auction)">
                  <span class="info-label">剩余时间:</span>
                  <span class="time">{{ getRemainingTime(auction.auction) }}</span>
                </p>
              </div>

              <!-- 买家信息 -->
              <div v-else-if="auction.role === 'bidder'" class="auction-info-panel">
                <p class="product-auction-info">
                  <span class="info-label">我的出价:</span>
                  <span class="price">¥{{ auction.bid_amount }}</span>
                </p>
                <p class="product-auction-info">
                  <span class="info-label">当前价:</span>
                  <span class="current-price">¥{{ auction.auction?.current_price }}</span>
                </p>
                <p class="product-auction-info" v-if="auction.auction?.status === 'ongoing'">
                  <span class="info-label" :class="{ 'lead-text': isLeading(auction) }">
                    {{ isLeading(auction) ? '你当前领先' : '已被超过' }}
                  </span>
                </p>
                <p class="product-auction-info">
                  <span class="info-label">保证金:</span>
                  <span class="deposit">¥{{ auction.auction?.deposit_amount }}</span>
                </p>
                <p class="product-auction-info" v-if="getRemainingTime(auction.auction)">
                  <span class="info-label">剩余时间:</span>
                  <span class="time">{{ getRemainingTime(auction.auction) }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

interface Props {
  auctions: any[]
}

const props = defineProps<Props>()
const emit = defineEmits(['refresh'])

const router = useRouter()

// 判断角色
const role = computed(() => {
  if (props.auctions.length > 0) {
    return props.auctions[0].role
  }
  return 'seller'
})

// 空状态提示
const emptyMessage = computed(() => {
  if (role.value === 'seller') {
    return '你还没有发布的拍卖，去发布一个吧！'
  } else {
    return '你还没有参与竞价的商品，去看看有什么好东西！'
  }
})

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return date.toLocaleDateString()
}

// 计算剩余时间
const getRemainingTime = (auction: any) => {
  if (!auction?.end_time) return ''

  const now = new Date()
  const endTime = new Date(auction.end_time)
  const diff = endTime.getTime() - now.getTime()

  if (diff <= 0) return ''

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (hours > 0) return `${hours}小时${minutes}分钟`
  if (minutes > 0) return `${minutes}分钟${seconds}秒`
  return `${seconds}秒`
}

// 判断买家是否领先
const isLeading = (auction: any) => {
  const myBid = auction.bid_amount
  const currentPrice = auction.auction?.current_price
  return myBid === currentPrice
}

// 获取状态文本
const getStatusText = (auction: any) => {
  if (auction.role === 'seller') {
    const status = auction.auction?.status
    const endTime = auction.auction?.end_time
    const now = new Date().toISOString()
    const bidCount = auction.bid_count || 0

    if (status === 'ongoing' || (endTime && endTime > now)) {
      return '正在拍卖'
    } else if (status === 'ended') {
      if (bidCount > 0) {
        return '拍卖成功'
      } else {
        return '拍卖失败'
      }
    }
  } else if (auction.role === 'bidder') {
    const status = auction.auction?.status
    const endTime = auction.auction?.end_time
    const now = new Date().toISOString()
    const myBid = auction.bid_amount
    const currentPrice = auction.auction?.current_price

    if (status === 'ongoing' || (endTime && endTime > now)) {
      return '正在竞价'
    } else if (status === 'ended') {
      if (myBid === currentPrice) {
        return '竞价成功'
      } else {
        return '竞价失败'
      }
    }
  }
  return '未知'
}

// 获取状态样式类
const getStatusClass = (auction: any) => {
  const statusText = getStatusText(auction)
  const classMap: Record<string, string> = {
    '正在拍卖': 'status-selling',
    '拍卖成功': 'status-sold',
    '拍卖失败': 'status-failed',
    '正在竞价': 'status-bidding',
    '竞价成功': 'status-won',
    '竞价失败': 'status-lost',
    '未知': 'status-unknown',
  }
  return classMap[statusText] || 'status-unknown'
}

// 查看拍卖
const handleViewAuction = (auction: any) => {
  router.push(`/auction/${auction.auction.id}`)
}
</script>

<style scoped>
.auction-list {
  padding: 20px;
}

.no-auctions {
  padding: 60px 20px;
  text-align: center;
}

.auction-item {
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.auction-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.auction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.auction-info {
  display: flex;
  gap: 20px;
  align-items: center;
}

.auction-id {
  color: #666;
  font-size: 13px;
}

.auction-time {
  color: #999;
  font-size: 12px;
}

.auction-status {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 4px;
}

/* 卖家状态 */
.status-selling {
  background: #fff7e6;
  color: #fa8c16;
}

.status-sold {
  background: #f6ffed;
  color: #52c41a;
}

.status-failed {
  background: #f0f0f0;
  color: #666;
}

/* 买家状态 */
.status-bidding {
  background: #e6f7ff;
  color: #1890ff;
}

.status-won {
  background: #f6ffed;
  color: #52c41a;
}

.status-lost {
  background: #fff1f0;
  color: #f5222d;
}

.status-unknown {
  background: #f0f0f0;
  color: #666;
}

.auction-content {
  padding: 16px;
}

.product-info {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.product-image {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
  color: #999;
}

.product-details {
  flex: 1;
  min-width: 0;
}

.product-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-seller {
  margin: 0 0 8px;
  font-size: 13px;
  color: #999;
}

.auction-info-panel {
  margin-top: 8px;
}

.product-auction-info {
  margin: 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 13px;
  color: #999;
}

.price {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.current-price {
  font-size: 20px;
  font-weight: 700;
  color: #e34d59;
}

.sold-price {
  font-size: 20px;
  font-weight: 700;
  color: #52c41a;
}

.deposit {
  font-size: 16px;
  color: #00a870;
  font-weight: 600;
}

.bid-count {
  font-size: 14px;
  color: #1890ff;
  font-weight: 600;
}

.time {
  font-size: 14px;
  color: #666;
}

.lead-text {
  color: #52c41a;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .auction-list {
    padding: 10px;
  }

  .auction-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .auction-info {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .product-info {
    flex-direction: column;
  }

  .product-image {
    width: 80px;
    height: 80px;
  }
}
</style>
