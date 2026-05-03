import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, TextInput, Modal,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { ChevronLeft, X } from 'lucide-react-native';
import { useCashierStore } from '../../store/cashierStore';
import { useOrderStore, ActiveOrderWithItems } from '../../store/orderStore';
import { useTableStore } from '../../store/tableStore';
import { useReportsStore, PaymentMethod } from '../../store/reportsStore';
import { useBillingConfigStore, computeBill } from '../../store/billingConfigStore';
import CenterToast, { useToast } from '../CenterToast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function minutesSince(isoString: string): number {
  return Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
}

function openedLabel(isoString: string): string {
  const d    = new Date(isoString);
  const hh   = d.getHours().toString().padStart(2, '0');
  const mm   = d.getMinutes().toString().padStart(2, '0');
  const mins = minutesSince(isoString);
  return `${hh}:${mm} (${mins}m)`;
}

function orderNumber(orderId: string): string {
  return `#${orderId.slice(-4).toUpperCase().padStart(4, '0')}`;
}

function tableLabel(id: string): string {
  return `Table ${id.replace(/\D/g, '')}`;
}

// ─── Discount Modal ───────────────────────────────────────────────────────────
function DiscountModal({
  visible, orderId, onClose,
}: { visible: boolean; orderId: string; onClose: () => void }) {
  const { applyDiscount } = useCashierStore();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleApply = () => {
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) { Alert.alert('Enter a valid discount amount'); return; }
    applyDiscount(orderId, n, reason.trim() || 'Manager discount');
    setAmount('');
    setReason('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={dm.overlay}>
        <View style={dm.sheet}>
          <View style={dm.header}>
            <Text style={dm.title}>Add Discount</Text>
            <TouchableOpacity style={dm.closeBtn} onPress={onClose}>
              <X size={18} color="#1c120f" />
            </TouchableOpacity>
          </View>
          <Text style={dm.label}>Discount Amount (KES)</Text>
          <TextInput
            style={dm.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 200"
            placeholderTextColor="#c4a882"
            autoFocus
          />
          <Text style={dm.label}>Reason (optional)</Text>
          <TextInput
            style={[dm.input, { fontSize: 15, fontFamily: 'Lexend' }]}
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Loyalty discount"
            placeholderTextColor="#c4a882"
          />
          <TouchableOpacity style={dm.applyBtn} onPress={handleApply}>
            <Text style={dm.applyBtnText}>Apply Discount</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const dm = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#fdfaf5', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48, gap: 10 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title:      { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f' },
  closeBtn:   { padding: 6, backgroundColor: '#f4ebe1', borderRadius: 14 },
  label:      { fontFamily: 'LexendSemiBold', fontSize: 12, color: '#8a7465', textTransform: 'uppercase', letterSpacing: 0.5 },
  input:      { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#f0e6d8', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'LexendBold', fontSize: 22, color: '#1c120f' },
  applyBtn:   { backgroundColor: '#db8221', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  applyBtnText: { fontFamily: 'LexendBold', fontSize: 16, color: '#fff' },
});

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  order: ActiveOrderWithItems;
  onBack: () => void;
  onPaid: () => void;
}

export default function BillDetail({ order, onBack, onPaid }: Props) {
  const {
    voidedItems, serviceChargeEnabled: _unused,
    voidOrderItem, restoreOrderItem,
    toggleServiceCharge: _t, clearBillState,
  } = useCashierStore();
  const { serviceChargeRate, serviceChargeEnabled } = useBillingConfigStore();
  const { markPaid } = useOrderStore();
  const { resetTable } = useTableStore();
  const { recordTransaction, recordDiscount, recordVoid } = useReportsStore();
  const { toast, show } = useToast();
  const { addShiftCash } = useCashierStore();

  const [showDiscount, setShowDiscount] = useState(false);

  const voided = voidedItems[order.id] ?? [];

  // ── Calculations (Inclusive Pricing: 74% Base, 16% VAT, SC from config) ──────
  const rawSubtotal = order.items.reduce((sum, item, idx) => {
    if (voided.includes(idx)) return sum;
    return sum + item.qty * item.unit_price;
  }, 0);

  const { baseSubtotal, vat, serviceCharge, autoDiscount, grandTotal } = computeBill(
    rawSubtotal,
    serviceChargeRate,
    serviceChargeEnabled,
  );

  // ── Void an item ──────────────────────────────────────────────────
  const handleVoid = (idx: number) => {
    if (voided.includes(idx)) {
      restoreOrderItem(order.id, idx);
      return;
    }
    Alert.alert('Void Item', `Void "${order.items[idx].name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Void', style: 'destructive', onPress: () => voidOrderItem(order.id, idx) },
    ]);
  };

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashTendered, setCashTendered] = useState('');

  // ── Process payment ───────────────────────────────────────────────
  const handlePayment = () => {
    setCashTendered('');
    setShowPaymentModal(true);
  };

  const handleCashPaymentSubmit = () => {
    const tendered = parseFloat(cashTendered);
    if (isNaN(tendered)) {
      show('Please enter a valid amount');
      return;
    }

    const finalAmount = Math.max(0, grandTotal);

    if (tendered < finalAmount) {
      show('Insufficient Funds: The amount entered is less than the bill amount.', 'error');
      return;
    }

    const change = tendered - finalAmount;
    
    if (change > 0) {
      show(`Return Change: KES ${change.toLocaleString()}`, 'warning');
    } else {
      show('Payment successful, no change needed.', 'success');
    }

    addShiftCash(tendered, change);
    setShowPaymentModal(false);
    
    // Proceed with the standard payment processing after a short delay for the toast
    setTimeout(() => {
      processPayment('Cash');
      onPaid();
    }, 2000);
  };

  const processPayment = (method: string) => {
    // 1. Record each voided item in the void log
    voided.forEach(idx => {
      const item = order.items[idx];
      if (item) {
        recordVoid(
          item.name,
          item.qty * item.unit_price,
          'Item voided at billing',
          'Cashier',
        );
      }
    });
    // 2. Record auto-discount if applied
    if (autoDiscount > 0) {
      recordDiscount(
        `Auto 10% Loyalty Discount`,
        autoDiscount,
        'Bill exceeded KES 1,000',
        'System',
        order.id,
        order.table_id,
      );
    }
    // 3. Record the completed transaction
    recordTransaction(
      order.table_id,
      order.id,
      Math.max(0, grandTotal),
      method as PaymentMethod,
    );
    // 4. Clear local bill state + mark order paid
    clearBillState(order.id);
    markPaid(order.id, order.table_id, method, grandTotal);
    // Remove the generic Alert.alert and let the UI transition back natively
  };

  const tableNum = tableLabel(order.table_id);

  return (
    <View style={styles.container}>
      <CenterToast {...toast} />
      {/* Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Payment</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowPaymentModal(false)}>
                <X size={20} color="#1c120f" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.grandLabel}>Grand Total</Text>
              <Text style={[styles.grandValue, { fontSize: 28, marginBottom: 16 }]}>KES {Math.max(0, grandTotal).toLocaleString()}</Text>
              
              <Text style={styles.inputLabel}>Cash Tendered (KES)</Text>
              <TextInput
                style={styles.cashInput}
                keyboardType="numeric"
                value={cashTendered}
                onChangeText={setCashTendered}
                placeholder="e.g. 5000"
                placeholderTextColor="#d6c6b8"
              />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalActionBtn} onPress={handleCashPaymentSubmit}>
                <Text style={styles.modalActionText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Header ── */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ChevronLeft size={22} color="#1c120f" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.orderNum}>ORDER {orderNumber(order.id)}</Text>
          <Text style={styles.headerTitle}>{tableNum} Bill</Text>
        </View>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Meta card ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(380)} style={styles.metaCard}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>WAITER</Text>
            <Text style={styles.metaValue}>Staff</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>OPENED</Text>
            <Text style={styles.metaValue}>{openedLabel(order.created_at)}</Text>
          </View>
        </Animated.View>

        {/* ── Items ── */}
        <Animated.View entering={FadeInDown.delay(90).duration(380)} style={styles.itemsCard}>
          {/* Column headers */}
          <View style={styles.colHeader}>
            <Text style={[styles.colText, { width: 36 }]}>QTY</Text>
            <Text style={[styles.colText, { flex: 1 }]}>ITEM</Text>
            <Text style={[styles.colText, { width: 80, textAlign: 'right' }]}>TOTAL</Text>
          </View>
          <View style={styles.itemsDivider} />

          {order.items.map((item, idx) => {
            const isVoided = voided.includes(idx);
            const lineTotal = item.qty * item.unit_price;
            return (
              <View key={idx}>
                <View style={[styles.itemRow, isVoided && styles.itemRowVoided]}>
                  {/* Qty badge */}
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                  </View>
                  {/* Item info */}
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, isVoided && styles.strikethrough]}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemPrice}>
                      KES {item.unit_price.toLocaleString()}
                    </Text>
                  </View>
                  {/* Total */}
                  <View style={styles.itemRight}>
                    <Text style={[styles.lineTotal, isVoided && styles.strikethrough]}>
                      KES {lineTotal.toLocaleString()}
                    </Text>
                  </View>
                </View>
                {idx < order.items.length - 1 && <View style={styles.itemsDivider} />}
              </View>
            );
          })}
        </Animated.View>

        {/* ── Totals ── */}
        <Animated.View entering={FadeInDown.delay(120).duration(380)} style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>KES {baseSubtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT 16% (statutory)</Text>
            <Text style={styles.totalValue}>KES {vat.toLocaleString()}</Text>
          </View>
          {/* Service Charge with Toggle */}
          <View style={styles.totalRow}>
            <View style={styles.serviceRow}>
              <Text style={styles.totalLabel}>Service Charge {Math.round(serviceChargeRate * 100)}%</Text>
              <Switch
                value={serviceChargeEnabled}
                onValueChange={() => useBillingConfigStore.getState().toggleServiceCharge()}
                trackColor={{ false: '#e8ddd4', true: '#10b981' }}
                thumbColor="#fff"
                style={{ transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }], marginLeft: 6 }}
              />
            </View>
            <Text style={styles.totalValue}>KES {serviceCharge.toLocaleString()}</Text>
          </View>
          {/* Auto-discount row — only shown when subtotal > KES 1,000 */}
          {autoDiscount > 0 && (
            <View style={styles.totalRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.totalLabel}>Auto-Discount 10%</Text>
                <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontFamily: 'LexendBold', fontSize: 9, color: '#059669' }}>AUTO</Text>
                </View>
              </View>
              <Text style={styles.discountValue}>− KES {autoDiscount.toLocaleString()}</Text>
            </View>
          )}
          {/* Divider */}
          <View style={styles.totalsDivider} />
          {/* Grand Total */}
          <View style={styles.totalRow}>
            <Text style={styles.grandLabel}>Grand Total</Text>
            <Text style={styles.grandValue}>KES {Math.max(0, grandTotal).toLocaleString()}</Text>
          </View>
        </Animated.View>

        {/* ── Proceed to Payment ── */}
        <Animated.View entering={FadeInDown.delay(170).duration(380)}>
          <TouchableOpacity style={styles.payBtn} onPress={handlePayment} activeOpacity={0.88}>
            <Text style={styles.payBtnText}>Proceed to Payment  →</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#faf5ef' },
  scroll:      { padding: 16 },

  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#faf5ef', borderBottomWidth: 1, borderColor: '#f0e6d8' },
  backBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f4ebe1', justifyContent: 'center', alignItems: 'center' },
  headerCenter:  { flex: 1, alignItems: 'center' },
  orderNum:      { fontFamily: 'LexendSemiBold', fontSize: 11, color: '#8a7465', textTransform: 'uppercase', letterSpacing: 0.8 },
  headerTitle:   { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f' },

  metaCard:      { backgroundColor: '#f4ebe1', borderRadius: 16, padding: 18, flexDirection: 'row', marginBottom: 14, borderWidth: 1, borderColor: '#e8ddd4' },
  metaItem:      { flex: 1, alignItems: 'center' },
  metaLabel:     { fontFamily: 'LexendSemiBold', fontSize: 10, color: '#8a7465', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  metaValue:     { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f' },
  metaDivider:   { width: 1, backgroundColor: '#e0d4c8', marginVertical: 4 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(28,18,15,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f0e6d8', backgroundColor: '#fdfaf5' },
  modalTitle: { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f4ebe1', justifyContent: 'center', alignItems: 'center' },
  modalContent: { padding: 24, backgroundColor: '#ffffff' },
  inputLabel: { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#8a7465', marginBottom: 8 },
  cashInput: { backgroundColor: '#fdfaf5', borderWidth: 1, borderColor: '#e8ddd4', borderRadius: 12, height: 56, paddingHorizontal: 16, fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f', letterSpacing: 2 },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f0e6d8', backgroundColor: '#fdfaf5' },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f4ebe1', alignItems: 'center', marginRight: 10 },
  modalCancelText: { fontFamily: 'LexendSemiBold', fontSize: 15, color: '#8a7465' },
  modalActionBtn: { flex: 1.2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#10b981', alignItems: 'center', marginLeft: 10 },
  modalActionText: { fontFamily: 'LexendBold', fontSize: 14, color: '#ffffff' },

  itemsCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  colHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  colText:       { fontFamily: 'LexendSemiBold', fontSize: 10, color: '#8a7465', textTransform: 'uppercase', letterSpacing: 0.6 },
  itemsDivider:  { height: 1, backgroundColor: '#f4ebe1', marginVertical: 8 },
  itemRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemRowVoided: { opacity: 0.5 },
  qtyBadge:      { width: 28, height: 28, borderRadius: 8, backgroundColor: '#f4ebe1', justifyContent: 'center', alignItems: 'center' },
  qtyText:       { fontFamily: 'LexendBold', fontSize: 13, color: '#1c120f' },
  itemInfo:      { flex: 1 },
  itemName:      { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#1c120f' },
  itemPrice:     { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465', marginTop: 1 },
  itemRight:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineTotal:     { fontFamily: 'LexendBold', fontSize: 14, color: '#1c120f', minWidth: 70, textAlign: 'right' },
  strikethrough: { textDecorationLine: 'line-through', color: '#aaa' },
  voidBtn:       { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1.5, borderColor: '#ef4444' },
  voidBtnActive: { backgroundColor: '#fef2f2', borderColor: '#ef4444' },
  voidBtnText:   { fontFamily: 'LexendBold', fontSize: 10, color: '#ef4444' },
  voidBtnTextActive: { color: '#ef4444' },

  totalsCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14, gap: 12, borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  totalRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceRow:    { flexDirection: 'row', alignItems: 'center' },
  totalLabel:    { fontFamily: 'Lexend', fontSize: 14, color: '#8a7465' },
  totalValue:    { fontFamily: 'Lexend', fontSize: 14, color: '#1c120f' },
  addDiscount:   { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#db8221' },
  discountValue: { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#ef4444' },
  totalsDivider: { height: 1, backgroundColor: '#f0e6d8', marginVertical: 4 },
  grandLabel:    { fontFamily: 'LexendBold', fontSize: 16, color: '#1c120f' },
  grandValue:    { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f' },

  actionRow:       { flexDirection: 'row', gap: 12, marginBottom: 14 },
  voidItemBtn:     { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8ddd4', alignItems: 'center' },
  voidItemBtnText: { fontFamily: 'LexendBold', fontSize: 14, color: '#1c120f' },
  addDiscountBtn:     { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#db8221', alignItems: 'center' },
  addDiscountBtnText: { fontFamily: 'LexendBold', fontSize: 14, color: '#db8221' },

  payBtn:      { backgroundColor: '#db8221', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  payBtnText:  { fontFamily: 'LexendBold', fontSize: 17, color: '#fff' },
});
