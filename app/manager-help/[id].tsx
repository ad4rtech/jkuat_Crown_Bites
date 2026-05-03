import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, AlertCircle, CheckCircle2, Settings, UtensilsCrossed, Receipt, Package, Users } from 'lucide-react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const HELP_CONTENT = {
  'menu-86': {
    title: 'Menu Item 86ing',
    icon: <UtensilsCrossed size={32} color="#db8221" />,
    steps: [
      'Navigate to the "Menu" module from the sidebar dashboard.',
      'Search for the specific menu item or ingredient that is out of stock.',
      'Tap on the item and toggle its status to "Unavailable".',
      'This will instantly remove the item from the Waiter order screens to prevent further orders.',
    ],
  },
  'void-auth': {
    title: 'Void Authorizations',
    icon: <Receipt size={32} color="#db8221" />,
    steps: [
      'When a cashier or waiter requests a void, they will require your Manager PIN.',
      'Navigate to their tablet or verify the bill details on your own device.',
      'Enter your secure 4-digit PIN on the prompt to authorize the transaction.',
      'Ensure the void reason is accurately recorded in the billing log for EOD auditing.',
    ],
  },
  'inventory-audit': {
    title: 'Inventory Auditing',
    icon: <Package size={32} color="#db8221" />,
    steps: [
      'Open the "Inventory" module to view current theoretical stock levels.',
      'Perform a physical count of the stock room and cross-reference with the system numbers.',
      'If there is a variance, use the "Adjust Stock" feature and select the appropriate reason code.',
      'Approve any automated low-stock requisitions triggered by the system.',
    ],
  },
  'staff-onboarding': {
    title: 'Staff Roles & Onboarding',
    icon: <Users size={32} color="#db8221" />,
    steps: [
      'To manage staff, navigate to the "Settings" page from the main sidebar.',
      'Select the specific role you wish to modify (e.g., Waiter, Cashier).',
      'You can instantly overwrite the login PIN for that specific role group.',
      'Share the new PIN securely with the relevant staff members for immediate access.',
    ],
  },
  'eod-reports': {
    title: 'End of Day (EOD) Reports',
    icon: <Settings size={32} color="#db8221" />,
    steps: [
      'Go to the "Billing" module and select "End of Day Reconciliation".',
      'Verify that all active orders and tables have been closed or paid.',
      'Compare the physical till count provided by the cashier with the system expected totals.',
      'Print the final Z-Report and trigger the cloud sync to close out the business day.',
    ],
  },
};

export default function ManagerHelpDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const contentId = (Array.isArray(id) ? id[0] : id) as keyof typeof HELP_CONTENT;
  const content = HELP_CONTENT[contentId] || HELP_CONTENT['menu-86'];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#f4ebe1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manager Guides</Text>
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
          <Text style={styles.infoText}>These actions require high-level authorization. Proceed according to restaurant SOPs.</Text>
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
