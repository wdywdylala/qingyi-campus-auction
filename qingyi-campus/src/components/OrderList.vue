<template>
  <div class="order-list">
    <div v-if="orders.length === 0" class="no-orders">
      <t-empty description="暂无订单" />
    </div>

    <div v-else class="order-items">
      <div v-for="order in orders" :key="order.id" class="order-item">
        <div class="order-header">
          <div class="order-info">
            <span class="order-id">订单号: {{ order.id.slice(0, 8) }}...</span>
            <span class="order-time">{{ formatTime(order.created_at) }}</span>
          </div>
          <div class="order-status" :class="getStatusClass(order.status)">
            {{ getStatusText(order.status) }}
          </div>
        </div>

        <div class="order-content">
          <div class="product-info">
            <div class="product-image">
              <img
                v-if="order.product?.images?.[0]"
                :src="order.product.images[0]"
                alt="商品图片"
              />
              <div v-else class="no-image">
                <t-icon name="image" size="32px" />
              </div>
            </div>
            <div class="product-details">
              <h3 class="product-title">{{ order.product?.title }}</h3>
              <p class="product-seller">卖家: {{ order.product?.profiles?.username }}</p>
              <p class="product-price">¥{{ order.total_amount }}</p>
            </div>
          </div>

          <div v-if="order.status === 'pending'" class="payment-actions">
            <t-button theme="primary" @click="handlePay(order)">
              立即支付
            </t-button>
            <t-button variant="outline" @click="handleCancel(order)">
              取消订单
            </t-button>
          </div>

          <div v-else-if="order.status === 'completed' && !order.is_rated" class="order-actions">
            <t-button theme="primary" @click="handleRate(order)">
              评价订单
            </t-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { supabase } from '@/utils/supabase'

interface Props {
  orders: any[]
}

const props = defineProps<Props>()
const emit = defineEmits(['refresh'])

const router = useRouter()

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

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待支付',
    paid: '待发货',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}

// 获取状态样式类
const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    pending: 'status-pending',
    paid: 'status-paid',
    shipped: 'status-shipped',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
  }
  return classMap[status] || ''
}

// 支付
const handlePay = async (order: any) => {
  try {
    console.log('开始支付订单:', order.id)
    console.log('订单当前状态:', order.status)

    const now = new Date()
    const updateData = {
      status: 'paid',
      payment_time: now.toISOString(),
    }
    console.log('准备更新数据:', updateData)

    // 1. 先检查当前用户的 session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.error('未登录，无法更新订单')
      MessagePlugin.error('请先登录')
      return
    }
    console.log('当前用户 ID:', session.user.id)

    // 2. 更新订单
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id)
      .eq('buyer_id', session.user.id)  // 确保只能更新自己的订单
      .select()

    if (error) {
      console.error('支付更新数据库失败:', error)
      throw error
    }

    console.log('数据库更新成功，返回数据:', data)
    
    // 3. 验证更新是否成功
    const { data: verifyData } = await supabase
      .from('orders')
      .select('status, payment_time')
      .eq('id', order.id)
      .single()

    console.log('验证查询结果:', verifyData)
    
    if (verifyData?.status !== 'paid') {
      console.error('警告：数据库中的订单状态未更新！')
    }

    console.log('支付成功，触发重新加载')
    MessagePlugin.success('支付成功')

    // 触发重新加载
    emit('refresh')
  } catch (err: any) {
    console.error('支付失败:', err)
    MessagePlugin.error(getErrorMessage(err, '支付失败'))
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

// 取消订单
const handleCancel = (order: any) => {
  const dialog = DialogPlugin({
    header: '确认取消',
    body: '确定要取消此订单吗？',
    confirmBtn: {
      content: '确认取消',
      theme: 'danger',
    },
    onConfirm: async () => {
      const success = await cancelOrder(order.id, '用户取消')
      if (success) {
        dialog.hide()
      }
      return success
    },
  })
}

// 取消订单逻辑
const cancelOrder = async (orderId: string, reason: string) => {
  try {
    console.log('开始取消订单:', orderId, '原因:', reason)

    const updateData = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason,
    }
    console.log('准备更新数据:', updateData)

    // 1. 先检查当前用户的 session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.error('未登录，无法取消订单')
      MessagePlugin.error('请先登录')
      return false
    }
    console.log('当前用户 ID:', session.user.id)

    // 2. 更新订单
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('buyer_id', session.user.id)  // 确保只能取消自己的订单
      .select()

    if (error) {
      console.error('取消订单数据库更新失败:', error)
      throw error
    }

    console.log('数据库更新成功，返回数据:', data)
    
    // 3. 验证更新是否成功
    const { data: verifyData } = await supabase
      .from('orders')
      .select('status, cancelled_at, cancel_reason')
      .eq('id', orderId)
      .single()

    console.log('验证查询结果:', verifyData)
    
    if (verifyData?.status !== 'cancelled') {
      console.error('警告：数据库中的订单状态未更新！')
    }

    console.log('订单取消成功，触发重新加载')
    MessagePlugin.success('订单已取消')

    // 触发重新加载
    emit('refresh')
    return true
  } catch (err: any) {
    console.error('取消订单失败:', err)
    MessagePlugin.error(getErrorMessage(err, '取消订单失败'))
    return false
  }
}

// 评价订单
const handleRate = (order: any) => {
  router.push(`/product/${order.product_id}`)
}
</script>

<style scoped>
.order-list {
  padding: 20px;
}

.no-orders {
  padding: 60px 20px;
  text-align: center;
}

.order-item {
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.order-info {
  display: flex;
  gap: 20px;
  align-items: center;
}

.order-id {
  color: #666;
  font-size: 13px;
}

.order-time {
  color: #999;
  font-size: 12px;
}

.order-status {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 4px;
}

.status-pending {
  background: #fff0f0;
  color: #e34d59;
}

.status-paid {
  background: #e8f8f0;
  color: #00a870;
}

.status-shipped {
  background: #e8f4ff;
  color: #0052d9;
}

.status-completed {
  background: #f0f0f0;
  color: #666;
}

.status-cancelled {
  background: #f5f5f5;
  color: #999;
}

.order-content {
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

.product-price {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #e34d59;
}

.payment-actions,
.order-actions {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .order-list {
    padding: 10px;
  }

  .order-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .order-info {
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

  .payment-actions,
  .order-actions {
    flex-direction: column;
  }
}
</style>
