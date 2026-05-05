# ✅ Pre-Launch Checklist

Complete this before uploading to Gumroad or any marketplace.

## Code Quality

- [ ] No `console.log()` left in production code (search `console.log`)
- [ ] No personal email addresses in code (search for your email)
- [ ] No API keys or secrets hardcoded (all go in `.env`)
- [ ] `.env` and `.env.local` are in `.gitignore`
- [ ] No `TODO` or `FIXME` comments (or document them)
- [ ] TypeScript strict mode passes: `npm run build`
- [ ] ESLint passes: `npm run lint`
- [ ] All tests pass: `npm run test`
- [ ] No unused imports: `npm run lint` should catch these

## Documentation

- [ ] **SELLER_README.md** - Buyer-focused intro ✅
- [ ] **SETUP_GUIDE.md** - Step-by-step setup ✅
- [ ] **PERSONALIZATION.md** - Customization walkthrough ✅
- [ ] **SALES_PITCH.md** - Marketing strategy ✅
- [ ] `backend/README.md` - Updated for generic setup ✅
- [ ] `README.md` - Should work for template buyers (original is fine)
- [ ] `.env.example` - No personal values ✅
- [ ] `backend/.env.example` - No personal values ✅

## Security

- [ ] No secrets in any `.js`, `.ts`, or `.json` files
- [ ] Mapbox token usage is in frontend `.env` only (never backend)
- [ ] Backend JWT_SECRET is randomized per deployment
- [ ] CORS whitelist in backend is configurable
- [ ] No hardcoded demo user credentials in code (only in `.env`)
- [ ] Dependencies have no known critical vulnerabilities: `npm audit`

## Branding Cleanup

- [ ] App name is generic (no personal references)
- [ ] README doesn't mention "My app" or personal stories
- [ ] GitHub profile link removed from main README (keep in profile)
- [ ] No references to "el-hadj" or personal domain
- [ ] Favicon is generic (not your face 😅)
- [ ] Colors are professional and generic

## Files to Remove/Archive

- [ ] Remove `GITHUB_PROFILE_README.md` (personal)
- [ ] Remove `.claude/` or `.vscode/` personal configs
- [ ] Remove any files in `docs/` that are personal (keep docs structure)
- [ ] Remove analytics code (if any)

## Performance

- [ ] Production build completes: `npm run build`
- [ ] Build size is reasonable (check `dist/` size)
- [ ] Lighthouse score 90+ all metrics: `npm run build && npm run preview`
- [ ] No console errors/warnings when running dev/build
- [ ] Service worker registers correctly (check DevTools)

## Testing

- [ ] Manual test: `npm run dev`, login, search, route
- [ ] PWA install works (Android Chrome or "Install app" option)
- [ ] Offline mode works (DevTools → Network → Offline)
- [ ] i18n toggle (FR/EN) works
- [ ] Different travel modes work (drive/walk/transit)
- [ ] Responsive on mobile (360px width)
- [ ] Works in Chrome, Firefox, Safari

## Package Contents

- [ ] All source files included
- [ ] `node_modules/` is NOT included (buyers install themselves)
- [ ] `.git/` folder is removed or kept? (I recommend remove for zip)
- [ ] `.env` files are NOT included (only `.env.example`)
- [ ] `dist/` folder is NOT included (buyers build themselves)

### Prepare final ZIP

```bash
# From project root:
rm -rf node_modules dist .git  # Remove build artifacts
# Keep: src/, backend/, public/, docs/, .env.example, backend/.env.example, etc.
# Then ZIP everything
zip -r nav-starter-template.zip . -x "node_modules/*" "dist/*" ".git/*"
```

## Metadata Ready

- [ ] **Title**: "Nav-Starter: Production-Ready React Navigation PWA"
- [ ] **Price**: $39 (or $29 for launch)
- [ ] **Description**: Compelling 200 words (see SALES_PITCH.md)
- [ ] **Keywords**: navigation, PWA, Mapbox, React, TypeScript, template
- [ ] **Thumbnail**: 1920×1080, clean design, eye-catching
- [ ] **License**: Chosen and stated (CC0 or commercial)

## Gumroad-Specific

- [ ] Account created and verified
- [ ] Email set up for support
- [ ] Product description written
- [ ] Thumbnail/cover uploaded
- [ ] ZIP file ready to upload
- [ ] License terms clear (e.g., "Full commercial rights, no attribution needed")
- [ ] Planned price: $39, launch price: $29
- [ ] Affiliate link ready (share with friends)

## Final Verification

Run this before shipping:

```bash
# 1. Clean build
npm install
npm run build
npm run lint

# 2. Test locally
npm run dev
# ... manually test app in browser

# 3. Check file sizes
du -sh node_modules/  # Should be ~500MB (not included in ZIP)
du -sh dist/          # Should be ~200-300KB

# 4. Verify docs
ls -la *.md  # Should see: SELLER_README.md, SETUP_GUIDE.md, PERSONALIZATION.md, SALES_PITCH.md

# 5. Remove sensitive files
ls -la .env  # Should not exist (only .env.example)
ls -la backend/.env  # Should not exist (only backend/.env.example)

# 6. Count files
find . -type f | grep -v node_modules | wc -l  # Rough file count

# 7. Create ZIP
zip -r nav-starter-template.zip . -x "node_modules/*" "dist/*" ".git/*" ".env" "backend/.env"

# 8. Verify ZIP contents
unzip -l nav-starter-template.zip | head -30
```

## Support Prep

- [ ] Response template for Gumroad messages
- [ ] FAQ document for common questions
- [ ] Contact email set up
- [ ] GitHub Issues closed or triaged
- [ ] Known bugs documented (be transparent)

---

## Day-of-Launch Checklist

- [ ] Take a screenshot of the app for social media
- [ ] Write tweet thread (5 tweets about the template)
- [ ] Draft Dev.to blog post (but don't publish yet)
- [ ] Email your network (if applicable)
- [ ] Check Gumroad listing one more time
- [ ] Set launch price: $29
- [ ] Go live! 🚀

---

## After First Sales

- [ ] Send thank-you message to early buyers
- [ ] Ask for feedback (what was easy? what was hard?)
- [ ] Document common setup issues
- [ ] Consider creating a video walkthrough based on feedback
- [ ] Plan next iteration

---

**When all checkboxes are ✅, you're ready to sell!**

Upload to Gumroad, share the link, and watch the sales come in. Good luck! 🎉
