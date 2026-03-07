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
├── README.md           # 项目说明
└── wrangler.toml       # Cloudflare Workers配置
```

## 部署步骤（无需本地安装软件）

### 1. 准备工作

1. 注册Cloudflare账号（免费）
2. 在GitHub上创建一个新仓库，将本项目代码上传

### 2. 配置Cloudflare KV命名空间

1. 登录Cloudflare控制台
2. 进入Workers & Pages > KV
3. 创建两个KV命名空间：
   - 名称：USERS（用于存储用户信息）
   - 名称：URLS（用于存储网址数据）
4. 复制两个命名空间的ID，稍后会用到

### 3. 部署到Cloudflare Pages

1. 登录Cloudflare控制台
2. 进入Workers & Pages > Pages
3. 点击"Create a project" > "Connect to Git"
4. 选择您的GitHub仓库
5. 配置部署设置：
   - 框架预设：选择"None"
   - 构建命令：留空
   - 构建输出目录：留空
6. 点击"Save and Deploy"

### 4. 配置KV命名空间绑定

1. 部署完成后，进入Pages项目的设置页面
2. 点击"Functions" > "KV namespace bindings"
3. 添加两个绑定：
   - 变量名：USERS，选择您创建的USERS命名空间
   - 变量名：URLS，选择您创建的URLS命名空间
4. 点击"Save"

### 5. 配置环境变量

1. 在Pages项目设置页面，点击"Environment variables"
2. 添加以下环境变量：
   - 变量名：JWT_SECRET，值：设置一个安全的随机字符串
3. 点击"Save"

### 6. 重新部署

1. 在Pages项目页面，点击"Deployments"
2. 点击"Deploy site"按钮，重新部署项目

### 7. 测试访问

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