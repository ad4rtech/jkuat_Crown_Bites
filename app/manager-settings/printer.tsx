import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Printer, CheckCircle2, Server, ScanLine, Tag } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function PrinterSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const PRINTERS = [
    {
      id: 'receipt-1',
      name: 'Cashier Receipt Printer',
      type: 'Thermal POS (80mm)',
      ip: '192.168.1.105',
      mac: '00:1B:44:11:3A:B7',
      status: 'Online',
      location: 'Front Desk',
    },
    {
      id: 'kot-1',
      name: 'Kitchen Order Ticket (KOT)',
      type: 'Impact Printer (76mm)',
      ip: '192.168.1.106',
      mac: '00:1B:44:11:3A:C2',
      status: 'Online',
      location: 'Hot Kitchen Line',
    }
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1c120f" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerSub}>ADMINISTRATION</Text>
          <Text style={styles.headerTitle}>Printer Setup</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.infoBanner}>
            <Printer size={24} color="#059669" />
            <View style={styles.infoBannerText}>
              <Text style={styles.infoBannerTitle}>Hardware Integration</Text>
              <Text style={styles.infoBannerDesc}>Currently mapped hardware on the local network. Contact IT to change IP configurations.</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text style={styles.sectionTitle}>ACTIVE PRINTERS</Text>
          
          {PRINTERS.map((printer, index) => (
            <View key={printer.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Printer size={20} color="#1c120f" style={{ marginRight: 10 }} />
                  <Text style={styles.cardTitle}>{printer.name}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <CheckCircle2 size={12} color="#059669" style={{ marginRight: 4 }} />
                  <Text style={styles.statusText}>{printer.status}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.detailRow}>
                  <Tag size={16} color="#8a7465" style={styles.detailIcon} />
                  <View>
                    <Text style={styles.detailLabel}>Model / Type</Text>
                    <Text style={styles.detailValue}>{printer.type}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Server size={16} color="#8a7465" style={styles.detailIcon} />
                  <View>
                    <Text style={styles.detailLabel}>Network (IP)</Text>
                    <Text style={styles.detailValue}>{printer.ip}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <ScanLine size={16} color="#8a7465" style={styles.detailIcon} />
                  <View>
                    <Text style={styles.detailLabel}>MAC Address</Text>
                    <Text style={styles.detailValue}>{printer.mac}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.cardFooter}>
                <Text style={styles.locationLabel}>Mapped Location:</Text>
                <Text style={styles.locationValue}>{printer.location}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <View style={{ height: 40 }} />
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

  infoBanner: { flexDirection: 'row', backgroundColor: '#ecfdf5', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#a7f3d0', marginBottom: 28, alignItems: 'center' },
  infoBannerText: { marginLeft: 14, flex: 1 },
  infoBannerTitle: { fontFamily: 'LexendBold', fontSize: 15, color: '#065f46', marginBottom: 2 },
  infoBannerDesc: { fontFamily: 'Lexend', fontSize: 13, color: '#047857', lineHeight: 18 },

  sectionTitle: { fontFamily: 'LexendBold', fontSize: 12, color: '#8a7465', letterSpacing: 1, marginBottom: 16 },

  card: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#f0e6d8', marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fffbf7', borderBottomWidth: 1, borderBottomColor: '#f0e6d8' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontFamily: 'LexendBold', fontSize: 16, color: '#1c120f' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontFamily: 'LexendBold', fontSize: 11, color: '#059669', textTransform: 'uppercase' },
  
  cardBody: { padding: 16, gap: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailIcon: { marginRight: 16, width: 20, textAlign: 'center' },
  detailLabel: { fontFamily: 'LexendSemiBold', fontSize: 12, color: '#8a7465', marginBottom: 2 },
  detailValue: { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdfaf5', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f0e6d8' },
  locationLabel: { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#8a7465', marginRight: 8 },
  locationValue: { fontFamily: 'LexendBold', fontSize: 13, color: '#db8221' },
});
