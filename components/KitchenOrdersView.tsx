import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { Clock, Play, CheckCircle, Archive, AlertTriangle, ChefHat, Timer } from 'lucide-react-native';
import { useKitchenStore, KitchenOrder, KitchenOrderStatus } from '../store/kitchenStore';
import { formatMinutesAgo } from '../lib/timeFormat';

// ─── Live minute counter hook ─────────────────────────────────────────────────
function useLiveMinutes(createdAt: string): number {
  const getMinutes = () => Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  const [minutes, setMinutes] = useState(getMinutes);
  useEffect(() => {
    const id = setInterval(() => setMinutes(getMinutes()), 30000); // refresh every 30s
    return () => clearInterval(id);
  }, [createdAt]);
  return minutes;
}

type FilterTab = 'All' | 'Pending' | 'In Prep' | 'Ready' | 'Collected';

function urgencyColor(minutes: number): string {
  if (minutes >= 20) return '#dc2626';
  if (minutes >= 10) return '#f59e0b';
  return '#059669';
}

function urgencyBg(minutes: number): string {
  if (minutes >= 20) return '#fef2f2';
  if (minutes >= 10) return '#fffbeb';
  return '#ecfdf5';
}

function statusColors(status: string) {
  if (status === 'Ready')   return { bg: '#ecfdf5', text: '#059669', border: '#6ee7b7' };
  if (status === 'In Prep') return { bg: '#fff7ed', text: '#ea580c', border: '#fdba74' };
  if (status === 'Served' || status === 'Eating')  return { bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' };
  return                           { bg: '#f8fafc', text: '#64748b', border: '#cbd5e1' };
}

function cardBorderColor(status: string, minutes: number): string {
  if (status === 'Served' || status === 'Eating') return '#d1d5db';
  if (status === 'Ready') return '#10b981';
  if (minutes >= 20) return '#ef4444';
  return '#f59e0b';
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, index }: { order: KitchenOrder; index: number }) {
  const { updateOrderStatus, archiveOrder } = useKitchenStore();
  // ✅ Always compute elapsed time live from created_at (never stale)
  const liveMinutes = useLiveMinutes(order.created_at);

  const sc = statusColors(order.status);
  const borderColor = cardBorderColor(order.status, liveMinutes);
  const timerColor = urgencyColor(liveMinutes);
  const timerBg   = urgencyBg(liveMinutes);
  const isReady   = order.status === 'Ready';
  const isPending = order.status === 'Pending';
  const isInPrep  = order.status === 'In Prep';

  const handleAction = () => {
    if (isPending) updateOrderStatus(order.id, 'In Prep');
    else if (isInPrep) updateOrderStatus(order.id, 'Ready');
    // Removed archiveOrder so Kitchen can't bypass Waiter's 'Mark as Served' flow
  };

  const tableLabel = `Table ${order.table_id.replace('T', '').padStart(2, '0')}`;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).duration(400)}
      layout={Layout.springify()}
      style={[styles.card, { borderColor }]}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.tableLabel}>{tableLabel}</Text>
          <Text style={styles.orderNum}>{order.orderNumber}</Text>
          <View style={[styles.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[styles.statusPillText, { color: sc.text }]}>{order.status}</Text>
          </View>
        </View>
        <View style={[styles.timerPill, { backgroundColor: timerBg }]}>
          <Timer size={13} color={timerColor} />
          <Text style={[styles.timerText, { color: timerColor }]}>
            {formatMinutesAgo(liveMinutes).replace(' ago', '')}
          </Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.itemsList}>
        {order.items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <View style={[styles.qtyBadge, { backgroundColor: isPending ? '#fff3e0' : isReady ? '#ecfdf5' : '#fff7ed' }]}>
              <Text style={[styles.qtyText, { color: isPending ? '#e65100' : isReady ? '#059669' : '#ea580c' }]}>
                {item.qty}
              </Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.notes && item.notes.split('\n').map((note, ni) => (
                <Text key={ni} style={styles.itemNote}>- {note}</Text>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Divider */}
      <View style={[styles.cardDivider, { backgroundColor: borderColor + '40' }]} />

      {/* Action Button */}
      {!isReady && order.status !== 'Served' && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: isPending ? '#f59e0b' : '#db8221' }]}
          onPress={handleAction}
          activeOpacity={0.85}
        >
          {isPending && <Play size={16} color="#fff" style={{ marginRight: 8 }} />}
          {isInPrep  && <CheckCircle size={16} color="#fff" style={{ marginRight: 8 }} />}
          <Text style={styles.actionBtnText}>
            {isPending ? 'Start (In Prep)' : 'Mark Ready'}
          </Text>
        </TouchableOpacity>
      )}
      {isReady && (
        <View style={[styles.actionBtn, { backgroundColor: '#ecfdf5' }]}>
          <CheckCircle size={16} color="#10b981" style={{ marginRight: 8 }} />
          <Text style={[styles.actionBtnText, { color: '#10b981' }]}>
            Waiting for Waiter to Collect
          </Text>
        </View>
      )}
      {order.status === 'Served' && (
        <View style={[styles.actionBtn, { backgroundColor: '#f3f4f6' }]}>
          <Archive size={16} color="#6b7280" style={{ marginRight: 8 }} />
          <Text style={[styles.actionBtnText, { color: '#6b7280' }]}>
            Collected
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────
export default function KitchenOrdersView() {
  const { orders } = useKitchenStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');

  const FILTER_TABS: FilterTab[] = ['All', 'Pending', 'In Prep', 'Ready', 'Collected'];

  const filtered = orders.filter(o => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Collected') return o.status === 'Served' || o.status === 'Eating';
    return o.status === activeFilter;
  });

  // Sort: Pending (urgency desc) → In Prep (urgency desc) → Ready → Served
  const sorted = [...filtered].sort((a, b) => {
    const rank = (s: string) => s === 'Pending' ? 0 : s === 'In Prep' ? 1 : s === 'Ready' ? 2 : 3;
    if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
    return b.minutesAgo - a.minutesAgo;
  });

  const activeQueue = sorted.filter(o => o.status !== 'Ready' && o.status !== 'Served' && o.status !== 'Eating');
  const readyQueue  = sorted.filter(o => o.status === 'Ready');
  const collectedQueue = sorted.filter(o => o.status === 'Served' || o.status === 'Eating');

  const urgentCount = orders.filter(o => o.minutesAgo >= 20 && o.status !== 'Ready' && o.status !== 'Served' && o.status !== 'Eating').length;

  return (
    <View style={styles.container}>

      {/* Sub-Header */}
      <View style={styles.subHeader}>
        <View style={styles.subHeaderLeft}>
          <View style={styles.activeDot} />
          <Text style={styles.activeLabel}>Active Service</Text>
        </View>
        {urgentCount > 0 && (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.urgentBadge}>
            <AlertTriangle size={13} color="#dc2626" />
            <Text style={styles.urgentText}>{urgentCount} overdue</Text>
          </Animated.View>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={styles.filterTabs}
      >
        {FILTER_TABS.map(tab => {
          const count = tab === 'All' ? orders.length : 
                        tab === 'Collected' ? orders.filter(o => o.status === 'Served' || o.status === 'Eating').length : 
                        orders.filter(o => o.status === tab).length;
          const isActive = activeFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab}
              </Text>
              <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Active Queue */}
        {activeQueue.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <ChefHat size={16} color="#db8221" />
                <Text style={styles.sectionTitle}>
                  Active Queue ({activeQueue.length})
                </Text>
              </View>
              <Text style={styles.sectionSub}>Auto-sorted by urgency</Text>
            </View>
            {activeQueue.map((order, i) => (
              <OrderCard key={order.id} order={order} index={i} />
            ))}
          </Animated.View>
        )}

        {/* Ready for Pickup */}
        {readyQueue.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <View style={[styles.sectionHeader, { marginTop: activeQueue.length > 0 ? 8 : 0 }]}>
              <View style={styles.sectionHeaderLeft}>
                <CheckCircle size={16} color="#059669" />
                <Text style={[styles.sectionTitle, { color: '#059669' }]}>
                  Ready for Pickup ({readyQueue.length})
                </Text>
              </View>
            </View>
            {readyQueue.map((order, i) => (
              <OrderCard key={order.id} order={order} index={i} />
            ))}
          </Animated.View>
        )}

        {/* Collected Orders */}
        {collectedQueue.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <View style={[styles.sectionHeader, { marginTop: (activeQueue.length > 0 || readyQueue.length > 0) ? 8 : 0 }]}>
              <View style={styles.sectionHeaderLeft}>
                <Archive size={16} color="#8a7465" />
                <Text style={[styles.sectionTitle, { color: '#8a7465' }]}>
                  Order Collected ({collectedQueue.length})
                </Text>
              </View>
            </View>
            {collectedQueue.map((order, i) => (
              <OrderCard key={order.id} order={order} index={i} />
            ))}
          </Animated.View>
        )}

        {/* Empty State */}
        {sorted.length === 0 && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyState}>
            <ChefHat size={48} color="#e2d5c8" />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySub}>No orders in this category right now.</Text>
          </Animated.View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfaf5' },
  scroll:    { paddingHorizontal: 16, paddingBottom: 16 },

  subHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  subHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  activeLabel:   { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#059669' },
  urgentBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef2f2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#fecaca' },
  urgentText:    { fontFamily: 'LexendSemiBold', fontSize: 11, color: '#dc2626' },

  filterTabs: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterTab:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f0e6d8' },
  filterTabActive:      { backgroundColor: '#1c120f', borderColor: '#1c120f' },
  filterTabText:        { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#705f55' },
  filterTabTextActive:  { color: '#fff' },
  filterCount:          { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#f0e6d8', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  filterCountActive:    { backgroundColor: '#db8221' },
  filterCountText:      { fontFamily: 'LexendBold', fontSize: 11, color: '#705f55' },
  filterCountTextActive:{ color: '#fff' },

  sectionHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle:      { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f' },
  sectionSub:        { fontFamily: 'Lexend', fontSize: 11, color: '#8a7465' },

  // Cards
  card:       { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 2, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  tableLabel: { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f' },
  orderNum:   { fontFamily: 'Lexend', fontSize: 13, color: '#8a7465' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  statusPillText: { fontFamily: 'LexendBold', fontSize: 11 },
  timerPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  timerText:  { fontFamily: 'LexendBold', fontSize: 13 },

  itemsList: { gap: 10, marginBottom: 14 },
  itemRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  qtyBadge:  { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  qtyText:   { fontFamily: 'LexendBold', fontSize: 14 },
  itemInfo:  { flex: 1 },
  itemName:  { fontFamily: 'LexendSemiBold', fontSize: 15, color: '#1c120f' },
  itemNote:  { fontFamily: 'Lexend', fontSize: 12, color: '#db8221', fontStyle: 'italic', marginTop: 2 },

  cardDivider: { height: 1, marginBottom: 14 },

  actionBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14 },
  actionBtnText: { fontFamily: 'LexendBold', fontSize: 15, color: '#ffffff' },

  emptyState:  { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle:  { fontFamily: 'LexendBold', fontSize: 22, color: '#1c120f' },
  emptySub:    { fontFamily: 'Lexend', fontSize: 14, color: '#8a7465', textAlign: 'center' },
});
