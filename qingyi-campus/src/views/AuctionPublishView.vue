<template>
  <div class="auction-publish-container">
    <!-- 返回按钮 -->
    <div class="back-button-container">
      <button class="back-button" @click="goBack">
        <t-icon name="chevron-left" class="back-icon" />
        <span class="back-text">返回</span>
      </button>
    </div>

    <t-card>
      <template #header>
        <h2>发布拍卖</h2>
      </template>

      <t-form
        ref="formRef"
        :data="formData"
        :rules="rules"
        label-width="100px"
        @submit="handleSubmit"
      >
        <t-form-item label="商品标题" name="title">
          <t-input
            v-model="formData.title"
            placeholder="请输入商品标题"
            size="large"
          />
        </t-form-item>

        <t-form-item label="商品分类" name="category">
          <t-select v-model="formData.category" placeholder="请选择分类">
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
            v-model="formData.description"
            placeholder="请输入商品描述"
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
        </t-form-item>

        <t-form-item label="起拍价" name="startPrice">
          <t-input-number
            v-model="formData.startPrice"
            :min="0"
            :decimal-places="2"
            placeholder="请输入起拍价"
            size="large"
          />
          <span style="margin-left: 8px">元</span>
        </t-form-item>

        <t-form-item label="保证金" name="depositAmount">
          <t-input-number
            v-model="formData.depositAmount"
            :min="0"
            :decimal-places="2"
            placeholder="请输入保证金金额"
            size="large"
          />
          <span style="margin-left: 8px">元</span>
        </t-form-item>

        <t-form-item label="结束时间" name="endTime">
          <t-date-picker
            v-model="formData.endTime"
            placeholder="请选择拍卖结束时间"
            enable-time-picker
            format="YYYY-MM-DD HH:mm:ss"
            size="large"
          />
        </t-form-item>

        <t-form-item label="所在地" name="location">
          <t-input
            v-model="formData.location"
            placeholder="请输入所在地（如：北京市/清华大学）"
            size="large"
          />
        </t-form-item>

        <t-form-item label="商品图片" name="images">
          <t-upload
            :default-files="formData.imageFiles"
            :auto-upload="false"
            multiple
            :max="9"
            :size-limit="{ size: 5, unit: 'MB' }"
            accept="image/*"
            theme="image"
            @change="handleImageChange"
          />
        </t-form-item>

        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit" size="large" :loading="loading">
              发布拍卖
            </t-button>
            <t-button theme="default" size="large" @click="handleCancel">
              取消
            </t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const goBack = () => {
  router.back()
}

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

const formData = reactive({
  title: '',
  category: '',
  description: '',
  startPrice: 0,
  depositAmount: 0,
  endTime: '',
  location: '',
  images: [] as string[],
  imageFiles: [] as File[]
})

const rules = {
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
  startPrice: [
    { required: true, message: '请输入起拍价' },
    { type: 'number', min: 0.01, message: '起拍价必须大于0' }
  ],
  depositAmount: [
    { required: true, message: '请输入保证金' },
    { type: 'number', min: 0.01, message: '保证金必须大于0' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间' }
  ],
  location: [
    { required: true, message: '请输入所在地' }
  ],
  images: [
    {
      validator: () => formData.imageFiles.length > 0,
      message: '请至少上传一张商品图片'
    }
  ]
}

const handleImageChange = (value: any) => {
  const files: File[] = value
    .filter((item: any) => item.raw instanceof File)
    .map((item: any) => item.raw)
  formData.imageFiles = files
}

const uploadImages = async (): Promise<string[]> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('请先登录')

  const imageUrls: string[] = []

  for (const file of formData.imageFiles) {
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

  return imageUrls
}

const ensureUserProfile = async (userId: string) => {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (!existingProfile) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: '用户' + userId.substring(0, 8)
      })

    if (insertError) {
      console.error('Failed to create profile:', insertError)
    }
  }
}

const handleSubmit = async () => {
  loading.value = true

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      MessagePlugin.error('请先登录')
      router.push('/auth')
      return
    }

    await ensureUserProfile(user.id)

    formData.images = await uploadImages()

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        seller_id: user.id,
        title: formData.title,
        category: formData.category,
        description: formData.description,
        price: formData.startPrice,
        location: formData.location,
        images: formData.images,
        is_auction: true,
        status: 'active'
      })
      .select()
      .single()

    if (productError) throw productError

    const { error: auctionError } = await supabase
      .from('auctions')
      .insert({
        product_id: product.id,
        start_price: formData.startPrice,
        current_price: formData.startPrice,
        deposit_amount: formData.depositAmount,
        end_time: formData.endTime,
        status: 'ongoing'
      })

    if (auctionError) throw auctionError

    MessagePlugin.success('拍卖发布成功')
    router.push('/auction')
  } catch (error: any) {
    console.error('Submit auction error:', error)
    MessagePlugin.error(getErrorMessage(error, '发布失败，请重试'))
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
    } else if (err.message.includes('constraint')) {
      return '数据约束错误'
    }
  }
  return defaultMsg
}

const handleCancel = () => {
  router.back()
}
</script>

<style scoped>
.auction-publish-container {
  width: 100%;
  max-width: 100%;
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

.auction-publish-container h2 {
  margin: 0;
  color: #333;
}

/* 移动设备 */
@media (max-width: 768px) {
  .auction-publish-container {
    padding: 15px 10px;
    max-width: 100%;
  }

  .auction-publish-container h2 {
    font-size: 20px;
  }
}

/* 小屏手机 */
@media (max-width: 480px) {
  .auction-publish-container {
    padding: 10px 5px;
  }
}
</style>
