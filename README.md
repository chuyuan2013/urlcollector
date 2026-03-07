# 个人网址收藏网站

一个基于Cloudflare免费服务的个人网址收藏网站，支持用户注册登录、网址管理和分类功能。

## 功能特性

- **用户认证**：注册、登录、退出功能
- **网址管理**：添加、编辑、删除、分类网址
- **响应式设计**：适配桌面和移动设备
- **数据持久化**：使用Cloudflare KV存储数据
- **安全保障**：密码加密存储，JWT身份验证

## 技术栈

- **前端**：纯JavaScript + CSS
- **后端**：Cloudflare Workers
- **数据存储**：Cloudflare KV
- **部署**：Cloudflare Pages

## 项目结构

```
├── functions/
│   └── api.js          # Cloudflare Workers API
├── src/
│   ├── css/
│   │   └── style.css   # CSS样式
│   └── js/
│       └── app.js      # 前端JavaScript
├── index.html          # 主HTML文件
├── package.json        # 项目配置
├── README.md           # 项目说明
└── wrangler.toml       # Cloudflare Workers配置
```

## 部署步骤

### 1. 准备工作

1. 注册Cloudflare账号（免费）
2. 安装Node.js和npm
3. 安装Wrangler CLI：
   ```bash
   npm install -g wrangler
   ```

### 2. 配置Cloudflare KV命名空间

1. 登录Cloudflare控制台
2. 进入Workers & Pages > KV
3. 创建两个KV命名空间：
   - 名称：USERS（用于存储用户信息）
   - 名称：URLS（用于存储网址数据）
4. 复制两个命名空间的ID
5. 更新`wrangler.toml`文件中的`id`和`preview_id`字段

### 3. 配置JWT密钥

1. 在`wrangler.toml`文件中设置`JWT_SECRET`为一个安全的随机字符串

### 4. 部署到Cloudflare Pages

1. 初始化Git仓库：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. 登录Wrangler：
   ```bash
   wrangler login
   ```

3. 部署到Cloudflare Pages：
   ```bash
   wrangler pages deploy .
   ```

4. 在Cloudflare控制台中配置Pages项目：
   - 进入Workers & Pages > Pages
   - 选择部署的项目
   - 进入Settings > Functions
   - 确保KV命名空间绑定正确

### 5. 测试访问

部署完成后，Cloudflare会提供一个域名，通过该域名访问网站。

## 使用说明

### 注册账号

1. 点击"注册"按钮
2. 填写用户名、邮箱和密码
3. 点击"注册"按钮完成注册

### 登录账号

1. 点击"登录"按钮
2. 输入邮箱和密码
3. 点击"登录"按钮完成登录

### 管理网址

1. **添加网址**：点击"添加网址"按钮，填写网址信息并保存
2. **编辑网址**：点击网址卡片上的"编辑"按钮，修改信息并保存
3. **删除网址**：点击网址卡片上的"删除"按钮，确认删除
4. **筛选网址**：使用搜索框和分类下拉菜单筛选网址

### 退出登录

点击右上角的"退出"按钮

## 安全说明

- 密码使用SHA-256加密存储
- 使用JWT进行身份验证
- 实现了基本的CORS保护
- 所有API请求都需要身份验证

## 注意事项

- 本项目完全使用Cloudflare的免费服务，无需支付任何费用
- Cloudflare KV免费额度为100,000次读取/天，10,000次写入/天
- 适合个人使用，不建议用于高流量场景

## 许可证

MIT