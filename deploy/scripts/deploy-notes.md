# Deployment Notes

This project is deployed as a small multi-service application:

- public web on port `80`
- admin web on port `8089`
- API service on `127.0.0.1:3011`
- Nginx as the public entrypoint and reverse proxy

## Recommended Stable Layout

- Public reflection wall:
  - `http://YOUR_SERVER_IP_OR_DOMAIN/`
- Admin dashboard:
  - `http://YOUR_SERVER_IP_OR_DOMAIN:8089/`
- API:
  - proxied internally to `http://127.0.0.1:3011`

This layout avoids mixing public and admin routing in the same `server` block, which reduces cache and asset path conflicts.

## Expected Server Paths

- Project code:
  - `/opt/fansq`
- Public web build output:
  - `/var/www/fansq/public-web`
- Admin web build output:
  - `/var/www/fansq/admin-web`
- Nginx config:
  - `/etc/nginx/conf.d/fansq.conf`

## Build And Publish

From the project root on the server:

```bash
npm install
npm run build -w @fansq/public-web
npm run build -w @fansq/admin-web
npm run build -w @fansq/api-server
```

Publish static assets:

```bash
rm -rf /var/www/fansq/public-web/*
rm -rf /var/www/fansq/admin-web/*

cp -r /opt/fansq/apps/public-web/dist/* /var/www/fansq/public-web/
cp -r /opt/fansq/apps/admin-web/dist/* /var/www/fansq/admin-web/
```

Restart the API service:

```bash
pm2 restart fansq-api
pm2 status
```

## Nginx

Use `deploy/nginx/fansq.conf.stable` as the stable deployment template.

Typical apply flow:

```bash
cp /etc/nginx/conf.d/fansq.conf /etc/nginx/conf.d/fansq.conf.bak-$(date +%Y%m%d-%H%M%S)
cp /opt/fansq.conf.stable /etc/nginx/conf.d/fansq.conf
nginx -t
systemctl restart nginx
```

## Verification

```bash
curl -I http://127.0.0.1/
curl http://127.0.0.1/api/public/summary
curl "http://127.0.0.1/api/public/reflections?page=1&page_size=9"
curl -I http://127.0.0.1:8089/
curl -I http://127.0.0.1:8089/admin/
```

## Sensitive Values

Do not commit real production values for:

- server IP or domain
- database credentials
- admin credentials
- `.env` files

Use placeholders in committed config examples and keep real values only on the server.
