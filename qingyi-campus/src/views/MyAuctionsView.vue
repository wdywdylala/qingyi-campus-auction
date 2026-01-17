<template>
  <div class="auctions-container">
    <div class="auctions-header">
      <h2>我的拍卖</h2>
    </div>

    <div v-if="loading" class="loading-state">
      <t-loading size="large" text="加载拍卖中..." />
    </div>

    <div v-else class="auctions-content">
      <!-- 一级标签 -->
      <div class="main-tabs">
        <div
          class="main-tab"
          :class="{ active: activeMainTab === 'seller' }"
          @click="activeMainTab = 'seller'"
        >
          我拍卖的
          <span class="badge">({{ sellerAuctions.length }})</span>
        </div>
        <div
          class="main-tab"
          :class="{ active: activeMainTab === 'bidder' }"
          @click="activeMainTab = 'bidder'"
        >
          我竞价的
          <span class="badge">({{ bidderAuctions.length }})</span>
        </div>
      </div>

      <!-- 二级标签 -->
      <div class="sub-tabs">
        <!-- 卖家二级标签 -->
        <t-tabs v-if="activeMainTab === 'seller'" v-model="activeSellerTab">
          <t-tab-panel value="selling" :label="`正在拍卖 (${getSellerCount('selling')})`">
            <AuctionList
              :auctions="filteredSellerAuctions"
              @refresh="loadAuctions"
            />
          </t-tab-panel>
          <t-tab-panel value="sold" :label="`拍卖成功 (${getSellerCount('sold')})`">
            <AuctionList
              :auctions="filteredSellerAuctions"
              @refresh="loadAuctions"
            />
          </t-tab-panel>
          <t-tab-panel value="failed" :label="`拍卖失败 (${getSellerCount('failed')})`">
            <AuctionList
              :auctions="filteredSellerAuctions"
              @refresh="loadAuctions"
            />
          </t-tab-panel>
        </t-tabs>

        <!-- 买家二级标签 -->
        <t-tabs v-else-if="activeMainTab === 'bidder'" v-model="activeBidderTab">
          <t-tab-panel value="bidding" :label="`正在竞价 (${getBidderCount('bidding')})`">
            <AuctionList
              :auctions="filteredBidderAuctions"
              @refresh="loadAuctions"
            />
          </t-tab-panel>
          <t-tab-panel value="won" :label="`竞价成功 (${getBidderCount('won')})`">
            <AuctionList
              :auctions="filteredBidderAuctions"
              @refresh="loadAuctions"
            />
          </t-tab-panel>
          <t-tab-panel value="lost" :label="`竞价失败 (${getBidderCount('lost')})`">
            <AuctionList
              :auctions="filteredBidderAuctions"
              @refresh="loadAuctions"
            />
          </t-tab-panel>
        </t-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { supabase } from '@/utils/supabase'
import AuctionList from '@/components/AuctionList.vue'

const router = useRouter()
const activeMainTab = ref('seller')
const activeSellerTab = ref('selling')
const activeBidderTab = ref('bidding')
const auctions = ref<any[]>([])
const loading = ref(true)

// 获取用户ID
const userId = ref<string>('')

// 我拍卖的商品
const sellerAuctions = computed(() => {
  return auctions.value.filter(item => item.role === 'seller')
})

// 我竞价的商品
const bidderAuctions = computed(() => {
  return auctions.value.filter(item => item.role === 'bidder')
})

// 判断卖家状态
const getSellerStatus = (auction: any) => {
  const status = auction.auction?.status
  const endTime = auction.auction?.end_time
  const now = new Date().toISOString()
  const bidCount = auction.bid_count || 0

  // 正在拍卖：ongoing状态 或 未到结束时间
  if (status === 'ongoing' || (endTime && endTime > now)) {
    return 'selling'
  }
  // 已结束
  else if (status === 'ended') {
    // 拍卖成功：有出价
    if (bidCount > 0) {
      return 'sold'
    }
    // 拍卖失败：无人出价
    else {
      return 'failed'
    }
  }
  return 'unknown'
}

// 判断买家状态
const getBidderStatus = (auction: any) => {
  const status = auction.auction?.status
  const endTime = auction.auction?.end_time
  const now = new Date().toISOString()
  const myBid = auction.bid_amount
  const currentPrice = auction.auction?.current_price

  // 正在竞价：ongoing状态
  if (status === 'ongoing' || (endTime && endTime > now)) {
    return 'bidding'
  }
  // 已结束
  else if (status === 'ended') {
    // 竞价成功：我的出价等于当前最高价
    if (myBid === currentPrice) {
      return 'won'
    }
    // 竞价失败：我的出价低于当前最高价
    else {
      return 'lost'
    }
  }
  return 'unknown'
}

// 获取卖家各状态数量
const getSellerCount = (status: string) => {
  return sellerAuctions.value.filter(item => getSellerStatus(item) === status).length
}

// 获取买家各状态数量
const getBidderCount = (status: string) => {
  return bidderAuctions.value.filter(item => getBidderStatus(item) === status).length
}

// 根据卖家子标签过滤
const filteredSellerAuctions = computed(() => {
  return sellerAuctions.value.filter(item => getSellerStatus(item) === activeSellerTab.value)
})

// 根据买家子标签过滤
const filteredBidderAuctions = computed(() => {
  return bidderAuctions.value.filter(item => getBidderStatus(item) === activeBidderTab.value)
})

// 加载拍卖数据
const loadAuctions = async () => {
  console.log('开始加载拍卖...')
  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      MessagePlugin.warning('请先登录')
      router.push('/auth')
      return
    }

    userId.value = session.user.id

    // 加载用户参与的拍卖（作为出价者）
    const { data: bidData, error: bidError } = await supabase
      .from('bids')
      .select(`
        *,
        auction:auctions(
          *,
          product:products(
            *,
            profiles:seller_id(username, avatar_url)
          )
        )
      `)
      .eq('bidder_id', session.user.id)

    if (bidError) throw bidError

    console.log('用户参与的拍卖数量:', bidData?.length)

    // 对出价记录去重：同一拍卖只保留最新的那条
    const uniqueBidDataMap = new Map()
    if (bidData) {
      bidData.forEach(bid => {
        const auctionId = bid.auction?.id
        if (auctionId) {
          // 如果该拍卖还没记录过，或者当前这条比已记录的更新，则更新
          const existing = uniqueBidDataMap.get(auctionId)
          if (!existing || bid.bid_time > existing.bid_time) {
            uniqueBidDataMap.set(auctionId, bid)
          }
        }
      })
    }
    const uniqueBidData = Array.from(uniqueBidDataMap.values())
    console.log('去重后的竞价记录数量:', uniqueBidData.length)

    // 加载用户发布的产品（先获取产品ID）
    const { data: userProducts, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', session.user.id)

    if (productError) throw productError

    // 获取产品ID列表
    const productIds = userProducts?.map(p => p.id) || []

    // 加载用户发布的拍卖（作为卖家）- 使用产品ID列表
    let sellerData: any[] = []
    if (productIds.length > 0) {
      const { data: auctionsData, error: auctionsError } = await supabase
        .from('auctions')
        .select(`
          *,
          product:products(
            *,
            profiles:seller_id(username, avatar_url)
          ),
          bids:bids(
            bidder_id,
            bid_amount,
            bid_time
          )
        `)
        .in('product_id', productIds)

      if (auctionsError) throw auctionsError
      sellerData = auctionsData || []
    }

    console.log('用户发布的拍卖数量:', sellerData?.length)

    // 合并数据
    const allAuctions: any[] = []

    // 添加参与的拍卖（使用去重后的数据）
    if (uniqueBidData) {
      uniqueBidData.forEach(bid => {
        allAuctions.push({
          auction: bid.auction,
          product: bid.auction?.product,
          role: 'bidder',
          bid_amount: bid.bid_amount,
          created_at: bid.bid_time || bid.auction?.created_at || new Date().toISOString()
        })
      })
    }

    // 添加发布的拍卖
    if (sellerData) {
      sellerData.forEach(auction => {
        allAuctions.push({
          auction: auction,
          product: auction.product,
          role: 'seller',
          bid_count: auction.bids?.length || 0,
          created_at: auction.created_at || new Date().toISOString()
        })
      })
    }

    // 按创建时间排序（在前端排序，避免数据库字段问题）
    allAuctions.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime()
      const timeB = new Date(b.created_at).getTime()
      return timeB - timeA
    })

    console.log('合并后的拍卖总数:', allAuctions.length)

    auctions.value = allAuctions
  } catch (err: any) {
    console.error('加载拍卖失败:', err)
    MessagePlugin.error(getErrorMessage(err, '加载拍卖失败'))
  } finally {
    loading.value = false
  }
}

// 错误信息转换
const getErrorMessage = (err: any, defaultMsg: string): string => {
  if (err.message) {
    if (err.message.includes('invalid input syntax')) {
      return '数据格式错误'
    } else if (err.message.includes('duplicate key')) {
      return '数据已存在，请勿重复操作'
    } else if (err.message.includes('foreign key')) {
      return '关联数据不存在'
    } else if (err.message.includes('null')) {
      return '请填写完整信息'
    } else if (err.message.includes('permission')) {
      return '没有操作权限'
    }
  }
  return defaultMsg
}

onMounted(async () => {
  await loadAuctions()
})
</script>

<style scoped>
.auctions-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.auctions-header {
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.auctions-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.loading-state,
.empty-auctions {
  padding: 60px 20px;
  text-align: center;
}

.auctions-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 一级标签样式 */
.main-tabs {
  display: flex;
  gap: 16px;
  padding: 24px 24px 16px;
  border-bottom: 2px solid #f0f0f0;
}

.main-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  color: #666;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
}

.main-tab:hover {
  background: #e8e8e8;
  color: #333;
}

.main-tab.active {
  background: #0052d9;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 82, 217, 0.3);
}

.main-tab .badge {
  font-size: 14px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.2);
  color: inherit;
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
}

.main-tab:not(.active) .badge {
  background: rgba(0, 0, 0, 0.1);
  color: #666;
}

/* 二级标签样式 */
.sub-tabs {
  padding: 16px 24px;
}

.sub-tabs :deep(.t-tabs__nav) {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 6px;
}

.sub-tabs :deep(.t-tabs__nav-item) {
  font-size: 14px;
  padding: 10px 20px;
  border-radius: 6px;
  margin-right: 8px;
  color: #666;
  transition: all 0.2s;
}

.sub-tabs :deep(.t-tabs__nav-item:last-child) {
  margin-right: 0;
}

.sub-tabs :deep(.t-tabs__nav-item:hover) {
  background: #fff;
  color: #333;
}

.sub-tabs :deep(.t-tabs__nav-item.t-is-active) {
  background: #fff;
  color: #0052d9;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .auctions-container {
    padding: 10px;
  }

  .auctions-header {
    padding: 16px;
  }

  .auctions-header h2 {
    font-size: 20px;
  }

  .main-tabs {
    gap: 8px;
    padding: 16px 16px 12px;
  }

  .main-tab {
    padding: 10px 16px;
    font-size: 14px;
  }

  .sub-tabs {
    padding: 12px 16px;
  }

  .sub-tabs :deep(.t-tabs__nav-item) {
    font-size: 13px;
    padding: 8px 14px;
    margin-right: 6px;
  }
}
</style>
