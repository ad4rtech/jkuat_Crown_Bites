import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { Clock, ChevronRight, X, Check, Flag, TrendingUp, AlertTriangle, BarChart2 } from 'lucide-react-native';

import { useBillingStore, AuthRequest } from '../../store/billingStore';
import { useOrderStore, ActiveOrderWithItems } from '../../store/orderStore';
import SalesAnalytics from './SalesAnalytics';
import { useTableStore } from '../../store/tableStore';
import { useBillingConfigStore, computeBill } from '../../store/billingConfigStore';
import { useReportsStore } from '../../store/reportsStore';
import CenterToast, { useToast } from '../CenterToast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function minutesSince(isoString: string): number {
  return Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
}

function formatMins(mins: number): string {
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m`;
}

type TxStatus = 'open' | 'bill_requested' | 'paid';

function resolveTxStatus(order: ActiveOrderWithItems): TxStatus {
  if (order.payment_status === 'paid') return 'paid';
  if (order.status === 'Ready' || order.status === 'Served') return 'bill_requested';
  return 'open';
}

function txStatusCfg(status: TxStatus) {
  if (status === 'bill_requested') return { label: 'BILL REQUESTED', bg: '#fff7ed', text: '#ea580c', border: '#fdba74' };
  if (status === 'paid')           return { label: 'PAID',           bg: '#ecfdf5', text: '#059669', border: '#6ee7b7' };
  return                                  { label: 'OPEN',           bg: '#f8fafc', text: '#64748b', border: '#cbd5e1' };
}

function tableLabel(tableId: string): string {
  const num = tableId.replace(/\D/g, '');
  return `Table ${num.padStart(2, '0')}`;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ value, label, color }: { value: number | string; label: string; color?: string }) {
  return (
    <View style={kpi.card}>
      <Text style={[kpi.value, { color: color ?? '#1c120f' }]}>{value}</Text>
      <Text style={kpi.label}>{label}</Text>
    </View>
  );
}
const kpi = StyleSheet.create({
  card:  { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  value: { fontFamily: 'LexendBold', fontSize: 28, marginBottom: 4 },
  label: { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },
});

// ─── Auth Request Card ────────────────────────────────────────────────────────
function AuthCard({ req, index, onApproved }: { req: AuthRequest; index: number; onApproved: (desc: string) => void }) {
  const { approveRequest, rejectRequest } = useBillingStore();
  if (req.status !== 'pending') return null;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(380)} style={auth.card}>
      <View style={auth.header}>
        <Text style={auth.cashier}>Cashier: {req.cashier}</Text>
        <Text style={auth.table}>{req.tableLabel}</Text>
      </View>
      <Text style={auth.desc}>{req.description}</Text>
      <View style={auth.reasonBox}>
        <Text style={auth.reasonText}>"{req.reason}"</Text>
      </View>
      <View style={auth.btnRow}>
        <TouchableOpacity
          style={auth.rejectBtn}
          onPress={() =>
            Alert.alert('Reject Request', `Reject "${req.description}"?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reject', style: 'destructive', onPress: () => rejectRequest(req.id) },
            ])
          }
        >
          <X size={14} color="#ef4444" />
          <Text style={auth.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={auth.approveBtn} onPress={() => { approveRequest(req.id); onApproved(req.description); }}>
          <Check size={14} color="#fff" />
          <Text style={auth.approveBtnText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
const auth = StyleSheet.create({
  card:           { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderLeftWidth: 4, borderColor: '#f0e6d8', borderLeftColor: '#ef4444', elevation: 2, shadowColor: '#ef4444', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  header:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cashier:        { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },
  table:          { fontFamily: 'LexendSemiBold', fontSize: 12, color: '#1c120f' },
  desc:           { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f', marginBottom: 10 },
  reasonBox:      { backgroundColor: '#f8f5f2', borderRadius: 10, padding: 12, marginBottom: 14 },
  reasonText:     { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465', fontStyle: 'italic', lineHeight: 18 },
  btnRow:         { flexDirection: 'row', gap: 10 },
  rejectBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#ef4444' },
  rejectBtnText:  { fontFamily: 'LexendBold', fontSize: 13, color: '#ef4444' },
  approveBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: '#059669' },
  approveBtnText: { fontFamily: 'LexendBold', fontSize: 13, color: '#fff' },
});

// ─── Transaction Row ───────────────────────────────────────────────────────────────
function TxRow({ order, index, onPaid, confirm }: { order: ActiveOrderWithItems; index: number; onPaid: (tbl: string, amt: number) => void; confirm: any }) {
  const { markPaid } = useOrderStore();
  const { resetTable } = useTableStore();
  const { serviceChargeRate, serviceChargeEnabled } = useBillingConfigStore();
  const { recordDiscount } = useReportsStore();

  const txStatus = resolveTxStatus(order);
  const sc = txStatusCfg(txStatus);
  const mins = minutesSince(order.created_at);
  const timeLabel = txStatus === 'paid'
    ? `Closed recently`
    : `Open ${formatMins(mins)}`;

  const rawSubtotal = order.items.reduce((sum, i) => sum + i.qty * i.unit_price, 0);
  const { grandTotal, autoDiscount } = computeBill(rawSubtotal, serviceChargeRate, serviceChargeEnabled);

  const handlePay = () => {
    if (txStatus !== 'bill_requested') return;
    confirm({
      message: 'Process Payment',
      subMessage: `Mark ${tableLabel(order.table_id)} as paid?`,
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        // Record auto-discount if any
        if (autoDiscount > 0) {
          recordDiscount(
            `Auto 10% Loyalty Discount — ${tableLabel(order.table_id)}`,
            autoDiscount,
            'Bill exceeded KES 1,000',
            'Manager',
            order.id,
            order.table_id,
          );
        }
        markPaid(order.id, order.table_id, order.payment_method || 'Cash', grandTotal, resetTable);
        onPaid(tableLabel(order.table_id), grandTotal);
      }
    });
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
      <TouchableOpacity style={tx_.row} onPress={handlePay} activeOpacity={txStatus === 'bill_requested' ? 0.7 : 1}>
        <View style={tx_.left}>
          <Text style={tx_.table}>{tableLabel(order.table_id)}</Text>
          <Text style={tx_.amount}>KES {Math.max(0, grandTotal).toLocaleString()}</Text>
        </View>
        <View style={tx_.right}>
          <Text style={tx_.time}>{timeLabel}</Text>
          <View style={[tx_.badge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[tx_.badgeText, { color: sc.text }]}>{sc.label}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={tx_.divider} />
    </Animated.View>
  );
}
const tx_ = StyleSheet.create({
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  left:      { gap: 4 },
  table:     { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f' },
  amount:    { fontFamily: 'LexendBold', fontSize: 14, color: '#1c120f' },
  right:     { alignItems: 'flex-end', gap: 8 },
  time:      { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },
  badge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontFamily: 'LexendBold', fontSize: 10, letterSpacing: 0.3 },
  divider:   { height: 1, backgroundColor: '#f4ebe1', marginHorizontal: 16 },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BillingDashboard() {
  const { authRequests, fetchAuthRequests, subscribeToAuthRequests } = useBillingStore();
  const { activeOrders, paidOrders, fetchActiveOrders, fetchPaidOrders, subscribeToOrders } = useOrderStore();
  const { fetchTables } = useTableStore();
  const { toast, show, confirm } = useToast();

  const [showSalesAnalytics, setShowSalesAnalytics] = useState(false);

  const handleApproved = (desc: string) => {
    show({
      message: 'Request Approved!',
      subMessage: `"${desc}" has been authorized successfully.`,
      type: 'success',
      autoDismissMs: 3000,
    });
  };

  const handlePaid = (tbl: string, amt: number) => {
    show({
      message: 'Payment Confirmed!',
      subMessage: `${tbl} bill of KES ${amt.toLocaleString()} has been settled.`,
      type: 'success',
      autoDismissMs: 3000,
    });
  };

  useFocusEffect(useCallback(() => {
    fetchAuthRequests();
    fetchActiveOrders();
    fetchPaidOrders('Today');
    fetchTables();
    const unsubAuth  = subscribeToAuthRequests();
    const unsubOrders = subscribeToOrders();
    return () => { unsubAuth(); unsubOrders(); };
  }, []));

  // ── Derived metrics ──────────────────────────────────────────────────────
  const pendingAuth   = authRequests.filter(r => r.status === 'pending');
  const ordersProcessed = activeOrders.length + paidOrders.length;

  // Revenue = sum of paid orders
  const totalRevenue  = paidOrders.reduce((s, o) => s + o.total_amount, 0);
  const avgOrderValue = ordersProcessed > 0 ? Math.round(totalRevenue / ordersProcessed) : 0;

  // Calculate Top Selling Item
  const itemCounts: Record<string, number> = {};
  [...activeOrders, ...paidOrders].forEach(o => {
    o.items.forEach(i => {
      itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty;
    });
  });
  const topItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

  // Flagged = overdue bill requests (unpaid, Ready, older than 10 min)
  const flaggedItems  = activeOrders.filter(o =>
    o.status === 'Ready' &&
    o.payment_status === 'unpaid' &&
    minutesSince(o.created_at) > 10
  ).length;

  return (
    <View style={styles.container}>
      <CenterToast {...toast} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Sales Analytics Banner */}
        <Animated.View entering={FadeInDown.duration(350)}>
          <TouchableOpacity 
            style={[styles.actionRow, { backgroundColor: '#2a1e1a', borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 10 }]}
            onPress={() => setShowSalesAnalytics(true)}
          >
            <BarChart2 size={20} color="#db8221" />
            <Text style={{ fontFamily: 'LexendBold', fontSize: 16, color: '#fff' }}>View Sales Analytics</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Revenue Card */}
        <Animated.View entering={FadeInDown.delay(60).duration(380)} style={styles.revenueCard}>
          <Text style={styles.revenueAmount}>
            KES {totalRevenue > 0 ? totalRevenue.toLocaleString() : '—'}
          </Text>
          <Text style={styles.revenueLabel}>Total Revenue Today</Text>
        </Animated.View>

        {/* KPI Row */}
        <Animated.View entering={FadeInDown.delay(90).duration(380)} style={styles.kpiRow}>
          <KpiCard value={ordersProcessed} label="Orders Processed" />
          <KpiCard
            value={`KES ${avgOrderValue.toLocaleString()}`}
            label="Average Order Value"
            color="#059669"
          />
        </Animated.View>

        {/* Flagged Items — only show when >0 */}
        {flaggedItems > 0 && (
          <Animated.View entering={FadeInDown.delay(110).duration(380)}>
            <View style={styles.flagCard}>
              <Flag size={16} color="#ef4444" />
              <View>
                <Text style={styles.flagValue}>{flaggedItems}</Text>
                <Text style={styles.flagLabel}>Flagged Items (bills waiting &gt;10 min)</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Auth Queue — only show when pending */}
        {pendingAuth.length > 0 && (
          <Animated.View entering={FadeInDown.delay(140).duration(380)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Authorisation Queue</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingAuth.length} PENDING</Text>
              </View>
            </View>
            {pendingAuth.map((req, i) => (
              <AuthCard key={req.id} req={req} index={i} onApproved={handleApproved} />
            ))}
          </Animated.View>
        )}

        {/* Active Transactions */}
        <Animated.View entering={FadeInDown.delay(180).duration(380)}>
          <Text style={styles.sectionTitle}>Active Transactions</Text>
          {activeOrders.length === 0 ? (
            <View style={styles.emptyTx}>
              <Text style={styles.emptyTxText}>No active transactions.</Text>
            </View>
          ) : (
            <View style={styles.txCard}>
              {activeOrders.map((order, i) => (
                <TxRow key={order.id} order={order} index={i} onPaid={handlePaid} confirm={confirm} />
              ))}
            </View>
          )}
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Sales Analytics Modal */}
      <Modal visible={showSalesAnalytics} animationType="slide" onRequestClose={() => setShowSalesAnalytics(false)}>
        <SalesAnalytics onClose={() => setShowSalesAnalytics(false)} />
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#faf5ef' },
  scroll:          { padding: 16 },
  actionRow:       { flexDirection: 'row', gap: 12, marginBottom: 16 },
  reportsBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8ddd4' },
  reportsBtnText:  { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#705f55' },
  eodBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: '#db8221' },
  eodBtnText:      { fontFamily: 'LexendBold', fontSize: 14, color: '#fff' },
  revenueCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 14, alignItems: 'center', borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  revenueAmount:   { fontFamily: 'LexendBold', fontSize: 34, color: '#db8221', marginBottom: 4 },
  revenueLabel:    { fontFamily: 'Lexend', fontSize: 13, color: '#8a7465' },
  kpiRow:          { flexDirection: 'row', gap: 12, marginBottom: 14 },
  flagCard:        { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderLeftWidth: 4, borderColor: '#fca5a5', borderLeftColor: '#ef4444' },
  flagValue:       { fontFamily: 'LexendBold', fontSize: 24, color: '#ef4444' },
  flagLabel:       { fontFamily: 'Lexend', fontSize: 11, color: '#8a7465' },
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 },
  sectionTitle:    { fontFamily: 'LexendBold', fontSize: 17, color: '#1c120f', marginBottom: 12, marginTop: 4 },
  pendingBadge:    { backgroundColor: '#fef2f2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#fca5a5' },
  pendingBadgeText:{ fontFamily: 'LexendBold', fontSize: 11, color: '#ef4444' },
  txCard:          { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f0e6d8' },
  emptyTx:         { backgroundColor: '#fff', borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#f0e6d8' },
  emptyTxText:     { fontFamily: 'Lexend', fontSize: 13, color: '#8a7465' },
});
