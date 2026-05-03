import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import {
  LayoutDashboard, UtensilsCrossed, Users, ChefHat,
  CreditCard, Package, BarChart2, Settings, LogOut,
} from 'lucide-react-native';

export type ManagerModule =
  | 'overview' | 'menu' | 'staff' | 'kitchen'
  | 'billing'  | 'inventory' | 'reports' | 'settings';

interface NavItem {
  module: ManagerModule;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface Props {
  active: ManagerModule;
  onSelect: (m: ManagerModule) => void;
  onLogout: () => void;
  unavailableCount?: number;
}

export default function ManagerSidebar({ active, onSelect, onLogout, unavailableCount = 0 }: Props) {
  const iconColor = (m: ManagerModule) => active === m ? '#ffffff' : '#c4a882';
  const sz = 20;

  const primary: NavItem[] = [
    { module: 'overview',   label: 'Overview',   icon: <LayoutDashboard  size={sz} color={iconColor('overview')}   /> },
    { module: 'menu',       label: 'Menu',        icon: <UtensilsCrossed  size={sz} color={iconColor('menu')}       />, badge: unavailableCount > 0 ? unavailableCount : undefined },
    { module: 'staff',      label: 'Staff',       icon: <Users            size={sz} color={iconColor('staff')}      /> },
    { module: 'kitchen',    label: 'Kitchen',     icon: <ChefHat          size={sz} color={iconColor('kitchen')}    /> },
    { module: 'billing',    label: 'Billing',     icon: <CreditCard       size={sz} color={iconColor('billing')}    /> },
    { module: 'inventory',  label: 'Inventory',   icon: <Package          size={sz} color={iconColor('inventory')}  /> },
    { module: 'reports',    label: 'Reports',     icon: <BarChart2        size={sz} color={iconColor('reports')}    /> },
  ];

  return (
    <View style={styles.sidebar}>
      {/* Brand */}
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Text style={styles.brandEmoji}>👑</Text>
        </View>
        <View>
          <Text style={styles.brandName}>Crown Bites</Text>
          <Text style={styles.brandSub}>ROKMS</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Primary Nav */}
      <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
        {primary.map(item => {
          const isActive = active === item.module;
          return (
            <TouchableOpacity
              key={item.module}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => onSelect(item.module)}
              activeOpacity={0.75}
            >
              {item.icon}
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
              {item.badge !== undefined && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.divider} />

      {/* Bottom */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onSelect('settings')}
        activeOpacity={0.75}
      >
        <Settings size={sz} color={active === 'settings' ? '#ffffff' : '#c4a882'} />
        <Text style={[styles.navLabel, active === 'settings' && styles.navLabelActive]}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
        <LogOut size={sz} color="#ef4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar:       { width: 200, backgroundColor: '#1c120f', height: '100%', justifyContent: 'flex-start', paddingTop: 52, paddingBottom: 32 },
  brand:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  brandIcon:     { width: 38, height: 38, borderRadius: 10, backgroundColor: '#db8221', justifyContent: 'center', alignItems: 'center' },
  brandEmoji:    { fontSize: 18 },
  brandName:     { fontFamily: 'LexendBold', fontSize: 14, color: '#ffffff' },
  brandSub:      { fontFamily: 'Lexend', fontSize: 11, color: '#c4a882' },
  divider:       { height: 1, backgroundColor: '#3a2720', marginHorizontal: 16, marginVertical: 8 },
  navList:       { flex: 1 },
  navItem:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, marginHorizontal: 8, borderRadius: 10, marginBottom: 2 },
  navItemActive: { backgroundColor: '#db8221' },
  navLabel:      { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#c4a882', flex: 1 },
  navLabelActive:{ color: '#ffffff' },
  badge:         { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  badgeText:     { fontFamily: 'LexendBold', fontSize: 10, color: '#fff' },
  logoutBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 4 },
  logoutText:    { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#ef4444' },
});
