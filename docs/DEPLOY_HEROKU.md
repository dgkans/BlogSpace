# Deploy BlogSpace (Heroku API + Vercel UI)

The API lives in `blog-backend/`. The React app is in `blog-frontend/`. This guide deploys the **backend to Heroku** (dyno stays awake on paid/Eco plans) and the **frontend to Vercel** (free static hosting). **MongoDB Atlas** and **Cloudinary** stay on their free tiers.

---

## Prerequisites

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed and logged in: `heroku login`
- GitHub repo pushed (Heroku can deploy from GitHub or from `git push heroku`)
- [MongoDB Atlas](https://www.mongodb.com/atlas) cluster + database user + `MONGODB_URI`
- [Cloudinary](https://cloudinary.com/) account if you use image uploads

### Atlas network access

Allow your API to connect from the internet: in Atlas → **Network Access** → add IP `0.0.0.0/0` (required for Heroku’s changing outbound IPs), or use Atlas **VPC peering** for production later.

---

## Part A — Heroku (Express API)

### 1. Create the app

From your **machine** (any directory):

```bash
heroku create your-blogspace-api
```

Pick a unique name instead of `your-blogspace-api`, or omit the name and Heroku assigns one.

### 2. Monorepo: use only `blog-backend/`

This repo’s root is not the Node app. Set the **monorepo buildpack** first, then Node:

```bash
heroku buildpacks:clear -a your-blogspace-api
heroku buildpacks:add -a your-blogspace-api https://github.com/lstoll/heroku-buildpack-monorepo
heroku buildpacks:add -a your-blogspace-api heroku/nodejs
heroku config:set -a your-blogspace-api APP_BASE=blog-backend
```

### 3. Config vars (required)

Set these in the dashboard (**Settings → Config Vars**) or CLI:

| Key | Example / notes |
|-----|------------------|
| `MONGODB_URI` | Atlas connection string (`mongodb+srv://...`) |
| `JWT_SECRET` | Long random string (do not use the dev default) |
| `CLIENT_URL` | Your **Vercel** site URL, e.g. `https://blogspace.vercel.app` (no trailing slash) |
| `NODE_ENV` | `production` |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |

Heroku sets **`PORT`** automatically; do not set it manually.

Optional:

| Key | Purpose |
|-----|---------|
| `REQUEST_BODY_LIMIT` | Default in code is `10mb` for large HTML posts |

### 4. Deploy code

**Option GitHub (easiest ongoing):**

1. Heroku Dashboard → your app → **Deploy** → Deployment method **GitHub** → connect repo.
2. Choose branch (e.g. `main` or `development`).
3. Enable **Automatic Deploys** if you want.
4. Click **Deploy Branch**.

**Option Git push:**

```bash
cd /path/to/Web-Backend-Blog-App
heroku git:remote -a your-blogspace-api
git push heroku main:main
```

Use your real default branch name if it is not `main`.

### 5. Smoke test

```bash
curl https://your-blogspace-api.herokuapp.com/api/health
```

Open the URL in a browser if you have a health route; adjust path if your API differs.

Your API base URL for the frontend will be:

`https://your-blogspace-api.herokuapp.com`

---

## Part B — Vercel (React frontend)

1. Import the same GitHub repo in [Vercel](https://vercel.com).
2. **Root Directory:** `blog-frontend`
3. **Build Command:** `npm run build` (default for CRA)
4. **Output Directory:** `build`
5. **Environment Variables:**
   - `REACT_APP_API_URL` = `https://your-blogspace-api.herokuapp.com` (no trailing slash)

Redeploy after changing env vars.

### CORS

After Vercel gives you a URL, set **`CLIENT_URL`** on Heroku to that exact origin (scheme + host, no path). Redeploy or restart the dyno if needed.

---

## Part C — Order of operations

1. Deploy **Heroku** with `CLIENT_URL` temporarily set to `http://localhost:3000` **or** skip until Vercel exists, then update `CLIENT_URL` and restart dyno.
2. Deploy **Vercel** with `REACT_APP_API_URL` pointing at Heroku.
3. Update **`CLIENT_URL`** on Heroku to the final Vercel URL.

---

## Troubleshooting

- **H10 / app crashed:** Check `heroku logs --tail -a your-blogspace-api`. Common causes: missing `MONGODB_URI`, bad Atlas IP allowlist, or `JWT_SECRET` unset.
- **`querySrv EBADNAME` / MongoDB SRV errors:** The `MONGODB_URI` value is invalid for DNS (wrong host, truncated cluster name, stray characters, or a trailing newline). In Heroku → **Settings → Config Vars**, delete `MONGODB_URI` and paste again from Atlas (**Database → Connect → Drivers → Node**). The host must look like `cluster0.ab12cd.mongodb.net` (full subdomain), not a placeholder. If the DB password contains `@`, `#`, `/`, or spaces, **URL-encode** it in the URI. Do not wrap the whole URI in extra quotes in the config value.
- **CORS errors in browser:** `CLIENT_URL` must match the site you open (including `https://`). You can list **several** origins separated by commas (no spaces needed), e.g. production Vercel URL **and** preview URLs like `https://blog-space-git-development-….vercel.app`.
- **“Failed to fetch” on a `*-git-*-*.vercel.app` preview URL:** (1) Add that exact preview URL to Heroku `CLIENT_URL` (comma-separated with your main Vercel URL). (2) In Vercel → **Settings → Environment Variables**, set `REACT_APP_API_URL` for **Preview** (and Production), then **Redeploy** the preview — otherwise the preview build still points at `localhost` and cannot reach Heroku.
- **Build fails “no package.json”:** Confirm `APP_BASE=blog-backend` and buildpack order (monorepo first, then `heroku/nodejs`).
- **Scheduled posts:** The server runs a timer every 60s while the dyno is running; Eco dynos can sleep on inactive apps—upgrade or use a ping/cron if sleep becomes an issue.

---

## Local development (unchanged)

```bash
cd blog-backend && npm run dev
cd blog-frontend && npm start
```

`npm start` in `blog-backend` runs `node server.js` (production-style); use `npm run dev` for local work with nodemon.
