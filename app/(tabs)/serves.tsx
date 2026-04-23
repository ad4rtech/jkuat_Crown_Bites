import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Bell, CheckCircle2, Clock, Flame, Utensils, Armchair, BellRing } from 'lucide-react-native';
import Animated, { FadeInDown, Layout, SlideOutRight } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

type OrderStatus = 'Ready' | 'In Prep' | 'Pending';

type OrderItem = {
  qty: number;
  name: string;
  notes?: string;
};

type ActiveOrder = {
  id: string;
  tableId: string;
  orderId: string;
  timeAgo: string;
  status: OrderStatus;
  items: OrderItem[];
};

const INITIAL_ORDERS: ActiveOrder[] = [
  {
    id: 'o1',
    tableId: 'Table T3',
    orderId: '#1042',
    timeAgo: '12 mins ago',
    status: 'Ready',
    items: [
      { qty: 1, name: 'Classic Cheese Burger', notes: '- No onions' },
      { qty: 2, name: 'Crispy Fries' }
    ]
  },
  {
    id: 'o2',
    tableId: 'Table T1',
    orderId: '#1045',
    timeAgo: '6 mins ago',
    status: 'In Prep',
    items: [
      { qty: 2, name: 'Grilled Salmon' },
      { qty: 1, name: 'Caesar Salad' }
    ]
  },
  {
    id: 'o3',
    tableId: 'Table P2',
    orderId: '#1046',
    timeAgo: '4 mins ago',
    status: 'In Prep',
    items: [
      { qty: 3, name: 'Margarita Pizza' }
    ]
  },
  {
    id: 'o4',
    tableId: 'Table T5',
    orderId: '#1048',
    timeAgo: 'Just now',
    status: 'Pending',
    items: [
      { qty: 4, name: 'Sparkling Water' },
      { qty: 1, name: 'Truffle Fries' }
    ]
  }
];

export default function ServesScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [orders, setOrders] = useState<ActiveOrder[]>(INITIAL_ORDERS);
  const [animationKey, setAnimationKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setAnimationKey(prev => prev + 1);
    }, [])
  );

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'All') return orders;
    return orders.filter(o => o.status === activeFilter);
  }, [activeFilter, orders]);

  const counts = useMemo(() => {
    return {
      All: orders.length,
      Ready: orders.filter(o => o.status === 'Ready').length,
      'In Prep': orders.filter(o => o.status === 'In Prep').length,
      Pending: orders.filter(o => o.status === 'Pending').length,
    };
  }, [orders]);

  const FILTERS = [
    { id: 'All', label: `All (${counts.All})` },
    { id: 'Ready', label: `Ready (${counts.Ready})` },
    { id: 'In Prep', label: `In Prep (${counts['In Prep']})` },
    { id: 'Pending', label: `Pending (${counts.Pending})` },
  ];

  const handleMarkServed = (id: string) => {
    // In a real app, make an API call to mark as served
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const renderBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Ready':
        return (
          <View style={[styles.badge, { backgroundColor: '#ecfdf5' }]}>
            <CheckCircle2 size={12} color="#10b981" />
            <Text style={[styles.badgeText, { color: '#10b981' }]}>Ready</Text>
          </View>
        );
      case 'In Prep':
        return (
          <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
            <Flame size={12} color="#f59e0b" />
            <Text style={[styles.badgeText, { color: '#f59e0b' }]}>In Prep</Text>
          </View>
        );
      case 'Pending':
        return (
          <View style={[styles.badge, { backgroundColor: '#f4ebe1' }]}>
            <Clock size={12} color="#8a7465" />
            <Text style={[styles.badgeText, { color: '#8a7465' }]}>Pending</Text>
          </View>
        );
    }
  };

  const renderCard = (order: ActiveOrder, index: number) => {
    const isReady = order.status === 'Ready';

    return (
      <Animated.View 
        key={order.id} 
        entering={FadeInDown.delay(index * 100)}
        exiting={SlideOutRight}
        layout={Layout.springify()}
        style={[
          styles.cardWrapper, 
          isReady ? styles.cardWrapperReady : styles.cardWrapperStandard
        ]}
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
              <Text style={styles.cardTitle}>{order.tableId}</Text>
            </View>
            {renderBadge(order.status)}
          </View>

          <Text style={styles.cardSubtitle}>
            Order {order.orderId} • {order.timeAgo}
          </Text>

          <View style={styles.divider} />

          <View style={styles.itemsList}>
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemRowMain}>
                  <Text style={styles.itemQty}>{item.qty}x</Text>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
                  </View>
                </View>
              </View>
            ))}
          </View>

          {isReady && (
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => handleMarkServed(order.id)}
            >
              <Utensils size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Mark as Served</Text>
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
        <TouchableOpacity style={styles.iconButton}>
          <User size={22} color="#1c120f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Orders</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Bell size={22} color="#1c120f" />
          <View style={styles.notificationDot} />
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

      {/* Orders List */}
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfaf5', // Cream
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f4ebe1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#f4ebe1',
  },
  headerTitle: {
    fontFamily: 'LexendBold',
    fontSize: 20,
    color: '#1c120f',
  },
  filtersWrapper: {
    marginBottom: 20,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f4ebe1',
  },
  filterPillActive: {
    backgroundColor: '#2c1e19',
  },
  filterText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 14,
    color: '#705f55',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  cardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  cardWrapperStandard: {
    borderWidth: 1,
    borderColor: '#f0e6d8',
  },
  cardWrapperReady: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  readyBanner: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readyBannerText: {
    fontFamily: 'LexendBold',
    fontSize: 12,
    color: '#ffffff',
    letterSpacing: 1,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontFamily: 'LexendBold',
    fontSize: 22,
    color: '#1c120f',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    fontFamily: 'LexendBold',
    fontSize: 12,
  },
  cardSubtitle: {
    fontFamily: 'Lexend',
    fontSize: 13,
    color: '#8a7465',
    marginLeft: 32, // align with title
  },
  divider: {
    height: 1,
    backgroundColor: '#f0e6d8',
    marginVertical: 16,
    borderStyle: 'dashed',
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'column',
  },
  itemRowMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemQty: {
    fontFamily: 'LexendBold',
    fontSize: 15,
    color: '#8a7465',
    width: 24,
  },
  itemName: {
    fontFamily: 'LexendSemiBold',
    fontSize: 15,
    color: '#1c120f',
  },
  itemNotes: {
    fontFamily: 'Lexend',
    fontSize: 12,
    color: '#a89485',
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  actionBtnText: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#ffffff',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Lexend',
    fontSize: 16,
    color: '#8a7465',
  }
});
