# FanSQ

互联网支教教学反思墙系统项目骨架。

当前仓库包含：

- `apps/admin-web` 管理后台前端
- `apps/public-web` 前台反思墙前端
- `apps/api-server` 后端业务服务
- `apps/qq-bot` QQ 机器人接入服务
- `packages/shared-types` 共享类型
- `packages/shared-utils` 共享工具

## 本地启动

1. 安装依赖：`npm install`
2. 生成管理员密码哈希：`npm run admin:hash -- 你的密码`
3. 按 `.env.example` 创建本地 `.env.local`
4. 准备 MySQL，并按 [database/schema/README.md](/D:/FanSQ/database/schema/README.md) 初始化数据库
5. 启动后台前端：`npm run dev:admin`
6. 启动前台前端：`npm run dev:public`
7. 启动后端：`npm run dev:api`
8. 启动机器人：`npm run dev:bot`

## 当前后端已实现

1. `GET /api/health`
2. `POST /api/admin/login`
3. `GET /api/admin/me`
4. `POST /api/admin/logout`
5. `POST /api/internal/reflections/qq-submit`
6. `GET /api/admin/reflections`
7. `GET /api/admin/reflections/:id`
8. `GET /api/public/reflections`
9. `GET /api/public/summary`
10. `POST /api/public/reflections/:id/like`
11. `GET /api/public/reflections/:id/like-status`
