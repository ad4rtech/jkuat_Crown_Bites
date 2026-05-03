# 📖 Implementation Guide

## 🌐 View the Project

*(As this is a mobile point-of-sale and kitchen display system, there is no public web link. Internal staff will access the app via company tablets or Expo Go during testing).*

---

## 📱 App Guide

This guide covers how to set up, run, and use the **Crown Bites ROKMS** (Restaurant Operations & Kitchen Management System).

---

### 🛠️ Installation & Local Setup

To run the application locally on your machine for development or testing, follow these steps:

#### Prerequisites

- **Node.js** (LTS version recommended, v18+)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g eas-cli`)
- **Expo Go App** (installed on your iOS or Android testing device)

#### Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Crown_Bites
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   - Create a `.env` file in the root directory.
   - Add your Supabase API keys:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Run the Development Server:**
   ```bash
   npx expo start
   ```

5. **Open the App:**
   - Scan the QR code generated in your terminal using the **Expo Go** app on your phone or tablet.
   - Alternatively, press `a` in the terminal to launch an Android Emulator, or `i` for an iOS Simulator.

---

### 💡 User Guide & Workflows

#### 1. Onboarding & Authentication
- **Splash Screen & PIN Login:** Users are greeted with a branded splash screen, followed by a secure PIN login system. 
- **Role Selection:** Staff log in using a designated 4-digit PIN. The system automatically routes them to their role-specific dashboard based on their credentials.

#### 2. Waiter Workflow (Front of House)
- **Table Assignment:** The Waiter views a live restaurant floor plan. They select an `Available` (green) table and tap "Assign Table".
- **Order Taking:** The Waiter selects items from the digital menu, adjusts quantities, and submits the cart. The table status changes to `Ordered` (yellow).
- **Serving Food:** When the kitchen marks food as `Ready`, the Waiter receives a live notification. They deliver the food and click "Mark as Served" in the Active Orders tab. The table status shifts to `Eating`.
- **Payment & Freeing Table:** Waiters can trigger M-Pesa STK Pushes directly from the table, or direct the customer to the Cashier. Once the bill is paid, the Waiter clicks "Free Table" to reset the table to `Available`.

#### 3. Kitchen Workflow (Back of House)
- **Active Queue:** The kitchen display auto-sorts incoming tickets by urgency. Timers count up live, turning yellow at 10 minutes and red at 20 minutes overdue.
- **Preparation:** Chefs move tickets from `Pending` to `In Prep`.
- **Fulfillment:** Once plated, the Chef clicks "Mark Ready." The ticket moves to the `Ready for Pickup` queue and instantly alerts the Waiter. 
- **Collection:** Once the Waiter collects the food, the ticket automatically archives into the `Collected` queue.

#### 4. Cashier Workflow (Billing)
- **Billing Dashboard:** Cashiers have a centralized view of all active, unpaid tables.
- **Payment Processing:** 
  - **M-Pesa (Paybill):** Cashier verifies the transaction code and marks the bill paid.
  - **Cash:** Cashier enters the exact cash tendered. The system automatically calculates any necessary return change and prompts the Cashier.
- **Shift Reports (End of Day):** The Revenue Dashboard tracks total gross revenue, physical float, and logs all dispensed cash change to calculate the exact "Expected Cash in Till."

#### 5. Manager Workflow (Admin)
- **Menu Management:** Managers can access the "Manager Menu" screen to add, edit, or deactivate menu items and categories. Changes reflect instantly on Waiter tablets.

---

### 🚀 Deployment

#### Preview Build _(for testers)_

```bash
# Push an Over-The-Air (OTA) JavaScript update directly to testers
eas update --branch preview --message "describe changes" 

# Build a new testing APK (required if native libraries/dependencies are modified)
eas build --profile preview --platform android
```

#### Production

```bash
# Build a production-ready Android App Bundle (AAB) for Google Play release
eas build --profile production --platform android
```

---

### 🧪 Testing

To test the application:
- Ensure your `.env` variables point to your staging/development Supabase instance.
- Run `npx expo start` and connect a tablet via Expo Go.
- *Recommended:* Connect at least two devices (one logged in as Waiter, one logged in as Kitchen) to test real-time WebSocket ticket synchronization and notifications.

---

### 📬 Support & Feedback

For issues, feature requests, or troubleshooting database connections, please contact the lead development team or open an issue on the internal repository.

---

_Built for Crown Bites Restaurant Operations_
