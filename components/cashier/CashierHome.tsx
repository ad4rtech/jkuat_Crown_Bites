import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Printer, CheckCircle2, AlertTriangle, Info, X,
  ChevronRight, ArrowRight, CircleDot,
} from 'lucide-react-native';

import { useCashierStore, CashierNotification } from '../../store/cashierStore';
import { useOrderStore, ActiveOrderWithItems } from '../../store/orderStore';
import { useTableStore } from '../../store/tableStore';
import { formatMinutesAgo } from '../../lib/timeFormat';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function minutesSince(isoString: string): number {
  return Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
}

function formatWait(mins: number, createdAt: string): string {
  // Strip " ago" from formatMinutesAgo because CashierHome prepends/appends things manually
  const formatted = formatMinutesAgo(mins, createdAt);
  return formatted.replace(' ago', '');
}

function tableLabel(id: string): string {
  return `Table ${id.replace(/\D/g, '')}`;
}

type BillStatus = 'requested' | 'in_progress';

function resolveBillStatus(order: ActiveOrderWithItems): BillStatus | null {
  if (order.payment_status === 'paid') return null;
  if (order.payment_method === 'Cash') return 'requested';
  if (order.status === 'Ready' || order.status === 'Served') return 'requested';
  if (order.status === 'In Prep' || order.status === 'Pending') return null;
  return 'in_progress';
}

// ─── Notification Banner ──────────────────────────────────────────────────────
const NOTIF_CFG: Record<string, { bg: string; icon: React.ReactNode }> = {
  error:   { bg: '#c0392b', icon: <Printer   size={18} color="#fff" /> },
  success: { bg: '#27ae60', icon: <CheckCircle2 size={18} color="#fff" /> },
  warning: { bg: '#e67e22', icon: <AlertTriangle size={18} color="#fff" /> },
  info:    { bg: '#2980b9', icon: <Info       size={18} color="#fff" /> },
};

function NotifBanner({ notif }: { notif: CashierNotification }) {
  const { dismissNotification } = useCashierStore();
  const cfg = NOTIF_CFG[notif.level] ?? NOTIF_CFG['info'];

  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      exiting={FadeOut.duration(250)}
      style={[nb.banner, { backgroundColor: cfg.bg }]}
    >
      <View style={nb.iconWrap}>{cfg.icon}</View>
      <Text style={nb.text} numberOfLines={2}>{notif.message}</Text>
      <TouchableOpacity style={nb.closeBtn} onPress={() => dismissNotification(notif.id)}>
        <X size={15} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>
    </Animated.View>
  );
}
const nb = StyleSheet.create({
  banner:   { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 8, gap: 10 },
  iconWrap: { flexShrink: 0 },
  text:     { flex: 1, fontFamily: 'LexendSemiBold', fontSize: 13, color: '#fff', lineHeight: 18 },
  closeBtn: { padding: 4 },
});

// ─── Bill Queue Card ──────────────────────────────────────────────────────────
function BillCard({
  order, index, onPress,
}: { order: ActiveOrderWithItems; index: number; onPress: () => void }) {
  const status = resolveBillStatus(order);
  if (!status) return null;

  const mins    = minutesSince(order.created_at);
  const label   = tableLabel(order.table_id);
  const isReq   = status === 'requested';
  const dotColor   = isReq ? '#ef4444' : '#f59e0b';
  const borderColor = isReq ? '#ef4444' : '#f59e0b';
  const statusText = isReq ? 'Bill Requested' : 'Bill in Progress';
  const timeText   = isReq ? `Waiting ${formatWait(mins, order.created_at)}` : `Opened ${formatWait(mins, order.created_at)} ago`;

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(380)}>
      <TouchableOpacity style={[bc.card, { borderLeftColor: borderColor }]} onPress={onPress} activeOpacity={0.85}>
        <View style={bc.info}>
          <Text style={bc.tableName}>{label}</Text>
          <View style={bc.statusRow}>
            <CircleDot size={13} color={dotColor} fill={dotColor} />
            <Text style={[bc.statusText, { color: dotColor }]}>{statusText}</Text>
          </View>
          <Text style={bc.timeText}>{timeText}</Text>
        </View>
        <TouchableOpacity style={bc.arrowBtn} onPress={onPress}>
          <ArrowRight size={18} color="#fff" />
        </TouchableOpacity>
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
  timeText:   { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },
  arrowBtn:   { width: 42, height: 42, borderRadius: 21, backgroundColor: '#db8221', justifyContent: 'center', alignItems: 'center' },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CashierHome({ onBillPress }: { onBillPress: (order: ActiveOrderWithItems) => void }) {
  const { activeOrders, paidOrders, fetchActiveOrders, fetchPaidOrders, subscribeToOrders } = useOrderStore();
  const { notifications } = useCashierStore();
  const { fetchTables } = useTableStore();
  const router = useRouter();

  useFocusEffect(useCallback(() => {
    fetchActiveOrders();
    fetchPaidOrders('Today');
    fetchTables();
    const unsub = subscribeToOrders();
    return unsub;
  }, []));

  // Derived metrics
  const billQueue = activeOrders
    .filter(o => resolveBillStatus(o) !== null)
    .sort((a, b) => minutesSince(b.created_at) - minutesSince(a.created_at));
    
  const pendingBillsCount = billQueue.filter(o => resolveBillStatus(o) === 'requested').length;
  const totalRevenue = paidOrders.reduce((s, o) => s + o.total_amount, 0);
  const tablesServed = paidOrders.length;



  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {/* Header Info */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.headerInfo}>
        <View style={styles.headerInfoLeft}>
          <Text style={styles.shiftTitle}>Active Shift</Text>
          <Text style={styles.shiftDate}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>Cashier</Text>
        </View>
      </Animated.View>

      {/* Revenue Card */}
      <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>TODAY'S REVENUE</Text>
        <Text style={styles.revenueValue}>
          KES {totalRevenue > 0 ? totalRevenue.toLocaleString() : '0'}
        </Text>
      </Animated.View>

      {/* KPI Row */}
      <Animated.View entering={FadeInDown.delay(90).duration(400)} style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>TABLES SERVED</Text>
          <Text style={styles.kpiValue}>{tablesServed}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>PENDING BILLS</Text>
          <Text style={[styles.kpiValue, pendingBillsCount > 0 && { color: '#ef4444' }]}>
            {pendingBillsCount}
          </Text>
        </View>
      </Animated.View>


      {/* Pending Bills Queue */}
      <Animated.View entering={FadeInDown.delay(140).duration(400)}>
        <Text style={styles.sectionTitle}>Pending Bills Queue</Text>

        {billQueue.length === 0 ? (
          <View style={styles.emptyQueue}>
            <CheckCircle2 size={32} color="#10b981" />
            <Text style={styles.emptyQueueText}>All bills are cleared!</Text>
          </View>
        ) : (
          billQueue
            .sort((a, b) => minutesSince(b.created_at) - minutesSince(a.created_at))
            .map((order, i) => (
              <BillCard
                key={order.id}
                order={order}
                index={i}
                onPress={() => onBillPress(order)}
              />
            ))
        )}
      </Animated.View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#faf5ef' },
  scroll:       { padding: 16, paddingBottom: 100 },

  headerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  headerInfoLeft: { gap: 4 },
  shiftTitle: { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#8a7465', textTransform: 'uppercase', letterSpacing: 1 },
  shiftDate: { fontFamily: 'LexendBold', fontSize: 16, color: '#1c120f' },
  headerBadge: { backgroundColor: '#db8221', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  headerBadgeText: { fontFamily: 'LexendBold', fontSize: 12, color: '#fff' },

  revenueCard:  { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  revenueLabel: { fontFamily: 'LexendSemiBold', fontSize: 11, color: '#8a7465', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  revenueValue: { fontFamily: 'LexendBold', fontSize: 32, color: '#1c120f' },

  kpiRow:       { flexDirection: 'row', gap: 12, marginBottom: 12 },
  kpiCard:      { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  kpiLabel:     { fontFamily: 'LexendSemiBold', fontSize: 10, color: '#8a7465', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  kpiValue:     { fontFamily: 'LexendBold', fontSize: 28, color: '#1c120f' },

  shiftBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f4ebe1', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e8ddd4' },
  shiftBtnText: { fontFamily: 'LexendSemiBold', fontSize: 15, color: '#705f55' },

  sectionTitle: { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f', marginBottom: 14 },

  emptyQueue:     { backgroundColor: '#fff', borderRadius: 16, padding: 40, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#f0e6d8' },
  emptyQueueText: { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#8a7465' },
});
