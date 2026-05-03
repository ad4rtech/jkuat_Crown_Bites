import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, {
  FadeInDown, FadeInUp, SlideInLeft, SlideOutLeft, SlideInRight, SlideOutRight,
} from 'react-native-reanimated';
import {
  Menu, HelpCircle, Home, ClipboardList, Package, X,
  ChefHat, Clock, Zap, TriangleAlert, CheckCircle, Flame,
  ArrowUpRight, LogOut, LayoutDashboard, Settings, UserCircle2,
  Thermometer, BookOpen, ShieldAlert, Bell,
} from 'lucide-react-native';
import { useKitchenStore, KitchenOrderStatus } from '../store/kitchenStore';
import { useTableStore } from '../store/tableStore';
import { useStockStore } from '../store/stockStore';
import { useReportsStore } from '../store/reportsStore';
import { useOrderStore } from '../store/orderStore';
import { formatMinutesAgo } from '../lib/timeFormat';
import KitchenOrdersView from '../components/KitchenOrdersView';
import KitchenStockView from '../components/KitchenStockView';
import { useNotificationStore } from '../store/notificationStore';
import CenterToast, { useToast } from '../components/CenterToast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStatusColor(status: string) {
  if (status === 'Ready')   return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
  if (status === 'In Prep') return { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' };
  return                           { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
}

function getActionLabel(status: string) {
  if (status === 'Ready')   return 'Collect now';
  if (status === 'In Prep') return 'Track kitchen';
  return 'View details';
}

function getNextStatus(status: string): KitchenOrderStatus {
  if (status === 'Pending')  return 'In Prep';
  if (status === 'In Prep')  return 'Ready';
  return 'Ready';
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MetricCard({ icon, label, value, sub, subColor }: {
  icon: React.ReactNode; label: string; value: number; sub: string; subColor: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>{icon}</View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={[styles.metricSub, { color: subColor }]}>{sub}</Text>
    </View>
  );
}

function FocusCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <View style={styles.focusCard}>
      <View style={styles.focusIconWrap}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.focusTitle}>{title}</Text>
        <Text style={styles.focusDesc}>{desc}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function KitchenDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { orders, fetchOrders, updateOrderStatus } = useKitchenStore();
  const { tables, fetchTables } = useTableStore();
  const { stations, fetchStock } = useStockStore();
  const { transactions } = useReportsStore();
  const { paidOrders, fetchPaidOrders } = useOrderStore();
  const stockItems = stations ? stations.flatMap(s => s.items || []) : [];
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'stock'>('home');
  const [showSidebar, setShowSidebar] = useState(false);
  const { unreadCount, initStore } = useNotificationStore();
  const { toast, show, confirm } = useToast();

  useFocusEffect(
    useCallback(() => { 
      fetchOrders(); 
      fetchTables();
      fetchStock();
      fetchPaidOrders('Today');
      initStore('Kitchen');
    }, [])
  );

  const readyCount   = orders.filter(o => o.status === 'Ready').length;
  const inPrepCount  = orders.filter(o => o.status === 'In Prep').length;
  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const totalActive  = orders.length;
  
  const prepOrders = orders.filter(o => o.status === 'In Prep' || o.status === 'Ready');
  const totalPrepMins = prepOrders.reduce((sum, o) => sum + (o.minutesAgo || 0), 0);
  const avgPrep = prepOrders.length > 0 ? Math.max(1, Math.round(totalPrepMins / prepOrders.length)) : 12;
  
  const openTables = tables.filter(t => t.status === 'available').length || 0;

  // Dynamic Today's Focus
  const readyTables = orders.filter(o => o.status === 'Ready').map(o => `Table ${o.table_id.replace('T', '')}`);
  const readyDesc = readyTables.length > 0 
    ? `${readyTables.join(', ')} ${readyTables.length === 1 ? 'is' : 'are'} ready for collection.` 
    : 'No tables are currently waiting for pickup.';

  const lowStockItems = stockItems.filter(item => item.quantity <= item.threshold).map(i => i.name);
  const stockDesc = lowStockItems.length > 0 
    ? `${lowStockItems.slice(0, 3).join(', ')}${lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more` : ''} trending low.` 
    : 'All stock levels are currently healthy.';
  const lowStockCount = lowStockItems.length;
  const servedToday = paidOrders.length;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = '8:00 AM – 4:00 PM';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfaf5" />
      <CenterToast {...toast} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSidebar(true)}>
          <Menu size={22} color="#1c120f" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerBrand}>Crown Bites</Text>
          <Text style={styles.headerTitle}>
            {activeTab === 'orders' ? 'Kitchen Display' : activeTab === 'stock' ? 'Ingredient Status' : 'Staff Dashboard'}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => {
          if (activeTab === 'orders') router.push('/kitchen-notifications');
          else router.push('/kitchen-help' as any);
        }}>
          {activeTab === 'orders' ? (
            <View>
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount}</Text>
                </View>
              )}
              <Bell size={22} color="#1c120f" />
            </View>
          ) : (
            <HelpCircle size={22} color="#1c120f" />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Sidebar Modal ── */}
      <Modal visible={showSidebar} transparent animationType="none" onRequestClose={() => setShowSidebar(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInLeft.duration(300)} exiting={SlideOutLeft.duration(300)} style={styles.sidebarContainer}>
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarAvatar}>
                <UserCircle2 size={48} color="#db8221" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sidebarRole}>Kitchen Staff</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSidebar(false)} style={styles.sidebarCloseBtn}>
                <X size={20} color="#f4ebe1" />
              </TouchableOpacity>
            </View>

            <View style={styles.sidebarLinks}>
              <TouchableOpacity style={[styles.sidebarLink, activeTab === 'home' && styles.sidebarLinkActive]} onPress={() => { setShowSidebar(false); setActiveTab('home'); }}>
                <Home size={22} color={activeTab === 'home' ? "#ffffff" : "#f4ebe1"} />
                <Text style={[styles.sidebarLinkText, activeTab === 'home' && styles.sidebarLinkTextActive]}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarLink} onPress={() => { setShowSidebar(false); setActiveTab('orders'); }}>
                <ClipboardList size={22} color="#f4ebe1" />
                <Text style={styles.sidebarLinkText}>Live Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sidebarLink, activeTab === 'stock' && styles.sidebarLinkActive]} onPress={() => { setShowSidebar(false); setActiveTab('stock'); }}>
                <Package size={22} color={activeTab === 'stock' ? "#ffffff" : "#f4ebe1"} />
                <Text style={[styles.sidebarLinkText, activeTab === 'stock' && styles.sidebarLinkTextActive]}>Stock</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarLink} onPress={() => { setShowSidebar(false); router.push('/kitchen-help' as any); }}>
                <HelpCircle size={22} color="#f4ebe1" />
                <Text style={styles.sidebarLinkText}>Help & Support</Text>
              </TouchableOpacity>
              <View style={styles.sidebarDivider} />
              <TouchableOpacity style={styles.sidebarLink} onPress={() => { setShowSidebar(false); router.push('/kitchen-settings' as any); }}>
                <Settings size={22} color="#f4ebe1" />
                <Text style={styles.sidebarLinkText}>Settings</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sidebarFooter}>
              <View style={styles.sidebarDivider} />
              <TouchableOpacity style={styles.sidebarLogout} onPress={() => {
                setShowSidebar(false);
                confirm({
                  message: 'Sign Out?',
                  subMessage: 'Are you sure you want to sign out?',
                  confirmLabel: 'Sign Out',
                  cancelLabel: 'Cancel',
                  onConfirm: () => {
                    show({ message: 'Signed out', type: 'success', autoDismissMs: 1200 });
                    setTimeout(() => router.replace('/roles'), 1300);
                  },
                });
              }}>
                <LogOut size={22} color="#ef4444" />
                <Text style={styles.sidebarLogoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowSidebar(false)} activeOpacity={1} />
        </View>
      </Modal>



      {activeTab === 'orders' ? (
        <KitchenOrdersView />
      ) : activeTab === 'stock' ? (
        <KitchenStockView />
      ) : (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Shift Banner ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.shiftBanner}>
          <View style={styles.shiftDot} />
          <Text style={styles.shiftText}>On shift • {timeStr}</Text>
          <Text style={styles.shiftDate}>{dateStr}</Text>
        </Animated.View>

        {/* ── Hero Removed per request ── */}

        {/* ── Stats Row ── */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.statsRow}>
          <StatCard label="Avg prep" value={formatMinutesAgo(avgPrep).replace(' ago', '')} />
          <StatCard label="Open tables" value={openTables} />
          <StatCard label="Ready now" value={readyCount} accent />
        </Animated.View>

        {/* ── Metrics Grid ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.metricsGrid}>
          <MetricCard
            icon={<ClipboardList size={20} color="#db8221" />}
            label="Active Orders"
            value={totalActive}
            sub={`↗ ${pendingCount} added in last 10 min`}
            subColor="#059669"
          />
          <MetricCard
            icon={<CheckCircle size={20} color="#db8221" />}
            label="Ready Pickup"
            value={readyCount}
            sub="Collect within 5 min"
            subColor="#ea580c"
          />
          <MetricCard
            icon={<ChefHat size={20} color="#db8221" />}
            label="Served Today"
            value={servedToday}
            sub={`✓ ${Math.floor(servedToday / 2)} completed this hour`}
            subColor="#059669"
          />
          <MetricCard
            icon={<TriangleAlert size={20} color="#f59e0b" />}
            label="Stock Alert"
            value={lowStockCount}
            sub={lowStockCount > 0 ? `⚠ ${lowStockCount} items need restock` : "✓ Stock healthy"}
            subColor={lowStockCount > 0 ? "#dc2626" : "#059669"}
          />
        </Animated.View>

        {/* ── Today's Focus ── */}
        <Animated.View entering={FadeInDown.delay(260).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Focus</Text>
            <TouchableOpacity><Text style={styles.sectionLink}>Prep list</Text></TouchableOpacity>
          </View>
          <FocusCard
            icon={readyTables.length > 0 ? <Zap size={20} color="#db8221" /> : <CheckCircle size={20} color="#10b981" />}
            title={readyTables.length > 0 ? "Pickup queue is peaking" : "Pickup queue is clear"}
            desc={readyDesc}
          />
          <FocusCard
            icon={lowStockItems.length > 0 ? <Flame size={20} color="#dc2626" /> : <CheckCircle size={20} color="#10b981" />}
            title={lowStockItems.length > 0 ? "Low stock watch" : "Stock is healthy"}
            desc={stockDesc}
          />
        </Animated.View>

        {/* ── Live Order Status ── */}
        <Animated.View entering={FadeInDown.delay(320).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Order Status</Text>
            <TouchableOpacity><Text style={styles.sectionLink}>View all</Text></TouchableOpacity>
          </View>

          {orders.map((order, idx) => {
            const sc = getStatusColor(order.status);
            const actionLabel = getActionLabel(order.status);
            const itemsSummary = order.items.map(i => i.name).join(', ');
            const nextStatus = getNextStatus(order.status);
            // Live elapsed time from created_at
            const elapsedMins = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
            const placedAgoStr = elapsedMins >= 60
              ? (() => {
                  const h = Math.floor(elapsedMins / 60);
                  const m = elapsedMins % 60;
                  return m === 0 ? `${h}h ago` : `${h}h ${m}m ago`;
                })()
              : `${elapsedMins}m ago`;
            return (
              <Animated.View
                key={order.id}
                entering={FadeInUp.delay(idx * 80).duration(350)}
                style={[
                  styles.orderCard,
                  order.status === 'Ready' && styles.orderCardReady,
                ]}
              >
                <View style={styles.orderCardTop}>
                  <Text style={styles.orderTable}>Table {order.table_id.replace('T', '0')}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                    <Text style={[styles.statusBadgeText, { color: sc.text }]}>{order.status}</Text>
                  </View>
                </View>
                <Text style={styles.orderItems}>{order.items.length} item{order.items.length !== 1 ? 's' : ''} • {itemsSummary}</Text>
                <View style={styles.orderCardBottom}>
                  <View style={styles.orderTimePill}>
                    <Clock size={13} color="#8a7465" />
                    <Text style={styles.orderTimeText}>Placed {placedAgoStr}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => order.status !== 'Ready' && updateOrderStatus(order.id, nextStatus)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnText}>{actionLabel}</Text>
                    {order.status !== 'Ready' && <ArrowUpRight size={14} color="#db8221" />}
                    {order.status === 'Ready' && <CheckCircle size={14} color="#059669" />}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })}

          <View style={{ height: 90 }} />
        </Animated.View>
      </ScrollView>
      )}

      {/* ── Bottom Tab Bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        {[
          { id: 'home',   label: 'Home',   Icon: Home },
          { id: 'orders', label: 'Orders', Icon: ClipboardList },
          { id: 'stock',  label: 'Stock',  Icon: Package },
        ].map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <TouchableOpacity
              key={id}
              style={styles.tabItem}
              onPress={() => setActiveTab(id as any)}
              activeOpacity={0.8}
            >
              <Icon size={24} color={active ? '#db8221' : '#9b8577'} strokeWidth={active ? 2.5 : 1.8} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#fdfaf5' },
  scroll:          { paddingHorizontal: 20, paddingTop: 8 },

  // Header
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fdfaf5' },
  headerCenter:    { alignItems: 'center' },
  headerBrand:     { fontFamily: 'LexendSemiBold', fontSize: 10, color: '#db8221', letterSpacing: 1.5, marginBottom: 2 },
  headerTitle:     { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f' },
  bellBadge:       { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, zIndex: 10 },
  bellBadgeText:   { fontFamily: 'LexendBold', fontSize: 9, color: '#fff' },
  iconBtn:         { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f4ebe1', justifyContent: 'center', alignItems: 'center' },

  // Modals
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row' },
  sidebarContainer:  { width: '80%', backgroundColor: '#1c120f', height: '100%', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  sidebarHeader:     { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 60, backgroundColor: '#251713', borderBottomWidth: 1, borderColor: '#3a2720' },
  sidebarAvatar:     { width: 48, height: 48, borderRadius: 24, marginRight: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#3a2720' },
  sidebarRole:       { fontFamily: 'LexendSemiBold', fontSize: 16, color: '#db8221' },
  sidebarCloseBtn:   { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  sidebarLinks:      { flex: 1, paddingVertical: 20, paddingHorizontal: 16 },
  sidebarLink:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  sidebarLinkActive: { backgroundColor: '#db8221' },
  sidebarLinkText:   { fontFamily: 'LexendSemiBold', fontSize: 16, color: '#f4ebe1', marginLeft: 16 },
  sidebarLinkTextActive: { color: '#ffffff' },
  sidebarDivider:    { height: 1, backgroundColor: '#3a2720', marginVertical: 12, marginHorizontal: 16 },
  sidebarFooter:     { paddingBottom: 40, paddingHorizontal: 16 },
  sidebarLogout:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  sidebarLogoutText: { fontFamily: 'LexendSemiBold', fontSize: 16, color: '#ef4444', marginLeft: 16 },

  // Help Panel
  helpContainer:   { width: '82%', backgroundColor: '#fdfaf5', height: '100%', padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  helpHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 28 },
  helpTitle:       { fontFamily: 'LexendBold', fontSize: 22, color: '#1c120f' },
  helpCard:        { flexDirection: 'row', backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 14, borderWidth: 1, borderColor: '#f0e6d8', gap: 14 },
  helpIconWrap:    { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center' },
  helpCardTitle:   { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f', marginBottom: 4 },
  helpCardDesc:    { fontFamily: 'Lexend', fontSize: 13, color: '#705f55', lineHeight: 18 },

  // Shift Banner
  shiftBanner:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 20, borderWidth: 1, borderColor: '#f0e6d8', gap: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  shiftDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  shiftText:       { fontFamily: 'Lexend', fontSize: 13, color: '#1c120f', flex: 1 },
  shiftDate:       { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#8a7465' },

  // Hero
  heroSection:     { marginBottom: 20 },
  heroTitle:       { fontFamily: 'LexendBold', fontSize: 24, color: '#1c120f', lineHeight: 32, marginBottom: 8 },
  heroSub:         { fontFamily: 'Lexend', fontSize: 13, color: '#8a7465', lineHeight: 20 },

  // Stats
  statsRow:        { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard:        { flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  statCardAccent:  { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  statValue:       { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f', marginBottom: 4 },
  statValueAccent: { color: '#059669' },
  statLabel:       { fontFamily: 'Lexend', fontSize: 11, color: '#8a7465', textAlign: 'center' },

  // Metrics
  metricsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  metricCard:      { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  metricIcon:      { marginBottom: 10 },
  metricLabel:     { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465', marginBottom: 4 },
  metricValue:     { fontFamily: 'LexendBold', fontSize: 28, color: '#1c120f', marginBottom: 6 },
  metricSub:       { fontFamily: 'Lexend', fontSize: 11, lineHeight: 16 },

  // Section
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:    { fontFamily: 'LexendBold', fontSize: 17, color: '#1c120f' },
  sectionLink:     { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#db8221' },

  // Focus Cards
  focusCard:       { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, gap: 14, borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  focusIconWrap:   { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center' },
  focusTitle:      { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#1c120f', marginBottom: 4 },
  focusDesc:       { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465', lineHeight: 18 },

  // Order Cards
  orderCard:       { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#f0e6d8', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  orderCardReady:  { borderColor: '#a7f3d0', backgroundColor: '#f0fdf9' },
  orderCardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderTable:      { fontFamily: 'LexendBold', fontSize: 16, color: '#1c120f' },
  statusBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusBadgeText: { fontFamily: 'LexendSemiBold', fontSize: 12 },
  orderItems:      { fontFamily: 'Lexend', fontSize: 13, color: '#705f55', marginBottom: 12 },
  orderCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTimePill:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  orderTimeText:   { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },
  actionBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText:   { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#db8221' },

  // Bottom Bar
  bottomBar:       { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0e6d8', paddingTop: 10, elevation: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: -4 } },
  tabItem:         { flex: 1, alignItems: 'center', paddingBottom: 6, gap: 4 },
  tabLabel:        { fontFamily: 'Lexend', fontSize: 10, color: '#9b8577' },
  tabLabelActive:  { fontFamily: 'LexendSemiBold', color: '#db8221' },
});
