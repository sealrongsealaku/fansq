# 部署说明草稿

1. 在本机完成开发与联调。
2. 执行 `npm run build` 生成前端静态资源和服务端编译结果。
3. 将仓库上传到 Ubuntu 服务器，例如 `/opt/fansq`。
4. 安装 Node.js、npm、MySQL、Nginx。
5. 配置生产环境 `.env`。
6. 将 `deploy/nginx/fansq.conf.example` 调整后放到 Nginx 配置目录。
7. 将 `deploy/systemd/*.service.example` 调整后放到 `/etc/systemd/system/`。
8. 执行 `systemctl daemon-reload` 并启用服务。
