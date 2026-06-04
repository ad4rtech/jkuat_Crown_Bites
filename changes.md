# 🔄 Crown Bites ROKMS — Implemented System Documentation

> _This document adjusts the original proposal (LAN-based XAMPP/PHP/MySQL) to accurately reflect the cloud-based React Native + Supabase system that was implemented._

---

## 2.2.3 Illustrations and Architecture Diagrams of Existing Systems

The architectural diagrams in Figures 2.1–2.3 illustrate the structural layout of each reviewed system. Both iKo POS and Peach POS follow cloud-connected architectures dependent on internet connectivity and thermal printers. A key gap across all three is the absence of a fully integrated real-time role-based workflow and automated M-Pesa STK Push. These gaps directly informed the Crown Bites ROKMS design.

---

## 2.3 Implemented System Architecture and Functionality

### 2.3.1 System Architecture

Crown Bites ROKMS uses a **three-tier cloud-based architecture** backed by Supabase. All devices connect to a centralised PostgreSQL database over WiFi. Real-time synchronisation uses Supabase Realtime WebSocket channels.

- **Presentation Tier**: React Native (Expo) app on staff tablets, with role-specific screens per PIN.
- **Application Logic Tier**: Zustand stores (`orderStore`, `tableStore`, `kitchenStore`, `cashierStore`, `stockStore`) and Supabase Edge Functions for M-Pesa.
- **Data Tier**: Supabase PostgreSQL storing orders, tables, menu items, inventory, notifications, shift reports, and PINs.

```
+---------------------------------------------------------------+
|  CROWN BITES ROKMS ARCHITECTURE (CLOUD + REALTIME)           |
+---------------------------------------------------------------+

PRESENTATION TIER
+----------------+  +------------------+  +--------------------+
| Waiter Tablet  |  | Kitchen Display  |  | Manager Dashboard  |
| (Expo RN App)  |  | (Expo RN App)    |  | (Expo RN App)      |
+-------+--------+  +--------+---------+  +---------+----------+
        |                    |                       |
        +--------+-----------+-----------------------+
                 |  HTTPS + WebSockets (Supabase Realtime)
                 v
APPLICATION / LOGIC TIER
+--------------+  +------------------+  +----------------------+
| orderStore   |  | stockStore       |  | Billing + M-Pesa     |
| tableStore   |  | kitchenStore     |  | Supabase Edge Fn     |
+--------------+  +------------------+  +----------------------+
                         |
                         v
DATA TIER (Supabase PostgreSQL)
+-----------+  +------------+  +---------+  +----------------+
| orders    |  | order_items|  | tables  |  | menu_items     |
+-----------+  +------------+  +---------+  +----------------+
| notifications| stock_items|  |role_auth|  | shift_reports  |
+-------------+  +-----------+  +---------+  +----------------+
```
**Figure 2.4: Crown Bites ROKMS Three-Tier Cloud Architecture (Implemented)**

---

### 2.3.2 System Functionality

**i. Order Capture and Transmission**

The waiter views a live floor plan — tables colour-coded green (Available), yellow (Ordered), red (Occupied/Eating). After assigning a table and browsing the menu by category, the waiter submits the cart. The order is written to Supabase and a Realtime event instantly delivers the ticket to the Kitchen Display on all connected devices.

**ii. Food Availability Checking**

The Manager toggles menu item availability from the Manager Dashboard. When toggled off, the item is instantly removed from all Waiter menus via Realtime. The Inventory Dashboard surfaces a live low-stock alert for items below their reorder threshold, prompting proactive deactivation.

**iii. Kitchen Order Management**

The KDS auto-sorts orders by urgency with live timers: green (0–9 min), yellow (10–19 min), red (20+ min). Kitchen staff advance orders: Pending → In Prep → Ready → Eating. When marked Ready, the Waiter receives an instant in-app notification.

**iv. Automated Billing and M-Pesa Payment**

The Cashier's dashboard lists all unpaid tables. Bills include configurable Service Charge and **16% VAT**. Three payment flows:
- **Cash**: Enter tendered → system calculates return change → toast notification → recorded in Shift Report.
- **M-Pesa STK Push**: Enter customer phone → Daraja API via Edge Function → poll every 5s (60s max) → confirm or fail.
- **M-Pesa Paybill**: Manual code verification → mark paid.

After payment, table moves to **Eating** (not Available). The Waiter manually taps **"Free Table"** when guests leave.

**v. Stock Management**

Manager defines stock stations and items (name, quantity, unit, threshold). Menu items link to ingredients. Each confirmed order auto-deducts stock. The Inventory Dashboard shows a 2×2 KPI grid, per-item progress bars, and a Stock Alerts modal.

---

### 2.3.3 System Flow Diagrams

```
USE CASE DIAGRAM - Crown Bites ROKMS (Implemented)

[WAITER]                         [KITCHEN STAFF]
|-- View Live Table Floor Plan   |-- View Incoming Order Queue
|-- Assign Table                 |-- Update Order Status (4 stages)
|-- Browse Menu by Category      |-- Monitor Live Urgency Timers
|-- Submit Order (realtime KDS)  |-- View Collected Orders Tab
|-- Receive Food Ready Notif.
|-- Mark Order as Served
|-- Initiate M-Pesa STK Push
|-- Request Cashier (Cash)
|-- Free Table after Guests Leave

[CASHIER]                        [MANAGER]
|-- View All Unpaid Tables       |-- Add/Edit/Deactivate Menu Items
|-- Open Itemized Bill           |-- Manage Food Categories
|-- Apply Discount               |-- Monitor Inventory Levels
|-- Process Cash + Change        |-- Add/Update Stock & Thresholds
|-- Process M-Pesa STK Push      |-- View Sales Analytics
|-- Process M-Pesa Paybill       |-- Configure VAT & Service Charge
|-- View Shift Revenue Report    |-- Change Staff Role PINs
```
**Figure 2.5: Use Case Diagram — Crown Bites ROKMS (Implemented)**

---

```
CONTEXT DIAGRAM (DFD Level 0)

WAITER   ──Order Details──>  [CROWN BITES ROKMS]  <──Config/Stock── MANAGER
         <─Food Ready Notif─  React Native +        ──Reports/Alerts─>
                              Supabase
KITCHEN  <──Order Ticket───  [CROWN BITES ROKMS]  ──Bill/Payment──> CASHIER
         ──Status Update──>                        <─Payment Confirm─

                              [CROWN BITES ROKMS]
                                     |
                                     v
                             SAFARICOM DARAJA
                             M-Pesa STK Push API
```
**Figure 2.6: Context Diagram (DFD Level 0)**

---

```
DFD LEVEL 1 - ORDER, PAYMENT & TABLE LIFECYCLE

[Waiter submits cart]
        |
        v
1.0 Capture & Submit Order --> Supabase (orders + order_items)
        |
        | Realtime event
        v
[Kitchen receives ticket instantly]
        |
        | Chef: Pending > In Prep > Ready
        v
2.0 Notify Waiter --> notificationStore (Realtime push)
        |
        | Waiter marks as Served
        v
3.0 Order/Table --> "Eating" (NOT Available yet)
        |
        | Customer pays
        v
4.0 Generate Bill (Subtotal + Service Charge + 16% VAT)
        |
      +---+---+
      |       |       |
  4a.Cash  4b.STK  4c.Paybill
  Change   Push    Manual
  Toast    Poll    Verify
      |       |       |
      +---+---+-------+
              |
              v
5.0 Table remains "Eating" (Free Table button activates)
              |
              | Waiter taps Free Table
              v
6.0 Table --> "Available" | Sale saved to shift reports
```
**Figure 2.7: DFD Level 1 — Order Processing, Payment & Table Lifecycle**

---

```
ERD - Crown Bites ROKMS Database

tables(id PK, name, seats, zone, shape, status)
    |1
    |N
orders(id PK, table_id FK, status, payment_status,
       payment_method, total_amount, mpesa_receipt,
       checkout_request_id, created_at)
    |1
    |N
order_items(id PK, order_id FK, name, qty, unit_price)

role_auth(id PK, role, pin)

notifications(id PK, title, body, type, created_at)

shift_reports(id PK, total_revenue, cash_revenue,
              mpesa_revenue, cash_tendered,
              change_dispensed, expected_till, date)

stock_stations(id PK, name)
    |1
    |N
stock_items(id PK, station_id FK, name, quantity,
            unit, threshold, status, linked_menu_count)

menu_items(id PK, category_id FK, name, price,
           description, is_available)

NOTE: order_items stores name and unit_price at order
time to preserve billing accuracy if menu prices change.
```
**Figure 2.8: Entity Relationship Diagram — Crown Bites ROKMS**

---

## 2.4 System Design Requirements

### 2.4.1 Hardware Requirements

No dedicated on-site server or thermal receipt printer is required.

| Component | Specification | Purpose |
|---|---|---|
| Staff Tablets (×3 min) | Android 8.0+ or iOS 14+, 7–10 inch, WiFi | Waiter, Kitchen Display, Cashier |
| WiFi Router | Dual-band, 15+ devices | Internet access for all tablets |
| Manager Workstation | Any WiFi-capable device | Manager dashboard access |

**Table 2.2: Hardware Requirements**

---

### 2.4.2 Software Requirements

| Component | Specification | Purpose |
|---|---|---|
| React Native + Expo SDK 51+ | Mobile Framework | Cross-platform iOS/Android tablet app |
| TypeScript 5.x | Language | End-to-end type safety |
| Zustand 4.x | State Management | Domain-specific stores |
| React Native Reanimated 3.x | Animations | 60fps transitions |
| Expo Router 3.x | Navigation | File-based routing |
| Supabase (PostgreSQL) | Backend & Database | All data storage and auth |
| Supabase Realtime | WebSockets | Live cross-device updates |
| Safaricom Daraja API v3 | Payments | M-Pesa STK Push |
| Expo EAS Build + Update | Deployment | APK builds and OTA updates |

**Table 2.3: Software Requirements**

---

### 2.4.3 Functional Requirements

| Req. ID | Functional Requirement | User |
|---|---|---|
| FR-01 | Authenticate all staff via 4-digit role PIN and route to correct dashboard | All |
| FR-02 | Display live colour-coded floor plan (green/yellow/red table states) | Waiter |
| FR-03 | Allow waiter to assign a table, browse menu by category, and submit a cart | Waiter |
| FR-04 | Transmit confirmed orders to Kitchen Display in real time via Supabase Realtime | System |
| FR-05 | Allow kitchen staff to advance orders: Pending → In Prep → Ready → Eating | Kitchen |
| FR-06 | Send in-app notification to Waiter when order is marked Ready | System |
| FR-07 | Allow Manager to toggle menu item availability, updating all Waiter menus via Realtime | Manager |
| FR-08 | Generate itemized bill with configurable Service Charge and 16% VAT | System |
| FR-09 | Support Cash payment with automatic return change toast notification | Cashier |
| FR-10 | Support M-Pesa STK Push with auto-polling up to 60 seconds for confirmation | System |
| FR-11 | Display "Insufficient Funds" toast when cash tendered is below bill total | System |
| FR-12 | Transition table to "Eating" after payment — not immediately to "Available" | System |
| FR-13 | Allow Waiter to free table (→ Available) only after confirming guests have left | Waiter |
| FR-14 | Record all transactions in Shift Revenue Report (gross, cash, M-Pesa, change) | System |
| FR-15 | Allow Manager to add stock items and define reorder thresholds | Manager |
| FR-16 | Auto-deduct stock when a linked menu item is ordered | System |
| FR-17 | Surface low-stock alerts on Manager Dashboard when items fall below threshold | System |
| FR-18 | Allow Manager to change staff PINs with a confirmation dialog | Manager |

**Table 2.4: Functional Requirements**

---

### 2.4.4 Non-Functional Requirements

| Req. ID | Category | Non-Functional Requirement |
|---|---|---|
| NFR-01 | Performance | Order updates shall reach all devices within 1–2 seconds via Realtime |
| NFR-02 | Performance | System shall support 15+ concurrent devices without UI degradation |
| NFR-03 | Usability | All interfaces navigable by untrained staff within 30 minutes |
| NFR-04 | Usability | All touch targets minimum 48×48px |
| NFR-05 | Reliability | Re-fetch all data on screen focus to recover from missed Realtime events |
| NFR-06 | Security | Staff PINs stored in Supabase with RLS policies |
| NFR-07 | Security | Daraja API credentials never in client bundle — proxied via Edge Functions only |
| NFR-08 | Security | Role-based screen access enforced (Waiters cannot access Billing or Inventory) |
| NFR-09 | Maintainability | State separated into domain-specific Zustand stores |
| NFR-10 | Scalability | Database accommodates 50 tables, 300 menu items, 500 daily orders |
| NFR-11 | Compliance | All bills include 16% VAT per KRA requirements |
| NFR-12 | Data Integrity | Foreign key constraints across orders, order_items, and tables |

**Table 2.5: Non-Functional Requirements**

---

## Summary

The Crown Bites ROKMS as implemented is a cloud-hosted, real-time system accessible from any WiFi-connected tablet. It replaces the originally proposed XAMPP/LAN/PHP stack with a modern Supabase + React Native architecture that eliminates the need for on-site server hardware, thermal printers, or proprietary equipment. The five-state table lifecycle, integrated M-Pesa STK Push, automatic VAT-compliant billing, and live ingredient-level stock management collectively address the gaps identified across all three reviewed existing systems.

---
_Crown Bites ROKMS — Implemented System Documentation v1.0_
_Built for Crown Bites Restaurant Operations_
