import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, User, Lock, Bell, Moon, Globe, Printer, RefreshCw, Info, ChevronRight } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Settings State
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handlePress = (item: string) => {
    if (item === 'Change PIN') {
      showToast('PIN change is restricted to Restaurant Manager');
    } else {
      Alert.alert("Coming Soon", `${item} settings will be available in a future update.`);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const currentTheme = {
    bg: darkMode ? '#1c120f' : '#fdfaf5',
    card: darkMode ? '#2d1e18' : '#fcf8f4',
    text: darkMode ? '#fdfaf5' : '#1c120f',
    subText: darkMode ? '#b89f8d' : '#8a7465',
    divider: darkMode ? '#3a2720' : '#f0e6d8',
    cardBorder: darkMode ? '#3a2720' : '#f0e6d8',
    iconBg: darkMode ? '#3a2720' : '#faebd7',
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.bg, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      
      {/* Toast */}
      {toastMessage && (
        <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={[styles.toastContainer, { bottom: insets.bottom + 40 }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: currentTheme.cardBorder }]} onPress={() => router.back()}>
          <ArrowLeft size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ACCOUNT SECTION */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.cardBorder }]}>
            {/* Personal Details */}
            <TouchableOpacity style={[styles.row, { backgroundColor: currentTheme.card }]} activeOpacity={1}>
              <View style={[styles.iconBox, { backgroundColor: currentTheme.iconBg }]}>
                <User size={22} color="#db8221" />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: currentTheme.text }]}>Kitchen Staff Account</Text>
                <Text style={[styles.rowDesc, { color: currentTheme.subText }]}>Personal Details</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: currentTheme.divider }]} />

            {/* Change PIN */}
            <TouchableOpacity style={[styles.row, { backgroundColor: currentTheme.card }]} onPress={() => handlePress('Change PIN')} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: currentTheme.iconBg }]}>
                <Lock size={22} color="#db8221" />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: currentTheme.text }]}>Change PIN</Text>
                <Text style={[styles.rowDesc, { color: currentTheme.subText }]}>Update your login PIN</Text>
              </View>
              <ChevronRight size={20} color="#b89f8d" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* PREFERENCES SECTION */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.cardBorder }]}>
            {/* Order Alerts */}
            <View style={[styles.row, { backgroundColor: currentTheme.card }]}>
              <View style={[styles.iconBox, { backgroundColor: currentTheme.iconBg }]}>
                <Bell size={22} color="#db8221" />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: currentTheme.text }]}>Order Alerts</Text>
                <Text style={[styles.rowDesc, { color: currentTheme.subText }]}>Sound when order is ready</Text>
              </View>
              <Switch
                value={orderAlerts}
                onValueChange={setOrderAlerts}
                trackColor={{ false: currentTheme.cardBorder, true: '#db8221' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: currentTheme.divider }]} />

            {/* Language */}
            <TouchableOpacity style={[styles.row, { backgroundColor: currentTheme.card }]} activeOpacity={1}>
              <View style={[styles.iconBox, { backgroundColor: currentTheme.iconBg }]}>
                <Globe size={22} color="#db8221" />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: currentTheme.text }]}>Language</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.valueText}>English</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* SYSTEM SECTION */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.sectionTitle}>SYSTEM</Text>
          <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.cardBorder }]}>
            {/* Receipt Printer */}
            <TouchableOpacity style={[styles.row, { backgroundColor: currentTheme.card }]} activeOpacity={1}>
              <View style={[styles.iconBox, { backgroundColor: currentTheme.iconBg }]}>
                <Printer size={22} color="#db8221" />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: currentTheme.text }]}>Receipt Printer</Text>
                <Text style={[styles.rowDesc, { color: currentTheme.subText }]}>Connected to KITCHEN_PRINTER_1</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: currentTheme.divider }]} />

            {/* Sync Status */}
            <View style={[styles.row, { backgroundColor: currentTheme.card }]}>
              <View style={[styles.iconBox, { backgroundColor: currentTheme.iconBg }]}>
                <RefreshCw size={22} color="#db8221" />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: currentTheme.text }]}>Sync Status</Text>
              </View>
              <Text style={styles.successText}>Up to date</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: currentTheme.divider }]} />

            {/* App Version */}
            <View style={[styles.row, { backgroundColor: currentTheme.card }]}>
              <View style={[styles.iconBox, { backgroundColor: currentTheme.iconBg }]}>
                <Info size={22} color="#db8221" />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: currentTheme.text }]}>App Version</Text>
              </View>
              <Text style={styles.neutralText}>v1.0.0</Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
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
  toastContainer: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#3a2720',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 50,
  },
  toastText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  backBtn: {
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
  },
  sectionTitle: {
    fontFamily: 'LexendBold',
    fontSize: 14,
    color: '#8a7465',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#fcf8f4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0e6d8',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fcf8f4',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#faebd7', // Light orange tint
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rowContent: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#1c120f',
    marginBottom: 4,
  },
  rowDesc: {
    fontFamily: 'Lexend',
    fontSize: 13,
    color: '#8a7465',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0e6d8',
    marginLeft: 76, // Align with text
  },
  valueText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 15,
    color: '#8a7465',
  },
  successText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 15,
    color: '#10b981', // Green
  },
  neutralText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 15,
    color: '#b89f8d', // Muted grey/brown
  },
});
