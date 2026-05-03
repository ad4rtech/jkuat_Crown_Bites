import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { Receipt, ArrowRight, CircleDot, CheckCircle2 } from 'lucide-react-native';
import { useOrderStore, ActiveOrderWithItems } from '../../store/orderStore';
import { useBillingConfigStore, computeBill } from '../../store/billingConfigStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function minutesSince(isoString: string): number {
  return Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
}
function formatWait(mins: number): string {
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m`;
}
function tableLabel(id: string) {
  return `Table ${id.replace(/\D/g, '')}`;
}

type BillStatus = 'requested' | 'in_progress';

export function resolveBillStatus(order: ActiveOrderWithItems): BillStatus | null {
  if (order.payment_status === 'paid') return null;
  if (order.payment_method === 'Cash') return 'requested';
  if (order.status === 'Ready' || order.status === 'Served') return 'requested';
  if (order.status === 'In Prep' || order.status === 'Pending') return null;
  return 'in_progress';
}

function statusCfg(status: BillStatus) {
  if (status === 'requested')
    return { dot: '#ef4444', border: '#ef4444', label: 'Bill Requested',   timePrefix: 'Waiting' };
  return    { dot: '#f59e0b', border: '#f59e0b', label: 'Bill in Progress', timePrefix: 'Opened' };
}

// ─── Bill Card ────────────────────────────────────────────────────────────────
function BillCard({
  order, index, onPress,
}: { order: ActiveOrderWithItems; index: number; onPress: () => void }) {
  const status = resolveBillStatus(order);
  const { serviceChargeRate, serviceChargeEnabled } = useBillingConfigStore();

  if (!status) return null;
  const sc   = statusCfg(status);
  const mins = minutesSince(order.created_at);

  const rawSubtotal = order.items.reduce((sum, i) => sum + i.qty * i.unit_price, 0);
  const { grandTotal } = computeBill(rawSubtotal, serviceChargeRate, serviceChargeEnabled);

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(360)}>
      <TouchableOpacity style={[bc.card, { borderLeftColor: sc.border }]} onPress={onPress} activeOpacity={0.85}>
        <View style={bc.info}>
          <Text style={bc.tableName}>{tableLabel(order.table_id)}</Text>
          <View style={bc.statusRow}>
            <CircleDot size={13} color={sc.dot} fill={sc.dot} />
            <Text style={[bc.statusText, { color: sc.dot }]}>{sc.label}</Text>
          </View>
          <Text style={bc.subRow}>
            {sc.timePrefix} {formatWait(mins)}  ·  KES {Math.max(0, grandTotal).toLocaleString()}
          </Text>
        </View>
        <View style={bc.arrowBtn}>
          <ArrowRight size={18} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const bc = StyleSheet.create({
  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: '#f0e6d8', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  info:       { flex: 1, gap: 5 },
  tableName:  { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f' },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusText: { fontFamily: 'LexendSemiBold', fontSize: 13 },
  subRow:     { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },
  arrowBtn:   { width: 42, height: 42, borderRadius: 21, backgroundColor: '#db8221', justifyContent: 'center', alignItems: 'center' },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BillsList({ onSelect }: { onSelect: (order: ActiveOrderWithItems) => void }) {
  const { activeOrders, fetchActiveOrders, subscribeToOrders } = useOrderStore();

  useFocusEffect(useCallback(() => {
    fetchActiveOrders();
    const unsub = subscribeToOrders();
    return unsub;
  }, []));

  const billQueue = activeOrders
    .filter(o => resolveBillStatus(o) !== null)
    .sort((a, b) => minutesSince(b.created_at) - minutesSince(a.created_at));

  const pending    = billQueue.filter(o => resolveBillStatus(o) === 'requested').length;
  const inProgress = billQueue.filter(o => resolveBillStatus(o) === 'in_progress').length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      {/* KPI summary */}
      <Animated.View entering={FadeInDown.duration(380)} style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: '#ef4444' }]}>{pending}</Text>
          <Text style={styles.kpiLabel}>Bill Requested</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: '#f59e0b' }]}>{inProgress}</Text>
          <Text style={styles.kpiLabel}>In Progress</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{billQueue.length}</Text>
          <Text style={styles.kpiLabel}>Total Open</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(50).duration(380)}>
        <Text style={styles.sectionTitle}>Bills Queue</Text>
      </Animated.View>

      {billQueue.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(80).duration(380)} style={styles.empty}>
          <CheckCircle2 size={40} color="#10b981" />
          <Text style={styles.emptyTitle}>All Clear!</Text>
          <Text style={styles.emptySub}>No pending bills right now.</Text>
        </Animated.View>
      ) : (
        billQueue.map((order, i) => (
          <BillCard key={order.id} order={order} index={i} onPress={() => onSelect(order)} />
        ))
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#faf5ef' },
  scroll:       { padding: 16 },
  kpiRow:       { flexDirection: 'row', gap: 10, marginBottom: 20 },
  kpiCard:      { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  kpiValue:     { fontFamily: 'LexendBold', fontSize: 26, color: '#1c120f', marginBottom: 3 },
  kpiLabel:     { fontFamily: 'Lexend', fontSize: 11, color: '#8a7465', textAlign: 'center' },
  sectionTitle: { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f', marginBottom: 14 },
  empty:        { backgroundColor: '#fff', borderRadius: 16, padding: 48, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#f0e6d8' },
  emptyTitle:   { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f' },
  emptySub:     { fontFamily: 'Lexend', fontSize: 13, color: '#8a7465' },
});
