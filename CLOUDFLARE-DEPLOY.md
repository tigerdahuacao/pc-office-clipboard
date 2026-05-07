# Cloudflare Pages Deployment Guide (EN + 中文)

## 0. Why This Version / 为什么是这版命令

EN:
- This guide uses `pnpm` only.
- Commands are written to work in macOS/Linux and Windows PowerShell.
- Avoids global CLI dependency where possible.
- `@cloudflare/next-on-pages` may fail on native Windows in some environments.

中文：
- 本文档统一使用 `pnpm`。
- 命令同时考虑 macOS/Linux 与 Windows PowerShell。
- 尽量不依赖全局安装，减少 Windows 环境报错。
- `@cloudflare/next-on-pages` 在部分原生 Windows 环境会安装或执行失败。

## Important Reality Check / 重要说明（Windows）

EN:
- If `pnpm exec @cloudflare/next-on-pages` fails on native Windows, this is a known practical issue in some setups.
- Recommended: use Cloudflare Pages Git deployment for automatic builds.

中文：
- 如果你在原生 Windows 下执行 `pnpm exec @cloudflare/next-on-pages` 报错，这是现实中常见问题。
- 推荐方案：使用 Cloudflare Pages Git 自动部署。

## 1. Prerequisites / 前置准备

EN: Make sure you have Node.js 18+ and pnpm installed.
中文：确保已安装 Node.js 18+ 与 pnpm。

Install project dependencies:

```bash
pnpm install
```

## 2. GitHub Deployment (Recommended) / GitHub 部署（推荐）

EN: Connect Cloudflare Pages to GitHub for automatic builds on push.
中文：连接 Cloudflare Pages 到 GitHub，push 代码时自动构建部署。

1. Cloudflare Dashboard -> Pages -> Create a project -> Import GitHub project
2. Configure:
   - Build command: `pnpm exec @cloudflare/next-on-pages`
   - Build output directory: `.vercel/output/static`
3. Push code to main branch, deployment happens automatically

## 3. Create D1 Database / 创建 D1 数据库

```bash
pnpm dlx wrangler@latest d1 create clipboard-db
```

EN: Copy `database_id` from output, then update `wrangler.toml`.
中文：从输出中复制 `database_id`，并更新 `wrangler.toml`。

```toml
[[d1_databases]]
binding = "DB"
database_name = "clipboard-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

## 4. Initialize D1 Schema / 初始化数据库结构

EN (macOS/Linux):

```bash
pnpm dlx wrangler@latest d1 execute clipboard-db --remote --file=./scripts/d1-init.sql
```

中文（Windows PowerShell）：

```powershell
pnpm dlx wrangler@latest d1 execute clipboard-db --remote --file=.\scripts\d1-init.sql
```

Verify tables:

```bash
pnpm dlx wrangler@latest d1 execute clipboard-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

## 5. User Management / 用户管理

EN: Users are managed via direct SQL commands. No admin UI.
中文：用户通过直接执行 SQL 命令管理，无管理界面。

### Create User / 创建用户

```bash
# macOS/Linux
pnpm dlx wrangler@latest d1 execute clipboard-db --remote --command "INSERT INTO users (username, password_hash) VALUES ('your-username', 'your-password');"

# Windows PowerShell
pnpm dlx wrangler@latest d1 execute clipboard-db --remote --command "INSERT INTO users (username, password_hash) VALUES ('your-username', 'your-password');"
```

### Create Default Topic for User / 为用户创建默认 topic

```bash
pnpm dlx wrangler@latest d1 execute clipboard-db --remote --command "INSERT INTO topics (user_id, name, content) VALUES (1, 'Default', 'Welcome!');"
```

Note: `user_id` starts from 1 (first user = 1, second = 2, etc.)

### List All Users / 查看所有用户

```bash
pnpm dlx wrangler@latest d1 execute clipboard-db --remote --command "SELECT * FROM users;"
```

### Delete User / 删除用户

```bash
pnpm dlx wrangler@latest d1 execute clipboard-db --remote --command "DELETE FROM users WHERE username='your-username';"
```

## 6. Local Build and Deploy / 本地构建部署

EN: If you need to build locally (use Linux or GitHub Actions).
中文：如果需要本地构建（建议使用 Linux 或 GitHub Actions）。

```bash
pnpm run pages:build
pnpm run pages:deploy
```

## 7. Debug 500 Errors / 排查 500 错误

Tail real-time logs:

```bash
pnpm exec wrangler pages deployment tail --project-name=clipboard --format pretty
```

Then trigger requests:

- `https://pc-office-clipboard.pages.dev/api/auth` (GET health check)
- Login from UI (POST)

## 8. Windows Notes / Windows 注意事项

EN:
- Prefer PowerShell over CMD.
- Use `pnpm dlx wrangler@latest ...` if `wrangler` command is not found.
- Use path `.\scripts\d1-init.sql` in PowerShell.

中文：
- 建议优先使用 PowerShell，不要用 CMD。
- 如果找不到 `wrangler`，使用 `pnpm dlx wrangler@latest ...`。
- SQL 文件路径建议用 `.\scripts\d1-init.sql`。

## 9. Database Schema / 数据库结构

### Users Table / 用户表
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Topics Table / Topic 表
```sql
CREATE TABLE topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    content TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Sessions Table / 会话表
```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 10. Features / 功能

- Multi-user support with username/password authentication / 多用户支持，用户名密码登录
- Session-based auth with HTTP-only cookies / 基于会话的认证，HTTP-only cookies
- User data isolation (each user sees only their own topics) / 用户数据隔离（每个用户只能看到自己的 topic）
- Multiple topics/categories / 多主题分类
- Ctrl+S quick save / Ctrl+S 快速保存
- Dark/Light mode / 深浅色模式
- Last saved timestamp / 最后保存时间
- Responsive design / 响应式布局
- Data stored in Cloudflare D1 / 数据存储于 Cloudflare D1