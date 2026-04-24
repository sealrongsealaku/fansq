# FanSQ

FanSQ is a reflection wall system for collecting, reviewing, and showcasing teaching reflections through a public web portal, an admin dashboard, and an internal QQ bot bridge.

## What It Includes

- `apps/public-web`: public reflection wall built with Vue 3 + Vite
- `apps/admin-web`: admin review and management dashboard built with Vue 3 + Element Plus
- `apps/api-server`: NestJS + Prisma backend service
- `apps/qq-bot`: QQ bot bridge for internal submission flows
- `packages/*`: shared workspace packages

## Core Features

- Public reflection submission with title, content, category, and teaching project
- Reflection review workflow with approve, reject, visibility, featured, and top controls
- Public reflection wall with search, likes, reading panel, and mobile-friendly layout
- Reflection view tracking with backend-controlled display settings
- Duplicate public submission guard for short repeated submissions
- Clearer admin action error feedback for approve, reject, top, featured, and delete flows

## Tech Stack

- Frontend: Vue 3, Vite, Element Plus
- Backend: NestJS, Prisma
- Database: MySQL
- Runtime: Node.js 22+, npm 10+

## Monorepo Structure

```text
fansq/
  apps/
    admin-web/
    api-server/
    public-web/
    qq-bot/
  packages/
  database/
  deploy/
```

## Requirements

- Node.js `>= 22`
- npm `>= 10`
- MySQL

## Install

```bash
npm install
```

## Useful Scripts

At repo root:

```bash
npm run dev:admin
npm run dev:public
npm run dev:api
npm run dev:bot

npm run build
npm run check
npm run admin:hash -- "your-password"
```

Workspace-specific examples:

```bash
npm run prisma:generate -w @fansq/api-server
npm run prisma:db:push -w @fansq/api-server
npm run prisma:studio -w @fansq/api-server
```

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local environment files from the provided examples as needed.

3. Prepare MySQL and configure the backend database connection.

4. Generate Prisma client and sync schema:

   ```bash
   npm run prisma:generate -w @fansq/api-server
   npm run prisma:db:push -w @fansq/api-server
   ```

5. Start services in separate terminals:

   ```bash
   npm run dev:api
   npm run dev:public
   npm run dev:admin
   npm run dev:bot
   ```

## Production Notes

Typical deployment in this project uses:

- API service behind PM2
- Nginx to serve built frontend assets
- static public site and admin site from separate build outputs

Common deployment flow:

```bash
npm install
npm run build
pm2 restart fansq-api
```

Then copy:

- `apps/public-web/dist/*` to your public static directory
- `apps/admin-web/dist/*` to your admin static directory

## Recent Stability Improvements

- Added duplicate submission protection for public form posts
- Improved admin error handling for failed moderation and management actions
- Improved mobile usability for the admin review experience
- Added reflection titles and richer search coverage

## License

This repository currently does not declare an open-source license.
