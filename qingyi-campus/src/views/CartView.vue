<template>
  <div class="cart-container">
    <!-- 返回按钮 -->
    <div class="back-button-container">
      <button class="back-button" @click="goBack">
        <t-icon name="chevron-left" class="back-icon" />
        <span class="back-text">返回</span>
      </button>
    </div>

    <div class="cart-header">
      <h2>我的购物车</h2>
      <div class="cart-stats">
        <span class="item-count">共 {{ cartItems.length }} 件商品</span>
        <span class="total-price">总计: ¥{{ totalPrice }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <t-loading size="large" text="加载购物车中..." />
    </div>

    <div v-else-if="cartItems.length === 0" class="empty-cart">
      <t-empty description="购物车还是空的">
        <template #action>
          <t-button theme="primary" @click="router.push('/market')">
            去逛逛
          </t-button>
        </template>
      </t-empty>
    </div>

    <div v-else class="cart-content">
      <div class="cart-items">
        <div v-for="item in cartItems" :key="item.id" class="cart-item">
          <div class="item-checkbox">
            <t-checkbox v-model="item.selected" />
          </div>
          <div class="item-image">
            <div v-if="item.product?.images?.[0]" class="image-wrapper">
              <img :src="item.product.images[0]" alt="商品图片" />
            </div>
            <div v-else class="image-wrapper no-image">
              <t-icon name="image" size="32px" />
            </div>
          </div>
          <div class="item-info">
            <h3 class="item-title">{{ item.product?.title }}</h3>
            <p class="item-seller">卖家: {{ item.product?.profiles?.username }}</p>
            <p class="item-price">¥{{ item.product?.price }}</p>
          </div>
          <div class="item-quantity">
            <t-input-number
              v-model="item.quantity"
              :min="1"
              :max="99"
              size="small"
              @change="updateQuantity(item)"
            />
          </div>
          <div class="item-actions">
            <t-button variant="text" size="small" @click="removeItem(item)">
              <t-icon name="delete" />
              删除
            </t-button>
          </div>
        </div>
      </div>

      <div class="cart-footer">
        <div class="footer-info">
          <div class="select-all">
            <t-checkbox v-model="allSelected" @change="toggleSelectAll" />
            <span>全选</span>
          </div>
          <div class="selected-info">
            已选择 <span class="highlight">{{ selectedCount }}</span> 件商品
          </div>
        </div>
        <div class="footer-actions">
          <div class="total-section">
            <span class="total-label">合计:</span>
            <span class="total-amount">¥{{ selectedTotal }}</span>
          </div>
          <t-button theme="primary" size="large" @click="checkout" :disabled="selectedCount === 0">
            去结算({{ selectedCount }})
          </t-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { supabase } from '@/utils/supabase'
import eventBus from '@/utils/eventBus'

const router = useRouter()
const cartItems = ref<any[]>([])
const loading = ref(true)
const user = ref<any>(null)

const goBack = () => {
  router.back()
}

// 计算总价
const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity
  }, 0).toFixed(2)
})

// 计算选中商品数量
const selectedCount = computed(() => {
  return cartItems.value.filter(item => item.selected).reduce((sum, item) => sum + item.quantity, 0)
})

// 计算选中商品总价
const selectedTotal = computed(() => {
  return cartItems.value
    .filter(item => item.selected)
    .reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity
    }, 0)
    .toFixed(2)
})

// 是否全选
const allSelected = computed({
  get: () => {
    return cartItems.value.length > 0 && cartItems.value.every(item => item.selected)
  },
  set: (value: boolean) => {
    cartItems.value.forEach(item => item.selected = value)
  }
})

// 全选/取消全选
const toggleSelectAll = (checked: boolean) => {
  cartItems.value.forEach(item => item.selected = checked)
}

// 加载购物车
const loadCart = async () => {
  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      MessagePlugin.warning('请先登录')
      router.push('/auth')
      return
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products(
          *,
          profiles:seller_id(username)
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    cartItems.value = (data || []).map(item => ({
      ...item,
      selected: true,
      quantity: item.quantity || 1
    }))
  } catch (err: any) {
    MessagePlugin.error(getErrorMessage(err, '加载购物车失败'))
  } finally {
    loading.value = false
  }
}

// 更新数量
const updateQuantity = async (item: any) => {
  if (item.quantity < 1) item.quantity = 1
  if (item.quantity > 99) item.quantity = 99

  try {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: item.quantity })
      .eq('id', item.id)

    if (error) throw error
  } catch (err: any) {
    MessagePlugin.error(getErrorMessage(err, '更新数量失败'))
    await loadCart()
  }
}

// 删除商品
const removeItem = async (item: any) => {
  const dialog = DialogPlugin({
    header: '确认删除',
    body: '确定要将此商品从购物车中删除吗？',
    confirmBtn: {
      content: '确认删除',
      theme: 'danger',
    },
    onConfirm: async () => {
      try {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', item.id)

        if (error) throw error

        MessagePlugin.success('删除成功')
        await loadCart()
        dialog.hide()

        // 发出购物车更新事件
        eventBus.emit('cart:updated')

        return true
      } catch (err: any) {
        MessagePlugin.error(getErrorMessage(err, '删除失败'))
        return false
      }
    },
  })
}

// 结算
const checkout = async () => {
  const selectedItems = cartItems.value.filter(item => item.selected)
  if (selectedItems.length === 0) {
    MessagePlugin.warning('请选择要结算的商品')
    return
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      MessagePlugin.warning('请先登录')
      router.push('/auth')
      return
    }

    // 计算支付截止时间（15分钟后）
    const paymentDeadline = new Date()
    paymentDeadline.setMinutes(paymentDeadline.getMinutes() + 15)

    // 为每个选中的商品创建订单
    const orderPromises = selectedItems.map(async (item) => {
      const totalAmount = (item.product?.price || 0) * item.quantity
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: session.user.id,
          seller_id: item.product?.seller_id,
          product_id: item.product_id,
          total_amount: totalAmount,
          status: 'pending',
          payment_deadline: paymentDeadline.toISOString(),
          order_type: 'normal',
        })
        .select()
        .single()

      if (orderError) throw orderError
      return orderData
    })

    await Promise.all(orderPromises)

    // 删除已结算的购物车商品
    const selectedIds = selectedItems.map(item => item.id)
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .in('id', selectedIds)

    if (deleteError) throw deleteError


    MessagePlugin.success(`成功创建 ${selectedItems.length} 个订单，请在15分钟内完成支付`)

    // 发出购物车更新事件
    eventBus.emit('cart:updated')

    await loadCart()
    router.push('/orders')
  } catch (err: any) {
    MessagePlugin.error(getErrorMessage(err, '结算失败'))
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
    } else if (err.message.includes('insufficient funds')) {
      return '余额不足'
    } else if (err.message.includes('stock')) {
      return '库存不足'
    }
  }
  return defaultMsg
}

onMounted(async () => {
  await loadCart()
})
</script>

<style scoped>
.cart-container {
  max-width: 1200px;
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

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.cart-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.cart-stats {
  display: flex;
  gap: 20px;
  align-items: center;
}

.item-count {
  color: #666;
  font-size: 14px;
}

.total-price {
  font-size: 20px;
  font-weight: 700;
  color: #e34d59;
}

.loading-state,
.empty-cart {
  padding: 60px 20px;
  text-align: center;
}

.cart-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cart-items {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.3s;
}

.cart-item:hover {
  background: #fafafa;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-checkbox {
  flex-shrink: 0;
}

.item-image {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
}

.image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-wrapper.no-image {
  color: #999;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-seller {
  margin: 0 0 8px;
  font-size: 13px;
  color: #999;
}

.item-price {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #e34d59;
}

.item-quantity {
  flex-shrink: 0;
}

.item-actions {
  flex-shrink: 0;
}

.cart-footer {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
  position: sticky;
  bottom: 20px;
  z-index: 10;
}

.footer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.selected-info {
  font-size: 14px;
  color: #666;
}

.highlight {
  color: #e34d59;
  font-weight: 700;
  font-size: 16px;
}

.footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.total-section {
  flex: 1;
  text-align: right;
}

.total-label {
  font-size: 14px;
  color: #666;
  margin-right: 12px;
}

.total-amount {
  font-size: 28px;
  font-weight: 700;
  color: #e34d59;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cart-container {
    padding: 10px;
  }

  .cart-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .cart-stats {
    flex-direction: column;
    gap: 8px;
  }

  .cart-item {
    flex-wrap: wrap;
    gap: 12px;
  }

  .item-image {
    width: 80px;
    height: 80px;
  }

  .item-quantity {
    width: 100%;
  }

  .footer-info {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .footer-actions {
    flex-direction: column;
  }

  .total-section {
    text-align: center;
  }

  .total-amount {
    font-size: 24px;
  }
}
</style>
