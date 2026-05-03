import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Receipt, Printer, WifiOff, MonitorX, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const HELP_CONTENT = {
  'order-not-sending': {
    title: 'Order not sending to kitchen',
    icon: <Receipt size={32} color="#db8221" />,
    steps: [
      'Check if the tablet is connected to the restaurant Wi-Fi.',
      'Ensure the Kitchen Display System (KDS) tablet is turned on.',
      'Refresh the app by swiping down on the orders list.',
      'If the issue persists, switch to "Offline Mode" and print a physical ticket.',
    ],
  },
  'printer-offline': {
    title: 'Printer offline or out of paper',
    icon: <Printer size={32} color="#db8221" />,
    steps: [
      'Check the printer LED light. If it is blinking red, it is out of paper.',
      'Open the printer cover and insert a new thermal paper roll.',
      'Ensure the paper feeds from the bottom of the roll.',
      'Turn the printer off, wait 5 seconds, and turn it back on to reset the network connection.',
    ],
  },
  'app-offline': {
    title: 'App is offline / No connection',
    icon: <WifiOff size={32} color="#db8221" />,
    steps: [
      'Open the device Settings and verify you are on the "CrownBites_Internal" Wi-Fi network.',
      'Toggle Wi-Fi off and back on.',
      'Check if other devices (like the KDS) are also offline.',
      'If the network is completely down, inform the manager immediately.',
    ],
  },
  'screen-frozen': {
    title: 'Screen frozen or unresponsive',
    icon: <MonitorX size={32} color="#db8221" />,
    steps: [
      'Force close the application by swiping it away from the recent apps menu.',
      'Relaunch the Crown Bites ROKMS application.',
      'If the entire device is unresponsive, hold the Power button for 10 seconds to force a restart.',
    ],
  },
};

export default function HelpDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const contentId = (Array.isArray(id) ? id[0] : id) as keyof typeof HELP_CONTENT;
  const content = HELP_CONTENT[contentId] || HELP_CONTENT['order-not-sending'];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#f4ebe1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Troubleshooting</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.titleCard}>
          <View style={styles.titleIconBox}>
            {content.icon}
          </View>
          <Text style={styles.titleText}>{content.title}</Text>
        </View>

        <View style={styles.infoBox}>
          <AlertCircle size={20} color="#f59e0b" style={{ marginTop: 2 }} />
          <Text style={styles.infoText}>Follow these steps in order to resolve the issue. Do not skip any steps.</Text>
        </View>

        <Text style={styles.stepsHeading}>Resolution Steps</Text>

        <View style={styles.stepsContainer}>
          {content.steps.map((step, index) => (
            <Animated.View key={index} entering={FadeInDown.delay(index * 150).duration(400)} style={styles.stepRow}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.stepDesc}>{step}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeIn.delay(content.steps.length * 150 + 200).duration(500)}>
          <TouchableOpacity style={styles.resolvedBtn} onPress={() => router.back()}>
            <CheckCircle2 size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.resolvedBtnText}>Mark as Resolved</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c120f', // Very dark brown background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#2a1a14',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'LexendBold',
    fontSize: 20,
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  titleCard: {
    alignItems: 'center',
    backgroundColor: '#251713',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#3a2720',
    marginBottom: 24,
  },
  titleIconBox: {
    width: 64,
    height: 64,
    backgroundColor: '#2e1d16',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontFamily: 'LexendBold',
    fontSize: 22,
    color: '#ffffff',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    alignItems: 'flex-start',
  },
  infoText: {
    fontFamily: 'Lexend',
    fontSize: 14,
    color: '#b45309',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  stepsHeading: {
    fontFamily: 'LexendBold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 16,
  },
  stepsContainer: {
    backgroundColor: '#251713',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a2720',
    marginBottom: 32,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 24,
    paddingRight: 16,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3a2720',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumber: {
    fontFamily: 'LexendBold',
    fontSize: 14,
    color: '#db8221',
  },
  stepDesc: {
    fontFamily: 'Lexend',
    fontSize: 15,
    color: '#e5e5e5',
    lineHeight: 24,
    flex: 1,
    marginTop: 2,
  },
  resolvedBtn: {
    flexDirection: 'row',
    backgroundColor: '#10b981', // Green for success/resolved
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  resolvedBtnText: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#ffffff',
  },
});
