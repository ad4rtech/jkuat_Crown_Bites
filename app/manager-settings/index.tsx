import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldCheck, KeyRound, Building2, Bell, Printer, ChevronRight } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';

export default function ManagerSettingsListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      
      {/* Toast */}
      {toastMessage && (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={[styles.toastContainer, { bottom: insets.bottom + 40 }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1c120f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manager Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>SECURITY & ACCESS</Text>
          <View style={styles.card}>
            
            <TouchableOpacity style={styles.row} onPress={() => router.push('/manager-settings/change-pin' as any)} activeOpacity={0.7}>
              <View style={styles.iconBox}>
                <KeyRound size={22} color="#db8221" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Role PIN Management</Text>
                <Text style={styles.rowDesc}>Change passwords for Waiters, Kitchen, etc.</Text>
              </View>
              <ChevronRight size={20} color="#b89f8d" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.row} onPress={() => router.push('/manager-settings/tax' as any)} activeOpacity={0.7}>
              <View style={styles.iconBox}>
                <ShieldCheck size={22} color="#db8221" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Tax & Service Charges</Text>
                <Text style={styles.rowDesc}>Configure global VAT and service rates</Text>
              </View>
              <ChevronRight size={20} color="#b89f8d" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>GENERAL</Text>
          <View style={styles.card}>
            
            <TouchableOpacity style={styles.row} onPress={() => router.push('/manager-settings/profile' as any)} activeOpacity={0.7}>
              <View style={styles.iconBox}>
                <Building2 size={22} color="#db8221" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Restaurant Profile</Text>
                <Text style={styles.rowDesc}>Edit name, address, and contact info</Text>
              </View>
              <ChevronRight size={20} color="#b89f8d" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.row} onPress={() => router.push('/manager-settings/notifications' as any)} activeOpacity={0.7}>
              <View style={styles.iconBox}>
                <Bell size={22} color="#db8221" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Notifications</Text>
                <Text style={styles.rowDesc}>Alerts for low stock or overdue items</Text>
              </View>
              <ChevronRight size={20} color="#b89f8d" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.row} onPress={() => router.push('/manager-settings/printer' as any)} activeOpacity={0.7}>
              <View style={styles.iconBox}>
                <Printer size={22} color="#db8221" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Printer Setup</Text>
                <Text style={styles.rowDesc}>Configure KOT and Receipt printers</Text>
              </View>
              <ChevronRight size={20} color="#b89f8d" />
            </TouchableOpacity>

          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfaf5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 24 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f4ebe1', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f' },
  
  toastContainer: { position: 'absolute', alignSelf: 'center', backgroundColor: '#db8221', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, zIndex: 100 },
  toastText: { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#fff' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontFamily: 'LexendBold', fontSize: 12, color: '#8a7465', letterSpacing: 1.5, marginTop: 24, marginBottom: 12, marginLeft: 4 },
  
  card: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#f0e6d8', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  rowContent: { flex: 1, justifyContent: 'center' },
  rowTitle: { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f', marginBottom: 2 },
  rowDesc: { fontFamily: 'Lexend', fontSize: 13, color: '#8a7465' },
  divider: { height: 1, backgroundColor: '#f0e6d8', marginLeft: 76 },
});
