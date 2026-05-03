import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CheckCircle2, Flame, Info, Trash2, ShieldAlert, AlertTriangle } from 'lucide-react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNotificationStore, AppNotification } from '../store/notificationStore';
import { formatTimeAgo } from '../lib/timeFormat';

export default function ManagerNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notifications, unreadCount, initStore, markAsRead, deleteNotification } = useNotificationStore();

  useFocusEffect(
    React.useCallback(() => {
      initStore('Manager');
    }, [])
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={24} color="#10b981" />;
      case 'error': return <Flame size={24} color="#ef4444" />;
      case 'warning': return <ShieldAlert size={24} color="#f59e0b" />;
      default: return <Info size={24} color="#3b82f6" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'success': return '#dcfce7';
      case 'error': return '#fee2e2';
      case 'warning': return '#fef3c7';
      default: return '#dbeafe';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <X size={22} color="#1c120f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manager Alerts {unreadCount > 0 && `(${unreadCount})`}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#8a7465', marginTop: 40 }}>No alerts to display.</Text>
        ) : (
          notifications.map((notif, index) => {
            const isNew = !notif.is_read;
            return (
              <Animated.View 
                key={notif.id} 
                entering={FadeInDown.delay(index * 50).duration(400)} 
                style={[styles.card, isNew && styles.cardNew]}
              >
                {isNew && <View style={styles.newIndicator} />}
                <TouchableOpacity 
                  style={styles.cardHeader} 
                  activeOpacity={0.8}
                  onPress={() => {
                    if (isNew) markAsRead(notif.id);
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: getIconBg(notif.type) }]}>
                    {getIcon(notif.type)}
                  </View>
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>{notif.title}</Text>
                    <Text style={styles.cardDesc}>{notif.message}</Text>
                    <Text style={styles.cardTime}>
                      {formatTimeAgo(notif.created_at)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => deleteNotification(notif.id)}
                    style={{ padding: 8, justifyContent: 'center' }}
                  >
                    <Trash2 size={20} color="#cbd5e1" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfaf5', // Cream background to match design
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  closeBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#f4ebe1',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'LexendBold',
    fontSize: 20,
    color: '#1c120f',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#f7f2ea',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee6dc',
  },
  cardNew: {
    borderLeftWidth: 4,
    borderLeftColor: '#db8221', // Orange left border for manager alerts
  },
  newIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#db8221', // Orange dot
  },
  cardHeader: {
    flexDirection: 'row',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#1c120f',
    marginBottom: 6,
  },
  cardDesc: {
    fontFamily: 'Lexend',
    fontSize: 14,
    color: '#8a7465',
    lineHeight: 20,
    marginBottom: 8,
  },
  cardTime: {
    fontFamily: 'LexendSemiBold',
    fontSize: 12,
    color: '#b89f8d',
  },
});
