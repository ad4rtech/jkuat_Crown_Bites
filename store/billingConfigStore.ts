import { create } from 'zustand';

// VAT is fixed by law at 16% and cannot be changed by the manager.
export const FIXED_VAT_RATE = 0.16;

// Auto-discount: applied when subtotal exceeds this threshold
export const AUTO_DISCOUNT_THRESHOLD = 1000;
export const AUTO_DISCOUNT_RATE = 0.10;

interface BillingConfigStore {
  // Service charge rate (decimal, e.g. 0.10 = 10%)
  serviceChargeRate: number;
  serviceChargeEnabled: boolean;

  updateServiceCharge: (rate: number) => void;
  toggleServiceCharge: () => void;
}

export const useBillingConfigStore = create<BillingConfigStore>((set) => ({
  serviceChargeRate: 0.10,
  serviceChargeEnabled: true,

  updateServiceCharge: (rate) => set({ serviceChargeRate: rate }),
  toggleServiceCharge: () => set((state) => ({ serviceChargeEnabled: !state.serviceChargeEnabled })),
}));

// ─── Shared billing calculation helper ────────────────────────────────────────
// Used by both the cashier BillDetail and the waiter payment screen.
export function computeBill(
  menuTotal: number,
  serviceChargeRate: number,
  serviceChargeEnabled: boolean,
) {
  // The menu price is inclusive: Base = 74%, VAT = 16%, Default SC = 10% (totaling 100%)
  const baseSubtotal = Math.round(menuTotal * 0.74);
  const vat = Math.round(menuTotal * 0.16);

  // Service charge is dynamically calculated based on manager's configured rate
  const serviceCharge = serviceChargeEnabled
    ? Math.round(menuTotal * serviceChargeRate)
    : 0;

  // Pre-discount total using the active service charge rate
  const preTaxTotal = baseSubtotal + vat + serviceCharge;

  // Auto-discount: 10% off the total bill if the menu total > 1000
  const autoDiscount =
    menuTotal > AUTO_DISCOUNT_THRESHOLD
      ? Math.round(preTaxTotal * AUTO_DISCOUNT_RATE)
      : 0;

  const grandTotal = preTaxTotal - autoDiscount;

  return { baseSubtotal, vat, serviceCharge, autoDiscount, grandTotal, preTaxTotal };
}
