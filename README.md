# 🐾 萌宠之家 - 宠物管理系统

一个温馨可爱的宠物管理 Web 应用，支持宠物信息管理、相册、点赞排行榜等功能。

## ✨ 特性

- 🏠 **宠物管理** - 添加、编辑、删除宠物信息
- 📸 **宠物相册** - 上传和管理宠物照片，瀑布流展示
- ❤️ **点赞排行榜** - 展示最受欢迎的萌宠
- 📅 **健康提醒** - 记录疫苗、驱虫等健康事件
- ⚖️ **体重追踪** - 记录宠物体重变化
- 🌙 **主题切换** - 支持明暗主题
- 📱 **响应式设计** - 完美支持移动端

## 🛠️ 技术栈

- **前端框架:** Vue 3 + Composition API
- **UI 组件库:** Naive UI
- **状态管理:** Pinia
- **图片上传:** Cloudinary
- **构建工具:** Vite

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 生产构建

```bash
npm run build
```

## 📁 项目结构

```
src/
├── api.js                 # API 请求封装
├── main.js               # 应用入口
├── App.vue               # 根组件
├── styles/               # 全局样式
│   ├── global.css
│   └── pet-theme.js
├── stores/               # Pinia 状态管理
│   ├── authStore.js
│   ├── dictionaryStore.js
│   └── petStore.js
├── composables/          # 组合式函数
│   ├── useCloudinaryImage.js
│   └── useCloudinaryUpload.js
├── views/                # 页面组件
│   ├── PetManagement.vue
│   ├── PetAlbum.vue
│   └── AdminPage.vue
└── components/           # 公共组件
    ├── AuthModal.vue
    ├── PetDetailModal.vue
    ├── PetFormModal.vue
    ├── PetLeaderboard.vue
    └── ...
```

## 🎨 UI 设计

- **主色调:** 柔和粉 (#FF9BA8)
- **辅助色:** 薄荷绿 (#86EFAC)、天空蓝 (#7DD3FC)
- **背景:** 奶油白 (#FFF9F5)
- **风格:** 温馨可爱、圆角卡片、渐变按钮

## 🔗 后端 API

后端服务地址: `http://localhost:8080`

详细 API 文档请参考后端项目 [README.md](../IdeaProjects/pets/README.md)

## 📱 移动端适配

- 响应式布局，完美适配手机、平板
- 移动端优化菜单和交互
- 触摸友好的按钮和表单

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
