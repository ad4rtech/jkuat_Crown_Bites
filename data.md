# 📊 Crown Bites ROKMS — Data Entry Analysis

> _A complete reference for every input field, validation rule, error handling strategy, and data security measure in the Crown Bites Restaurant Operations & Kitchen Management System._

---

## 📑 Table of Contents

1. [Input Types](#1-input-types)
2. [Validation Rules](#2-validation-rules)
3. [Error Handling & Display](#3-error-handling--display)
4. [Input Assistance & UX Helpers](#4-input-assistance--ux-helpers)
5. [Form Structure & Layout](#5-form-structure--layout)
6. [Accessibility in Data Entry](#6-accessibility-in-data-entry)
7. [Data Security](#7-data-security)
8. [Data Entry Performance](#8-data-entry-performance)

---

## 1. Input Types

### 1.1 Complete Input Field Inventory

| # | Input Type | Field Name | Screen / Form | Justification |
|---|---|---|---|---|
| 1 | **Numeric PIN Pad** | Login PIN | S-01: PIN Login | A custom 4-button digit grid is used instead of a keyboard input to provide a fast, fat-finger-friendly authentication experience on a tablet. No keyboard pop-up required. |
| 2 | **Numeric Text Input** | New PIN | Change PIN (Manager Settings) | `keyboardType="number-pad"` forces a numeric-only keyboard. `secureTextEntry` masks digits for security. `maxLength={4}` hard-limits input. A standard text field is used here (vs. PIN pad) because this is an administrative form, not a live login screen. |
| 3 | **Numeric Text Input** | Confirm PIN | Change PIN (Manager Settings) | Mirror of the New PIN field to confirm the administrator entered the correct value before committing the change. |
| 4 | **Numeric Text Input** | Cash Tendered (KES) | Cashier: Bill Detail / Payment Modal | `keyboardType="numeric"` opens a decimal-capable number keyboard. A text field is used instead of a slider or stepper because the exact cash amount varies widely and is most efficiently entered by typing. |
| 5 | **Numeric Text Input** | Customer Phone Number | Payment: M-Pesa STK Push | `keyboardType="phone-pad"` opens the native phone number keyboard. Used over a dropdown because each transaction involves a unique phone number that cannot be predicted or pre-populated. |
| 6 | **Text Input** | Menu Item Name | Manager: Menu Item Form | Standard `keyboardType="default"`. A text input is appropriate here as menu names are freeform strings (e.g., "Grilled Tilapia", "Beef Stew"). |
| 7 | **Text Input** | Menu Item Description | Manager: Menu Item Form | Multiline text area (`multiline`, `numberOfLines={3}`). Descriptions benefit from multi-line entry to accommodate longer explanatory text. |
| 8 | **Numeric Text Input** | Menu Item Price (KES) | Manager: Menu Item Form | `keyboardType="decimal-pad"` allows decimal entry for prices like `450.50`. Chosen over a stepper because restaurant prices are arbitrary, not incremental. |
| 9 | **Numeric Text Input** | Discount Amount (KES) | Cashier: Discount Modal | `keyboardType="numeric"`. Allows cashier to enter a freeform cash discount value to deduct from the total before billing. |
| 10 | **Text Input** | Discount Reason | Cashier: Discount Modal | `keyboardType="default"`. An optional freeform text field to log the reason for the discount (e.g., "Manager comp", "Birthday offer"). |
| 11 | **Text Input (Search)** | Table Search | S-02: Select Table | Standard text input used to filter the floor plan by table name or zone. Chosen over a dropdown filter because the table list is short and inline filtering is faster. |
| 12 | **Dropdown / Custom Picker** | Menu Item Category | Manager: Menu Item Form | A custom `TouchableOpacity` that opens a modal list of existing categories. A standard system `Picker` is avoided as it does not match the app's design language. |
| 13 | **Role Selector (Card Grid)** | Target Role | Change PIN (Manager Settings) | A 2×2 grid of tappable role cards (Manager, Waiter, Kitchen, Cashier). A visual card grid is used instead of a dropdown to make role selection feel intentional and reduce mis-selection on a tablet's large screen. |
| 14 | **Toggle (Switch)** | Menu Item Availability | Manager: Menu Item Form | React Native `Switch` component. A binary toggle is the correct choice for an on/off state (Active / Inactive). Chosen over a dropdown ("Available"/"Unavailable") for speed. |
| 15 | **Toggle (Switch)** | Service Charge Enabled | Manager/Cashier Settings | Binary toggle to enable or disable the automatic service charge on all bills. |
| 16 | **Toggle (Switch)** | VAT Enabled | Manager/Cashier Settings | Binary toggle for enabling VAT (16%) on all bills, independent of the service charge. |

---

## 2. Validation Rules

### 2.1 Field-by-Field Validation

| Field | Rule | Error Message |
|---|---|---|
| **Login PIN** | Must be exactly 4 digits; must match a stored role PIN | _"Incorrect PIN. Please try again."_ |
| **New PIN (Change PIN)** | Must be exactly 4 digits (enforced by `maxLength={4}`) | _"PIN must be exactly 4 digits."_ |
| **Confirm PIN** | Must exactly match the New PIN field | _"PINs do not match."_ |
| **Cash Tendered** | Must be a valid number (not `NaN`); must be ≥ Grand Total | _"Please enter a valid amount."_ / _"Insufficient Funds: The amount entered is less than the bill amount."_ |
| **Customer Phone Number** | Must be at least 9 digits long | _"Please enter a valid phone number."_ |
| **Menu Item Name** | Required; cannot be empty or whitespace-only | _"Item name is required."_ |
| **Menu Item Price** | Required; must be a valid number greater than 0 | _"Please enter a valid price greater than 0."_ |
| **Menu Item Category** | Required; must have a valid category ID selected | _"Please select a category."_ |
| **Discount Amount** | Must be a valid number; must be greater than 0 | _"Enter a valid discount amount."_ |

---

## 3. Error Handling & Display

### 3.1 Error Display Strategy

The application uses a **consistent, non-blocking toast notification strategy** for all validation errors rather than inline field-level error labels.

| Approach | Used In Crown Bites? | Notes |
|---|---|---|
| **Inline errors** (below each field) | ❌ No | Not used — too disruptive on a fast-paced tablet POS interface |
| **Form-level banner** | ❌ No | Not used |
| **Real-time (as user types)** | ✅ Partial | Button disabled state updates in real time (e.g., the "Update PIN" button only activates when both PIN fields have 4 characters) |
| **On submission / on press** | ✅ Primary | Validation runs when the user taps the primary action button. The `CenterToast` component appears centred on screen with the appropriate colour and icon |

### 3.2 CenterToast Error Display Pattern

All errors surface through a single, reusable `CenterToast` component:

```
[AlertTriangle Icon]  "Insufficient Funds: The amount entered is less than the bill amount."
```

- **Colour**: Background tint of the appropriate status colour (`#fef2f2` for error, `#fffbeb` for warning).
- **Icon**: Always included alongside text (`AlertTriangle` for error, `Clock` for warning, `CheckCircle2` for success).
- **Duration**: Auto-dismisses after 2–3.5 seconds.
- **Position**: Centred on screen (not bottom snackbar) to ensure visibility regardless of keyboard state.

> ✅ **Colour is never used alone.** Every toast carries both an icon and a text message.

---

## 4. Input Assistance & UX Helpers

### 4.1 Implemented Helper Features

| # | Helper Type | Field | Justification |
|---|---|---|---|
| 1 | **Placeholder Text** | All text and numeric inputs | Every input field has placeholder text (e.g., `"e.g., 5678"`, `"Re-enter PIN"`, `"Item name..."`) to communicate the expected format without requiring a separate instruction label. |
| 2 | **Smart Keyboard Types** | Cash Tendered, Price, Phone, PIN | Each numeric field uses the most appropriate keyboard: `number-pad` for PINs, `numeric` for cash, `decimal-pad` for prices, `phone-pad` for M-Pesa. This eliminates the need for the user to switch keyboard modes manually. |
| 3 | **Character Limit (`maxLength`)** | PIN fields (New PIN, Confirm PIN, Login) | Hard capped at 4 characters. The keyboard automatically closes on Android once 4 digits are entered, giving instant tactile confirmation. |
| 4 | **Real-time Button State** | Change PIN — "Update PIN" button | The submit button remains visually disabled (`opacity: 0.5`) and non-pressable until both PIN fields contain exactly 4 characters, reducing premature submissions. |
| 5 | **Secure Entry Masking** | New PIN, Confirm PIN | `secureTextEntry={true}` masks each digit as `•` immediately after entry, preventing shoulder-surfing in a busy restaurant environment. |
| 6 | **Pre-filled Edit Forms** | Menu Item Form (Edit mode) | When a manager edits an existing item, all fields are pre-populated with the current values. The manager only needs to change what is different, dramatically reducing edit time. |
| 7 | **Return Change Auto-Calculation** | Cash Tendered | When the cashier enters an amount greater than the total, the system automatically computes and displays the return change via toast — eliminating manual arithmetic at the till entirely. |
| 8 | **Dropdown with Visual Feedback** | Category Selector | The selected category is immediately reflected in the dropdown trigger button label (e.g., "Mains", "Drinks"). No separate confirmation step needed. |

---

## 5. Form Structure & Layout

### 5.1 Form Types

| Form | Type | Steps | Progress Indicator |
|---|---|---|---|
| **PIN Login** | Single-step | 1 | None — immediate |
| **Change PIN** | Single-step (with confirmation modal) | 1 + confirmation dialog | No progress bar; confirmation acts as a natural gate |
| **Make Order (Cart)** | Multi-step | Step 1: Browse Menu → Step 2: Review Cart → Step 3: Submit | No explicit progress bar — the bottom cart button serves as the visual CTA moving between steps |
| **Cash Payment** | Single-step modal | 1 | None |
| **Menu Item Form (New)** | Single-step with grouped sections | 1 | Section cards act as visual grouping |

### 5.2 Field Grouping & Order

| Form | Grouping Logic |
|---|---|
| **Menu Item Form** | Fields are grouped into logical `SectionCard` components: (1) Basic Info (Name, Description), (2) Pricing & Category, (3) Availability Toggle. This mirrors how a manager thinks about a dish — describe it, price it, then decide if it's live. |
| **Change PIN** | Fields flow top-to-bottom: (1) Role Selection, (2) New PIN, (3) Confirm PIN, (4) Submit. Role is selected first because the PIN fields are contextual to the chosen role. |
| **Cash Payment Modal** | (1) Grand Total (read-only display), (2) Cash Tendered input, (3) Confirm Payment button. The bill total is shown prominently before the input to anchor the cashier's expected value. |

---

## 6. Accessibility in Data Entry

### 6.1 Visible Labels

Every input field in the application has an explicit, visible `<Text>` label rendered **above** the field — not as a floating label that disappears on focus, and not relying solely on placeholder text.

| Field | Label Visible? |
|---|---|
| New PIN | ✅ "New 4-Digit PIN" |
| Confirm PIN | ✅ "Confirm New PIN" |
| Cash Tendered | ✅ "Cash Tendered (KES)" |
| Phone Number | ✅ "Customer Phone (M-Pesa)" |
| Menu Item Name | ✅ "Item Name" |
| Menu Item Price | ✅ "Price (KES)" |
| Discount Amount | ✅ "Discount Amount (KES)" |

### 6.2 Error Communication

As documented in Section 3, errors are **never communicated through colour alone**. Every error message is always accompanied by:
- A semantic icon (`AlertTriangle`, `ShieldAlert`, `CheckCircle2`)
- A descriptive text message explaining what went wrong

### 6.3 Touch Targets

All interactive elements meet or exceed the minimum **44×44px** touch target requirement:

| Element | Touch Target Size |
|---|---|
| PIN Pad digit buttons | ~64×64px |
| Form submit buttons | 56px height, full width |
| Back / close icon buttons | 44×44px circular |
| Role selection cards | ~130×110px |
| Toggle switches | Native React Native `Switch` (meets 44px) |

### 6.4 Screen Reader & Keyboard Support

- All `TouchableOpacity` elements include an implied `accessibilityRole="button"` from React Native.
- `KeyboardAvoidingView` is wrapped around all forms (`behavior="padding"` on iOS) to ensure the keyboard never obscures the active input field.
- `keyboardShouldPersistTaps="handled"` is set on all `ScrollView` form containers so that tapping outside an input dismisses it without accidentally triggering other controls.
- Tab/keyboard navigation follows a logical top-to-bottom, left-to-right order on all forms.

---

## 7. Data Security

### 7.1 PIN Masking

All PIN input fields (Login, New PIN, Confirm PIN) use `secureTextEntry={true}`, which:
- Replaces each character with `•` immediately after entry.
- Prevents the system clipboard from caching the value.
- Prevents screenshots from capturing the PIN on iOS.

### 7.2 Sensitive Data Handling

| Data | Storage Method | Notes |
|---|---|---|
| Role PINs | Stored in Supabase `role_auth` table | Managed server-side; not stored in local device storage or AsyncStorage |
| Supabase keys | Stored in `.env` file (git-ignored) | Exposed via `EXPO_PUBLIC_` prefix only for the anon key; service role key is never shipped with the client |
| Payment receipts | Stored in Supabase `orders` table | M-Pesa receipt codes are stored as strings; no raw financial credentials are ever stored locally |
| Cash Tendered amounts | Stored in Supabase `shift_reports` table | Used for reconciliation reporting only; not cached locally |

### 7.3 Destructive Action Confirmation

All destructive or irreversible actions require a **confirmation modal** before execution:

| Destructive Action | Confirmation Type | Modal Text |
|---|---|---|
| Change a Role PIN | ⚠️ Modal Dialog | _"Are you sure you want to securely change the login PIN for [Role]? This will instantly log out affected devices."_ |
| Delete a notification | None (swipe gesture with undo potential) | Inline swipe-to-delete; deletion is immediate |
| Void an order item | Inline confirmation (Alert) | _"Void this item from the bill?"_ |
| Clear all paid orders (payment screen) | ⚠️ Modal Dialog | _"This will permanently remove all paid orders from this view."_ |

### 7.4 Session Management

- The app does not implement a timed session timeout in the current MVP.
- Planned: A screen-lock/idle-timeout feature that returns to the PIN login screen after 5 minutes of inactivity on unattended tablets.

---

## 8. Data Entry Performance

### 8.1 Field Minimisation

Every form in Crown Bites follows a **minimum viable fields** principle. Only data that is actionable and necessary is collected:

| Form | Fields Included | Fields Deliberately Excluded |
|---|---|---|
| Login | PIN only | Username, email, password — unnecessary for a POS |
| Make Order | Item + Qty only | Special instructions (future feature), item notes |
| Cash Payment | Cash Tendered only | Customer name, receipt email |
| Menu Item (New) | Name, Price, Category, Description, Availability | SKU, barcode, tax class, supplier info |

### 8.2 Smart Defaults & Pre-filled Values

| Field | Default Value | Reason |
|---|---|---|
| Menu Item Availability Toggle | `ON` (Active) | New items should be live immediately unless the manager specifies otherwise |
| Menu Item Category | First existing category | Prevents an empty/null state error if the manager forgets to select |
| Date Filter (Payment Screen) | "Today" | Cashiers always work in the current day's context |
| Service Charge Toggle | As configured by Manager | Persisted in `billingConfigStore` so the cashier never has to re-set it each shift |

### 8.3 Auto-save / Draft Saving

- The **Make Order** cart is preserved in the `cashierStore` Zustand store in memory for the duration of the session.
- If a Waiter navigates away from the Make Order screen mid-order and returns, the cart is retained.
- **No persistent draft saving** to Supabase for incomplete orders — by design, to prevent ghost orders appearing in the kitchen queue.

### 8.4 Confirmation Before Final Submission

| Form | Confirmation Screen / Step |
|---|---|
| **Change PIN** | Full confirmation modal with Cancel and "Update PIN" options before writing to Supabase |
| **Cash Payment** | Toast notification displays change amount before auto-processing (2-second delay gives cashier a visual window) |
| **M-Pesa STK Push** | Explicit "Submit" button after phone number entry; the customer receives a separate confirmation on their device |
| **Void Order Item** | Inline confirmation prompt before the item is deducted from the bill |

### 8.5 Success Feedback

Every successful form submission in the app provides clear, immediate success feedback:

| Action | Success Feedback |
|---|---|
| PIN Login Success | Animated screen transition to role dashboard |
| PIN Updated | ✅ Toast: _"Successfully updated [Role] PIN!"_ |
| Order Submitted | Kitchen immediately receives the ticket; Waiter sees the table colour turn yellow |
| Payment Confirmed | ✅ Toast: _"Payment successful, no change needed."_ or _"Return Change: KES [X]"_ |
| Menu Item Saved | Toast: _"Item saved successfully"_ + return to dashboard |
| Table Freed | Table turns green on the floor plan instantly |

---

_Crown Bites ROKMS — Data Entry Analysis v1.0_  
_Built for Crown Bites Restaurant Operations_
