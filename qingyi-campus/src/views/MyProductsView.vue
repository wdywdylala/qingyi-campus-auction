<template>
  <div class="my-products-container">
    <div class="page-header">
      <h2>我的出售</h2>
      <t-button theme="primary" @click="handleAddProduct">
        <template #icon>
          <t-icon name="add" />
        </template>
        发布新商品
      </t-button>
    </div>

    <t-card>
      <!-- 一级标签 -->
      <div class="main-tabs">
        <div
          class="main-tab"
          :class="{ active: filterStatus === '' }"
          @click="filterStatus = ''; handleFilterChange();"
        >
          全部
          <span class="badge">({{ totalCount }})</span>
        </div>
        <div
          class="main-tab"
          :class="{ active: filterStatus === 'active' }"
          @click="filterStatus = 'active'; handleFilterChange();"
        >
          在售
          <span class="badge">({{ getStatusCount('active') }})</span>
        </div>
        <div
          class="main-tab"
          :class="{ active: filterStatus === 'sold' }"
          @click="filterStatus = 'sold'; handleFilterChange();"
        >
          已售出
          <span class="badge">({{ getStatusCount('sold') }})</span>
        </div>
        <div
          class="main-tab"
          :class="{ active: filterStatus === 'cancelled' }"
          @click="filterStatus = 'cancelled'; handleFilterChange();"
        >
          已下架
          <span class="badge">({{ getStatusCount('cancelled') }})</span>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <t-loading size="large" />
      </div>

      <div v-else-if="products.length === 0" class="empty-state">
        <t-empty description="暂无商品">
          <t-button theme="primary" @click="handleAddProduct">发布新商品</t-button>
        </t-empty>
      </div>

      <div v-else class="products-list">
        <div
          v-for="product in products"
          :key="product.id"
          class="product-item"
        >
          <div class="product-left">
            <img :src="product.image" alt="商品图片" class="product-image" />
            <div class="product-info">
              <h3 class="product-title">{{ product.title }}</h3>
              <div class="product-details">
                <span class="category">{{ product.category }}</span>
                <span class="location">{{ product.location }}</span>
              </div>
              <div class="product-price">
                <span class="price">¥{{ product.price }}</span>
              </div>
              <div class="product-status">
                <t-tag :theme="getStatusTheme(product.status)">
                  {{ getStatusText(product.status) }}
                </t-tag>
                <span class="time">{{ formatTime(product.created_at) }}</span>
              </div>
            </div>
          </div>
          <div class="product-actions">
            <t-button
              theme="primary"
              size="medium"
              @click="viewProduct(product)"
              block
            >
              <template #icon>
                <t-icon name="browse" />
              </template>
              查看
            </t-button>
            <t-button
              theme="success"
              size="medium"
              @click="editProduct(product)"
              block
            >
              <template #icon>
                <t-icon name="edit" />
              </template>
              编辑
            </t-button>
            <t-button
              v-if="product.status === 'active'"
              theme="warning"
              size="medium"
              @click="handleOffline(product)"
              block
            >
              <template #icon>
                <t-icon name="poweroff" />
              </template>
              下架
            </t-button>
            <t-button
              v-else-if="product.status === 'cancelled'"
              theme="primary"
              size="medium"
              @click="handleOnline(product)"
              block
            >
              <template #icon>
                <t-icon name="check-circle" />
              </template>
              上架
            </t-button>
            <t-button
              theme="danger"
              size="medium"
              @click="handleDelete(product)"
              block
            >
              <template #icon>
                <t-icon name="delete" />
              </template>
              删除
            </t-button>
          </div>
        </div>
      </div>

      <div class="pagination">
        <t-pagination
          :current="pagination.current"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          :show-page-size="false"
          @change="handlePageChange"
        />
      </div>
    </t-card>

    <!-- 编辑对话框 -->
    <t-dialog
      v-model:visible="editDialogVisible"
      header="编辑商品"
      width="800px"
      :confirm-btn="null"
      :cancel-btn="null"
    >
      <t-form
        ref="editFormRef"
        :data="editFormData"
        :rules="editRules"
        label-width="100px"
        @submit="handleUpdateProduct"
      >
        <t-form-item label="商品标题" name="title">
          <t-input v-model="editFormData.title" placeholder="请输入商品标题" />
        </t-form-item>

        <t-form-item label="商品分类" name="category">
          <t-select v-model="editFormData.category" placeholder="请选择分类">
            <t-option
              v-for="cat in categories"
              :key="cat"
              :value="cat"
              :label="cat"
            >
              {{ cat }}
            </t-option>
          </t-select>
        </t-form-item>

        <t-form-item label="商品描述" name="description">
          <t-textarea
            v-model="editFormData.description"
            placeholder="请输入商品描述"
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
        </t-form-item>

        <t-form-item label="价格" name="price">
          <t-input-number
            v-model="editFormData.price"
            :min="0"
            :decimal-places="2"
            placeholder="请输入价格"
          />
          <span style="margin-left: 8px">元</span>
        </t-form-item>

        <t-form-item label="所在地" name="location">
          <t-input
            v-model="editFormData.location"
            placeholder="请输入所在地"
          />
        </t-form-item>

        <t-form-item label="商品图片" name="images">
          <t-upload
            :default-files="editFormData.imageFiles"
            :auto-upload="false"
            multiple
            :max="9"
            :size-limit="{ size: 5, unit: 'MB' }"
            accept="image/*"
            theme="image"
            @change="handleImageChange"
          />
        </t-form-item>
      </t-form>

      <template #footer>
        <t-button theme="default" @click="editDialogVisible = false">取消</t-button>
        <t-button theme="primary" @click="editFormRef?.submit()" :loading="updateLoading">保存</t-button>
      </template>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const loading = ref(false)
const updateLoading = ref(false)
const filterStatus = ref('')
const editDialogVisible = ref(false)
const editFormRef = ref()
const totalCount = ref(0)
const statusCounts = ref({
  active: 0,
  sold: 0,
  cancelled: 0
})

const categories = [
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

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

const products = ref<any[]>([])
const editingProduct = ref<any>(null)

const editFormData = reactive({
  id: '',
  title: '',
  category: '',
  description: '',
  price: 0,
  location: '',
  images: [] as string[],
  imageFiles: [] as any[]
})

const editRules = {
  title: [
    { required: true, message: '请输入商品标题' }
  ],
  category: [
    { required: true, message: '请选择商品分类' }
  ],
  description: [
    { required: true, message: '请输入商品描述' },
    { min: 10, message: '描述至少10个字符' }
  ],
  price: [
    { required: true, message: '请输入价格' },
    { type: 'number', min: 0.01, message: '价格必须大于0' }
  ],
  location: [
    { required: true, message: '请输入所在地' }
  ]
}

onMounted(async () => {
  await loadProducts()
})

// 获取各状态数量
const getStatusCount = (status: string) => {
  if (status === '') return totalCount.value
  return statusCounts.value[status as keyof typeof statusCounts.value] || 0
}

const handlePageChange = (pageInfo: any) => {
  console.log('分页变化:', pageInfo)
  pagination.current = pageInfo.current
  loadProducts()
}

const handleFilterChange = () => {
  pagination.current = 1
  loadProducts()
}

const loadProducts = async () => {
  loading.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      MessagePlugin.error('请先登录')
      router.push('/auth')
      return
    }

    console.log('加载商品 - 当前页码:', pagination.current, '每页数量:', pagination.pageSize)
    const start = (pagination.current - 1) * pagination.pageSize
    const end = pagination.current * pagination.pageSize - 1
    console.log('分页范围:', start, '-', end)

    // 先获取总数（只统计普通商品，排除拍卖商品）
    let countQuery = supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .eq('is_auction', false)  // 排除拍卖商品

    const { count, error: countError } = await countQuery

    if (countError) throw countError

    console.log('总记录数:', count)

    // 获取各状态的数量
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('status')
      .eq('seller_id', user.id)
      .eq('is_auction', false)  // 排除拍卖商品

    if (allError) throw allError

    // 统计各状态数量
    const counts = {
      active: 0,
      sold: 0,
      cancelled: 0
    }

    allProducts?.forEach((product: any) => {
      if (product.status === 'active') counts.active++
      else if (product.status === 'sold') counts.sold++
      else if (product.status === 'cancelled') counts.cancelled++
    })

    statusCounts.value = counts

    totalCount.value = count || 0

    // 获取当前页数据（排除拍卖商品）
    let dataQuery = supabase
      .from('products')
      .select(`
        *,
        profiles:profiles(username)
      `)
      .eq('seller_id', user.id)
      .eq('is_auction', false)  // 排除拍卖商品

    if (filterStatus.value) {
      dataQuery = dataQuery.eq('status', filterStatus.value)
    }

    const { data, error } = await dataQuery
      .order('created_at', { ascending: false })
      .range(start, end)

    if (error) throw error

    console.log('获取到的数据数量:', data?.length || 0)
    console.log('数据详情:', data)

    products.value = (data || []).map((product: any) => ({
      ...product,
      image: product.images?.[0] || 'https://via.placeholder.com/200'
    }))

    pagination.total = count || 0
  } catch (error: any) {
    console.error('Load products error:', error)
    MessagePlugin.error(getErrorMessage(error, '加载商品失败'))
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

const handleAddProduct = () => {
  router.push('/sell')
}

const viewProduct = (product: any) => {
  router.push(`/product/${product.id}`)
}

const editProduct = (product: any) => {
  editingProduct.value = product
  editFormData.id = product.id
  editFormData.title = product.title
  editFormData.category = product.category
  editFormData.description = product.description
  editFormData.price = product.price
  editFormData.location = product.location
  editFormData.images = product.images || []

  // 将已有的图片转换为 t-upload 组件需要的格式
  editFormData.imageFiles = (product.images || []).map((url: string, index: number) => ({
    name: `image-${index}`,
    url: url,
    raw: null // 标记这是已有图片，不是新上传的
  }))

  editDialogVisible.value = true
}

const handleImageChange = (value: any) => {
  // 处理图片变化
  editFormData.imageFiles = value
}

const uploadImages = async (): Promise<string[]> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('请先登录')

  const imageUrls: string[] = []

  // 先保留已有的图片URL
  for (const item of editFormData.imageFiles) {
    if (item.url && !item.raw) {
      // 这是已有图片，直接保留URL
      imageUrls.push(item.url)
    } else if (item.raw && item.raw instanceof File) {
      // 这是新上传的图片，需要上传到服务器
      const file = item.raw
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      imageUrls.push(publicUrl)
    }
  }

  return imageUrls
}

const handleUpdateProduct = async () => {
  updateLoading.value = true
  try {
    // 上传新图片
    editFormData.images = await uploadImages()

    const { error } = await supabase
      .from('products')
      .update({
        title: editFormData.title,
        category: editFormData.category,
        description: editFormData.description,
        price: editFormData.price,
        location: editFormData.location,
        images: editFormData.images
      })
      .eq('id', editFormData.id)

    if (error) throw error

    MessagePlugin.success('商品更新成功')
    editDialogVisible.value = false
    await loadProducts()
  } catch (error: any) {
    console.error('Update product error:', error)
    MessagePlugin.error(getErrorMessage(error, '更新商品失败'))
  } finally {
    updateLoading.value = false
  }
}

const handleOffline = async (product: any) => {
  const dialog = DialogPlugin.confirm({
    header: '确认下架',
    body: `确定要下架商品"${product.title}"吗？`,
    onConfirm: async () => {
      try {
        const { error } = await supabase
          .from('products')
          .update({ status: 'cancelled' })
          .eq('id', product.id)

        if (error) throw error

        MessagePlugin.success('商品已下架')
        await loadProducts()
        dialog.destroy()
      } catch (error: any) {
        console.error('Offline product error:', error)
        MessagePlugin.error(getErrorMessage(error, '下架失败'))
        dialog.destroy()
      }
    }
  })
}

const handleOnline = async (product: any) => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ status: 'active' })
      .eq('id', product.id)

    if (error) throw error

    MessagePlugin.success('商品已上架')
    await loadProducts()
  } catch (error: any) {
    console.error('Online product error:', error)
    MessagePlugin.error(getErrorMessage(error, '上架失败'))
  }
}

const handleDelete = async (product: any) => {
  const dialog = DialogPlugin.confirm({
    header: '确认删除',
    body: `确定要删除商品"${product.title}"吗？此操作不可恢复。`,
    theme: 'danger',
    onConfirm: async () => {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', product.id)

        if (error) throw error

        MessagePlugin.success('商品已删除')
        await loadProducts()
        dialog.destroy()
      } catch (error: any) {
        console.error('Delete product error:', error)
        MessagePlugin.error(getErrorMessage(error, '删除失败'))
        dialog.destroy()
      }
    }
  })
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '在售',
    sold: '已售出',
    cancelled: '已下架'
  }
  return statusMap[status] || status
}

const getStatusTheme = (status: string) => {
  const themeMap: Record<string, string> = {
    active: 'success',
    sold: 'default',
    cancelled: 'warning'
  }
  return themeMap[status] || 'default'
}

const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString()
}
</script>

<style scoped>
.my-products-container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 16px;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

/* 一级标签样式 */
.main-tabs {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 2px solid #f0f0f0;
  flex-wrap: wrap;
}

.main-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 15px;
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
  font-size: 13px;
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

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.product-item {
  display: flex;
  gap: 24px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.product-item:hover {
  box-shadow: 0 4px 16px rgba(227, 77, 89, 0.15);
  transform: translateY(-2px);
}

.product-left {
  display: flex;
  gap: 20px;
  flex: 1;
}

.product-image {
  width: 140px;
  height: 140px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-title {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-title:hover {
  color: #e34d59;
  cursor: pointer;
}

.product-details {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #666;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 10px;
}

.price {
  color: #e34d59;
  font-size: 24px;
  font-weight: 700;
}

.auction-tag {
  background: #f56c6c;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.product-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.time {
  font-size: 12px;
  color: #999;
}

.product-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
  min-width: 120px;
}

.product-actions .t-button {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 6px;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.product-actions .t-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

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

/* 平板设备 */
@media (max-width: 1024px) {
  .my-products-container {
    padding: 16px;
  }

  .page-header {
    padding: 16px;
  }

  .page-header h2 {
    font-size: 22px;
  }

  .main-tabs {
    gap: 10px;
    padding: 16px 20px;
  }

  .main-tab {
    padding: 8px 16px;
    font-size: 14px;
  }

  .product-image {
    width: 120px;
    height: 120px;
  }

  .product-actions {
    min-width: 100px;
  }

  .product-actions .t-button {
    height: 40px;
    font-size: 14px;
  }
}

/* 移动设备 */
@media (max-width: 768px) {
  .my-products-container {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    padding: 16px;
  }

  .page-header h2 {
    font-size: 20px;
  }

  .main-tabs {
    gap: 8px;
    padding: 12px 16px;
  }

  .main-tab {
    padding: 8px 14px;
    font-size: 13px;
  }

  .product-item {
    flex-direction: column;
    padding: 16px;
  }

  .product-left {
    flex-direction: column;
    gap: 16px;
  }

  .product-image {
    width: 100%;
    height: 200px;
  }

  .product-actions {
    flex-direction: row;
    flex-wrap: wrap;
    min-width: auto;
  }

  .product-actions .t-button {
    flex: 1;
    min-width: calc(50% - 6px);
    height: 40px;
  }
}

/* 小屏手机 */
@media (max-width: 480px) {
  .page-header h2 {
    font-size: 18px;
  }

  .main-tabs {
    gap: 6px;
    padding: 12px;
  }

  .main-tab {
    padding: 6px 12px;
    font-size: 12px;
  }

  .product-title {
    font-size: 16px;
  }

  .price {
    font-size: 20px;
  }

  .product-actions {
    gap: 8px;
  }

  .product-actions .t-button {
    font-size: 13px;
    height: 38px;
  }
}
</style>
