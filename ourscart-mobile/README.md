# OursCart Mobile

The native sibling of the FocusKit web store — a React Native (Expo, managed workflow)
app for buying student planners, Notion templates, printables and desk accessories. TypeScript throughout, runs in **Expo Go** on iOS and
Android with no native build step.

## Stack

- **Expo SDK 51** + **Expo Router** (file-based routing, same mental model as Next.js)
- **TypeScript strict** — no `any`, all props typed
- State via **React Context + useReducer** (Theme / Auth / Cart / Wishlist / Toast)
- Data via native **fetch** with a typed wrapper (`lib/api.ts`)
- Tokens in **expo-secure-store**, persisted preferences in **AsyncStorage**
- UI: `@expo/vector-icons`, `react-native-svg`, `@gorhom/bottom-sheet`,
  `react-native-reanimated`, `react-native-gesture-handler`, `expo-image`,
  `expo-linear-gradient`, `react-native-chart-kit`, `@miblanchard/react-native-slider`,
  `react-native-confetti-cannon`, `expo-haptics`, `expo-mail-composer`

## Getting started

```bash
cd ourscart-mobile
npm install
npm start          # then scan the QR with Expo Go
```

### Pointing at the API

Set `EXPO_PUBLIC_API_URL` in `.env`. On a **physical device**, `localhost` is the phone,
so use your machine's LAN IP:

```
EXPO_PUBLIC_API_URL=http://192.168.1.10:4000
```

## Auth note (important)

The OursCart API is browser-first and issues access/refresh JWTs as **HTTP-only
cookies**. React Native has no shared cookie jar, so `lib/api.ts`:

1. parses the `Set-Cookie` header off `/auth/*` responses and stores the raw JWTs in
   SecureStore,
2. sends the access token back as `Authorization: Bearer` (the API's documented
   non-browser fallback),
3. replays the refresh token as a `Cookie: refreshToken=…` header to `/auth/refresh`,
   transparently retrying the original request once on a 401,
4. on refresh failure, clears tokens and drops the user to login.

Guest carts ride along via an `X-Session-Id` header; logging in merges them server-side.

## Structure

```
app/            Expo Router routes (tabs, auth, product, checkout, orders, admin, search)
components/     ui / product / cart / layout / home
constants/      design tokens (colors, typography, spacing, radius, shadows)
context/        Theme, Auth, Cart, Wishlist, Toast providers
hooks/          useTheme/useAuth/useCart + useDebounce/useAsyncStorage/usePagination/useProductActions
lib/            api, auth (SecureStore), formatters, pricing
types/          shared API/domain interfaces
utils/          themedStyles, validators
```

## Design tokens

Color, type, spacing, radius and shadow tokens are copied 1:1 from the web app and live
in `constants/`. Components never hardcode hex — they read the active palette through
`useTheme()`, which follows the OS theme by default and persists a manual override.
