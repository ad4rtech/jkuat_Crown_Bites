# 📦 Crown Bites ROKMS — Restaurant Operations & Kitchen Management System

> A seamless, real-time ecosystem connecting Waiters, Kitchen Staff, and Cashiers for unparalleled restaurant efficiency.

---

## 🚀 Project Overview

**Crown Bites ROKMS** is a tablet-first mobile application designed to digitize and streamline the entire lifecycle of a restaurant order, from table assignment to final payment.

Unlike generic point-of-sale (POS) systems, this platform focuses heavily on **real-time role collaboration**—ensuring that Waiters, Chefs, and Cashiers operate from a single source of truth without relying on easily lost paper tickets or constant verbal communication.

### Problems Addressed

- **Lost or illegible paper tickets** causing delayed or incorrect orders.
- **Communication bottlenecks** between the Front-of-House (Waiters) and Back-of-House (Kitchen).
- **Inefficient payment collection**, specifically regarding calculating manual change and tracking M-Pesa STK push timeouts.
- **Lack of shift accountability**, making it difficult for managers to track exact cash float and expected till revenue.

### Target Users

- **Waiters** — Floor staff who need a fast, visual way to assign tables, take orders, and be instantly notified when food is ready to serve.
- **Kitchen Staff** — Chefs and line cooks who need a clear, automatically-prioritized queue of what to cook next to prevent bottlenecks.
- **Cashiers** — Staff handling the till who need accurate, auto-calculated bills and automated M-Pesa integration to finalize transactions quickly.
- **Managers** — Admins who need to toggle menu item availability and review shift revenue.

---

## 📘 Product Requirements Document (PRD)

### Goals & Objectives

- **Increase operational efficiency** by eliminating manual ticket running.
- **Reduce friction in billing** by automating VAT, Service Charge, and M-Pesa STK integrations.
- **Improve customer satisfaction** by tracking order urgency and reducing food wait times.

**Success Criteria**

- Zero paper tickets required during a shift.
- M-Pesa payments completed directly from the table or cashier desk under 60 seconds.
- Waiters receive instant device notifications the exact second the kitchen marks food as "Ready".

### Scope

**In Scope (MVP)**
- Interactive restaurant floor plan with live table statuses.
- Real-time kitchen display system (KDS) with color-coded urgency timers.
- Integrated Cash and M-Pesa STK Push billing with change calculation.
- Shift revenue dashboard and transaction logs.
- Waiter and Kitchen customized push notifications.

**Out of Scope (MVP)**
- Advanced inventory management (ingredient-level tracking).
- Customer-facing ordering app (QR code ordering).
- Payroll and employee shift scheduling.

### User Personas

**The Waiter**
- Goal: To serve customers quickly, take accurate orders, and know exactly when food is ready.
- Pain Points: Walking back and forth to the kitchen to check on food; calculating split bills manually.

**The Kitchen Chef**
- Goal: To cook orders in the most efficient sequence possible.
- Pain Points: Interpreting messy handwriting; losing track of which order came first during a rush.

**The Cashier**
- Goal: To securely collect payments and ensure the till balances at the end of the shift.
- Pain Points: Customers sending M-Pesa to the wrong Paybill; manually calculating exact change during peak hours.

### Functional Requirements

- Secure PIN-based login mapping users to their specific roles.
- Synchronized database where an order's status (`Pending` -> `In Prep` -> `Ready` -> `Eating` -> `Served`) updates across all active devices instantly.
- Visual alerts for overdue orders (10+ mins = warning, 20+ mins = critical).
- Integrated STK Push system that polls Supabase for payment success/failure.
- Real-time calculation of Shift Cash Tendered vs Change Dispensed for accurate till reporting.

### Non-Functional Requirements

- **Performance**: Near-instant real-time updates via WebSockets.
- **Security**: Row Level Security (RLS) restricting database actions based on authenticated roles.
- **Usability**: High-contrast, tablet-optimized UI (Lexend font) designed for legibility in fast-paced, dimly lit restaurant environments.

### Assumptions & Constraints

- **Platform constraint**: Application is primarily optimized for Android tablets (Expo Go / APK).
- **Network Dependency**: Requires a stable internet connection for real-time syncing and STK Push.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React Native & Expo | Cross-platform mobile deployment and native access |
| Language | TypeScript | Strict type safety and interface definitions |
| State Management | Zustand | Fast, decentralized global state management |
| Animations | RN Reanimated | Fluid 60fps UI micro-interactions |
| Backend & Auth | Supabase | Postgres database, PIN Authentication |
| Realtime | Supabase Realtime | WebSocket live updates for orders and tables |

---

## 🧱 System Architecture

```
[Waiters / Kitchen / Cashier Tablets] (React Native App)
     ↓ (REST & WebSockets)
[Supabase Backend]
     ↓
   [Edge Functions] -> Safaricom M-Pesa Daraja API
     ↓
[PostgreSQL Database] (Stores Tables, Orders, Shift Reports)
```

> _Data flows synchronously. When a Waiter submits an order, it is inserted into Postgres. Supabase Realtime instantly pushes that new row to the Kitchen tablet. When the Kitchen marks it ready, Realtime pushes the update back to the Waiter, triggering an in-app notification._

---

## ✨ Features

### Current (MVP)

- ✅ Interactive visual floor plan mapping (Main Dining & Patio).
- ✅ Live Kitchen Display System with auto-sorting urgency queues.
- ✅ Custom Notification Engine (Toast alerts and persistent notification centers).
- ✅ Shift Revenue Dashboard tracking total expected cash flow.
- ✅ M-Pesa STK Push Integration.

### Planned / Future

- 🔜 Ingredient-level stock depletion.
- 🔜 Advanced historical analytics and graphs for Managers.
- 🔜 Kitchen receipt printing integration.

---

## ⚙️ Installation & Setup

### Prerequisites

- Node.js (LTS)
- npm or yarn
- Expo CLI
- Supabase Project

### Installation

```bash
git clone <repository-url>
cd Crown_Bites
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Development Server

```bash
npx expo start
```
_(Press `a` to open on an Android emulator or scan the QR code via Expo Go on a tablet)._

---

## ▶️ Usage

1. Launch the app to see the **Splash Screen**.
2. Enter your 4-digit **PIN** on the login screen.
3. Depending on your PIN, you will be routed to:
   - **Waiters**: The Floor Plan to assign tables and take orders.
   - **Kitchen**: The KDS (Kitchen Display System) to view incoming tickets.
   - **Cashier**: The Billing Dashboard to finalize payments.
4. Use the bottom/side navigation tabs to switch between your specific role modules (e.g., Notifications, Shift Reports, Active Orders).

---

## 📂 Project Structure

```
Crown_Bites/
├── app/
│   ├── (tabs)/           # Authenticated role-based dashboards
│   ├── _layout.tsx       # Root layout & Auth boundary
│   └── index.tsx         # Login PIN pad
├── components/           # Reusable UI (Modals, Toasts, Cards)
├── lib/                  # Supabase client and utilities
├── store/                # Zustand state (orderStore, kitchenStore)
└── supabase/             # SQL schema and DB policies
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "add: your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Submit a pull request
6. Follow existing TypeScript interfaces and component styles.

---

## 📄 License

This project is proprietary and owned by Crown Bites. All rights reserved.

---

_Built for Crown Bites Restaurant Operations_
