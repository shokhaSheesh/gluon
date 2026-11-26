# Gluon: clickable prototype

React + TypeScript + Vite rebuild of the Gluon Figma design (file `IEeGE0egSHKrdwwVqjXnoZ`).
One app, three platforms; the platform is chosen with the switcher on the login screen.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
```

## Platforms
| Switcher | Route | Who |
|---|---|---|
| Gluon User | `/app` | Company owner: dashboard, services switcher, bank operations (statement import), bank offers, archive, store, chat, profile, top-up |
| Кабинет мерчанта | `/merchant` | Service: dashboard, clients, connection requests, chat · Bank: dashboard, clients, services for clients, account requests, bank offer, branding, chat |
| Gluon Админ | `/admin` | Gluon team: dashboard, companies, tariffs & prices (archive plans + service prices), tickets, chat |

## Demo accounts (also clickable on the login screen)
| Platform | Account | Login | Password |
|---|---|---|---|
| Gluon User | Gluon User | +998(90) 123-45-67 | gluon123 |
| Gluon User | Kapitalbank User (white-label: bank logo & colour, no bank offers) | +998(90) 987-65-43 | kapital123 |
| Кабинет мерчанта | Сервис (Billz) | billz | billz123 |
| Кабинет мерчанта | Сервис (OX) — has the Gluon user's pending request | ox | ox12345 |
| Кабинет мерчанта | Банк (Kapitalbank, has analytics + Брендинг) | kapitalbank | kapital123 |
| Gluon Админ | Admin | admin | admin123 |

The merchant cabinet and admin sign in with a login and password and have no registration. OTP code: **12345**.

Shortcuts: `?as=user|kapital|service|ox|bank|admin` opens an account directly, and `?theme=dark|light` sets the theme.

## Structure
```
src/
  styles/global.css      design tokens (light/dark) + base components
  lib/store.tsx          theme, language, session (platform), toasts
  lib/i18n.ts            uz / ru / en strings
  components/ui.tsx      Button/Input/Select/OTP/Modal/Toasts/...
  components/chat.tsx    chat list + window (support chat, tickets)
  data/mock.ts           all demo data (replace with API)
  lib/merchant.tsx       merchant-side shared state: clients, connection/account requests, bank services & offers
  lib/billing.tsx        plans, service prices, subscriptions, balance, payments (shared user ↔ admin, localStorage)
  assets/figma/          images exported from Figma (logos, bank wordmarks, 3D icons, photos); index in assets/index.ts
  layouts/               AuthLayout, UserLayout (top nav), PanelLayout (sidebar)
  pages/auth/            Login (platform switcher), Forgot, Register (6 steps + bank terms)
  pages/user/            Dashboard, Integration (Billz/Robosell/RoboHub/OX/Delever), Archive, Store, Banking, Chat, ProfileModal, TopUpModal
  pages/panel/           PanelDashboard, Companies (+ analytics), Tickets (+ detail), PanelChat
```
