# 🛠️ Complete Setup Guide - Nav-Starter Template

## Prerequisites

- **Node.js** 18+ (check: `node -v`)
- **npm** 9+ (check: `npm -v`)
- **Mapbox account** (free tier: https://account.mapbox.com/auth/signup/)
- **Git** (optional, for version control)

---

## Part 1: Local Development Setup

### Step 1: Get your Mapbox API key

1. Go to https://account.mapbox.com/auth/signup/
2. Create a free account
3. Go to **Tokens** page (https://account.mapbox.com/tokens/)
4. You'll see a "Default public token" — copy it

### Step 2: Clone/extract template and install

```bash
# If you have a ZIP file:
unzip nav-starter.zip
cd nav-starter

# OR if you cloned from Git:
cd nav-starter
```

```bash
# Install all dependencies (frontend + backend)
npm install
```

### Step 3: Configure environment

#### Frontend `.env`:
```bash
cp .env.example .env
```

Edit `.env` and fill in:
```
VITE_API_BASE_URL=http://localhost:4000
VITE_MAPBOX_PUBLIC_TOKEN=pk.xxxxx_your_token_here
```

#### Backend `.env`:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in:
```
MAPBOX_TOKEN=pk.xxxxx_your_token_here
PORT=4000
ALLOWED_ORIGINS=http://localhost:5173
JWT_SECRET=dev-secret-key-change-in-prod
DEMO_USER_EMAIL=demo@example.com
DEMO_USER_PASSWORD=DemoPassword123!
```

### Step 4: Run locally

**Terminal 1** (Backend):
```bash
npm run backend:start
# Output should say: "Backend running on port 4000"
```

**Terminal 2** (Frontend):
```bash
npm run dev
# Output will show: "Local: http://localhost:5173/nav-starter/"
```

Open **http://localhost:5173/nav-starter/** in your browser.

### Step 5: Test it

1. **Login page** appears
2. Enter credentials:
   - Email: `demo@example.com` (or what you set in `backend/.env`)
   - Password: `DemoPassword123!`
3. Click "Login"
4. Map appears with destination search
5. Try searching: "eiffel" or "times square"
6. Click a destination, choose travel mode, see the route

**Success!** ✅

---

## Part 2: Building for Production

### Local production build

```bash
# Clean build
npm run build

# Preview production locally
npm run preview
# Open http://localhost:4173/nav-starter/
```

### Run Lighthouse test

```bash
npm run build
npm run preview
# In another terminal:
npx lighthouse http://localhost:4173/nav-starter/ \
  --only-categories=performance,accessibility,best-practices,seo,pwa \
  --output=json > lighthouse-report.json
```

---

## Part 3: Deploy Backend (API Proxy)

Your backend must be live for your frontend to work. Choose one:

### Option A: Deploy to Render (Recommended for beginners)

1. Go to https://render.com (free tier)
2. Click **New +** → **Web Service**
3. Connect your GitHub account (or upload this repo)
4. Fill in:
   - **Name**: `nav-starter-backend`
   - **Build command**: `npm install`
   - **Start command**: `npm run backend:start`
5. Click **Environment** → Add these env vars:
   - `MAPBOX_TOKEN` = your Mapbox token
   - `ALLOWED_ORIGINS` = (add your frontend URL after step 5)
   - `JWT_SECRET` = random string (e.g., `your-production-secret-key-12345`)
6. Click **Deploy**
7. Copy your deployed URL (e.g., `https://nav-starter-backend-xxxxx.onrender.com`)

### Option B: Deploy to Railway (Fast alternative)

1. Go to https://railway.app (start free)
2. Click **New Project** → **Deploy from GitHub**
3. Select this repo
4. Add env vars in **Variables** tab:
   - `MAPBOX_TOKEN`
   - `ALLOWED_ORIGINS`
   - `JWT_SECRET`
5. Railway auto-deploys. Copy your URL from **Deployments**

### Option C: Deploy to Vercel (serverless, advanced)

Requires refactoring `backend/index.js` to Vercel handler format. See Vercel docs for Node.js deployments.

---

## Part 4: Deploy Frontend (Web App)

### Option A: GitHub Pages (Free, included)

1. Go to your GitHub repo **Settings** → **Pages**
2. Set:
   - **Source**: Deploy from branch
   - **Branch**: `main`
   - **Folder**: `/docs` (or `/(root)` if you prefer)
3. In your repo root, create `.github/workflows/deploy.yml` (check if it exists):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v3
```

4. Add a **GitHub Actions secret**:
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `VITE_API_BASE_URL`
   - Value: `https://your-backend-url.com` (from Part 3)

5. Push to GitHub → GitHub Actions auto-deploys

### Option B: Netlify (Drag and drop)

1. Go to https://netlify.com
2. Drag the `dist/` folder onto the drop zone
3. Set build command: `npm run build`
4. Add env var: `VITE_API_BASE_URL=your-backend-url`

### Option C: Vercel

1. Go to https://vercel.com
2. Import your GitHub repo
3. Set build command: `npm run build`
4. Add env: `VITE_API_BASE_URL=your-backend-url`
5. Deploy

---

## Part 5: Testing in Production

Once both frontend and backend are live:

1. Visit your frontend URL (e.g., `https://yourusername.github.io/nav-starter/`)
2. Login with demo credentials
3. Search for a destination
4. Verify:
   - Map loads
   - Routing works
   - Language toggle works
   - App can be installed (PWA prompt)
   - Offline mode works (DevTools → Network → Offline)

---

## Part 6: Troubleshooting

### "CORS error" in browser console

**Problem**: Frontend can't reach backend.

**Fix**:
1. Check backend is running (should see "Backend running on port 4000")
2. Check `VITE_API_BASE_URL` in `.env` matches your backend URL
3. Check `ALLOWED_ORIGINS` in `backend/.env` includes your frontend domain
4. If deployed, verify backend is actually up: `curl https://your-backend-url.com/health`

### "Invalid Mapbox token" error

**Problem**: Routes/geocoding fail.

**Fix**:
1. Get a **public token** from https://account.mapbox.com/tokens/
2. It should start with `pk.`
3. Make sure it's in both `.env` files

### "Invalid credentials" on login

**Problem**: Demo login doesn't work.

**Fix**:
1. Check `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD` in `backend/.env`
2. Make sure you're typing them correctly
3. Backend must be running (Terminal 1)

### Service worker issues

**Problem**: App doesn't work offline or caches are stale.

**Fix**:
1. Clear browser cache: DevTools → Application → Clear storage
2. Unregister service worker: DevTools → Application → Service Workers → Unregister
3. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### "dist folder not found" during deploy

**Problem**: GitHub Actions failed to build.

**Fix**:
1. Run locally: `npm run build`
2. Check for TypeScript errors: `npm run lint`
3. Fix errors, commit, push again

---

## Part 7: Next Steps (Customization)

See **[PERSONALIZATION.md](PERSONALIZATION.md)** to:
- ✏️ Change colors and branding
- 🗺️ Set default map location
- 🌍 Add more languages
- 🎯 Replace demo data
- 🏷️ Add your own destinations
- 🎨 Customize UI/UX

---

## Support Checklist

Before asking for help, verify:
- ✅ Node 18+ installed
- ✅ `npm install` completed
- ✅ `.env` files created and filled
- ✅ Backend starts without errors
- ✅ Frontend loads at `http://localhost:5173/nav-starter/`
- ✅ Login works with demo credentials
- ✅ Mapbox token is valid (starts with `pk.`)

---

**All set!** 🚀 Head to **[PERSONALIZATION.md](PERSONALIZATION.md)** to make it your own.
