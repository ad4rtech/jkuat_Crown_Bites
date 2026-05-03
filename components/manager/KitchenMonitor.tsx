import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { AlertTriangle, Clock, Info, X, MapPin } from 'lucide-react-native';
import { useKitchenStore, KitchenOrder } from '../../store/kitchenStore';
import { useNotificationStore } from '../../store/notificationStore';
import { formatMinutesAgo } from '../../lib/timeFormat';
import CenterToast, { useToast } from '../CenterToast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const OVERDUE_THRESHOLD = 15; // minutes

function timerColor(minutes: number) {
  if (minutes >= OVERDUE_THRESHOLD) return '#ef4444';
  if (minutes >= 8)                 return '#f59e0b';
  return '#059669';
}

function statusBadgeStyle(status: string) {
  if (status === 'Ready')   return { bg: '#ecfdf5', text: '#059669', label: 'READY'   };
  if (status === 'In Prep') return { bg: '#fff7ed', text: '#ea580c', label: 'IN PREP' };
  return                           { bg: '#f1f5f9', text: '#64748b', label: 'PENDING' };
}

function itemSummary(items: KitchenOrder['items']): string {
  return items.map(i => `${i.qty}x ${i.name}`).join(', ');
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <View style={stat.card}>
      <Text style={[stat.value, { color }]}>{value}</Text>
      <Text style={stat.label}>{label}</Text>
    </View>
  );
}
const stat = StyleSheet.create({
  card:  { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  value: { fontFamily: 'LexendBold', fontSize: 28, marginBottom: 4 },
  label: { fontFamily: 'Lexend', fontSize: 11, color: '#8a7465', textAlign: 'center' },
});

// ─── Overdue Order Card ───────────────────────────────────────────────────────
function OverdueCard({ order, onViewDetail, onContactKitchen }: { order: KitchenOrder; onViewDetail: (o: KitchenOrder) => void; onContactKitchen: (o: KitchenOrder) => void }) {
  const tableLabel = `Table ${order.table_id.replace('T', '').padStart(2, '0')}`;
  const sc = statusBadgeStyle(order.status);

  return (
    <View style={oc.card}>
      <View style={oc.header}>
        <Text style={oc.table}>{tableLabel}</Text>
        <Text style={oc.timer}>{formatMinutesAgo(order.minutesAgo).replace(' ago', '')}</Text>
      </View>
      <Text style={oc.items} numberOfLines={1}>{itemSummary(order.items)}</Text>
      <View style={oc.statusRow}>
        <Clock size={13} color={order.status === 'Pending' ? '#ef4444' : '#f59e0b'} />
        <Text style={[oc.statusText, { color: order.status === 'Pending' ? '#ef4444' : '#f59e0b' }]}>
          {order.status}
        </Text>
      </View>
      <View style={oc.btnRow}>
        <TouchableOpacity style={oc.detailBtn} onPress={() => onViewDetail(order)}>
          <Text style={oc.detailBtnText}>View Order Detail</Text>
        </TouchableOpacity>
        <TouchableOpacity style={oc.contactBtn} onPress={() => onContactKitchen(order)}>
          <Text style={oc.contactBtnText}>Contact Kitchen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const oc = StyleSheet.create({
  card:       { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#fca5a5', elevation: 2, shadowColor: '#ef4444', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  table:      { fontFamily: 'LexendBold', fontSize: 17, color: '#1c120f' },
  timer:      { fontFamily: 'LexendBold', fontSize: 16, color: '#ef4444' },
  items:      { fontFamily: 'Lexend', fontSize: 13, color: '#705f55', marginBottom: 8 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
  statusText: { fontFamily: 'LexendSemiBold', fontSize: 13 },
  btnRow:     { flexDirection: 'row', gap: 10 },
  detailBtn:  { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2d5c8', alignItems: 'center' },
  detailBtnText: { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#1c120f' },
  contactBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: '#db8221', alignItems: 'center' },
  contactBtnText: { fontFamily: 'LexendBold', fontSize: 13, color: '#fff' },
});

// ─── Live Feed Row ────────────────────────────────────────────────────────────
const WAITER_NAMES: Record<string, string> = { 'T12': 'Sarah', 'T5': 'Alex', 'T8': 'Mike', 'T2': 'Sarah', default: 'Staff' };

function FeedRow({ order, index }: { order: KitchenOrder; index: number }) {
  const tableLabel = `Table ${order.table_id.replace('T', '').padStart(2, '0')}`;
  const waiter = WAITER_NAMES[order.table_id] ?? WAITER_NAMES['default'];
  const sc = statusBadgeStyle(order.status);
  const tc = timerColor(order.minutesAgo);

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
      <View style={fr.row}>
        <View style={fr.left}>
          <View style={fr.topRow}>
            <Text style={fr.table}>{tableLabel}</Text>
            <Text style={fr.orderNum}>{order.orderNumber}</Text>
          </View>
          <Text style={fr.waiter}>Waiter: {waiter}</Text>
          <Text style={fr.items} numberOfLines={1}>{itemSummary(order.items)}</Text>
        </View>
        <View style={fr.right}>
          <Text style={[fr.time, { color: tc }]}>{formatMinutesAgo(order.minutesAgo).replace(' ago', '')}</Text>
          <View style={[fr.badge, { backgroundColor: sc.bg }]}>
            <Text style={[fr.badgeText, { color: sc.text }]}>{sc.label}</Text>
          </View>
        </View>
      </View>
      <View style={fr.divider} />
    </Animated.View>
  );
}
const fr = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  left:    { flex: 1 },
  topRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  table:   { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f' },
  orderNum:{ fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },
  waiter:  { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465', marginBottom: 3 },
  items:   { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#705f55' },
  right:   { alignItems: 'flex-end', gap: 6 },
  time:    { fontFamily: 'LexendBold', fontSize: 15 },
  badge:   { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontFamily: 'LexendBold', fontSize: 10, letterSpacing: 0.4 },
  divider: { height: 1, backgroundColor: '#f4ebe1', marginHorizontal: 16 },
});

// ─── Shift Metric Card ────────────────────────────────────────────────────────
function ShiftCard({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={sh.card}>
      <Text style={sh.value}>{value}</Text>
      <Text style={sh.label}>{label}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  card:  { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  value: { fontFamily: 'LexendBold', fontSize: 24, color: '#1c120f', marginBottom: 4 },
  label: { fontFamily: 'Lexend', fontSize: 10, color: '#8a7465', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function KitchenMonitor() {
  const { orders, fetchOrders } = useKitchenStore();
  const [countdown, setCountdown] = useState(30);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<KitchenOrder | null>(null);
  const { toast, show } = useToast();

  const handleContactKitchen = (order: KitchenOrder) => {
    useNotificationStore.getState().emitNotification(
      'Kitchen',
      'Manager Expedite',
      `Please expedite the order for Table ${order.table_id}. It is currently overdue.`,
      'error'
    );
    show({
      message: 'Alert Sent to Kitchen!',
      subMessage: `Kitchen has been notified to expedite Table ${order.table_id.replace('T', '')} immediately.`,
      type: 'warning',
      autoDismissMs: 3500,
    });
  };

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      fetchOrders();
      setCountdown(30);
    }
  }, [countdown, fetchOrders]);

  // Filter active vs historical
  const activeOrders   = orders.filter(o => o.status !== 'Served');
  const pendingOrders  = activeOrders.filter(o => o.status === 'Pending');
  const inPrepOrders   = activeOrders.filter(o => o.status === 'In Prep');
  const readyOrders    = activeOrders.filter(o => o.status === 'Ready');
  const overdueOrders  = activeOrders.filter(o => o.minutesAgo >= OVERDUE_THRESHOLD && o.status !== 'Ready');
  const liveFeed       = [...activeOrders].filter(o => o.status !== 'Ready').sort((a, b) => b.minutesAgo - a.minutesAgo);

  // Shift metrics (real-time data)
  const ordersToday = orders.length;
  // Calculate avg prep from ALL orders (active + served)
  const avgPrep     = orders.length > 0 ? Math.round(orders.reduce((s, o) => s + o.minutesAgo, 0) / orders.length) : 0;
  const longestWait = orders.length > 0 ? Math.max(...orders.map(o => o.minutesAgo)) : 0;

  return (
    <View style={styles.container}>
      <CenterToast {...toast} />
      
      {/* Custom Order Detail Modal */}
      <Modal visible={!!selectedOrderDetail} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Order #{selectedOrderDetail?.orderNumber}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <MapPin size={14} color="#8a7465" />
                  <Text style={styles.modalSubtitle}>Table {selectedOrderDetail?.table_id.replace('T', '').padStart(2, '0')}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedOrderDetail(null)}>
                <X size={20} color="#1c120f" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalSectionTitle}>Items Ordered</Text>
              {selectedOrderDetail?.items.map((item, idx) => (
                <View key={idx} style={styles.modalItemRow}>
                  <Text style={styles.modalItemQty}>{item.qty}x</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemName}>{item.name}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <View style={styles.modalFooterTime}>
                <Clock size={16} color="#ef4444" />
                <Text style={styles.modalFooterTimeText}>Overdue: {formatMinutesAgo(selectedOrderDetail?.minutesAgo || 0).replace(' ago', '')}</Text>
              </View>
              <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setSelectedOrderDetail(null)}>
                <Text style={styles.modalDoneText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Live Status Bar */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.liveBar}>
          <View style={styles.liveLeft}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE — UPDATES EVERY 30S</Text>
          </View>
          <Text style={styles.refreshText}>Refreshing in {countdown}s</Text>
        </Animated.View>

        {/* Status KPIs */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.kpiRow}>
          <StatCard value={pendingOrders.length}  label="Pending"        color="#ef4444" />
          <StatCard value={inPrepOrders.length}   label="In Preparation" color="#f59e0b" />
        </Animated.View>

        {/* Ready for Pickup — full width card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.readyCard}>
          <Text style={styles.readyValue}>{readyOrders.length}</Text>
          <Text style={styles.readyLabel}>Ready for Pickup</Text>
          <Text style={styles.readySub}>Waiting for waiter collection</Text>
        </Animated.View>

        {/* Completed + avg prep */}
        <Animated.View entering={FadeInDown.delay(130).duration(400)} style={styles.completedBar}>
          <Text style={styles.completedText}>
            {ordersToday} orders completed today  ·  Average prep time: {formatMinutesAgo(avgPrep).replace(' ago', '')}
          </Text>
        </Animated.View>

        {/* Overdue Orders */}
        {overdueOrders.length > 0 && (
          <Animated.View entering={FadeInDown.delay(160).duration(400)}>
            <View style={styles.overdueHeader}>
              <AlertTriangle size={15} color="#ef4444" />
              <Text style={styles.overdueTitle}>Overdue Orders ({overdueOrders.length})</Text>
            </View>
            {overdueOrders.map(order => (
              <OverdueCard key={order.id} order={order} onViewDetail={setSelectedOrderDetail} onContactKitchen={handleContactKitchen} />
            ))}
          </Animated.View>
        )}

        {/* Live Order Feed */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>Live Order Feed</Text>
          <View style={styles.feedCard}>
            {liveFeed.length === 0 ? (
              <View style={styles.emptyFeed}>
                <Text style={styles.emptyFeedText}>No active orders right now.</Text>
              </View>
            ) : (
              liveFeed.map((order, i) => (
                <FeedRow key={order.id} order={order} index={i} />
              ))
            )}
          </View>
        </Animated.View>

        {/* Shift Performance */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)}>
          <Text style={styles.sectionTitle}>Shift Performance</Text>
          <View style={styles.shiftRow}>
            <ShiftCard value={ordersToday} label="Orders Today"  />
            <ShiftCard value={formatMinutesAgo(avgPrep).replace(' ago', '')}   label="Avg Prep Time" />
            <ShiftCard value={formatMinutesAgo(longestWait).replace(' ago', '')} label="Longest Wait" />
          </View>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#faf5ef' },
  scroll:        { padding: 16 },

  liveBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  liveLeft:      { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  liveText:      { fontFamily: 'LexendSemiBold', fontSize: 11, color: '#059669' },
  refreshText:   { fontFamily: 'Lexend', fontSize: 11, color: '#f59e0b' },

  kpiRow:        { flexDirection: 'row', gap: 12, marginBottom: 12 },

  readyCard:     { backgroundColor: '#fff', borderRadius: 14, padding: 20, marginBottom: 14, alignItems: 'center', borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  readyValue:    { fontFamily: 'LexendBold', fontSize: 32, color: '#059669', marginBottom: 4 },
  readyLabel:    { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f', marginBottom: 2 },
  readySub:      { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },

  completedBar:  { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 18, borderWidth: 1, borderColor: '#f0e6d8' },
  completedText: { fontFamily: 'Lexend', fontSize: 12, color: '#705f55', textAlign: 'center' },

  overdueHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10, borderLeftWidth: 3, borderColor: '#ef4444', paddingLeft: 10 },
  overdueTitle:  { fontFamily: 'LexendBold', fontSize: 15, color: '#ef4444' },

  sectionTitle:  { fontFamily: 'LexendBold', fontSize: 16, color: '#1c120f', marginBottom: 12, marginTop: 4 },
  feedCard:      { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f0e6d8', overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, paddingVertical: 4 },
  emptyFeed:     { padding: 40, alignItems: 'center' },
  emptyFeedText: { fontFamily: 'Lexend', fontSize: 14, color: '#8a7465' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(28,18,15,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f0e6d8', backgroundColor: '#fdfaf5' },
  modalTitle: { fontFamily: 'LexendBold', fontSize: 22, color: '#1c120f' },
  modalSubtitle: { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#8a7465' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f4ebe1', justifyContent: 'center', alignItems: 'center' },
  modalContent: { padding: 24, backgroundColor: '#ffffff' },
  modalSectionTitle: { fontFamily: 'LexendBold', fontSize: 13, color: '#b89f8d', letterSpacing: 1, marginBottom: 16, textTransform: 'uppercase' },
  modalItemRow: { flexDirection: 'row', marginBottom: 12 },
  modalItemQty: { fontFamily: 'LexendBold', fontSize: 16, color: '#db8221', width: 32 },
  modalItemName: { fontFamily: 'LexendSemiBold', fontSize: 16, color: '#1c120f', lineHeight: 22 },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f0e6d8', backgroundColor: '#fdfaf5' },
  modalFooterTime: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalFooterTimeText: { fontFamily: 'LexendBold', fontSize: 15, color: '#ef4444' },
  modalDoneBtn: { backgroundColor: '#1c120f', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  modalDoneText: { fontFamily: 'LexendBold', fontSize: 14, color: '#ffffff' },

  shiftRow:      { flexDirection: 'row', gap: 10, marginBottom: 8 },
});
