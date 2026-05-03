import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator
} from 'react-native';
import { Bell, Menu, TrendingUp, TrendingDown, Download, FileText, ChevronDown, X } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const { width } = Dimensions.get('window');

type FilterType = 'Today' | 'Yesterday' | 'This Week' | 'This Month';

type OrderData = {
  id: string;
  total_amount: number;
  created_at: string;
  items: { qty: number; name: string; category: string; price: number }[];
};

export default function SalesAnalytics({ onClose }: { onClose?: () => void }) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('This Week');
  const [allOrders, setAllOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!isSupabaseConfigured) return;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, total_amount, created_at,
        order_items (
          quantity, unit_price,
          manager_menu_items ( name, menu_categories ( name ) )
        )
      `)
      .eq('payment_status', 'paid')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (!error && data) {
      const parsed = data.map((o: any) => ({
        id: o.id,
        total_amount: o.total_amount,
        created_at: o.created_at,
        items: (o.order_items ?? []).map((oi: any) => ({
          qty: oi.quantity,
          price: oi.unit_price,
          name: oi.manager_menu_items?.name ?? 'Unknown',
          category: oi.manager_menu_items?.menu_categories?.name ?? 'Other',
        })),
      }));
      setAllOrders(parsed);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
      if (!isSupabaseConfigured) return;
      const channel = supabase
        .channel('analytics-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchAnalytics)
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
    const day = now.getDay() || 7;
    startDate.setDate(now.getDate() - day + 1);
  } else if (activeFilter === 'This Month') {
    startDate.setDate(now.getDate() - 30);
  }

  const filteredOrders = allOrders.filter(o => {
    const d = new Date(o.created_at);
    return d >= startDate && d <= endDate;
  });

  // ── KPI Calcs ──
  const netRevenue = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const orderCount = filteredOrders.length;
  const avgOrderValue = orderCount > 0 ? Math.round(netRevenue / orderCount) : 0;

  // Last Period (for trends)
  let lastStart = new Date(startDate);
  let lastEnd = new Date(endDate);
  if (activeFilter === 'Today' || activeFilter === 'Yesterday') {
    lastStart.setDate(lastStart.getDate() - 1);
    lastEnd.setDate(lastEnd.getDate() - 1);
  } else if (activeFilter === 'This Week') {
    lastStart.setDate(lastStart.getDate() - 7);
    lastEnd.setDate(lastEnd.getDate() - 7);
  } else if (activeFilter === 'This Month') {
    lastStart.setMonth(lastStart.getMonth() - 1);
    lastEnd.setMonth(lastEnd.getMonth() - 1);
  }

  const lastOrders = allOrders.filter(o => {
    const d = new Date(o.created_at);
    return d >= lastStart && d <= lastEnd;
  });
  const lastNet = lastOrders.reduce((s, o) => s + o.total_amount, 0);
  const lastCount = lastOrders.length;
  const lastAvg = lastCount > 0 ? Math.round(lastNet / lastCount) : 0;

  const revTrend = lastNet > 0 ? ((netRevenue - lastNet) / lastNet) * 100 : 0;
  const ordTrend = lastCount > 0 ? ((orderCount - lastCount) / lastCount) * 100 : 0;
  const avgTrend = lastAvg > 0 ? ((avgOrderValue - lastAvg) / lastAvg) * 100 : 0;

  const formatTrend = (n: number) => n > 0 ? `+${n.toFixed(1)}%` : `${n.toFixed(1)}%`;
  const trendLabel = `vs ${activeFilter === 'This Month' ? 'last month' : activeFilter === 'This Week' ? 'last week' : 'yesterday'}`;

  // ── Chart ──
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const chartBars = last7Days.map(d => {
    const st = new Date(d); st.setHours(0,0,0,0);
    const en = new Date(d); en.setHours(23,59,59,999);
    const dayOrders = allOrders.filter(o => {
      const od = new Date(o.created_at);
      return od >= st && od <= en;
    });
    const val = dayOrders.reduce((s, o) => s + o.total_amount, 0);
    return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), val };
  });
  const maxChartVal = Math.max(...chartBars.map(b => b.val), 1);
  const chartTotal = chartBars.reduce((s, b) => s + b.val, 0);

  // ── Top Items ──
  const itemCounts: Record<string, { qty: number, rev: number, cat: string }> = {};
  filteredOrders.forEach(o => {
    o.items.forEach(i => {
      if (!itemCounts[i.name]) itemCounts[i.name] = { qty: 0, rev: 0, cat: i.category };
      itemCounts[i.name].qty += i.qty;
      itemCounts[i.name].rev += i.qty * i.price;
    });
  });
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 4)
    .map((x, i) => ({ rank: i + 1, name: x[0], desc: `${x[1].cat} • ${x[1].qty} orders`, rev: x[1].rev }));

  // ── Category Revenue ──
  const catRev: Record<string, number> = {};
  filteredOrders.forEach(o => {
    o.items.forEach(i => {
      catRev[i.category] = (catRev[i.category] || 0) + (i.qty * i.price);
    });
  });
  const totalCatRev = Object.values(catRev).reduce((s, x) => s + x, 0);
  const catProgress = Object.entries(catRev)
    .sort((a, b) => b[1] - a[1])
    .map((c, i) => {
      const pct = totalCatRev > 0 ? (c[1] / totalCatRev) * 100 : 0;
      const colors = ['#e88b2f', '#f5a623', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];
      return { name: c[0], pct: pct.toFixed(0) + '%', fill: pct, color: colors[i % colors.length] };
    });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <X size={22} color="#1c120f" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerBrand}>CROWN BITES ROKMS</Text>
            <Text style={styles.headerTitle}>Sales Analytics</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#db8221" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            
            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
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

            {/* KPI Grid */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <FileText size={12} color="#8a7465" />
                  <Text style={styles.kpiLabel}>Net Revenue</Text>
                </View>
                <Text style={styles.kpiValue}>KES {netRevenue.toLocaleString()}</Text>
                <View style={styles.kpiTrendRow}>
                  {revTrend >= 0 ? <TrendingUp size={12} color="#059669" /> : <TrendingDown size={12} color="#ef4444" />}
                  <Text style={revTrend >= 0 ? styles.kpiTrendPos : styles.kpiTrendNeg}> {formatTrend(revTrend)} {trendLabel}</Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <FileText size={12} color="#8a7465" />
                  <Text style={styles.kpiLabel}>Orders</Text>
                </View>
                <Text style={styles.kpiValue}>{orderCount.toLocaleString()}</Text>
                <View style={styles.kpiTrendRow}>
                  {ordTrend >= 0 ? <TrendingUp size={12} color="#059669" /> : <TrendingDown size={12} color="#ef4444" />}
                  <Text style={ordTrend >= 0 ? styles.kpiTrendPos : styles.kpiTrendNeg}> {formatTrend(ordTrend)} {trendLabel}</Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <Menu size={12} color="#8a7465" />
                  <Text style={styles.kpiLabel}>Avg. Order Value</Text>
                </View>
                <Text style={styles.kpiValue}>KES {avgOrderValue.toLocaleString()}</Text>
                <View style={styles.kpiTrendRow}>
                  {avgTrend >= 0 ? <TrendingUp size={12} color="#059669" /> : <TrendingDown size={12} color="#ef4444" />}
                  <Text style={avgTrend >= 0 ? styles.kpiTrendPos : styles.kpiTrendNeg}> {formatTrend(avgTrend)} {trendLabel}</Text>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <FileText size={12} color="#8a7465" />
                  <Text style={styles.kpiLabel}>Total Discounts</Text>
                </View>
                <Text style={styles.kpiValue}>KES 0</Text>
                <View style={styles.kpiTrendRow}>
                  <Text style={styles.kpiTrendNeu}>0.0% of gross rev</Text>
                </View>
              </View>
            </View>

            {/* Revenue Trend Chart */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Revenue Trend</Text>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>KES {chartTotal.toLocaleString()}</Text>
              <Text style={styles.chartSubtitle}>{last7Days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} - {last7Days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</Text>

              <View style={styles.chartArea}>
                {chartBars.map((bar, i) => {
                  const isMax = bar.val === maxChartVal && maxChartVal > 0;
                  const pct = maxChartVal > 0 ? (bar.val / maxChartVal) * 100 : 0;
                  return (
                    <View key={i} style={styles.barCol}>
                      <View style={[styles.barFill, { height: `${Math.max(4, pct)}%`, backgroundColor: isMax ? '#2a1e1a' : '#e88b2f' }]} />
                      <Text style={[styles.barLabel, isMax && { color: '#1c120f', fontFamily: 'LexendBold' }]}>
                        {bar.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Top Selling Items */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Top Selling Items</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listCard}>
              {topItems.length > 0 ? topItems.map((item, i, arr) => (
                <View key={i} style={[styles.listItem, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.listRank}>{item.rank}</Text>
                  <View style={styles.listCenter}>
                    <Text style={styles.listName}>{item.name}</Text>
                    <Text style={styles.listDesc}>{item.desc}</Text>
                  </View>
                  <Text style={styles.listRev}>KES {item.rev.toLocaleString()}</Text>
                </View>
              )) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Lexend', color: '#8a7465' }}>No orders yet.</Text>
                </View>
              )}
            </View>

            {/* Revenue by Category */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Revenue by Category</Text>
            </View>

            <View style={styles.listCard}>
              {catProgress.length > 0 ? catProgress.map((cat, i) => (
                <View key={i} style={styles.catRow}>
                  <View style={styles.catHeader}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <Text style={styles.catPct}>{cat.pct}</Text>
                  </View>
                  <View style={styles.catProgressBg}>
                    <View style={[styles.catProgressFill, { width: `${cat.fill}%`, backgroundColor: cat.color }]} />
                  </View>
                </View>
              )) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Lexend', color: '#8a7465' }}>No category data.</Text>
                </View>
              )}
            </View>

            {/* Export Buttons Removed */}
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
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#faf5ef' },
  iconBtn: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerBrand: { fontFamily: 'LexendBold', fontSize: 10, color: '#a38d7d', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f' },

  scroll: { paddingHorizontal: 16, paddingTop: 10 },

  filtersScroll: { marginBottom: 16 },
  filtersContent: { gap: 10, paddingRight: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e8ddd4', backgroundColor: '#faf5ef' },
  filterChipActive: { backgroundColor: '#2a1e1a', borderColor: '#2a1e1a' },
  filterText: { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#8a7465' },
  filterTextActive: { color: '#fff' },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  kpiCard: { width: (width - 44) / 2, backgroundColor: '#faf5ef', borderWidth: 1, borderColor: '#f0e6d8', borderRadius: 12, padding: 14 },
  kpiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  kpiLabel: { fontFamily: 'LexendSemiBold', fontSize: 11, color: '#8a7465' },
  kpiValue: { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f', marginBottom: 6 },
  kpiTrendRow: { flexDirection: 'row', alignItems: 'center' },
  kpiTrendPos: { fontFamily: 'LexendBold', fontSize: 10, color: '#059669' },
  kpiTrendNeg: { fontFamily: 'LexendBold', fontSize: 10, color: '#ef4444' },
  kpiTrendNeu: { fontFamily: 'Lexend', fontSize: 10, color: '#8a7465' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f' },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dropdownBtnText: { fontFamily: 'LexendBold', fontSize: 12, color: '#db8221' },
  seeAllText: { fontFamily: 'LexendSemiBold', fontSize: 12, color: '#db8221' },

  chartCard: { backgroundColor: '#faf5ef', borderWidth: 1, borderColor: '#f0e6d8', borderRadius: 12, padding: 16, marginBottom: 24 },
  chartTitle: { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f', marginBottom: 2 },
  chartSubtitle: { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465', marginBottom: 20 },
  chartArea: { height: 160, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 20 },
  barCol: { alignItems: 'center', width: 36 },
  barFill: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 4 },
  barLabel: { fontFamily: 'Lexend', fontSize: 10, color: '#8a7465', marginTop: 8 },

  listCard: { backgroundColor: '#faf5ef', borderWidth: 1, borderColor: '#f0e6d8', borderRadius: 12, marginBottom: 24 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0e6d8' },
  listRank: { fontFamily: 'LexendBold', fontSize: 14, color: '#a38d7d', width: 24 },
  listCenter: { flex: 1 },
  listName: { fontFamily: 'LexendBold', fontSize: 13, color: '#1c120f', marginBottom: 2 },
  listDesc: { fontFamily: 'Lexend', fontSize: 11, color: '#8a7465' },
  listRev: { fontFamily: 'LexendBold', fontSize: 13, color: '#1c120f' },

  catRow: { padding: 16 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catName: { fontFamily: 'LexendBold', fontSize: 12, color: '#1c120f' },
  catPct: { fontFamily: 'LexendBold', fontSize: 12, color: '#1c120f' },
  catProgressBg: { height: 8, backgroundColor: '#e8ddd4', borderRadius: 4, overflow: 'hidden' },
  catProgressFill: { height: '100%', borderRadius: 4 },

  exportRow: { flexDirection: 'row', gap: 12 },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8ddd4', borderRadius: 10 },
  exportBtnText: { fontFamily: 'LexendBold', fontSize: 14, color: '#1c120f' },
});
