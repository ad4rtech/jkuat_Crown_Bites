import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, AlertCircle, CheckCircle2, Receipt, SplitSquareHorizontal, Banknote, History, WifiOff } from 'lucide-react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const HELP_CONTENT = {
  'voids-discounts': {
    title: 'Voids & Discounts',
    icon: <Receipt size={32} color="#db8221" />,
    steps: [
      'Navigate to the active bill that requires a modification.',
      'Tap on the specific item to apply a void or discount.',
      'Select the reason from the preset list or enter a custom reason.',
      'If the amount exceeds your authorization limit, a Manager PIN will be required to approve the transaction.',
    ],
  },
  'split-bills': {
    title: 'Splitting Bills',
    icon: <SplitSquareHorizontal size={32} color="#db8221" />,
    steps: [
      'Open the table\'s bill and tap the "Split Bill" option at the bottom.',
      'Choose to split either evenly by number of guests, or by specific items.',
      'If splitting by items, drag and drop the items into separate guest tabs.',
      'Process payment for each tab individually as they are ready.',
    ],
  },
  'refunds': {
    title: 'Processing Refunds',
    icon: <Banknote size={32} color="#db8221" />,
    steps: [
      'Go to the "Receipts" tab and locate the completed transaction.',
      'Tap "Issue Refund" and select whether it is a partial or full refund.',
      'For M-Pesa or Card payments, ensure the terminal is connected to process the reversal.',
      'All refunds require a Manager PIN to finalize.',
    ],
  },
  'drawer-reconciliation': {
    title: 'Drawer Reconciliation',
    icon: <History size={32} color="#db8221" />,
    steps: [
      'At the end of your shift, navigate to the "Reports" tab and select "End Shift".',
      'Count the physical cash in the drawer and enter the total into the system.',
      'The system will compare your entered amount against the expected cash sales.',
      'Print the Z-Report and place it with the cash drops in the safe.',
    ],
  },
  'offline-payments': {
    title: 'Offline Payments',
    icon: <WifiOff size={32} color="#db8221" />,
    steps: [
      'If the network goes down, you must switch to manual card processing or cash only.',
      'For manual M-Pesa, verify the transaction message on the official restaurant phone before marking as paid.',
      'Record all offline transactions on the physical ledger as a backup.',
      'Once the network is restored, ensure all offline transactions sync to the cloud.',
    ],
  },
};

export default function CashierHelpDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const contentId = (Array.isArray(id) ? id[0] : id) as keyof typeof HELP_CONTENT;
  const content = HELP_CONTENT[contentId] || HELP_CONTENT['voids-discounts'];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#f4ebe1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cashier Guides</Text>
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
          <Text style={styles.infoText}>Follow standard cashier operating procedures. Ensure accuracy with all financial transactions.</Text>
        </View>

        <Text style={styles.stepsHeading}>Protocol Details</Text>

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
            <Text style={styles.resolvedBtnText}>I understand</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c120f' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 24 },
  backBtn: { width: 44, height: 44, backgroundColor: '#2a1a14', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'LexendBold', fontSize: 20, color: '#ffffff' },
  scrollContent: { paddingHorizontal: 20 },
  titleCard: { alignItems: 'center', backgroundColor: '#251713', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#3a2720', marginBottom: 24 },
  titleIconBox: { width: 64, height: 64, backgroundColor: '#2e1d16', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  titleText: { fontFamily: 'LexendBold', fontSize: 22, color: '#ffffff', textAlign: 'center' },
  infoBox: { flexDirection: 'row', backgroundColor: '#fef3c7', padding: 16, borderRadius: 12, marginBottom: 32, alignItems: 'flex-start' },
  infoText: { fontFamily: 'Lexend', fontSize: 14, color: '#b45309', marginLeft: 12, flex: 1, lineHeight: 20 },
  stepsHeading: { fontFamily: 'LexendBold', fontSize: 18, color: '#ffffff', marginBottom: 16 },
  stepsContainer: { backgroundColor: '#251713', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#3a2720', marginBottom: 32 },
  stepRow: { flexDirection: 'row', marginBottom: 24, paddingRight: 16 },
  stepNumberCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#3a2720', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  stepNumber: { fontFamily: 'LexendBold', fontSize: 14, color: '#db8221' },
  stepDesc: { fontFamily: 'Lexend', fontSize: 15, color: '#e5e5e5', lineHeight: 24, flex: 1, marginTop: 2 },
  resolvedBtn: { flexDirection: 'row', backgroundColor: '#10b981', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  resolvedBtnText: { fontFamily: 'LexendBold', fontSize: 16, color: '#ffffff' },
});
