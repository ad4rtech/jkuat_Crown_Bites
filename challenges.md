# ⚠️ Crown Bites ROKMS — Challenges & Recommendations

> _A candid reflection on the 7 key challenges encountered during the design and development of the Crown Bites Restaurant Operations & Kitchen Management System, alongside practical recommendations for addressing each._

---

## 📑 Table of Contents

1. [WhatsApp Delivery Receipts](#challenge-1--whatsapp-delivery-receipts)
2. [Email Delivery](#challenge-2--email-delivery)
3. [State Management](#challenge-3--state-management)
4. [M-Pesa STK Push Integration](#challenge-4--m-pesa-stk-push-integration)
5. [Real-Time Synchronisation Across Devices](#challenge-5--real-time-synchronisation-across-devices)
6. [Row Level Security & Notification Persistence](#challenge-6--row-level-security--notification-persistence)
7. [Table Lifecycle State Complexity](#challenge-7--table-lifecycle-state-complexity)

---

## Challenge 1 — WhatsApp Delivery Receipts

### 🔴 The Challenge

The original product vision included sending automated WhatsApp notifications to customers when their order is ready or when their M-Pesa payment has been confirmed — providing a professional, branded customer-facing communication channel. WhatsApp Business API (via Meta's Cloud API) requires:

- A verified Meta Business Account.
- An approved WhatsApp Business phone number.
- Pre-approved message templates (which must pass Meta's review process, taking 24–72 hours per template).
- A publicly reachable HTTPS webhook URL for delivery status callbacks.

During the MVP phase, none of these prerequisites were in place, and the Meta approval cycle introduced unacceptable delays for a feature that was not critical to core operations.

### ✅ Recommendations

1. **Phase WhatsApp into a v2 release.** Separate the customer notification feature from the internal staff communication system so it does not block the MVP go-live.
2. **Use the WhatsApp Business Cloud API** (free tier via Meta) combined with a **Supabase Edge Function** as the webhook handler. The Edge Function would:
   - Receive the `messages.statuses` webhook event from Meta.
   - Update a `delivery_status` column in the `orders` table.
   - Trigger a Supabase Realtime event to notify the cashier dashboard.
3. **Design message templates in advance.** Template examples:
   - _"Hi [Customer Name], your order at Crown Bites Table [X] is ready! 🍽️"_
   - _"Payment of KES [Amount] received for Table [X]. Enjoy your meal!"_
4. **As an interim measure**, use **Africa's Talking SMS API** (already widely supported in Kenya) to send order-ready and payment-confirmed SMS messages. This requires only an API key — no business verification needed.

---

## Challenge 2 — Email Delivery

### 🔴 The Challenge

Automated email receipts were planned for cashier-confirmed payments — sending itemised bills to customers' email addresses after checkout. The challenges encountered were:

- Collecting customer email addresses at the point of sale adds friction and slows down high-volume table turnover.
- Expo/React Native does not have native SMTP email capabilities — all email sending must be offloaded to a backend service.
- Free email providers (Gmail SMTP) have rate limits and are not suitable for transactional restaurant use.
- HTML receipt email templates require careful cross-client design (Outlook renders differently to Gmail).

### ✅ Recommendations

1. **Integrate Resend.com or SendGrid** as the transactional email provider, triggered from a **Supabase Edge Function**. Both offer generous free tiers (Resend: 3,000 emails/month free; SendGrid: 100/day free) and excellent developer experience.
2. **Make email optional at checkout.** Add a "Send Receipt to Email?" toggle in the cashier's Bill Detail screen. If toggled on, a single `TextInput` field appears for the email address. If left off, no email is sent.
3. **Template the receipt email in HTML** using a minimal, responsive table layout. The email should include:
   - Crown Bites logo and branding.
   - Order items, quantities, and unit prices.
   - Subtotal, Service Charge, VAT, and Grand Total.
   - Payment method and timestamp.
4. **Store email address in the `orders` table** (`customer_email TEXT NULL`) so receipts can be re-sent on demand from the Manager's dashboard if a customer requests a duplicate receipt.

---

## Challenge 3 — State Management

### 🔴 The Challenge

As the application grew to serve 4 distinct roles with overlapping but different data needs, managing shared state without re-renders or data staleness became complex. Specific issues included:

- **Stale order data**: The Waiter's dashboard would not reflect the latest order status after navigating away and returning, because the store was not re-fetching on screen focus.
- **Cross-store dependencies**: `orderStore` needed to trigger updates in `tableStore` (e.g., marking an order as paid needed to simultaneously update the table's status). This created implicit cross-store coupling that was difficult to trace.
- **Realtime subscription conflicts**: Multiple screens subscribing to the same Supabase Realtime channel caused duplicate event handling and occasional double-updates.

### ✅ Recommendations

1. **Use `useFocusEffect` consistently** on all list screens to re-fetch data whenever the screen comes back into focus. This ensures the UI is always fresh after navigation without needing aggressive real-time polling.
2. **Strictly separate store responsibilities.** Each store should own exactly one domain:
   - `tableStore` — table shape and status only.
   - `orderStore` — order items, status transitions, payment status.
   - `kitchenStore` — kitchen display view of orders.
   - No store should directly call another store's actions. Instead, use a **mediator pattern** — update Supabase, and let Realtime subscriptions cascade the change to all relevant stores.
3. **Centralise Realtime channel subscriptions.** Create a single `useRealtimeSync` hook that subscribes to all channels (`orders`, `tables`, `notifications`) once at the root layout level, preventing duplicate subscriptions across screens.
4. **Add Zustand persistence** (`zustand/middleware/persist` + `AsyncStorage`) for configuration stores (billing config, service charge rate) so they survive app restarts without re-fetching from Supabase.

---

## Challenge 4 — M-Pesa STK Push Integration

### 🔴 The Challenge

Integrating Safaricom's Daraja M-Pesa STK Push API was one of the most technically demanding parts of the project. Key challenges included:

- **Sandbox vs. Production discrepancy**: The Safaricom sandbox environment returns fake success responses that do not reflect real payment flows, making accurate testing impossible without live credentials.
- **No webhook for immediate confirmation**: The STK push does not send an instant webhook callback — the app must poll Supabase or the Daraja API every few seconds to check the `payment_status`.
- **Customer dropoff**: If a customer takes more than 60 seconds to enter their PIN (or dismisses the prompt), the request times out. The app must gracefully reset the order to `unpaid` status without leaving it in a broken intermediate state.
- **STK Push requires a public HTTPS URL**: The Edge Function that handles the Daraja callback must be hosted at a publicly reachable URL, which Supabase Edge Functions provide automatically — but local development testing requires a tunnel (e.g., ngrok).

### ✅ Recommendations

1. **Keep STK push logic server-side only** via Supabase Edge Functions. Never expose Daraja API consumer keys in the React Native client bundle.
2. **Implement a robust polling loop** with clear timeout handling:
   - Poll every 5 seconds.
   - Maximum 12 polls (60 seconds).
   - On timeout: reset `payment_status` to `unpaid` in Supabase and show a clear error toast.
3. **Add a Daraja callback webhook handler** as a separate Edge Function endpoint that Safaricom calls directly. This allows the `payment_status` to update instantly on successful payment without waiting for the next poll cycle.
4. **For testing**, use [Safaricom's Express Sandbox](https://developer.safaricom.co.ke/) and simulate payment callbacks manually via the Supabase SQL Editor to set `payment_status = 'paid'` and verify the polling loop responds correctly.

---

## Challenge 5 — Real-Time Synchronisation Across Devices

### 🔴 The Challenge

The system is designed to work across multiple simultaneously active tablets — one for each Waiter, one for the Kitchen, and one for the Cashier. Ensuring all devices reflect the same live state introduced significant challenges:

- **Realtime subscription drops**: Supabase Realtime WebSocket connections disconnect silently on poor Wi-Fi, causing a device to miss updates until it manually re-fetches.
- **Race conditions**: Two Waiters could theoretically tap "Assign Table" on the same available table within milliseconds of each other, causing a double-assignment.
- **Optimistic UI mismatch**: Updating the local store immediately (for perceived speed) before the Supabase write completes could result in a brief UI state that contradicts the database if the write fails.

### ✅ Recommendations

1. **Add a Realtime connection health indicator** — a small coloured dot in the header that turns red when the WebSocket connection drops, prompting staff to refresh or check Wi-Fi.
2. **Implement database-level uniqueness constraints** to prevent race conditions. For example:
   - A Postgres trigger or row-level lock on the `tables` table that rejects a status update to `occupied` if the table is already `occupied`.
   - The second Waiter's request will fail gracefully, and they will be shown an error toast: _"Table was just assigned by another staff member."_
3. **Use a heartbeat-based subscription reconnect** in the Realtime client. If no message is received within 30 seconds, force a re-subscribe and re-fetch.
4. **On app foreground** (using `AppState.addEventListener('change')`), always trigger a full data refresh to patch any updates missed while the app was backgrounded.

---

## Challenge 6 — Row Level Security & Notification Persistence

### 🔴 The Challenge

Supabase's Row Level Security (RLS) is a powerful feature but introduced a subtle and difficult-to-debug bug: **deleted notifications were reappearing after screen navigation**. The root cause was:

- The app's local Zustand store would remove the notification from state immediately (optimistic deletion).
- However, the Supabase `DELETE` call was being silently rejected by a missing RLS `DELETE` policy on the `notifications` table.
- Since RLS did not allow the anon key to delete rows, the row persisted in Supabase.
- When the user navigated back to the screen, `useFocusEffect` re-fetched all notifications from Supabase — restoring the "deleted" notification and making it appear that deletion had failed.

This class of bug is insidious because the UI appears to work correctly in the short term.

### ✅ Recommendations

1. **Always define all four RLS policy types** (SELECT, INSERT, UPDATE, DELETE) when creating a new table in Supabase. Do not assume that a permissive SELECT policy implies permissive DELETE.
2. **Check Supabase RLS errors explicitly** in the client. Supabase's JavaScript client returns `{ error: null }` even when RLS silently blocks a DELETE — instead check the returned `data` length or use `count` to verify the row was actually removed.
3. **Apply the fix** by running the following in the Supabase SQL Editor:
   ```sql
   CREATE POLICY "Allow delete for all"
   ON public.notifications
   FOR DELETE
   USING (true);
   ```
4. **Write a checklist for new tables**: Every new Supabase table should go through a RLS policy review — SELECT, INSERT, UPDATE, DELETE — before being considered complete.

---

## Challenge 7 — Table Lifecycle State Complexity

### 🔴 The Challenge

The original system had a simple 3-state table lifecycle: `available → occupied → available`. As business requirements evolved, the system needed to accommodate a more nuanced reality:

> _"After payment is confirmed, the table should NOT immediately become available — the guests are still eating. The table should only be freed once the waiter physically confirms the guests have left."_

Retrofitting a new `eating` state into an already-running system presented multiple cascading challenges:

- **TypeScript type errors**: The `TableStatus` and `OrderStatus` union types had to be updated across `lib/supabase.ts`, `tableStore.ts`, `orderStore.ts`, and multiple UI components simultaneously.
- **Conditional UI logic**: The Waiter's "Make Order" button, the Cashier's payment confirmation flow, and the Kitchen Display's "Collected" queue all had hardcoded assumptions about the previous 3-state system.
- **Cross-store action sequencing**: The `markPaid` action in `orderStore` had to be decoupled from `resetTable` in `tableStore`. What was one action (pay → free table) became two (pay → eating → waiter frees table).

### ✅ Recommendations

1. **Design the full state machine upfront** before writing any code. Model every possible state transition as a diagram:
   ```
   available → occupied (Assign Table)
   occupied  → ordered  (Order Submitted)
   ordered   → eating   (Payment Confirmed)
   eating    → available (Waiter Frees Table)
   ```
   Any gap in this diagram is a potential bug.
2. **Use a single, canonical `TableStatus` type** defined in one location (`lib/supabase.ts`) and imported everywhere. Never redefine the union type locally in component files.
3. **Model each status transition as an explicit, named store action** (e.g., `setTableEating`, `freeTable`, `markOrdered`) rather than inline status string updates scattered across components. This makes the business logic auditable and testable.
4. **Test state transitions in isolation** using a seeded Supabase test environment before connecting to the live UI.

---

_Crown Bites ROKMS — Challenges & Recommendations v1.0_  
_Built for Crown Bites Restaurant Operations_
