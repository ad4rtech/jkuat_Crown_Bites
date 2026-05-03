import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import Animated, { FadeIn, SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home, Receipt, BarChart3, FileText, UserCircle2, Menu, HelpCircle, X, Settings, LogOut, Bell
} from 'lucide-react-native';

import CashierHome     from '../components/cashier/CashierHome';
import BillsList        from '../components/cashier/BillsList';
import BillDetail       from '../components/cashier/BillDetail';
import RevenueDashboard from '../components/cashier/RevenueDashboard';
import ReceiptsHistory  from '../components/cashier/ReceiptsHistory';
import { ActiveOrderWithItems } from '../store/orderStore';
import { useNotificationStore } from '../store/notificationStore';
import CenterToast, { useToast } from '../components/CenterToast';

// ─── Tab definition ───────────────────────────────────────────────────────────
type TabId = 'home' | 'bills' | 'reports' | 'receipts';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'home',     label: 'Home',     icon: Home      },
  { id: 'bills',    label: 'Bills',    icon: Receipt   },
  { id: 'reports',  label: 'Reports',  icon: BarChart3 },
  { id: 'receipts', label: 'Receipts', icon: FileText  },
];

function PlaceholderView({ label }: { label: string }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#faf5ef' }}>
      <Text style={{ fontFamily: 'LexendBold', fontSize: 22, color: '#1c120f' }}>{label}</Text>
      <Text style={{ fontFamily: 'Lexend', fontSize: 14, color: '#8a7465', marginTop: 8 }}>Coming soon</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CashierScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [activeTab,     setActiveTab]     = useState<TabId>('home');
  const [selectedOrder, setSelectedOrder] = useState<ActiveOrderWithItems | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const { unreadCount, initStore } = useNotificationStore();
  const { toast, show, confirm } = useToast();

  useFocusEffect(
    React.useCallback(() => {
      initStore('Cashier');
    }, [])
  );

  const tabTitles: Record<TabId, string> = {
    home:     'Cashier Home',
    bills:    'Bills',
    reports:  'Reports',
    receipts: 'Receipts',
  };

  // When user picks a bill from Home or Bills list
  const handleBillSelect = (order: ActiveOrderWithItems) => {
    setSelectedOrder(order);
  };

  // Back from BillDetail
  const handleBackFromBill = () => {
    setSelectedOrder(null);
  };

  // Payment confirmed — back to home, clear detail
  const handlePaid = () => {
    setSelectedOrder(null);
    setActiveTab('home');
  };

  // ── Render ──────────────────────────────────────────────────────────
  const renderContent = () => {
    // Bill Detail overrides any tab when an order is selected
    if (selectedOrder) {
      return (
        <BillDetail
          order={selectedOrder}
          onBack={handleBackFromBill}
          onPaid={handlePaid}
        />
      );
    }

    switch (activeTab) {
      case 'home':     return <CashierHome onBillPress={handleBillSelect} />;
      case 'bills':    return <BillsList onSelect={handleBillSelect} />;
      case 'reports':  return <RevenueDashboard />;
      case 'receipts': return <ReceiptsHistory />;
    }
  };

  // Hide tab bar when viewing bill detail
  const showTabBar = !selectedOrder;

  const headerTitle = selectedOrder
    ? `Table ${selectedOrder.table_id.replace(/\D/g, '')} Bill`
    : tabTitles[activeTab];

  const headerSub = selectedOrder
    ? `ORDER #${selectedOrder.id.slice(-4).toUpperCase()}`
    : 'LIVE FEED';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <CenterToast {...toast} />

      {/* ── Top Header (hidden when BillDetail shows its own header) ── */}
      {!selectedOrder && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSidebar(true)}>
            <Menu size={24} color="#1c120f" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerLive}>{headerSub}</Text>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/cashier-help' as any)}>
              <HelpCircle size={24} color="#1c120f" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/cashier-notifications' as any)}>
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount}</Text>
                </View>
              )}
              <Bell size={24} color="#1c120f" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ── Sidebar Modal ── */}
      <Modal visible={showSidebar} transparent animationType="none" onRequestClose={() => setShowSidebar(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInLeft.duration(300)} exiting={SlideOutLeft.duration(300)} style={styles.sidebarContainer}>
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarAvatar}>
                <UserCircle2 size={48} color="#db8221" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sidebarRole}>Cashier</Text>
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
              <TouchableOpacity style={[styles.sidebarLink, activeTab === 'bills' && styles.sidebarLinkActive]} onPress={() => { setShowSidebar(false); setActiveTab('bills'); }}>
                <Receipt size={22} color={activeTab === 'bills' ? "#ffffff" : "#f4ebe1"} />
                <Text style={[styles.sidebarLinkText, activeTab === 'bills' && styles.sidebarLinkTextActive]}>Bills</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sidebarLink, activeTab === 'reports' && styles.sidebarLinkActive]} onPress={() => { setShowSidebar(false); setActiveTab('reports'); }}>
                <BarChart3 size={22} color={activeTab === 'reports' ? "#ffffff" : "#f4ebe1"} />
                <Text style={[styles.sidebarLinkText, activeTab === 'reports' && styles.sidebarLinkTextActive]}>Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sidebarLink, activeTab === 'receipts' && styles.sidebarLinkActive]} onPress={() => { setShowSidebar(false); setActiveTab('receipts'); }}>
                <FileText size={22} color={activeTab === 'receipts' ? "#ffffff" : "#f4ebe1"} />
                <Text style={[styles.sidebarLinkText, activeTab === 'receipts' && styles.sidebarLinkTextActive]}>Receipts</Text>
              </TouchableOpacity>

              <View style={styles.sidebarDivider} />

              <TouchableOpacity style={styles.sidebarLink} onPress={() => { setShowSidebar(false); router.push('/cashier-settings' as any); }}>
                <Settings size={22} color="#f4ebe1" />
                <Text style={styles.sidebarLinkText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarLink} onPress={() => { setShowSidebar(false); router.push('/cashier-help' as any); }}>
                <HelpCircle size={22} color="#f4ebe1" />
                <Text style={styles.sidebarLinkText}>Help & Support</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sidebarLogout}
              onPress={() => {
                setShowSidebar(false);
                confirm({
                  message: 'Sign Out?',
                  subMessage: 'Are you sure you want to sign out?',
                  confirmLabel: 'Sign Out',
                  cancelLabel: 'Cancel',
                  onConfirm: () => {
                    show({ message: 'Signed out', type: 'success', autoDismissMs: 1200 });
                    setTimeout(() => router.replace('/'), 1300);
                  },
                });
              }}
            >
              <LogOut size={22} color="#ef4444" />
              <Text style={styles.sidebarLogoutText}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity style={styles.modalBgTap} onPress={() => setShowSidebar(false)} activeOpacity={1} />
        </View>
      </Modal>

      {/* ── Content ── */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* ── Bottom Tab Bar ── */}
      {showTabBar && (
        <View style={[styles.tabBar, { paddingBottom: insets.bottom + 4 }]}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Icon
                  size={22}
                  color={isActive ? '#db8221' : '#b89f8d'}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#faf5ef' },
  header:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#faf5ef', borderBottomWidth: 1, borderColor: '#f0e6d8' },
  headerCenter:  { flex: 1, alignItems: 'center' },
  headerLive:    { fontFamily: 'LexendSemiBold', fontSize: 10, color: '#8a7465', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 },
  headerTitle:   { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f' },
  avatarBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f4ebe1', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e8ddd4' },
  content: { flex: 1 },
  tabBar:  { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#f0e6d8', paddingTop: 10, elevation: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
  tabItem: { flex: 1, alignItems: 'center', gap: 3, position: 'relative' },
  tabLabel:       { fontFamily: 'LexendSemiBold', fontSize: 11, color: '#b89f8d' },
  tabLabelActive: { color: '#db8221' },
  tabActiveDot:   { position: 'absolute', bottom: -10, width: 4, height: 4, borderRadius: 2, backgroundColor: '#db8221' },
  iconBtn:       { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f4ebe1', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  bellBadge:     { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  bellBadgeText: { fontFamily: 'LexendBold', fontSize: 9, color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row' },
  modalBgTap: { flex: 1 },
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
  sidebarLogout:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, paddingBottom: 40 },
  sidebarLogoutText: { fontFamily: 'LexendSemiBold', fontSize: 16, color: '#ef4444', marginLeft: 16 },
});
