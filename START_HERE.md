# 📖 Getting Started - Where to Begin

Welcome! You've purchased **nav-starter**, a production-ready navigation PWA template. Here's your roadmap.

---

## 🚀 TL;DR (5 minutes)

1. **Extract the ZIP** to a folder
2. Run: `npm install`
3. Run: `npm run dev`
4. Open: `http://localhost:5173/nav-starter/`
5. Login with demo credentials (from `backend/.env.example`)

Done! You have a working app locally. 

Now read the guides below.

---

## 📋 Documentation Guide

Read these in order, based on your goal:

### Goal: "Just run it locally to see how it works"
1. **Start here**: [SETUP_GUIDE.md](SETUP_GUIDE.md) - Part 1 (Local setup only)
2. **Optional**: [PERSONALIZATION.md](PERSONALIZATION.md) - Skim the color section
3. **Check out**: `src/App.tsx` to see the main app logic

**Time**: 30 minutes

---

### Goal: "Deploy this and make it live"
1. [SETUP_GUIDE.md](SETUP_GUIDE.md) - Part 1 (local) + Part 3 (backend) + Part 4 (frontend)
2. [PRE_LAUNCH_CHECKLIST.md](PRE_LAUNCH_CHECKLIST.md) - Verify everything before launching
3. Test in production

**Time**: 2-4 hours (depending on chosen hosting)

---

### Goal: "Customize this for my business"
1. [SETUP_GUIDE.md](SETUP_GUIDE.md) - Part 1 (get it running first)
2. [PERSONALIZATION.md](PERSONALIZATION.md) - Follow each section step-by-step
3. [SETUP_GUIDE.md](SETUP_GUIDE.md) - Part 2 (build for production)
4. Deploy (Part 3 & 4)

**Time**: 4-8 hours depending on customization depth

---

### Goal: "Use this as a freelancer to build for clients"
1. [SETUP_GUIDE.md](SETUP_GUIDE.md) - Full Parts 1-4
2. [PERSONALIZATION.md](PERSONALIZATION.md) - Master all sections
3. [SELLER_README.md](SELLER_README.md) - Show clients this for features overview
4. Create a client-specific fork or variant

**Time**: 1 day (first time), 2-4 hours per client deployment after

---

### Goal: "Learn how this was built"
1. [SELLER_README.md](SELLER_README.md) - Feature overview
2. `backend/README.md` - Backend architecture
3. `src/App.tsx` - Main React component (well-commented)
4. `src/lib/navigation.ts` - Helper functions (with tests as reference)
5. `.github/workflows/` - CI/CD pipeline

**Time**: 2-4 hours

---

## 🗂️ File Structure Overview

```
nav-starter/
├── 📖 SELLER_README.md              ← Start here (features overview)
├── 📖 SETUP_GUIDE.md                ← How to set up & deploy
├── 📖 PERSONALIZATION.md            ← How to customize
├── 📖 SALES_PITCH.md                ← Marketing strategy (if reselling)
├── 📖 PRE_LAUNCH_CHECKLIST.md       ← Verify before launch
├── 📄 LICENSE.md                    ← Usage rights
│
├── src/                             ← React frontend
│   ├── App.tsx                      ← Main app (navigation, routing, state)
│   ├── App.css                      ← Styles (edit colors here)
│   ├── lib/
│   │   ├── i18n.ts                  ← Translations (FR/EN)
│   │   ├── navigation.ts            ← Helper functions (distance, ETA, etc.)
│   │   └── *.test.ts                ← Tests
│   └── main.tsx                     ← React entry point
│
├── backend/                         ← Node.js API proxy
│   ├── index.js                     ← Express server (routing, auth, geocoding)
│   ├── README.md                    ← Backend deployment docs
│   ├── .env.example                 ← Backend config template
│   └── config.js                    ← Configuration helpers
│
├── public/                          ← Static files
│   ├── manifest.json                ← PWA config
│   ├── favicon.ico                  ← App icon
│   └── icons/                       ← PWA icons (192x192, 512x512)
│
├── .github/workflows/               ← CI/CD
│   └── deploy-pages.yml             ← Auto-deploy to GitHub Pages
│
├── package.json                     ← Dependencies + scripts
├── tsconfig.json                    ← TypeScript config
├── vite.config.ts                   ← Vite build config
└── playwright.config.ts             ← E2E test config
```

---

## 🎯 Quick Decisions

**"Should I customize before deploying?"**
- No. Deploy first (exact same code), test in production, then customize.

**"Can I add database?"**
- Yes. Modify `backend/index.js` to add a database (PostgreSQL, MongoDB, etc.)

**"Can I remove the Mapbox part?"**
- Yes, but that's most of the value. Better to fork and extend than remove.

**"Can I sell this template?"**
- Yes! See [LICENSE.md](LICENSE.md) and [SALES_PITCH.md](SALES_PITCH.md).

**"How long to get live?"**
- First time: 4-6 hours (setup + learning)
- Subsequent times: 1-2 hours (just config + deploy)

---

## ✅ Checklist by Goal

### I want to see it working locally
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Open `http://localhost:5173/nav-starter/`
- ✅ Done!

### I want to deploy it
- [ ] Complete local setup
- [ ] Get Mapbox API key
- [ ] Configure `.env` files
- [ ] Deploy backend (Render/Railway)
- [ ] Deploy frontend (GitHub Pages/Netlify)
- [ ] Test in production
- ✅ Live!

### I want to customize it
- [ ] Run `npm run dev`
- [ ] Read [PERSONALIZATION.md](PERSONALIZATION.md)
- [ ] Edit `src/App.css` (colors)
- [ ] Edit `src/App.tsx` (destinations data)
- [ ] Add your destinations + branding
- [ ] Test locally
- [ ] Deploy customized version
- ✅ Your app!

### I want to understand the code
- [ ] Read `backend/index.js` (30 min)
- [ ] Read `src/App.tsx` (1 hour)
- [ ] Read tests in `src/lib/*.test.ts` (30 min)
- [ ] Check `.github/workflows/` (15 min)
- ✅ Expert!

---

## 🆘 I'm Stuck

1. **"App doesn't start"** → See [SETUP_GUIDE.md Part 1: Troubleshooting](SETUP_GUIDE.md#part-6-troubleshooting)
2. **"CORS error in browser"** → Backend not running or wrong URL
3. **"Routes don't work"** → Mapbox token missing or invalid
4. **"I don't know where to put my data"** → See [PERSONALIZATION.md section 2](PERSONALIZATION.md#2️⃣-replace-demo-data-10-min)

**More help**: Check the docs, search the code, or run the tests to understand.

---

## 🎓 Learning Path (If New to Tech)

You don't need to know everything to use this template.

**Minimum knowledge:**
- Basic command line (cd, ls)
- What API means (it talks to Mapbox)
- What PWA means (installable app)

**Recommended before customizing:**
- JavaScript basics (variables, functions, loops)
- React fundamentals (components, hooks, state)
- CSS basics (colors, flexbox, sizing)

**Good to know but not required:**
- TypeScript (it's just JavaScript + types)
- Vite (it's just a bundler)
- Docker (not needed, optional for backend)

**Resources**:
- [JavaScript.info](https://javascript.info/) - Free JS course
- [React docs](https://react.dev/) - Official React guide
- [MDN CSS guide](https://developer.mozilla.org/en-US/docs/Web/CSS) - CSS reference

---

## 📞 Next Steps

### Ready to start?
→ Go to [SETUP_GUIDE.md](SETUP_GUIDE.md)

### Want to customize?
→ Go to [PERSONALIZATION.md](PERSONALIZATION.md)

### Want to deploy?
→ Go to [SETUP_GUIDE.md Part 3-4](SETUP_GUIDE.md)

### Want to resell?
→ Go to [SALES_PITCH.md](SALES_PITCH.md)

---

**Pick one and get started!** You've got this. 🚀
