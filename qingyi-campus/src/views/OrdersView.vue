<template>
  <div class="orders-container">
    <!-- 返回按钮 -->
    <div class="back-button-container">
      <button class="back-button" @click="goBack">
        <t-icon name="chevron-left" class="back-icon" />
        <span class="back-text">返回</span>
      </button>
    </div>

    <div class="orders-header">
      <h2>我的订单</h2>
    </div>

    <div v-if="loading" class="loading-state">
      <t-loading size="large" text="加载订单中..." />
    </div>

    <div v-else-if="orders.length === 0" class="empty-orders">
      <t-empty description="暂无订单">
        <template #action>
          <t-button theme="primary" @click="router.push('/market')">
            去购物
          </t-button>
        </template>
      </t-empty>
    </div>

    <div v-else class="orders-content">
      <t-tabs v-model="activeTab" @change="handleTabChange">
        <t-tab-panel value="all" label="全部订单">
          <OrderList :orders="filteredOrders" @refresh="loadOrders" />
        </t-tab-panel>
        <t-tab-panel value="pending" label="待支付">
          <OrderList :orders="filteredOrders" @refresh="loadOrders" />
        </t-tab-panel>
        <t-tab-panel value="paid" label="待发货">
          <OrderList :orders="filteredOrders" @refresh="loadOrders" />
        </t-tab-panel>
        <t-tab-panel value="shipped" label="已发货">
          <OrderList :orders="filteredOrders" @refresh="loadOrders" />
        </t-tab-panel>
        <t-tab-panel value="completed" label="已完成">
          <OrderList :orders="filteredOrders" @refresh="loadOrders" />
        </t-tab-panel>
        <t-tab-panel value="cancelled" label="已取消">
          <OrderList :orders="filteredOrders" @refresh="loadOrders" />
        </t-tab-panel>
      </t-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { supabase } from '@/utils/supabase'
import OrderList from '@/components/OrderList.vue'

const router = useRouter()
const activeTab = ref('all')
const orders = ref<any[]>([])
const loading = ref(true)

const goBack = () => {
  router.back()
}

// 根据状态过滤订单
const filteredOrders = computed(() => {
  if (activeTab.value === 'all') {
    return orders.value
  }
  return orders.value.filter(order => order.status === activeTab.value)
})

// 加载订单
const loadOrders = async () => {
  console.log('开始加载订单...')
  loading.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      MessagePlugin.warning('请先登录')
      router.push('/auth')
      return
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        product:products(
          *,
          profiles:seller_id(username, avatar_url)
        )
      `)
      .eq('buyer_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    console.log('从数据库加载到订单数量:', data?.length)
    if (data && data.length > 0) {
      console.log('订单状态统计:', data.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {} as any))
    }

    orders.value = data || []
    console.log('orders.value 更新完成，当前订单数:', orders.value.length)
  } catch (err: any) {
    console.error('加载订单失败:', err)
    MessagePlugin.error(getErrorMessage(err, '加载订单失败'))
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

// 处理标签切换
const handleTabChange = (value: string) => {
  activeTab.value = value
}

onMounted(async () => {
  await loadOrders()
})
</script>

<style scoped>
.orders-container {
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

.orders-header {
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.orders-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.loading-state,
.empty-orders {
  padding: 60px 20px;
  text-align: center;
}

.orders-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .orders-container {
    padding: 10px;
  }
}
</style>
