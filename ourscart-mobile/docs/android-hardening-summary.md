# OursCart Android App — Production Hardening Summary

Complete production hardening of the OursCart React Native + Expo SDK 51 Android app across five critical dimensions: Security, Performance, Network Resilience, Monitoring & Crash Reporting, and Reliability & Recovery.

**Target:** Android (primary), iOS (secondary)  
**Framework:** React Native + Expo SDK 51, TypeScript, Expo Go managed workflow  
**Market:** India — 2G/3G/4G switching, budget 2GB RAM devices, high latency

---

## Phase 1 — Security

### 1A — Secure Token Storage (`lib/auth.ts`)
- `keychainService: 'com.ourscart.auth'` — isolates app credentials from other apps on the same device (prevents token harvesting by a malicious app)
- `keychainAccessible: AFTER_FIRST_UNLOCK` — tokens survive app restart but NOT device boot; a stolen powered-off device cannot be read
- `TOKEN_KEYS` as `const` object — prevents typos across the codebase; TypeScript catches misspelled key names at compile time
- All writes parallelized via `Promise.all` — minimizes the SecureStore write window (faster = safer against interruption)
- `isTokenExpired()` with 30-second buffer — proactively refreshes before the server rejects, preventing a predictable 401 race on clock-skewed devices
- **Verify:** Open Signed APK → `adb shell` → check `/data/data/com.ourscart/app_secure_store/*` — all four keys encrypted at rest

### 1B — API Security Hardening (`lib/api.ts`)
- **Proactive token refresh** — `api()` checks token expiry before every request using `isTokenExpired()`. If the token is about to expire, refreshes first. This prevents a guaranteed 401 on tokens within 30s of expiry.
- **Production HTTPS enforcement** — `api.ts` throws at module load time if `EXPO_PUBLIC_API_URL` starts with `http://` in production. This is a hard crash, not a warning — no traffic can leak over plain HTTP.
- **Token refresh race prevention** — `let isRefreshing = false` with subscriber pattern. If 3 requests 401 simultaneously, only one calls `/auth/refresh`. The other two queue up via `subscribeToRefresh()` and resume with the new token, avoiding redundant refreshes.
- **Request timing** — every response logs duration in dev (emoji + ms). API calls > 5s are flagged as Sentry warnings in production.
- **Verify:** Stop API → GET request retries 3 times with 500ms/1000ms/2000ms backoff → surfaces "Network error" to user

### 1C — Input Sanitization (`utils/sanitize.ts`)
- `sanitizeText()` strips `<>` and enforces max length — prevents basic HTML injection in every text field
- Applied in **`components/ui/Input.tsx`** — every `onChangeText` in the app is automatically sanitized via the shared Input component
- `sanitizeSearchQuery()` applied to direct `TextInput` in **`app/search.tsx`** and **`app/admin/products.tsx`**
- Type-specific sanitizers for email, price, pincode, phone — each permits only valid characters
- **Verify:** Paste `<script>alert(1)</script>` into any Input field → `<>` stripped, harmless text remains

### 1D — Client-Side Validation (`utils/validators.ts`)
- **Password rules** — 8+ chars, 1 uppercase, 1 number — validated before any API call
- **Indian mobile regex** — `/^[6-9][0-9]{9}$/` — catches common data entry errors before the server round-trip
- **Indian pincode regex** — `/^[1-9][0-9]{5}$/` — no 0-starting pincodes, exactly 6 digits
- Coupon code checked for length (50 char max) and character set (alphanumeric + `_-`)
- All composite validators (`validateRegistration`, `validateAddress`, `validateReview`) return typed `ValidationResult { valid, errors }`
- **Verify:** Submit registration with `password: "short"` → "Password must be at least 8 characters" appears inline, no API call fired

### 1E — SSL/TLS Note
- Certificate pinning requires bare workflow (ejected from Expo). On managed workflow, we rely on the device's native CA trust store. Documented as a known limitation.
- **Verify:** See `lib/api.ts` SSL comment block

---

## Phase 2 — Performance

### 2A — FlatList Optimization (all list screens)
Every FlatList in the app now uses the full performance prop set:

| Prop | Value | Why |
|------|-------|-----|
| `windowSize` | 5 | Render window = 5x screen height. Default is 21 — reducing it cuts render work by 75% |
| `maxToRenderPerBatch` | 8 | Items per JS frame batch. Default 10 — slightly lower prevents jank on 2GB devices |
| `updateCellsBatchingPeriod` | 50ms | Throttle for cell update batches. Keeps JS thread responsive |
| `initialNumToRender` | 6 | Only render 6 on first paint. Less initial work = faster TTI |
| `removeClippedSubviews` | true | Native: unmount off-screen views. Android-only optimization that frees GPU memory |
| `scrollEventThrottle` | 16 | ~60fps. Matches the display refresh rate — no wasted scroll events |
| `onEndReachedThreshold` | 0.2 | Fire load-more at 80% scroll. Gives API response time to arrive before user hits the end |

**Screens updated:** `shop.tsx`, `cart.tsx`, `wishlist.tsx`, `search.tsx`, `orders/index.tsx`, `home.tsx`, `admin/orders.tsx`, `admin/products.tsx`, `components/product/ImageGallery.tsx`

- **Verify:** Profile shop grid on a Moto G52 (2GB) — scroll jank stays under 16ms per frame

### 2B — Expo Image (`components/ui/AppImage.tsx`)
- `expo-image` replaces React Native `Image` throughout the app — provides memory+disk caching, blurhash placeholders, and priority loading
- `AppImage` wrapper centralizes: `cachePolicy="memory-disk"`, `recyclingKey` for FlatList view reuse, 200ms fade transitions, blurhash placeholders matching `bgTertiary`
- **Verify:** Check `expo-image` is used in every product card, cart item, and gallery (zero `import { Image } from 'react-native'` in components)

### 2C — React.memo + useCallback
- **`ProductCard`** — custom comparison: only re-renders when `id`, `basePrice`, `stockQuantity`, or `isWishlisted` change. Screens with 100 products: only 1 card re-renders on stock update, not 100.
- **`CartItem`** — custom comparison: only re-renders when `quantity`, `lineTotal`, `unitPrice`, or `stockQuantity` change. Quantity changes no longer re-render the entire cart list.
- **`ProductCardHorizontal`** — wrapped with `React.memo`. Used in search results and dense lists.
- **Verify:** React DevTools Profiler → Add to cart → only CartItem with changed quantity re-renders

### 2D — Memory Leak Prevention
- **`useFetch.ts`** — `mountedRef` pattern prevents `setState` on unmounted components. Every async path checks `mountedRef.current` before touching state.
- **`checkout/success.tsx`** — `Animated.loop` now has `return () => loop.stop()` — no infinite animation after navigation away
- **`ToastContext.tsx`** — `timers` Set tracks all `setTimeout` IDs. On unmount, all timers are cleared via `useEffect` cleanup
- **`product/[slug].tsx`** — `timerRef` tracks `setTimeout` IDs for haptic/reset timers. Cleaned up on unmount.
- **`StockIndicator.tsx`** — `Animated.loop` has cleanup. **`ProductCard.tsx`** — pulse animation loop has cleanup.
- **Verify:** Navigate through all screens 3x quickly → Chrome DevTools memory graph stays flat with no sawtooth pattern from leaked listeners

---

## Phase 3 — Network Resilience

### 3A — Network State Detection (`hooks/useNetworkState.ts`)
- Polls `expo-network` every 3 seconds (expo-network lacks a reliable Android change listener — polling is the safe fallback)
- Exposes `isSlowConnection` flag for 2G/3G — screen components can choose to show smaller images, fewer detail pills
- **Verify:** Toggle Airplane Mode → `useNetworkState()` updates within 3s

### 3B — Offline Banner (`components/ui/OfflineBanner.tsx`)
- Red banner slides in/out from top with 300ms `Animated.timing` — positions at `zIndex: 9999` to overlay all content
- Rendered in `app/_layout.tsx` so it appears on every screen in the app
- **Verify:** Turn off WiFi → banner slides in. Turn on → slides out

### 3C — Request Retry (`lib/api.ts`)
- Exponential backoff: 500ms → 1000ms → 2000ms (max 3 retries)
- Only retries GET requests (idempotent). POST/PATCH/DELETE fire once — retrying a payment or order creation request would be catastrophic
- Retries on: network errors (fetch threw, no HTTP status) and 5xx server errors
- **Verify:** Stop API → GET request retries 3x over 3.5s → surfaces "Network error — check your connection"

### 3D — Optimistic Cart Updates (`context/CartContext.tsx`)
- "Add to cart": creates a temp `CartItem` immediately with `ADD_ITEM_OPTIMISTIC`, shows in UI instantly
- On API success: `CONFIRM_ADD_ITEM` replaces temp item with server data (correct prices, IDs)
- On API failure: `ROLLBACK_ADD_ITEM` removes the temp item, shows error toast
- Cart count in tab badge updates instantly — no waiting for network
- **Verify:** Add item to cart → appears instantly in badge and list. Kill API → toast says "Failed", item removed from list

### 3E — Offline Cart Persistence (`context/CartContext.tsx`)
- Guest cart (no auth) persisted to AsyncStorage whenever `state.items` changes
- Loaded on app start for guest users — cart survives app kill and phone restart
- On login: server merges guest cart with server cart (handled by API — no local merge needed)
- AsyncStorage operations are best-effort — `catch(() => {})` silences storage errors (non-critical)
- **Verify:** Add items as guest → kill app → reopen → items still in cart

---

## Phase 4 — Monitoring & Crash Reporting

### 4A — Sentry Integration (`lib/monitoring.ts`)
- `initializeMonitoring()` called before any component renders in `_layout.tsx`
- Only enabled in production (`!__DEV__`) — keeps Sentry dashboard clean during development
- `setMonitoringUser()` called after login/register — attaches user identity to crashes
- `captureError(error, context)` — one function for all error reporting, dev console fallback
- `captureMessage(message, level)` — for performance anomalies (slow screens, slow API calls)
- 10% traces sample rate in production — stays within Sentry free tier (5k events/month)
- **Verify:** Set `EXPO_PUBLIC_SENTRY_DSN`, `npx expo run:android --release`, crash app → error appears in sentry.io

### 4B — Error Boundary (`components/ui/ErrorBoundary.tsx`)
- Class component `componentDidCatch` — catches render-phase errors that functional error boundaries cannot
- Reports to Sentry with `componentStack` for full traceback
- Shows "Something went wrong" + "Try Again" button — user can recover without restarting app
- Wraps entire app in `_layout.tsx` (catches all screens) but designed to be used per-screen for granular isolation
- **Verify:** `throw new Error('test')` in any render → error boundary catches it, shows fallback, Sentry receives event

### 4C — Screen Performance (`hooks/useScreenPerformance.ts`)
- Tracks `mountTime` via `useRef`, reports elapsed time on mount
- Flags screens taking >3s to `captureMessage` at `warning` level in production
- Added to every major screen: HomeScreen, ShopScreen, CartScreen, WishlistScreen, ProfileScreen, ProductDetailScreen, OrdersScreen, SearchScreen, CheckoutScreen, RootLayout
- **Verify:** Check console for `[Perf] ShopScreen loaded in 320ms` in dev mode

### 4D — API Request Logging (`lib/api.ts`)
- Every request logs: `✅ GET /products [200] 45ms` (dev) — shows method, path, status, duration
- Errors log: `❌ POST /orders NETWORK ERROR (3200ms)` — shows network failures
- Slow API calls (>5s) sent to Sentry as warnings in production
- **Verify:** Watch console during app use — all API calls logged with emoji prefix

---

## Phase 5 — Reliability & Recovery

### 5A — Auth State Recovery (`context/AuthContext.tsx`)
- On startup: reads all 4 SecureStore keys in parallel, checks access token expiry
- If access token expired: tries `/auth/refresh` with stored refresh token before showing any UI
- If refresh fails or no tokens exist: shows logged-out state (login screen)
- If tokens valid: restores session from cached userId/role (no API call), then refreshes full user profile in background
- `captureError` on any auth init failure — you'll know in Sentry if something corrupts tokens on device
- **Verify:** Clear SecureStore via `expo-secure-store` debug → restart → app shows login

### 5B — App State Handling (`hooks/useAppState.ts`)
- `useAppStateRefresh(onRefreshNeeded)` — `AppState.addEventListener('change', ...)` fires callback when app comes to foreground
- Checks token expiry on foreground — if user backgrounded the app for 30+ minutes, token is refreshed before next API call hits a 401
- Cleanup: `return () => subscription.remove()` — prevents listener leak when component unmounts
- **Verify:** Background app for 35min (access token = 15min TTL) → bring to front → token refresh fires via Sentry log

### 5C — OTA Updates (`hooks/useAppUpdate.ts`)
- Calls `Updates.checkForUpdateAsync()` on app start and foreground transition
- If update available: fetches in background, prompts user with Alert dialog to restart
- User can dismiss "Later" — update applies on next launch
- Silent failure — update check failing doesn't break the app
- **Verify:** `eas update --branch production --message "Test"` → app prompts restart on next launch

### 5D — Graceful Degradation (`hooks/useProductsWithFallback.ts`)
- Three-state hook: `{ data, loading, error, isFromCache }`
- Always fetches fresh data from API first
- On API failure: reads from AsyncStorage cache (5-minute TTL)
- Shows "Showing cached data — pull to refresh" when cache is stale
- Used for: home screen featured/trending/newest, category list, shop product grid
- NOT used for: cart, checkout, orders — those require fresh data
- **Verify:** Load shop → turn off WiFi → pull to refresh → cached data appears with warning indicator

### 5E — Environment Validation (`utils/env-check.ts`)
- `validateAppEnvironment()` — called at very top of `_layout.tsx` before any component renders
- Checks `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_STORE_NAME` are set
- In dev: throws with clear message directing developer to `.env` file
- In production: logs to console (app continues — crashing on bad env in production is worse than working partially)
- Validates HTTPS in production — `http://` in prod throws
- **Verify:** Delete `EXPO_PUBLIC_API_URL` from `.env` → app throws "Missing required environment variables" at boot

### 5F — Input Sanitization (centralized in `components/ui/Input.tsx`)
- Every `onChangeText` passes through `sanitizeText(text, maxLength)` — strips `<>`, enforces length
- Direct `TextInput` components (search screens) use `sanitizeSearchQuery` explicitly
- This is defense-in-depth: validation catches bad data before API call, sanitization prevents injection even if validation has gaps

---

## Verification Checklist

Run this before any Play Store release:

- [ ] **Auth flow:** Register → login → add to cart → checkout → order appears in history
- [ ] **Token refresh:** Kill API for 30s → app refreshes token on next request → no 401 to user
- [ ] **Session recovery:** Force-kill app while logged in → reopen → still authenticated (no flash of login screen)
- [ ] **Input sanitization:** Paste `<script>alert(1)</script>` into any text field → stripped, harmless
- [ ] **Form validation:** Submit registration with weak password → inline error, no API call fired
- [ ] **Offline:** Turn off network → red banner appears → cached data shows → turn on network → banner disappears
- [ ] **Cart persistence (guest):** Add items as guest → kill app → reopen → items still in cart
- [ ] **Cart optimization:** Add item to cart → badge updates instantly (no network wait)
- [ ] **FlatList performance:** Scroll shop grid with 200+ products → steady 60fps (no jank)
- [ ] **Memory:** Navigate through all screens → no setState-on-unmounted warnings → memory profile flat
- [ ] **Error reporting:** Crash app → Sentry dashboard shows event with stack trace
- [ ] **Error boundary:** `throw new Error('test')` in component → fallback UI appears, Sentry event logged
- [ ] **Environment:** `.env` has `EXPO_PUBLIC_API_URL=https://...` and `EXPO_PUBLIC_SENTRY_DSN` set
- [ ] **HTTPS enforcement:** Set `EXPO_PUBLIC_API_URL=http://` in production env → app crashes at boot with clear error
- [ ] **Screen perf:** Check console for `[Perf] ScreenName loaded in Xms` for every screen
- [ ] **OTA update:** `eas update --branch production` → app prompts "Restart Now" on next foreground
- [ ] **App state:** Background app for 30min → bring to front → token refresh fires silently
