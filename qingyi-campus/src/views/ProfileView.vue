<template>
  <div class="profile-container">
    <!-- 装饰背景 -->
    <div class="profile-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>

    <div class="profile-header">
      <div class="user-info-card">
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <t-avatar 
              :image="previewAvatar || userProfile?.avatar_url" 
              size="140px" 
              :class="['large-avatar', { uploading: uploadingAvatar, 'preview-mode': previewAvatar !== null }]" 
              @click="triggerAvatarUpload"
            >
              <t-icon name="user" size="56px" />
            </t-avatar>
            <!-- 预览标记 -->
            <div v-if="previewAvatar" class="preview-badge">
              <t-icon name="check" size="14px" />
              <span>预览</span>
            </div>
            <input
              ref="avatarInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleAvatarUpload"
            />
          </div>
          <div class="avatar-buttons">
            <t-button
              theme="primary"
              variant="outline"
              size="small"
              @click="triggerAvatarUpload"
              class="avatar-btn"
              :loading="uploadingAvatar"
              :disabled="uploadingAvatar"
            >
              <template #icon>
                <t-icon name="camera" v-if="!uploadingAvatar" />
                <t-icon name="loading" v-else />
              </template>
              {{ uploadingAvatar ? `${getUploadStatusText()} ${uploadProgress > 0 ? `(${uploadProgress}%)` : ''}` : '更换头像' }}
            </t-button>
            <t-button
              v-if="userProfile?.avatar_url && !uploadingAvatar"
              theme="default"
              variant="text"
              size="small"
              @click="removeAvatar"
              class="avatar-btn-remove"
            >
              <template #icon>
                <t-icon name="close-circle" />
              </template>
              移除头像
            </t-button>
          </div>
          
          <!-- 上传进度条 -->
          <div v-if="uploadingAvatar" class="upload-progress-container">
            <div class="upload-progress-bar" :style="{ width: `${uploadProgress}%` }">
              <div class="upload-progress-fill" :class="`status-${uploadStatus}`"></div>
            </div>
            <div class="upload-progress-text">
              <t-icon name="check-circle" v-if="uploadStatus === 'success'" />
              <t-icon name="error-circle" v-else-if="uploadStatus === 'error'" />
              <t-icon name="loading" v-else />
              <span>{{ getUploadStatusText() }}</span>
            </div>
          </div>
        </div>
        <div class="user-details">
          <div class="username-row">
            <h2 class="username">{{ userProfile?.username }}</h2>
            <div class="user-badge">
              <t-icon name="check-circle" size="14px" />
              <span>已认证</span>
            </div>
          </div>
          <p class="email">
            <t-icon name="mail" size="14px" />
            {{ user?.email }}
          </p>
          <p class="user-joined" v-if="userProfile?.created_at">
            <t-icon name="calendar" size="14px" />
            加入时间：{{ formatDate(userProfile.created_at) }}
          </p>
          <div class="user-stats">
            <div class="stat-item">
              <div class="stat-icon products-icon">
                <t-icon name="shop" size="24px" />
              </div>
              <div class="stat-content">
                <span class="stat-number">{{ stats.products }}</span>
                <span class="stat-label">发布商品</span>
              </div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-icon favorites-icon">
                <t-icon name="heart" size="24px" />
              </div>
              <div class="stat-content">
                <span class="stat-number">{{ stats.favorites }}</span>
                <span class="stat-label">收藏</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <div class="profile-tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </div>
      </div>

      <!-- 个人资料 -->
      <div class="tab-content" v-if="activeTab === 'profile'">
        <t-card title="基本资料">
          <t-form :data="formData" :rules="rules" ref="formRef" layout="vertical">
            <t-form-item label="用户名" name="username">
              <t-input v-model="formData.username" placeholder="请输入用户名" />
            </t-form-item>
            
            <t-form-item label="个人简介" name="bio">
              <t-textarea 
                v-model="formData.bio" 
                placeholder="介绍一下自己..." 
                :maxlength="200"
              />
            </t-form-item>
            
            <t-form-item label="手机号码" name="phone">
              <t-input v-model="formData.phone" placeholder="请输入手机号码" />
            </t-form-item>
            
            <t-form-item label="所在学校" name="school">
              <t-input v-model="formData.school" placeholder="请输入所在学校" />
            </t-form-item>
            
            <t-form-item>
              <t-button theme="primary" @click="saveProfile" :loading="saving">
                保存修改
              </t-button>
            </t-form-item>
          </t-form>
        </t-card>

        <t-card title="账户安全" class="security-card">
          <div class="security-item">
            <div class="security-info">
              <h4>登录密码</h4>
              <p>用于登录青易校园账户</p>
            </div>
            <t-button variant="outline" @click="changePassword">
              修改密码
            </t-button>
          </div>
          <div class="security-item">
            <div class="security-info">
              <h4>绑定手机</h4>
              <p>{{ formData.phone || '未绑定' }}</p>
            </div>
            <t-button variant="outline" @click="bindPhone">
                {{ formData.phone ? '更换' : '绑定' }}
            </t-button>
          </div>
        </t-card>
      </div>


      <!-- 我的收藏 -->
      <div class="tab-content" v-if="activeTab === 'favorites'">
        <div v-if="loadingFavorites" class="loading-state">
          <t-loading size="large" text="加载中..." />
        </div>

        <div v-else-if="favorites.length === 0" class="empty-state">
          <t-empty description="暂无收藏" />
        </div>

        <div v-else class="favorites-grid">
          <t-card
            v-for="item in favorites"
            :key="item.id"
            class="favorite-card"
            hover-shadow
          >
            <img :src="item.product?.images?.[0]" class="favorite-image" />
            <div class="favorite-info">
              <h4 class="favorite-title">{{ item.product?.title }}</h4>
              <p class="favorite-price">¥{{ item.product?.price }}</p>
              <div class="favorite-actions">
                <t-button theme="primary" size="small" @click="viewProduct(item.product)">
                  查看详情
                </t-button>
                <t-button 
                  variant="outline" 
                  size="small" 
                  @click="removeFavorite(item.id)"
                >
                  取消收藏
                </t-button>
              </div>
            </div>
          </t-card>
        </div>
      </div>

      <!-- 消息通知 -->
      <div class="tab-content" v-if="activeTab === 'messages'">
        <div class="message-types">
          <div 
            v-for="type in messageTypes" 
            :key="type.key"
            class="message-type"
            :class="{ active: messageType === type.key }"
            @click="messageType = type.key"
          >
            {{ type.label }}
            <span v-if="type.count > 0" class="message-badge">{{ type.count }}</span>
          </div>
        </div>

        <div v-if="loadingMessages" class="loading-state">
          <t-loading size="large" text="加载中..." />
        </div>

        <div v-else-if="messages.length === 0" class="empty-state">
          <t-empty description="暂无消息" />
        </div>

        <div v-else class="messages-list">
          <t-card v-for="msg in messages" :key="msg.id" class="message-card">
            <div class="message-header">
              <span class="message-type-label">{{ getMessageTypeLabel(msg.type) }}</span>
              <span class="message-time">{{ formatDate(msg.created_at) }}</span>
            </div>
            <div class="message-content">
              <h4>{{ msg.title }}</h4>
              <p>{{ msg.content }}</p>
            </div>
            <div class="message-footer">
              <t-button 
                v-if="!msg.is_read" 
                theme="primary" 
                size="small"
                @click="markAsRead(msg.id)"
              >
                标记已读
              </t-button>
            </div>
          </t-card>
        </div>
      </div>

      <!-- 地址管理 -->
      <div class="tab-content" v-if="activeTab === 'address'">
        <div class="address-actions">
          <t-button theme="primary" @click="showAddAddressDialog">
            新增地址
          </t-button>
        </div>

        <div v-if="loadingAddresses" class="loading-state">
          <t-loading size="large" text="加载中..." />
        </div>

        <div v-else-if="addresses.length === 0" class="empty-state">
          <t-empty description="暂无收货地址" />
        </div>

        <div v-else class="addresses-list">
          <t-card v-for="addr in addresses" :key="addr.id" class="address-card">
            <div class="address-main">
              <div class="address-info">
                <div class="address-header">
                  <div class="receiver-info">
                    <t-icon name="user" size="16px" class="receiver-icon" />
                    <h3 class="receiver-name">{{ addr.name }}</h3>
                  </div>
                  <span v-if="addr.is_default" class="default-tag">
                    <t-icon name="star" size="12px" />
                    默认地址
                  </span>
                </div>
                
                <div class="address-phone">
                  <t-icon name="call" size="14px" class="phone-icon" />
                  <span>{{ addr.phone }}</span>
                </div>
                
                <div class="address-location">
                  <t-icon name="location" size="16px" class="location-icon" />
                  <div class="location-text">
                    <div class="region-text">{{ addr.province }} {{ addr.city }} {{ addr.district }}</div>
                    <div class="detail-text">{{ addr.detail }}</div>
                  </div>
                </div>
              </div>

              <div class="address-actions">
                <t-button
                  v-if="!addr.is_default"
                  variant="outline"
                  size="small"
                  @click="setDefaultAddress(addr.id)"
                  class="set-default-btn"
                >
                  <template #icon>
                    <t-icon name="star" />
                  </template>
                  设为默认
                </t-button>
                <t-button 
                  variant="outline" 
                  size="small"
                  @click="editAddress(addr)"
                  class="edit-btn"
                >
                  <template #icon>
                    <t-icon name="edit" />
                  </template>
                  编辑
                </t-button>
                <t-button
                  variant="outline"
                  size="small"
                  @click="deleteAddress(addr.id)"
                  class="delete-btn"
                >
                  <template #icon>
                    <t-icon name="delete" />
                  </template>
                  删除
                </t-button>
              </div>
            </div>
          </t-card>
        </div>
      </div>
    </div>

    <!-- 取消订单对话框 -->
    <t-dialog
      v-model:visible="cancelOrderDialog"
      header="取消订单"
      @confirm="cancelOrder"
      width="500px"
    >
      <t-form label-width="80px">
        <t-form-item label="取消原因">
          <t-textarea
            v-model="cancelReason"
            placeholder="请输入取消原因"
            :maxlength="200"
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 申请退款对话框 -->
    <t-dialog
      v-model:visible="refundDialog"
      header="申请退款"
      @confirm="requestRefund"
      width="500px"
    >
      <t-alert message="退款说明" theme="info" class="refund-info">
        退款将在1-3个工作日内原路返回到您的支付账户
      </t-alert>
      <t-form label-width="80px" class="refund-form">
        <t-form-item label="退款原因">
          <t-textarea
            v-model="refundReason"
            placeholder="请详细描述退款原因"
            :maxlength="200"
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 评价商品对话框 -->
    <t-dialog
      v-model:visible="rateDialog"
      header="评价商品"
      @confirm="submitRating"
      width="500px"
    >
      <t-form label-width="80px">
        <t-form-item label="评分">
          <t-rate v-model="rating" :count="5" allow-half />
        </t-form-item>
        <t-form-item label="评价内容">
          <t-textarea
            v-model="ratingComment"
            placeholder="请输入您的评价"
            :maxlength="200"
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 订单详情对话框 -->
    <t-dialog
      v-model:visible="orderDetailDialog"
      header="订单详情"
      width="700px"
      :footer="false"
    >
      <div v-if="currentOrder" class="order-detail-content">
        <div class="detail-section">
          <h4>订单信息</h4>
          <div class="detail-info">
            <p><span class="label">订单编号:</span> <span>{{ currentOrder.id?.slice(0, 8) || '...' }}</span></p>
            <p><span class="label">订单状态:</span> <span :class="`status-${currentOrder.status}`">{{ getOrderStatusText(currentOrder.status) }}</span></p>
            <p><span class="label">订单类型:</span> <span>{{ currentOrder.order_type === 'auction' ? '拍卖订单' : '普通订单' }}</span></p>
            <p><span class="label">下单时间:</span> <span>{{ formatDateTime(currentOrder.created_at) }}</span></p>
            <p v-if="currentOrder.payment_time"><span class="label">支付时间:</span> <span>{{ formatDateTime(currentOrder.payment_time) }}</span></p>
            <p v-if="currentOrder.shipped_time"><span class="label">发货时间:</span> <span>{{ formatDateTime(currentOrder.shipped_time) }}</span></p>
            <p v-if="currentOrder.completed_time"><span class="label">完成时间:</span> <span>{{ formatDateTime(currentOrder.completed_time) }}</span></p>
          </div>
        </div>

        <div class="detail-section">
          <h4>商品信息</h4>
          <div class="product-detail">
            <div v-if="currentOrder.product?.images?.[0]" class="product-detail-image">
              <img :src="currentOrder.product.images[0]" />
            </div>
            <div v-else class="product-detail-image no-image">
              <t-icon name="image" size="48px" />
            </div>
            <div class="product-detail-info">
              <h5>{{ currentOrder.product?.title }}</h5>
              <p v-if="currentOrder.product?.category">分类: {{ currentOrder.product.category }}</p>
              <p v-if="currentOrder.product?.description" class="product-description">
                {{ currentOrder.product.description }}
              </p>
              <p class="product-price">¥{{ currentOrder.product?.price }}</p>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>金额信息</h4>
          <div class="price-info">
            <p><span class="label">商品总价:</span> <span>¥{{ currentOrder.total_amount }}</span></p>
            <p><span class="label">运费:</span> <span>¥0.00</span></p>
            <p class="total-price"><span class="label">实付金额:</span> <span>¥{{ currentOrder.total_amount }}</span></p>
          </div>
        </div>

        <div class="detail-section" v-if="currentOrder.seller">
          <h4>卖家信息</h4>
          <div class="seller-info">
            <t-avatar :image="currentOrder.seller?.avatar_url" size="40px">
              <t-icon name="user" size="20px" />
            </t-avatar>
            <div>
              <p>{{ currentOrder.seller?.username }}</p>
              <p class="seller-label">卖家</p>
            </div>
          </div>
        </div>
      </div>
    </t-dialog>

    <!-- 修改密码对话框 -->
    <t-dialog
      v-model:visible="changePasswordDialog"
      header="修改密码"
      @confirm="handlePasswordChange"
      width="480px"
    >
      <t-form :data="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <t-form-item label="当前密码" name="currentPassword">
          <t-input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            :clearable="true"
          />
        </t-form-item>
        <t-form-item label="新密码" name="newPassword">
          <t-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码（6-20位字符）"
            :clearable="true"
          />
          <div class="password-tip">密码长度6-20位，建议包含字母、数字和符号</div>
        </t-form-item>
        <t-form-item label="确认密码" name="confirmPassword">
          <t-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            :clearable="true"
          />
        </t-form-item>
        <t-alert message="安全提示" theme="info" class="password-security-tip">
          定期修改密码有助于保护账户安全
        </t-alert>
      </t-form>
    </t-dialog>

    <!-- 更换手机号对话框 -->
    <t-dialog
      v-model:visible="bindPhoneDialog"
      :header="formData.phone ? '更换手机号' : '绑定手机号'"
      @confirm="handleBindPhone"
      width="480px"
      :confirm-btn="{ loading: bindingPhone }"
    >
      <t-form :data="bindPhoneForm" :rules="bindPhoneRules" ref="bindPhoneFormRef" label-width="100px">
        <t-form-item label="手机号码" name="phone">
          <t-input
            v-model="bindPhoneForm.phone"
            placeholder="请输入手机号码"
            :clearable="true"
          />
        </t-form-item>
        <t-alert message="提示" theme="info" class="phone-security-tip">
          手机号更换后会立即生效
        </t-alert>
      </t-form>
    </t-dialog>

    <!-- 新增/编辑地址对话框 -->
    <t-dialog
      v-model:visible="addressDialog"
      :header="isEditingAddress ? '编辑收货地址' : '新增收货地址'"
      @confirm="saveAddress"
      width="580px"
      :confirm-btn="{ loading: savingAddress, theme: 'primary' }"
      class="address-dialog"
    >
      <t-form :data="addressForm" :rules="addressRules" ref="addressFormRef" label-width="90px" class="address-form">
        <div class="form-row">
          <t-form-item label="收货人" name="name" class="form-item-full">
            <t-input
              v-model="addressForm.name"
              placeholder="请输入收货人姓名"
              :clearable="true"
              size="large"
            />
          </t-form-item>
        </div>
        
        <div class="form-row">
          <t-form-item label="手机号码" name="phone" class="form-item-full">
            <t-input
              v-model="addressForm.phone"
              placeholder="请输入手机号码"
              :clearable="true"
              size="large"
            />
          </t-form-item>
        </div>

        <t-form-item label="所在地区" name="region" class="region-form-item">
          <div class="region-selects">
            <div class="region-select-wrapper">
              <t-select
                v-model="addressForm.province"
                placeholder="省份"
                :clearable="true"
                size="large"
                class="region-select"
                @change="handleProvinceChange"
              >
                <t-option value="北京市" label="北京市">北京市</t-option>
                <t-option value="上海市" label="上海市">上海市</t-option>
                <t-option value="广东省" label="广东省">广东省</t-option>
                <t-option value="浙江省" label="浙江省">浙江省</t-option>
                <t-option value="江苏省" label="江苏省">江苏省</t-option>
                <t-option value="湖北省" label="湖北省">湖北省</t-option>
                <t-option value="四川省" label="四川省">四川省</t-option>
              </t-select>
              <t-icon name="chevron-down" class="select-arrow" size="14px" />
            </div>
            <div class="region-select-wrapper">
              <t-select
                v-model="addressForm.city"
                placeholder="城市"
                :clearable="true"
                size="large"
                class="region-select"
                :disabled="!addressForm.province"
              >
                <t-option v-for="city in getCities()" :key="city" :value="city" :label="city">{{ city }}</t-option>
              </t-select>
              <t-icon name="chevron-down" class="select-arrow" size="14px" />
            </div>
            <div class="region-select-wrapper">
              <t-select
                v-model="addressForm.district"
                placeholder="区/县"
                :clearable="true"
                size="large"
                class="region-select"
                :disabled="!addressForm.city"
              >
                <t-option v-for="district in getDistricts()" :key="district" :value="district" :label="district">{{ district }}</t-option>
              </t-select>
              <t-icon name="chevron-down" class="select-arrow" size="14px" />
            </div>
          </div>
        </t-form-item>

        <t-form-item label="详细地址" name="detail" class="detail-form-item">
          <t-textarea
            v-model="addressForm.detail"
            placeholder="请输入详细地址（街道、门牌号、小区名称等）"
            :maxlength="200"
            :autosize="{ minRows: 3, maxRows: 3 }"
            class="detail-textarea"
          />
          <div class="address-char-count">{{ addressForm.detail.length }}/200</div>
        </t-form-item>

        <t-form-item class="default-form-item">
          <t-checkbox v-model="addressForm.is_default" class="default-checkbox">
            <template #label>
              <span class="checkbox-label">设为默认地址</span>
            </template>
          </t-checkbox>
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const user = ref<any>(null)
const userProfile = ref<any>(null)
const activeTab = ref('profile')
const messageType = ref('all')
const saving = ref(false)
const formRef = ref()

// 调试信息
console.log('ProfileView 组件初始化', {
  activeTab: activeTab.value,
  user: user.value
})

// 统计数据
const stats = reactive({
  products: 0,
  favorites: 0
})

// 表单数据
const formData = reactive({
  username: '',
  bio: '',
  phone: '',
  school: ''
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 3, message: '用户名至少3个字符' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
  ]
}

// Tabs
const tabs = [
  { key: 'profile', label: '个人资料' },
  { key: 'favorites', label: '我的收藏' },
  { key: 'messages', label: '消息通知' },
  { key: 'address', label: '地址管理' }
]

// 订单搜索
const messageTypes = [
  { key: 'all', label: '全部', count: 0 },
  { key: 'system', label: '系统通知', count: 0 },
  { key: 'order', label: '订单消息', count: 0 },
  { key: 'comment', label: '评论消息', count: 0 }
]

// 数据列表
const favorites = ref<any[]>([])
const messages = ref<any[]>([])
const addresses = ref<any[]>([])

const loadingFavorites = ref(false)
const loadingMessages = ref(false)
const loadingAddresses = ref(false)

// 对话框状态
const cancelOrderDialog = ref(false)
const refundDialog = ref(false)
const rateDialog = ref(false)
const orderDetailDialog = ref(false)
const changePasswordDialog = ref(false)
const currentOrder = ref<any>(null)

// 对话框表单数据
const cancelReason = ref('')
const refundReason = ref('')
const rating = ref(5)
const ratingComment = ref('')

// 修改密码表单
const passwordFormRef = ref()
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码验证规则
const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码' },
    { min: 6, max: 20, message: '密码长度为6-20位字符' },
    { 
      validator: (val: string) => {
        return val !== passwordForm.currentPassword || '新密码不能与当前密码相同'
      }
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码' },
    { 
      validator: (val: string) => {
        return val === passwordForm.newPassword || '两次输入的密码不一致'
      }
    }
  ]
}

const changingPassword = ref(false)

// 绑定手机号相关
const bindPhoneDialog = ref(false)
const bindingPhone = ref(false)
const bindPhoneFormRef = ref()
const bindPhoneForm = reactive({
  phone: ''
})

// 绑定手机号验证规则
const bindPhoneRules = {
  phone: [
    { required: true, message: '请输入手机号码' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
  ]
}

// 地址管理相关
const addressDialog = ref(false)
const isEditingAddress = ref(false)
const currentEditingAddress = ref<any>(null)
const savingAddress = ref(false)
const addressFormRef = ref()
const addressForm = reactive({
  id: '',
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  is_default: false
})

// 省市区数据映射
const provinceData: Record<string, string[]> = {
  '北京市': ['北京市'],
  '上海市': ['上海市'],
  '广东省': ['广州市', '深圳市', '东莞市', '佛山市'],
  '浙江省': ['杭州市', '宁波市', '温州市'],
  '江苏省': ['南京市', '苏州市', '无锡市', '常州市', '南通市', '徐州市'],
  '湖北省': ['武汉市', '襄阳市', '宜昌市'],
  '四川省': ['成都市', '绵阳市', '德阳市']
}

const districtData: Record<string, string[]> = {
  '北京市': ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '通州区'],
  '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '浦东新区'],
  '广州市': ['天河区', '越秀区', '海珠区', '荔湾区', '白云区'],
  '深圳市': ['福田区', '南山区', '罗湖区', '宝安区', '龙岗区'],
  '东莞市': ['东城区', '南城区', '万江区'],
  '佛山市': ['禅城区', '南海区', '顺德区'],
  '杭州市': ['西湖区', '上城区', '下城区', '江干区', '滨江区'],
  '宁波市': ['海曙区', '江北区', '鄞州区'],
  '温州市': ['鹿城区', '龙湾区', '瓯海区'],
  '南京市': ['玄武区', '秦淮区', '鼓楼区', '建邺区', '浦口区'],
  '苏州市': ['姑苏区', '吴中区', '相城区', '虎丘区'],
  '无锡市': ['锡山区', '惠山区', '滨湖区', '梁溪区'],
  '常州市': ['天宁区', '钟楼区', '新北区', '武进区'],
  '南通市': ['崇川区', '港闸区', '通州区'],
  '徐州市': ['泉山区', '云龙区', '鼓楼区', '铜山区'],
  '武汉市': ['江岸区', '江汉区', '武昌区', '洪山区'],
  '襄阳市': ['襄城区', '樊城区'],
  '宜昌市': ['西陵区', '伍家岗区'],
  '成都市': ['锦江区', '青羊区', '金牛区', '武侯区', '成华区'],
  '绵阳市': ['涪城区', '游仙区'],
  '德阳市': ['旌阳区', '罗江区']
}

const getCities = () => {
  if (!addressForm.province) return []
  return provinceData[addressForm.province] || []
}

const getDistricts = () => {
  if (!addressForm.city) return []
  return districtData[addressForm.city] || []
}

const handleProvinceChange = () => {
  addressForm.city = ''
  addressForm.district = ''
}

// 地址表单验证规则
const addressRules = {
  name: [
    { required: true, message: '请输入收货人姓名' },
    { min: 2, max: 20, message: '收货人姓名长度为2-20位' }
  ],
  phone: [
    { required: true, message: '请输入手机号码' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
  ],
  region: [
    { 
      validator: () => {
        if (!addressForm.province || !addressForm.city || !addressForm.district) {
          return '请选择完整的省市区信息'
        }
        return true
      }
    }
  ],
  detail: [
    { required: true, message: '请输入详细地址' },
    { min: 5, max: 200, message: '详细地址长度为5-200位' }
  ]
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
    } else if (err.message.includes('violates row-level security policy')) {
      return '权限错误，请检查相关设置'
    } else if (err.message.includes('The resource object was already found')) {
      return '文件已存在，请更换文件名'
    } else if (err.message.includes('not found')) {
      return '资源不存在，请联系管理员'
    }
  }
  return defaultMsg
}

onMounted(async () => {
  await loadUser()

  // 只有在用户登录后才加载数据
  if (user.value) {
    await Promise.all([
      loadStats(),
      loadFavorites(),
      loadMessages(),
      loadAddresses()
    ])
  }
})

const loadUser = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('获取会话失败:', sessionError)
    }

    user.value = session?.user || null
    console.log('用户登录状态:', !!user.value, user.value?.id)

    if (user.value) {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (profileError) {
        console.error('获取用户资料失败:', profileError)
      }

      userProfile.value = data
      formData.username = data?.username || ''
      formData.bio = data?.bio || ''
      formData.phone = data?.phone || ''
      formData.school = data?.school || ''
    } else {
      userProfile.value = null
    }
  } catch (error) {
    console.error('加载用户信息异常:', error)
    user.value = null
    userProfile.value = null
  }
}

const loadStats = async () => {
  if (!user.value) return

  try {
    // 使用 RPC 函数获取统计 - 最可靠的方式
    const { data: productsCount } = await supabase
      .rpc('get_user_product_count', { user_uuid: user.value.id })

    const { data: favoritesCount } = await supabase
      .rpc('get_user_favorite_count', { user_uuid: user.value.id })

    stats.products = productsCount || 0
    stats.favorites = favoritesCount || 0
  } catch (error) {
    console.error('加载统计数据失败:', error)
    stats.products = 0
    stats.favorites = 0
  }
}

const loadFavorites = async () => {
  if (!user.value) return
  loadingFavorites.value = true

  const { data, error } = await supabase
    .from('favorites')
    .select(`
      *,
      product:products(
        *,
        images
      )
    `)
    .eq('user_id', user.value.id)
    .order('created_at', { ascending: false })

  if (data && !error) {
    favorites.value = data
  }

  loadingFavorites.value = false
}

const loadMessages = async () => {
  if (!user.value) return
  loadingMessages.value = true

  let query = supabase
    .from('messages')
    .select('*')
    .eq('user_id', user.value.id)
    .order('created_at', { ascending: false })

  if (messageType.value !== 'all') {
    query = query.eq('type', messageType.value)
  }

  const { data, error } = await query

  if (data && !error) {
    messages.value = data
    // 更新各类型计数
    messageTypes.forEach(type => {
      if (type.key === 'all') {
        type.count = data.length
      } else {
        type.count = data.filter((m: any) => m.type === type.key).length
      }
    })
  }

  loadingMessages.value = false
}

const loadAddresses = async () => {
  if (!user.value) return
  loadingAddresses.value = true

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.value.id)
    .order('is_default', { ascending: false })

  if (data && !error) {
    addresses.value = data
  }

  loadingAddresses.value = false
}

const saveProfile = async () => {
  if (!formRef.value) return
  
  const valid = await formRef.value.validate()
  if (valid !== true) return

  saving.value = true

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        username: formData.username,
        bio: formData.bio,
        phone: formData.phone,
        school: formData.school
      })
      .eq('id', user.value.id)

    if (error) throw error

    MessagePlugin.success('保存成功')
    userProfile.value = {
      ...userProfile.value,
      username: formData.username,
      bio: formData.bio,
      phone: formData.phone,
      school: formData.school
    }
  } catch (error: any) {
    MessagePlugin.error(getErrorMessage(error, '保存失败'))
  } finally {
    saving.value = false
  }
}

const changePassword = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  changePasswordDialog.value = true
}

const bindPhone = () => {
  bindPhoneForm.phone = ''
  bindPhoneDialog.value = true
}

const handleBindPhone = async () => {
  if (!bindPhoneFormRef.value) return
  
  const valid = await bindPhoneFormRef.value.validate()
  if (valid !== true) return

  bindingPhone.value = true

  try {
    // 更新用户的手机号
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ phone: bindPhoneForm.phone })
      .eq('id', user.value.id)

    if (updateError) throw updateError

    MessagePlugin.success('手机号' + (formData.phone ? '更换成功' : '绑定成功'))
    bindPhoneDialog.value = false

    // 更新本地状态
    formData.phone = bindPhoneForm.phone
    
    // 重置表单
    bindPhoneForm.phone = ''
  } catch (error: any) {
    console.error('操作失败:', error)
    MessagePlugin.error(getErrorMessage(error, '操作失败'))
  } finally {
    bindingPhone.value = false
  }
}

const handlePasswordChange = async () => {
  if (!passwordFormRef.value) return

  const valid = await passwordFormRef.value.validate()
  if (valid !== true) return

  changingPassword.value = true

  try {
    // 1. 先验证当前密码是否正确 - 通过尝试登录来验证
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()

    if (userError || !currentUser?.email) {
      throw new Error('获取用户信息失败')
    }

    // 尝试用当前密码登录验证
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: passwordForm.currentPassword
    })

    if (signInError) {
      throw new Error('当前密码错误')
    }

    // 2. 更新密码
    const { error: updateError } = await supabase.auth.updateUser({
      password: passwordForm.newPassword
    })

    if (updateError) {
      throw updateError
    }

    MessagePlugin.success('密码修改成功，下次登录请使用新密码')
    changePasswordDialog.value = false

    // 重置表单
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error: any) {
    console.error('修改密码失败:', error)
    if (error.message === '当前密码错误') {
      MessagePlugin.error('当前密码错误，请重新输入')
    } else {
      MessagePlugin.error(getErrorMessage(error, '修改密码失败'))
    }
  } finally {
    changingPassword.value = false
  }
}

const avatarInputRef = ref<HTMLInputElement | null>(null)
const uploadingAvatar = ref(false)
const previewAvatar = ref<string | null>(null)
const uploadProgress = ref(0)
const uploadStatus = ref('')

const triggerAvatarUpload = () => {
  avatarInputRef.value?.click()
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const getUploadStatusText = () => {
  const statusMap: any = {
    'uploading': '正在上传',
    'deleting': '正在清理',
    'getting_url': '处理中',
    'removing_old': '清理旧文件',
    'updating_db': '保存中',
    'success': '完成',
    'error': '失败'
  }
  return statusMap[uploadStatus.value] || '处理中'
}

const handleAvatarUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    MessagePlugin.error('请上传图片文件（JPG、PNG、GIF等）')
    return
  }

  // 验证文件大小（限制为 2MB）
  if (file.size > 2 * 1024 * 1024) {
    MessagePlugin.error(`图片大小不能超过 2MB（当前大小：${formatFileSize(file.size)}）`)
    return
  }

  uploadingAvatar.value = true
  uploadProgress.value = 0
  uploadStatus.value = 'uploading'

  // 创建本地预览
  const reader = new FileReader()
  reader.onload = (e) => {
    previewAvatar.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  try {
    // 1. 上传图片到 Supabase Storage - 文件名不包含 bucket 名称
    const fileName = `${user.value.id}/${Date.now()}_${file.name}`
    
    uploadStatus.value = 'uploading'
    MessagePlugin.loading({
      content: `正在上传头像... (${formatFileSize(file.size)})`,
      duration: 0
    })

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    uploadProgress.value = 50
    uploadStatus.value = 'deleting'

    if (uploadError) {
      // 如果 bucket 不存在，先创建它
      if (uploadError.message.includes('not found')) {
        MessagePlugin.error('请先在 Supabase 中创建 avatars bucket')
        return
      }
      throw uploadError
    }

    uploadStatus.value = 'getting_url'

    // 2. 获取图片的公共 URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    uploadProgress.value = 75
    uploadStatus.value = 'removing_old'

    // 3. 删除旧头像（如果存在）
    if (userProfile.value?.avatar_url) {
      try {
        const urlParts = userProfile.value.avatar_url.split('/')
        const oldFileName = `${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`
        await supabase.storage
          .from('avatars')
          .remove([oldFileName])
      } catch (e) {
        console.warn('删除旧头像失败:', e)
      }
    }

    uploadProgress.value = 90
    uploadStatus.value = 'updating_db'

    // 4. 更新数据库中的 avatar_url
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.value.id)

    if (updateError) throw updateError

    uploadProgress.value = 100
    uploadStatus.value = 'success'

    // 5. 更新本地状态
    userProfile.value = {
      ...userProfile.value,
      avatar_url: publicUrl
    }
    
    // 清除预览
    previewAvatar.value = null

    MessagePlugin.closeAll()
    MessagePlugin.success('✅ 头像更新成功！')

    // 6. 刷新页面以更新头像
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  } catch (error: any) {
    console.error('头像上传失败:', error)
    uploadStatus.value = 'error'
    
    MessagePlugin.closeAll()
    
    if (error.message.includes('The resource object was already found')) {
      MessagePlugin.error('文件已存在，请更换文件名或稍后重试')
    } else if (error.message.includes('violates row-level security policy')) {
      MessagePlugin.error('权限错误，请检查 storage 策略设置')
    } else if (error.message.includes('not found')) {
      MessagePlugin.error('存储桶不存在，请联系管理员')
    } else {
      MessagePlugin.error(getErrorMessage(error, '头像上传失败'))
    }
  } finally {
    uploadingAvatar.value = false
    uploadProgress.value = 0
    uploadStatus.value = ''
    if (target) target.value = ''
  }
}

const removeAvatar = async () => {
  try {
    // 删除旧头像文件
    if (userProfile.value?.avatar_url) {
      try {
        const fileName = userProfile.value.avatar_url.split('/').slice(-2).join('/')
        await supabase.storage
          .from('avatars')
          .remove([fileName])
      } catch (e) {
        console.warn('删除头像文件失败:', e)
      }
    }

    // 更新数据库
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.value.id)

    if (error) throw error

    // 更新本地状态
    userProfile.value = {
      ...userProfile.value,
      avatar_url: null
    }

    MessagePlugin.success('头像已移除')
  } catch (error: any) {
    console.error('移除头像失败:', error)
    MessagePlugin.error(getErrorMessage(error, '移除头像失败'))
  }
}

const viewProduct = (product: any) => {
  router.push(`/product/${product.id}`)
}

const removeFavorite = async (id: string) => {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id)

    if (error) throw error

    MessagePlugin.success('已取消收藏')
    await loadFavorites()
    await loadStats()
  } catch (error: any) {
    MessagePlugin.error(getErrorMessage(error, '操作失败'))
  }
}

const markAsRead = async (id: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', id)

    if (error) throw error

    await loadMessages()
  } catch (error: any) {
    MessagePlugin.error(getErrorMessage(error, '操作失败'))
  }
}

const showAddAddressDialog = () => {
  // 重置表单
  addressForm.id = ''
  addressForm.name = ''
  addressForm.phone = ''
  addressForm.province = ''
  addressForm.city = ''
  addressForm.district = ''
  addressForm.detail = ''
  addressForm.is_default = addresses.value.length === 0 // 如果没有地址，默认设为默认地址
  
  isEditingAddress.value = false
  currentEditingAddress.value = null
  addressDialog.value = true
}

const editAddress = (addr: any) => {
  // 填充表单
  addressForm.id = addr.id
  addressForm.name = addr.name
  addressForm.phone = addr.phone
  addressForm.province = addr.province || ''
  addressForm.city = addr.city || ''
  addressForm.district = addr.district || ''
  addressForm.detail = addr.detail
  addressForm.is_default = addr.is_default || false
  
  isEditingAddress.value = true
  currentEditingAddress.value = addr
  addressDialog.value = true
}

const saveAddress = async () => {
  if (!addressFormRef.value) return
  
  const valid = await addressFormRef.value.validate()
  if (valid !== true) return

  savingAddress.value = true

    try {
    // 如果设为默认地址，需要先取消其他地址的默认状态
    if (addressForm.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.value.id)
      if (addressForm.id) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.value.id)
          .neq('id', addressForm.id)
      }
    }

    let error
    if (isEditingAddress.value) {
      // 更新地址
      const result = await supabase
        .from('addresses')
        .update({
          name: addressForm.name,
          phone: addressForm.phone,
          province: addressForm.province,
          city: addressForm.city,
          district: addressForm.district,
          detail: addressForm.detail,
          is_default: addressForm.is_default
        })
        .eq('id', addressForm.id)
      error = result.error
    } else {
      // 新增地址
      const result = await supabase
        .from('addresses')
        .insert({
          user_id: user.value.id,
          name: addressForm.name,
          phone: addressForm.phone,
          province: addressForm.province,
          city: addressForm.city,
          district: addressForm.district,
          detail: addressForm.detail,
          is_default: addressForm.is_default
        })
      error = result.error
    }

    if (error) throw error

    MessagePlugin.success(isEditingAddress.value ? '地址修改成功' : '地址添加成功')
    addressDialog.value = false
    
    // 刷新地址列表
    await loadAddresses()
  } catch (error: any) {
    console.error('保存地址失败:', error)
    MessagePlugin.error(getErrorMessage(error, '保存地址失败'))
  } finally {
    savingAddress.value = false
  }
}

const setDefaultAddress = async (addrId: string) => {
  try {
    // 先取消所有地址的默认状态
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.value.id)

    // 设置新默认地址
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addrId)

    if (error) throw error

    MessagePlugin.success('默认地址设置成功')
    await loadAddresses()
  } catch (error: any) {
    console.error('设置默认地址失败:', error)
    MessagePlugin.error(getErrorMessage(error, '设置默认地址失败'))
  }
}

// 为了支持订单详情对话框，需要一个占位的函数
const viewOrderDetail = (order: any) => {
  currentOrder.value = order
  orderDetailDialog.value = true
}

const deleteAddress = async (id: string) => {
  try {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)

    if (error) throw error

    MessagePlugin.success('删除成功')
    await loadAddresses()
  } catch (error: any) {
    MessagePlugin.error(getErrorMessage(error, '操作失败'))
  }
}

const getMessageTypeLabel = (type: string) => {
  const map: any = {
    system: '系统通知',
    order: '订单消息',
    comment: '评论消息'
  }
  return map[type] || type
}

// 订单相关函数
const cancelOrder = async () => {
  try {
    if (!cancelReason.value) {
      MessagePlugin.warning('请输入取消原因')
      return
    }

    // 这里应该调用取消订单的 API
    MessagePlugin.success('订单已取消')
    cancelOrderDialog.value = false
    cancelReason.value = ''
  } catch (error: any) {
    MessagePlugin.error(getErrorMessage(error, '取消订单失败'))
  }
}

const requestRefund = async () => {
  try {
    if (!refundReason.value) {
      MessagePlugin.warning('请输入退款原因')
      return
    }

    // 这里应该调用申请退款的 API
    MessagePlugin.success('退款申请已提交')
    refundDialog.value = false
    refundReason.value = ''
  } catch (error: any) {
    MessagePlugin.error(getErrorMessage(error, '申请退款失败'))
  }
}

const submitRating = async () => {
  try {
    if (!ratingComment.value) {
      MessagePlugin.warning('请输入评价内容')
      return
    }

    // 这里应该调用评价的 API
    MessagePlugin.success('评价成功')
    rateDialog.value = false
    rating.value = 5
    ratingComment.value = ''
  } catch (error: any) {
    MessagePlugin.error(getErrorMessage(error, '评价失败'))
  }
}

const getOrderStatusText = (status: string) => {
  const map: any = {
    pending: '待付款',
    paid: '已付款',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const formatDateTime = (date: string) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const formatDate = (date: string) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<style scoped>
.profile-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
  position: relative;
}

/* 装饰背景 */
.profile-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.05;
  animation: float 20s infinite ease-in-out;
}

.circle-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 100%);
  top: -50px;
  right: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 100%);
  bottom: 200px;
  left: -50px;
  animation-delay: 5s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 100%);
  top: 400px;
  right: 100px;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-30px) scale(1.1);
  }
}

.profile-header {
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
}

.user-info-card {
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 50%, #ff8a9b 100%);
  border-radius: 24px;
  padding: 40px;
  display: flex;
  gap: 48px;
  color: white;
  box-shadow: 0 8px 32px rgba(227, 77, 89, 0.3);
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.user-info-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: shimmer 15s infinite;
}

@keyframes shimmer {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-20px, 20px);
  }
}

.user-info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(227, 77, 89, 0.4);
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.avatar-wrapper {
  position: relative;
}

.large-avatar {
  background: white;
  color: #e34d59;
  font-weight: 600;
  font-size: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.large-avatar::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 2px solid transparent;
  border-radius: 50%;
  transition: border-color 0.3s ease;
}

.large-avatar:hover {
  transform: scale(1.05);
}

.large-avatar:active {
  transform: scale(0.95);
}

/* 上传时头像动画 */
.large-avatar.uploading {
  animation: pulse-ring 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(227, 77, 89, 0.7);
  transform: scale(1);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(227, 77, 89, 0);
    transform: scale(1.02);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(227, 77, 89, 0.7);
    transform: scale(1);
  }
}

.avatar-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.avatar-btn {
  background: rgba(255, 255, 255, 0.2) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  color: white !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.avatar-btn-remove {
  background: transparent !important;
  border: none !important;
  color: rgba(255, 255, 255, 0.8) !important;
  font-size: 12px;
}

.avatar-btn-remove:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
}

/* 上传进度条样式 */
.upload-progress-container {
  margin-top: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.preview-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.large-avatar.preview-mode {
  border-color: #52c41a;
  box-shadow: 0 0 0 0 4px rgba(82, 196, 26, 0.5);
}

.upload-progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.upload-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #e34d59 0%, #f0656e 100%);
  border-radius: 3px;
  transition: width 0.5s ease;
  position: relative;
  overflow: hidden;
}

.upload-progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.upload-progress-fill.status-success {
  background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
}

.upload-progress-fill.status-error {
  background: linear-gradient(90deg, #ff4d4f 0%, #cf1322 100%);
}

.upload-progress-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

.upload-progress-text .t-icon {
  font-size: 18px;
}

.upload-progress-text .t-icon.t-icon--name-check-circle {
  color: #52c41a;
  animation: checkmark 0.5s ease-in-out;
}

.upload-progress-text .t-icon.t-icon--name-error-circle {
  color: #ff4d4f;
}

@keyframes checkmark {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.avatar-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  border-color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-details {
  flex: 1;
  position: relative;
  z-index: 1;
}

.username-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.username {
  margin: 0;
  font-size: 36px;
  font-weight: 700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.25);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.email, .user-joined {
  margin: 0 0 16px;
  font-size: 14px;
  opacity: 0.95;
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-stats {
  display: flex;
  gap: 48px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
}

.products-icon {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
}

.favorites-icon {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  opacity: 0.9;
}

.stat-divider {
  width: 1px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
}

.profile-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
}

.profile-tabs {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%);
  padding: 0 8px;
}

.tab-item {
  padding: 18px 28px;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  font-weight: 500;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-item:hover {
  color: #e34d59;
  background: rgba(227, 77, 89, 0.05);
}

.tab-item.active {
  color: #e34d59;
  font-weight: 600;
  background: white;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20px;
  right: 20px;
  height: 3px;
  background: linear-gradient(90deg, #e34d59 0%, #f0656e 100%);
  border-radius: 3px 3px 0 0;
}

.tab-content {
  padding: 32px;
  min-height: 500px;
}

.security-card {
  margin-top: 24px;
  border-radius: 12px;
}

:deep(.t-card__header) {
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 24px;
}

:deep(.t-card__header h3) {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.security-item:last-child {
  border-bottom: none;
}

.security-item:hover {
  background: linear-gradient(to right, rgba(227, 77, 89, 0.02), transparent);
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 8px;
  margin: 0 -8px;
}

.security-info h4 {
  margin: 0 0 6px;
  color: #333;
  font-size: 15px;
  font-weight: 600;
}

.security-info p {
  margin: 0;
  color: #999;
  font-size: 13px;
}

.security-item :deep(.t-button) {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.security-item :deep(.t-button:hover) {
  background: rgba(227, 77, 89, 0.08);
  border-color: #e34d59;
  color: #e34d59;
}

.order-tabs {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.order-tab {
  font-size: 14px;
  color: #666;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
}

.order-tab:hover {
  background: #f8f9fa;
}

.order-tab.active {
  background: #e34d59;
  color: white;
}

.order-count {
  color: #fff;
  font-weight: 600;
}

.order-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.order-search-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.time-filter {
  width: 120px;
}

.order-search-input {
  width: 240px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  transition: transform 0.3s, box-shadow 0.3s;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.order-info-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auction-tag {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  color: #e34d59;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.order-id {
  color: #666;
  font-size: 13px;
}

.order-time {
  color: #999;
  font-size: 12px;
}

.order-items {
  margin-bottom: 16px;
}

.order-item {
  display: flex;
  gap: 16px;
}

.order-product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  background: #f5f5f5;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.order-product-image.no-image {
  color: #999;
}

.order-product-info {
  flex: 1;
}

.order-product-info h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.order-meta {
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-tag {
  background: #f5f5f5;
  color: #999;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 2px;
}

.order-price-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.order-price {
  margin: 0;
  color: #e34d59;
  font-weight: 600;
  font-size: 18px;
}

.order-quantity {
  margin: 0;
  color: #999;
  font-size: 13px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.order-total {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.total-label {
  color: #666;
  font-size: 13px;
}

.total-amount {
  color: #e34d59;
  font-weight: 600;
  font-size: 20px;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.order-status {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: #fff3e6;
  color: #ff6b00;
}

.status-paid {
  background: #e6f7ff;
  color: #1890ff;
}

.status-shipped {
  background: #f6ffed;
  color: #52c41a;
}

.status-completed {
  background: #f6ffed;
  color: #52c41a;
}

.status-cancelled {
  background: #f5f5f5;
  color: #999;
}

/* 订单详情对话框样式 */
.order-detail-content {
  padding: 8px 0;
}

.detail-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 16px;
  color: #333;
  font-size: 15px;
  font-weight: 600;
}

.detail-info,
.price-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-info p,
.price-info p {
  margin: 0;
  display: flex;
  align-items: center;
  color: #666;
  font-size: 13px;
}

.detail-info .label,
.price-info .label {
  width: 100px;
  color: #999;
}

.detail-info .status-pending,
.detail-info .status-paid,
.detail-info .status-shipped,
.detail-info .status-completed {
  padding: 2px 8px;
  border-radius: 2px;
  font-size: 12px;
}

.product-detail {
  display: flex;
  gap: 16px;
}

.product-detail-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  background: #f5f5f5;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-detail-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-detail-image.no-image {
  color: #999;
}

.product-detail-info {
  flex: 1;
}

.product-detail-info h5 {
  margin: 0 0 8px;
  color: #333;
  font-size: 14px;
}

.product-detail-info p {
  margin: 0 0 6px;
  color: #666;
  font-size: 13px;
}

.product-description {
  color: #999 !important;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-price {
  margin: 8px 0 0 !important;
  color: #e34d59;
  font-weight: 600;
  font-size: 18px;
}

.total-price {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e0e0e0;
}

.total-price .label,
.total-price span:last-child {
  font-weight: 600;
  font-size: 16px;
  color: #e34d59;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.seller-info p {
  margin: 0;
  color: #333;
  font-size: 14px;
}

.seller-label {
  color: #999;
  font-size: 12px;
}

.refund-info {
  margin-bottom: 20px;
}

.refund-form {
  margin-top: 20px;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.favorite-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  overflow: hidden;
}

.favorite-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.favorite-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 16px;
  transition: transform 0.3s ease;
}

.favorite-card:hover .favorite-image {
  transform: scale(1.05);
}

.favorite-title {
  margin: 0 0 12px;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.favorite-price {
  margin: 0 0 16px;
  color: #e34d59;
  font-weight: 700;
  font-size: 24px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.favorite-price::before {
  content: '¥';
  font-size: 16px;
  font-weight: 600;
}

.favorite-actions {
  display: flex;
  gap: 12px;
}

.favorite-actions :deep(.t-button) {
  flex: 1;
  border-radius: 8px;
  font-weight: 500;
}

.message-types {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  padding: 4px;
  background: #f8f9fa;
  border-radius: 12px;
  display: inline-flex;
}

.message-type {
  font-size: 14px;
  color: #666;
  cursor: pointer;
  padding: 10px 20px;
  border-radius: 8px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-type:hover {
  color: #e34d59;
  background: rgba(227, 77, 89, 0.08);
}

.message-type.active {
  background: white;
  color: #e34d59;
  box-shadow: 0 2px 8px rgba(227, 77, 89, 0.15);
  font-weight: 600;
}

.message-badge {
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 100%);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 4px solid #e34d59;
  border-radius: 8px;
}

.message-card:hover {
  transform: translateX(8px);
  box-shadow: 0 4px 16px rgba(227, 77, 89, 0.1);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.message-type-label {
  color: #e34d59;
  font-size: 13px;
  font-weight: 600;
  background: rgba(227, 77, 89, 0.08);
  padding: 4px 12px;
  border-radius: 4px;
}

.message-time {
  color: #999;
  font-size: 13px;
  font-weight: 500;
}

.message-content h4 {
  margin: 0 0 12px;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.message-content p {
  margin: 0 0 16px;
  color: #666;
  font-size: 14px;
  line-height: 1.7;
}

.message-footer {
  text-align: right;
}

.message-footer :deep(.t-button) {
  border-radius: 8px;
  font-weight: 500;
}

.address-actions {
  margin-bottom: 24px;
}

.address-actions :deep(.t-button) {
  border-radius: 8px;
  padding: 12px 32px;
  font-weight: 600;
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 100%);
  border: none;
  transition: all 0.3s ease;
}

.address-actions :deep(.t-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(227, 77, 89, 0.3);
}

.addresses-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.address-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.address-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.address-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #e34d59 0%, #f0656e 100%);
}

.address-info h4 {
  margin: 0 0 8px;
  color: #333;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.default-tag {
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 100%);
  color: white;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.address-info p {
  margin: 6px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.address-info p:first-of-type {
  color: #333;
  font-weight: 500;
}

.address-actions .address-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.address-actions :deep(.t-button.t-button--variant-text) {
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.address-actions :deep(.t-button.t-button--variant-text:hover) {
  background: #f8f9fa;
}

.loading-state,
.empty-state {
  padding: 80px 40px;
  text-align: center;
}

.loading-state :deep(.t-loading) {
  color: #e34d59;
}

.empty-state :deep(.t-empty) {
  --td-empty-text-color: #999;
  --td-empty-font-size: 14px;
}

.empty-state {
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-radius: 12px;
  border: 2px dashed #e0e0e0;
}

:deep(.t-card) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.t-card:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

:deep(.t-card__body) {
  padding: 24px;
}

:deep(.t-form__label) {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

:deep(.t-input),
:deep(.t-textarea) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.t-input:hover),
:deep(.t-textarea:hover) {
  border-color: #e34d59;
}

:deep(.t-input.is-focused),
:deep(.t-textarea.is-focused) {
  border-color: #e34d59;
  box-shadow: 0 0 0 3px rgba(227, 77, 89, 0.1);
}

:deep(.t-button--theme-primary) {
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 100%);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

:deep(.t-button--theme-primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(227, 77, 89, 0.3);
}

/* 密码修改相关样式 */
.password-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  line-height: 1.5;
}

.password-security-tip {
  margin-top: 16px;
}

:deep(.password-security-tip .t-alert__message) {
  font-size: 13px;
  line-height: 1.6;
}

/* 绑定手机号相关样式 */
.phone-security-tip {
  margin-top: 16px;
}

:deep(.phone-security-tip .t-alert__message) {
  font-size: 13px;
  line-height: 1.6;
}

/* 地址管理相关样式 */
.address-dialog :deep(.t-dialog__body) {
  padding: 24px !important;
}

.address-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  width: 100%;
}

.form-item-full {
  width: 100%;
}

:deep(.form-item-full .t-form__item) {
  width: 100%;
  margin-bottom: 0;
}

.region-form-item {
  margin-bottom: 20px;
}

.region-selects {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
}

.region-select-wrapper {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

:deep(.region-select-wrapper .t-select) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  overflow: hidden !important;
}

:deep(.region-select .t-input__wrap) {
  width: 100% !important;
  max-width: 100% !important;
}

:deep(.region-select .t-input) {
  width: 100% !important;
  max-width: 100% !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  box-sizing: border-box !important;
}

:deep(.region-select .t-select__value) {
  max-width: 100% !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

:deep(.region-select .t-select__single) {
  width: 100% !important;
  max-width: 100% !important;
  overflow: hidden !important;
}

:deep(.region-select-wrapper .t-select__popup) {
  max-height: 240px;
  overflow-y: auto;
}

:deep(.region-select-wrapper .t-select__popup .t-option) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.detail-form-item {
  margin-bottom: 20px;
}

.detail-textarea {
  border-radius: 8px;
}

:deep(.detail-textarea:focus) {
  box-shadow: 0 0 0 3px rgba(227, 77, 89, 0.1);
}

.address-char-count {
  font-size: 12px;
  color: #999;
  text-align: right;
  margin-top: 4px;
  font-weight: 500;
}

.default-form-item {
  margin-bottom: 0;
}

:deep(.default-checkbox .t-checkbox__label) {
  margin-left: 0;
}

.checkbox-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

/* 地址卡片优化样式 */
.address-card {
  border: 1px solid #e8e8e8;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.address-card:hover {
  border-color: #e34d59;
  box-shadow: 0 4px 16px rgba(227, 77, 89, 0.12);
  transform: translateY(-2px);
}

.address-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px;
}

.address-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.receiver-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.receiver-icon {
  color: #e34d59;
  background: linear-gradient(135deg, rgba(227, 77, 89, 0.1), rgba(227, 77, 89, 0.05));
  padding: 6px;
  border-radius: 8px;
}

.receiver-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.default-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(227, 77, 89, 0.2);
}

.address-phone {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #f8f9fa, #f0f2f5);
  border-radius: 8px;
  margin: 0;
}

.phone-icon {
  color: #666;
  background: white;
  padding: 8px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.address-phone span {
  color: #333;
  font-size: 15px;
  font-weight: 500;
}

.address-location {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(227, 77, 89, 0.03), rgba(227, 77, 89, 0.01));
  border-radius: 8px;
  border: 1px solid rgba(227, 77, 89, 0.08);
}

.location-icon {
  color: #e34d59;
  background: white;
  padding: 8px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(227, 77, 89, 0.15);
  flex-shrink: 0;
  margin-top: 2px;
}

.location-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.region-text {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.detail-text {
  color: #333;
  font-size: 15px;
  line-height: 1.6;
  font-weight: 500;
}

.address-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.set-default-btn {
  border-color: #e34d59 !important;
  color: #e34d59 !important;
  background: white !important;
}

.set-default-btn:hover {
  background: #e34d59 !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(227, 77, 89, 0.25);
}

.edit-btn {
  border-color: #999 !important;
  color: #666 !important;
  background: white !important;
}

.edit-btn:hover {
  border-color: #666 !important;
  background: #f8f9fa !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.delete-btn {
  border-color: #ff4d4f !important;
  color: #ff4d4f !important;
  background: white !important;
}

.delete-btn:hover {
  background: #ff4d4f !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.25);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-container {
    padding: 16px 12px;
  }

  .user-info-card {
    flex-direction: column;
    gap: 24px;
    padding: 32px 24px;
  }

  .username {
    font-size: 28px;
  }

  .user-stats {
    gap: 32px;
    width: 100%;
    justify-content: space-around;
  }

  .stat-number {
    font-size: 28px;
  }

  .profile-tabs {
    overflow-x: auto;
    padding: 0 4px;
  }

  .tab-item {
    padding: 14px 20px;
    font-size: 14px;
    white-space: nowrap;
  }

  .tab-content {
    padding: 24px 16px;
  }

  .favorites-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .favorite-image {
    height: 160px;
  }

  .addresses-list {
    grid-template-columns: 1fr;
  }

  .message-types {
    flex-wrap: nowrap;
    overflow-x: auto;
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .favorites-grid {
    grid-template-columns: 1fr;
  }

  .favorite-image {
    height: 200px;
  }

  .user-info-card {
    padding: 24px 16px;
  }

  .avatar-btn {
    font-size: 12px;
    padding: 6px 12px;
  }

  .tab-item {
    padding: 12px 16px;
  }

  .tab-content {
    padding: 20px 12px;
  }

  .stat-item {
    flex-direction: column;
    gap: 8px;
  }

  .stat-divider {
    display: none;
  }
}
</style>
