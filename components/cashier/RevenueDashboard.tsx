import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator
} from 'react-native';
import { Calendar, TrendingUp, Banknote } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useReportsStore } from '../../store/reportsStore';
import { useCashierStore } from '../../store/cashierStore';

type FilterType = 'Today' | 'Yesterday' | 'This Week' | 'This Month';

type OrderData = {
  id: string;
  table_id: string;
  payment_method?: string;
  total_amount: number;
  created_at: string;
};

type DiscountItem = {
  itemName: string;
  tableId: string;
  unitPrice: number;
  orderId: string;
  createdAt: string;
};

export default function RevenueDashboard() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('Today');
  const [allOrders, setAllOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const { voidDiscountLog, fetchDiscounts } = useReportsStore();
  const { shiftCashTendered, shiftChangeDispensed } = useCashierStore();

  const fetchAnalytics = async () => {
    if (!isSupabaseConfigured) return;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('orders')
      .select('id, table_id, payment_method, total_amount, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAllOrders(data as OrderData[]);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
      fetchDiscounts();
      if (!isSupabaseConfigured) return;
      const channel = supabase
        .channel('cashier-analytics-reports')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchAnalytics)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'discounts' }, fetchDiscounts)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }, [])
  );

  // ── Date Filtering ──
  const now = new Date();
  let startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  let endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  if (activeFilter === 'Yesterday') {
    startDate.setDate(now.getDate() - 1);
    endDate.setDate(now.getDate() - 1);
  } else if (activeFilter === 'This Week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startDate.setDate(diff);
  } else if (activeFilter === 'This Month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const filteredOrders = allOrders.filter(o => {
    const d = new Date(o.created_at);
    return d >= startDate && d <= endDate;
  });

  // ── Metrics ──
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const txCount = filteredOrders.length;

  // Split logic (Deterministic Mock since DB doesn't track payment methods)
  let cashRevenue = 0;
  let cashCount = 0;
  let mobileRevenue = 0;
  let mobileCount = 0;

  filteredOrders.forEach((o) => {
    if (o.payment_method === 'Cash') {
      cashRevenue += o.total_amount;
      cashCount++;
    } else if (o.payment_method === 'M-Pesa') {
      mobileRevenue += o.total_amount;
      mobileCount++;
    }
  });

  // Expected Cash = Cash Payments + 4200 (mock float) - Change Dispensed (Wait, if Cash Revenue is exactly the Bill sum, then the bill sum is exactly what belongs to the restaurant. But if the user explicitly wants:
  // "the change to be return should be subtracted from the expected cash in till section in shift reports"
  // Let's assume the "Expected Cash" previously was exactly `Cash Payments + 4200`. 
  // If the Cashier tracks "Cash Tendered", then:
  // Expected Cash = (shiftCashTendered > 0 ? shiftCashTendered : cashRevenue) + 4200 - shiftChangeDispensed;
  const computedCash = shiftCashTendered > 0 ? shiftCashTendered - shiftChangeDispensed : cashRevenue;
  const expectedCash = computedCash > 0 ? computedCash + 4200 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#db8221" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerCenter}>
                <Text style={styles.headerBrand}>CASHIER SHIFT DATA</Text>
                <Text style={styles.headerTitle}>Shift Reports</Text>
              </View>
              <Calendar size={22} color="#1c120f" style={styles.headerIcon} />
            </View>

            {/* Filters */}
            <View style={{ marginBottom: 20 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRowScroll}>
                {(['Today', 'Yesterday', 'This Week', 'This Month'] as FilterType[]).map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                    onPress={() => setActiveFilter(filter)}
                  >
                    <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Shift Performance */}
            <Text style={styles.sectionTitle}>Shift Performance</Text>
            
            <View style={styles.card}>
              <Text style={styles.cardLabel}>TOTAL REVENUE</Text>
              <View style={styles.cardRow}>
                <View>
                  <Text style={styles.cardValue}>KES {totalRevenue.toLocaleString()}</Text>
                  <Text style={styles.cardSub}>{txCount} Transactions Processed</Text>
                </View>
                <View style={styles.iconWrapOrange}>
                  <TrendingUp size={18} color="#1c120f" />
                </View>
              </View>
            </View>

            <View style={[styles.card, styles.cardGreen]}>
              <Text style={styles.cardLabel}>EXPECTED CASH IN TILL</Text>
              <View style={styles.cardRow}>
                <View>
                  <Text style={[styles.cardValue, { color: '#059669' }]}>KES {expectedCash.toLocaleString()}</Text>
                  <Text style={styles.cardSub}>Match against physical float</Text>
                </View>
                <View style={styles.iconWrapGreen}>
                  <Banknote size={18} color="#059669" />
                </View>
              </View>
            </View>

            <View style={styles.splitRow}>
              <View style={[styles.card, { flex: 1, marginBottom: 0 }]}>
                <Text style={styles.cardLabel}>CASH PAYMENTS</Text>
                <Text style={[styles.cardValue, { fontSize: 18, marginBottom: 4 }]}>KES {cashRevenue.toLocaleString()}</Text>
                {shiftChangeDispensed > 0 && (
                  <Text style={[styles.cardSub, { color: '#dc2626', marginTop: 2 }]}>
                    - KES {shiftChangeDispensed.toLocaleString()} (Change)
                  </Text>
                )}
                <Text style={[styles.cardSub, { marginTop: shiftChangeDispensed > 0 ? 2 : 0 }]}>
                  {cashCount} transactions
                </Text>
              </View>
              <View style={[styles.card, { flex: 1, marginBottom: 0 }]}>
                <Text style={styles.cardLabel}>MOBILE MONEY</Text>
                <Text style={[styles.cardValue, { fontSize: 18, marginBottom: 4 }]}>KES {mobileRevenue.toLocaleString()}</Text>
                <Text style={styles.cardSub}>{mobileCount} transactions</Text>
              </View>
            </View>

            {/* Transaction Log */}
            <Text style={styles.sectionTitle}>Transaction Log</Text>
            <View style={styles.listContainer}>
              {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                const tableNum = order.table_id.replace(/\D/g, '');
                const orderId = order.id.slice(-4).toUpperCase();
                const isCash = order.payment_method === 'Cash';
                const timeStr = new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                
                return (
                  <View key={order.id} style={styles.listItem}>
                    <View>
                      <Text style={styles.listMain}>Table {tableNum} • Order #{orderId}</Text>
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, isCash ? styles.badgeCash : styles.badgeMobile]}>
                          <Text style={[styles.badgeText, isCash ? styles.badgeTextCash : styles.badgeTextMobile]}>
                            {isCash ? 'CASH' : 'M-PESA'}
                          </Text>
                        </View>
                        <Text style={styles.listSub}>Waiter: Staff</Text>
                      </View>
                    </View>
                    <View style={styles.listRight}>
                      <Text style={styles.listMain}>KES {order.total_amount.toLocaleString()}</Text>
                      <Text style={styles.listSub}>{timeStr}</Text>
                    </View>
                  </View>
                );
              }) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={styles.listSub}>No transactions found.</Text>
                </View>
              )}
              
            </View>

            {/* Discounts Log — orders that had discounts applied */}
            <Text style={styles.sectionTitle}>Discounts Log</Text>
            <View style={styles.listContainer}>
              {voidDiscountLog.filter(r => r.type === 'discount').length > 0
                ? voidDiscountLog
                    .filter(r => r.type === 'discount')
                    .map((record, i, arr) => {
                      const timeStr = record.timestamp
                        ? new Date(record.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                        : '--:--';
                      const isLast = i === arr.length - 1;
                      return (
                        <View key={record.id} style={[styles.listItem, isLast && { borderBottomWidth: 0 }]}>
                          <View style={styles.listLeft}>
                            <Text style={styles.listMain} numberOfLines={2}>{record.itemName}</Text>
                            <View style={styles.badgeRow}>
                              <View style={[styles.badge, styles.badgeDiscount]}>
                                <Text style={[styles.badgeText, styles.badgeTextDiscount]}>DISCOUNT</Text>
                              </View>
                              <Text style={styles.listSub} numberOfLines={1}>{record.reason} • Auth: {record.auth}</Text>
                            </View>
                          </View>
                          <View style={styles.listRight}>
                            <Text style={[styles.listMain, { color: '#059669' }]}>-KES {record.amount.toLocaleString()}</Text>
                            <Text style={styles.listSub}>{timeStr}</Text>
                          </View>
                        </View>
                      );
                    })
                : (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={styles.listSub}>No discounts logged this session.</Text>
                  </View>
                )
              }
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#faf5ef' },
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16 },

  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  headerCenter: { alignItems: 'center' },
  headerBrand: { fontFamily: 'LexendBold', fontSize: 10, color: '#a38d7d', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f' },
  headerIcon: { position: 'absolute', right: 0 },

  filtersRowScroll: { flexDirection: 'row', gap: 10, paddingRight: 16 },
  filterChip: { backgroundColor: '#f0e6d8', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  filterChipActive: { backgroundColor: '#2a1e1a' },
  filterText: { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#1c120f' },
  filterTextActive: { color: '#fff' },

  sectionTitle: { fontFamily: 'LexendBold', fontSize: 16, color: '#1c120f', marginBottom: 12 },

  card: { backgroundColor: '#faf5ef', borderWidth: 1, borderColor: '#f0e6d8', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardGreen: { borderLeftWidth: 4, borderLeftColor: '#059669' },
  cardLabel: { fontFamily: 'LexendSemiBold', fontSize: 11, color: '#8a7465', textTransform: 'uppercase', marginBottom: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardValue: { fontFamily: 'LexendBold', fontSize: 24, color: '#1c120f' },
  cardSub: { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465', marginTop: 4 },

  iconWrapOrange: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0e6d8', justifyContent: 'center', alignItems: 'center' },
  iconWrapGreen: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' },

  splitRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },

  listContainer: { backgroundColor: '#faf5ef', borderWidth: 1, borderColor: '#f0e6d8', borderRadius: 12, marginBottom: 24 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0e6d8' },
  listLeft: { flex: 1, marginRight: 12 },
  listMain: { fontFamily: 'LexendBold', fontSize: 14, color: '#1c120f', marginBottom: 6, flexShrink: 1 },
  listRight: { alignItems: 'flex-end', flexShrink: 0, minWidth: 80 },
  listSub: { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },
  
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontFamily: 'LexendBold', fontSize: 9 },
  
  badgeCash: { backgroundColor: '#d1fae5' },
  badgeTextCash: { color: '#059669' },
  badgeMobile: { backgroundColor: '#fef3c7' },
  badgeTextMobile: { color: '#d97706' },
  badgeVoid: { backgroundColor: '#fee2e2' },
  badgeTextVoid: { color: '#ef4444' },
  badgeDiscount: { backgroundColor: '#ede9fe' },
  badgeTextDiscount: { color: '#8b5cf6' },

  viewAllBtn: { padding: 16, alignItems: 'center' },
  viewAllText: { fontFamily: 'LexendBold', fontSize: 13, color: '#db8221' },
});
