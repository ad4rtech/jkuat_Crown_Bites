import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, ChevronRight } from 'lucide-react-native';
import { ManagerModule } from './ManagerSidebar';

const MODULE_TITLES: Record<ManagerModule, string> = {
  overview:  'Overview',
  menu:      'Menu Management',
  staff:     'Staff Management',
  kitchen:   'Kitchen Monitor',
  billing:   'Billing & EOD',
  inventory: 'Inventory',
  reports:   'Reports',
  settings:  'Settings',
};

interface Props {
  module: ManagerModule;
  breadcrumb?: string;       // e.g. "Edit Item › Grilled Chicken"
  notificationCount?: number;
  managerName?: string;
}

export default function ManagerTopBar({
  module, breadcrumb, notificationCount = 0, managerName = 'Manager',
}: Props) {
  const title = MODULE_TITLES[module];

  return (
    <View style={styles.bar}>
      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <Text style={styles.moduleTitle}>{title}</Text>
        {breadcrumb ? (
          <View style={styles.breadcrumbRow}>
            <ChevronRight size={14} color="#8a7465" />
            <Text style={styles.breadcrumbSub}>{breadcrumb}</Text>
          </View>
        ) : null}
      </View>

      {/* Right side */}
      <View style={styles.right}>
        {/* Bell */}
        <TouchableOpacity style={styles.bellBtn}>
          <Bell size={20} color="#1c120f" />
          {notificationCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Manager pill */}
        <View style={styles.managerPill}>
          <View style={styles.managerAvatar}>
            <Text style={styles.managerAvatarText}>
              {managerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.managerName}>{managerName}</Text>
            <Text style={styles.managerRole}>Manager</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14, backgroundColor: '#fdfaf5', borderBottomWidth: 1, borderColor: '#f0e6d8' },
  breadcrumb:      { flex: 1 },
  breadcrumbRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  moduleTitle:     { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f' },
  breadcrumbSub:   { fontFamily: 'Lexend', fontSize: 13, color: '#8a7465' },
  right:           { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bellBtn:         { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f4ebe1', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  bellBadge:       { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  bellBadgeText:   { fontFamily: 'LexendBold', fontSize: 9, color: '#fff' },
  managerPill:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#f0e6d8' },
  managerAvatar:   { width: 30, height: 30, borderRadius: 15, backgroundColor: '#db8221', justifyContent: 'center', alignItems: 'center' },
  managerAvatarText:{ fontFamily: 'LexendBold', fontSize: 14, color: '#fff' },
  managerName:     { fontFamily: 'LexendBold', fontSize: 13, color: '#1c120f' },
  managerRole:     { fontFamily: 'Lexend', fontSize: 11, color: '#8a7465' },
});
