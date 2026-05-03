import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, BellRing, PackageSearch, Clock, ClipboardCheck } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function NotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [lowStock, setLowStock] = useState(true);
  const [kitchenOverdue, setKitchenOverdue] = useState(true);
  const [eodReminders, setEodReminders] = useState(false);
  const [staffApprovals, setStaffApprovals] = useState(true);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1c120f" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerSub}>ADMINISTRATION</Text>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.infoBanner}>
            <BellRing size={24} color="#db8221" />
            <View style={styles.infoBannerText}>
              <Text style={styles.infoBannerTitle}>Alert Preferences</Text>
              <Text style={styles.infoBannerDesc}>Configure which operational alerts you want to receive on your Manager device.</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <View style={styles.card}>
            
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <PackageSearch size={22} color="#1c120f" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Low Stock Alerts</Text>
                <Text style={styles.rowDesc}>Triggered when inventory hits 10%</Text>
              </View>
              <Switch 
                value={lowStock} 
                onValueChange={setLowStock} 
                trackColor={{ false: '#e8ddd4', true: '#db8221' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Clock size={22} color="#1c120f" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Kitchen Overdue</Text>
                <Text style={styles.rowDesc}>When orders pass the 15m mark</Text>
              </View>
              <Switch 
                value={kitchenOverdue} 
                onValueChange={setKitchenOverdue} 
                trackColor={{ false: '#e8ddd4', true: '#db8221' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.iconBox}>
                <BellRing size={22} color="#1c120f" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>EOD Reminders</Text>
                <Text style={styles.rowDesc}>Daily reminder at 10:30 PM to run Z-Report</Text>
              </View>
              <Switch 
                value={eodReminders} 
                onValueChange={setEodReminders} 
                trackColor={{ false: '#e8ddd4', true: '#db8221' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.iconBox}>
                <ClipboardCheck size={22} color="#1c120f" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Staff Actions</Text>
                <Text style={styles.rowDesc}>Alerts for void authorizations & refunds</Text>
              </View>
              <Switch 
                value={staffApprovals} 
                onValueChange={setStaffApprovals} 
                trackColor={{ false: '#e8ddd4', true: '#db8221' }}
                thumbColor="#fff"
              />
            </View>

          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfaf5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f4ebe1', justifyContent: 'center', alignItems: 'center' },
  headerSub: { fontFamily: 'LexendSemiBold', fontSize: 10, color: '#db8221', letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f' },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },

  infoBanner: { flexDirection: 'row', backgroundColor: '#fffbf7', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f0e6d8', marginBottom: 28, alignItems: 'center' },
  infoBannerText: { marginLeft: 14, flex: 1 },
  infoBannerTitle: { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f', marginBottom: 2 },
  infoBannerDesc: { fontFamily: 'Lexend', fontSize: 13, color: '#8a7465', lineHeight: 18 },

  card: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#f0e6d8', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 20 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f4ebe1', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  rowContent: { flex: 1, justifyContent: 'center', paddingRight: 10 },
  rowTitle: { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f', marginBottom: 2 },
  rowDesc: { fontFamily: 'Lexend', fontSize: 13, color: '#8a7465' },
  divider: { height: 1, backgroundColor: '#f0e6d8', marginLeft: 76 },
});
