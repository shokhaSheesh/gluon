# Gluon: Project Brief

Sources: Fathom meeting "Gluon Project Discussion" (2026-11-23, 42 min, transcribed with Gemini;
see `meetings/`), Figma file `IEeGE0egSHKrdwwVqjXnoZ`, Miro board `uXjVEJk9E3w=`.

## What Gluon is
A single web platform for SMB merchants in Uzbekistan. One login gives a merchant:
- a **unified dashboard** (sales, average check, online/offline orders, income by payment method: Cash/Click/Payme, recent orders, top products)
- **connected startup services** shown as top-nav tabs (Billz, Moy Sklad, Robosell, ...); Gluon pulls their data to build dashboards
- **Gluon Archive**: storage of the pulled data, with a per-plan **storage limit** and an upgrade subscription when the limit is reached
- **Gluon Store**: marketplace of startup services (pay for each service *through Gluon*)
- a **banking section** (see the decisions below)
- profile (business info, INN, balance and top-up, password, bank accounts, cards, employees, roles, language), support chat
- UI in Uzbek, Russian and English, with light and dark themes; desktop, tablet and mobile layouts

Distribution model: Gluon is the main **aggregator**; **banks** (Ipak Yuli, Kapitalbank, SQB, ...) act as
co-branded aggregators that hand Gluon to their merchant clients as "their own" product.

## Roles (one system, role-based; no separate backends)
| Role | Who | Sees / does |
|---|---|---|
| **Super Admin** (Gluon team) | us | all merchants, all services, creates aggregators/merchants, a checkbox "can manage services + create users" |
| **Aggregator / Bank admin** | Ipak Yuli, Kapitalbank... | white-label settings (logo, colours/theme, name such as "SQB Business"), **toggle which services its users see**, creates its users, analytics on its merchants (which services they use) |
| **Startup / service admin** | Billz, Knox (Oks), Deliver, RoboHub... | cannot toggle services; sees how many of *its* clients are on Gluon, split by bank/aggregator |
| **Merchant / Gluon user** | business owner | the user platform above; branding and services depend on the aggregator it belongs to |

## Decisions from the 2026-11-23 meeting
1. **No DBank and no direct bank integrations for now** (DBank needs re-linking every few days, costs millions per bank, is slow and buggy).
   Instead the Gluon team provides a **statement import / OCR API** (internal project codename **"Detail"**):
   the merchant uploads a bank statement (PDF or Excel), it is parsed, and the operations show in the UI. We define the data format we need (income/expense...).
   Keep a "Bank API" endpoint placeholder for the future.
2. **Bank/aggregator cabinet stays**, but as the *same* admin panel with role permissions.
   When Super Admin creates a merchant there is a **checkbox**: ON means an aggregator (can show/hide services for its users, create users, white-label);
   OFF means a plain service partner (only sees its users, which bank they come from, counts).
3. **Multi-tenant via subdomains**: `ipakyuli.gluon.uz` with the bank's logo, theme and selected services. Later a custom domain (`business.ipakyulibank.uz`) via CNAME.
   **One user database**: a user can log in from any domain and is **redirected** to their aggregator's tenant.
   Possible later need: export tenant data to the bank's own server via an API.
   Onboarding cases: the bank issues login/password at a branch, *or* the user self-registers on the tenant domain.
4. **Startup integrations: a maximum of 5.** Final list from the Gluon team by **Friday 2026-11-27**.
   Status: RoboHub confirmed, Billz API ready, Knox pending, Deliver not met yet.
5. **Infrastructure providers**: SMS/OTP is Play Mobile, email is SMTP, payments are Plum for now (Payme/Click/Atmos considered stronger; can switch later).
6. **Banking section redesign**: drop the current abstract dashboards and charts. Show a **list of banks / bank products**
   (credits, installments, cards, ...) with data filled in manually, and a **"Connect / Open settlement account"** button, which opens a lead form that goes to the bank (referral).
   Rename "Gluon Store / Магазин Gluon" for the bank-offers page to something like **"Bank offers" (Предложения банков)**; the real Gluon Store stays the service marketplace.
   Details of the statement-import UI come from the Gluon team (Detail project) by Friday.
7. **Design**: the Figma design is outdated. **We build a clickable prototype in code (React + TS + Vite)** instead of Figma,
   **role-based with a role switcher** at the top: Gluon user (merchant), Merchant/partner admin, Super Admin, plus what a **startup** (e.g. Deliver) and a **bank** see.
   A design audit happens after the prototype. Deadline: **Friday 2026-11-27**.

## Action items
- **Us (Udevs):** code prototype covering all roles; update Miro (BPMN/mind map) to match the decisions; spec of the data format needed from the OCR/statement API.
- **Gluon team:** final list of 5 startups; statement-import (Detail) API and docs; bank-section content; sync on Friday.

Chat: "Gluon 2.0" group (Yandex).

## Figma map (file IEeGE0egSHKrdwwVqjXnoZ)
- **Design (Light)** `4008:6204` / **Design (Dark)** `4656:71763`: merchant app
  - Вход (login) `4008:20990`, Регистрация `4008:21829`, Главный экран (dashboard) `4017:7765`
  - Billz `4030:19787`, Мой склад `4030:20911`, Robosell `4030:21368`, Gluon Архив `4030:21855`, Магазин Gluon (bank comparison) `4030:22301`, Онлайн Банкинг `4037:20805`
  - Профиль `4037:27917`, Чат с поддержкой `4037:27918`, Пополнение баланса `4037:27919`, Интеграция `4511:18195`
  - tablet (834) and mobile (375) variants of each
- **Merchant Admin Panel** `4997:45185`: login, dashboard, companies, tickets, profile, chat
- **Bank Admin Panel** `5123:4032`: login, dashboard, companies, financial analytics, profile, tickets, chat
- Components `4008:20953`, System (tokens) `1:275`, Icons `6:270`

Visual language: primary dark teal (~#2F5B55), accents yellow (#D4AF37-ish) and green, light grey page background, white rounded cards,
pill top-nav, Russian copy by default.
