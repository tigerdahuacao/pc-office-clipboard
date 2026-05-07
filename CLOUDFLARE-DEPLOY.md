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
- Recommended: run build/deploy in Ubuntu or use Cloudflare Pages Git deployment.

中文：
- 如果你在原生 Windows 下执行 `pnpm exec @cloudflare/next-on-pages` 报错，这是现实中常见问题。
- 推荐方案：在 Ubuntu 构建部署，或改用 Cloudflare Pages 的 Git 自动部署。

## 1. Prerequisites / 前置准备

EN: Make sure you have Node.js 18+ and pnpm installed.
中文：确保已安装 Node.js 18+ 与 pnpm。

Install project dependencies:

```bash
pnpm install
```

Login to Cloudflare (no global wrangler required):

```bash
pnpm dlx wrangler@latest login
```

## 2. Create D1 Database / 创建 D1 数据库

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

## 3. Initialize D1 Schema / 初始化数据库结构

EN (macOS/Linux):

```bash
pnpm dlx wrangler@latest d1 execute clipboard-db --remote --file=./scripts/d1-init.sql
```

中文（Windows PowerShell）：

```powershell
pnpm dlx wrangler@latest d1 execute clipboard-db --remote --file=.\scripts\d1-init.sql
```

Verify tables and current password:

```bash
pnpm dlx wrangler@latest d1 execute clipboard-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
pnpm dlx wrangler@latest d1 execute clipboard-db --remote --command "SELECT value FROM settings WHERE key='password';"
```

## 4. Cloudflare Build Scripts / 构建脚本

EN: Add/confirm scripts in `package.json`.
中文：在 `package.json` 中添加或确认以下脚本。

```json
{
  "scripts": {
    "pages:build": "pnpm exec @cloudflare/next-on-pages",
    "pages:deploy": "pnpm run pages:deploy:prod",
    "pages:deploy:prod": "pnpm exec wrangler pages deploy .vercel/output/static --project-name=clipboard --branch=main",
    "pages:deploy:preview": "pnpm exec wrangler pages deploy .vercel/output/static --project-name=clipboard --branch=dev",
    "pages:dev": "pnpm exec wrangler pages dev .vercel/output/static --compatibility-date=2026-04-01 --compatibility-flag=nodejs_compat"
  }
}
```

## 5. Build and Deploy / 构建与部署

```bash
pnpm run pages:build
pnpm run pages:deploy
```

EN: If project is not linked, keep `--project-name=clipboard` in deploy command.
中文：若项目未自动关联，请保留 `--project-name=clipboard` 参数。

Preview deploy / 预览分支部署：

```bash
pnpm run pages:build
pnpm run pages:deploy:preview
```

EN: `pages:deploy` now explicitly deploys to `main` via `pages:deploy:prod`.
中文：`pages:deploy` 现在会通过 `pages:deploy:prod` 显式部署到 `main`。

Windows fallback / Windows 兜底方案：

1. Use Ubuntu and run the same commands there.
2. Or push code to Git and let Cloudflare Pages build on Linux.

## 6. Configure D1 Binding / 配置 D1 绑定

1. Cloudflare Dashboard -> Workers & Pages -> Your Project -> Settings -> Functions
2. Add D1 binding:
   - Variable name: `DB`
   - D1 database: `clipboard-db`

## 7. Change Password / 修改登录密码

EN (macOS/Linux):

```bash
pnpm dlx wrangler@latest d1 execute clipboard-db --remote --command "UPDATE settings SET value='your-new-password' WHERE key='password';"
```

中文（Windows PowerShell）：

```powershell
pnpm dlx wrangler@latest d1 execute clipboard-db --remote --command "UPDATE settings SET value='your-new-password' WHERE key='password';"
```

## 8. Debug 500 Errors / 排查 500 错误

Tail real-time logs:

```bash
pnpm exec wrangler pages deployment tail --project-name=clipboard --format pretty
```

Then trigger requests:

- `https://clipboard-bly.pages.dev/api/auth` (GET health check)
- Login from UI (POST)

Dashboard logs path:

1. Cloudflare Dashboard -> Workers & Pages
2. Open your Pages project -> deployment
3. View details -> Functions

EN: Logs are real-time and not stored long-term.
中文：日志是实时流式查看，不会长期保存。

## 9. Windows Notes / Windows 注意事项

EN:
- Prefer PowerShell over CMD.
- Use `pnpm dlx wrangler@latest ...` if `wrangler` command is not found.
- Use path `.\scripts\d1-init.sql` in PowerShell.
- Native Windows may fail on `pnpm exec @cloudflare/next-on-pages`; prefer  Ubuntu.

中文：
- 建议优先使用 PowerShell，不要用 CMD。
- 如果找不到 `wrangler`，使用 `pnpm dlx wrangler@latest ...`。
- SQL 文件路径建议用 `.\scripts\d1-init.sql`。
- 原生 Windows 运行 `pnpm exec @cloudflare/next-on-pages` 可能失败，建议改用 Ubuntu。

## 10. Default Credentials / 默认密码

- Password / 密码: `clipboard123` (please change it after deployment / 部署后请立即修改)

## 11. Features / 功能

- Single password authentication / 单密码登录
- Multiple topics/categories / 多主题分类
- Ctrl+S quick save / Ctrl+S 快速保存
- Dark/Light mode / 深浅色模式
- Last saved timestamp / 最后保存时间
- Responsive design / 响应式布局
- Data stored in Cloudflare D1 / 数据存储于 Cloudflare D1
