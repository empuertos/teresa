# StoreFlow — Pure Vercel Setup

## Setup Steps (Phone-friendly)

### 1. Push to GitHub
Upload these files to a GitHub repo:
- `api/[...path].js`
- `lib/db.js`
- `lib/auth.js`
- `public/index.html`
- `package.json`
- `vercel.json`

### 2. Import to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. **Framework Preset:** `Other`
4. **Root Directory:** `./`
5. **Build Command:** (leave empty)
6. **Output Directory:** `public`
7. Tap **Deploy**

### 3. Add Postgres Database
1. In Vercel project → **Storage** tab
2. Tap **Create Database** → **Postgres**
3. Name: `storeflow-db`
4. Tap **Create** → **Connect to Project**
5. Vercel automatically adds `POSTGRES_URL` env var

### 4. Add Environment Variables
Vercel project → **Settings** → **Environment Variables** → add:

| Name | Value |
|---|---|
| `AUTH_SIGNING_KEY` | Random 64-char string (https://www.random.org/strings/) |
| `SETUP_KEY` | Random string (this is your one-time migration password) |

### 5. Redeploy
After adding env vars → **Deployments** → tap the latest → **Redeploy**.

### 6. Run Database Setup (ONCE)
Open in browser: