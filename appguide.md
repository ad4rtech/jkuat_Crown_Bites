# Crown Bites ROKMS - Application Guide

> _A seamless, real-time ecosystem connecting Waiters, Kitchen Staff, and Cashiers for unparalleled restaurant efficiency._

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features & Functionality](#features--functionality)
- [UI Design Rationale](#ui-design-rationale)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Best Practices & Standards](#best-practices--standards)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## Project Overview

**Crown Bites ROKMS (Restaurant Operations & Kitchen Management System)** is a comprehensive, tablet-first mobile application designed to streamline the entire dining lifecycle of a modern restaurant. 

The application facilitates end-to-end communication from the moment a customer sits down to the final payment, designed specifically for Waiters, Kitchen Staff, Cashiers, and Managers. By utilizing real-time database synchronization, it eliminates paper tickets, reduces wait times, and drastically minimizes human error during peak service hours.

---

## Features & Functionality

### Role-Based Access Control

The application serves 4 primary user roles:

- **Waiter**:
  - Interactive floor plan for table assignment and status monitoring (Available, Occupied, Eating).
  - Digital menu for taking and editing orders instantly.
  - Real-time notifications when food is ready.
  - Initiate M-Pesa STK Push payments or request Cashier assistance directly from the table.

- **Kitchen Staff**:
  - Live, auto-sorting queue of active orders categorized by urgency (Pending, In Prep, Ready).
  - One-tap status updates that instantly notify Waiters.
  - Visual color-coded timers to highlight overdue tickets.

- **Cashier**:
  - Comprehensive billing dashboard for finalizing Cash and Paybill transactions.
  - Real-time shift reporting, tracking expected cash in the till and dispensed change.
  - Automated service charge and tax (VAT) calculations.

- **Manager**:
  - Menu and category management (activate/deactivate items).
  - High-level oversight of revenue and shift reports.

### Core Modules

- **Table Management**: Visual mapping of the restaurant floor with live status indicators.
- **Order Processing**: The central nervous system moving orders from Waiter → Kitchen → Cashier.
- **Real-Time Notifications**: Instant, role-specific alerts (e.g., "Food Ready", "Cash Payment Requested") utilizing Supabase Realtime.
- **Payment & Billing**: Integrated STK Push logic and cash management with precise change calculations.

---

## UI Design Rationale

The interface is designed to be **warm, professional, and highly legible**, reflecting the premium hospitality of the Crown Bites brand.

- **Color Palette**: 
  - **Earthy Tones** (`#fdfaf5`, `#f4ebe1`): Used for backgrounds to reduce eye strain and evoke a warm, dining atmosphere.
  - **Crown Orange** (`#db8221`): The primary accent color used for primary actions, branding, and active states.
  - **Status Colors**: Standardized semantic colors (`#10b981` Green for Available/Success, `#f59e0b` Yellow for Pending, `#ef4444` Red for Occupied/Urgent).
- **Typography**:
  - **Lexend**: Used exclusively across the app. Lexend was chosen for its exceptional legibility and modern geometric feel, ensuring staff can quickly read tickets and totals in fast-paced environments.
- **Visual Hierarchy**: Heavy reliance on "glassmorphism" bottom sheets, distinct card borders, and animated micro-interactions to guide the user's eye to the most urgent tasks (like flashing red timers in the kitchen).
- **Responsiveness**: **Tablet-first** design using fluid React Native stylesheets, optimized for landscape or large-screen point-of-sale devices.

---

## Technologies Used

### Frontend

| Technology | Purpose |
|---|---|
| React Native & Expo | Core mobile framework for cross-platform (iOS/Android) deployment |
| React Native Reanimated | Fluid, 60fps micro-animations and layout transitions |
| Lucide React Native | Clean, consistent, and scalable vector iconography |

### State Management

| Technology | Purpose |
|---|---|
| Zustand | Lightweight, fast global state management (separated into `orderStore`, `kitchenStore`, `cashierStore`, `tableStore`, etc.) |
| React Context | Localized UI state handling |

### Backend & Services

| Service | Purpose |
|---|---|
| Supabase | PostgreSQL database, Row Level Security (RLS), and Realtime WebSocket subscriptions |
| Expo SecureStore | Secure, encrypted storage of authentication tokens |

---

## Getting Started

### Prerequisites

- Node.js `v18.x` or higher
- Expo CLI (`npm install -g eas-cli`)
- A Supabase Project (with the corresponding SQL schema applied)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/crown-bites-rokms.git

# Navigate into the project
cd crown-bites-rokms

# Install dependencies
npm install
```

### Running Locally

```bash
# Start the Expo development server
npx expo start

# Press 'a' to open in Android Emulator, or 'i' for iOS Simulator
```

---

## Project Structure

```
Crown_Bites/
├── app/                  # Main Expo Router directory (screens)
│   ├── (tabs)/           # Role-based dashboard tabs (waiter, kitchen, cashier)
│   ├── _layout.tsx       # Root layout and Auth provider
│   └── index.tsx         # Splash screen and Login routing
├── components/           # Reusable UI components (Modals, Toasts, Cards)
├── assets/               # Fonts (Lexend), Images, and App Icons
├── lib/                  # Utility functions (timeFormat, Supabase client)
├── store/                # Zustand stores for state management
├── supabase/             # SQL schemas, RLS policies, and Edge Functions
└── app.json              # Expo configuration
```

---

## Best Practices & Standards

- **Store Segregation**: State is strictly separated by domain (`orderStore.ts`, `tableStore.ts`, `kitchenStore.ts`) to prevent monolithic state files and improve maintainability.
- **Optimistic UI Updates**: Network requests are accompanied by immediate local state updates (e.g., clearing a table or marking an order as served) to make the app feel instant, followed by background synchronization.
- **Type Safety**: The app utilizes TypeScript interfaces mapped directly to the Supabase database schema (`DbOrder`, `DbTable`).
- **Graceful Error Handling**: Custom `CenterToast` components are used consistently to provide non-intrusive feedback for network failures or validation errors.

---

## Environment Variables

Create a `.env` file in the root of the project with the following variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore`.

---

## Deployment

### Preview / Testing Build

```bash
# Push a JS update (Over-the-Air update, no reinstall needed)
eas update --branch preview --message "Implemented Eating table state"

# Build a new APK (needed when native code/packages change)
eas build --profile preview --platform android
```

### Production

```bash
# Build production app bundle (AAB) for Google Play Store
eas build --profile production --platform android
```

---

## License

Private / Proprietary — property of Crown Bites.

---

_Built for Crown Bites Restaurant Operations_
