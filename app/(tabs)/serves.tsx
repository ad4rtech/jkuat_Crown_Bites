import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Bell, CheckCircle2, Clock, Flame, Utensils, Armchair, BellRing, ChevronLeft } from 'lucide-react-native';
import Animated, { FadeInDown, Layout, SlideOutRight } from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { useOrderStore, ActiveOrderWithItems } from '../../store/orderStore';
import { useNotificationStore } from '../../store/notificationStore';
import { formatTimeAgo } from '../../lib/timeFormat';

type OrderStatus = 'Ready' | 'In Prep' | 'Pending';

export default function ServesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeOrders, ordersLoading, fetchActiveOrders, subscribeToOrders, markServed, freeTable, clearStuckOrders } = useOrderStore();
  const { unreadCount, initStore } = useNotificationStore();
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [animationKey, setAnimationKey] = useState(0);
  const [clearing, setClearing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchActiveOrders();
      initStore('Waiter');
      setAnimationKey(prev => prev + 1);
      const unsubscribe = subscribeToOrders();
      return unsubscribe;
    }, [])
  );

  const visibleOrders = useMemo(() => {
    return activeOrders.filter(o => o.status !== 'Served');
  }, [activeOrders]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'All') return visibleOrders;
    return visibleOrders.filter(o => o.status === activeFilter);
  }, [activeFilter, visibleOrders]);

  const counts = useMemo(() => ({
    All: visibleOrders.length,
    Eating: visibleOrders.filter(o => o.status === 'Eating').length,
    Ready: visibleOrders.filter(o => o.status === 'Ready').length,
    'In Prep': visibleOrders.filter(o => o.status === 'In Prep').length,
    Pending: visibleOrders.filter(o => o.status === 'Pending').length,
  }), [visibleOrders]);

  const FILTERS = [
    { id: 'All', label: `All (${counts.All})` },
    { id: 'Eating', label: `Eating (${counts.Eating})` },
    { id: 'Ready', label: `Ready (${counts.Ready})` },
    { id: 'In Prep', label: `In Prep (${counts['In Prep']})` },
    { id: 'Pending', label: `Pending (${counts.Pending})` },
  ];

  const renderBadge = (status: string) => {
    switch (status) {
      case 'Ready':
        return (
          <View style={[styles.badge, { backgroundColor: '#ecfdf5' }]}>
            <CheckCircle2 size={12} color="#10b981" />
            <Text style={[styles.badgeText, { color: '#10b981' }]}>Ready</Text>
          </View>
        );
      case 'Eating':
        return (
          <View style={[styles.badge, { backgroundColor: '#eff6ff' }]}>
            <Utensils size={12} color="#3b82f6" />
            <Text style={[styles.badgeText, { color: '#3b82f6' }]}>Eating</Text>
          </View>
        );
      case 'In Prep':
        return (
          <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
            <Flame size={12} color="#f59e0b" />
            <Text style={[styles.badgeText, { color: '#f59e0b' }]}>In Prep</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, { backgroundColor: '#f4ebe1' }]}>
            <Clock size={12} color="#8a7465" />
            <Text style={[styles.badgeText, { color: '#8a7465' }]}>Pending</Text>
          </View>
        );
    }
  };

  const renderCard = (order: ActiveOrderWithItems, index: number) => {
    const isReady = order.status === 'Ready';
    const isEating = order.status === 'Eating';
    const isPaid = order.payment_status === 'paid';
    const timeAgo = formatTimeAgo(order.created_at);

    return (
      <Animated.View
        key={order.id}
        entering={FadeInDown.delay(index * 100)}
        exiting={SlideOutRight}
        layout={Layout.springify()}
        style={[styles.cardWrapper, isReady ? styles.cardWrapperReady : styles.cardWrapperStandard]}
      >
        {isReady && (
          <View style={styles.readyBanner}>
            <BellRing size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.readyBannerText}>READY FOR PICKUP</Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Armchair size={22} color="#705f55" />
              <Text style={styles.cardTitle}>Table {order.table_id}</Text>
            </View>
            {renderBadge(order.status)}
          </View>

          <Text style={styles.cardSubtitle}>
            Order #{order.id.slice(0, 6).toUpperCase()} • {timeAgo}
          </Text>

          <View style={styles.divider} />

          <View style={styles.itemsList}>
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemRowMain}>
                  <Text style={styles.itemQty}>{item.qty}x</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
              </View>
            ))}
          </View>

          {isReady && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => markServed(order.id)}>
              <Utensils size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Mark as Served</Text>
            </TouchableOpacity>
          )}

          {isEating && (
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: isPaid ? '#ef4444' : '#9ca3af' }]} 
              onPress={() => isPaid ? freeTable(order.id, order.table_id) : null}
              activeOpacity={isPaid ? 0.8 : 1}
            >
              <CheckCircle2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>
                {isPaid ? 'Free Table' : 'Awaiting Payment'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1c120f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Orders</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')}>
          <Bell size={22} color="#1c120f" />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
          {FILTERS.map(f => {
            const isActive = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(f.id)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Stuck orders banner */}
      {counts.Pending > 0 && !ordersLoading && (
        <View style={styles.stuckBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.stuckBannerTitle}>⚠️ {counts.Pending} stuck order{counts.Pending > 1 ? 's' : ''} at Pending</Text>
            <Text style={styles.stuckBannerSub}>Orders pending over 30 min can be cleared</Text>
          </View>
          <TouchableOpacity
            style={[styles.stuckClearBtn, clearing && { opacity: 0.6 }]}
            onPress={async () => {
              if (clearing) return;
              Alert.alert(
                'Clear Stuck Orders',
                `This will mark all ${counts.Pending} stuck Pending order(s) as voided and free their tables. Continue?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                      setClearing(true);
                      const count = await clearStuckOrders();
                      setClearing(false);
                      if (count > 0) {
                        Alert.alert('Done', `${count} stuck order(s) cleared and tables freed.`);
                      } else {
                        Alert.alert('None Found', 'No orders were stuck for over 30 minutes.');
                      }
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            {clearing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.stuckClearBtnText}>Clear Stuck</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Loading */}
      {ordersLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#db8221" />
          <Text style={styles.loadingText}>Fetching orders...</Text>
        </View>
      )}

      {/* Orders List */}
      {!ordersLoading && (
        <ScrollView
          key={`list-${animationKey}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredOrders.length === 0 ? (
            <Animated.View entering={FadeInDown} style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active orders found.</Text>
            </Animated.View>
          ) : (
            filteredOrders.map((order, idx) => renderCard(order, idx))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfaf5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginTop: 10, marginBottom: 20,
  },
  iconButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#f4ebe1',
    justifyContent: 'center', alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute', top: 10, right: 10,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#f4ebe1',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fdfaf5',
  },
  bellBadgeText: {
    fontFamily: 'LexendBold',
    fontSize: 10,
    color: '#ffffff',
  },
  headerTitle: { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f' },
  filtersWrapper: { marginBottom: 20 },
  filtersContainer: { paddingHorizontal: 20, gap: 12 },
  filterPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f4ebe1' },
  filterPillActive: { backgroundColor: '#2c1e19' },
  filterText: { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#705f55' },
  filterTextActive: { color: '#ffffff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: 'Lexend', fontSize: 15, color: '#8a7465' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  cardWrapper: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#ffffff' },
  cardWrapperStandard: { borderWidth: 1, borderColor: '#f0e6d8' },
  cardWrapperReady: { borderWidth: 2, borderColor: '#10b981' },
  readyBanner: { flexDirection: 'row', backgroundColor: '#10b981', paddingVertical: 8, justifyContent: 'center', alignItems: 'center' },
  readyBannerText: { fontFamily: 'LexendBold', fontSize: 12, color: '#ffffff', letterSpacing: 1 },
  cardContent: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontFamily: 'LexendBold', fontSize: 22, color: '#1c120f' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
  badgeText: { fontFamily: 'LexendBold', fontSize: 12 },
  cardSubtitle: { fontFamily: 'Lexend', fontSize: 13, color: '#8a7465', marginLeft: 32 },
  divider: { height: 1, backgroundColor: '#f0e6d8', marginVertical: 16 },
  itemsList: { gap: 12 },
  itemRow: { flexDirection: 'column' },
  itemRowMain: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  itemQty: { fontFamily: 'LexendBold', fontSize: 15, color: '#8a7465', width: 24 },
  itemName: { fontFamily: 'LexendSemiBold', fontSize: 15, color: '#1c120f' },
  actionBtn: { flexDirection: 'row', backgroundColor: '#10b981', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  actionBtnText: { fontFamily: 'LexendBold', fontSize: 16, color: '#ffffff' },
  emptyContainer: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontFamily: 'Lexend', fontSize: 16, color: '#8a7465' },
  stuckBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  stuckBannerTitle: { fontFamily: 'LexendBold', fontSize: 13, color: '#92400e' },
  stuckBannerSub: { fontFamily: 'Lexend', fontSize: 11, color: '#b45309', marginTop: 2 },
  stuckClearBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stuckClearBtnText: { fontFamily: 'LexendBold', fontSize: 13, color: '#ffffff' },
});
