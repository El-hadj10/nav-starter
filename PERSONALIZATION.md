# 🎨 Personalization Guide - Making Nav-Starter Your Own

This guide shows you exactly where and how to customize nav-starter for your brand/use case.

---

## 1️⃣ Change Colors & Branding (5 min)

### Primary colors (Cyan → Your color)

**File**: `src/App.css`

Find these variables and change them:

```css
:root {
  --primary: #0ea5e9;      /* Change this to your brand color */
  --primary-dark: #0284c7;
  --primary-light: #06b6d4;
  --accent: #6366f1;       /* Secondary color */
  --success: #10b981;
  --error: #ef4444;
  --bg: #ffffff;
  --bg-alt: #f3f4f6;
  --text: #1f2937;
  --text-muted: #6b7280;
  --border: #e5e7eb;
}
```

### App name

**File**: `src/App.tsx` (line ~350)

```typescript
// Change this:
const appName = 'Nav-Starter'
// To your app name
const appName = 'My Navigation App'
```

### Favicon & icons

**Files**: 
- `public/favicon.ico` → Replace with your icon
- `public/icon-192.png` → Replace (192x192)
- `public/icon-512.png` → Replace (512x512)

### PWA manifest

**File**: `public/manifest.json`

```json
{
  "name": "My Navigation App",
  "short_name": "MyNav",
  "description": "Your app description here",
  "theme_color": "#0ea5e9",  // Change to your primary
  "background_color": "#ffffff"
}
```

---

## 2️⃣ Replace Demo Data (10 min)

### Demo destinations

**File**: `src/App.tsx` (line ~79, `baseDestinations` array)

Current structure:
```typescript
const baseDestinations: Destination[] = [
  {
    id: '1',
    name: 'Eiffel Tower',
    area: 'Paris, France',
    tag: 'Monument',
    description: 'Iconic iron tower',
    traffic: 'Heavy',
    parking: 'Multiple lots nearby',
    offlinePack: 'eiffel_tower',
    coordinates: { latitude: 48.8584, longitude: 2.2945 },
    baseSteps: [/* ... */]
  },
  // ... more destinations
]
```

**Replace with your destinations:**

```typescript
const baseDestinations: Destination[] = [
  {
    id: '1',
    name: 'Your Store Location',
    area: 'Your City, State',
    tag: 'Store',
    description: 'Main office/store',
    traffic: 'Low',
    parking: 'Free parking',
    offlinePack: 'your_store',
    coordinates: { latitude: YOUR_LAT, longitude: YOUR_LON },
    baseSteps: [
      { title: 'Head North', detail: 'on Main St', baseMinuteOffset: 0 },
      { title: 'Turn Right', detail: 'on Oak Ave', baseMinuteOffset: 2 },
      { title: 'Arrive', detail: 'on your right', baseMinuteOffset: 5 }
    ]
  },
  // Add more...
]
```

**To get coordinates:**
1. Go to https://www.google.com/maps/
2. Search your location
3. Right-click → copy coordinates (they appear as `lat,lon`)

### Default map center

**File**: `src/App.tsx` (line ~71)

```typescript
// Change from Abidjan to your city:
const defaultOrigin: Coordinates = { latitude: 48.8566, longitude: 2.3522 } // Paris
```

---

## 3️⃣ Add More Languages (15 min)

### Current structure

**File**: `src/lib/i18n.ts`

```typescript
export const messages = {
  fr: {
    appTitle: 'Nav-Starter',
    searchPlaceholder: 'Où aller?',
    // ... more French strings
  },
  en: {
    appTitle: 'Nav-Starter',
    searchPlaceholder: 'Where to go?',
    // ... more English strings
  },
} as const
```

### Add a new language (Spanish example)

1. Copy the `en` object
2. Translate all values
3. Add to `messages`:

```typescript
export const messages = {
  fr: { /* ... */ },
  en: { /* ... */ },
  es: {
    appTitle: 'Nav-Starter',
    searchPlaceholder: '¿A dónde ir?',
    modeDrive: 'Conducir',
    modeWalk: 'Caminar',
    modeTransit: 'Transporte',
    discoveryTab: 'Descubrimiento',
    journeyTab: 'Viaje',
    savedTab: 'Guardado',
    profileTab: 'Perfil',
    // Add all other keys...
  },
} as const

export type Locale = keyof typeof messages // Will auto-include 'es'
```

### Language switcher

The switcher already works! In the app, click the globe icon to see all available languages.

---

## 4️⃣ Customize Demo Credentials (2 min)

**File**: `backend/.env`

```
# These are what users see on the login page:
DEMO_USER_EMAIL=demo@myapp.com
DEMO_USER_PASSWORD=MyApp123!
```

Change to whatever you want.

---

## 5️⃣ Change App Title in Browser Tab

**File**: `index.html`

```html
<title>My Navigation App</title>
```

---

## 6️⃣ Customize Search Categories

**File**: `src/App.tsx` (search in `handleSearchInput` function)

The demo has categories like "landmark", "restaurant". Modify this logic based on your `baseDestinations` data:

```typescript
// Around line 400, customize the filter logic:
if (query.length < 2) {
  setSearchResults([])
  return
}

const results = baseDestinations.filter(dest =>
  dest.name.toLowerCase().includes(query.toLowerCase()) ||
  dest.area.toLowerCase().includes(query.toLowerCase())
)
```

---

## 7️⃣ Change Travel Modes

By default: driving, transit, walking.

**File**: `src/App.tsx` (line ~73)

```typescript
const travelModes: Array<{ id: TravelMode; labelKey: keyof (typeof messages)['fr'] }> = [
  { id: 'drive', labelKey: 'modeDrive' },
  { id: 'transit', labelKey: 'modeTransit' },
  { id: 'walk', labelKey: 'modeWalk' },
  // { id: 'bike', labelKey: 'modeBike' }, // Uncomment if you add it to i18n
]
```

**To add "bike mode":**
1. Add it here
2. Add to i18n: `modeBike: 'À vélo'` in French, `modeBike: 'By bike'` in English
3. Update type `TravelMode` to include `'bike'`
4. Backend will need Mapbox "cycling" profile support

---

## 8️⃣ Customize Error Messages

**File**: `src/lib/i18n.ts`

```typescript
export const messages = {
  // ... existing
  en: {
    errorNetwork: 'No internet. Showing cached data.',
    errorRoute: 'Could not calculate route. Try a different destination.',
    // ... customize these
  },
}
```

Then update references in `src/App.tsx` where they're used.

---

## 9️⃣ Change Map Style

**File**: `src/App.tsx` (around line 600, in the map setup)

```typescript
mapboxgl.accessToken = mapboxPublicToken
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12', // Change this
  // ... other config
})
```

Available Mapbox styles:
- `streets-v12` (default, colorful)
- `outdoors-v12` (hiking-friendly)
- `light-v11` (clean, minimal)
- `dark-v11` (dark mode)
- `satellite-v9` (aerial view)

---

## 🔟 Customize PWA Install Prompt

**File**: `src/App.tsx` (search `BeforeInstallPromptEvent`)

The prompt automatically shows when the app is installable. Customize the UI text if desired:

```typescript
// Around line 130, customize button text:
<button className="btn-install">
  {msg.installApp} {/* Change this text in i18n */}
</button>
```

---

## ⚡ Quick Wins

### Change loading skeleton color
**File**: `src/App.css` (search `skeleton`)

```css
@keyframes shimmer {
  0% { background-color: #f3f4f6; }
  50% { background-color: #e5e7eb; }
  100% { background-color: #f3f4f6; }
}
```

### Add your company logo
**Files**: `public/logo.png`

Add to header:
```typescript
// In App.tsx render:
<img src="/logo.png" alt="logo" style={{ height: '40px' }} />
```

### Custom favicon
Just replace `public/favicon.ico`

---

## 🧪 Testing Your Changes

After each change:

```bash
npm run dev
# Open http://localhost:5173/nav-starter/
# Test the change
```

For production build:
```bash
npm run build
npm run preview
# Open http://localhost:4173/nav-starter/
```

---

## 🚀 Once You're Happy

1. Commit your changes to Git
2. Deploy backend (see SETUP_GUIDE.md Part 3)
3. Deploy frontend (see SETUP_GUIDE.md Part 4)
4. Test in production

---

## Need More Help?

- **Colors not applying?** Clear browser cache: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- **TypeScript errors?** Run `npm run build` to see exact errors
- **App not loading?** Check browser console (F12 → Console tab)

**Happy customizing!** 🎉
