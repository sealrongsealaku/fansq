# 本地数据库说明

当前项目开发环境默认使用 `MySQL 8.0`。

## 本地初始化步骤

1. 安装并启动 MySQL
2. 创建数据库连接账号，例如 `root`
3. 在项目根目录创建 `.env.local`
4. 配置以下关键变量：

```env
DATABASE_URL=mysql://root:password@127.0.0.1:3306/fansq
JWT_SECRET=your_jwt_secret
ADMIN_INIT_USERNAME=admin
ADMIN_INIT_PASSWORD_HASH=替换为 bcrypt 哈希
INTERNAL_API_TOKEN=your_internal_token
VITE_API_BASE_URL=http://localhost:3000/api
```

5. 生成 Prisma Client：

```bash
npm run prisma:generate -w @fansq/api-server
```

6. 将 Prisma 模型推到数据库：

```bash
npm run prisma:db:push -w @fansq/api-server
```

7. 启动后端后，系统会尝试按环境变量自动初始化管理员账号。

## 密码哈希生成

```bash
npm run admin:hash -- 你的密码
```

把输出结果填入 `ADMIN_INIT_PASSWORD_HASH` 即可。

