import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import {
  Menu, Bell, UtensilsCrossed, ChefHat, CreditCard, Package,
  LayoutDashboard, Settings, LogOut, UserCircle2, X, HelpCircle
} from 'lucide-react-native';

import MenuDashboard      from '../components/manager/MenuDashboard';
import KitchenMonitor     from '../components/manager/KitchenMonitor';
import BillingDashboard   from '../components/manager/BillingDashboard';
import InventoryDashboard from '../components/manager/InventoryDashboard';
import { useManagerMenuStore } from '../store/managerMenuStore';
import { useNotificationStore } from '../store/notificationStore';
import CenterToast, { useToast } from '../components/CenterToast';

// ─── Tab definition ───────────────────────────────────────────────────────────
type ManagerTab = 'menu' | 'kitchen' | 'billing' | 'inventory';

const BOTTOM_TABS: { id: ManagerTab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  { id: 'menu',      label: 'Menu',      icon: a => <UtensilsCrossed size={22} color={a ? '#db8221' : '#8a7465'} /> },
  { id: 'kitchen',   label: 'Kitchen',   icon: a => <ChefHat         size={22} color={a ? '#db8221' : '#8a7465'} /> },
  { id: 'billing',   label: 'Billing',   icon: a => <CreditCard      size={22} color={a ? '#db8221' : '#8a7465'} /> },
  { id: 'inventory', label: 'Inventory', icon: a => <Package         size={22} color={a ? '#db8221' : '#8a7465'} /> },
];

const TAB_TITLES: Record<ManagerTab, string> = {
  menu:      'Menu Management',
  kitchen:   'Kitchen Monitor',
  billing:   'Billing & EOD',
  inventory: 'Inventory',
};

// ─── Placeholder ──────────────────────────────────────────────────────────────
function PlaceholderView({ label }: { label: string }) {
  return (
    <View style={ph.wrap}>
      <Text style={ph.emoji}>🚧</Text>
      <Text style={ph.title}>{label}</Text>
      <Text style={ph.sub}>Coming soon.</Text>
    </View>
  );
}
const ph = StyleSheet.create({
  wrap:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 48 },
  title: { fontFamily: 'LexendBold', fontSize: 22, color: '#1c120f' },
  sub:   { fontFamily: 'Lexend', fontSize: 14, color: '#8a7465' },
});

// ─── Root Screen ──────────────────────────────────────────────────────────────
export default function ManagerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fetchMenu, items } = useManagerMenuStore();

  const [activeTab,    setActiveTab]    = useState<ManagerTab>('menu');
  const [showSidebar,  setShowSidebar]  = useState(false);
  const [breadcrumb,   setBreadcrumb]   = useState('');

  const { unreadCount, initStore } = useNotificationStore();
  const { toast, show, confirm } = useToast();

  useFocusEffect(useCallback(() => { 
    fetchMenu(); 
    initStore('Manager');
  }, []));

  const unavailableCount = items.filter(i => i.status === 'unavailable').length;

  const title = breadcrumb
    ? `${TAB_TITLES[activeTab]} › ${breadcrumb}`
    : TAB_TITLES[activeTab];

  const renderContent = () => {
    switch (activeTab) {
      case 'menu':      return <MenuDashboard onBreadcrumb={setBreadcrumb} />;
      case 'kitchen':   return <KitchenMonitor />;
      case 'billing':   return <BillingDashboard />;
      case 'inventory': return <InventoryDashboard />;
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <CenterToast {...toast} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSidebar(true)}>
          <Menu size={22} color="#1c120f" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerBrand}>Crown Bites</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/manager-help' as any)}>
            <HelpCircle size={22} color="#1c120f" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/manager-notifications' as any)}>
            {unavailableCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unavailableCount}</Text>
              </View>
            )}
            <Bell size={22} color="#1c120f" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Sidebar Modal ── */}
      <Modal visible={showSidebar} transparent animationType="none" onRequestClose={() => setShowSidebar(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={SlideInLeft.duration(300)}
            exiting={SlideOutLeft.duration(300)}
            style={styles.sidebar}
          >
            {/* Sidebar header */}
            <View style={styles.sidebarTop}>
              <View style={styles.sidebarAvatar}>
                <UserCircle2 size={44} color="#db8221" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sidebarName}>Admin</Text>
                <Text style={styles.sidebarRole}>Manager</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSidebar(false)} style={styles.sidebarCloseBtn}>
                <X size={18} color="#f4ebe1" />
              </TouchableOpacity>
            </View>

            {/* Nav items */}
            <View style={styles.sidebarLinks}>
              {[
                { id: 'menu'      as ManagerTab, label: 'Menu',      icon: <UtensilsCrossed size={20} color="#f4ebe1" /> },
                { id: 'kitchen'   as ManagerTab, label: 'Kitchen',   icon: <ChefHat         size={20} color="#f4ebe1" /> },
                { id: 'billing'   as ManagerTab, label: 'Billing',   icon: <CreditCard      size={20} color="#f4ebe1" /> },
                { id: 'inventory' as ManagerTab, label: 'Inventory', icon: <Package         size={20} color="#f4ebe1" /> },
              ].map(item => {
                const isActive = activeTab === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.sidebarLink, isActive && styles.sidebarLinkActive]}
                    onPress={() => { setActiveTab(item.id); setBreadcrumb(''); setShowSidebar(false); }}
                  >
                    {item.icon}
                    <Text style={[styles.sidebarLinkText, isActive && styles.sidebarLinkTextActive]}>
                      {item.label}
                    </Text>
                    {item.id === 'menu' && unavailableCount > 0 && (
                      <View style={styles.sidebarBadge}>
                        <Text style={styles.sidebarBadgeText}>{unavailableCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              <View style={styles.sidebarDivider} />

              <TouchableOpacity style={styles.sidebarLink} onPress={() => { setShowSidebar(false); router.push('/manager-settings' as any); }}>
                <Settings size={20} color="#f4ebe1" />
                <Text style={styles.sidebarLinkText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarLink} onPress={() => { setShowSidebar(false); router.push('/manager-help' as any); }}>
                <HelpCircle size={20} color="#f4ebe1" />
                <Text style={styles.sidebarLinkText}>Help & Support</Text>
              </TouchableOpacity>
            </View>

            {/* Logout */}
            <View style={styles.sidebarFooter}>
              <View style={styles.sidebarDivider} />
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
                      setTimeout(() => router.replace('/roles' as any), 1300);
                    },
                  });
                }}
              >
                <LogOut size={20} color="#ef4444" />
                <Text style={styles.sidebarLogoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Backdrop */}
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowSidebar(false)} activeOpacity={1} />
        </View>
      </Modal>

      {/* ── Content ── */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* ── Bottom Tab Bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 4 }]}>
        {BOTTOM_TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => { setActiveTab(tab.id); setBreadcrumb(''); }}
              activeOpacity={0.7}
            >
              {tab.icon(isActive)}
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#fdfaf5' },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fdfaf5', borderBottomWidth: 1, borderColor: '#f0e6d8' },
  headerCenter:  { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerBrand:   { fontFamily: 'Lexend', fontSize: 11, color: '#8a7465', letterSpacing: 0.5 },
  headerTitle:   { fontFamily: 'LexendBold', fontSize: 16, color: '#1c120f' },
  iconBtn:       { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f4ebe1', justifyContent: 'center', alignItems: 'center' },
  bellBadge:     { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, zIndex: 1 },
  bellBadgeText: { fontFamily: 'LexendBold', fontSize: 9, color: '#fff' },

  // Sidebar modal
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row' },
  sidebar:           { width: '78%', backgroundColor: '#1c120f', height: '100%', justifyContent: 'space-between', elevation: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 15 },
  sidebarTop:        { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 56, backgroundColor: '#251713', borderBottomWidth: 1, borderColor: '#3a2720', gap: 12 },
  sidebarAvatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3a2720', justifyContent: 'center', alignItems: 'center' },
  sidebarName:       { fontFamily: 'LexendBold', fontSize: 16, color: '#f4ebe1' },
  sidebarRole:       { fontFamily: 'Lexend', fontSize: 12, color: '#db8221' },
  sidebarCloseBtn:   { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 18 },
  sidebarLinks:      { flex: 1, paddingVertical: 16, paddingHorizontal: 14 },
  sidebarLink:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, marginBottom: 4, gap: 14 },
  sidebarLinkActive: { backgroundColor: '#db8221' },
  sidebarLinkText:   { fontFamily: 'LexendSemiBold', fontSize: 15, color: '#f4ebe1', flex: 1 },
  sidebarLinkTextActive: { color: '#ffffff' },
  sidebarBadge:      { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  sidebarBadgeText:  { fontFamily: 'LexendBold', fontSize: 10, color: '#fff' },
  sidebarDivider:    { height: 1, backgroundColor: '#3a2720', marginVertical: 10, marginHorizontal: 14 },
  sidebarFooter:     { paddingBottom: 36, paddingHorizontal: 14 },
  sidebarLogout:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 14 },
  sidebarLogoutText: { fontFamily: 'LexendSemiBold', fontSize: 15, color: '#ef4444' },

  // Content + bottom bar
  content:       { flex: 1 },
  bottomBar:     { flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderColor: '#f0e6d8', paddingTop: 8 },
  tabItem:       { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  tabLabel:      { fontFamily: 'LexendSemiBold', fontSize: 11, color: '#8a7465' },
  tabLabelActive:{ color: '#db8221' },
});
