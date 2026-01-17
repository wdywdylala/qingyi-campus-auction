# 大学生二手商品交易平台 PRD（产品需求文档）

## 1. 项目概述
- **项目名称**：青易校园（QingYi Campus）
- **定位**：面向大学生的多用户校园二手商品交易平台，支持独立用户数据，覆盖数码产品、书籍教材、衣鞋帽伞、代步工具、课外娱乐、日常用品、虚拟产品、手工设计、其他等品类。
- **目标用户**：在校大学生、教职工及校内周边居民。
- **核心功能**：首页推荐、交易大厅、竞价拍卖、我要出售、实名/邮箱注册登录、商品分类与筛选、保证金机制、支付与退款保障。

## 2. 功能需求

### 2.1 用户体系
- **注册**
  - 支持电子邮箱注册（示例：`sample.user@email.com`）。
  - 用户名自定义（示例：`andrew123`）。
  - 密码输入支持掩码显示，带“眼睛”图标切换可见性。
  - 必须勾选“我接受”用户协议方可注册。
- **登录**
  - 登录后可进入主界面，系统维护独立用户数据（商品、订单、出价记录、消息等）。
- **用户信息**
  - 每个用户拥有个人中心，可查看我的出售、我的竞拍、我的订单、消息通知。

### 2.2 主界面布局（参考图片 1/2/3）
- **顶部导航条（红底白字或红白配色）**
  - 左：平台 Logo + 名称「青易校园」
  - 中：主导航项
    - 首页推荐
    - 交易大厅
    - 竞价拍卖
  - 右：「我要出售」按钮（点击进入发布商品页）
  - 搜索栏位于导航条右侧或Logo旁，支持热门搜索词（如 iPhone 14、HUAWEI Mate50 Pro、vivo X Fold+）。

- **分类筛选区**
  - 全部分类：数码产品、书籍教材、衣鞋帽伞、代步工具、课外娱乐、日常用品、虚拟产品、手工设计、其他。
  - 价格区间筛选：不限、100元以下、100-200元、200-300元…1000元以上。
  - 状态筛选：全部在拍、未出价、已出价、即将开拍、已成交、流拍商品、正在竞买。
  - 时间筛选：今天结束、明天结束、后天结束、其他结束。

- **主体商品展示区**
  - 列表形式，每项含：
    - 商品图片
    - 商品标题
    - 当前价
    - 剩余时间（距结束：X天X小时X分X秒）
    - 出价次数
    - “去看看/竞拍”按钮
  - 拍卖商品需显示卖家信息（如 admin）、拍卖状态（正在进行、已成交等）。
  - 支持分页（如 1/105335 下一页）。

- **右侧功能区（参考图 2）**
  - 平台快讯：最新公告与帮助文章（如发货凭证上传、退货退款流程）。
  - 客服热线 & 工作时间。
  - 六重保障介绍：
    1. 把控货源（严控品质）
    2. 包退包换（7天退，15天换）
    3. 支持退款
    4. 物流赔付
    5. 支付安全
    6. 服务保障
  - 答疑板块（可展开常见问题）。

- **底部信息栏**
  - 平台介绍、联系我们、关于我们、注册帮助、充值帮助、购买流程、拍卖流程等链接及图标。

### 2.3 「我要出售」功能
- 登录后点击顶部导航「我要出售」进入发布页。
- 必填信息：
  - 商品标题
  - 商品分类
  - 价格（一口价或起拍价）
  - 商品描述（支持图文）
  - 商品图片（多图上传）
  - 所在地（省/市/学校）
- 可选设置：
  - 拍卖模式（设定结束时间、保证金）
  - 虚拟产品需注明兑换方式或账号信息
- 发布后进入审核或直接上架（依据平台规则）。

### 2.4 交易与拍卖流程
- **竞价拍卖**
  - 拍卖结束时间精确到秒。
  - 需缴纳保证金才可出价（参考图 3 拍卖规则说明）。
  - 支持预展期、取消拍卖资格、委托拍卖等功能入口。
- **普通交易（交易大厅）**
  - 直接购买或议价。
  - 支持浏览量显示、收藏、分享。
- **支付与售后**
  - 集成安全支付接口。
  - 质量问题 7 天退货、15 天换货。
  - 物流损坏由平台赔付运费。
  - 可申请退款。

### 2.5 其他页面
- **拍卖规则说明页**（参考图 3 左侧）：
  - 拍卖结束时间说明
  - 担保金定义与缴纳方法
  - 拍卖预展解释
  - 注销拍卖资格流程
- **新春活动 Banner**（参考图 3 中间红色横幅）：
  - 节假日营销视觉区，可动态更换活动内容。
- **用户登录区**（参考图 3 右侧）：
  - 登录/注册入口
  - 平台优势文案（专业品质、品类丰富等）。

## 3. 技术栈
- **前端框架**：Vue 3 + Vite
- **UI组件库**：TDesign (腾讯企业级设计系统)
- **状态管理**：Pinia
- **路由**：Vue Router
- **后端服务**：Supabase
- **数据库**：PostgreSQL (Supabase内置)
- **身份认证**：Supabase Auth (邮箱注册/登录)
- **文件存储**：Supabase Storage (商品图片)
- **实时功能**：Supabase Realtime (竞价拍卖实时更新)

### 3.1 数据库表结构设计
```sql
-- 用户资料表
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 商品表
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'active',
  images TEXT[],
  is_auction BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 拍卖表
CREATE TABLE auctions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  start_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'ongoing'
);

-- 出价记录表
CREATE TABLE bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID REFERENCES auctions(id),
  bidder_id UUID REFERENCES profiles(id),
  bid_amount DECIMAL(10,2) NOT NULL,
  bid_time TIMESTAMPTZ DEFAULT NOW()
);

-- 订单表
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  buyer_id UUID REFERENCES profiles(id),
  seller_id UUID REFERENCES profiles(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. 非功能性需求
- **性能**：页面加载 ≤ 2s，搜索响应 ≤ 1s。
- **安全**：用户数据隔离（使用Supabase RLS）、支付加密、防止恶意刷单。
- **兼容性**：支持 PC 端浏览器及主流移动端浏览器。
- **可扩展性**：方便新增商品分类、活动模块、第三方登录。

## 4. 参考设计
- 主色调：红 + 白（突出校园活力与信任感）。
- 风格：简洁明了，信息层级清晰，重点突出拍卖倒计时与价格。
- 参考图片：用户提供的 1~4 图（一飞网 UI 布局、分类筛选、拍卖规则、注册页）。

## 5. 后续迭代规划
- V1.0：基础交易+拍卖+注册登录+分类筛选
- V1.1：消息系统、评价系统
- V1.2：第三方社交登录、智能推荐