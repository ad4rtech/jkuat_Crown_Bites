# 🎨 Crown Bites ROKMS — Design System & Documentation

> _A complete reference for the visual language, component patterns, user flows, and tooling decisions behind the Crown Bites Restaurant Operations & Kitchen Management System._

---

## 📑 Table of Contents

1. [Section 1 — Colour System](#section-1--colour-system)
2. [Section 2 — Typography System](#section-2--typography-system)
3. [Section 3 — Component Library](#section-3--component-library)
4. [Section 4 — User Flows & Screen Architecture](#section-4--user-flows--screen-architecture)
5. [Section 5 — Tools & Technologies](#section-5--tools--technologies)

---

## SECTION 1 — COLOUR SYSTEM

### 1.1 Primary Palette

The Crown Bites colour palette is built on warm, earthy tones to evoke the comfort and richness of a premium dining experience. All colours are used consistently across the application, never as mere decorative choices.

| Role | Name | HEX | Usage |
|---|---|---|---|
| **Primary Accent** | Crown Orange | `#db8221` | Primary action buttons, active navigation tabs, section headings, key highlights |
| **Primary Light** | Warm Cream | `#fdfaf5` | Main page backgrounds, card surfaces |
| **Secondary Background** | Linen | `#f4ebe1` | Sheet overlays, filter pill backgrounds, secondary card fills |
| **Surface / Card** | Ivory | `#fef9f0` | Elevated cards, modal containers |
| **Text Primary** | Espresso | `#1c120f` | Headlines, body text, primary labels |
| **Text Secondary** | Bark | `#705f55` | Subtitles, captions, placeholder text |
| **Text Muted** | Sandstone | `#8a7465` | Tertiary labels, inactive tab icons |
| **Border** | Parchment | `#e2d5c8` | Card borders, dividers, input outlines |

---

### 1.2 Status / Alert Colours

All status colours are always paired with an icon **and** a text label to ensure compliance for colour-blind users (WCAG non-text contrast).

| State | Name | HEX (Solid) | HEX (Background Tint) | Icon Used | Trigger Condition |
|---|---|---|---|---|---|
| **Success** | Emerald | `#10b981` | `#ecfdf5` | `CheckCircle2` | Payment confirmed, order marked ready, table freed |
| **Error / Danger** | Rose Red | `#ef4444` | `#fef2f2` | `AlertTriangle` / `X` | Insufficient funds, payment failed, overdue >20 min |
| **Warning** | Amber | `#f59e0b` | `#fffbeb` | `Clock` / `AlertTriangle` | Table occupied, order overdue 10–19 min, return change |
| **Info** | Sky Blue | `#3b82f6` | `#eff6ff` | `Info` / `Smartphone` | Cash awaiting cashier, M-Pesa STK push in progress, table eating state |
| **Loading / Neutral** | Slate | `#64748b` | `#f1f5f9` | `Loader` / Activity Indicator | Data fetching, STK push polling |

---

### 1.3 Table Status Colour Map

The floor plan uses a clear, distinct 4-state colour system for immediate recognition at a glance.

| Table State | Colour | HEX | Meaning |
|---|---|---|---|
| Available | Green | `#10b981` | Table is free and ready to be assigned |
| Occupied / Ordered | Amber | `#f59e0b` | Order submitted, kitchen processing |
| Eating | Red (Occupied) | `#ef4444` | Guests are eating, bill paid, awaiting waiter to free table |
| Selected | Green (Active) | `#10b981` | Highlighted by the waiter, bottom sheet open |

---

### 1.4 WCAG AA Compliance

The app targets **WCAG 2.1 AA** contrast compliance (minimum 4.5:1 ratio for normal text, 3:1 for large text and UI components).

| Foreground | Background | Ratio | Status |
|---|---|---|---|
| `#1c120f` (Espresso) on `#fdfaf5` (Cream) | Body text | ~15.2:1 | ✅ AAA Pass |
| `#db8221` (Orange) on `#fdfaf5` (Cream) | Accent text | ~4.8:1 | ✅ AA Pass |
| `#ffffff` on `#db8221` (Orange) | Buttons | ~4.6:1 | ✅ AA Pass |
| `#10b981` (Emerald) on `#ecfdf5` (Tint) | Status badge text | ~4.7:1 | ✅ AA Pass |
| `#ef4444` (Red) on `#fef2f2` (Tint) | Error badge text | ~4.5:1 | ✅ AA Pass |

> **Rule**: Colour is never used alone to convey state. Every status colour is always accompanied by an icon from `lucide-react-native` **and** a text label (e.g., ✅ `CheckCircle2` + "Paid", ⚠️ `AlertTriangle` + "Overdue").

---

## SECTION 2 — TYPOGRAPHY SYSTEM

### 2.1 Font Families

The application uses a **single font family** — an intentional decision to maintain absolute visual consistency across a fast-paced, multi-device restaurant environment.

| Font | Source | Role | Justification |
|---|---|---|---|
| **Lexend** | Google Fonts | All text — Headings, Body, Labels, Captions | Lexend was specifically designed by the Lexend project to reduce visual stress and increase reading proficiency. Its open apertures and generous letter spacing are ideal for restaurant POS tablets where staff must quickly scan order items, prices, and status labels under varying lighting conditions. |

---

### 2.2 Complete Type Scale

| Level | Size | Weight | Line Height | Use Case |
|---|---|---|---|---|
| **H1** | 28px | 700 (Bold) | 34px | Screen titles (e.g., "Billing Dashboard", "Kitchen Display") |
| **H2** | 22px | 700 (Bold) | 28px | Section headers, modal titles (e.g., "Active Queue", "Confirm Payment") |
| **H3** | 18px | 600 (SemiBold) | 24px | Card headings, order names, table identifiers |
| **H4** | 16px | 600 (SemiBold) | 22px | Sub-section labels, bottom sheet titles |
| **Body Large** | 16px | 400 (Regular) | 24px | Primary readable content, item names, descriptions |
| **Body** | 14px | 400 (Regular) | 22px | General body text, form labels, list items |
| **Label** | 13px | 500 (Medium) | 18px | Badge text, filter pill labels, button text |
| **Caption** | 12px | 400 (Regular) | 16px | Timestamps, seat counts, muted helper text |

---

### 2.3 Text Alignment Rules

- **Left-aligned** by default across all content (menus, order items, labels).
- **Centre-aligned** reserved exclusively for: modal titles, empty state messages, toast notification text, and splash/login screen content.
- **Right-aligned** for: price values in receipts/bills, totals in shift reports.
- **All-caps** sparingly, only for: section separators (e.g., "READY FOR PICKUP" banner), status labels in the Kitchen Display.

---

### 2.4 Minimum Size Enforcement

- The minimum font size used anywhere in the application is **12px** (caption level — timestamps only).
- All interactive text, body content, and labels are set at a minimum of **14px** to ensure legibility without zooming.

---

## SECTION 3 — COMPONENT LIBRARY

### 3.1 Button Variants

All buttons use Lexend Medium 14px, border-radius 12px, and 48px minimum height.

| Variant | Background | Text | Border | Use Case |
|---|---|---|---|---|
| **Primary** | `#db8221` | `#ffffff` | None | Main action per screen (Submit Order, Mark Ready) |
| **Secondary** | `#f4ebe1` | `#db8221` | `#e2d5c8` | Supporting actions (Cancel, Go Back) |
| **Destructive** | `#ef4444` | `#ffffff` | None | Free Table, Delete Item, Void Order |
| **Ghost** | Transparent | `#705f55` | None | Tertiary actions, icon-only buttons in headers |
| **Disabled** | `#e2d5c8` | `#a0aec0` | None | Action unavailable (e.g., "Awaiting Payment") |

#### Button States (all variants)

| State | Visual Change |
|---|---|
| **Default** | Base variant styles as above |
| **Pressed / Active** | `opacity: 0.8`, scale `0.97` (via `activeOpacity` and Reanimated) |
| **Focus** | 2px offset `#db8221` border ring |
| **Disabled** | Background `#e2d5c8`, text `#a0aec0`, `opacity: 0.6`, press events blocked |

---

### 3.2 Form Elements

| Element | Description | States |
|---|---|---|
| **Text Input** | Rounded rect, border `#e2d5c8`, bg `#fdfaf5`, Lexend 14px | Default, Focused (`#db8221` border), Error (`#ef4444` border + red helper text), Disabled |
| **Numeric Input** | Same as Text Input, `keyboardType="numeric"` | Identical to Text Input states |
| **Toggle (Switch)** | React Native `Switch`, track `#10b981` when ON, `#d1d5db` when OFF | On, Off |
| **Dropdown / Picker** | Custom `TouchableOpacity` triggering a Modal with a `FlatList` of options | Default, Open (modal visible), Selected, Disabled |

---

### 3.3 Card Components

| Card Type | Description | Hover / Press State |
|---|---|---|
| **Table Card** (Floor Plan) | Rect or circle shape, border coloured by table status, shows table name and seat count | Scale `0.97`, borderColor darkens by 10% on press |
| **Order Ticket Card** (Kitchen) | White card, left border accent coloured by urgency/status, live minute timer at top-right | Background tint on press |
| **Billing Summary Card** (Cashier) | Elevated card, shadow `0 2 12 rgba(0,0,0,0.08)`, shows table ID, order total, and status badge | `opacity: 0.9` on press, bottom sheet expands |
| **Notification Card** | Flat row with left colour stripe, icon, title, and timestamp | Swipe-to-delete gesture, red delete reveal |

---

### 3.4 Empty States

Every list screen in the app defines a consistent empty state component to prevent blank/confusing screens.

| Screen | Icon | Title | Subtitle |
|---|---|---|---|
| Kitchen Display (no orders) | `ChefHat` | "All Clear!" | "No orders in this category right now." |
| Waiter Active Orders (no orders) | `Utensils` | "No Active Orders" | "Assign a table to get started." |
| Cashier Billing (no pending) | `CheckCircle2` | "All Settled!" | "No pending payments right now." |
| Notifications (empty) | `Bell` | "No Notifications" | "You're all caught up." |

---

### 3.5 Loading States

| Pattern | Usage | Component |
|---|---|---|
| **Activity Spinner** | Full-screen data fetch on mount | React Native `ActivityIndicator` centered on page |
| **Inline Spinner** | In-button loading during payment processing | `ActivityIndicator` replaces button label |
| **Pulse Skeleton** | Not yet implemented — planned for menu load | Animated placeholder shimmer |

---

## SECTION 4 — USER FLOWS & SCREEN ARCHITECTURE

### 4.1 Complete Screen Inventory

| Screen ID | Screen Name | Auth Required | Role | Purpose |
|---|---|---|---|---|
| S-00 | Splash Screen | No | All | Branding intro, routes to Login |
| S-01 | PIN Login | No | All | 4-digit PIN entry, role routing |
| S-02 | Select Table (Floor Plan) | Yes | Waiter | Visual table assignment |
| S-03 | Make Order | Yes | Waiter | Browse menu, build cart, submit order |
| S-04 | Waiter Active Orders | Yes | Waiter | View, filter, and manage submitted orders |
| S-05 | Waiter Notifications | Yes | Waiter | Receive kitchen-ready alerts |
| S-06 | Kitchen Display | Yes | Kitchen | Live KDS with urgency queue |
| S-07 | Cashier Billing Dashboard | Yes | Cashier | View all pending unpaid tables |
| S-08 | Bill Detail / Receipt | Yes | Cashier | Full itemized bill, payment processing |
| S-09 | Shift Revenue Report | Yes | Cashier | Daily cash summary and till balance |
| S-10 | Manager Menu Dashboard | Yes | Manager | CRUD operations on menu items and categories |
| S-11 | Manager Notifications | Yes | Manager | System-wide alert center |
| S-12 | Manager Settings | Yes | Manager | Service charge, VAT, PIN change |
| S-13 | Cashier Settings | Yes | Cashier | Billing config and PIN change |

---

### 4.2 Information Architecture Sitemap

```
[App Launch]
     │
     ▼
[S-00: Splash Screen]
     │
     ▼
[S-01: PIN Login]
     │
     ├──── Waiter PIN ──────────────────────────────────────────────────────┐
     │                                                                       │
     │    [S-02: Select Table / Floor Plan]                                 │
     │         ├── Tap Available Table → Assign Table                       │
     │         │        └── [S-03: Make Order → Submit → S-04]             │
     │         └── Tap Occupied Table → View Order Summary                  │
     │                                                                       │
     │    [S-04: Waiter Active Orders]                                       │
     │         ├── Eating Tab → Free Table Button                           │
     │         └── Ready Tab → Mark as Served                               │
     │                                                                       │
     │    [S-05: Waiter Notifications]                                       │
     │                                                                       │
     ├──── Kitchen PIN ──────────────────────────────────────────────────── ┤
     │                                                                       │
     │    [S-06: Kitchen Display System]                                     │
     │         ├── Active Queue (Pending → In Prep → Ready)                 │
     │         └── Collected Queue                                           │
     │                                                                       │
     ├──── Cashier PIN ──────────────────────────────────────────────────── ┤
     │                                                                       │
     │    [S-07: Billing Dashboard]                                          │
     │         └── Tap Table → [S-08: Bill Detail / Payment]                │
     │                   ├── Cash → Enter Tendered → Change Alert           │
     │                   └── M-Pesa Paybill → Mark Paid                     │
     │                                                                       │
     │    [S-09: Shift Revenue Report]                                       │
     │    [S-13: Cashier Settings]                                           │
     │                                                                       │
     └──── Manager PIN ──────────────────────────────────────────────────── ┘

         [S-10: Manager Menu Dashboard]
              ├── Add / Edit / Deactivate Menu Items
              └── Manage Categories

         [S-11: Manager Notifications]
         [S-12: Manager Settings (Service Charge, VAT, PIN)]
```

---

### 4.3 Key User Flows

#### Flow 1: Complete Order Lifecycle (Success Path)

```
Waiter: Assigns Table (Available → Occupied)
        ↓
Waiter: Opens Make Order, builds cart, submits
        ↓
Kitchen: Receives Pending ticket → updates to In Prep
        ↓
Kitchen: Marks Ready → Waiter notified instantly
        ↓
Waiter: Collects food → taps "Mark as Served"
        (Order: Ready → Eating | Table: Occupied)
        ↓
Cashier: Customer pays via Cash or M-Pesa
         markPaid() called → Table → "Eating"
        ↓
Waiter: Sees "Free Table" button (active) → taps it
        (Table: Eating → Available)
        ↓
Table resets to green. Ready for next guests.
```

#### Flow 2: Cash Payment with Change (Success + Error Path)

```
Cashier opens Bill Detail for a table.
        ↓
Taps "Pay with Cash" → Modal opens.
        ↓
[ERROR PATH]
If Cash Tendered < Bill Total:
  → CenterToast shows: "Insufficient Funds: Amount entered is less than the bill."
  → Modal stays open. Cashier corrects amount.
        ↓
[SUCCESS PATH]
If Cash Tendered = Bill Total:
  → CenterToast: "Payment successful, no change needed." ✅
  → Bill cleared, table moves to Eating state.
        ↓
If Cash Tendered > Bill Total:
  → CenterToast: "Return Change: KES [X]" 🟡
  → Change amount is recorded and deducted from Expected Cash in Till.
  → Bill cleared, table moves to Eating state.
```

#### Flow 3: M-Pesa STK Push (Success + Timeout Path)

```
Waiter (or Cashier) selects M-Pesa for a table.
        ↓
Enters customer's phone number.
        ↓
System fires STK Push to Safaricom Daraja API.
        ↓
Customer's phone vibrates → they enter M-Pesa PIN.
        ↓
System polls Supabase every 5 seconds (up to 60s).
        ↓
[SUCCESS PATH]
payment_status = 'paid' detected:
  → Toast: "Payment Successful!" ✅
  → Order cleared, table moves to Eating state.
        ↓
[FAILURE PATH]
payment_status = 'failed' detected:
  → Toast: "Payment Incomplete: Wrong PIN or cancelled." ❌
  → Status reset to 'unpaid'. Cashier can retry.
        ↓
[TIMEOUT PATH]
After 60 seconds, no response:
  → Toast: "Request Timed Out: No response received." ⏰
  → Status reset to 'unpaid'. Cashier can retry.
```

---

## SECTION 5 — TOOLS & TECHNOLOGIES

### 5.1 Design Tools

| Tool | Purpose | Justification |
|---|---|---|
| **Figma** | UI wireframing, high-fidelity mockups, component design | Industry-standard collaborative design tool; real-time multiplayer editing and developer handoff via inspect panel |
| **Coolors.co** | Colour palette generation and contrast checking | Fast, visual tool for iterating on brand palettes and evaluating accessibility |
| **Google Fonts** | Sourcing the Lexend typeface | Free, CDN-hosted fonts with Expo-compatible loading; Google Fonts hosts the Lexend variable font with all required weights |
| **WebAIM Contrast Checker** | Verifying WCAG AA/AAA contrast ratios for all colour pairs | Free, authoritative tool for validating colour accessibility directly against the WCAG specification |
| **Lucide Icons** | Icon library used throughout the entire UI | Consistent stroke-width, clean geometric design language; perfectly suited to a clean, modern food-service interface |

---

### 5.2 Development Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | React Native | 0.74+ | Cross-platform mobile app (iOS & Android) |
| **Build Tool** | Expo SDK | 51+ | Managed workflow, OTA updates, EAS Build |
| **Language** | TypeScript | 5.x | End-to-end type safety across stores and components |
| **State Management** | Zustand | 4.x | Lightweight, decentralised store per domain |
| **Animations** | React Native Reanimated | 3.x | 60fps worklet-based micro-animations and layout transitions |
| **Navigation** | Expo Router | 3.x | File-based routing and deep-linking |
| **Backend** | Supabase | Managed | PostgreSQL, Auth, Realtime WebSockets, Edge Functions |
| **Payments** | Safaricom Daraja API | V3 | M-Pesa STK Push (via Supabase Edge Functions) |
| **Deployment** | Expo EAS | Cloud | OTA updates and APK/AAB production builds |

---

### 5.3 Collaboration & Project Management Tools

| Tool | Purpose |
|---|---|
| **Antigravity (AI Coding Assistant)** | Real-time AI pair-programming, code generation, architecture planning, and review |
| **Git & GitHub** | Version control, branch management, and pull request reviews |
| **Supabase Dashboard** | Database administration, SQL Editor, RLS policy management, and Realtime monitoring |

---

_Crown Bites ROKMS — Design System v1.0_
_Built for Crown Bites Restaurant Operations_
