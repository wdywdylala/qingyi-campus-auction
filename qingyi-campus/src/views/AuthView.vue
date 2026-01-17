<template>
  <div class="auth-container">
    <!-- 装饰背景元素 -->
    <div class="auth-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="auth-content">
      <div class="auth-header">
        <div class="logo-wrapper">
          <span class="logo-icon">🎓</span>
          <h1 class="logo">青易校园</h1>
        </div>
        <p class="welcome-text">
          {{ isLogin ? '欢迎回来，继续你的校园交易之旅' : '加入青易校园，开启你的校园交易之旅' }}
        </p>
      </div>

      <t-card class="auth-card" :bordered="false">
        <template #header>
          <div class="card-header">
            <h2>{{ isLogin ? '登录账号' : '创建账号' }}</h2>
            <p class="card-subtitle">{{ isLogin ? '已有账号，直接登录' : '填写信息，快速注册' }}</p>
          </div>
        </template>

        <t-form
          ref="formRef"
          :data="formData"
          :rules="rules"
          layout="vertical"
          @submit="handleSubmit"
        >
          <t-form-item label="用户名" name="username">
            <t-input
              v-model="formData.username"
              :placeholder="isLogin ? '请输入用户名或邮箱' : '请输入3-20位用户名'"
              size="large"
              clearable
            >
              <template #prefix-icon>
                <span class="input-icon">👤</span>
              </template>
            </t-input>
          </t-form-item>

          <t-form-item label="邮箱" name="email">
            <t-input
              v-model="formData.email"
              placeholder="请输入您的邮箱地址"
              size="large"
              clearable
            >
              <template #prefix-icon>
                <span class="input-icon">📧</span>
              </template>
            </t-input>
          </t-form-item>

          <t-form-item label="密码" name="password">
            <t-input
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入6-20位密码"
              size="large"
              clearable
            >
              <template #prefix-icon>
                <span class="input-icon">🔒</span>
              </template>
              <template #suffix-icon>
                <span
                  class="input-icon password-toggle"
                  @click="showPassword = !showPassword"
                >
                  {{ showPassword ? '👁️‍🗨️' : '👁️' }}
                </span>
              </template>
            </t-input>
          </t-form-item>

          <t-form-item name="agree">
            <t-checkbox v-model="formData.agree">
              我已阅读并同意
              <t-link href="#" theme="primary">用户协议</t-link>
              和
              <t-link href="#" theme="primary">隐私政策</t-link>
            </t-checkbox>
          </t-form-item>

          <t-form-item>
            <t-button
              theme="primary"
              type="submit"
              size="large"
              block
              :loading="loading"
              shape="round"
            >
              <template v-if="!loading">
                <span class="btn-icon">🚀</span>
                {{ isLogin ? '立即登录' : '立即注册' }}
              </template>
              <template v-else>
                {{ isLogin ? '登录中...' : '注册中...' }}
              </template>
            </t-button>
          </t-form-item>
        </t-form>

        <div class="toggle-auth">
          <span class="toggle-text">
            {{ isLogin ? '还没有账号？' : '已有账号？' }}
          </span>
          <t-link theme="primary" @click="toggleAuth" class="toggle-link">
            {{ isLogin ? '立即注册' : '立即登录' }}
          </t-link>
        </div>
      </t-card>

      <div class="auth-footer">
        <p>登录即表示您同意我们的服务条款和隐私政策</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const isLogin = ref(true)
const showPassword = ref(false)

const formData = reactive({
  username: '',
  email: '',
  password: '',
  agree: false
})

const rules = computed(() => {
  const baseRules: any = {
    username: [
      { required: true, message: '请输入用户名' },
      { min: 3, message: '用户名至少3个字符' }
    ],
    email: [
      { required: true, message: '请输入邮箱' },
      { email: true, message: '请输入有效的邮箱地址' }
    ],
    password: [
      { required: true, message: '请输入密码' },
      { min: 6, message: '密码至少6个字符' }
    ],
    agree: [
      {
        validator: () => formData.agree,
        message: '请同意用户协议'
      }
    ]
  }

  return baseRules
})

const toggleAuth = () => {
  isLogin.value = !isLogin.value
}

const handleSubmit = async () => {
  loading.value = true

  try {
    if (isLogin.value) {
      // 登录时优先使用用户名登录
      let loginEmail = formData.email

      if (formData.username) {
        // 如果填写了用户名，先通过用户名查询邮箱
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', formData.username)
          .maybeSingle()

        if (profileError || !profileData || !profileData.email) {
          MessagePlugin.error('用户名不存在')
          loading.value = false
          return
        }

        // 使用查询到的邮箱登录
        loginEmail = profileData.email
      }

      // 使用邮箱登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: formData.password
      })

      if (error) throw error

      MessagePlugin.success('登录成功')
      router.push('/')
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      })

      if (error) throw error

      if (data.user) {
        // 创建用户资料，同时存储邮箱和用户名
        await supabase.from('profiles').insert({
          id: data.user.id,
          username: formData.username,
          email: formData.email
        })
      }

      MessagePlugin.success({
        content: '注册成功！请查收验证邮件，验证后即可登录',
        duration: 5000
      })

      // 切换到登录界面，让用户登录
      isLogin.value = true

      // 清空表单
      formData.username = ''
      formData.email = ''
      formData.password = ''
      formData.agree = false
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  min-height: 100vh;
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 50%, #ff8a9b 100%);
  padding: 20px;
  overflow: hidden;
}

.auth-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: hidden;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s infinite ease-in-out;
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -50px;
  animation-delay: 5s;
}

.circle-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 20%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  33% {
    transform: translateY(-30px) rotate(120deg);
  }
  66% {
    transform: translateY(20px) rotate(240deg);
  }
}

.auth-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
  color: white;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.logo-icon {
  font-size: 48px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.auth-header .logo {
  font-size: 42px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 3px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.auth-header .welcome-text {
  font-size: 16px;
  margin: 0;
  opacity: 0.95;
  font-weight: 400;
  line-height: 1.6;
}

.auth-card {
  border-radius: 24px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.auth-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25);
}

.card-header {
  text-align: center;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-header h2 {
  color: #333;
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 600;
}

.card-subtitle {
  color: #999;
  margin: 0;
  font-size: 14px;
}

:deep(.t-card__header) {
  display: flex;
  justify-content: center;
  text-align: center;
}

:deep(.t-form__label) {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

:deep(.t-input) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.t-input__inner) {
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px;
}

:deep(.t-input:hover) {
  border-color: #e34d59;
}

:deep(.t-input.is-focused) {
  border-color: #e34d59;
  box-shadow: 0 0 0 3px rgba(227, 77, 89, 0.1);
}

:deep(.t-input__prefix),
:deep(.t-input__suffix) {
  color: #999;
  display: flex;
  align-items: center;
}

.input-icon {
  font-size: 18px;
  line-height: 1;
}

.password-toggle {
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s ease;
}

.password-toggle:hover {
  transform: scale(1.1);
}

:deep(.t-checkbox) {
  font-size: 14px;
}

:deep(.t-button--theme-primary) {
  background: linear-gradient(135deg, #e34d59 0%, #f0656e 100%);
  border: none;
  font-weight: 600;
  letter-spacing: 1px;
  height: 48px;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(227, 77, 89, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

:deep(.t-button--theme-primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(227, 77, 89, 0.4);
}

:deep(.t-button--theme-primary:active) {
  transform: translateY(0);
}

.btn-icon {
  font-size: 20px;
}

.toggle-auth {
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.toggle-text {
  color: #666;
  font-size: 14px;
}

.toggle-link {
  font-size: 14px;
  font-weight: 600;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.auth-footer p {
  margin: 0;
}

/* 移动设备 */
@media (max-width: 768px) {
  .auth-container {
    padding: 12px;
  }

  .auth-content {
    max-width: 100%;
  }

  .auth-header .logo {
    font-size: 32px;
  }

  .auth-header .welcome-text {
    font-size: 14px;
  }

  .circle-1 {
    width: 300px;
    height: 300px;
  }

  .circle-2 {
    width: 200px;
    height: 200px;
  }

  .circle-3 {
    width: 150px;
    height: 150px;
  }
}

/* 小屏手机 */
@media (max-width: 480px) {
  .auth-container {
    padding: 8px;
  }

  .auth-header {
    margin-bottom: 20px;
  }

  .logo-wrapper {
    gap: 8px;
  }

  .logo-icon {
    font-size: 40px;
  }

  .auth-header .logo {
    font-size: 28px;
    letter-spacing: 2px;
  }

  .auth-header .welcome-text {
    font-size: 13px;
  }

  .card-header h2 {
    font-size: 22px;
  }

  :deep(.t-input__inner) {
    padding: 10px 14px;
    font-size: 14px;
  }

  :deep(.t-button--theme-primary) {
    height: 44px;
    font-size: 15px;
  }
}
</style>
